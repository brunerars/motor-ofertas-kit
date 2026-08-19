#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Os vendidos do Mercari, agrupados em baldes de comparavel.

O METODO.md se proibia de dar faixa de preco de mercado porque "exigiria base de
comparaveis que nao existe no vault". Ela passou a existir -- mas de anuncios de
TERCEIROS no mercado onde COMPRAMOS (Japao), nao das nossas vendas no mercado
onde vendemos (Brasil, WhatsApp). Sao coisas diferentes e a saida diz isso.

O que este script pode afirmar:
    "N anuncios com esta chave sairam do Mercari, anunciados de X a Y (mediana Z)"
    -- com os ids que produziram cada numero anexados.
O que ele NAO pode:
    dizer que uma peca vale Z, publicar faixa como preco-alvo, ou justificar
    preco ao cliente com isto.

Abaixo de N_MINIMO, o balde devolve `sem base` em vez de numero. Um comparavel
com n=2 e uma anedota com aparencia de estatistica, e a disciplina aqui e a
mesma que o eixo de raridade ja segue.

A chave inteira e HIPOTESE: sai de titulo, que e SEO do vendedor. Isso vai
escrito em toda linha, nao no rodape.

Usage:  python comparaveis.py
Reads:  varredura/fila.json - base/fatos.json
Writes: varredura/comparaveis.json
"""
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VARRED = os.path.join(BASE, "varredura")

N_MINIMO = 5              # abaixo disso o balde nao fala
JANELA_MAX = 8            # temporadas; janela mais larga que isso nao agrupa nada


def ler(caminho, padrao=None):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def equipes_conhecidas(fatos):
    """Quem a base trata como EQUIPE: a contraparte de patrocinio, motor, pneu e piloto.

    Derived instead of hand-listed so the vocabulary cannot drift away from the
    base it is supposed to describe.
    """
    saida, pilotos = set(), set()
    for f in fatos:
        if f.get("tipo") == "piloto_equipe":
            # o piloto e a ponta que NAO e equipe; qual lado ele caiu e acidente
            # da extracao, entao os dois lados sao olhados
            for a, b in ((f.get("entidade"), f.get("contraparte")),
                         (f.get("contraparte"), f.get("entidade"))):
                if a and b and " " in (a or ""):
                    pilotos.add(a)
    for f in fatos:
        if f.get("tipo") in ("patrocinio", "motor", "pneu", "piloto_equipe", "licenciado"):
            c = f.get("contraparte")
            if c:
                saida.add(c)
    # Banco Nacional patrocinou o Ayrton Senna, entao ele entrava como "equipe" e
    # abria um balde de uma peca so. Piloto nao e equipe.
    return saida - pilotos


def percentil(ordenados, p):
    """Percentil por posicao, sem interpolar.

    No interpolation on purpose: an interpolated price is a number no listing
    ever carried, and every number here has to be traceable to an id.
    """
    if not ordenados:
        return None
    i = int(round((len(ordenados) - 1) * p))
    return ordenados[max(0, min(i, len(ordenados) - 1))]


def chave_de(linha, equipes):
    ents = ((linha.get("hipoteses") or {}).get("entidades") or {}).get("valores") or []
    equipe = next((e for e in ents if e in equipes), None)
    tipo = ((linha.get("hipoteses") or {}).get("tipo") or {}).get("valor")
    dat = linha.get("datacao") or {}
    janela = dat.get("janela") if (dat.get("temporadas") or 999) <= JANELA_MAX else None
    if not equipe or not tipo:
        return None
    return (equipe, janela or "indefinida", tipo)


def main():
    fila = (ler(os.path.join(VARRED, "fila.json")) or {}).get("fila") or []
    fatos = (ler(os.path.join(BASE, "base", "fatos.json")) or {}).get("fatos") or []
    if not fila:
        print("fila.json vazio (rode varrer.py e fila.py antes)")
        return 1
    equipes = equipes_conhecidas(fatos)

    vendidos = [x for x in fila if x.get("vendido") and x.get("preco_jpy")]
    baldes = {}
    sem_chave = 0
    for x in vendidos:
        k = chave_de(x, equipes)
        if not k:
            sem_chave += 1
            continue
        baldes.setdefault(k, []).append(x)

    saida = []
    for (equipe, janela, tipo), itens in sorted(baldes.items(), key=lambda kv: -len(kv[1])):
        precos = sorted(int(i["preco_jpy"]) for i in itens)
        linha = {
            "chave": {"equipe": equipe, "janela": janela, "tipo": tipo},
            "chave_origem": "titulo",
            "chave_confianca": "hipotese",
            "n": len(itens),
            "ids": [i["id"] for i in itens],
        }
        if len(itens) >= N_MINIMO:
            linha["anunciado_quando_saiu_jpy"] = {
                "min": precos[0], "p25": percentil(precos, 0.25),
                "mediana": percentil(precos, 0.5), "p75": percentil(precos, 0.75),
                "max": precos[-1],
            }
        else:
            linha["sem_base"] = ("n=%d abaixo do minimo de %d: com esta amostra o numero "
                                 "seria anedota com cara de estatistica" % (len(itens), N_MINIMO))
        saida.append(linha)

    com_base = [b for b in saida if "anunciado_quando_saiu_jpy" in b]
    doc = {
        "_o_que_isto_e": (
            "Contagem de anuncios OBSERVADOS que sairam do Mercari, agrupados por chave "
            "equipe x janela x tipo. Cada numero vem com os ids que o produziram."),
        "_o_que_isto_nao_e": (
            "Nao e quanto a peca vale, nao e preco-alvo, e nao serve pra justificar preco "
            "ao cliente: o comparavel e do mercado onde COMPRAMOS (Japao), nao daquele "
            "onde vendemos (Brasil). A chave sai de titulo e e HIPOTESE."),
        "_ressalva_do_selo": (
            "'Saiu do Mercari' inclui cancelamento e retirada, nao so venda. E a mesma "
            "limitacao do campo sold do nosso Baserow, e ela nao melhora por estar aqui."),
        "_preco_e_o_do_anuncio": (
            "O preco e o que estava anunciado quando o item saiu. Sem serie historica nao "
            "da pra saber se houve reducao antes -- uma varredura recorrente resolve, e e "
            "por isso que cada rodada grava num arquivo com data propria."),
        "_n_minimo": N_MINIMO,
        "_total_vendidos_lidos": len(vendidos),
        "_sem_chave": sem_chave,
        "_baldes": len(saida),
        "_baldes_com_base": len(com_base),
        "baldes": saida,
    }
    with open(os.path.join(VARRED, "comparaveis.json"), "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)

    print("vendidos lidos: %d | sem chave: %d | baldes: %d | com n>=%d: %d"
          % (len(vendidos), sem_chave, len(saida), N_MINIMO, len(com_base)))
    print()
    print("%-14s %-12s %-16s %-4s %s" % ("equipe", "janela", "tipo", "n", "anunciado (JPY)"))
    print("-" * 84)
    for b in saida[:14]:
        c, f = b["chave"], b.get("anunciado_quando_saiu_jpy")
        print("%-14s %-12s %-16s %-4d %s"
              % (c["equipe"][:14], c["janela"][:12], (c["tipo"] or "-")[:16], b["n"],
                 ("%d - %d, mediana %d" % (f["min"], f["max"], f["mediana"])) if f else "sem base"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
