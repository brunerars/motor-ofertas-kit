#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Gera a nota de leitura da rodada, pro Bruno abrir no Obsidian.

The JSON is the record; this is the surface. Derived, never hand-edited:
delete RESULTADO.md, run this, get the same file back.

Usage:  python relatorio.py
Reads:  curadoria/index.json + pecas/<id>/parecer.json
Writes: curadoria/RESULTADO.md
"""
import json
import os

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
SAIDA = os.path.join(BASE, "RESULTADO.md")

ROTULO = {
    "corrigir_antes_de_publicar": "Corrigir antes de publicar",
    "achado_de_valor": "Achado de valor",
    "ok": "Sem ressalva",
}


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


SCORE = {}


def score_de(item_id):
    return SCORE.get(item_id)


def bloco_peca(p):
    parecer = ler(os.path.join(PECAS, p["id"], "parecer.json"))
    preco = ler(os.path.join(PECAS, p["id"], "preco.json"))
    c = preco["conta"]

    linhas = []
    marca = ""
    if p["vendido"]:
        marca = " · **JÁ VENDIDA**"
    if p["controle_negativo"]:
        marca = " · **CONTROLE NEGATIVO**"

    linhas.append("### %s — %s%s" % (p["id"], p["title_pt"], marca))
    linhas.append("")
    sc = score_de(p["id"])
    if sc:
        e = sc["eixos"]
        rar = "sem base" if sc["raridade_sem_base"] else "%d/5" % e["raridade"]
        linhas.append("> **%s** · anúncio %d/5 · valor %d/5 · raridade %s · análise %s"
                      % (sc["veredito"], e["anuncio"], e["valor"], rar, sc["confianca"]))
        linhas.append("")
    linhas.append("[anúncio](%s) · ¥%s no Mercari · **R$ %s** · volume %s (margem ¥%s)"
                  % (p["source_url"], f"{int(c['produto_jpy']):,}".replace(",", "."),
                     f"{p['preco_brl']:,.2f}".replace(",", "@").replace(".", ",").replace("@", "."),
                     c["classe_volume"], f"{c['margem_jpy']:,}".replace(",", ".")))
    linhas.append("")

    for classe in ("CORRECAO", "ATRIBUICAO", "VALOR", "CONFIRMACAO"):
        sinais = [s for s in parecer["sinais"] if s["classe"] == classe]
        for s in sinais:
            trava = " ⛔" if s["severidade"] == "nao_publicar_assim" else ""
            ext = s.get("checagem_externa") or {}
            selo = ""
            if ext.get("feita"):
                selo = {"confirma": " ✔ conferido", "refuta": " ✘ refutado",
                        "nao_achei": " ? não achei"}.get(ext.get("resultado"), "")
            linhas.append("- **%s%s** %s%s" % (classe, trava, s["afirmacao"], selo))
            linhas.append("  *%s* (`%s`)" % (s["evidencia"], s["fonte"]))
    linhas.append("")
    linhas.append("**O que fazer:** %s" % parecer["recomendacao"])
    linhas.append("")
    linhas.append("<details><summary>O que não sei (%d)</summary>"
                  % len(parecer["o_que_nao_sei"]))
    linhas.append("")
    for x in parecer["o_que_nao_sei"]:
        linhas.append("- %s" % x)
    linhas.append("")
    linhas.append("</details>")
    linhas.append("")
    return linhas


def main():
    idx = ler(os.path.join(BASE, "index.json"))
    caminho_score = os.path.join(BASE, "score.json")
    score = {}
    if os.path.exists(caminho_score):
        score = {x["id"]: x for x in ler(caminho_score)["pecas"]}
    SCORE.update(score)
    pecas = idx["pecas"]

    ce = {"sinais": 0, "com_busca": 0, "confirma": 0, "refuta": 0, "nao_achei": 0}
    for p in pecas:
        for k in ce:
            ce[k] += p["checagem_externa"][k]

    out = []
    out.append("---")
    out.append("frente: nippon")
    out.append("papel: resultado da rodada de curadoria (DERIVADO — rode relatorio.py, nao edite na mao)")
    out.append("atualizado: %s" % idx["_gerado_em"][:10])
    out.append("---")
    out.append("")
    out.append("# Curadoria — resultado da %s" % idx["_rodada"])
    out.append("")
    out.append("> Nota **derivada**. A verdade está em `index.json` e em `pecas/<id>/`. "
               "Apagar este arquivo e rodar `python scripts/relatorio.py` devolve igual. "
               "A régua está em [[METODO]].")
    out.append("")
    out.append("%d peças · %d com sinal de **não publicar** · %d com achado de valor · "
               "%d incertezas declaradas"
               % (len(pecas),
                  len([p for p in pecas if p["flag"] == "corrigir_antes_de_publicar"]),
                  len([p for p in pecas if p["flag"] == "achado_de_valor"]),
                  sum(p["incertezas"] for p in pecas)))
    out.append("")
    out.append("Checagem externa: **%d sinais, %d conferidos por busca** — %d confirmam, "
               "%d refutam, %d não acharam (viraram incerteza, não afirmação)."
               % (ce["sinais"], ce["com_busca"], ce["confirma"], ce["refuta"], ce["nao_achei"]))
    out.append("")

    # tabela-painel
    out.append("## O painel")
    out.append("")
    out.append("| O que fazer | Peça | Anún | Valor | Raro | R$ | O quê |")
    out.append("|---|---|:---:|:---:|:---:|---:|---|")
    # a leitura util agora e por veredito, nao pela flag antiga
    ordem_v = ["COMPRAR", "COMPRAR, PEDIR FOTO", "COMPRAR E REESCREVER",
               "NEGOCIAR PREÇO", "PASSAR"]

    def chave(x):
        sc = score.get(x["id"])
        if not sc:
            return (99, 0)
        return (ordem_v.index(sc["veredito"]), -sc["eixos"]["valor"])

    for p in sorted(pecas, key=chave):
        resumo = ""
        if p["bloqueios"]:
            resumo = p["bloqueios"][0]
        elif p["achados_de_valor"]:
            resumo = p["achados_de_valor"][0]
        resumo = resumo[:95] + ("…" if len(resumo) > 95 else "")
        nome = (p["title_pt"] or p["id"])[:38]
        sc = score.get(p["id"])
        if sc:
            e = sc["eixos"]
            rar = "s/base" if sc["raridade_sem_base"] else "%d" % e["raridade"]
            out.append("| **%s** | %s | %d | %d | %s | %s | %s |"
                       % (sc["veredito"], nome, e["anuncio"], e["valor"], rar,
                          f"{p['preco_brl']:,.0f}".replace(",", "."), resumo))
        else:
            out.append("| %s | %s | | | | %s | %s |"
                       % (ROTULO[p["flag"]], nome,
                          f"{p['preco_brl']:,.0f}".replace(",", "."), resumo))
    out.append("")

    for flag in ("corrigir_antes_de_publicar", "achado_de_valor", "ok"):
        grupo = [p for p in pecas if p["flag"] == flag]
        if not grupo:
            continue
        out.append("## %s (%d)" % (ROTULO[flag], len(grupo)))
        out.append("")
        for p in grupo:
            out += bloco_peca(p)

    with open(SAIDA, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out))
    print("escrito: %s (%d linhas)" % (SAIDA, len(out)))


if __name__ == "__main__":
    main()
