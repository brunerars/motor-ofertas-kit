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

> **Raiz da frente (importante — esta skill tem cópia na raiz do vault):** todos os caminhos `marca/...` e `conteudo/...` daqui são relativos à **raiz da frente resolvida** (ex.: `projetos/Nippon-Speed/`), NÃO ao cwd. Rodando da raiz do vault, prefixe tudo com `projetos/<Frente>/`. Rodando de dentro da pasta da loja, use como está.

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
  - **Três filtros duros, nessa ordem:** (a) **ano correto** — capítulo de 1989 leva foto de 1989, sempre; (b) **resolução** — `≥1080×835` pra faixa de capítulo, senão o capítulo vira tipográfico; (c) **conteúdo** — nada de miniatura de kit, wallpaper, fan edit ou imagem com marca d'água (só se pega abrindo a imagem).
  - Se o `mood/index.json` **não existir ainda** (Fatia 2 não rodou) ou não houver match bom: **fallback** = capa tipográfica + capítulos design-system puro (line-art/tipografia), exatamente como o `/post-feed` já faz sem foto. O post sai mesmo sem Pinterest.
- **Nota de licenciamento**: fotos do mood (Pinterest) são de terceiros → registrar a origem na `legenda.md` e só publicar com o Bruno liberando (mesma regra do `/post-feed`).

### 5. Build + render (delegado ao /post-feed)
Daqui, **siga o `/post-feed`** (não reimplemente): monte o `post.html` a partir do `template.html`, copie as fotos selecionadas pra pasta do post (`capa.jpg`, `s2..4.jpg` = mood; `foto.jpg` = peça do acervo), e rode o render headless (Edge, `--window-size=1080,1440`, `#s1..#s5`) → `slide-1..5.png`.
- Saída: `marca/conteudo/storytelling/<NN>-<slug>/` (prefixo numérico, sem `#`/espaço no nome — o `#` quebra a URL `file:///...#sN`).

**Passe de enquadramento (o lever de craft mais barato).** Ajuste `object-position` foto a foto pra não cortar rosto, carro ou ponto de interesse. Não deixe no default. Regra prática: numa foto com um sujeito lateral, use a porcentagem que joga o sujeito pro lado e libera espaço negativo pro título.

**Capa: escolha o tratamento pela proporção da foto.**
- Foto retrato ou próxima de 3:4 → **capa full-bleed** padrão do template (`.cover-bg` + scrim).
- Foto **panorâmica** (mais larga que ~1,6:1) → **capa em faixa** (`.cover-band`, altura ~470px, imagem dentro, título no bloco de tinta embaixo). Full-bleed num 3:4 cortaria 60–70% da largura e mataria a composição. Foi exatamente o que aconteceu no `04-suzuka-cobrou-duas-vezes`: a foto 3297×1328 com os dois pilotos em pontas opostas perdia um deles no corte.

**Armadilha de tipografia (Anton + acento).** Em caixa alta com fonte condensada, `line-height` apertado faz o **diacrítico da linha de baixo encostar na linha de cima**: no `04`, o til de "JAPÃO" tocou a barriga do "O" acima e "DO" passou a ler "DQ". `.94` quebrava, `1.06` ainda quebrava, **`1.2` resolveu**. Se o título tiver Ã/Õ/Â/Ê, dê folga. **O detector não pega isso** — só a leitura do PNG.

### 5b. Os três gates (obrigatórios, nessa ordem)
1. **Detector (determinístico).** Rodar **da pasta da frente** (o `context.mjs` do impeccable resolve a raiz do projeto pelo cwd; da raiz do vault ele declara o vault inteiro): `node .claude/skills/impeccable/scripts/detect.mjs --json <post.html>` → **exit 0**.
   > ⚠️ **Armadilha do waiver falso.** Waiver exige motivo **verdadeiro e que aponte o elemento certo**. No 04 havia um waiver de `repeated-section-kickers` justificado com "são os anos da narrativa" — mas os anos eram outro elemento, e o que estava sendo silenciado era andaime repetido em 6 de 6 slides, justamente a anti-referência do `PRODUCT.md`. **Waiver errado esconde defeito real de todo mundo.** Na dúvida, deixe o detector reclamar.
   > Falso-positivo legítimo já mapeado: Anton ~1.28× → `tight-leading`.
   > **Verde no detector não é prova de qualidade:** ele deu exit 0 numa peça com dois defeitos reais (colisão de diacrítico e capa que falhava a miniatura). Quem pega isso é o gate 3.
2. **`/impeccable critique <post.html>`** — register **`brand.md`** (carrossel = o design É o produto). Roda review de design + detector em avaliações isoladas e sintetiza, triando falso-positivo. Resolva P0/P1 ou justifique por escrito.
3. **Leitura visual dos PNGs.** Abra **cada slide** e critique enquadramento, legibilidade do texto sobre foto, hierarquia e **continuidade da sequência** (o detector olha 1 arquivo, não 5 peças). **Screenshot que não foi lido não conta.** Iterar e re-renderizar faz parte; entregar na primeira tentativa sem olhar, não.
4. **Gate factual.** Cada capítulo confere ano da foto × afirmação do texto, usando o discriminador visual registrado no `mood/index.json`.

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
