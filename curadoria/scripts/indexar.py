#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Monta o index.json da rodada: uma linha por peca, pra ler em um minuto.

Derived, never hand-maintained: delete index.json, run this, get the same file.
The per-piece JSONs are the truth; this is the reading surface over them.

Usage:  python indexar.py
Reads:  curadoria/pecas/<id>/{dados,traducao,preco,parecer}.json
Writes: curadoria/index.json
"""
import json
import os
import time

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
SAIDA = os.path.join(BASE, "index.json")

BLOQUEIA = "nao_publicar_assim"


def ler(caminho):
    if not os.path.exists(caminho):
        return None
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def linha(item_id):
    d = os.path.join(PECAS, item_id)
    parecer = ler(os.path.join(d, "parecer.json"))
    if not parecer:
        return None  # peca sem parecer nao entra (as 5 da Etapa 1 vivem no pareceres.json)
    dados = ler(os.path.join(d, "dados.json")) or {}
    trad = ler(os.path.join(d, "traducao.json")) or {}
    preco = ler(os.path.join(d, "preco.json")) or {}

    sinais = parecer.get("sinais") or []
    por_classe = {}
    for s in sinais:
        por_classe[s["classe"]] = por_classe.get(s["classe"], 0) + 1

    bloqueios = [s for s in sinais if s.get("severidade") == BLOQUEIA]
    achados = [s for s in sinais
               if s.get("classe") == "VALOR" and s.get("severidade") == "achado_principal"]

    if bloqueios:
        flag = "corrigir_antes_de_publicar"
    elif achados:
        flag = "achado_de_valor"
    else:
        flag = "ok"

    # a checagem externa e o que separa esta rodada da anterior: contabilizar
    checagens = [s.get("checagem_externa") or {} for s in sinais]
    feitas = [c for c in checagens if c.get("feita")]

    return {
        "id": item_id,
        "source_url": dados.get("source_url"),
        "title_pt": trad.get("title_pt"),
        "vendido": bool(dados.get("sold")),
        "preco_jpy_anuncio": dados.get("price_jpy"),
        "classe_volume": (preco.get("conta") or {}).get("classe_volume"),
        "preco_brl": preco.get("preco_brl"),
        "flag": flag,
        "sinais_por_classe": por_classe,
        "bloqueios": [s["afirmacao"][:150] for s in bloqueios],
        "achados_de_valor": [s["afirmacao"][:150] for s in achados],
        "checagem_externa": {
            "sinais": len(sinais),
            "com_busca": len(feitas),
            "confirma": len([c for c in feitas if c.get("resultado") == "confirma"]),
            "refuta": len([c for c in feitas if c.get("resultado") == "refuta"]),
            "nao_achei": len([c for c in feitas if c.get("resultado") == "nao_achei"]),
        },
        "incertezas": len(parecer.get("o_que_nao_sei") or []),
        "controle_negativo": "_controle_negativo" in parecer,
    }


def main():
    linhas = []
    for item_id in sorted(os.listdir(PECAS)):
        if not os.path.isdir(os.path.join(PECAS, item_id)):
            continue
        entrada = linha(item_id)
        if entrada:
            linhas.append(entrada)

    ordem = {"corrigir_antes_de_publicar": 0, "achado_de_valor": 1, "ok": 2}
    linhas.sort(key=lambda x: (ordem.get(x["flag"], 9), x["id"]))

    resumo = {}
    for x in linhas:
        resumo[x["flag"]] = resumo.get(x["flag"], 0) + 1

    saida = {
        "_schema": "Indice da rodada de curadoria. DERIVADO: apagar e rodar indexar.py devolve igual. "
                   "A verdade de cada peca esta em pecas/<id>/. Sem nota agregada — ver METODO.md.",
        "_rodada": "etapa-2",
        "_gerado_em": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "_resumo": resumo,
        "_total": len(linhas),
        "pecas": linhas,
    }
    with open(SAIDA, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, indent=2)

    print("%d pecas indexadas em %s" % (len(linhas), SAIDA))
    for flag, n in sorted(resumo.items()):
        print("  %-30s %d" % (flag, n))


if __name__ == "__main__":
    main()
