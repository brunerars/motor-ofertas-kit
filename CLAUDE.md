---
tipo: projeto
status: ativo
fase: 1 — Marca
atualizado: 2026-07-22
---
#foco

# Motor de Ofertas — esteira de skills (ecommerce enxuto)

## O que é
Esteira de skills no Claude Code que transforma um workflow (antes n8n/sistema) em **teste rápido**: de um produto/loja qualquer → identidade + LP + posts + loop de ofertas no WhatsApp, **sem backend robusto**. Desenhado como **TEMPLATE** — trocar marca/loja rápido, testar vários produtos.
Primeira instância: **Nippon Speed Co. (NSC)** — memorabilia de automobilismo/F1 vintage importada do Japão ([[caio-logistica-japao]], curadoria Mercari).

## Marca — Nippon Speed Co.
- **Nicho:** memorabilia F1/automobilismo vintage (bonés Ferrari/Honda/Williams, coleção Schumacher, peças de Grand Prix japonês). Tema "carros que marcaram época — 1962→anos 2000".
- **Identidade:** logo bandeira quadriculada + hinomaru; "NIPPON" branco / "SPEED CO." vermelho; tipografia condensada bold (Anton). Paleta: vermelho de corrida + preto + branco + xadrez.
- **Narrativa/funil:** Japão (Mercari) → Brasil; peça de coleção → oferta no grupo.
- **Assets do Caio:** `marca/referencia/Nippon Speed Co. bruno/` (logos, capas, "como funciona", linha de anos).
- **Referência de design (clone):** template Webflow **Haus** (claro/monocromático: #F5F5F5 + tinta preta, Anton+Archivo, contraste via mix-blend-mode) em `marca/referencia/webflow-refencia/` → `design-system2.html`.
- **Item piloto (LP/agenda):** https://jp.mercari.com/item/m71370664392

## Princípio (o "avaliar" que o Bruno pediu)
**Skills-first pra fase de teste.** Iteração de design/copy/curadoria acontece dentro do Claude, zero manutenção de n8n, design system reaproveitado por loja. Vira sistema SÓ se: volume alto, multi-loja simultânea, ou time operando. Antes disso, sistema é over-engineering.

## Stack
- **Scraping:** Firecrawl (Playwright por baixo; mecânica já provada no n8n do primo do Caio)
- **DB/fila:** Baserow (API + MCP) — Bruno já domina do [[crm-slotter-produto]]
- **WhatsApp:** **WAHA** auto-hospedado (`devlikeapro/waha`, CORE, engine WEBJS) — stack em `waha/`. Substituiu a **Z-API** (paga) em 16/07.
- **Design:** método `Extract HTML Design System v2` (ref → download `sd.asimov.academy` → `design-system2.html`)
- **Conteúdo:** `/nanobanana` · `/motion` · `/ghostwriter`
- **Disparo agendado:** Claude Code cloud routine (skill `/schedule`) — EM TESTE

## Esteira (skills)
**Bloco Marca** (semente, reutilizável por loja) — **as 3 skills existem** (`.claude/skills/`):
- `/marca <ref>` → `design-system2.html` (método Extract + motion + recorte logo/hero embutidos; prompt Extract copiado na skill).
- `/acervo <url_mercari...>` → baixa fotos pro `marca/acervo/`. Leve, desacoplado. NÃO traduz/precifica.
- `/lp <produto>` → LP self-contained + deploy Vercel (rotina completa). Consome `marca/acervo/`. Padrões: `docs/roteiro-lp.md` + `docs/logistica-mercari.md`.
- **Posts (estratégia 2 canais, 08/07)** → skills dedicadas **`/post-feed`** (carrossel NARRATIVO = autoridade/branding: história 1º + produto só no fim como CTA, SEM badge) e **`/post-stories`** (cartão de peça = venda: badge VERDE "sob encomenda" + "fala com a gente"). Ambas: design system V1 → HTML→PNG 3:4 (1080×1440), 0 token de imagem. Banco de temas em `marca/conteudo/ideias-feed.md`; templates em `.claude/skills/post-*/template.html`. Ver nsc-conteudo-dois-canais. (Evolução do plano antigo de usar só `/conteudo`+`/nanobanana`.)

> **Desacoplamento (decisão 2026-07-02):** Firecrawl pesado (traduz/preço/estado) é SÓ do `/agenda`, no agendamento. `/lp` e vitrine usam fotos do acervo (`/acervo`). Sem acoplamento cruzado.

> **Produtização da LP rápida:** `docs/roteiro-lp.md` (voz + estrutura padrão, reutilizável por loja) e `docs/logistica-mercari.md` (fonte da verdade da operação do Caio). Base do que vira a skill `/lp`.

**Bloco Ofertas** (loop operacional):
- `/agenda <url_mercari>` → Firecrawl → traduz descrição / converte preço / pega imagem → fila Baserow → preview WhatsApp 1:1 → aprova → agenda
- `/dispara-oferta` → dispara agendadas no grupo (+ resumo pré-janela ~20min)
- `/confere-ofertas` → cron diário: vendido? marca no Baserow + avisa grupo (+ interessados)

**Bloco Conteúdo / Branding** (motor referência→ideia→post — camada nova, 2026-07):
- **Onde vivem as skills:** `instagram-reference` e `instagram-saved-scanner` são **escopo-user global** (`~/.claude/skills/`), NÃO no vault — um motor serve N lojas. `reel-builder` fica no vault (`.claude/skills/`). **Se não achar no projeto, procure em `~/.claude/skills/`** (foi a origem da confusão 22/07). Origem/protótipo: `Desktop/Gerador-Conteudos/Conteudo-Teste/` (histórico).
- **Separação por frente:** 1 par de DBs Notion compartilhado (Banco de Referências + Ideias de Conteúdo) separado pela propriedade **Marca/Loja**. Cada frente tem `conteudo/config.yaml` + `editorial-framework.md` + `voice-model.md`. A skill lê o config da frente corrente (cwd) — ver a **regra dura de seleção de frente** no SKILL.md (nunca carimba loja errada quando roda da raiz do vault).
- **Abrir nova frente:** (a) novo valor em `Marca/Loja` nos 2 DBs; (b) copiar o `config.yaml` template + preencher `loja`/`notion_marca`/`instagram_username`; (c) escrever `editorial-framework.md` + `voice-model.md`; (d) criar a view kanban filtrada.
- **Fluxo-alvo:** refs (IG salvos/link + Pinterest via `pinterest-mood`) → banco → ideia (kanban por Status) → curadoria humana → `/post-from-idea` rende o carrossel 3:4 igual Suzuka. Bancos de imagem: `marca/acervo/` = foto da peça · `marca/mood/` = capa/mood do Pinterest.

## Features
- **PRINCIPAIS:** design-system · `/agenda` · preview+aprovação · agendamento · `/dispara-oferta`
- **SECUNDÁRIAS:** captura lead `wa.me`→1:1 · resumo pré-janela · `/confere-ofertas` · notifica interessados

## Fases (ordem por valor)
- **Fase 1 — Marca** (ATIVA): `/marca` → `/lp` → `/posts`. Pronto = loja tem identidade, LP no ar, posts prontos pra mostrar ao Caio.
- **Fase 2 — Ofertas:** entrada (`garimpo/` form do Caio → webhook n8n → Baserow rascunho) → `/agenda` (modo lote enriquece) → aprovação do Bruno no Baserow → `/dispara-oferta` (n8n) posta no grupo. Pronto = link garimpado pelo Caio vira post no grupo, com a conferida do Bruno no meio.
- **Fase 3 — Nutrição** (COMEÇOU 16/07): captura lead **feita** (`n8n/nsc-lead-inbound.json`: WAHA inbound → tabela `LEADS` → aviso no zap do Bruno). Falta o `/confere-ofertas` e o "avisa interessados" (que agora tem de onde ler).

## Decisões travadas
- Disparo agendado = **testar cloud routine do Claude Code** (não n8n, não worker VPS por ora)
- Botão "tenho interesse" em grupo **não existe nativo** → link `wa.me` com texto pré-preenchido referenciando o SKU
- Começar pelo Bloco Marca
- **LP = opção 2: base escura + vermelho de corrida** (mais próxima das artes do Caio; nicho pede impacto, não minimalismo de galeria). Deploy Vercel.
- **Motion:** não replicar o timing exato do IX2 do Webflow — usar camada própria de animação inteira (IntersectionObserver + CSS, progressive enhancement, conteúdo visível por padrão). Ver design-system-extract-motion-gotcha.
- `jp.wings` / `jpwingsbr.com` são **referências**, não a marca própria
- **Modelo de preço + legenda do WhatsApp (16/07)** — o **R$ que o Caio manda no form já é fechado: inclui frete do Japão + impostos** ("impostos e frete por nossa conta" é o jeito que a NSC vende). O único frete que sobra é **escritório → casa do cliente**, resolvido no pv. Portanto: **NUNCA escrever "frete sob consulta" nem "valor sob consulta" na legenda do WhatsApp**; a linha de preço é limpa (`R$ 750,00`). O `price_jpy` (Firecrawl) é referência interna e não vai pro post. **Legenda = modelo que o Caio já usa no grupo dele** (curto, a foto faz o trabalho):
  ```
  *<Título da peça>*
  Tam: <a observação do Caio, como ele escreveu; "único" se vazio>

  R$ <preço>

  🏁 Quero essa peça: https://wa.me/<numero>?text=Estou%20interessado!%20(<mercari_id>)
  ```
  **Formato definitivo (16/07, refino do Bruno em cima do modelo do Caio):** título em **negrito** (`*` do WhatsApp — quem renderiza é o **app do WhatsApp**, não a API: vale igual no WAHA, na Z-API ou em qualquer outra), **duas linhas em branco** separando título+tam / preço / CTA, e **🏁** no CTA. A linha do Tam **nunca some** (vem do campo `tags` = o que o Caio digitou no form; vazio → `único`) e o **defeito entra nela**, por vírgula — não tem linha de defeito própria. Sem gancho histórico, sem medidas técnicas (vão no pv). O `wa.me` fica: é a captura de lead (grupo não tem botão "tenho interesse") e alimenta o `/confere-ofertas`. **Sem preço não há legenda** → segura em `Fila` e reporta.
  > O n8n **não monta legenda**: lê `caption` do Baserow e repassa cru pro `send-image`. Quem escreve é o `/agenda`. Mudou o formato? Mexe só na skill.
- **A observação é de quem escreveu: a skill não inventa (16/07, regra final)** — a linha do Tam sai **como o Caio/Bruno digitou**; o máximo permitido é **gramática e formato** (`tamanho M` → `M`). **NUNCA acrescentar defeito que só a `description` do anúncio menciona** (ex.: "leve mancha na lente"): num detalhe pouco visual isso **desqualifica a peça sozinho** e cria objeção de venda. **Quem decide o que desqualifica é o Bruno, não a skill.** A divergência anúncio × nota **vai no report** (o Bruno quer o feedback), nunca direto na legenda. *Reverte a "regra de autoria" tentada mais cedo no mesmo dia, que mandava o `/agenda` arbitrar o estado; a row 23 ganhou um "pequena mancha escura na aba" que ninguém pediu e foi desfeita.*
- **CTA do `wa.me` = `Estou interessado! (<mercari_id>)` (16/07)** — o id sozinho confundia o cliente. Frase normal na frente, id discreto no fim: o cliente não precisa entender o código e o Bruno sabe a peça sem perguntar. **Não havia ganho técnico em manter só o id:** nada parseia essa mensagem (o `wa_message_id` é da mensagem que o **bot envia**, não da resposta; não há webhook de entrada; "avisar interessados" nunca saiu do papel). Quem lê é o Bruno, no 1:1.

## Visão de produto + arquitetura de custo (decisão 2026-07-02)
Isto tende a virar um **kit "loja-in-a-box"** de setup rápido, com duas camadas separáveis:
- **Cérebro da loja (adaptável)** = a pasta do projeto no Obsidian (CLAUDE.md + `roteiro-lp` + `logistica` + `baserow-schema` + acervo). Clona e adapta por loja.
- **Kit de skills de operação** = as 6 skills. Setup = **trocar tokens no `.env`** (a fronteira humana) + ref de design + URLs curadas → loja no ar.

**Arquitetura de custo (token):**
- **Claude = setup (1×/loja, pesado) + por-item (tradução/legenda, barato) + curadoria/aprovação.**
- **Recorrente mecânico (disparo, confere-vendidos) → n8n = ~0 token** (HTTP puro, não é Claude).
- ⚠️ Custo desta sessão é de **P&D** (construção/debug), NÃO custo de regime. Pra número real: `/cost`.

**Cron de produção = n8n hospedado** (Schedule Trigger → GET Baserow `Aprovado` → POST **WAHA** `/api/sendImage` → PATCH `Disparado`). Não usar cloud-routine do Claude (session-only) nem subir VPS worker novo. Mesma lógica já provada aqui.
> **O n8n fala com o WAHA por dentro da `network_public`** (`http://waha:3000`, alias de rede) — não usa domínio, não passa pela internet, não gasta TLS. O domínio `waha.arvsystems.cloud` existe só pro Bruno abrir o dashboard e escanear o QR. **WAHA local não serve pra produção:** o n8n é hospedado e não alcança `localhost` — mesma parede que criou o `photo_url`.

**ROI/porém:** validar com **UMA loja rodando pro Caio (NSC)** antes de generalizar o kit. Moat = velocidade de setup + know-how de garimpo do Caio, não a tech. Depois: organizar em repo separando template × instância. Liga com [[crm-slotter-produto]] · [[framework-operacao]].

## Pendências de entrada (Bruno)
- [x] Nome/marca + logo → Nippon Speed Co. (assets entregues)
- [x] Referência de design → template Haus (asimov, entregue)
- [x] Produto piloto → item Mercari m71370664392
- [x] Chaves (travavam o Bloco Ofertas): Firecrawl · Baserow (base+token) · **WAHA** (`WAHA_URL`, `WAHA_API_KEY`, `WAHA_GROUP_ID`) → `.env`, fora do git. *(A Z-API saiu do fluxo em 16/07; as `ZAPI_*` seguem no `.env` só como rollback, marcadas como desativadas.)*

## Estado atual (2026-07-27) — Post do Suzuka corrigido + o loop do Notion FECHOU (a arte agora sobe)
Duas coisas: um defeito de tipografia que só o olho pega, e a última perna que faltava no motor de conteúdo.

- [x] **A emenda do `1990` no slide 4 era 17px fora — e o erro era estrutural, não de ajuste.** O ano rachado era um `1990` **centralizado**, duplicado e cortado em 50% por `clip-path` sobre um gradiente de duas paradas: **três coisas cravadas em 50%** dependendo de a métrica da fonte concordar. Ela não concorda — o `1` do Anton tem **70px contra ~111px** dos outros dígitos, então o meio do texto cai 17px à direita da fronteira `19|90` e o corte pegava **dentro do segundo `9`**, deixando faixa branca nele.
  - **Conserto:** cada metade do ano mora num bloco de 50% encostado na borda. A emenda vira a **fronteira entre os dois campos**, não uma coordenada, e o corte cai entre os dígitos **por construção** — qualquer que seja a largura do dígito. O gradiente sai; a cor vem de cada metade.
  - **Medido, não olhado:** colunas de tinta do PNG. Antes o 3º dígito ia de 526 a 636, atravessando a emenda (540). Depois: vão de **538 a 545** com a emenda dentro dele. Detalhe: `letter-spacing` negativo sobra depois do último glifo da esquerda e faz ele transbordar ~2px — devolvido com `margin-right` do mesmo valor.
  - **Trade-off aceito:** o conjunto fica 17px à direita do centro do slide (1,6%). A referência óptica passa a ser a emenda, que é o conceito do slide.
  - **O fix foi pro `template.html` do `/post-feed` também** (o ano entra partido, `{{ANO_A}}`/`{{ANO_B}}`), senão renascia no próximo post com ano rachado. As 3 cópias do template com o mesmo md5.
- [x] **`storytelling/04-suzuka-cobrou-duas-vezes` passou a ser a direção C.** A pasta que a ideia do Notion referencia ainda tinha a diagramação **antiga** (eyebrow + dots, sem paleta de era) — eram duas verdades pro mesmo post. Promovida; a anterior fica inteira e renderizável em `_v1-antiga/`.
- [x] **A arte agora SOBE pro Notion, em qualidade original.** O loop terminava num **caminho local** escrito na página: quem quisesse ver o post tinha que abrir a pasta na máquina do Bruno. Script novo `.claude/skills/post-feed/scripts/notion-anexar-post.mjs` faz **upload nativo** (File Upload API, `Notion-Version: 2026-03-11`) e anexa na página da ideia.
  - **Validado ponta a ponta** na ideia do Suzuka: 6 imagens na ordem, e o PNG **volta do Notion com md5 e tamanho idênticos** ao local (1.110.904 bytes) — é o mesmo arquivo que vai pro Instagram, sem recompressão.
  - **Idempotente:** rodar de novo **recusa** em vez de duplicar; só troca com `--replace`.
  - **Descartado com número:** Google Drive via MCP aceita binário, mas exigiria emitir ~1,9MB de **base64 por slide** como argumento de tool (centenas de milhares de tokens) e ainda entregaria link externo em vez de anexo.
  - **Setup (feito):** integração interna **"CLAUDE"** conectada na página-mãe *🎬 Instagram Content Machine (ACBK)* → toda ideia nova já nasce acessível. `NOTION_TOKEN` no `.env` da **raiz do vault** (gitignored), porque o motor é multi-frente.
  - Gotcha embutido: `process.exit()` com socket de fetch aberto dispara **assertion do libuv no Windows** e enterra a mensagem útil no stack trace — `die()` lança e o `main()` captura.
- ⚠️ **ABERTO — rotacionar o `NOTION_TOKEN`:** passou pelo chat em 27/07 e ficou gravado no transcript da sessão em disco.
- ⚠️ **ABERTO — `s5.jpg` (slide da admissão) sem origem rastreada:** não bate com nenhum arquivo do `mood/suzuka-1990/`; entrou no commit `552fb7a`. Registrado na tabela de licenciamento da `legenda.md`. Confirmar antes de publicar.
- **Código:** PR draft **#2** em `brunerars/motor-ofertas-kit` (branch `fix/seam-1990-alinhamento`, base `feat/motor-ofertas-garimpo`). Os arquivos já foram copiados pro checkout normal, então o Obsidian mostra a versão corrigida. Memória: `emenda-tipografica-por-construcao`.
> **Verde no detector segue não sendo prova:** o impeccable deu `[]` nas **duas** versões, a errada e a certa. Quem pegou foi o olho do Bruno; quem provou foi a medição de pixel.

## Estado atual (2026-07-23) — Motor de conteúdo PROVADO ponta a ponta + diagramação nova promovida a template
O ciclo inteiro rodou com artefato real, e o conjunto de skills provou que **cria diagramação nova** a partir das referências da própria marca, não só recicla.

- [x] **Pipeline ponta a ponta.** Pinterest + reel (`@rodaccki`) → banco visual descrito (`marca/mood/`, 15 imgs com ano/confiança) → 1 referência + 2 ideias no Notion → **kanban** (view "Kanban · Nippon Speed Co") → carrossel de 6 slides em `marca/conteudo/storytelling/04-suzuka-cobrou-duas-vezes/`.
- [x] **`PRODUCT.md` + `DESIGN.md` declarados** na raiz do projeto. Sem eles o impeccable **trava** (`NO_PRODUCT_MD`) e as regras de drift não rodam. O drift só liga com os tokens no **frontmatter YAML**. Rodar sempre **da pasta da frente** (o `context.mjs` resolve a raiz pelo cwd).
- [x] **Diagramação nova, medida.** Baseline 25/40 (falhava AI slop nas 2 ordens) → 3 direções com referência real nomeada (pôster / revista japonesa / **paleta por era**, esta herdada das artes de ano do Caio) → 32/28/32 → a escolhida refinada a **34/40**. Exploração + `comparar.html` em `marca/conteudo/exploracao/`.
- [x] **Template `/post-feed` promovido** para "As Eras": base fixa (marca · fio de era · poço de aresta dura · campo de cor · **fita do tempo**) + módulos opcionais (`plate`, `seam`, paleta de era). **Eyebrow removido do template** (era o defeito nº1, 6 de 6 slides, e anti-referência do `PRODUCT.md`).
- **Cicatrizes embutidas na skill:** recorte do produto = **máscara dura + erosão + feather**, nunca alpha matting (deixa halo felpudo) e **nunca gerativo** (redesenha e falsifica a peça) · Anton só caixa alta (caixa baixa perde o pingo do "i") · diacrítico pede `line-height ≥ 1.16` · `object-fit:contain` sem altura fixa estoura o container · pipe mascara o exit do detector.
- ⚠️ **ABERTO — o teste que importa:** rodar o template num **tema diferente** do Suzuka (era única, sem `seam`/`plate`). Os módulos opcionais nunca foram exercitados. E rodar a **2ª frente (ACBK)** — trava: o `@` do Instagram dela ainda é placeholder.
- ⚠️ **Verde no detector não é prova de qualidade.** Ele deu exit 0 em peças com defeito visível; quem pegou foi o olho do Bruno (bordado "dourado" inventado, enquadramento, tamanho da peça). Os gates humanos são load-bearing.
- Método em `pesquisa/pesquisa-skills-claude/`: [[metodo-pipeline-conteudo]] · [[metodo-direcao-visual-nova]]. Memória: `motor-conteudo-multi-frente`.

## Estado atual (2026-07-22) — Motor de conteúdo Instagram (referência→roteiro) + reel-builder; carrossel Suzuka virou Reel
Sessão fora do fluxo do vault (rodou no terminal `Conteudo-Teste`). Nasceu um motor de conteúdo reutilizável pras lojas e a primeira skill de montagem de vídeo. Nada disso é do Bloco Ofertas — é a camada de **conteúdo/branding** da NSC.

- [x] **Motor de conteúdo virou kit reutilizável (loja-in-a-box).** `instagram-reference` (link/salvo → download → transcrição Whisper local → classificação → roteiro na voz da marca) e `instagram-saved-scanner` foram pra `~/.claude/skills/` (escopo-user) e leem `./conteudo/config.yaml` por loja. NSC configurada em `conteudo/` com editorial/voz reais: @nipponspeedco, memorabilia F1 vintage, dois canais (feed = história/branding, stories/WPP = venda).
- [x] **Notion multi-loja.** Databases Banco de Referências (`31063c2d…`) + Ideias de Conteúdo (`48aae757…`) sob a página "🎬 Instagram Content Machine", separados pela propriedade **Marca/Loja** (ACBK · Nippon Speed Co). Um par de bases serve N lojas.
- [x] **reel-builder — skill nova** (`.claude/skills/reel-builder/`, SKILL.md + 3 scripts ffmpeg). Monta Reel 9:16 renderizado. Dois modos: montagem (carrossel→Reel, Ken Burns + fundo desfocado + crossfade, zero API) e overlay (talking-head eixo + B-roll cobre a tela + legenda queimada). Testado: o carrossel **Suzuka 1990** (`marca/feed/01-suzuka1990`, 5 slides) virou um **Reel 9:16 de 18s** em `conteudo/reels/suzuka-1990/out/reel.mp4`, texto dos slides preservado.
- ⚠️ **ABERTO — reel-builder ainda é básico.** Hoje é só zoom + fade nos posts. Aprofundar com refs/skills boas da internet: transições de verdade, legenda karaokê palavra-a-palavra, música + ducking, sync automático da fala do talking-head.
- ⚠️ **ABERTO — ativar os slash commands.** Reiniciar o Claude Code p/ `/instagram-reference`, `/instagram-saved-scanner` e `/reel-builder` aparecerem (skills escopo-user + vault só carregam no boot).
- **Pendências:** preencher o `@` da ACBK no config de conteúdo dela; o slide de carrossel diz "ARRASTA →" (trocar essa CTA ao virar Reel); aposentar a pasta `Conteudo-Teste` (mantida como backup por ora).

## Estado atual (2026-07-17) — 1ª rodada com leads reais: 2 bugs de 3h e 1 de peça errada
Commit `cccb488` (branch `feat/motor-ofertas-garimpo`, **local, não pushado**). O `/agenda` rodou 3× em modo lote e enriqueceu 5 peças; as 4 da 556 já saíram no grupo. **Os leads chegaram de verdade pela 1ª vez** — e foi isso que revelou tudo.

- [x] **O lead caía SEMPRE na primeira peça da tabela.** Os 3 leads da `LEADS` apontavam pra row 27 (Camisa Lotus), incluindo 2 do boné Ferrari; o ping no zap do Bruno nomeava a peça errada, e foi assim que ele viu. **Não era o link nem escrita por nome:** o `mercari_id` texto estava certo nos 3 e o campo `peca` sempre recebeu `[row_id]`, a forma correta. **Ele recebia o id da linha errada.**
  - **Causa:** o conserto do LID (`a661589`) **inseriu** o nó `WAHA: resolver o numero` entre `Filtrar + montar lead` e `Baserow: achar a peca`. O `{{ $json.mercari_id }}` do nó de busca passou a ler o **contato do WhatsApp**, que não tem esse campo → filtro vazio.
  - 🔴 **Filtro VAZIO no Baserow não devolve zero linhas — devolve a TABELA INTEIRA.** Medido: `filter__mercari_id__equal=` → count=4; `=undefined` → 0; `=m71164960236` → 1. Com o `results[0]` do Code node, virou carimbo silencioso na 1ª linha. **Invisível porque o resultado era plausível:** uma peça real, com nome real, só que a errada. Ver baserow-filtro-vazio-tabela-inteira.
  - **Conserto:** referência nomeada na URL (copia o nó irmão `Baserow: leads desta peca`, que sempre fez assim e por isso nunca quebrou) + **trava** no `Montar a linha`: `pecaRows.find(r => r.mercari_id === lead.mercari_id) || null` no lugar do `results[0]` cego. A trava cobre 3 coisas: expressão órfã, religação futura de nós, e `mercari_id` duplicado (este Baserow **não tem unique constraint**). Não casou → link **vazio**, que é honesto; peça errada é pior que peça nenhuma.
  - **Dados reparados:** leads 17 e 19 repontados 27→31. Agora a 556 diz Lotus=1, Ferrari=2, que é a verdade.
  - ⚠️ **Falta reimportar os 2 workflows no n8n.** Enquanto não for, **o bug segue vivo em produção** — os arquivos estão consertados, o que roda não.
- [x] **As "3 horas na frente" eram DOIS bugs, e o pior estava escondido atrás do outro.** O Baserow guarda UTC e sempre esteve certo; quem mentia era a borda, nas duas pontas. Ver fuso-rsc-datetime-local.
  - **Exibir (cosmético):** `PecaLida` é **RSC** → `toLocaleString('pt-BR')` roda no servidor da Vercel, que é UTC. `'pt-BR'` fixa o **formato**, não o **fuso**. Post das 00:41 aparecia como "Saiu 03:41".
  - **Agendar (funcional, pior):** `datetime-local` manda hora de parede sem fuso; `new Date()` a lia no fuso do runtime = UTC. O Caio marcava 14:30 e gravava 14:30Z = **11:30 BRT** — a peça sairia **3h cedo**. Escondido porque UTC entrava e UTC saía: a tela era coerente consigo mesma.
  - **Conserto:** `borda/lib/hora.ts` (fuso IANA `America/Sao_Paulo`, não `-03:00` cravado — o DST é decisão política e já mudou). `14:30` agora grava `17:30Z`; a tela mostra 14:30. Bônus: data sem hora virou `400` (antes virava meia-noite UTC calada, mesma família de bug).
  - **6 guards novos** no `guards.mjs` — assert de fuso não sobrevive em code review, sobrevive em guard. Total 21, todos verdes.
  - > A lição já existia **uma camada acima**: o nó `Filtrar aprovados` do disparo fixa `timeZone` e tem o comentário avisando que o container roda em UTC. A borda nasceu depois e não herdou. Padrão a copiar, não a reinventar.
- [x] **Borda em formato de LISTA** (as 3 telas — compartilham a família `.peca-*`). Foto full-bleed 1:1 (390×390 no celular, ~750px/peça) → **miniatura 72px** num `.peca-cab` horizontal. Fila caiu de 4000px+ (batia no teto do `shot.mjs`) pra 3529px.
  - **A legenda continua À VISTA, de propósito.** Ela é o gate de aprovação: escondê-la atrás de um toque transformaria "conferir e aprovar" em "clicar Aprovar". Encolheu a foto, que é o que o Caio menos precisa reler ali.
  - Os estados sem foto eram o problema real, não a `<img>`: `-vazia` e `-erro` carregavam **uma frase inteira** cada, e em 72px não cabe texto. A frase desceu pro corpo como banner (`-info` / `-warn`); a miniatura ficou com rótulo curto. Contraste 4.94 e 5.38 nos dois temas.
  - Verificado: 21 guards · `drive.mjs` · gate de scroll horizontal (390/1440) · `contraste` nos 2 temas · `typecheck`. Tudo contra o **mock** — aprovar no Baserow real faria o cron postar no grupo.
- ⚠️ **ABERTO — "Tam: Tam: Ajustável".** A lista **expôs um defeito que o card grande escondia**, e está em produção: o Caio digita o campo COM o prefixo (`tags='Tam: L'`, `'Tam: Ajustável'`) e a borda renderiza `Tam: {tags}`. As legendas estão certas só porque o `/agenda` normalizou na mão. **Decisão do Bruno:** consertar na borda (tirar o prefixo ao exibir), no form/webhook (normalizar na entrada) ou no `/agenda`? Encosta na regra "a observação é de quem escreveu".
- ⚠️ **ABERTO — ressalvas de curadoria das peças que já saíram:** boné **Suzuka** (row 29) é **reedição de 2018** (`復刻`), não peça de época — o título "30th Anniversary" pode sugerir anos 90 numa loja de vintage · boné **Honda** (row 28) tem **furo pequeno** admitido na descrição e visível na foto 5 (não entrou na legenda, pela regra de 16/07) · o **óculos Schumacher** que o Caio rotulou "DEKRA Ferrari" era outra peça (possível link trocado; a row sumiu na limpa da tabela).
- **Pendências herdadas:** `BASEROW_TOKEN` vazado em 15/07 **segue sem rotacionar** (agora 3 workflows) · `/confere-ofertas` nunca rodou.

## Estado atual (2026-07-16, fim do dia) — BORDA v1 construída
- [x] **`borda/` — a mesa do Caio, a 1ª instância do hub.** Next na Vercel, pasta isolada. Ele vê a fila, confere legenda+preço, aprova, agenda, descarta, e marca o que sumiu do Mercari — **sozinho, do celular, sem ver pasta nem arquivo**. Desenho: `docs/borda-hub-caio.md`. Runbook: `borda/README.md`.
  - **Decisão travada: a borda NÃO tem IA em v1.** O estado já mora no Baserow → ver/aprovar/editar/agendar é `GET`/`PATCH`. Quem enriquece (`/agenda`) e quem gera post (`/post-stories`) continua sendo o Bruno. **Isso mantém a conferida dele no fluxo sem mecanismo novo:** o enriquecimento *é* a conferida; o aprovar do Caio é o gate comercial. ⚠️ **Quando o enriquecimento automatizar (v3), essa conferida some calada** — a mesma que pegou a row 5 e a peça falsa DEKRA. Reinserir freio explícito.
  - **Zero contato com produção:** `n8n/`, `waha/`, schema do Baserow, `garimpo/` e `lp/` intocados. Token PRÓPRIO (`BASEROW_TOKEN_BORDA`), escopado só na 556 — o dos workflows é *all tables* e alcança a `LEADS` (PII), e a borda é a 1ª coisa exposta na internet pública. `npm run smoke` prova o escopo (lê a 556, **falha** na 557).
  - **A costura do multi-loja:** `lib/loja.ts` `getLoja()` é **async mesmo lendo env** — na v2 vira lookup na `LOJAS` e **nenhum call-site muda**. Ninguém lê `BASEROW_TABLE_ID` fora dele.
  - **Freios provados no servidor** (botão desabilitado não é segurança): `Disparado`/`Vendido` → **403** (quem escreve é o n8n; se a borda pudesse, a fila mentiria pro cron) · **linha com `posted_at` → 409 `ja_postada`** · aprovar sem preço → **409** · `price_brl` → rejeitado pela allowlist · `status` sempre por **texto**, nunca pelo id `2573` (que só existe na 556 e quebra calado na loja 2). `npm run guards` ataca a rota direto e prova os 8.
  - ⚠️ **O cadeado do disparo tem UMA chave, e é o `status` (achado 16/07).** O `Ainda dá pra disparar?` do n8n decide só por ele — e a #28/#29 estavam em `Aprovado` carregando `posted_at`+`wa_message_id` das 20h, prontas pra sair **de novo** às 9h. A borda tinha o mesmo buraco por outro caminho: o `PERMITIDOS` validava o status de **destino** (e `Aprovado` é destino legítimo), nunca o **atual**. Consertado do lado da borda (guard `ja_postada` olha `posted_at`, que só o n8n escreve). **O lado do n8n é do Bruno:** o IF precisa exigir `posted_at` vazio, senão o cadeado continua com chave única — e o campo da chave é o que todo mundo mexe.
  - **A aba se chama "Saiu do Mercari", não "Vendidos"** — `sold` significa *o anúncio sumiu do Mercari* (problema: compraram antes da gente), e *o cliente comprou* é a `LEADS`. Os dois se chamavam "vendido" e são quase opostos.
  - **O card fala em JANELA, não em estado** ("sai na próxima janela, até 30min"): envio lento estoura o timeout, o post sai mas a linha não vira `Disparado` — status cru viraria mentira.
  - **Ferramentas novas, reutilizáveis:** `scripts/mock-baserow.mjs` (Baserow falso: peça normal + sem preço + rascunho cru → desenvolver a Fila sem escrever em produção) e `scripts/shot.mjs` (screenshot via CDP em 390 e 1440, **falha se a página rolar na horizontal**). O atalho de salvar HTML e abrir em `file://` **não serve**: quebra a hidratação e a tela vira "Application error".
  - ⚠️ **Ciclo real NÃO exercitado:** a 556 tem 3 linhas e **todas já foram disparadas** — não há peça em `Fila` (a row 23 sumiu). A Fila foi provada contra o mock. **Não se flipa `Disparado` → `Fila` pra testar: aprovar faria o cron REPOSTAR no grupo real.**
  - **Pendente do Bruno:** criar o token escopado → deploy (SSO off, alias) → `/agenda` num link novo → o Caio aprovar sozinho. **O teste que importa: ele não perguntar nada.**

## Estado atual (2026-07-16)
- [x] **O cadeado do disparo tinha UMA chave (`status`) — agora tem duas.** `status` é o campo que **todo mundo mexe** (Bruno na UI, Caio na borda, PATCH de teste), então devolver uma linha **já postada** pra `Aprovado` fazia o cron **repostar no grupo real**: `Aprovado` é destino legítimo e o gate não olhava mais nada. **Achado pela sessão da borda**, com as rows 28/29 em `Aprovado` carregando `posted_at`+`wa_message_id` das 23h, agendadas pra sair 2× às 9h. Segunda chave = **`posted_at` vazio** (só o cron escreve esse campo, então ele não mente). Mesmo guard que a borda já aplica (`409 ja_postada`). Repostar de propósito passou a exigir limpar o `posted_at` na mão — o atrito é a feature. 12 testes contra as linhas reais.
- [x] **Duplicata no grupo: causa achada e fechada (o 1º bug que chegou no cliente).** 3 peças foram pro grupo **11 vezes** (3 rodadas; a das 22:30 UTC teve 5 posts de 3 peças). Diagnóstico pelo histórico do WAHA (`/api/default/chats/<grupo>/messages`) — **essa é a fonte da verdade do que saiu**, não o Baserow.
  - **Causa:** o `Baserow: listar linhas` roda **uma vez, no topo da rodada**, e entre listar e enviar a última peça passam até 20min. **Duas execuções sobrepostas** (A às 22:30:49, B nascida logo depois) leram a mesma lista; B passou a rodada postando de um **retrato desatualizado**. Os horários batem: os intervalos de B eram 3min35 e 3min27 = a espera configurada, e o Baserow guarda os message_ids **de B** (quem PATCHou por último).
  - **O `teto` nunca ia salvar isso** — ele só garante que UMA rodada caiba no cron; não impede uma SEGUNDA execução de nascer no meio (**"Test workflow" na mão** com a agendada rodando, ou 2 workflows ativos). Marcar `Disparado` **depois** do envio deixava a janela escancarada.
  - **Conserto (dentro do loop):** `reler a linha` no instante do envio → `Ainda dá pra disparar?` (pula `Disparado`/`Descartado`) → **`marcar Disparado` ANTES de enviar** (o cadeado) → WAHA → `gravar message id` (onError=continue). Simulação das 2 execuções reproduz o bug na versão velha (5 posts) e dá 3 na nova.
  - **Troca assumida:** WAHA falhar = peça `Disparado` que não saiu (detectável: `wa_message_id` vazio). **Perder uma peça é mais barato que duplicar no grupo** (reputação + risco de ban).
  - Bônus: o payload sai da linha recém-lida (legenda editada depois da aprovação sai certa) e sumiu o `$('Filtrar aprovados').item`, que atravessava a fronteira do `splitInBatches`.
- [x] **LID: o `from` do WhatsApp não é telefone (16/07, achado no 1º lead real).** O aviso saía com `wa.me/21522181840928` — link morto. O WhatsApp entrega o remetente como **LID** (identidade interna, `@lid`), e o `from.split('@')[0]` gravava isso em `phone`. Agora o node `WAHA: resolver o numero` traduz via `GET /api/contacts?contactId=<lid>` → usa **`id`** (o campo **`number` é o LID de novo, armadilha**). **LID desconhecido volta 200 com `id`=o próprio LID** → quem valida é o sufixo `@c.us`, não o status. Não resolveu = `phone` vazio + aviso **sem** `wa.me` (link quebrado é pior que link nenhum). Campo novo `wa_id` na LEADS guarda a identidade estável. 19 testes.
- [x] **Dedup do lead: read-then-write → insert-and-reconcile.** O WAHA às vezes entrega o **mesmo evento 2×** (16/07: 1 mensagem → 2 leads, 36ms e 145ms de diferença). Perguntar-antes-de-inserir não tem defesa: as duas execuções fazem o GET antes de qualquer INSERT. **Este Baserow não suporta unique constraint** (`field_constraints` não existe na API de campos) → o banco não pode arbitrar. Agora: grava sempre → espera 3s → reconsulta → **menor `row_id` vence**, o outro apaga a própria linha e fica calado. **Sem lock:** as duas execuções chegam à mesma conclusão sozinhas porque o `row_id` é crescente. Ordinal passou a contar **pessoas**, não linhas (era o que dava "3ª pessoa" havendo 2). 14 testes simulando a corrida. Mesma família do bug do disparo.
- [x] **Ciclo do lead fechado — a Fase 3 começou.** `n8n/nsc-lead-inbound.json`: o cliente clica no `🏁 Quero essa peça`, o WAHA faz POST no n8n (`WHATSAPP_HOOK_URL`, evento `message`), o Code casa o `mXXXX` com a peça e grava na tabela **`LEADS`** (1 linha = 1 pessoa; N:1 com a 556) + ping no zap do Bruno com o nome da peça e o ordinal ("2ª pessoa"). **O bot NÃO responde cliente** — quem atende é o Bruno.
  - **O `wa_message_id` era uma mentira documentada em 3 lugares:** dizia "rastreio de lead", mas guarda o id da mensagem que o **bot envia**. Por isso o passo 4 do `/confere-ofertas` apontava pro vazio desde 02/07. Corrigido; quem rastreia lead é a `LEADS`.
  - **Freio que decide tudo:** o hook recebe **toda** mensagem, inclusive as ofertas que o próprio bot posta no grupo. O Code descarta `fromMe` + `@g.us` + mensagem sem id. Evento é `message` (não `message.any`, que incluiria os próprios envios). 21 testes de node cobrindo isso.
  - `responseMode: onReceived` (≠ do garimpo): o WAHA só quer o 200. Com `responseNode`, todo "oi" descartado penduraria o webhook até o timeout.
  - **Path secreto é o único freio** — o WAHA não assina o POST. **PII:** a `LEADS` guarda telefone de cliente (1ª tabela com dado pessoal do projeto).
  - Pendente do Bruno: criar a tabela `LEADS` na UI (criar tabela exige JWT, o Database Token não faz) + `WAHA_ADMIN_ID` (número pessoal) + redeploy do WAHA com o `WAHA_HOOK_URL`.
- [x] **Z-API → WAHA: a operação virou auto-hospedada (sem mensalidade).** `waha/stack-vps.yml` (Swarm+Traefik, `network_public`, domínio `waha.arvsystems.cloud`) **no ar na VPS**; `waha/docker-compose.yml` = o mesmo local, pra teste. Sessão `default` conectada no número da loja (`5511914563609`). Grupo real = **`120363410530925527@g.us`** (formato WAHA; o `120363429602486219-group` da Z-API era de OUTRO número e não existe aqui). `n8n/nsc-dispara-ofertas.json` migrado (`/api/sendImage` + header `X-Api-Key`) e **testado na mão: funcionando**. Skill `/dispara-oferta` reescrita pro WAHA (as 2 cópias).
  - **Simplificou:** a Z-API exigia base64 do acervo local; o WAHA busca o `photo_url` público do Baserow direto. Menos um passo.
  - **Gotchas do WAHA** (todos já resolvidos nas stacks, ver n8n-import-gotchas e a skill): sessão morre sem volume · **API key se regera a cada start** se não vier como env (o n8n toma 401 do nada) · `shm_size` não funciona em Swarm → **tmpfs no `/dev/shm`** ou o Chromium morre calado · `replicas: 1` obrigatório (sessão não se divide) · envio lento → **timeout 120s** no n8n (curto = post sai mas linha não vira `Disparado` = duplicata no tick seguinte).
  - ⚠️ **WEBJS é frágil por natureza:** em 16/07 quebrou o `refreshQR` (`Cmd.refreshQR is not a function`) — o QR parava de renovar e escanear não adiantava. Quando a sessão não conectar, `docker logs waha` ANTES de culpar o resto. É o preço de sair da API paga.
- [x] **Esteira do Caio consertada e provada ponta a ponta.** O webhook em prod **descartava título e preço** do form (o Code node nem lia os campos). Agora `title_pt` e `price_brl` chegam inteiros — validado com os 4 casos (`R$ 750,00`→750 · `1.250,50`→1250.5 · vazio→sem preço · **`¥ 2.500`→rejeitado**, antes virava R$ 2,50 no grupo). O form parou de mentir: só diz "Recebido!" se contar os `id` das linhas criadas (antes dizia sucesso com o banco vazio).
- [x] **Legenda no modelo do Caio** (ver "Modelo de preço + legenda" nas Decisões travadas). Primeira peça real da esteira nova = row 23 (Benetton F1, R$ 350), em `Fila` esperando aprovação.
- **Pendências:** `BASEROW_TOKEN` vazado em 15/07 ainda **precisa rotacionar** (agora afeta 2 workflows) · `/confere-ofertas` continua 100% no papel, e agora está desatualizada (fala Z-API) · avaliar tirar as `ZAPI_*` do `.env` quando o WAHA firmar.

## Estado atual (2026-07-15)
- [x] **Canal de entrada do Caio NO AR + testado ponta a ponta (15/07)** — Fase 2 virou operação de dois. Form → webhook → Baserow provado: teste pela UI gerou o rascunho #10 (`Fila`, `photo_url` vazio, nota preservada em `tags`).
  - `garimpo/index.html` — formulário estático (design system V1, mobile-first, favicon do kit): Caio cola de 1 a **20** links + nota opcional, `POST` JSON `{secret, items[]}`. **Publicado:** `garimpo-nsc.vercel.app` (SSO off). Secret `nsc-1179eaf4c820ba4d` (freio leve, visível no fonte por design). Webhook: `https://autowebhook.arvsystems.cloud/webhook/nsc-garimpo-8f3a1c`. Ambos no `.env` (`N8N_WEBHOOK_URL`, `FORM_SECRET`).
  - `n8n/nsc-garimpo-webhook.json` — workflow importado e ativo no n8n do Bruno. **2 gotchas achados no setup:** (a) no Code node o `$input` é o node ANTERIOR (Config), não o Webhook → ler o corpo via `$('Webhook (form do Caio)').json.body`; (b) regex com `\d`/`\/` quebra ao colar o código na mão no n8n (a barra some) → usar `/m[0-9]+/i`, sem backslash.
  - `/agenda` **modo lote** (`SKILL.md`): rodar sem URL → pesca os rascunhos (`Fila` + `photo_url` vazio) → enriquece via `PATCH` (não duplica). É a ponte: form entrega cru, `/agenda` completa. **Ainda não exercitado** (próximo passo real).
  - Fluxo: Caio → form → webhook → Baserow (rascunho) → `/agenda` lote → Bruno aprova → n8n dispara. O link cru NÃO é disparável (disparo exige `photo_url`+`caption`).
  - ⚠️ **PENDÊNCIA DURA:** o `BASEROW_TOKEN` (Database Token) **vazou no chat em 15/07** → **rotacionar** e atualizar o Config dos DOIS workflows (disparo + garimpo). Outras herdadas: Z-API paga/grupo real, trocar GRUPO-TESTE.
  - Rascunho de teste #10 (`m71370664392`, dup do #3 já `Disparado`) pode ser apagado.
- **`/confere-ofertas` (Fase 3):** 100% no papel (SKILL.md + campo `sold`/status `Vendido` prontos), **nunca rodou**; falta o workflow n8n gêmeo. Frente separada.

## Estado atual (2026-07-14)
- [x] **FASE 1 NO AR** — LP em produção (https://nippon-speed-co.vercel.app) com a **logo oficial** (kit `marca/logo/kit`, disco `#e60000`, favicon = wordmark), os 10 CTAs no **grupo real** e a peça em destaque certa.
- ⛔ **PEÇA FALSA (`m33557684905`, boné DEKRA)** — identificada pelo Caio em 13/07. Fora da LP, do story e do storytelling da Ferrari; marcada como `bloqueado` no `acervo/index.json`+`meta.json` e no `ideias-feed`. **Nunca republicar.** Substituta: `m48149424293` (boné Ferrari nº 1 do Schumacher, link curado pelo Caio, 19 fotos), com copy honesta (usado, desbotado, com manchas).
- **@ oficial: [@nipponspeedco](https://www.instagram.com/nipponspeedco/)** — o handle dos posts já é esse, não é mais placeholder.
- **Prontos pra publicar:** storytelling `01-suzuka1990` (feed) · stories (`ferrari-nº1`, `west-mclaren`) · `como-funciona` (feed) · destaques 9:16 (como-funciona + FAQ) · carrossel da campanha.
- **Parados por decisão (pós-lançamento):** storytelling `02-ferrari-vermelha` e `03-honda-japao` — faltam as capas de imagem.
- **Fotos do Suzuka 1990 (post 01):** imagens de terceiros (Pinterest), sem licença. **Decisão do Bruno (14/07): mantém e assume o risco.** Não reabrir; se algum dia vier reclamação de direitos, o caminho é trocar as 3 imagens e re-renderizar os slides 2–4.

## Estado atual (2026-07-02)
- [x] **Empacotado como repo standalone** — as 6 skills copiadas pra `.claude/skills/` DENTRO do projeto (roda com/sem o vault Obsidian). `SETUP.md` (runbook clone→configure→opera + como abrir loja nova do template), `.gitignore` (protege `.env`), `README.md` (visão + divisão humano×Claude×n8n). **Versionado no GitHub:** `github.com/brunerars/motor-ofertas-kit` (privado, criado+push via MCP+git; enxugado 206→95 arquivos, referência Webflow fora do tracking). Vault do Cello = `github.com/cello1508/cellovault` (separado). **Dois modelos de negócio mapeados:** produto/kit (clona loja nova) × consultoria+cérebro (profundidade sob medida por loja) — o kit é a base dos dois; **embutir cérebro no workflow = avaliar depois** (é a camada premium). `/confere-ofertas` = ponto de melhoria (adiado). Daqui: testar/refinar (legenda, imagens dos posts), não abrir frente nova.
- [x] **n8n de produção NO AR (funcionando 2026-07-02)** — `n8n/nsc-dispara-ofertas.json` (Schedule→Baserow lista→filtra Aprovado→Z-API send-image→marca Disparado; 6 nodes) importado e disparando de verdade. Operação recorrente agora é **0 token** (Claude só no `/agenda`+aprovação). Gotcha do setup: Z-API usa **3 valores distintos** — instância + token-da-instância (ambos na URL `/instances/{i}/token/{t}/send-image`) + **Client-Token** (Account Security Token, no header); não confundir token-da-instância com Client-Token. Endpoint é `/send-image` (não `/send-text/send-image`). Guia: `n8n/COMO-IMPORTAR.md`. **Problema da foto resolvido:** n8n hospedado NÃO acessa arquivo local → campo **`photo_url`** (upload da foto no Baserow via `POST /api/user-files/upload-file/` com Database Token → URL pública `/media/user_files/…`, abre sem auth, Z-API busca por ela). `/agenda` atualizado pra subir a foto; 3 rows com backfill. **Docs de produto:** `README.md` (divisão HUMANO×CLAUDE×n8n em tabelas + fluxo mermaid, base p/ whiteboard) e `.env.example` (guia de setup humano).
- [x] **Bloco Ofertas RODANDO AO VIVO + gate de aprovação** — 6 skills (Marca: marca/acervo/lp · Ofertas: agenda/dispara-oferta/confere-ofertas). **Z-API conectada** (grupo GRUPO-TESTE `120363429602486219-group`). **Ciclo completo provado 2026-07-02** com 2 peças: `/agenda` → `Fila` → flip `Aprovado` → `/dispara-oferta` posta no grupo → `Disparado`+`posted_at`+`wa_message_id`. Campo **`caption`** (texto exato do post, humano aprova/edita) + portão: `/dispara-oferta` NUNCA dispara `Fila`. Gotchas Z-API: corpo UTF-8 (emoji quebra shell), imagem base64 do acervo, single_select aceita value string via `user_field_names=true`. Ver zapi-whatsapp-gotchas.
  - **Refino do fluxo de aprovação (aberto):** `photos` no Baserow é texto → o humano não vê a imagem lá. Ideal: `/agenda` renderizar o card do post e (a) anexar em campo de arquivo do Baserow ou (b) mandar preview no 1:1. Hoje o preview é mostrado no chat.
  - **Cloud routine testada e provada 2026-07-02** (`CronCreate`, cada 5min): disparou sozinho 2 `Aprovado` no grupo → `Disparado`; tick seguinte com 0 `Aprovado` NÃO postou (anti-spam OK). **Limitação: `CronCreate` é session-only** (some quando a sessão fecha, não é 24/7). Pra operação real = **cron persistente na VPS** chamando a mesma lógica. Cron de teste deletado após validar.
  - **Calibração da aprovação pegou algo real:** item vintage (row 5) tinha condição subestimada na legenda ("sem riscos" vs. JA dizia leve uso + foto com marcas) → corrigido pra honesto. Prova o valor da conferida humana de tradução+foto.
- [x] **Baserow DISPARADOR pronto** (db 104 · tabela 556, schema `Ofertas` de 16 campos criado via API JWT). Write-path do Database Token validado (insert/delete). 1 oferta real na `Fila` (Benetton). Doc: `docs/baserow-disparador-schema.md`. ⚠️ senha de setup passou no chat → rotacionar. `.env` corrigido (DATABASE_ID=104, TABLE_ID=556).
- [x] **Skill `/acervo` construída e validada** (`.claude/skills/acervo/`): URL Mercari curada → Firecrawl (só fotos+título) → `marca/acervo/<id>/` + `index.json`. Gotcha embutido: CDN Mercari dá 403 p/ urllib → User-Agent de browser + Referer.
- [x] **Acervo com 3 itens** (Benetton F1, Suzuka '90, Red Bull Honda 2019 · 26 fotos) → **faixa de vitrine na LP** (2 peças reais + card "tem mais no grupo"), no ar. Loop `/acervo`→vitrine→redeploy validado.
- [x] `design-system2.html` pronto e limpo (`marca/referencia/webflow-refencia/`) — clone do Haus, motion reconstruída (IntersectionObserver, conteúdo visível por padrão), 7 seções renderizando. Validado por screenshot.
- [x] **Firecrawl validado no Mercari** (key no `.env`). Extração estruturada OK: título/preço/descrição/estado/7 fotos. Prova o coração do `/agenda`. API nova: `formats:["markdown","json"]` + `jsonOptions{prompt,schema}`, endpoint `POST /v1/scrape`.
- [x] Item piloto extraído → `lp/item-piloto.json` (Benetton F1 boné vermelho, ¥2.500, vintage anos 90).
- [x] **LP pronta** (`lp/index.html`, dark+vermelho, self-contained): hero (bg F1 sem texto) · Benetton em destaque com galeria · "como funciona" com artes do Caio · timeline · CTA grupo. Validada desktop+mobile.
  - Correções pós-subagente: `capa03` tinha texto embutido → recorte central `hero-bg.jpg`; logo era lockup em canvas gigante (invisível) → recorte justo `logo-mark.png`; "botão cortado no mobile" era artefato de captura headless (vw 476 vs img 390), não bug.
  - [x] **NO AR (público):** https://nippon-speed-co.vercel.app · projeto Vercel `nippon-speed-co` (id prj_Zvxcj57IQYi3LfW8goOAddrqoFsK, team_UAxVjXgJHIfUnZ6lMN8fevvq). CTAs = WhatsApp OFICIAL da loja 5511914563609 (o "Quero essa peça" com texto pré-preenchido citando o item).
  - **Rotina de deploy** (token no `.env`): `npx vercel deploy lp --prod --yes --scope brunoconstantinou-4051s-projects --token=$VERCEL_TOKEN` → depois `vercel alias set <deploy-url> nippon-speed-co.vercel.app` (o alias NÃO segue prod sozinho). SSO Deployment Protection vem LIGADO por padrão → desligar: `PATCH api.vercel.com/v10/projects/nippon-speed-co {"ssoProtection":null}`. Ver vercel-deploy-lp-gotchas.
  - Pendentes de polish: trocar número de teste pelo convite do grupo real; gerar 3 imagens dos passos via `/nanobanana` (precisa GEMINI_API_KEY); melhorar qualidade do design system + usar imagens hi-res (Pinterest) na origem.
- ~~**Preço na LP/ofertas = "valor e frete sob consulta no grupo"**~~ → **revisto em 16/07, ver "Modelo de preço + legenda" nas Decisões travadas.** A **LP** segue sem fechar R$ (CTA → grupo). A **oferta no WhatsApp agora mostra o R$** (vem do form do Caio).
- Pendências: link do convite do grupo WhatsApp (placeholder `REPLACE_ME` na LP) · chaves Baserow/Z-API (Bloco Ofertas).

## Relacionado
[[caio-logistica-japao]] · [[infoproduto]] · carol-socia · [[crm-slotter-produto]]
