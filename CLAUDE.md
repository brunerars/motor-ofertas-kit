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
- **DB/fila:** Baserow (API + MCP) — Bruno já domina do `crm-slotter-produto`
- **WhatsApp:** **WAHA** auto-hospedado (`devlikeapro/waha`, CORE, engine WEBJS) — stack em `waha/`. Substituiu a **Z-API** (paga) em 16/07.
- **Design:** método `Extract HTML Design System v2` (ref → download `sd.asimov.academy` → `design-system2.html`)
- **Conteúdo:** `/nanobanana` · `/motion` · `/ghostwriter`
- **Disparo agendado:** n8n hospedado (Schedule Trigger → Baserow → WAHA). Ver "Decisões travadas".

## Esteira (skills)
**Bloco Marca** (semente, reutilizável por loja) — **as 3 skills existem** (`.claude/skills/`):
- `/marca <ref>` → `design-system2.html` (método Extract + motion + recorte logo/hero embutidos; prompt Extract copiado na skill).
- `/acervo <url_mercari...>` → baixa fotos pro `marca/acervo/`. Leve, desacoplado. NÃO traduz/precifica.
- `/lp <produto>` → LP self-contained + deploy Vercel (rotina completa). Consome `marca/acervo/`. Padrões: `docs/roteiro-lp.md` + `docs/logistica-mercari.md`.
- **Posts (estratégia 2 canais, 08/07)** → skills dedicadas **`/post-feed`** (carrossel NARRATIVO = autoridade/branding: história 1º + produto só no fim como CTA, SEM badge) e **`/post-stories`** (cartão de peça = venda: badge VERDE "sob encomenda" + "fala com a gente"). Ambas: design system V1 → HTML→PNG 3:4 (1080×1440), 0 token de imagem. Banco de temas em `marca/conteudo/ideias-feed.md`; templates em `.claude/skills/post-*/template.html`. Ver nsc-conteudo-dois-canais. (Evolução do plano antigo de usar só `/conteudo`+`/nanobanana`.)

> **Desacoplamento (decisão 2026-07-02):** Firecrawl pesado (traduz/preço/estado) roda SÓ na entrada do Bloco Ofertas (hoje o n8n; era o `/agenda`). `/lp` e vitrine usam fotos do acervo (`/acervo`). Sem acoplamento cruzado.

> **Produtização da LP rápida:** `docs/roteiro-lp.md` (voz + estrutura padrão, reutilizável por loja) e `docs/logistica-mercari.md` (fonte da verdade da operação do Caio). Base do que vira a skill `/lp`.

**Bloco Ofertas** (loop operacional) — **graduou pra n8n em 28/07**. As skills `/agenda`, `/dispara-oferta` e `/confere-ofertas` foram aposentadas pra `.claude/_skills-deprecated/`: **não recriar nem invocar**. Onde cada perna foi parar:
- **Entrada + enriquecimento** (era `/agenda`): form do Caio → webhook n8n → rascunho no Baserow → aprovação do Bruno no próprio Baserow.
- **Disparo** (era `/dispara-oferta`): n8n Schedule Trigger → GET Baserow `Aprovado` → POST WAHA `/api/sendImage` → PATCH `Disparado`.
- **Conferida de vendido** (era `/confere-ofertas`): **ainda pendente** no n8n — é a perna que falta.

**Bloco Conteúdo / Branding** (motor referência→ideia→post — camada nova, 2026-07):
- **Onde vivem as skills:** `instagram-reference` e `instagram-saved-scanner` existem em **dois lugares** — no vault (`.claude/skills/`, a cópia que RODA, porque o vault tem precedência) e em `~/.claude/skills/` (cópia-espelho pra servir N lojas fora do vault). **Editar sempre a do vault e sincronizar a global** (constatado 04/08; edição só na global é ignorada em silêncio). Origem/protótipo: `Desktop/Gerador-Conteudos/Conteudo-Teste/` (histórico).
- **Separação por frente:** 1 par de DBs Notion compartilhado (Banco de Referências + Ideias de Conteúdo) separado pela propriedade **Marca/Loja**. Cada frente tem `conteudo/config.yaml` + `editorial-framework.md` + `voice-model.md`. A skill lê o config da frente corrente (cwd) — ver a **regra dura de seleção de frente** no SKILL.md (nunca carimba loja errada quando roda da raiz do vault).
- **Abrir nova frente:** (a) novo valor em `Marca/Loja` nos 2 DBs; (b) copiar o `config.yaml` template + preencher `loja`/`notion_marca`/`instagram_username`; (c) escrever `editorial-framework.md` + `voice-model.md`; (d) criar a view kanban filtrada.
- **Fluxo-alvo:** refs (IG salvos/link + Pinterest via `pinterest-mood`) → banco → ideia (kanban por Status) → curadoria humana → `/post-from-idea` rende o carrossel 3:4 igual Suzuka. Bancos de imagem: `marca/acervo/` = foto da peça · `marca/mood/` = capa/mood do Pinterest.

