#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Deriva veredito e eixos de cada peca a partir dos sinais ja periciados.

The whole point: nothing here is asked of a model. Every point moves because of
a signal that carries evidence and a photo reference, so any score can be traced
back to the thing that caused it. Re-running gives the same answer.

Why three axes and not one score: 9 of 19 pieces carry a blocker AND a value
find at the same time. A single number averages those into mush and hides both.
The METODO.md ban on an aggregate score stands; these are separate readings that
each answer a different question, plus a confidence flag on the analysis itself.

Usage:  python score.py
Reads:  index.json + responsabilidade.json + pecas/<id>/parecer.json
Writes: score.json
"""
import json
import os
import re
import time

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PECAS = os.path.join(BASE, "pecas")
SAIDA = os.path.join(BASE, "score.json")

# Palavras que so contam quando o sinal passou por busca e foi CONFIRMADO.
# Sem esse portao viraria leitura de adjetivo do vendedor, que e exatamente
# o que a rodada inteira existe pra nao fazer.
PESO_HISTORICO = re.compile(
    r"\b(vit[óo]ria|venceu|campe[ãa]o|t[íi]tulo|[úu]ltim[oa] (?:ano|temporada|corrida)|"
    r"estreia|estreou|fim d[oa]|encerr|nunca mais|colapso|morreu)\b", re.I)
JANELA_UM_ANO = re.compile(
    r"\b(em|de|ano de|temporada de|data (?:em|de)|fecha (?:em|na temporada de))\s+(19|20)\d{2}\b", re.I)
JANELA_CURTA = re.compile(r"\b(19|20)\d{2}\s*(?:a|-|e|至|até)\s*(19|20)\d{2}\b", re.I)
SEM_ANCORA = re.compile(r"n[ãa]o tem [âa]ncora|sem [âa]ncora|ano indeterminado|"
                        r"n[ãa]o ancora|indeterminad", re.I)

VEREDITOS = {
    "COMPRAR": "Sem trava. Comprar e publicar com o texto que o parecer entrega.",
    "COMPRAR, PEDIR FOTO": "A peça está certa; o material do anúncio é que não serve. "
                           "Comprar e pedir foto limpa antes de montar o post.",
    "COMPRAR E REESCREVER": "A peça é boa, a descrição do vendedor é que não presta. "
                            "Comprar e jogar fora o texto dele.",
    "NEGOCIAR PREÇO": "O prêmio que o vendedor cobrou está ancorado numa afirmação que "
                      "caiu. Propor menos antes de fechar.",
    "PASSAR": "A peça não é o que parece. Deixar passar.",
}

# Acima disto, uma trava de datacao ou raridade vira dinheiro pago por promessa
# que nao se sustenta, e a acao deixa de ser 'reescrever' e passa a ser 'negociar'.
TICKET_ALTO_JPY = 20000


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def confirmado(sinal):
    ext = sinal.get("checagem_externa") or {}
    return ext.get("feita") and ext.get("resultado") == "confirma"


def eixo_anuncio(sinais, porques):
    """Quanto do que o vendedor afirma se sustenta. 5 = nada a corrigir."""
    travas = [s for s in sinais if s["severidade"] == "nao_publicar_assim"]
    confs = [s for s in sinais if s["classe"] == "CONFIRMACAO"]
    nota = 5 - 2 * len(travas) + min(2, len(confs)) // 2
    nota = max(0, min(5, nota))
    if travas:
        porques.append("anúncio: %d sinal(is) de não publicar assim" % len(travas))
    else:
        porques.append("anúncio: nenhuma trava")
    if confs:
        porques.append("anúncio: %d confirmação(ões) que sustentam o declarado" % len(confs))
    return nota


def eixo_valor(sinais, porques):
    """Quanto a peca e mais do que o vendedor sabe."""
    valor = [s for s in sinais if s["classe"] == "VALOR"]
    principais = [s for s in valor if s["severidade"] == "achado_principal"]
    nota = min(5, 2 * len(principais) + (len(valor) - len(principais)))
    if principais:
        porques.append("valor: %d achado(s) principal(is)" % len(principais))
    elif valor:
        porques.append("valor: %d sinal(is) de valor, nenhum principal" % len(valor))
    else:
        porques.append("valor: nenhum sinal de valor")
    return nota


def eixo_raridade(sinais, porques):
    """Raridade so conta o que a busca externa confirmou.

    Datacao ancorada e o piso; peso historico (vitoria, ultimo ano, titulo) soma
    por cima. Sem ancora nenhuma o eixo devolve 0 e diz que nao tem base, em vez
    de inventar um numero medio.
    """
    # So VALOR e CONFIRMACAO entram. Em CORRECAO e ATRIBUICAO a frase fala do que a
    # peca NAO e, e ler "Senna morreu em 1994" ali como peso historico inverte o
    # sentido: a jaqueta Yamaha marcava raridade 5/5 justamente pela frase que a
    # derruba.
    conferidos = [s for s in sinais
                  if confirmado(s) and s["classe"] in ("VALOR", "CONFIRMACAO")]
    texto = " ".join(s["afirmacao"] for s in conferidos)
    if not conferidos:
        porques.append("raridade: sem base, nenhum sinal de valor confirmado por busca")
        return 0, True

    nota = 0
    if JANELA_UM_ANO.search(texto):
        nota = 3
        porques.append("raridade: datação fechada em uma temporada, confirmada")
    elif JANELA_CURTA.search(texto):
        nota = 2
        porques.append("raridade: datação em janela curta, confirmada")
    else:
        nota = 1
        porques.append("raridade: sem datação fechada")

    if SEM_ANCORA.search(" ".join(s["afirmacao"] for s in sinais)):
        nota = min(nota, 1)
        porques.append("raridade: o parecer registra que a datação não tem âncora")

    achados = PESO_HISTORICO.findall(texto)
    if achados:
        nota = min(5, nota + (2 if len(achados) >= 2 else 1))
        porques.append("raridade: peso histórico ancorado (%d menção(ões) confirmada(s))"
                       % len(achados))
    return nota, nota == 0


def confianca(sinais, incertezas, porques):
    ok = [s for s in sinais if confirmado(s)]
    nach = [s for s in sinais
            if (s.get("checagem_externa") or {}).get("resultado") == "nao_achei"]
    if len(ok) >= 3 and len(nach) <= 2:
        nivel = "alta"
    elif len(ok) >= 2:
        nivel = "média"
    else:
        nivel = "baixa"
    porques.append("confiança: %d sinal(is) confirmado(s) por busca, %d sem resposta"
                   % (len(ok), len(nach)))
    return nivel


def veredito(peca, resp, sinais, anuncio, porques):
    travas = [s for s in sinais if s["severidade"] == "nao_publicar_assim"]
    if not travas:
        return "COMPRAR"

    origem = (resp.get(peca["id"]) or {}).get("origem")
    if origem == "a_peca_nao_e_o_que_parece":
        return "PASSAR"
    if origem == "material_do_anuncio":
        return "COMPRAR, PEDIR FOTO"

    # Ticket alto com a datacao ou a raridade derrubada: o preco embute um premio
    # que a peca nao sustenta, entao a acao e mexer no preco, nao so no texto.
    texto_travas = " ".join(s["afirmacao"] for s in travas)
    premio_caiu = bool(re.search(r"datação|data[çc]|anos? \d0|90s|70s|80s|00s|"
                                 r"raro|raridade|rara", texto_travas, re.I))
    if peca["preco_jpy_anuncio"] >= TICKET_ALTO_JPY and premio_caiu:
        porques.append("veredito: ticket alto (%s ienes) com a datação ou a raridade "
                       "derrubada" % "{:,}".format(peca["preco_jpy_anuncio"]).replace(",", "."))
        return "NEGOCIAR PREÇO"
    return "COMPRAR E REESCREVER"


ORDEM = ["COMPRAR", "COMPRAR, PEDIR FOTO", "COMPRAR E REESCREVER",
         "NEGOCIAR PREÇO", "PASSAR"]


def main():
    idx = ler(os.path.join(BASE, "index.json"))
    resp = ler(os.path.join(BASE, "responsabilidade.json"))

    linhas = []
    for p in idx["pecas"]:
        parecer = ler(os.path.join(PECAS, p["id"], "parecer.json"))
        sinais = parecer["sinais"]
        porques = []

        anuncio = eixo_anuncio(sinais, porques)
        valor = eixo_valor(sinais, porques)
        rar, rar_sem_base = eixo_raridade(sinais, porques)
        conf = confianca(sinais, p["incertezas"], porques)
        vd = veredito(p, resp, sinais, anuncio, porques)

        linhas.append({
            "id": p["id"],
            "source_url": p["source_url"],
            "title_pt": p["title_pt"],
            "preco_jpy_anuncio": p["preco_jpy_anuncio"],
            "preco_brl": p["preco_brl"],
            "vendido": p["vendido"],
            "controle_negativo": p["controle_negativo"],
            "veredito": vd,
            "veredito_texto": VEREDITOS[vd],
            "eixos": {"anuncio": anuncio, "valor": valor, "raridade": rar},
            "raridade_sem_base": rar_sem_base,
            "confianca": conf,
            "porque": porques,
        })

    linhas.sort(key=lambda x: (ORDEM.index(x["veredito"]),
                               -x["eixos"]["valor"], -x["eixos"]["raridade"]))

    resumo = {}
    for x in linhas:
        resumo[x["veredito"]] = resumo.get(x["veredito"], 0) + 1

    saida = {
        "_schema": "Veredito e eixos por peça. DERIVADO dos sinais do parecer: nenhum número "
                   "aqui foi pedido a um modelo, cada ponto sobe ou desce por causa de um sinal "
                   "que carrega evidência. Apagar e rodar score.py devolve igual.",
        "_eixos": {
            "anuncio": "0 a 5. Quanto do que o vendedor afirma se sustenta. 5 = nada a corrigir.",
            "valor": "0 a 5. Quanto a peça é mais do que o vendedor sabe que tem.",
            "raridade": "0 a 5. Só conta datação e peso histórico CONFIRMADOS por busca. "
                        "Sem âncora devolve 0 e marca sem_base, em vez de inventar um meio-termo.",
        },
        "_por_que_nao_uma_nota_so": "9 das 19 peças têm trava e valor ao mesmo tempo. Uma nota "
                                    "única faria a média de coisas opostas e esconderia as duas. "
                                    "Ver METODO.md.",
        "_vereditos": VEREDITOS,
        "_gerado_em": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "_resumo": resumo,
        "pecas": linhas,
    }
    with open(SAIDA, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, indent=2)

    print("%d peças pontuadas em %s\n" % (len(linhas), SAIDA))
    print("%-21s %-5s %-5s %-5s %-7s %9s  %s"
          % ("VEREDITO", "anun", "valor", "raro", "conf", "R$", "peça"))
    print("-" * 108)
    for x in linhas:
        e = x["eixos"]
        rar = "s/base" if x["raridade_sem_base"] else "%d/5" % e["raridade"]
        print("%-21s %d/5   %d/5   %-5s %-7s %9.0f  %s"
              % (x["veredito"], e["anuncio"], e["valor"], rar, x["confianca"],
                 x["preco_brl"], (x["title_pt"] or x["id"])[:42]))
    print()
    for v in ORDEM:
        if v in resumo:
            print("  %-21s %d" % (v, resumo[v]))


if __name__ == "__main__":
    main()
