---
name: Nippon Speed Co.
description: Design system V1 "Editorial Garage" — tinta, vermelho de corrida e tipografia condensada, extraído do template Webflow Haus e aplicado a LP, carrossel de feed e cartão de peça.
colors:
  ink: "#111111"
  paper: "#f5f5f5"
  white: "#ffffff"
  whitesmoke: "#f0efec"
  hair: "#ddddd7"
  darkGrey: "#5d5d5d"
  midGrey: "#676763"
  chapGrey: "#e6e6e2"
  footGrey: "#dcdcd8"
  red: "#c82a2a"
  redInk: "#a31f1f"
  redBright: "#ff5347"
  logoRed: "#e60000"
  stage: "#2a2a2a"
  shadow: "#000000"
  era1989McLarenRed: "#c8102e"
  era1990FerrariRed: "#d10a11"
  era1990SuzukaGold: "#c9a227"
  liveryLotusGreen: "#004225"
  liveryLotusYellow: "#f5d016"
  liveryJpsGold: "#c6a961"
  liveryFerrari70Red: "#d40000"
  liveryMarlboroRed: "#e1140a"
  liveryWilliamsBlue: "#0b3c8c"
  liveryCamelYellow: "#f2c500"
  liveryBenettonGreen: "#00875a"
  liveryWestSilver: "#c9cbd0"
  liveryFerrariModernRed: "#b4021a"
typography:
  display:
    fontFamily: "Anton"
    usage: "títulos, nome da peça, wordmark. Caixa alta sempre."
  body:
    fontFamily: "Archivo"
    usage: "corpo, kicker, CTA, marcadores. Pesos 400-800."
rounded:
  sm: "3px"
  md: "12px"
  pill: "9999px"
---

# Design System — Nippon Speed Co.

> **Procedência:** os tokens NÃO foram inventados. Saíram do template Webflow **Haus** (design humano) via o
> método *Extract HTML Design System* → `marca/referencia/webflow-refencia/design-system2.html`. A
> diagramação dos posts é que é derivada e está em revisão. Ver `PRODUCT.md` para registro e princípios.

## Tema

**Escuro por decisão, não por default.** A cena: colecionador rolando o feed no celular, à noite ou no
intervalo, procurando reconhecer uma era. Tinta `#111` com vermelho de corrida faz a foto de arquivo
saltar; fundo claro lava a imagem e aproxima do catálogo de leilão, que é anti-referência declarada.

**Estratégia de cor: comprometida.** A tinta carrega a maior parte da superfície, o vermelho é acento de
verdade (kicker, marcador ativo, ênfase), e o branco-papel é o texto. Sem terceira cor.

## Cor

| Papel | Token | Valor | Onde |
|---|---|---|---|
| Superfície principal | `ink` | `#111111` | fundo de todo slide, faixa de texto sobre foto |
| Texto sobre tinta | `paper` | `#f5f5f5` | corpo, títulos |
| Acento vivo | `redBright` | `#ff5347` | kicker, dot ativo, ênfase em CTA, régua da capa |
| Acento sólido | `red` | `#c82a2a` | ênfase em superfície clara |
| Vermelho da marca | `logoRed` | `#e60000` | **só** o disco do lockup. Não muda com o slide. |
| Fundo de palco | `stage` | `#2a2a2a` | `body` fora do slide (não aparece no PNG) |
| Sombra | `shadow` | `#000000` | `text-shadow` / `box-shadow` em rgba |

Transparências de `ink`, `paper`, `white` e `redBright` são o mesmo token com alfa. Não introduzir cinza
novo: o cinza claro "por elegância" é o defeito nº1 de legibilidade.

### Paleta de era (camada opcional, para carrossel de linha do tempo)

Herança do sistema que o **Caio** já usava nas artes de ano (`marca/referencia/Nippon Speed Co. bruno/`):
a cor do slide **vem da livery daquele carro naquele ano**, não do vermelho-símbolo genérico de F1. É
camada **aditiva**: só entra em post cuja narrativa é datada, e o `logoRed` do lockup segue imune.

| Token | Valor | De onde vem | Contraste |
|---|---|---|---|
| `era1989McLarenRed` | `#c8102e` | faixa Marlboro da McLaren MP4/5 (1989) e MP4/5B–MP4/6 (1990–91) | 5,9:1 com `paper` |
| `era1990FerrariRed` | `#d10a11` | rosso da Ferrari 641, o carro de Prost em 1990 | 5,6:1 com `paper` |
| `era1990SuzukaGold` | `#c9a227` | o bordado dourado do boné do GP do Japão 1990 (a peça) | 7,8:1 sobre `ink` |

**Branco da McLaren = `paper`.** Não criar token novo para ele: a livery branca da MP4/5 é o mesmo
branco-papel do sistema, e duplicar token por narrativa é como o sistema apodrece.

**Regra de uso:** um slide, uma era. Dois campos de cor no mesmo slide só quando o conflito cromático
**é** o assunto (1990: Ferrari vermelha × McLaren branca). Fora disso, misturar liveries é o erro que o
`PRODUCT.md` chama de destruir a credibilidade de quem reconhece o carro.

### Paleta de livery (post tipo LINHA DO TEMPO, sem foto)

