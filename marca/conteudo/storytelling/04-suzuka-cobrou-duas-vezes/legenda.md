---
tipo: conteudo
projeto: motor-ofertas
formato: carrossel Instagram 3:4 (1080x1440) · 6 slides
post: "Suzuka cobrou duas vezes" (STORYTELLING NARRATIVO · 1989 x 1990)
peca: acervo m23690681862 (boné GP Japão '90)
origem: reel @rodaccki (instagram-reference) + banco visual Pinterest (pinterest-mood)
ideia: Notion "Suzuka cobrou duas vezes — carrossel 1989 x 1990"
status: mock de workflow · NÃO publicável (ver licenciamento)
---

# Storytelling narrativo — "Suzuka cobrou duas vezes"

**Arquivos:** `slide-1..6.png` (nessa ordem) · `foto-cut.jpg` (peça recortada, acervo `m23690681862`) + `foto.jpg` (original) · `capa.jpg` + `s2/s3/s4/s5.jpg` (fotos de arquivo) · fonte `post.html`.
**Modelo:** feed = história. Capa com placa 1989/1990 + 2 capítulos de 1989 + clímax com o **ano rachado** (`.seam`) + declaração em campo vermelho + slide da peça com CTA pro grupo. Sem badge de venda.

> **Diagramação = direção C ("as eras"), promovida em 27/07.** A cor de cada slide vem da livery daquele ano e o ano é corpo estrutural, não rótulo de canto. A versão anterior (eyebrow + dots, sem paleta de era) está preservada inteira em `_v1-antiga/`.

> **Por que 6 e não 5 (ajuste do Bruno):** na versão de 5 o slide de 1990 empilhava o troco e a admissão na mesma respiração, pra caber. Agora o troco tem o slide dele e a admissão tem o dela.

**O ângulo:** o que o reel de origem (e o post `01-suzuka1990`) não diz é que **em 1989 Senna e Prost eram companheiros de McLaren**. É esse contraste que sustenta o carrossel: em 89 a briga é dentro do mesmo box, em 90 Prost já está na Ferrari.

## Legenda

Em 1989, Senna e Prost dividiam o mesmo box. Os dois de McLaren, brigando pelo mesmo título.

Na chicane de Suzuka, Prost fechou a porta. Bateram. Senna voltou empurrado pelos comissários, cortou a chicane e venceu na pista. Horas depois a direção de prova tirou a vitória dele, e o título foi pro francês.

No ano seguinte tudo inverteu. Prost na Ferrari, Senna liderando, e agora era o francês que precisava vencer. Largada, primeira curva, e Senna não tirou o pé. Os dois saíram juntos e o bicampeonato ficou com o brasileiro.

Um ano depois ele admitiu que foi de propósito.

Esse boné saiu do GP do Japão de 1990. Mesma temporada, mesmo circuito, com o traçado de Suzuka bordado em dourado.

Peças com história assim, garimpadas no Japão, aparecem toda semana no nosso grupo. O link tá na bio.

📍 @nipponspeedco

.
.
.

#formula1 #f1 #ayrtonsenna #senna #alainprost #suzuka #gpdojapao #mclaren #ferrari #f1vintage #memorabilia #colecionador #anos90 #f1history

---

## ⚠️ Licenciamento — este post é MOCK, não publicar

As 4 fotos de arquivo vieram do Pinterest e são **de terceiros, sem licença**. Pra publicar de verdade: licenciar ou substituir. A foto da peça (`foto.jpg`) é nossa e é sempre segura.

| Slide | Arquivo | Origem | Ano |
|---|---|---|---|
| 1 (capa) | `capa.jpg` | pinterest.com/pin/494551602855018298 | 1989 |
| 2 | `s2.jpg` | pinterest.com/pin/297941331573892735 | 1989 |
| 3 | `s3.jpg` | pinterest.com/pin/109493834660519115 | 1989 |
| 4 (clímax) | `s4.jpg` | pinterest.com/pin/448248969145612888 | **1990** |
| 5 (admissão) | `s5.jpg` | ⚠️ **origem não registrada** — não bate com nenhum arquivo do `mood/suzuka-1990/`; entrou no commit `552fb7a`. Rastrear antes de publicar. | 1991 (aprox.) |
| 6 (peça) | `foto-cut.jpg` (de `foto.jpg`) | acervo `m23690681862/1.jpg` | própria ✅ |

**Gate factual aplicado:** os capítulos de 1989 usam foto de 1989 e o de 1990 usa foto de 1990. O discriminador é o número na carroceria: em 1990 Senna era **McLaren #27** (branco) contra a **Ferrari** de Prost; em 1989 os dois estavam de McLaren. A busca "Suzuka 1990" no Pinterest devolve majoritariamente 1989, então esse check não é opcional.

## Achados de produção (viraram regra nas skills)

- **Diacrítico em display condensado precisa de folga.** Com Anton em caixa alta e `line-height:.94`, o til do "JAPÃO" encostava na barriga do "O" da linha de cima e "DO" lia como "DQ". `1.06` não bastou; `1.2` resolveu. O detector estático não pega isso, só o olho.
- **Foto panorâmica não vai em capa full-bleed 3:4.** A capa (2,48:1) perderia ~70% da largura e cortaria um dos dois pilotos fora. Virou **capa em faixa**, que preserva a composição e ainda dá bloco de tinta pro título.
- **Pinterest é fonte de mood, não de imagem-herói.** Segunda rodada com buscas dirigidas por capítulo não subiu o teto: de 44 stills, 5 passaram o piso de 1080 e 2 já eram repetidas. As "de alta" novas eram miniatura de kit escala e wallpaper de celular. Piso de resolução sozinho não basta, precisa de filtro de conteúdo.