## Features
- **PRINCIPAIS:** design-system · entrada/enriquecimento · preview+aprovação · agendamento · disparo
- **SECUNDÁRIAS:** captura lead `wa.me`→1:1 · resumo pré-janela · conferida de vendido · notifica interessados

## Fases (ordem por valor)
- **Fase 1 — Marca** (ATIVA): `/marca` → `/lp` → `/posts`. Pronto = loja tem identidade, LP no ar, posts prontos pra mostrar ao Caio.
- **Fase 2 — Ofertas:** entrada (`garimpo/` form do Caio → webhook n8n → Baserow rascunho) → `/agenda` (modo lote enriquece) → aprovação do Bruno no Baserow → `/dispara-oferta` (n8n) posta no grupo. Pronto = link garimpado pelo Caio vira post no grupo, com a conferida do Bruno no meio.
- **Fase 3 — Nutrição** (COMEÇOU 16/07): captura lead **feita** (`n8n/nsc-lead-inbound.json`: WAHA inbound → tabela `LEADS` → aviso no zap do Bruno). Falta o `/confere-ofertas` e o "avisa interessados" (que agora tem de onde ler).

## Decisões travadas
- Disparo agendado = **n8n hospedado**. A cloud routine do Claude foi testada e descartada (session-only); worker VPS novo também não. Detalhe do fluxo mais abaixo, em "Visão de produto + arquitetura de custo".
- Botão "tenho interesse" em grupo **não existe nativo** → link `wa.me` com texto pré-preenchido referenciando o SKU
- Começar pelo Bloco Marca
- **LP = V1 "Editorial Garage" (claro/editorial)** desde 07/07: tinta `#111` sobre papel `#f5f5f5`, vermelho de sinal. Substituiu a direção antiga "base escura + vermelho". Tokens no `DESIGN.md`. Deploy Vercel.
- **Hero animado = DESCARTADO (08/07).** O wordmark virando o MP4/8 do Senna foi prototipado (`lp/hero-lab.html`, sticky+rAF), integrado e testado no iPhone: o Bruno vetou — "a original tá melhor de todas". Não reabrir sem pedido dele. (fonte: [[2026-07-08 — Nippon Speed hero anim descartada + catalogo planejado + acervo]])
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
  > O n8n **não monta legenda**: lê `caption` do Baserow e repassa cru pro `send-image`. Quem escreve a legenda é o passo de entrada/enriquecimento (hoje no n8n; era o `/agenda`). Mudou o formato? Mexe só lá.
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

**ROI/porém:** validar com **UMA loja rodando pro Caio (NSC)** antes de generalizar o kit. Moat = velocidade de setup + know-how de garimpo do Caio, não a tech. Depois: organizar em repo separando template × instância. Liga com `crm-slotter-produto` · `framework-operacao`.

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

## Anatomia do pod (régua de 06/08 — ver ANATOMIA-DE-POD no ECOSSISTEMA do vault)
- **Posts novos nascem em `conteudo/posts/NN-slug/vN/`** (o esquema canônico do vault, com `notas.md`/`legenda.md`/`comparar.html`). O legado fica onde está, em `marca/conteudo/` — não migrar.
- **O trio de estado, cada um com um papel:** este `CLAUDE.md` é o cérebro no repo (a verdade técnica) · `motor-ofertas-nsc.md` é o hub de Estado no vault (aliases, wikilinks, "onde parei") · `docs/historico-estados.md` é a arqueologia por data. Não fundir.
- **Pendência registrada no registry do vault:** enxugar este CLAUDE.md pro alvo ≤80 linhas do padrão de pod (hoje ele é o doc legado pré-`/pod`).

## Histórico
Estados anteriores (2026-07-02 → 2026-07-23) em [[historico-estados]] (`docs/historico-estados.md`) — gotchas e decisões de cada rodada.

## Relacionado
[[caio-logistica-japao]] · [[infoproduto]] · carol-socia · `crm-slotter-produto`
