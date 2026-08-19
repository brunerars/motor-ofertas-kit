#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Aplica a formula de preco da Nippon Speed sobre as pecas ja coletadas.

The whole point is auditability: every step of the arithmetic is written to
disk, so a wrong final price can be traced to the step that produced it.
No number here comes from a model.

Formula (CALCULADORA 35%, do Caio):
    taxa_naomi = produto x 0,35
    soma       = produto + taxa_naomi + frete_jp
    preco_jpy  = soma + margem (por ocupacao de espaco)
    preco_brl  = quanto enviar de BRL pra chegar preco_jpy no Japao (Wise)

Usage:  python precificar.py [<id> ...]      (sem id = todas as pecas)
Reads:  curadoria/pecas/<id>/dados.json  +  curadoria/volumes.json
Writes: curadoria/pecas/<id>/preco.json
"""
import json
import math
import os
import sys
import time
import urllib.request

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
VOLUMES = os.path.join(BASE, "volumes.json")

# --- parametros da formula (a fronteira humana; mudar aqui, nao no codigo) ---
TAXA_NAOMI = 0.35          # sobre o valor do produto
FRETE_JP_JPY = 1000        # frete domestico japones, fixo (fechado pelo Bruno em 18/08)
MARGENS_JPY = {            # margem por ocupacao de espaco na mala
    "P": 3000,             # envelope: chaveiro, pin, patch, adesivo
    "M": 4000,             # pacote pequeno: bone, camiseta, camisa
    "G": 6000,             # pacote medio: jaqueta leve, moletom, mochila
    "GG": 10000,           # volumoso: jaqueta pesada, macacao, capacete
}
CLASSE_PADRAO = "M"        # fallback quando a peca nao foi classificada
ARREDONDA_PARA = 10        # dezena de reais, sempre pra cima

WISE_URL = (
    "https://api.wise.com/v3/comparisons"
    "?sourceCurrency=BRL&targetCurrency=JPY&sendAmount=%s"
)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"}


def wise_quote(send_brl):
    """One point of the Wise send-money curve: fee, rate, received."""
    req = urllib.request.Request(WISE_URL % send_brl, headers=UA)
    with urllib.request.urlopen(req, timeout=45) as r:
        dados = json.loads(r.read().decode("utf-8"))
    for prov in dados.get("providers") or []:
        if prov.get("alias") == "wise":
            q = prov["quotes"][0]
            return float(q["fee"]), float(q["rate"]), float(q["receivedAmount"])
    raise SystemExit("provider 'wise' ausente na resposta da comparacao")


def calibrar_wise():
    """Wise's fee is linear in the amount sent: fee = a + b * send.

    Two points pin the line down. Verified against a third point on
    2026-08-18 (500/2000/5000 BRL) with 2 cents of error. Inverting
    received = (send - fee) * rate gives the send needed for a target.
    """
    fee1, rate, recv1 = wise_quote(300)
    fee2, rate2, recv2 = wise_quote(3000)
    if abs(rate - rate2) > 1e-6:
        rate = (rate + rate2) / 2.0  # rate moved mid-calibration; average it
    b = (fee2 - fee1) / (3000 - 300)
    a = fee1 - 300 * b
    # sanity: the model must reproduce the two quotes it was built from
    for send, recv in ((300, recv1), (3000, recv2)):
        previsto = (send - (a + b * send)) * rate
        if abs(previsto - recv) > 5:
            raise SystemExit(
                "calibracao Wise inconsistente: previu %.0f, cotacao deu %.0f"
                % (previsto, recv)
            )
    return {
        "a": round(a, 4),
        "b": round(b, 6),
        "rate": rate,
        "conferido_em": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "fonte": "api.wise.com/v3/comparisons (provider=wise)",
    }


def brl_para(jpy, cal):
    """How much BRL to send so that `jpy` lands in Japan."""
    bruto = (jpy / cal["rate"] + cal["a"]) / (1 - cal["b"])
    return bruto


def arredonda(brl):
    return float(math.ceil(brl / ARREDONDA_PARA) * ARREDONDA_PARA)


def carregar_volumes():
    if not os.path.exists(VOLUMES):
        return {}
    with open(VOLUMES, encoding="utf-8") as fh:
        return json.load(fh)


def calcula(produto_jpy, classe, cal):
    """A formula, isolada de onde o dado veio.

    Extracted so the cheap funnel can price a SEARCH CARD -- which has a title and
    a price and nothing else -- with the exact same arithmetic that prices a fully
    scraped piece. Two prices that come from different code paths would diverge
    silently, and the funnel would be arguing with the pipeline it feeds.

    Devolve (conta, bruto_brl, final_brl). A ordem dos campos da conta e a mesma
    de sempre: mexer aqui muda preco.json, e o diff tem que ser vazio.
    """
    produto = float(produto_jpy)
    taxa = round(produto * TAXA_NAOMI)
    soma = produto + taxa + FRETE_JP_JPY
    margem = MARGENS_JPY[classe]
    preco_jpy = soma + margem
    bruto = brl_para(preco_jpy, cal)
    conta = {
        "produto_jpy": produto,
        "taxa_naomi_jpy": taxa,
        "taxa_naomi_pct": TAXA_NAOMI,
        "frete_jp_jpy": FRETE_JP_JPY,
        "soma_jpy": soma,
        "classe_volume": classe,
        "margem_jpy": margem,
        "preco_jpy": preco_jpy,
    }
    return conta, bruto, arredonda(bruto)


def precificar(item_id, volumes, cal):
    destino = os.path.join(PECAS, item_id)
    caminho = os.path.join(destino, "dados.json")
    if not os.path.exists(caminho):
        return None, "sem dados.json"
    with open(caminho, encoding="utf-8") as fh:
        dados = json.load(fh)

    produto = dados.get("price_jpy")
    if not produto:
        return None, "price_jpy vazio"
    produto = float(produto)

    entrada = volumes.get(item_id) or {}
    classe = entrada.get("classe") or CLASSE_PADRAO
    if classe not in MARGENS_JPY:
        return None, "classe de volume invalida: %s" % classe

    base_conta, bruto, final = calcula(produto, classe, cal)
    # remontada na ordem original de proposito: preco.json ja esta versionado, e
    # trocar a ordem das chaves produziria diff sem trocar um so numero.
    conta = {
        "produto_jpy": base_conta["produto_jpy"],
        "taxa_naomi_jpy": base_conta["taxa_naomi_jpy"],
        "taxa_naomi_pct": base_conta["taxa_naomi_pct"],
        "frete_jp_jpy": base_conta["frete_jp_jpy"],
        "soma_jpy": base_conta["soma_jpy"],
        "classe_volume": base_conta["classe_volume"],
        "classe_justificativa": entrada.get("porque", "(nao classificada)"),
        "classe_e_fallback": item_id not in volumes,
        "margem_jpy": base_conta["margem_jpy"],
        "preco_jpy": base_conta["preco_jpy"],
    }

    preco = {
        "id": item_id,
        "source_url": dados.get("source_url"),
        "vendido": bool(dados.get("sold")),
        "conta": conta,
        "conversao": cal,
        "preco_brl_bruto": round(bruto, 2),
        "preco_brl": final,
        "calculado_em": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    with open(os.path.join(destino, "preco.json"), "w", encoding="utf-8") as fh:
        json.dump(preco, fh, ensure_ascii=False, indent=2)
    return preco, None


def main():
    alvos = sys.argv[1:]
    if not alvos:
        alvos = sorted(
            d for d in os.listdir(PECAS)
            if os.path.isdir(os.path.join(PECAS, d))
        )
    volumes = carregar_volumes()
    if not volumes:
        print("AVISO: volumes.json ausente - todas caem no fallback '%s'"
              % CLASSE_PADRAO)
    cal = calibrar_wise()
    print("Wise: 1 BRL = %.3f JPY | fee = %.2f + %.4f x envio (%s)\n"
          % (cal["rate"], cal["a"], cal["b"], cal["conferido_em"]))

    print("%-16s %9s %9s %9s %3s %8s %10s %10s"
          % ("id", "produto", "taxa", "soma", "cl", "margem", "preco JPY", "R$"))
    fallback = []
    for item_id in alvos:
        preco, erro = precificar(item_id, volumes, cal)
        if erro:
            print("%-16s  -- %s" % (item_id, erro))
            continue
        c = preco["conta"]
        print("%-16s %9.0f %9.0f %9.0f %3s %8d %10.0f %10.2f"
              % (item_id, c["produto_jpy"], c["taxa_naomi_jpy"], c["soma_jpy"],
                 c["classe_volume"], c["margem_jpy"], c["preco_jpy"],
                 preco["preco_brl"]))
        if c["classe_e_fallback"]:
            fallback.append(item_id)

    if fallback:
        print("\n%d peca(s) sem classe de volume (usaram '%s'): %s"
              % (len(fallback), CLASSE_PADRAO, ", ".join(fallback)))


if __name__ == "__main__":
    main()
