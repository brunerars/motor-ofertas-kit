---
name: post-from-idea
description: Fecha o loop do motor de conteúdo — pega uma ideia curada no Notion (Ideias de Conteúdo, Status "Em Produção") e a transforma num carrossel de feed COMPLETO (5 slides 3:4, igual Suzuka 1990), delegando o build+render ao /post-feed. Seleciona a foto da peça no acervo e as imagens de capa/capítulo no banco visual (mood/Pinterest) por tema. Use quando o Bruno disser "gera o post dessa ideia", "monta o carrossel da ideia X", "tira essa ideia do Notion e faz o post", ou apontar uma ideia em produção pra virar post.
---

# Post a partir de uma Ideia (a ponte Notion → carrossel)

É o elo que faltava no motor: o `instagram-reference` gera a **ideia-roteiro** no Notion; esta skill pega uma ideia **curada pelo humano** (arrastada pra `Em Produção` no kanban) e a vira **post de feed completo**, reusando o `/post-feed`. O render, o design system e as regras de voz são do `/post-feed` — aqui a gente só **hidrata** ele com o roteiro do Notion e escolhe as imagens.

Ao ser invocado, anuncie: **"Rodando a ponte Ideia → post (post-from-idea)."**

## Setup — leia antes

Esta skill é da **frente corrente**. Leia `./conteudo/config.yaml` e a tríade `editorial-framework.md` / `voice-model.md` (a voz que o post herda) — igual às skills de Instagram.

> **Seleção de frente (mesma regra dura das skills de conteúdo):**
> - **(a)** cwd tem `conteudo/config.yaml` → é a frente, use sem perguntar.
> - **(b)** raiz do vault ou ambíguo → **pergunte a frente** ou aceite por argumento (`/post-from-idea nippon <ideia>`) e carregue `projetos/<Frente>/conteudo/config.yaml`. Nunca um default silencioso.
> - **(c)** ecoe a frente resolvida antes de ler/escrever no Notion.

Do config, use `notion_ideias_conteudo_id`, `notion_marca` e `loja`.

> Esta é a instância **NSC** (depende do `template.html` do `/post-feed` e do design system da NSC). Outra frente só ganha a ponte quando tiver o próprio `/post-feed`.

## Passo a passo

### 1. Escolher a ideia
- Se o Bruno **apontou** uma ideia (título, ou URL/id da página Notion) → use essa.
- Se **não apontou** → consulte `notion_ideias_conteudo_id` filtrando `Marca/Loja = notion_marca` **e** `Status = "Em Produção"`, e **liste as opções pro Bruno escolher** (não escolha sozinho — a curadoria é dele). Se não houver nenhuma em `Em Produção`, avise e sugira arrastar uma no kanban primeiro.

Confirme em uma linha qual ideia vai virar post antes de seguir.

### 2. Ler o roteiro
`notion-fetch` na página da ideia. Extraia:
- **Roteiro**: Gancho (escolha a melhor das opções), Desenvolvimento (frase a frase), CTA, Título, Legenda.
- Propriedades: `Objetivo`, `Formato de Produção`, `Nível de Consciência`.
- **Referência** (relation → Banco de Referências): `notion-fetch` nela pra pegar o contexto/gancho original que inspirou a ideia. É insumo, não cópia.

### 3. Montar o arco (roteiro → estrutura de 5 slides)
Mapeie o roteiro pro esqueleto narrativo do `/post-feed`:
- **Slide 1 — capa**: o Gancho vira o título de impacto.
- **Slides 2–4 — capítulos**: o Desenvolvimento fatiado em 3 beats (kicker + título Anton + 2-3 linhas punchy cada).
- **Slide 5 — peça + CTA**: amarra a história na peça de coleção + CTA pro grupo (link na bio · `@handle` do config). **Sem badge, sem preço** (é feed).

Regras herdadas do `/post-feed` (duras): **fato real** (não inventar era/ano/piloto), **voz do Bruno** (sem travessão, nome de piloto sem artigo), feed **não vende**.

