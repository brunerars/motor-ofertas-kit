#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Gate das saidas da varredura. Gemeo do valida.py, que ja protege os pareceres.

As saidas novas (cards, fila, comparaveis) tem os mesmos dois jeitos de apodrecer
que o parecer tinha, e por isso a regua e a mesma:

  1. NOTA AGREGADA voltando pela porta dos fundos. O METODO proibe colapsar
     achados de naturezas opostas num numero so, e um campo chamado `score` ou
     `ranking` na fila seria exatamente isso com outro nome. A lista de chaves
     proibidas e a do valida.py mais as que so fazem sentido aqui.
  2. HIPOTESE virando FATO em silencio. Entidade tirada de titulo de Mercari e
     SEO do vendedor -- a peca m35956987972 tem "Senna" no titulo e nenhum
     vinculo com ele. Se a marca de hipotese cair pelo caminho, o proximo leitor
     trata palpite como verificado.

Alem disso confere o que so este dominio tem: card sem a fonte do estado de
venda, alias apontando pra entidade que nao existe na base, e balde publicando
numero abaixo do n minimo.

Usage:  python valida-varredura.py
Exit:   0 limpo | 1 alguma violacao
"""
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VARRED = os.path.join(BASE, "varredura")

# as do valida.py, mais as que so nascem aqui: um "ranking" ou um
# "preco_de_mercado" na fila e a nota agregada de novo, com chapeu
PROIBIDAS = {"nota", "score", "nota_autenticidade", "nota_raridade", "autenticidade",
             "pontuacao", "rating", "ranking", "preco_de_mercado", "vale", "recomendacao"}

N_MINIMO_ESPERADO = 5


def ler(caminho, padrao=None):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


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


def confere_cards(erros):
    n = 0
    for raiz, _, arqs in os.walk(VARRED):
        if "cards.json" not in arqs:
            continue
        caminho = os.path.join(raiz, "cards.json")
        d = ler(caminho) or {}
        rot = os.path.relpath(caminho, BASE)
        if not (d.get("_busca") or {}).get("url"):
            erros.append("%s: sem _busca.url, nao da pra saber de onde os cards vieram" % rot)
        if not (d.get("_fonte") or {}).get("endpoint"):
            erros.append("%s: sem _fonte.endpoint" % rot)
        for c in d.get("cards") or []:
            n += 1
            if c.get("vendido") and not c.get("vendido_fonte"):
                erros.append("%s: card %s marcado vendido sem vendido_fonte -- o bit tem "
                             "que carregar a URL que o produziu" % (rot, c.get("id")))
            if c.get("moeda") and c["moeda"] != "JPY":
                erros.append("%s: card %s em %s. Comparavel em moeda misturada e pior que "
                             "comparavel nenhum -- confira o location JP/ja"
                             % (rot, c.get("id"), c["moeda"]))
    return n


def confere_fila(erros):
    d = ler(os.path.join(VARRED, "fila.json"))
    if not d:
        return 0
    if not d.get("_o_que_isto_nao_e"):
        erros.append("fila.json: sem o cabecalho que diz que NAO e recomendacao de compra")
    for linha in d.get("fila") or []:
        rot = "fila.json %s" % linha.get("id")
        h = linha.get("hipoteses") or {}
        ents = h.get("entidades")
        if ents is not None and not ents.get("e_hipotese"):
            erros.append("%s: entidades de titulo sem a marca e_hipotese. Titulo de Mercari "
                         "e SEO, nao fato" % rot)
        if ents is not None and ents.get("origem") != "titulo":
            erros.append("%s: entidades sem origem declarada" % rot)
        tipo = h.get("tipo")
        if tipo is not None and not tipo.get("estimada"):
            erros.append("%s: classe de volume sem a marca `estimada` -- ela sai do titulo, "
                         "nao de medida" % rot)
        if "preco_brl_estimado" in linha and not linha.get("preco_e_estimado_porque"):
            erros.append("%s: preco estimado sem dizer por que e estimado" % rot)
        dat = linha.get("datacao")
        if dat and dat.get("confianca") != "hipotese_de_titulo":
            erros.append("%s: datacao por titulo sem confianca de hipotese" % rot)
    return len(d.get("fila") or [])


def confere_descartados(erros):
    d = ler(os.path.join(VARRED, "descartados.json"))
    if d is None:
        erros.append("descartados.json NAO existe. Descartar e escolher: filtro que nao se "
                     "audita E a IA escolhendo produto")
        return 0
    for x in d.get("descartados") or []:
        if not x.get("motivo"):
            erros.append("descartados.json: %s descartado sem motivo" % x.get("id"))
        if not x.get("titulo_ja"):
            erros.append("descartados.json: %s sem o titulo, nao da pra auditar o descarte"
                         % x.get("id"))
    return len(d.get("descartados") or [])


def confere_comparaveis(erros):
    d = ler(os.path.join(VARRED, "comparaveis.json"))
    if not d:
        return 0
    if not d.get("_o_que_isto_nao_e"):
        erros.append("comparaveis.json: sem o cabecalho que separa contar anuncio de dizer "
                     "quanto a peca vale")
    minimo = d.get("_n_minimo") or N_MINIMO_ESPERADO
    for b in d.get("baldes") or []:
        rot = "comparaveis %s" % (b.get("chave") or {})
        if b.get("chave_confianca") != "hipotese":
            erros.append("%s: chave sem a marca de hipotese -- ela sai de titulo" % rot)
        tem_numero = "anunciado_quando_saiu_jpy" in b
        if tem_numero and b.get("n", 0) < minimo:
            erros.append("%s: publica numero com n=%d, abaixo do minimo %d. Com esta amostra "
                         "o numero e anedota com cara de estatistica" % (rot, b.get("n"), minimo))
        if not tem_numero and not b.get("sem_base"):
            erros.append("%s: sem numero e sem dizer por que" % rot)
        if not b.get("ids"):
            erros.append("%s: sem os ids que produziram o balde" % rot)
    return len(d.get("baldes") or [])


def main():
    if not os.path.isdir(VARRED):
        print("nada em %s (rode varrer.py antes)" % VARRED)
        return 1
    erros = []
    n_cards = confere_cards(erros)
    n_fila = confere_fila(erros)
    n_fora = confere_descartados(erros)
    n_baldes = confere_comparaveis(erros)

    for arquivo in ("fila.json", "descartados.json", "comparaveis.json"):
        d = ler(os.path.join(VARRED, arquivo))
        if not d:
            continue
        for chave in chaves_proibidas(d):
            erros.append("%s: nota agregada proibida em '%s'" % (arquivo, chave))

    for e in erros:
        print("  ERRO   %s" % e)
    print()
    print("cards %d | fila %d | descartados %d | baldes %d -> %d violacao(oes)"
          % (n_cards, n_fila, n_fora, n_baldes, len(erros)))
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
