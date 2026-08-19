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
import re
import sys
import time
import urllib.request

# O console do Windows e cp1252: uma seta ou um acento na saida derruba o
# script com UnicodeEncodeError. Foi assim que o caminho de CONTRADICAO --
# justamente o mais util -- morria antes de imprimir o diagnostico.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRENTE = os.path.abspath(os.path.join(BASE, ".."))

BUSCA = "https://jp.mercari.com/search"
BUSCAS = os.path.join(BASE, "buscas.json")
VARREDURA = os.path.join(BASE, "varredura")
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
        # a busca do Mercari e SPA pesada e ja devolveu 408 com o default da
        # Firecrawl. Folga explicita, medida: os scrapes bons levaram 24-44s.
        "timeout": 150000,
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


def normaliza_cards(brutos, busca, url, status, hoje):
    """Card cru -> card do nosso schema, ja limpo do que nao e item de pessoa.

    Mercari Shops sells through the same search grid with a different id shape
    and, in practice, unrelated stock: a women's suit set came back inside a
    search for F1 jackets. Dropping it here, with a count, keeps the noise out of
    every downstream number instead of having each consumer re-discover it.
    """
    saida, shops = [], 0
    for i, c in enumerate(brutos, 1):
        cid = (c.get("id") or "").strip()
        if not re.fullmatch(r"m\d+", cid):
            shops += 1
            continue
        saida.append({
            "id": cid,
            "url": "https://jp.mercari.com/item/%s" % cid,
            "titulo_ja": c.get("titulo_ja") or "",
            "preco_jpy": c.get("preco_jpy"),
            "moeda": "JPY",
            "vendido": status == "sold_out",
            # o bit carrega a URL que o produziu: e fato sobre a requisicao,
            # nao julgamento de modelo. O extrator NAO le o selo do card.
            "vendido_fonte": url,
            "thumb_url": c.get("thumb_url"),
            "posicao": i,
            "busca": busca,
            "visto_em": hoje,
        })
    return saida, shops


def varre_uma(busca, status, key, hoje, refazer=False):
    slug = busca["slug"]
    destino = os.path.join(VARREDURA, "%s-%s" % (slug, status), hoje)
    alvo = os.path.join(destino, "cards.json")
    if os.path.exists(alvo) and not refazer:
        print("   ja existe (use --refazer): %s" % alvo)
        return None
    url = url_busca(busca["keyword"], status)
    r = scrape(url, key)
    brutos = cards_de(r)
    cards, shops = normaliza_cards(brutos, slug, url, status, hoje)
    if not brutos:
        # Falha ALTO de proposito: o sintoma de captcha/bloqueio e a casca do SPA
        # sem card nenhum. Arquivo vazio em silencio viraria "o mercado secou".
        print("   ALARME: 0 card. Ou a busca nao tem resultado, ou tomamos bloqueio.")
    os.makedirs(destino, exist_ok=True)
    with open(alvo, "w", encoding="utf-8") as fh:
        json.dump({
            "_schema": ("Cards de uma pagina de busca do Mercari. NAO e peca periciada: "
                        "titulo e preco, mais o estado. Titulo e SEO do vendedor, nunca "
                        "fato -- ver METODO.md."),
            "_busca": {"slug": slug, "keyword": busca["keyword"], "status": status,
                       "url": url, "porque": busca.get("porque")},
            "_fonte": {"endpoint": "POST https://api.firecrawl.dev/v1/scrape",
                       "location": "JP/ja", "creditos_estimados": CREDITO_JSON},
            "_descartados_na_entrada": {"mercari_shops": shops,
                                        "porque": "id fora de m+digitos nao e item de pessoa"},
            "_varrido_em": hoje,
            "_total": len(cards),
            "cards": cards,
        }, fh, ensure_ascii=False, indent=2)
    print("   %d card(s) | %d de Shops descartado(s) | %s" % (len(cards), shops, alvo))
    return cards


def main():
    hoje = time.strftime("%Y-%m-%d")
    refazer = "--refazer" in sys.argv
    cfg = json.load(open(BUSCAS, encoding="utf-8")) if os.path.exists(BUSCAS) else None
    if not cfg:
        raise SystemExit("nao achei %s -- as buscas sao fronteira humana" % BUSCAS)
    key = load_env()
    total = 0
    falhas = []
    for b in cfg.get("buscas") or []:
        for status in ("on_sale", "sold_out"):
            print("-> %-28s %s" % (b["slug"], status), flush=True)
            # Uma busca que falha NAO derruba a rodada: as outras continuam e a
            # falha fica dita. Abortar tudo esconderia os cards ja pagos.
            try:
                cards = varre_uma(b, status, key, hoje, refazer)
            except Exception as e:
                falhas.append((b["slug"], status, repr(e)))
                print("   FALHOU: %r" % e, flush=True)
                continue
            if cards is not None:
                total += len(cards)
    print()
    print("total de cards: %d | custo estimado: %d creditos"
          % (total, len(cfg.get("buscas") or []) * 2 * CREDITO_JSON))
    if falhas:
        print("falhas (%d):" % len(falhas))
        for slug, st, err in falhas:
            print("   %s %s -> %s" % (slug, st, err))
    return 0


if __name__ == "__main__":
    sys.exit(main())
