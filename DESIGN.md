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

## Tipografia

- **Anton** (display, caixa alta): capa 158-190px · título de capítulo 96px · capítulo tipográfico 136px ·
  nome da peça 82px · wordmark 30px.
- **Archivo** (corpo): corpo 32-36px · kicker 26px · CTA 29px · marcador de capítulo 21px.
- **Pareamento legítimo:** condensada de display + humanista de corpo. Eixo de contraste real, não duas
  sans parecidas.

> **Folga de diacrítico (regra dura).** Anton é condensada: com `line-height` apertado, o til/acento da
> linha de baixo encosta na linha de cima. Medido: "JAPÃO" sob "DO" fez o "O" ler como "Q". `.94` quebra,
> `1.06` ainda quebra, **`1.2` resolve**. Título display com Ã/Õ/Â/Ê exige `line-height ≥ 1.2`.
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
