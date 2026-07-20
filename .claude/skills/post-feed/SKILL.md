---
name: post-feed
description: Gera um carrossel NARRATIVO pro FEED (Instagram) da marca — história primeiro (capa + capítulos com foto de arquivo curada ou gráfico line-art), e o produto só no último slide como desfecho + CTA pro grupo. Design system V1, 4:5 (1080x1350) → PNG + legenda. FEED = autoridade/branding, NÃO vende. Use quando o Bruno pedir um post de storytelling/história pro feed.
---

# Post Feed — carrossel narrativo (autoridade + branding)

O FEED conta HISTÓRIA. A marca vira referência de cultura de automobilismo; a venda acontece noutro canal (stories/fixados/WhatsApp → skill `/post-stories`). Aqui o produto entra **só no último slide**, como recompensa emocional + CTA pro grupo. Ver [[nsc-conteudo-dois-canais]].

> **Regras duras**
> - **Sem badge de venda** e sem preço. O feed não é catálogo.
> - **Fato tem que ser real** — não inventar era/ano/piloto. Na dúvida, suavizar ou perguntar. [[rigor-em-conclusao-de-dados]]
> - **Voz do Bruno**: sem travessão, redondo e direto. [[voz-bruno-redondo]]
> - **Curadoria/licenciamento de foto é HUMANA** (Bruno+Caio). Foto de arquivo de terceiros (Pinterest etc.) = risco de copyright em feed comercial → só entra se o Bruno curar/liberar. Foto da própria peça é sempre segura. Sem foto, o capítulo vira design-system puro (line-art/tipografia).

## Input
- **Tema** da história (ex: "Suzuka 1990", "Senna x Prost", "era vermelha da Ferrari"). Pode sair do banco `marca/conteudo/ideias-feed.md`.
- **Peça de amarração** (opcional mas recomendado): id do acervo (`marca/acervo/<id>/`) que fecha a história no último slide.
- **Fotos por fase** (opcional): imagens curadas pelo Bruno, uma por capítulo. Sem elas, os capítulos ficam design-system puro.

## Fluxo
0. **Capa com imagem** (padrão): a capa do post de entretenimento leva uma **imagem de impacto curada pelo Bruno** (`capa.jpg`), full-bleed + escurecido + título grande por cima (padrão ESCURO). Sem imagem ainda → capa tipográfica (glow+grain), pronta pra receber a foto depois.
1. **Escrever o arco** (história primeiro): capa (gancho) → 3-4 capítulos (cada um: kicker + título Anton + 2-3 linhas punchy) → slide da peça + CTA. Fato checado.
2. **Montar o HTML** a partir de `template.html` (design system V1). Cada capítulo:
   - **com foto**: foto sangra do topo (`.ph`, ~58%) + texto na faixa tinta de baixo. Ajustar `object-position` por foto pra enquadrar o essencial. Copiar as fotos curadas pra pasta do post (`s2.jpg`, `s3.jpg`...).
   - **sem foto**: slide tipográfico puro (`.slide-ink`: kicker + título + corpo), opcional line-art (traçado do circuito, diagrama) dentro do `.story-block`.
   Dots de progresso por slide (NUNCA marcadores "01/02/03" → aciona o impeccable).
3. **Slide da peça** (último): foto da peça (`marca/acervo/<id>/`) emoldurada em **fundo ESCURO** (`slide-ink` — é entretenimento, não card de venda; branco é só `/post-stories`) + amarração ("essa peça carrega essa história") + CTA pro grupo (`link na bio · @handle`). **Sem badge.**
4. **Render** headless (comando abaixo) → `slide-1..N.png`. Conferir enquadramento/legibilidade abrindo os PNGs.
5. **Legenda** (`legenda.md`): caption na voz do Bruno + hashtags de nicho + **nota de licenciamento** das fotos de arquivo usadas.
6. **impeccable detect = 0** (waivers do V1 já no template).
7. **Entregar pro Bruno revisar**. Publicação é manual dele.

## Saída
`<projeto>/marca/conteudo/storytelling/<NN>-<slug>/` com `post.html` + `s2..N.jpg` (fotos de arquivo) + `foto.jpg` (peça) + `slide-1..N.png` + `legenda.md`.
> Nome da pasta: prefixo numérico e **sem `#` nem espaço** — o `#` quebra a URL `file:///...#s1` do render.

## Render (por slide)
```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho-absoluto-da-pasta-do-post>"
for n in 1 2 3 4 5; do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1350 --virtual-time-budget=6000 \
    --screenshot="$DIR/slide-$n.png" "file:///$DIR/post.html#s$n"
done
```
> `--virtual-time-budget=6000` deixa fontes (Google CDN) e grão assentarem. Slides isolados por `#s1..#sN` (CSS `.slide:target`).

## Referência (post aprovado 08/07, revisado 13/07)
`marca/conteudo/storytelling/01-suzuka1990/` — o Suzuka 1990 (capa + 3 capítulos com foto + peça + CTA). É o molde vivo, além do `template.html`.
> **Voz:** nome de piloto sem artigo ("Senna avisou", não "o Senna avisou") e retomada variada (o francês, o brasileiro, ele). Artigo antes do nome soa oral demais e desumaniza o texto.

## NÃO fazer
- Nada de badge/preço/venda no feed (isso é `/post-stories`).
- Não publicar foto de arquivo de terceiros sem o Bruno licenciar/aprovar.
- Não inventar fato histórico.

## Relacionado
`marca/conteudo/ideias-feed.md` (banco de temas) · skill `/post-stories` (venda) · memórias [[nsc-conteudo-dois-canais]] · [[producao-conteudo-direcao]] · [[impeccable-detector-gotchas]] · [[voz-bruno-redondo]].
