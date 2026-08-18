#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Promove fatos propostos para a base, fundindo com o que ja existe.

The extraction step (an agent reading the pareceres) writes `fatos-propostos.json`.
A human reads those against `frase_origem` and only then promotes. This script is
the promotion half: it never invents, it merges.

Two runs on the same input produce the same base, so this is safe to re-run.

Usage:
  python destila.py            mostra o que entraria (nao escreve nada)
  python destila.py --promover funde propostos em base/fatos.json
  python destila.py --recusar id1,id2   promove tudo menos esses
Reads:  base/fatos-propostos.json (+ base/fatos.json se existir)
Writes: base/fatos.json  ·  base/recusados.json
"""
import json
import os
import sys
import time

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIR = os.path.join(BASE, "base")
PROPOSTOS = os.path.join(DIR, "fatos-propostos.json")
FATOS = os.path.join(DIR, "fatos.json")
RECUSADOS = os.path.join(DIR, "recusados.json")


def ler(caminho, padrao=None):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def funde(velho, novo):
    """Mesmo fato visto de novo: soma a proveniencia e ESTREITA a janela.

    Narrowing, not widening: a second piece confirming the same sponsorship is
    evidence the window is at least that tight. Widening on merge would let one
    sloppy extraction quietly loosen a window that was right.
    """
    saida = dict(velho)
    vistos = list(velho.get("visto_em") or [])
    for v in novo.get("visto_em") or []:
        if v not in vistos:
            vistos.append(v)
    saida["visto_em"] = vistos

    for campo, escolhe in (("de", max), ("ate", min)):
        a, b = velho.get(campo), novo.get(campo)
        if isinstance(a, int) and isinstance(b, int):
            saida[campo] = escolhe(a, b)
        elif saida.get(campo) is None:
            saida[campo] = b

    # duas pecas confirmando o mesmo fato e o sinal mais forte que a base tem
    if len(vistos) >= 2:
        saida["confianca"] = "confirmado"
    return saida


def main():
    promover = "--promover" in sys.argv
    recusar = set()
    if "--recusar" in sys.argv:
        i = sys.argv.index("--recusar")
        if i + 1 < len(sys.argv):
            recusar = {x.strip() for x in sys.argv[i + 1].split(",") if x.strip()}

    propostos = ler(PROPOSTOS)
    if not propostos:
        raise SystemExit("nao achei %s (rode a extracao antes)" % PROPOSTOS)
    novos = propostos.get("fatos") or []

    atual = ler(FATOS, {"fatos": []})
    por_id = {f["id"]: f for f in atual.get("fatos") or []}

    entram, fundidos, recusados = [], [], []
    for f in novos:
        if f.get("id") in recusar:
            recusados.append(f)
            continue
        if f["id"] in por_id:
            fundidos.append((por_id[f["id"]], f))
        else:
            entram.append(f)

    print("propostos: %d | novos: %d | ja na base (fundem): %d | recusados: %d"
          % (len(novos), len(entram), len(fundidos), len(recusados)))
    print()
    for f in entram:
        janela = "%s-%s" % (f.get("de") or "?", f.get("ate") or "aberto")
        print("  + %-26s %-20s %-12s %s"
              % (f["id"][:26], f.get("tipo"), janela, (f.get("afirmacao") or "")[:52]))
    for velho, novo in fundidos:
        j = funde(velho, novo)
        print("  ~ %-26s janela %s-%s, visto em %d peça(s)"
              % (j["id"][:26], j.get("de"), j.get("ate"), len(j["visto_em"])))

    if not promover:
        print("\n(simulação: nada foi escrito. Rode com --promover para gravar.)")
        return 0

    final = dict(por_id)
    for f in entram:
        final[f["id"]] = f
    for velho, novo in fundidos:
        final[velho["id"]] = funde(velho, novo)

    saida = {
        "_schema": "Base de fatos verificáveis destilada dos pareceres de curadoria. Cada fato "
                   "carrega a peça de onde veio (visto_em) e a frase que o sustenta "
                   "(frase_origem). Só entra o que passou por busca CONFIRMADA. "
                   "É consultada por consultar.py para datar peça sem gastar modelo.",
        "_como_crescer": "Cada rodada de curadoria gera fatos-propostos.json; um humano confere "
                         "contra frase_origem e roda destila.py --promover. Fato visto em duas "
                         "peças estreita a janela e vira confirmado.",
        "_atualizado_em": time.strftime("%Y-%m-%d"),
        "_total": len(final),
        "fatos": sorted(final.values(), key=lambda f: (f.get("tipo") or "", f["id"])),
    }
    os.makedirs(DIR, exist_ok=True)
    with open(FATOS, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, indent=2)
    print("\nbase gravada: %s (%d fatos)" % (FATOS, len(final)))

    if recusados:
        antigos = ler(RECUSADOS, {"recusados": []}).get("recusados") or []
        ids = {r["id"] for r in antigos}
        antigos += [r for r in recusados if r["id"] not in ids]
        with open(RECUSADOS, "w", encoding="utf-8") as fh:
            json.dump({"_nota": "Fatos que a conferência humana recusou, com o motivo "
                                "no chat da rodada. Guardados pra não serem repropostos "
                                "sem alguém olhar de novo.",
                       "recusados": antigos}, fh, ensure_ascii=False, indent=2)
        print("recusados registrados: %s (%d)" % (RECUSADOS, len(antigos)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
