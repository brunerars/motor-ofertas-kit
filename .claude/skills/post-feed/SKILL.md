---
name: post-feed
description: Gera um carrossel NARRATIVO pro FEED (Instagram) da marca — história primeiro (capa + capítulos com foto de arquivo curada), e o produto só no último slide como desfecho + CTA pro grupo. Diagramação "As Eras" (campo de cor por capítulo, ano estrutural, fita do tempo), 3:4 (1080x1440) → PNG + legenda. FEED = autoridade/branding, NÃO vende. Use quando o Bruno pedir um post de storytelling/história pro feed.
---

# Post Feed — carrossel narrativo (autoridade + branding)

O FEED conta HISTÓRIA. A marca vira referência de cultura de automobilismo; a venda acontece noutro canal (stories/fixados/WhatsApp → skill `/post-stories`). Aqui o produto entra **só no último slide**, como recompensa emocional + CTA pro grupo. Ver [[nsc-conteudo-dois-canais]].

> **Diagramação "As Eras"** (promovida em 23/07). Substituiu a anterior depois de ser medida na mesma rubrica: **25/40 → 34/40**, virando o teste de AI slop nas duas ordens. Herda o sistema das artes de ano do próprio Caio (`marca/referencia/`): a cor vem do assunto, o ano é estrutura, o texto vive em campo chapado. Exploração e comparação em `marca/conteudo/exploracao/`.

## Regras duras
> - **Sem eyebrow.** Rótulo minúsculo caixa alta tracked acima de todo título é anti-referência do `PRODUCT.md` e foi o defeito nº1 da diagramação antiga (6 de 6 slides). O template **não tem** esse elemento. Quem carrega informação é o **ano**, em corpo grande. Nunca waivar `repeated-section-kickers` pra reintroduzir.
> - **Sem badge de venda, sem preço.** O feed não é catálogo.
> - **Fato tem que ser real** — não inventar era/ano/piloto **nem detalhe do produto**. Descrever só o que a foto mostra (já erramos afirmando "bordado em dourado" num bordado bege). Na dúvida, suavizar ou perguntar. [[rigor-em-conclusao-de-dados]]
> - **Voz do Bruno**: sem travessão, redondo e direto. [[voz-bruno-redondo]]
> - **Curadoria/licenciamento de foto é HUMANA.** Foto de arquivo de terceiros = risco de copyright → só entra se o Bruno liberar. Foto da própria peça é sempre segura.
> - **Anton só em CAIXA ALTA.** Em caixa baixa o "i" perde o pingo (`link na bio` lê `llnk na blo`). Handle e CTA em Archivo.
> - **Diacrítico: piso de `line-height:1.16` já é ESTRUTURAL no `template.html`** (regra no fim do CSS, ganha de qualquer valor acima). Aconteceu 3x antes de virar regra: "JAPÃO"→"DQ", "ÉPOCA" colidindo, "VOCÊ"/"ICÔNICO" batendo. **Não reintroduza leading apertado em título de texto.** Exceção documentada: `.yr` (só dígitos).

## Input
- **Tema** da história. Pode sair do banco `marca/conteudo/ideias-feed.md` ou de uma ideia curada no Notion (via `/post-from-idea`).
- **Peça de amarração**: id do acervo (`marca/acervo/<id>/`) que fecha a história no último slide.
- **Fotos por capítulo**: imagens curadas, uma por beat. Banco visual em `marca/mood/`.

## A gramática (base fixa + módulos)
**Base fixa, todo slide:** `.strip` (marca) · `.era-rule` (fio de cor) · conteúdo · `.ribbon` (fita do tempo) · `.grain`.

