#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Renderiza a fila em markdown, pro Bruno LER.

JSON e formato de programa. O gate de aprovacao aqui e humano, e humano nenhum
audita 377 linhas de JSON enterradas numa pasta -- na pratica ele nao audita
nada, que foi exatamente o que aconteceu na primeira rodada: "eu nao consegui
ver nenhuma peca desse processo".

E a mesma licao que a Borda ja tinha aprendido: a legenda fica A VISTA porque
esconde-la atras de um toque transforma "conferir e aprovar" em "clicar Aprovar".

Duas regras de forma:
  - os sinalizados vem inteiros, com o motivo escrito; o resto vem em tabela
    compacta, porque a maioria nao tem nada a dizer
  - NADA e cortado em silencio. Se algo nao couber, o corte e dito na pagina.

Modulo separado de proposito: o filtro decide, o renderizador so mostra.
"""
import time

ROTULO = {
    "contradicao_de_datacao": "as datas que o anuncio afirma nao fecham entre si",
    "piloto_sem_vinculo": "piloto no titulo ao lado de equipe que a base nao liga a ele",
    "datavel": "da pra cravar a epoca so pelo titulo",
    "peixe_grande": "acima da faixa de preco que a loja ja operou",
    "sem_ancora": "a base nao reconhece nada no titulo",
}


def _linha_tabela(x):
    return "| [%s](%s) | %s | %s | %s |" % (
        x["id"], x.get("url"), x.get("preco_jpy"),
        x.get("preco_brl_estimado", "?"),
        (x.get("titulo_ja") or "").replace("|", "/")[:60])


def escreve(fila, fora, caminho):
    com_sinal = [x for x in fila
                 if [f for f in (x.get("flags") or []) if f != "sem_ancora"]]
    ids_com = {x["id"] for x in com_sinal}
    resto = [x for x in fila if x["id"] not in ids_com]

    L = []
    L.append("---")
    L.append("tipo: fila")
    L.append("frente: nippon")
    L.append("data: %s" % time.strftime("%Y-%m-%d"))
    L.append("---")
    L.append("")
    L.append("# Fila da varredura — %s" % time.strftime("%d/%m"))
    L.append("")
    L.append("> **Isto NÃO é recomendação de compra e NÃO é ranking de qualidade.** É o que")
    L.append("> sobrou depois de descartar o que a base descarta sozinha, ordenado por sinal.")
    L.append("> Título de Mercari é SEO do vendedor: **toda entidade aqui é hipótese.** A")
    L.append("> perícia e a decisão continuam suas.")
    L.append("")
    L.append("| | |")
    L.append("|---|---|")
    L.append("| candidatos na fila | **%d** |" % len(fila))
    L.append("| com algum sinal | **%d** |" % len(com_sinal))
    L.append("| sem sinal nenhum (a base não reconhece nada) | %d |" % len(resto))
    L.append("| descartados | %d |" % len(fora))
    L.append("")

    L.append("## O que a varredura sinalizou")
    L.append("")
    if not com_sinal:
        L.append("_Nada foi sinalizado nesta rodada._")
        L.append("")
    for x in com_sinal:
        dat = x.get("datacao") or {}
        ents = ((x.get("hipoteses") or {}).get("entidades") or {}).get("valores") or []
        titulo = (x.get("titulo_ja") or x["id"]).replace("[", "(").replace("]", ")")
        L.append("### [%s](%s)%s" % (titulo, x.get("url"),
                                     "  ·  **JÁ VENDIDO**" if x.get("vendido") else ""))
        L.append("")
        cab = "`%s` · anúncio ¥%s · nosso preço estimado **R$ %s**" % (
            x["id"], x.get("preco_jpy"), x.get("preco_brl_estimado", "?"))
        if dat.get("janela"):
            cab += " · época **%s**" % dat["janela"]
        L.append(cab)
        L.append("")
        for f in (x.get("flags") or []):
            L.append("- **%s** — %s" % (f, ROTULO.get(f, "")))
        if x.get("por_que_peixe_grande"):
            L.append("- %s" % x["por_que_peixe_grande"])
        if (x.get("hipoteses") or {}).get("por_que_suspeita"):
            L.append("- %s" % x["hipoteses"]["por_que_suspeita"])
        if ents:
            L.append("- reconhecido no título *(hipótese)*: %s" % ", ".join(ents))
        if x.get("fatos_usados"):
            L.append("- fatos da base que sustentam: `%s`" % "`, `".join(x["fatos_usados"][:6]))
        L.append("")

    L.append("## O resto — a base não reconheceu nada útil no título")
    L.append("")
    L.append("Não é falha do filtro, é o tamanho da base: ela conhece 62 entidades e o Mercari")
    L.append("tem muito mais. Ficam aqui inteiros, pro caso de você bater o olho.")
    L.append("")
    L.append("| peça | ¥ | R$ est. | título |")
    L.append("|---|---|---|---|")
    for x in resto:
        L.append(_linha_tabela(x))
    L.append("")

    L.append("## Descartados — **é aqui que você me audita**")
    L.append("")
    L.append("Descartar é escolher. Se eu joguei fora algo que você compraria, o filtro está")
    L.append("errado e eu preciso saber — é o único teste que nenhum script faz sozinho.")
    L.append("")
    if not fora:
        L.append("_Nada foi descartado nesta rodada._")
    else:
        L.append("| peça | motivo | detalhe | título |")
        L.append("|---|---|---|---|")
        for x in fora:
            L.append("| [%s](https://jp.mercari.com/item/%s) | `%s` | %s | %s |" % (
                x.get("id"), x.get("id"), x.get("motivo"),
                (x.get("detalhe") or "").replace("|", "/"),
                (x.get("titulo_ja") or "").replace("|", "/")[:50]))
    L.append("")
    with open(caminho, "w", encoding="utf-8") as fh:
        fh.write("\n".join(L))
