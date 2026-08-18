#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Gate mecanico dos pareceres de curadoria (a regra de saida do METODO.md).

Exists because the rules that keep a parecer honest are exactly the ones that
erode quietly: a signal shipped without evidence still reads fine. Cheap to
check, so check every time.

Regras conferidas:
  1. todo sinal tem 'classe' valida, 'afirmacao', 'evidencia' e 'fonte'
  2. 'o_que_nao_sei' existe e nao esta vazio
  3. nenhuma nota agregada em lugar nenhum (o METODO.md proibe)

Usage:  python valida.py          -> confere todos os parecer.json
Exit:   0 tudo limpo | 1 alguma violacao
"""
import json
import os
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")

CLASSES = {"CORRECAO", "ATRIBUICAO", "VALOR", "CONFIRMACAO"}
# any of these keys anywhere in a parecer means an aggregate score crept back in
PROIBIDAS = {"nota", "score", "nota_autenticidade", "nota_raridade",
             "autenticidade", "pontuacao", "rating"}


def chaves_proibidas(obj, caminho=""):
    achadas = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.lower() in PROIBIDAS:
                achadas.append("%s.%s" % (caminho, k) if caminho else k)
            achadas += chaves_proibidas(v, "%s.%s" % (caminho, k) if caminho else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            achadas += chaves_proibidas(v, "%s[%d]" % (caminho, i))
    return achadas


def confere(item_id, parecer):
    erros = []
    sinais = parecer.get("sinais")
    if not sinais:
        erros.append("sem sinais")
    for i, s in enumerate(sinais or []):
        rot = "sinal[%d]" % i
        if s.get("classe") not in CLASSES:
            erros.append("%s: classe invalida (%s)" % (rot, s.get("classe")))
        for campo in ("afirmacao", "evidencia", "fonte"):
            if not (s.get(campo) or "").strip():
                erros.append("%s: %s vazio" % (rot, campo))

    nao_sei = parecer.get("o_que_nao_sei")
    if not nao_sei or not [x for x in nao_sei if str(x).strip()]:
        erros.append("o_que_nao_sei vazio (o METODO.md exige)")

    for chave in chaves_proibidas(parecer):
        erros.append("nota agregada proibida: '%s'" % chave)
    return erros


def main():
    if not os.path.isdir(PECAS):
        raise SystemExit("pasta de pecas nao encontrada: %s" % PECAS)
    total = falhas = 0
    for item_id in sorted(os.listdir(PECAS)):
        caminho = os.path.join(PECAS, item_id, "parecer.json")
        if not os.path.exists(caminho):
            continue
        total += 1
        with open(caminho, encoding="utf-8") as fh:
            parecer = json.load(fh)
        erros = confere(item_id, parecer)
        if erros:
            falhas += 1
            print("FALHA %s" % item_id)
            for e in erros:
                print("   - %s" % e)

    if not total:
        print("nenhum parecer.json encontrado")
        return 1
    print("\n%d parecer(es) conferido(s), %d com violacao" % (total, falhas))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
