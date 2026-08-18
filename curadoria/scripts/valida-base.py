#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Gate da base de fatos.

This base is going to date real pieces, so a wrong window here quietly poisons
every future verdict. The checks are cheap; run them every time.

O que recusa:
  1. fato sem `visto_em` (de onde veio) ou sem `frase_origem` (o que sustenta)
  2. janela invertida (de > ate) ou ano fora de 1890..2100
  3. tipo fora da lista fechada
  4. id duplicado
  5. id que esta na base E em recusados.json ao mesmo tempo: readmitir um fato sem
     tirar da lista de recusa faz a proxima destilacao recusa-lo de novo, em silencio
  6. avisa (nao recusa) quando a mesma dupla tem periodos descontinuos: isso e
     legitimo, relacao de patrocinio vai e volta, e o consultar.py UNE os periodos.
     `evento` fica fora dessa checagem, porque evento e pontual por natureza.

Usage:  python valida-base.py [caminho]   (default: base/fatos.json)
Exit:   0 limpo | 1 alguma violacao
"""
import json
import os
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PADRAO = os.path.join(BASE, "base", "fatos.json")

TIPOS = {"patrocinio", "motor", "pneu", "licenciado", "fabricante", "codigo",
         "piloto_equipe", "entidade_existencia", "evento"}
ANO_MIN, ANO_MAX = 1890, 2100
CONFIANCAS = {"confirmado", "hipotese"}


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def ano_ok(v):
    return v is None or (isinstance(v, int) and ANO_MIN <= v <= ANO_MAX)


def sobrepoe(a, b):
    """Duas janelas se encostam? Extremo aberto (None) conta como infinito."""
    a_de = a.get("de") or ANO_MIN
    a_ate = a.get("ate") or (a.get("de") or ANO_MAX) if a.get("ate") is None else a["ate"]
    b_de = b.get("de") or ANO_MIN
    b_ate = b.get("ate") or (b.get("de") or ANO_MAX) if b.get("ate") is None else b["ate"]
    # fato com `ate` aberto vale dali pra frente
    if a.get("ate") is None and a.get("de"):
        a_ate = ANO_MAX
    if b.get("ate") is None and b.get("de"):
        b_ate = ANO_MAX
    return a_de <= b_ate and b_de <= a_ate


def chave_par(f):
    """A dupla que o fato descreve. Sem contraparte, so a entidade."""
    ent = (f.get("entidade") or "").strip().lower()
    con = (f.get("contraparte") or "").strip().lower()
    return (f.get("tipo"), ent, con)


def confere(fatos):
    erros, avisos = [], []
    vistos_id = {}

    # A fact readmitted after a rejection must leave recusados.json. Leaving it in both
    # files makes the next destila.py --recusar drop a fact that pieces already depend on.
    recusados = set()
    caminho_rec = os.path.join(BASE, "base", "recusados.json")
    if os.path.exists(caminho_rec):
        recusados = {r.get("id") for r in ler(caminho_rec).get("recusados") or []}
    for f in fatos:
        if f.get("id") and f["id"] in recusados:
            erros.append("fato %s esta na base E em recusados.json: tire de um dos dois"
                         % f["id"])

    for i, f in enumerate(fatos):
        rot = "fato[%d] %s" % (i, f.get("id") or "SEM ID")

        if not f.get("id"):
            erros.append("%s: sem id" % rot)
        elif f["id"] in vistos_id:
            erros.append("%s: id duplicado (ja usado no fato[%d])" % (rot, vistos_id[f["id"]]))
        else:
            vistos_id[f["id"]] = i

        if f.get("tipo") not in TIPOS:
            erros.append("%s: tipo invalido (%s)" % (rot, f.get("tipo")))

        if not (f.get("visto_em") or []):
            erros.append("%s: sem visto_em, nao da pra saber de onde veio" % rot)
        if not (f.get("frase_origem") or "").strip():
            erros.append("%s: sem frase_origem, nao da pra conferir" % rot)
        if not (f.get("afirmacao") or "").strip():
            erros.append("%s: afirmacao vazia" % rot)
        if f.get("confianca") not in CONFIANCAS:
            erros.append("%s: confianca invalida (%s)" % (rot, f.get("confianca")))

        de, ate = f.get("de"), f.get("ate")
        if not ano_ok(de):
            erros.append("%s: ano 'de' invalido (%r)" % (rot, de))
        if not ano_ok(ate):
            erros.append("%s: ano 'ate' invalido (%r)" % (rot, ate))
        if isinstance(de, int) and isinstance(ate, int) and de > ate:
            erros.append("%s: janela invertida (%d a %d)" % (rot, de, ate))

    # contradicao: mesma dupla, mesmo tipo, janelas que nao se encostam
    por_par = {}
    for f in fatos:
        if f.get("de") is None and f.get("ate") is None:
            continue  # fato sem janela nao contradiz janela
        if f.get("tipo") == "evento":
            continue  # evento e pontual: varios na mesma entidade e o esperado
        por_par.setdefault(chave_par(f), []).append(f)

    for chave, grupo in por_par.items():
        if len(grupo) < 2:
            continue
        for i in range(len(grupo)):
            for j in range(i + 1, len(grupo)):
                a, b = grupo[i], grupo[j]
                if sobrepoe(a, b):
                    continue
                declarado = (b.get("id") in (a.get("contradiz") or [])
                             or a.get("id") in (b.get("contradiz") or []))
                if not declarado:
                    avisos.append(
                        "relacao descontinua: '%s' (%s-%s) e '%s' (%s-%s) em %s/%s/%s. "
                        "Legitimo se a relacao teve intervalo (a Goodyear saiu da Benetton "
                        "em 1991 e voltou em 1992); o consultar.py UNE os periodos."
                        % (a.get("id"), a.get("de"), a.get("ate"),
                           b.get("id"), b.get("de"), b.get("ate"),
                           chave[0], chave[1] or "-", chave[2] or "-"))
    return erros, avisos


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else PADRAO
    if not os.path.exists(caminho):
        print("base nao encontrada: %s" % caminho)
        return 1
    dados = ler(caminho)
    fatos = dados.get("fatos") or []
    if not fatos:
        print("base vazia")
        return 1

    erros, avisos = confere(fatos)
    for e in erros:
        print("  ERRO   %s" % e)
    for a in avisos:
        print("  aviso  %s" % a)
    print("\n%d fato(s) conferido(s), %d violacao(oes)" % (len(fatos), len(erros)))

    tipos = {}
    for f in fatos:
        tipos[f.get("tipo")] = tipos.get(f.get("tipo"), 0) + 1
    for t, n in sorted(tipos.items(), key=lambda x: -x[1]):
        print("  %-22s %d" % (t, n))
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
