---
tipo: marca
projeto: motor-ofertas
status: kit gerado (aguarda escolha do mark e do vermelho)
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

## Duas decisões ainda abertas

**1. Qual vermelho é o oficial.** O disco do Caio é `#fe0000` (puro), e o site usa `--red #c82a2a`. Rodar os dois faz a marca parecer duas marcas. O kit está gerado com **`#e60000`** (o hinomaru que o próprio Caio usou na primeira logo): segura o impacto do disco sem berrar como o puro. Se preferir outro, muda `RED` no `build.py` e roda de novo.

**2. Qual é o mark.** O kit saiu com o **disco + quadrado** (as duas formas da logo, sem letra: lê em qualquer tamanho, mas é abstrato sem o nome do lado). Os outros dois candidatos estão em `logo.html`: o **NS / C + disco** (o bloco reduzido ao núcleo, mais fiel à primária) e o **N + disco** (o mais legível e o menos ownable).

## Ainda não aplicado

A LP, os posts, os stories e os destaques continuam com a **brandline improvisada** (bandeirinha xadrez em `conic-gradient` + Anton). Trocar pela logo oficial é a próxima passada, depois que as duas decisões acima fecharem.
