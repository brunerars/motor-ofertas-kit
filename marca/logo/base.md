---
tipo: marca
projeto: motor-ofertas
status: exploração aberta (aguarda escolha do Bruno)
---

# Logo — base e exploração

## A situação (13/07)

Existem **duas identidades convivendo** e a escolha da logo decide qual manda:

| | O que é | Onde vive |
|---|---|---|
| **Logo do Caio** | Bandeira quadriculada e hinomaru cruzadas em X, "NIPPON" em fonte fina geométrica, "SPEED CO." em condensado vermelho, sobre preto | `logo.jpeg` (e cópias em `marca/referencia/`). **Não é usada em lugar nenhum.** |
| **Brandline CSS** | Bandeirinha xadrez em `conic-gradient` + "Nippon Speed Co." em Anton | LP, posts, stories, destaques, campanha. **É o que está no ar.** |

Nenhum HTML do projeto referencia arquivo de logo. `lp/assets/img/logo-branco.png` e `logo-mark.png` eram órfãos (sobra da LP dark antiga) e foram trazidos pra cá, em `fontes/`.

## Dados medidos da logo do Caio

- **Canvas:** 1080×1350 (4:5), com **94,6% de preto**. É um lockup dentro de um canvas de post, não um arquivo de logo. O recorte justo está em `fontes/lockup-original.png` (911×297) e o símbolo isolado em `fontes/simbolo-original.png`.
- **Proporção do lockup:** 3,25:1 (bem horizontal). É por isso que ele não serve pra avatar.
- **Vermelhos:** hinomaru `#e60000` · wordmark `#c80000`.

**Não há conflito de cor com o site:** o `#c80000` do "SPEED CO." é praticamente o `--red #c82a2a` do design system. O vermelho da marca já é o mesmo nos dois lugares.

## O que falta na logo atual (independente de qual for escolhida)

- Versão **só-símbolo** (o lockup horizontal vira tarja ilegível no avatar do Instagram).
- Versão para **fundo claro** (a LP é papel `#f5f5f5`; a logo é branca sobre preto).
- Versão **empilhada** e **monocromática 1 cor** (bordado do boné, etiqueta).
- **Vetor.** Tudo que existe hoje é raster.

## Exploração (`exploracao/`)

8 direções de símbolo geradas com `/nanobanana` em **image-to-image**, a partir de `fontes/simbolo-original.png`. Regra dura em todo prompt: **zero texto** (IA erra letra), paleta preto/branco/vermelho, fundo branco sólido (pedir transparência devolve xadrez fake, ver `nanobanana-cutout-fundo-branco`).

Para cada símbolo há três arquivos: o original, o `-alpha.png` (fundo recortado por flood fill a partir das bordas, o que preserva o branco interno do xadrez) e o `-dark.png` (preto e branco invertidos, vermelho preservado).

Comparação completa: **`prancheta.html`** → `prancheta.png`.

> ⚠️ **O 07 (hanko) quebrou a regra:** desenhou um kanji (parece 競, "competição"). Bonito, mas é um caractere que a IA inventou. Não publicar sem um japonês conferir, ou refazer o carimbo sem o kanji.

## Ganho técnico desta rodada

O `/nanobanana` **suporta image-to-image** (a SKILL.md só documentava text-to-image). Basta um part `inline_data` antes do texto. Documentado na skill.

## Próximo passo

Bruno escolhe **símbolo + tipografia** na prancheta. Só então vale produzir o kit oficial (horizontal, empilhada, só-símbolo, mono, claro/escuro, em SVG + PNG + favicon) e trocar a brandline CSS da LP, dos posts e dos destaques.
