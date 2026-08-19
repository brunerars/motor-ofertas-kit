#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""O filtro barato: transforma cards de busca numa FILA pro humano.

A pergunta que este script responde e "da pra descartar isto sem gastar
pericia?" -- nunca "isto e bom?". Por isso ele SO DESCARTA, jamais promove, e
tudo que sobra vai pra fila com o motivo escrito.

Isso nao e escrupulo de estilo, e a defesa contra o unico modo de falha que
importa aqui: a regra travada da NSC diz que a IA nunca escolhe produto. Um
filtro que ranqueasse por desejabilidade estaria escolhendo pela porta dos
fundos. Um filtro que so descarta, e que grava CADA descarte com o motivo e o
trecho de titulo que o disparou, continua sendo o humano escolhendo.

Duas separacoes que nao podem vazar:
  - `hipoteses` vem de TITULO. Titulo de Mercari e SEO: a peca m35956987972 tem
    "Senna" no titulo e nenhum vinculo com ele. Nada daqui vira fato.
  - `fatos_usados` sao ids de base/fatos.json, que passaram por busca confirmada.

E o que NAO descarta, de proposito:
  - contradicao de datacao e FLAG, nunca descarte. A Ferrari m71164960236 com
    (c)1997 errado e um ACHADO de valor, nao lixo. Descartar contradicao jogaria
    fora exatamente o que a curadoria procura.
  - titulo sem ancora nenhuma vai pro fim da fila, nao pro lixo.

Usage:
  python fila.py                    varre varredura/*/*/cards.json