**Tipos de slide:**
1. **Capa** — título grande (é ele que segura a **miniatura na grade**), faixa de foto, e a tese. Foto **panorâmica vai em faixa**, nunca full-bleed (num 3:4 cortaria 60-70% da largura).
2. **Capítulo com foto** — poço de **aresta dura** (sem scrim, sem fade) + campo de cor com ano/título/corpo.
3. **Capítulo espelhado** — inverte a ordem (campo em cima, foto embaixo) **e** a hierarquia (`.field-titulo`: título manda, ano recua). Obrigatório entre dois capítulos do **mesmo período**, senão leem como slide repetido.
4. **Clímax** — módulo `.seam` (o ano rachado ao meio) **só quando o conflito de dois lados é o assunto**. Alinhar o eixo da costura com o eixo da foto. O ano entra **partido** (`{{ANO_A}}`="19" + `{{ANO_B}}`="90"), uma metade por campo: a emenda é a fronteira dos dois blocos, então a divisão cai entre os dígitos sozinha. **Nunca** centralizar o ano inteiro e cortar em 50% com `clip-path` — o `1` do Anton tem 70px contra 111px dos outros dígitos, o meio do texto não é o meio de `19|90`, e sobra faixa de cor errada dentro do dígito.
5. **Declaração** — campo colorido (`.field-red`), único do carrossel. **Leva foto** (slide sem foto vira buraco), de **retrato/reflexiva**, não de ação.
6. **A peça** — card branco com o produto recortado. Sem badge, sem preço.

**Módulos opcionais** (só quando a história pedir): `.plate` (tese de dois períodos na capa) · `.seam` · **paleta de era** (cor por período — só em narrativa datável, e **toda cor nova tem que ser declarada no `DESIGN.md`** antes, senão o detector acusa drift).

**Marcadores:** a **fita do tempo** no rodapé (uma célula por slide, com a cor daquele capítulo). Nunca dots isolados, nunca `01/02/03`.

## Recorte do produto (slide 6) — receita
O produto do feed sai **recortado no branco**. Use **remoção de fundo** (preserva os pixels reais), **nunca** um gerador de imagem: gerativo redesenha a peça e inventa bordado/texto, que é falsificar produto real.

> ⚠️ **Máscara dura, não alpha matting.** O matting respeita a penugem da lã e deixa uma franja semitransparente que no branco vira **halo cinza** bem visível. O certo é: máscara dura → **erodir** a penugem → **feather de ~1px**.

```python
from rembg import remove, new_session
from PIL import Image
import numpy as np
from scipy import ndimage

src = "marca/acervo/<id>/1.jpg"          # o ângulo frontal (o herói)
inp = Image.open(src).convert("RGB")
sess = new_session("isnet-general-use")   # melhor que o u2net padrão
out = remove(Image.fromarray(np.array(inp)).convert("RGBA"), session=sess)  # SEM alpha matting
a = np.array(out)[:,:,3]; mask = a > 128
lbl, n = ndimage.label(mask); sizes = ndimage.sum(mask, lbl, range(1, n+1))
mask = ndimage.binary_fill_holes(lbl == (int(np.argmax(sizes)) + 1))   # maior componente = mata farelo
mask = ndimage.binary_erosion(mask, iterations=3)                      # corta a penugem
m = ndimage.gaussian_filter(mask.astype(np.float32), sigma=1.2)        # feather
af = np.clip(m, 0, 1)[..., None]
comp = (np.array(inp).astype(np.float32)*af + 255*(1-af)).astype(np.uint8)
res = Image.fromarray(comp, "RGB")
ys, xs = np.where(af[:,:,0] > 0.03)
res = res.crop((int(xs.min()), int(ys.min()), int(xs.max())+1, int(ys.max())+1))
w, h = res.size; mg = int(max(w,h)*0.03); side = max(w,h) + 2*mg        # margem 3% = zoom cheio
cv = Image.new("RGB", (side,side), (255,255,255)); cv.paste(res, ((side-w)//2, (side-h)//2))
cv.save("<pasta-do-post>/foto-cut.jpg", quality=94)
```
- **Escolha do ângulo:** o frontal com logo. Os outros (costas/topo/etiqueta/forro) não servem de herói. Trocar de ângulo **não** limpa borda — todos estão no mesmo fundo.
- **Zoom:** margem de 3% no recorte + `padding:12px` no card. Margem grande deixa a peça pequena.

