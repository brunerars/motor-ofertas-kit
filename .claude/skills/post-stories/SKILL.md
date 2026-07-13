---
name: post-stories
description: Gera um CARTÃO DE PEÇA pra STORIES / FIXADOS do grupo / WhatsApp (= venda) — foto da peça emoldurada + história curta + badge VERDE "SOB ENCOMENDA" + "fala com a gente". Design system V1, 4:5 (1080x1350) → PNG + legenda. Use quando o Bruno quiser um post de venda de uma peça (do acervo).
---

# Post Stories — cartão de peça (venda)

STORIES, FIXADOS do grupo e WhatsApp são os canais de VENDA. Aqui a peça é a estrela: foto emoldurada + história curta + **badge VERDE "SOB ENCOMENDA"** + "fala com a gente". O feed (branding) é outra skill (`/post-feed`). Ver [[nsc-conteudo-dois-canais]].

> **Regras duras**
> - Badge **VERDE "SOB ENCOMENDA"** (sinal de disponível), NUNCA vermelho "não à venda" (cria objeção).
> - Foto = **da própria peça** (`marca/acervo/<id>/`) — sempre segura de direito autoral.
> - História curta e **factual** (time, ano, contexto); voz do Bruno sem travessão. [[voz-bruno-redondo]] [[rigor-em-conclusao-de-dados]]

## Input
- **Peça**: id do acervo (`marca/acervo/<id>/`). Escolher a melhor foto hero (default `1.jpg`).
- **Tag** (ex: "Boné · Schumacher"), **nome** curto (Anton), **história** (2-3 linhas).

## Fluxo
1. **Ver as fotos** da peça (`marca/acervo/<id>/*.jpg`), escolher o melhor hero e **confirmar o que é** (pra história factual — não confiar só no título do vendedor).
2. Copiar a foto escolhida → `conteudo/<slug>/foto.jpg`.
3. Preencher `template.html`: `.tag`, `<h1 class="name">`, `.story`, e o `object-position` da `.frame img` (enquadramento). O badge já é verde "Sob encomenda".
4. **Render** headless (comando abaixo) → `post.png`. Conferir enquadramento abrindo o PNG.
5. **Legenda** (`legenda.md`): tom de venda ("essa é sob encomenda, garimpamos no Japão, chama a gente pra garantir a sua") + hashtags de nicho.
6. **impeccable detect = 0**.
7. Entregar pro Bruno.

## Saída
`<projeto>/conteudo/<slug>/` com `post.html` + `foto.jpg` + `post.png` + `legenda.md`.

## Render
```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho-absoluto-da-pasta-do-post>"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1080,1350 --virtual-time-budget=6000 \
  --screenshot="$DIR/post.png" "file:///$DIR/post.html"
```

## Referência (aprovado 08/07)
`conteudo/story-suzuka90/`, `conteudo/story-dekra-schumacher/`, `conteudo/story-west-mclaren/` (badge verde), além do `template.html`.

## NÃO fazer
- Não usar esse formato no feed (feed = `/post-feed`, narrativo, sem badge).
- Badge nunca vermelho "não à venda".
- Não inventar dado da peça (confirmar pela foto).

## Relacionado
skill `/post-feed` (branding) · `/acervo` (fotos das peças) · memórias [[nsc-conteudo-dois-canais]] · [[voz-bruno-redondo]] · [[impeccable-detector-gotchas]].
