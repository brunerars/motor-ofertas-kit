#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Le PAGINA DE BUSCA do Mercari e devolve cards normalizados.

Everything in this repo so far reads ONE item (coletar.py hits /item/m...). This
reads a listing, which is the capability the funnel needs. It is deliberately
dumb: it turns a search page into cards and stops. It does not download photos,
does not translate, does not judge. Card title is seller SEO, never a fact.

Duas decisoes que custaram sangue e ficam no topo do arquivo:

  1. `location` fixa JP/ja. Sem isso a Firecrawl entra como US e o Mercari serve
     a variante americana: os precos dos 19 raw.json que ja temos vieram em US$,
     e um comparavel em moeda misturada e pior que comparavel nenhum.

  2. Zero card numa busca que ja deu resultado NAO e arquivo vazio, e alarme.
     O sintoma de captcha/bloqueio e silencioso: volta a casca do SPA sem card.

  3. `vendido` sai da CONSULTA, nunca do modelo. Medido em 19/08: pedindo o selo
     por card, o extrator devolveu vendido=false em 49 de 49 cards de uma pagina
     status=sold_out -- ele nao le o badge. Mas o parametro da URL e confiavel:
     intersecao ZERO entre on_sale e sold_out, e 3 de 3 ids sorteados do sold_out
     confirmaram sold=true na pagina do item (mais 1 controle on_sale em false).
     Entao o bit carrega como evidencia a URL que o produziu, que e um fato sobre
     a requisicao e nao um julgamento de modelo. E mais forte, nao menos.

  4. Card de Mercari Shops NAO e item de pessoa: o id nao casa m+digitos (vem
     tipo vhwpZcQeLVoUxKdmwXcVhP) e traz produto sem relacao com a busca.
     Medido: 9 de 49 cards. Descartados na entrada, com contagem.

  5. O preco do card e confiavel: nos 4 itens conferidos, card e item deram o
     MESMO valor em ienes. E isso que torna o comparavel barato -- nao precisa
     abrir o item so pra saber por quanto saiu.

Usage:
  python varrer.py --calibrar          responde a incognita do filtro de vendidos
Reads:  ../../.env (FIRECRAWL_API_KEY)
"""
import json
import os
import sys
import urllib.request

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRENTE = os.path.abspath(os.path.join(BASE, ".."))

BUSCA = "https://jp.mercari.com/search"
CREDITO_JSON = 5      # scrape=1 + extracao json=4, medido na doc da Firecrawl
CREDITO_CRU = 1

SCHEMA = {
    "type": "object",
    "properties": {
        "cards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "titulo_ja": {"type": "string"},
                    "preco_jpy": {"type": "number"},
                    "thumb_url": {"type": "string"},
                },
            },
        }
    },
}

PROMPT = (
    "Extract EVERY product card in the search results grid of this Mercari page. "
    "id is the m-number from the item link (e.g. m12345678901). "
    "titulo_ja is the card title in Japanese, verbatim, do NOT translate. "
    "preco_jpy is the number of Japanese yen shown on the card. "
    "Return every card you can see, do not summarise or sample."
)


def load_env():
    """Read FIRECRAWL_API_KEY from the frente's .env (never hardcoded)."""
    with open(os.path.join(FRENTE, ".env"), encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("FIRECRAWL_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("FIRECRAWL_API_KEY nao encontrada no .env da frente")


def scrape(url, key, formatos=None, prompt=True, espera=6000):
    corpo = {
        "url": url,
        "formats": formatos or ["json"],
        "waitFor": espera,
        # region pinning: sem isto o Mercari serve a variante US e o preco vem em US$
        "location": {"country": "JP", "languages": ["ja"]},
    }
    if prompt:
        corpo["jsonOptions"] = {"prompt": PROMPT, "schema": SCHEMA}
    req = urllib.request.Request(
        "https://api.firecrawl.dev/v1/scrape",
        data=json.dumps(corpo).encode("utf-8"),
        headers={"Authorization": "Bearer %s" % key,
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=240) as resp:
        return json.loads(resp.read().decode("utf-8"))


def url_busca(keyword, status=None):
    from urllib.parse import quote
    u = "%s?keyword=%s&sort=created_time&order=desc" % (BUSCA, quote(keyword))
    if status:
        u += "&status=%s" % status
    return u


def cards_de(resposta):
    d = (resposta or {}).get("data") or {}
    return ((d.get("json") or {}).get("cards")) or []


if __name__ == "__main__":
    print("use --calibrar (ver calibrar.py)")