### 4. Selecionar as imagens (o momento em que os dois bancos se encontram)
- **Peça (slide 5)** — do **acervo** (`marca/acervo/index.json`):
  - Case o tema da ideia com `tags`/`title_ja` dos itens. Se o Bruno indicou a peça, use essa.
  - **NUNCA** usar item com `"bloqueado"` (ex.: `m33557684905`, boné DEKRA falso) nem `sold: true` sem ele confirmar. Se o único match é bloqueado/vendido, PARE e pergunte.
- **Capa + capítulos (slides 1–4)** — do **banco visual** (`marca/mood/index.json`, saída da skill `pinterest-mood`):
  - Se o `mood/index.json` **existir**: case a `descrição`/`tags` de cada imagem com o tema de cada slide e proponha a seleção (capa = imagem de maior impacto do tema; capítulos = uma por beat). Mostre ao Bruno o que escolheu — a curadoria/licenciamento de foto é **humana**.
  - Se o `mood/index.json` **não existir ainda** (Fatia 2 não rodou) ou não houver match bom: **fallback** = capa tipográfica + capítulos design-system puro (line-art/tipografia), exatamente como o `/post-feed` já faz sem foto. O post sai mesmo sem Pinterest.
- **Nota de licenciamento**: fotos do mood (Pinterest) são de terceiros → registrar a origem na `legenda.md` e só publicar com o Bruno liberando (mesma regra do `/post-feed`).

### 5. Build + render (delegado ao /post-feed)
Daqui, **siga o `/post-feed`** (não reimplemente): monte o `post.html` a partir do `template.html`, copie as fotos selecionadas pra pasta do post (`s2..4.jpg` = mood/capa; `foto.jpg` = peça do acervo), e rode o render headless (Edge, `--window-size=1080,1440`, `#s1..#s5`) → `slide-1..5.png`.
- Saída: `marca/conteudo/storytelling/<NN>-<slug>/` (prefixo numérico, sem `#`/espaço no nome).
- Confira os PNGs (enquadramento/legibilidade) e rode **`impeccable detect = 0`**.

### 6. Legenda
`legenda.md` = a Legenda da ideia refinada na voz do Bruno + hashtags de nicho + nota de licenciamento das fotos de mood usadas. Frontmatter no padrão dos outros posts (tipo/projeto/formato `3:4 (1080x1440)`/peça/status).

### 7. Fechar o loop (sem publicar)
- **Publicação é manual do Bruno** — a skill NÃO marca `Publicado` (isso significaria "postado"). Deixe a ideia em `Em Produção` e **registre o caminho do post gerado** (comentário na página ou na `CTA Sugerida`/corpo), pra rastrear o que já tem arte pronta.
- Entregue pro Bruno revisar: mostre os 5 slides + a legenda. Quando ele postar de verdade, ele arrasta pra `Publicado` no kanban.

> Divergência consciente do plano (que dizia "→ Publicado"): publicação é ação manual do Bruno, então o gate `Publicado` é dele, não da skill. A skill entrega a arte pronta.

## NÃO fazer
- Não escolher a ideia sozinho quando o Bruno não apontou (a curadoria/priorização é dele).
- Não usar peça `bloqueado`/falsa nem foto de mood sem o Bruno liberar.
- Não marcar `Publicado` (só o Bruno, ao postar).
- Não inventar fato histórico nem meter badge/preço no feed.

## Relacionado
Skills `/post-feed` (o motor de render que esta ponte hidrata) · `pinterest-mood` (enche o `marca/mood/`) · `instagram-reference` (gera as ideias) · `/post-stories` (venda, outro canal).
Banco de peças: `marca/acervo/index.json` · banco visual: `marca/mood/index.json`.
Memórias: [[nsc-conteudo-dois-canais]] · [[voz-bruno-redondo]] · [[rigor-em-conclusao-de-dados]] · [[impeccable-detector-gotchas]].