Reads:  base/fatos.json - base/aliases.json - tipos-peca.json - buscas.json
Writes: varredura/fila.json - varredura/descartados.json
"""
import json
import os
import sys
import time
import importlib.util

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
VARRED = os.path.join(BASE, "varredura")


def _mod(nome, arquivo):
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), arquivo)
    esp = importlib.util.spec_from_file_location(nome, caminho)
    m = importlib.util.module_from_spec(esp)
    esp.loader.exec_module(m)
    return m


CS = _mod("cs", "consultar.py")
PR = _mod("pr", "precificar.py")

# Piloto no titulo ao lado de equipe que a base NAO liga a ele. Nao descarta:
# levanta a mao. A primeira versao contava entidades empilhadas (>=4) e errava
# nos dois sentidos: acusava a McLaren-Honda legitima e deixava passar a Yamaha
# que vende Senna. Perguntar a base a quem o piloto esta ligado acerta as tres
# problematicas do lote, incluindo as duas falsificacoes conhecidas.
PILOTOS = ("Ayrton Senna", "Michael Schumacher", "Nelson Piquet", "Gerhard Berger")
JANELA_UTIL = 12          # temporadas; acima disso a datacao nao restringe nada
ANO_MIN, ANO_MAX = CS.ANO_MIN, CS.ANO_MAX


def ler(caminho, padrao=None):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def tipo_de(titulo, termos):
    """Primeiro termo que casar vence -- a lista ja vem do mais especifico."""
    baixo = titulo.lower()
    for t in termos:
        if t["termo"] in titulo or t["termo"].lower() in baixo:
            return t["tipo"], t["classe"], t["termo"]
    return None, PR.CLASSE_PADRAO, None


def datar(ents, fatos):
    """Intersecao entre relacoes diferentes, uniao dentro da mesma (ver consultar.py)."""
    usados = []
    for termo in ents:
        casados = [f for f in fatos if CS.casa(f, termo)
                   and f.get("tipo") in CS.TIPOS_DATAM and CS.janela(f)]
        if casados:
            usados.append(CS.uniao([CS.janela(f) for f in casados]))
    if not usados:
        return None
    atual = [(ANO_MIN, ANO_MAX)]
    for u in usados:
        atual = CS.intersecta(atual, u)
    return atual if atual else "CONTRADICAO"


def largura(janela):
    return sum(b - a + 1 for a, b in janela)


def equipes_do_piloto(piloto, fatos):
    """A quem a base liga este piloto, pelos fatos do tipo piloto_equipe.

    Read in both directions on purpose: the fact may carry the driver as entidade
    or as contraparte, and which side he landed on is an accident of extraction.
    """
    saida = set()
    for f in fatos:
        if f.get("tipo") != "piloto_equipe":
            continue
        a, b = f.get("entidade"), f.get("contraparte")
        if a == piloto and b:
            saida.add(b)
        elif b == piloto and a:
            saida.add(a)
    return saida


def cotacao_gravada():
    """Reusa a calibracao Wise ja gravada, em vez de bater na rede.

    Deliberate: the funnel has to be reproducible. Calibrating live would make two
    runs over the same cards disagree on price, and idempotence is the property
    that lets anyone delete the output and regenerate it identically.
    """
    melhor = None
    if os.path.isdir(PECAS):
        for d in sorted(os.listdir(PECAS)):
            p = ler(os.path.join(PECAS, d, "preco.json"))
            if p and p.get("conversao"):
                melhor = p["conversao"]
    return melhor


def contexto(cal=None, checar_ja_visto=True):
    fatos = (ler(os.path.join(BASE, "base", "fatos.json")) or {}).get("fatos") or []
    aliases = (ler(os.path.join(BASE, "base", "aliases.json")) or {}).get("aliases") or []
    termos = (ler(os.path.join(BASE, "tipos-peca.json")) or {}).get("termos") or []
    buscas = ler(os.path.join(BASE, "buscas.json")) or {}
    vistos = set()
    if checar_ja_visto and os.path.isdir(PECAS):
        vistos = {d for d in os.listdir(PECAS) if d.startswith("m")}
    return {"fatos": fatos, "aliases": aliases, "termos": termos,
            "teto_brl": buscas.get("teto_brl"), "vistos": vistos,
            "cal": cal if cal is not None else cotacao_gravada()}


def avalia(card, ctx):
    """Um card -> (linha da fila, None) ou (None, descarte com motivo)."""
    tit = card.get("titulo_ja") or ""
    out = {
        "id": card.get("id"),
        "url": card.get("url"),
        "titulo_ja": tit,
        "preco_jpy": card.get("preco_jpy"),
        "busca": card.get("busca"),
        "hipoteses": {},
        "fatos_usados": [],
        "flags": [],
    }

    if card.get("id") in ctx["vistos"]:
        return None, {"id": card.get("id"), "motivo": "ja_visto",
                      "detalhe": "ja existe em curadoria/pecas/", "titulo_ja": tit}

    tipo, classe, termo = tipo_de(tit, ctx["termos"])
    out["hipoteses"]["tipo"] = {"valor": tipo, "classe_volume": classe,
                                "origem": "titulo", "texto_origem": termo,
                                "estimada": True}

    if card.get("preco_jpy") and ctx["cal"]:
        conta, bruto, final = PR.calcula(card["preco_jpy"], classe, ctx["cal"])
        out["preco_brl_estimado"] = final
        out["conta"] = conta
        out["preco_e_estimado_porque"] = "a classe de volume saiu do titulo, nao de medida"
        if ctx["teto_brl"] and final > ctx["teto_brl"]:
            return None, {"id": card.get("id"), "motivo": "acima_do_teto",
                          "detalhe": "R$ %s acima do teto R$ %s" % (final, ctx["teto_brl"]),
                          "conta": conta, "titulo_ja": tit}

    ents = CS.entidades_do_texto(tit, ctx["fatos"], ctx["aliases"])
    out["hipoteses"]["entidades"] = {"valores": ents, "origem": "titulo",
                                     "e_hipotese": True}

    jan = datar(ents, ctx["fatos"])
    if jan == "CONTRADICAO":
        # ACHADO, nao lixo: e o caso da Ferrari com (c)1997 errado
        out["flags"].append("contradicao_de_datacao")
        out["datacao"] = None
    elif jan:
        out["datacao"] = {"janela": CS.fmt(jan), "temporadas": largura(jan),
                          "confianca": "hipotese_de_titulo"}
        if largura(jan) <= JANELA_UTIL:
            out["flags"].append("datavel")
        out["fatos_usados"] = sorted({f["id"] for f in ctx["fatos"] for t in ents
                                      if CS.casa(f, t) and f.get("tipo") in CS.TIPOS_DATAM})
    else:
        out["datacao"] = None

    pilotos = [p for p in PILOTOS if p in ents]
    if pilotos:
        permitidas = set()
        for pil in pilotos:
            permitidas |= equipes_do_piloto(pil, ctx["fatos"])
        orfas = [e for e in ents if e not in PILOTOS and e not in permitidas]
        if orfas:
            out["flags"].append("piloto_sem_vinculo")
            out["hipoteses"]["por_que_suspeita"] = (
                "o titulo poe %s ao lado de %s, e a base nao liga o piloto a essa(s) "
                "entidade(s). Foi assim que a m97283893856 vendeu Senna numa Yamaha. "
                "E hipotese de titulo: pode ser so vinculo que a base ainda nao tem."
                % (", ".join(pilotos), ", ".join(orfas)))
    if not ents:
        out["flags"].append("sem_ancora")
    return out, None


def ordena(linhas):
    """Lexicografica sobre FLAGS, nunca sobre numero agregado.

    A single number here would be exactly the forbidden aggregate score wearing
    a hat, and valida-varredura.py rejects it.
    """
    def chave(x):
        f = x.get("flags") or []
        return (0 if "contradicao_de_datacao" in f else 1,
                (x.get("datacao") or {}).get("temporadas", 9999),
                0 if "datavel" in f else 1,
                1 if "sem_ancora" in f else 0,
                x.get("id") or "")
    return sorted(linhas, key=chave)


def carrega_cards():
    cards = []
    if os.path.isdir(VARRED):
        for raiz, _, arqs in os.walk(VARRED):
            if "cards.json" in arqs:
                d = ler(os.path.join(raiz, "cards.json")) or {}
                cards += d.get("cards") or []
    return cards


def main():
    ctx = contexto()
    cards = carrega_cards()
    if not cards:
        print("nenhum card em %s (rode varrer.py antes)" % VARRED)
        return 1

    fila, fora = [], []
    for c in cards:
        linha, descarte = avalia(c, ctx)
        (fila if linha else fora).append(linha or descarte)
    fila = ordena(fila)

    os.makedirs(VARRED, exist_ok=True)
    cab = {
        "_o_que_isto_nao_e": (
            "Nao e recomendacao de compra e nao e ranking de qualidade. E o que sobrou "
            "depois de descartar o que a base descarta sozinha, ordenado por flags. "
            "Titulo de Mercari e SEO: toda entidade daqui e HIPOTESE. A pericia e a "
            "decisao continuam humanas."),
        "_gerado_em": time.strftime("%Y-%m-%d"),
        "_total": len(fila),
    }
    with open(os.path.join(VARRED, "fila.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(cab, fila=fila), fh, ensure_ascii=False, indent=2)
    with open(os.path.join(VARRED, "descartados.json"), "w", encoding="utf-8") as fh:
        json.dump({"_nota": ("Descartar e escolher. Filtro que nao se audita E a IA "
                             "escolhendo produto. Cada linha traz o motivo e o titulo."),
                   "_total": len(fora), "descartados": fora},
                  fh, ensure_ascii=False, indent=2)
    print("cards: %d | fila: %d | descartados: %d" % (len(cards), len(fila), len(fora)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
