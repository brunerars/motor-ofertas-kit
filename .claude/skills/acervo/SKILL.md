---
name: acervo
description: Baixa as fotos de itens CURADOS do Mercari (URLs fornecidas por Bruno/Caio) pra biblioteca de fotos da marca (marca/acervo/). Alimenta a vitrine da LP e os posts. NÃO traduz nem precifica (isso é o /agenda). Use quando o Bruno mandar URL(s) de peça(s) do Mercari pra montar/abastecer o acervo de uma marca.
---

# Acervo — fotos curadas do Mercari → biblioteca da marca

Abastece a **biblioteca de fotos** de uma marca a partir de itens do Mercari. A vitrine da `/lp`, os posts (`/conteudo` + `/nanobanana`) e futuras telas bebem daqui.

> **Regra dura — curadoria é humana.** A IA NUNCA descobre/escolhe produto (são milhares no Mercari; garimpo é know-how do Caio). Bruno/Caio fornecem as **URLs curadas**; esta skill só processa a lista dada. Sem URL, não roda.
> **Desacoplada:** só pega FOTOS (+ título p/ tag). NÃO traduz descrição nem calcula preço — isso é responsabilidade do `/agenda`.

## Input
- 1+ URLs de item do Mercari (`https://jp.mercari.com/item/mXXXXXXXX`), coladas ou num arquivo.
- (opcional) tags por item (ex: `boné`, `ferrari`, `honda`, `90s`).
- Marca-alvo → salva em `<projeto>/marca/acervo/` (default: projeto atual, ex: `projetos/motor-ofertas/`).

## Fluxo
1. **Confirmar as URLs** recebidas (listar). Se nenhuma, parar e pedir.
2. Pra cada URL, **extrair fotos + título via Firecrawl** (só isso). Key `FIRECRAWL_API_KEY` do `.env` do projeto.
3. **Baixar** as fotos pra `marca/acervo/<id>/1.jpg … N.jpg`.
4. Gravar `marca/acervo/<id>/meta.json` = `{id, source_url, title_ja, sold, tags, fetched, photos:[...]}`.
5. Atualizar `marca/acervo/index.json` (lista de todos os itens → vitrine/posts consomem).
6. Reportar: nº de itens, nº de fotos, e qualquer falha (URL que não resolveu, foto 404).

## Comando (por URL)
```bash
BASE="<caminho-do-projeto>"                 # ex: projetos/motor-ofertas
set -a; source "$BASE/.env"; set +a
URL="https://jp.mercari.com/item/mXXXXXXXX"
ID=$(echo "$URL" | grep -oE 'm[0-9]+')
mkdir -p "$BASE/marca/acervo/$ID"
# 1) Firecrawl: SÓ fotos + título (nada de traduzir/precificar)
curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" -H "Content-Type: application/json" \
  -d "{\"url\":\"$URL\",\"formats\":[\"json\"],\"jsonOptions\":{\"prompt\":\"Extract only the product title and all photo URLs.\",\"schema\":{\"type\":\"object\",\"properties\":{\"title\":{\"type\":\"string\"},\"sold\":{\"type\":\"boolean\"},\"image_urls\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}},\"waitFor\":3500}" \
  > "$BASE/marca/acervo/$ID/_raw.json"
# 2) baixar cada foto (dedup por índice; usar PYTHONIOENCODING=utf-8 no Windows p/ título JA)
PYTHONIOENCODING=utf-8 python - "$BASE/marca/acervo/$ID" "$URL" <<'PY'
import sys,json,os,urllib.request
d=json.load(open(sys.argv[1]+'/_raw.json',encoding='utf-8'))['data']['json']
urls=[]
[urls.append(u) for u in d.get('image_urls',[]) if u not in urls]
# CDN do Mercari (static.mercdn.net) BLOQUEIA Python-urllib → 403. Precisa User-Agent de browser + Referer.
HDRS={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','Referer':'https://jp.mercari.com/'}
photos=[]
for i,u in enumerate(urls,1):
    p=f"{i}.jpg"
    try:
        req=urllib.request.Request(u,headers=HDRS)
        with urllib.request.urlopen(req,timeout=30) as r, open(os.path.join(sys.argv[1],p),'wb') as f: f.write(r.read())
        photos.append(p)
    except Exception as e:
        print('FALHA',u,e)
meta={"id":os.path.basename(sys.argv[1]),"source_url":sys.argv[2],
      "title_ja":d.get('title'),"sold":d.get('sold'),"tags":[],"photos":photos}
json.dump(meta,open(sys.argv[1]+'/meta.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print("OK",meta['id'],len(photos),"fotos")
PY
```
> `waitFor` ~3500ms (Mercari é JS-pesado). Fotos em `static.mercdn.net/item/detail/orig/photos/<id>_N.jpg` — **download exige User-Agent de browser + Referer** (senão 403). API nova do Firecrawl usa `formats:["json"]` + `jsonOptions{prompt,schema}` no `POST /v1/scrape` (documentado no CLAUDE.md do projeto motor-ofertas).

## index.json (a vitrine consome)
Depois de processar as URLs, montar/atualizar `marca/acervo/index.json` = array de `{id, title_ja, photos:["acervo/<id>/1.jpg",...], tags, sold}`. A `/lp` lê isso pra faixa de exemplos.

## NÃO fazer
- Não traduzir descrição nem precificar (é `/agenda`).
- Não descobrir/escolher produto. Input = URL(s) fornecida(s).
- Não versionar a key (vem do `.env`, fora do git).

## Relacionado
`roteiro-lp.md` · `logistica-mercari.md` · memórias `motor-ofertas-nsc`, `vercel-deploy-lp-gotchas`. Curadoria humana no centro do fluxo.
