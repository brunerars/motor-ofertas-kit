# Direção B — página de revista japonesa de banca

Exploração de diagramação para o carrossel de feed da Nippon Speed Co., em cima do
mesmo conteúdo do post `04-suzuka-cobrou-duas-vezes` (que tirou 25/40 no critique e
falhou o teste de AI slop). **Mesmos tokens do `DESIGN.md`** (Anton, Archivo, ink,
paper, red, redBright, logoRed). Nenhuma cor nova, nenhuma fonte nova. O que muda é
a composição.

## A referência, com nome

**Racing On** e **Auto Sport (オートスポーツ)**, revistas japonesas de automobilismo de
banca, 1989–1992 — e os *mooks* de corrida da mesma família. Não é specimen de
fundição, não é editorial-typographic de 2026. É impresso barato, colorido, apertado,
com muita informação por página:

- **Hashira** (柱, running head) na margem externa, alternando verso/recto.
- **Nombre** (ノンブル, número de página) num quadrado de tinta vermelha colado na quina.
- **Legenda vertical** rente à foto (latim rotacionado 90°, como toda revista japonesa faz).
- **Ficha de dados** com fio grosso e rótulo curto.
- Fotos de **tamanhos desiguais**, sangrando por bordas diferentes a cada página.
- Coluna de texto **estreita** — a página se resolve por densidade, não por centralização.

A matéria é paginada como uma matéria real de 6 páginas: **p.32 a p.37**. O número de
página é sistema, não andaime — ele conta o que a marca quer contar (isso é uma
matéria de revista, não um slide).

## O que ataca as 3 lacunas do critique

**1. A página como campo, não como pilha.** Nenhum slide repete o corte do outro.
p.32 abre com foto sangrando por duas bordas e a tarja de título entrando por baixo
dela; p.33 tem a foto no canto superior esquerdo e o texto embaixo, à esquerda, com
a ficha ao lado; p.34 inverte tudo (título no alto, faixa de foto atravessando a
página inteira, corpo em **duas colunas**); p.35, o clímax, é foto full-bleed com a
tarja vermelha do título invadindo pela esquerda; p.36 não tem foto e mesmo assim
não tem buraco; p.37 fecha com faixa vermelha sangrada no pé. A margem externa
alterna esquerda/direita a cada página, então nem o eixo do bloco de marca é fixo.

**2. Segundo canal de leitura.** Toda página tem legenda de foto **e** ficha de
dados. A ficha não é enfeite: ela carrega a espinha da história em forma de tabela —
p.33 diz `SENNA McLaren / PROST McLaren`, p.35 diz `SENNA McLaren / PROST Ferrari`.
Quem para no slide entende a virada sem ler o corpo. A p.36 fecha com uma linha do
tempo 1989 → 1990 → 1991. Nada nas fichas é fato novo: tudo já está no corpo do texto.

**3. Crédito de foto embutido, que resolve risco real.** As 4 fotos históricas são
de terceiros (Pinterest), sem licença. Cada legenda termina com
`Foto: arquivo, autoria não identificada.` — e a foto da peça, que é nossa, diz
`Foto: acervo Nippon Speed Co.`, o que prova que o sistema é real e não decorativo.

**4. Coluna estreita mata o buraco da p.36.** O slide tipográfico (antigo slide 5,
com ~330px vazios em cima, ~350px embaixo e 300px à direita) agora tem: título em
medida estreita, corpo numa coluna de 520px, marginália vertical, um pull-quote
vertical em Anton vermelho ocupando a margem externa, e a linha do tempo no pé.
Zero campo morto.

## O "Nippon" ganha corpo gráfico

Antes a japonesidade da marca era um disco vermelho. Aqui ela vem da **gramática de
página**: tategaki (texto vertical) rente à foto, hashira na margem externa, nombre
na quina, densidade de mook. Não usa kanji nem kana **de propósito** — o sistema não
controla a fonte de fallback CJK do dispositivo e um caractere renderizado por uma
família que não está no design system seria drift de identidade disfarçado de
referência.

## Regras duras cumpridas

- **Zero eyebrow tracked acima de título.** Nenhum slide tem. O carimbo de seção vive
  na margem, em Anton, é vertical, e muda a cada página (`ABERTURA / 1989 · A CORRIDA
  / 1989 · A MESA / 1990 · A CONTA / 1991 · A ADMISSÃO / ACERVO`), sempre acoplado ao
  número da página. É running head, não kicker.
- **Zero marcador 01/02/03** e zero dots. A numeração é 32–37, de matéria de revista.
- **Coerência temporal por slide:** p.33 e p.34 usam foto de 1989, p.35 usa a de 1990.
- **Diacrítico em Anton:** `line-height 1.2` no nome da peça (`BONÉ … JAPÃO`).
- **Detector `impeccable`: exit 0, sem nenhum waiver inline.** O post atual precisava
  de waiver para `tight-leading`; este não precisa (os títulos são heading, o corpo
  roda em 1.5).

## Defeitos consertados no caminho (achados só lendo os PNGs)

- Imagem posicionada com `left` + `right` + `width:auto` ignora o `right` e resolve
  pela proporção intrínseca: cortou o Prost fora da capa e encolheu a faixa da p.34.
  Largura agora é sempre explícita.
- `line-height .92` fazia a vírgula de "PISTA," descer dentro da linha de baixo e ler
  como apóstrofo depois de "MESA".
- `link na bio` em Anton caixa baixa lê **`llnk na blo`** — o pingo do "i" some no
  peso da haste. Defeito herdado do post atual; aqui o handle é Archivo 800.
- Piso tipográfico: o PNG de 1080 é exibido na largura do celular (~390pt), então
  todo tamanho vale ~0,36× na tela. Legenda subiu de 19px (7pt no celular, ilegível)
  para 23px; corpo 33px; menor texto da página 18px, em caixa alta.

## Onde ela é fraca (honestamente)

- **Densidade cobra atenção.** É o oposto do carrossel que se lê rolando. Se o público
  do feed não parar, metade do trabalho (legenda + ficha) não é vista. A aposta é que
  a marca ganha autoridade justamente por ter o que só quem para enxerga.
- **A p.35 (clímax) não mostra os dois carros inteiros.** A foto é 16:9 e o slide é
  3:4: full-bleed guarda ~42% da largura original. Dá pra ler McLaren + Ferrari, mas
  a composição original do fotógrafo se perde. Quem quiser os dois carros inteiros
  precisa abrir mão do full-bleed.
- **A margem externa vazia** no canto superior direito da p.33 e da p.37 é margem de
  revista de verdade, mas num carrossel pode ler como "sobrou espaço".
- **Rótulos em caixa alta tracked** existem (fichas e running head). São tabela e
  fólio, não kicker de seção — mas é a fronteira mais fina da direção, e é onde ela
  escorregaria se alguém copiasse o sistema sem entender o que ele carrega.
- A ficha da p.37 quebra `Traçado bordado em dourado` em duas linhas. Cabe, mas não
  é elegante; ou o rótulo encurta ou o valor encurta.

## Arquivos

`post.html` (6 slides isolados por `#s1..#s6`, `.slide:target`, sem reveal por classe)
· `capa.jpg` `s2.jpg` `s3.jpg` `s4.jpg` `foto.jpg` · `slide-1..6.png` (1080×1440).

Render: Edge headless, `--window-size=1080,1440 --virtual-time-budget=6000`, um PNG
por âncora.
