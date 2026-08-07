#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Coleta a materia-prima de curadoria de um item do Mercari.

Extends the /acervo skill: that one grabs photos + title only (by design).
Curation needs the full listing surface — description, declared condition,
brand, seller reputation — because that is what the signals are read from.

Usage:  python coletar.py <url> [<url> ...]
Writes: curadoria/pecas/<id>/{raw.json, dados.json, 1.jpg..N.jpg}
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRENTE = os.path.abspath(os.path.join(BASE, ".."))
PECAS = os.path.join(BASE, "pecas")

# Browser headers: static.mercdn.net returns 403 for python-urllib (known gotcha)
IMG_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124 Safari/537.36"
    ),
    "Referer": "https://jp.mercari.com/",
}

SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "price_jpy": {"type": "number"},
        "condition": {"type": "string"},
        "brand": {"type": "string"},
        "category": {"type": "string"},
        "shipping_from": {"type": "string"},
        "shipping_payer": {"type": "string"},
        "seller_name": {"type": "string"},
        "seller_rating_good": {"type": "number"},
        "seller_rating_bad": {"type": "number"},
        "sold": {"type": "boolean"},
        "likes": {"type": "number"},
        "image_urls": {"type": "array", "items": {"type": "string"}},
    },
}

PROMPT = (
    "Extract the full listing data for this Mercari item. Keep the Japanese "
    "text verbatim for title and description — do NOT translate. "
    "condition is the seller-declared item condition (商品の状態). "
    "brand is the listed brand (ブランド) or empty if none. "
    "seller_rating_good/bad are the seller's review counts. "
    "image_urls must contain every product photo URL in page order."
)


def load_env():
    """Read FIRECRAWL_API_KEY from the frente's .env (never hardcoded)."""
    env_path = os.path.join(FRENTE, ".env")
    with open(env_path, encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("FIRECRAWL_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("FIRECRAWL_API_KEY nao encontrada em %s" % env_path)


def scrape(url, key):
    payload = json.dumps(
        {
            "url": url,
            "formats": ["json", "markdown"],
            "jsonOptions": {"prompt": PROMPT, "schema": SCHEMA},
            "waitFor": 4000,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.firecrawl.dev/v1/scrape",
        data=payload,
        headers={
            "Authorization": "Bearer %s" % key,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def baixar_fotos(urls, destino):
    """Dedupe by URL, keep page order, report every failure loudly."""
    vistos, salvos = [], []
    for u in urls:
        if u not in vistos:
            vistos.append(u)
    for i, u in enumerate(vistos, 1):
        nome = "%d.jpg" % i
        try:
            req = urllib.request.Request(u, headers=IMG_HEADERS)
            with urllib.request.urlopen(req, timeout=45) as r:
                dados = r.read()
            with open(os.path.join(destino, nome), "wb") as f:
                f.write(dados)
            salvos.append(nome)
        except Exception as exc:  # noqa: BLE001 - want the reason in the report
            print("  FALHA foto %d: %s" % (i, exc))
    return salvos


def processar(url, key):
    match = re.search(r"m\d+", url)
    if not match:
        print("URL sem id de item: %s" % url)
        return None
    item_id = match.group(0)
    destino = os.path.join(PECAS, item_id)
    os.makedirs(destino, exist_ok=True)

    print("[%s] scraping..." % item_id)
    bruto = scrape(url, key)
    with open(os.path.join(destino, "raw.json"), "w", encoding="utf-8") as f:
        json.dump(bruto, f, ensure_ascii=False, indent=2)

    dados = (bruto.get("data") or {}).get("json") or {}
    if not dados:
        print("  SEM DADOS estruturados — conferir raw.json")
        return None

    fotos = baixar_fotos(dados.get("image_urls") or [], destino)
    dados["id"] = item_id
    dados["source_url"] = url
    dados["photos"] = fotos
    dados["fetched"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(os.path.join(destino, "dados.json"), "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

    print(
        "  OK  %s | %s JPY | %d fotos | condicao: %s"
        % (
            (dados.get("title") or "")[:40],
            dados.get("price_jpy"),
            len(fotos),
            dados.get("condition"),
        )
    )
    return dados


def main():
    urls = sys.argv[1:]
    if not urls:
        raise SystemExit("uso: python coletar.py <url_mercari> [...]")
    key = load_env()
    os.makedirs(PECAS, exist_ok=True)
    ok = 0
    for url in urls:
        try:
            if processar(url, key):
                ok += 1
        except urllib.error.HTTPError as exc:
            print("[%s] HTTP %s: %s" % (url, exc.code, exc.read()[:200]))
        except Exception as exc:  # noqa: BLE001
            print("[%s] ERRO: %s" % (url, exc))
    print("\n%d/%d itens coletados em %s" % (ok, len(urls), PECAS))


if __name__ == "__main__":
    main()
