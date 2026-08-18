#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Data uma peca por intersecao de janelas, sem modelo e sem rede.

This is the whole point of the base. On the Etapa 2 run, dating a piece cost a
search-backed expert pass (~63k tokens). Once the facts are structured, the same
answer falls out of intersecting sets: free, instant, and auditable, because the
result carries the facts that produced it.

The expensive model only has to look at what the table cannot resolve.

UNION inside a pair, INTERSECTION across pairs. Goodyear shod Benetton in 1990,
lost 1991 to Pirelli, and came back in 1992: those are two true periods of one
relationship, so a piece showing Goodyear could be from either. Picking the
narrowest of the two (the earlier naive version did) dates a 1992 jacket to 1990.

Usage:
  python consultar.py Pirelli Camel Autopolis
  python consultar.py --peca m13668803753        (le as entidades do parecer)
Reads: base/fatos.json
"""
import json
import os
import re
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
FATOS = os.path.join(BASE, "base", "fatos.json")

ANO_MIN, ANO_MAX = 1890, 2100
# tipos que carregam janela de temporada e por isso servem pra datar.
# `evento` fica de fora de proposito: um evento e pontual e nao delimita
# o periodo em que uma peca pode ter sido feita.
TIPOS_DATAM = {"patrocinio", "motor", "pneu", "licenciado", "piloto_equipe"}

# Marcas cujo nome tambem e palavra comum de etiqueta. "100% COTTON SHELL" numa
# composicao nao e a petrolifera; sem esta trava, uma jaqueta Benetton de 1991
# ficava sem datacao porque a Shell so aparece na Ferrari a partir de 1996.
# So descarta quando a palavra vizinha entrega o outro sentido.
AMBIGUOS = {
    "shell": r"(cotton|nylon|polyester|outer|lining|acetate|100%|forro|tecido)\s*shell"
             r"|shell\s*(fabric|lining|100)",
}


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def normaliza(t):
    return re.sub(r"[^a-z0-9]+", "", (t or "").lower())


def janela(f):
    de, ate = f.get("de"), f.get("ate")
    if de is None and ate is None:
        return None
    return (de if de is not None else ANO_MIN,
            ate if ate is not None else ANO_MAX)


def uniao(intervalos):
    """Funde intervalos que se tocam; mantem os separados separados."""
    if not intervalos:
        return []
    ordenados = sorted(intervalos)
    saida = [list(ordenados[0])]
    for a, b in ordenados[1:]:
        if a <= saida[-1][1] + 1:            # encostam ou colam
            saida[-1][1] = max(saida[-1][1], b)
        else:
            saida.append([a, b])
    return [tuple(x) for x in saida]


def intersecta(conjunto_a, conjunto_b):
    """Intersecao de dois conjuntos de intervalos."""
    saida = []
    for a1, a2 in conjunto_a:
        for b1, b2 in conjunto_b:
            lo, hi = max(a1, b1), min(a2, b2)
            if lo <= hi:
                saida.append((lo, hi))
    return uniao(saida)


def casa(fato, termo):
    n = normaliza(termo)
    if not n:
        return False
    for campo in ("entidade", "contraparte"):
        v = normaliza(fato.get(campo))
        if v and (n in v or v in n):
            return True
    return False


def entidades_da_peca(item_id, fatos):
    """Pesca do parecer os termos que a base ja conhece.

    Deliberately conservative: only names the base already carries, so a piece
    is never dated by a word nobody verified.
    """
    caminho = os.path.join(PECAS, item_id, "parecer.json")
    if not os.path.exists(caminho):
        raise SystemExit("parecer nao encontrado: %s" % caminho)
    d = ler(caminho)
    # So a EVIDENCIA, e so de sinal que afirma sobre a peca.
    #
    # A afirmacao traz contexto: explica o que a peca NAO e, cita outra equipe pra
    # comparar, conta a historia em volta. Pescar nome dali fez a Benetton do Piquet
    # puxar "Mild Seven" e "Ford na McLaren de 1993", e a intersecao virou vazia.
    # A evidencia descreve o que esta fisicamente na peca, que e o que data.
    sinais = [s for s in d.get("sinais") or []
              if s.get("classe") in ("VALOR", "CONFIRMACAO")]
    texto = " ".join(s.get("evidencia") or "" for s in sinais)
    tn = normaliza(texto)
    cru = " ".join(s.get("evidencia") or "" for s in sinais).lower()
    achados = []
    for f in fatos:
        if f.get("tipo") not in TIPOS_DATAM:
            continue
        for campo in ("entidade", "contraparte"):
            v = f.get(campo)
            if not v or len(normaliza(v)) < 4 or normaliza(v) not in tn:
                continue
            padrao = AMBIGUOS.get(normaliza(v))
            if padrao and re.search(padrao, cru):
                continue  # o vizinho entrega que nao e a marca
            if v not in achados:
                achados.append(v)
    return achados


def fmt(conjunto):
    partes = []
    for a, b in conjunto:
        if b >= ANO_MAX:
            partes.append("%d+" % a)
        elif a == b:
            partes.append("%d" % a)
        else:
            partes.append("%d-%d" % (a, b))
    return " ou ".join(partes)


def main():
    if not os.path.exists(FATOS):
        raise SystemExit("base nao encontrada: %s (rode destila.py --promover)" % FATOS)
    fatos = ler(FATOS).get("fatos") or []

    args = sys.argv[1:]
    if not args:
        raise SystemExit("uso: consultar.py <entidade> [...]  |  --peca <id>")

    if args[0] == "--peca":
        if len(args) < 2:
            raise SystemExit("uso: consultar.py --peca <mercari_id>")
        termos = entidades_da_peca(args[1], fatos)
        print("peça %s: entidades reconhecidas na base: %s\n"
              % (args[1], ", ".join(termos) if termos else "nenhuma"))
    else:
        termos = args

    usados, sem_base = [], []
    for t in termos:
        casados = [f for f in fatos
                   if casa(f, t) and f.get("tipo") in TIPOS_DATAM and janela(f)]
        if casados:
            # UNIAO: todos os periodos verdadeiros dessa mesma relacao
            usados.append((t, uniao([janela(f) for f in casados]), casados))
        else:
            sem_base.append(t)

    if not usados:
        print("nenhuma entidade com janela conhecida. A base não data esta peça.")
        if sem_base:
            print("sem base: %s" % ", ".join(sem_base))
        return 1

    print("%-24s %-16s %s" % ("entidade", "período", "fatos"))
    print("-" * 92)
    atual = [(ANO_MIN, ANO_MAX)]
    for termo, conj, casados in usados:
        print("%-24s %-16s %s" % (termo[:24], fmt(conj),
                                  ", ".join(f["id"] for f in casados)[:44]))
        atual = intersecta(atual, conj)   # INTERSECAO entre relacoes diferentes

    print()
    if not atual:
        print("CONTRADIÇÃO: os períodos não se cruzam.")
        culpados = []
        for i, (termo, conj, _) in enumerate(usados):
            resto = [(ANO_MIN, ANO_MAX)]
            for j, (_, outro, _) in enumerate(usados):
                if i != j:
                    resto = intersecta(resto, outro)
            if resto:
                culpados.append((termo, fmt(resto)))
        if culpados:
            print("Tirando uma entidade, a datação fecha:")
            for termo, janela_sem in culpados:
                print("   sem %-20s → %s" % (termo, janela_sem))
            print("Confira se essa entidade está mesmo na peça, ou se o fato dela na base está errado.")
        else:
            print("Ou a peça combina coisas que não coexistiram, ou a base tem fato errado.")
        return 2

    total = sum(b - a + 1 for a, b in atual)
    if total == 1:
        print("DATAÇÃO: %s  (uma temporada)" % fmt(atual))
    else:
        print("DATAÇÃO: %s" % fmt(atual))

    if sem_base:
        print("\nsem base (o modelo ainda precisa olhar): %s" % ", ".join(sem_base))
    print("resolvido pela base, sem busca: %d de %d entidades"
          % (len(usados), len(usados) + len(sem_base)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
