# Direção A — Cartaz de corrida (serigrafia, 1960-70)

Exploração de diagramação pro carrossel de feed da Nippon Speed Co. Mesmo conteúdo do post
`storytelling/04-suzuka-cobrou-duas-vezes`, mesmos tokens do `DESIGN.md`, composição refeita do zero.

## A referência (nomeada, como o brand.md exige)

**Os cartazes oficiais do Grande Prêmio de Mônaco pintados por Michael Turner entre 1962 e 1973**, e a
escola europeia de cartaz de circuito do período (Le Mans, Monza, Nürburgring). O que se copia deles:

- impressão em **2-3 tintas chapadas** — aqui `ink` + `red` + `paper`, e nada mais;
- **faixa de prova no topo** com nome do circuito e a data;
- **tipo enorme medido pra fechar no trim**, hierarquia por tamanho e não por rótulo;
- **imagem reduzida a forma** pela separação de cor;
- **tarja do organizador** no pé da folha;
- marcação de **zebra de curva** como divisor estrutural.

Não é colagem. Serigrafia empilha *camadas registradas*, não recortes. Por isso não tem logo de equipe
espalhado e texto nenhum é carimbado em cima de foto solta — quando o tipo encosta na imagem, ele está
dentro de uma chapa sólida, que é exatamente como a segunda tinta se comporta.

## O que mudou em relação ao post atual

| | post atual (25/40) | direção A |
|---|---|---|
| Lane | documentário esportivo escuro | cartaz de GP em serigrafia |
| Eyebrow tracked | 6 de 6 slides | **0 de 6** |
| Marcador | dots (6 por slide) | nenhum — zebra de curva no lugar, sem paginação |
| Fundo | tinta nos 6 | vermelho · tinta · tinta · tinta · papel · vermelho |
| Foto | sangra do topo + gradiente pra tinta + moldura arredondada | bloco chapado de aresta dura, sem fade, sem raio, sem scrim |
| Foto da capa | janela panorâmica emoldurada | **duotone** (cinza forçado + multiply na chapa vermelha) — vira silhueta, vira forma |
| Título da capa | 158px dentro da margem | 330px + 124px, as duas linhas fechando no mesmo trim direito |
| Gradiente / glow | scrim, fade, dois radiais | **zero**. Tudo chapado |
| Contexto/ano | eyebrow vermelho + `.chap` no canto | faixa de prova full-bleed no topo, com a data numa aba de papel |
| Rodapé | brandline solto | tarja de papel colada no pé, igual nos 6 |

## Sistema (o que se repete de propósito)

Todo slide é a mesma folha impressa: **faixa de prova** (106px, tinta, aba de data em papel) → **campo** →
**zebra** (28px) → **tarja** (100px, papel). O miolo é art-directed por slide; a moldura é de série,
porque cartaz de série tem cabeçalho de série.

A faixa de prova **não é o eyebrow que o critique matou**. O eyebrow era Archivo 26px tracked `.2em`,
vermelho, dentro do bloco de texto e logo acima da headline, repetido em 6 slides. A faixa é Anton 34px
numa barra full-bleed colada no trim superior, com a data no canto oposto: é masthead, e carrega o dado
factual (circuito e ano) que o gate de procedência exige em toda peça de arquivo.

## Onde a direção ganha

- **Capa (s1).** Passa o teste de miniatura com folga: a 110px de largura ainda se lê `SUZUKA` e o campo
  vermelho identifica o post na grade do perfil. A capa atual, no mesmo tamanho, vira barra cinza.
- **Peça (s6).** O boné entra em 566px de altura e é a **única imagem do carrossel em cor cheia** — o
  bordado dourado é o argumento de venda. Tudo em volta é cartaz; ela não é. O nome da peça sai numa
  chapa de papel, que é a legenda do cartaz.

## Onde a direção cede (concessão explícita)

Nos capítulos (s2-s4) a foto de arquivo **não é tratada como forma**: fica em cor cheia, com o corte
duro mas sem duotone. Motivo: ela é a prova de procedência, e a livery (McLaren branco-vermelho, macacão
laranja dos comissários) é o que o colecionador reconhece — reduzir isso a duas tintas mataria o gate
factual do `PRODUCT.md`. Então o capítulo é cartaz **na estrutura** (faixa, corte, chapa, zebra, tarja) e
documento **na imagem**. Foi o corte pedido no brief; é também a parte menos radical do conjunto.

## Regras duras respeitadas

- Tokens: só `ink #111`, `paper #f5f5f5`, `red #c82a2a` e `logoRed #e60000` (apenas o disco do lockup).
  Nenhuma cor nova, nenhuma fonte nova — Anton + Archivo.
- Gate factual: `capa.jpg`/`s2.jpg`/`s3.jpg` são 1989, `s4.jpg` é 1990, `foto.jpg` é a peça de 1990.
  As faixas de prova batem com o ano de cada foto.
- Diacrítico em Anton caixa alta: `line-height 1.2` no nome da peça ("BONÉ OFICIAL / GP DO JAPÃO 1990"),
  que tem É e Ã em linhas consecutivas.
- Sem reveal por classe, sem animação — conteúdo visível por padrão, renderiza em headless.

## Render

```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<esta pasta>"
for n in 1 2 3 4 5 6; do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1440 --virtual-time-budget=6000 \
    --screenshot="$DIR/slide-$n.png" "file:///$DIR/post.html#s$n"
done
```

Detector: `node .claude/skills/impeccable/scripts/detect.mjs marca/conteudo/exploracao/direcao-a-poster/post.html`
→ exit 0. Único waiver: `tight-leading`, com o motivo escrito no topo do `post.html`.
