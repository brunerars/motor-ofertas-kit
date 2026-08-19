#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""A prova: o que e barato prevê o que e caro?

Temos 19 pecas com veredito de gabarito, produzido por pericia de ~63 mil tokens
cada. Este script monta, de cada uma, o card falso que uma busca do Mercari
teria entregue -- titulo japones cru e preco, e mais nada -- e roda o filtro
barato em cima. Depois compara com o gabarito.

A LIMITACAO VEM NA FRENTE, nao no rodape: essas 19 pecas foram CURADAS PELO
BRUNO. Nao sao amostra aleatoria do Mercari, ja passaram por um filtro humano.
Entao isto mede "o filtro preserva o que um humano ja gostou", e NAO "o filtro
acha coisa boa no mato". A segunda pergunta so a varredura fresca responde.

O numero que manda: falso negativo em COMPRAR. Cortar uma peca que a pericia
mandou comprar e pior do que nao ter filtro nenhum, porque o filtro roda antes
e ninguem revisa o que ele jogou fora.

Usage:  python backtest.py
Reads:  pecas/<id>/dados.json - score.json - base/*
Writes: nada (so imprime; o relatorio quem escreve e o humano)
"""
import json
import os
import sys
import importlib.util

# O console do Windows e cp1252: uma seta ou um acento na saida derruba o
# script com UnicodeEncodeError. Foi assim que o caminho de CONTRADICAO --
# justamente o mais util -- morria antes de imprimir o diagnostico.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")


def _mod(nome, arquivo):
    caminho = os.path.join(os.path.dirname(os.path.abspath(__file__)), arquivo)
    esp = importlib.util.spec_from_file_location(nome, caminho)
    m = importlib.util.module_from_spec(esp)
    esp.loader.exec_module(m)
    return m


FL = _mod("fl", "fila.py")
CS = _mod("cs", "consultar.py")


def ler(caminho, padrao=None):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def contem(maior, menor):
    """Toda a janela `menor` cabe dentro de algum intervalo de `maior`?"""
    for a, b in menor:
        if not any(x <= a and b <= y for x, y in maior):
            return False
    return True


def main():
    fatos = (ler(os.path.join(BASE, "base", "fatos.json")) or {}).get("fatos") or []
    aliases = (ler(os.path.join(BASE, "base", "aliases.json")) or {}).get("aliases") or []
    gab = {p["id"]: p for p in (ler(os.path.join(BASE, "score.json")) or {}).get("pecas") or []}
    if not gab:
        raise SystemExit("score.json sem pecas: nao ha gabarito pra comparar")

    # ja_visto DESLIGADO de proposito: as 19 estao todas em pecas/, e o portao de
    # dedup descartaria 19 de 19. Aqui interessa o resto do filtro.
    ctx = FL.contexto(checar_ja_visto=False)

    linhas = []
    for pid, alvo in sorted(gab.items()):
        dados = ler(os.path.join(PECAS, pid, "dados.json")) or {}
        card = {"id": pid, "url": dados.get("source_url"),
                "titulo_ja": dados.get("title") or "",
                "preco_jpy": dados.get("price_jpy"), "busca": "(backtest)"}
        linha, descarte = FL.avalia(card, ctx)
        linhas.append((pid, alvo, linha, descarte))

    print("=" * 96)
    print("BACKTEST DO FILTRO BARATO contra %d pecas com gabarito de pericia" % len(linhas))
    print("Amostra CURADA PELO BRUNO, nao aleatoria: mede preservacao, nao descoberta.")
    print("=" * 96)
    print()
    print("%-16s %-24s %-9s %-13s %s" % ("peca", "gabarito", "filtro", "janela", "flags"))
    print("-" * 96)

    fn = []          # falso negativo: gabarito COMPRAR e o filtro descartou
    cortou_passar = 0
    total_passar = 0
    for pid, alvo, linha, descarte in linhas:
        ver = alvo["veredito"]
        e_compra = ver.startswith("COMPRAR")
        if ver == "PASSAR":
            total_passar += 1
        estado = "descartou" if descarte else "manteve"
        if descarte and e_compra:
            fn.append((pid, ver, descarte.get("motivo")))
        if descarte and ver == "PASSAR":
            cortou_passar += 1
        jan = ((linha or {}).get("datacao") or {}).get("janela") or "-"
        flags = ",".join((linha or {}).get("flags") or []) or (descarte or {}).get("motivo", "")
        print("%-16s %-24s %-9s %-13s %s" % (pid, ver, estado, jan, flags))

    print()
    print("--- 1. FALSO NEGATIVO EM COMPRAR (o numero que manda) ---")
    compras = [x for x in linhas if x[1]["veredito"].startswith("COMPRAR")]
    print("  pecas que a pericia mandou comprar: %d" % len(compras))
    print("  descartadas pelo filtro barato:     %d" % len(fn))
    for pid, ver, motivo in fn:
        print("     ! %s (%s) por %s" % (pid, ver, motivo))
    print("  -> %s" % ("PASSA: nenhuma compra foi cortada"
                       if not fn else "REPROVA: o filtro corta compra boa"))

    print()
    print("--- 2. CORTE UTIL ---")
    print("  vereditos PASSAR: %d | descartados pelo filtro: %d" % (total_passar, cortou_passar))
    print("  (numero baixo aqui e ESPERADO: a amostra ja passou pelo olho do Bruno.")
    print("   O poder de corte real so aparece numa varredura crua.)")

    print()
    print("--- 3. O NUMERO DA TESE: datacao por TITULO x datacao por PARECER ---")
    ident = cont = cruza = contradiz = comp = 0
    util = 0
    for pid, alvo, linha, descarte in linhas:
        t = (ler(os.path.join(PECAS, pid, "dados.json")) or {}).get("title") or ""
        dt = FL.datar(CS.entidades_do_texto(t, fatos, aliases), fatos)
        dp = FL.datar(CS.entidades_da_peca(pid, fatos), fatos)
        if isinstance(dt, list) and FL.largura(dt) <= FL.JANELA_UTIL:
            util += 1
        if not isinstance(dt, list) or not isinstance(dp, list):
            continue
        comp += 1
        if dt == dp:
            ident += 1
        if contem(dt, dp):
            cont += 1
        elif CS.intersecta(dt, dp):
            cruza += 1
        else:
            contradiz += 1
    print("  pecas em que os dois datam:              %d" % comp)
    print("  janela do titulo IDENTICA a do parecer:  %d" % ident)
    print("  janela do titulo CONTEM a do parecer:    %d  (seguro: impreciso, nao errado)" % cont)
    print("  cruza mas nao contem:                    %d" % cruza)
    print("  CONTRADIZ o parecer:                     %d  <- este e o que nao pode existir" % contradiz)
    print("  janela util (<=%d temporadas) so pelo titulo: %d de %d"
          % (FL.JANELA_UTIL, util, len(linhas)))

    print()
    print("--- 4. O QUE O ALIAS DESTRAVOU ---")
    cega_a = cega_d = 0
    for pid, _, _, _ in linhas:
        t = (ler(os.path.join(PECAS, pid, "dados.json")) or {}).get("title") or ""
        if not CS.entidades_do_texto(t, fatos):
            cega_a += 1
        if not CS.entidades_do_texto(t, fatos, aliases):
            cega_d += 1
    print("  titulos sem entidade nenhuma: %d antes -> %d depois (de %d)"
          % (cega_a, cega_d, len(linhas)))

    print()
    print("--- 5. AS FLAGS CAIRAM NO LUGAR CERTO? ---")
    for nome in ("contradicao_de_datacao", "piloto_sem_vinculo", "datavel", "sem_ancora"):
        quem = [(pid, alvo["veredito"]) for pid, alvo, linha, _ in linhas
                if linha and nome in (linha.get("flags") or [])]
        print("  %-24s %d peca(s): %s" % (nome, len(quem),
              ", ".join("%s(%s)" % (a, b.split(",")[0]) for a, b in quem[:6]) or "-"))
    return 1 if fn else 0


if __name__ == "__main__":
    sys.exit(main())