## Fluxo
1. **Escrever o arco** (história primeiro): capa → 3-4 capítulos → declaração → peça. Fato checado.
2. **Montar o HTML** a partir de `template.html`. Copiar as fotos pra pasta do post (`capa.jpg`, `s2.jpg`…, `foto-cut.jpg`). Ajustar `object-position` **foto a foto** — é o lever de craft mais barato e evita cortar rosto/carro.
3. **Ajustar a fita** ao nº de slides e marcar a célula ativa em cada um.
4. **Render** headless (comando abaixo) → `slide-1..N.png`.
5. **Gates** (abaixo).
6. **Legenda** (`legenda.md`): caption na voz do Bruno + hashtags + **nota de licenciamento** das fotos de arquivo.
7. **Entregar pro Bruno revisar.** Publicação é manual dele.

## Gates (nessa ordem, nenhum é opcional)
1. **Detector**, rodando **da pasta da frente**: `node .claude/skills/impeccable/scripts/detect.mjs <post.html>` → **exit 0**.
   ⚠️ Waiver só com motivo **verdadeiro e que aponte o elemento certo**. Waiver falso esconde defeito real de todo mundo.
   ⚠️ Cuidado com pipe: `node ... | tail` faz `$?` virar o exit do `tail`. Redirecionar pra arquivo pra ler o exit real.
2. **`/impeccable critique`** com registro `brand.md`, quando o post for importante.
3. **Ler os PNGs.** Abrir **cada slide** e criticar enquadramento, legibilidade, hierarquia e **continuidade da sequência**. *Screenshot que não foi lido não conta.* **Verde no detector não é prova de qualidade** — ele já deu exit 0 numa peça com dois defeitos visíveis.
4. **Gate factual**: cada capítulo confere ano da foto × afirmação do texto, e a descrição da peça bate com o que a foto mostra.
5. **Teste de miniatura**: a capa segura na grade do perfil?

## Saída
`<projeto>/marca/conteudo/storytelling/<NN>-<slug>/` com `post.html` + `capa.jpg`/`s2..sN.jpg` + `foto-cut.jpg` + `slide-1..N.png` + `legenda.md`.
> Nome da pasta: prefixo numérico e **sem `#` nem espaço** — o `#` quebra a URL `file:///...#s1` do render.

## Render (por slide)
```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho-absoluto-da-pasta-do-post>"
for n in 1 2 3 4 5 6; do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1440 --virtual-time-budget=6000 \
    --screenshot="$DIR/slide-$n.png" "file:///$DIR/post.html#s$n"
done
```
> `--virtual-time-budget=6000` deixa fontes (Google CDN) e grão assentarem. Slides isolados por `#s1..#sN` (CSS `.slide:target`). **Sem reveal por classe** — não dispara em headless e a seção sai em branco.

## Armadilhas de layout (já custaram render)
- **`object-fit:contain` sem altura fixa estoura o container**: a imagem quadrada empurra a altura. O `.product-card` tem `height` + `min-height:0` por isso.
- **Quebra de linha planejada não sobrevive ao tamanho real**: título codado em 2 linhas renderizou em 3. Conferir no PNG, não no código.
- **Texto longo + card grande estoura o slide** (CTA some pro rodapé). Se faltar espaço, reduzir o card antes de cortar o conteúdo.

## Referência viva
`marca/conteudo/exploracao/direcao-c-eras/` — o post que originou este template (Suzuka 1989×1990, 6 slides, 34/40).
> **Voz:** nome de piloto sem artigo ("Senna avisou", não "o Senna avisou") e retomada variada (o francês, o brasileiro, ele).

## NÃO fazer
- Eyebrow acima de todo título · marcador `01/02/03` · badge/preço no feed.
- Gerar a peça com IA generativa (falsifica produto real).
- Publicar foto de arquivo de terceiros sem o Bruno liberar.
- Inventar fato histórico ou detalhe do produto.

## Relacionado
`marca/conteudo/ideias-feed.md` (banco de temas) · skill `/post-from-idea` (hidrata este template a partir de uma ideia do Notion) · `/post-stories` (venda) · `/acervo` (fotos da peça) · `pinterest-mood` (banco visual).
Método: [[metodo-pipeline-conteudo]] · [[metodo-direcao-visual-nova]].
Memórias: [[nsc-conteudo-dois-canais]] · [[producao-conteudo-direcao]] · [[impeccable-detector-gotchas]] · [[voz-bruno-redondo]] · [[post-feed-formato-3x4]].
