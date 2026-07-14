---
tipo: marca
projeto: motor-ofertas
status: kit fechado (vermelho e favicon decididos 13/07)
---

# Kit de logo — Nippon Speed Co.

A logo é o **bloco do Caio**: NIPPON com o disco vermelho preenchendo o vazio da linha, SPEED CO. embaixo fechando a mesma largura, e o ponto final virando um **quadrado preto**. A gramática é **círculo vermelho contra quadrado preto**: o Japão contra o xadrez.

## Os arquivos

| Arquivo | Onde usar |
|---|---|
| `logo-primaria.svg` · `-dark` · `-mono` | A logo. Grande: capa, hero, camiseta, assinatura. |
| `logo-horizontal.svg` · `-dark` · `-mono` | Onde o bloco é alto demais: nav, rodapé, topo dos posts. |
| `mark.svg` · `-light` · `-transparente` | Avatar, favicon, etiqueta. É o disco e o quadrado sozinhos. |
| `png/` | Os mesmos, rasterizados: `@2x`, `@3x`, `favicon-32/64`, `avatar-instagram-1080`. |
| `logo.html` | A fonte viva (CSS + tipografia). É daqui que tudo sai. |
| `build.py` · `raster.py` | Regeram o kit inteiro. Editou o `build.py`, roda os dois. |
| `Anton-Regular.ttf` | A fonte (OFL). Fica aqui porque o `build.py` precisa dela pra converter em path. |

**Os SVG são vetor de verdade:** o texto foi convertido em `<path>`, não é `<text>`. Isso importa porque `<text font-family="Anton">` só renderiza certo em máquina que tenha Anton instalada, e a gráfica, a bordadeira e o Illustrator do cliente não têm. Como está, abre igual em qualquer lugar.

## As medidas (tiradas da arte do Caio)

A fonte **é Anton** — a mesma que a LP, os posts e os destaques já usam. Isso foi conferido sobrepondo a reconstrução ao original: erro de **0,2% na primeira linha e 0,4% na segunda**.

Normalizado em `em` (base = tamanho da fonte):

| | Valor |
|---|---|
| Disco | `.757em` |
| Espaço NIPPON → disco | `.15em` |
| Quadrado | `.17em`, assentado na base |
| Tracking linha 1 (NIPPON) | `.022em` |
| Tracking linha 2 (SPEED CO) | `.037em` (é o que fecha a largura da linha de cima) |
| Entrelinha | `.97em` |
| Cap-height do Anton | `.859em` |

## Regras de uso

- **Não use o bloco pequeno.** Abaixo de ~120px de largura, "SPEED CO." vira borrão. Aí é a horizontal; abaixo de 64px, é o mark.
- **Respiro:** margem livre em volta de pelo menos a altura de um "N".
- **Não estique, não incline, não troque a fonte, não recolora o disco** fora da paleta abaixo.
- **Mono** (1 cor): o disco vira tinta. É essa versão que vai pro bordado e pro carimbo.

## As duas decisões (fechadas em 13/07)

**O vermelho oficial é `#e60000`.**
> ⛔ **Nunca usar `#fe0000`.** É a cor oficial da Ferrari. O disco da arte original do Caio veio nesse tom e foi trocado. Qualquer arte nova (post, story, LP, etiqueta) usa `#e60000`.

O `#e60000` é o hinomaru que o próprio Caio já tinha usado na primeira logo, e segura o impacto do disco sem berrar. O site ainda usa `--red #c82a2a` nos acentos de interface (botão, filete, kicker): isso é interface, não marca. **O disco da logo é sempre `#e60000`.**

**O favicon e o avatar são o wordmark em fundo branco**, não um símbolo abstrato. Duas versões geradas, comparadas lado a lado em `favicon-comparacao.png` nos tamanhos reais (180, 64, 32 e dentro da aba do navegador):

- `favicon-wordmark.svg` — **NIPPON SPEED CO.** (completo, fiel à logo).
- `favicon-wordmark-curto.svg` — **NIPPON SPEED.** (menos letras, e por isso **lê melhor a 32px**).

O `png/favicon-32.png`, `favicon-64.png`, `apple-touch-icon-180.png` e `avatar-instagram-1080.png` estão saindo do **completo**. Pra trocar pro curto, é uma linha no `raster.py`.

O **mark de formas** (disco + quadrado, `mark.svg`) continua no kit, mas rebaixado: serve pra etiqueta, carimbo e selo, onde não cabe o nome.

## Aplicado (13/07/2026)

A bandeirinha xadrez em `conic-gradient` **saiu de tudo**. No lugar, o **lockup horizontal** (NIPPON ● SPEED CO▪) em CSS puro, com o disco em `#e60000` fixo e o ponto quadrado herdando a tinta do contexto (`currentColor`), o que faz ele funcionar em slide claro e escuro sem regra extra:

- `lp/index.html` — nav, rodapé, card "tem mais no grupo" e o **favicon** (`lp/assets/brand/`, cópia do kit).
- `.claude/skills/post-feed/template.html` e `post-stories/template.html` — todo post novo já nasce com a logo.
- Os 3 storytellings, os 2 stories, o "como funciona", os 2 destaques 9:16 e o carrossel da campanha — **PNGs re-renderizados**.

O bloco (`logo-primaria.svg`) segue reservado pra peça grande: capa, camiseta, assinatura. A LP usa a horizontal porque o bloco de 2 linhas é alto demais pra uma nav de 60px.