Quando o post é catálogo de carros por época, **a livery é a identidade visual** e substitui a foto de
arquivo. Cada slide vira um campo chapado na cor daquele carro. Ganho duplo: escapa do sourcing de foto
(8 carros = 8 chances de errar o modelo) e o post fica **publicável**, sem imagem de terceiros.

| Token | Valor | Carro / de onde vem | Texto por cima |
|---|---|---|---|
| `liveryLotusGreen` | `#004225` | British Racing Green do Lotus 25 (1962-67) | claro |
| `liveryLotusYellow` | `#f5d016` | faixa amarela do Team Lotus | acento |
| `liveryJpsGold` | `#c6a961` | dourado John Player Special do Lotus 72 | acento sobre tinta |
| `liveryFerrari70Red` | `#d40000` | rosso da Ferrari 312T (anos 70) | claro |
| `liveryMarlboroRed` | `#e1140a` | vermelho Marlboro da McLaren MP4/4 (1988) | acento sobre papel |
| `liveryWilliamsBlue` | `#0b3c8c` | azul Canon Williams do FW14B (1992) | claro |
| `liveryCamelYellow` | `#f2c500` | amarelo Camel do FW14B | acento |
| `liveryBenettonGreen` | `#00875a` | verde Benetton do B194 (1994) | claro |
| `liveryWestSilver` | `#c9cbd0` | prata West da McLaren MP4/13 (1998) | **escuro** |
| `liveryFerrariModernRed` | `#b4021a` | rosso da Ferrari F2004 (2004) | claro |

⚠️ **Campo claro pede texto escuro.** `liveryWestSilver` e o papel branco da MP4/4 invertem a tinta —
conferir contraste em cada um, não herdar o padrão do campo escuro.

## Tipografia

- **Anton** (display, caixa alta): capa 158-190px · título de capítulo 96px · capítulo tipográfico 136px ·
  nome da peça 82px · wordmark 30px.
- **Archivo** (corpo): corpo 32-36px · kicker 26px · CTA 29px · marcador de capítulo 21px.
- **Pareamento legítimo:** condensada de display + humanista de corpo. Eixo de contraste real, não duas
  sans parecidas.

> **Folga de diacrítico — PISO ESTRUTURAL `line-height: 1.16`.** Anton é condensada: com leading apertado,
> o acento da linha de baixo (Ã Õ Â Ê É) encosta na linha de cima e o glifo lê errado. Medido três vezes:
> "JAPÃO" sob "DO" fez "DO" ler "DQ" (`.94` e `1.06` quebram) · "ÉPOCA" sob "QUE" colidiu (`.90` quebra) ·
> "VOCÊ"/"ICÔNICO" com acentos batendo (`.92` quebra).
> **Desde 24/07 isto é regra no `template.html` do `/post-feed`**, aplicada por último no CSS pra ganhar de
> qualquer valor acima — não depende mais de lembrar. **Exceção: `.yr`**, que é só dígito e segue tight
> (é a assinatura da diagramação); se entrar texto nesse slot, tire-o da exceção.
> **O detector não pega isso** — só a leitura do PNG renderizado.

## Layout — carrossel de feed (3:4, 1080×1440)

Formato oficial desde 2026: **3:4 sobe inteiro e bate com a grade do perfil**. 4:5 é o padrão antigo
(a grade recorta) e segue válido só para o cartão de peça de stories.

Padding do slide: `96px 88px`. Estrutura: `brandline` no topo, bloco de conteúdo, rodapé.

**Tipos de slide:**
1. **Capa full-bleed** — foto cobre o slide + scrim vertical + título por cima. Usar quando a foto for
   retrato ou perto de 3:4.
2. **Capa em faixa** — foto numa faixa de 470px com moldura sutil, título no bloco de tinta abaixo. Usar
   quando a foto for **panorâmica** (mais larga que ~1,6:1): full-bleed cortaria 60-70% da largura e
   mataria a composição.
3. **Capítulo com foto** — foto sangra do topo em 58% da altura, fade para tinta, texto na faixa de baixo.
4. **Capítulo tipográfico** — sem foto. **Bloco centralizado no eixo vertical** (`margin: auto 0`), senão
   o `space-between` joga tudo pro rodapé e o miolo vira buraco. Título sobe para 136px.
5. **Slide da peça** — foto emoldurada 560px em fundo escuro + amarração + CTA. **Sem badge, sem preço.**

**Marcadores de progresso:** dots (círculo vazado, ativo em `redBright`). **Nunca** `01/02/03` — é
andaime de apresentação corporativa, anti-referência declarada e regra banida do detector.

## Textura

- **Grão**: `feTurbulence` SVG inline, `opacity .42`, tile 256px. Dá matéria de impresso e disfarça o
  upscale de foto de arquivo, que é sempre de resolução web.
- **Glow**: dois gradientes radiais (vermelho no alto à direita, branco frio embaixo à esquerda). Só em
  slide de tinta, para o preto não ficar chapado.

## Acessibilidade

WCAG AA (corpo 4.5:1, display 3:1) **mais o teste de miniatura**: o slide precisa continuar legível na
grade do perfil. Detalhe em `PRODUCT.md`.

## Render

Edge headless, `--window-size=1080,1440 --virtual-time-budget=6000`, um PNG por `#s1..#sN`.
**Sem reveal por classe:** transição gated por classe não dispara em renderizador headless e a seção sai
em branco. O conteúdo é visível por padrão, sempre.
