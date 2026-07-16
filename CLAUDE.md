---
tipo: projeto
status: ativo
fase: 1 — Marca
atualizado: 2026-07-02
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
- **Posts (estratégia 2 canais, 08/07)** → skills dedicadas **`/post-feed`** (carrossel NARRATIVO = autoridade/branding: história 1º + produto só no fim como CTA, SEM badge) e **`/post-stories`** (cartão de peça = venda: badge VERDE "sob encomenda" + "fala com a gente"). Ambas: design system V1 → HTML→PNG 4:5 (1080×1350), 0 token de imagem. Banco de temas em `marca/conteudo/ideias-feed.md`; templates em `.claude/skills/post-*/template.html`. Ver [[nsc-conteudo-dois-canais]]. (Evolução do plano antigo de usar só `/conteudo`+`/nanobanana`.)

> **Desacoplamento (decisão 2026-07-02):** Firecrawl pesado (traduz/preço/estado) é SÓ do `/agenda`, no agendamento. `/lp` e vitrine usam fotos do acervo (`/acervo`). Sem acoplamento cruzado.

> **Produtização da LP rápida:** `docs/roteiro-lp.md` (voz + estrutura padrão, reutilizável por loja) e `docs/logistica-mercari.md` (fonte da verdade da operação do Caio). Base do que vira a skill `/lp`.

**Bloco Ofertas** (loop operacional):
- `/agenda <url_mercari>` → Firecrawl → traduz descrição / converte preço / pega imagem → fila Baserow → preview WhatsApp 1:1 → aprova → agenda
- `/dispara-oferta` → dispara agendadas no grupo (+ resumo pré-janela ~20min)
- `/confere-ofertas` → cron diário: vendido? marca no Baserow + avisa grupo (+ interessados)

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
- **Motion:** não replicar o timing exato do IX2 do Webflow — usar camada própria de animação inteira (IntersectionObserver + CSS, progressive enhancement, conteúdo visível por padrão). Ver [[design-system-extract-motion-gotcha]].
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

## Estado atual (2026-07-16)
- [x] **Duplicata no grupo: causa achada e fechada (o 1º bug que chegou no cliente).** 3 peças foram pro grupo **11 vezes** (3 rodadas; a das 22:30 UTC teve 5 posts de 3 peças). Diagnóstico pelo histórico do WAHA (`/api/default/chats/<grupo>/messages`) — **essa é a fonte da verdade do que saiu**, não o Baserow.
  - **Causa:** o `Baserow: listar linhas` roda **uma vez, no topo da rodada**, e entre listar e enviar a última peça passam até 20min. **Duas execuções sobrepostas** (A às 22:30:49, B nascida logo depois) leram a mesma lista; B passou a rodada postando de um **retrato desatualizado**. Os horários batem: os intervalos de B eram 3min35 e 3min27 = a espera configurada, e o Baserow guarda os message_ids **de B** (quem PATCHou por último).
  - **O `teto` nunca ia salvar isso** — ele só garante que UMA rodada caiba no cron; não impede uma SEGUNDA execução de nascer no meio (**"Test workflow" na mão** com a agendada rodando, ou 2 workflows ativos). Marcar `Disparado` **depois** do envio deixava a janela escancarada.
  - **Conserto (dentro do loop):** `reler a linha` no instante do envio → `Ainda dá pra disparar?` (pula `Disparado`/`Descartado`) → **`marcar Disparado` ANTES de enviar** (o cadeado) → WAHA → `gravar message id` (onError=continue). Simulação das 2 execuções reproduz o bug na versão velha (5 posts) e dá 3 na nova.
  - **Troca assumida:** WAHA falhar = peça `Disparado` que não saiu (detectável: `wa_message_id` vazio). **Perder uma peça é mais barato que duplicar no grupo** (reputação + risco de ban).
  - Bônus: o payload sai da linha recém-lida (legenda editada depois da aprovação sai certa) e sumiu o `$('Filtrar aprovados').item`, que atravessava a fronteira do `splitInBatches`.
- [x] **LID: o `from` do WhatsApp não é telefone (16/07, achado no 1º lead real).** O aviso saía com `wa.me/21522181840928` — link morto. O WhatsApp entrega o remetente como **LID** (identidade interna, `@lid`), e o `from.split('@')[0]` gravava isso em `phone`. Agora o node `WAHA: resolver o numero` traduz via `GET /api/contacts?contactId=<lid>` → usa **`id`** (o campo **`number` é o LID de novo, armadilha**). **LID desconhecido volta 200 com `id`=o próprio LID** → quem valida é o sufixo `@c.us`, não o status. Não resolveu = `phone` vazio + aviso **sem** `wa.me` (link quebrado é pior que link nenhum). Campo novo `wa_id` na LEADS guarda a identidade estável. 19 testes.
- ⚠️ **O dedup do lead perde numa corrida de ~40ms — em aberto.** O WAHA às vezes entrega o **mesmo evento 2×** (16/07: 1 mensagem → 2 leads, 36ms e 145ms de diferença). Read-then-write não tem defesa: as duas execuções fazem o GET antes de qualquer INSERT. **Contra mensagens de verdade o dedup funciona** (3 cliques no CTA, só o 1º gerou linha). **Este Baserow não suporta unique constraint** (`field_constraints` não existe na API de campos), então o banco não pode arbitrar. Fix desenhado, não construído: inserir sempre → esperar ~3s → reconsultar → menor `row_id` vence, o outro apaga a própria linha e não avisa. Mesma família do bug do disparo.
- [x] **Ciclo do lead fechado — a Fase 3 começou.** `n8n/nsc-lead-inbound.json`: o cliente clica no `🏁 Quero essa peça`, o WAHA faz POST no n8n (`WHATSAPP_HOOK_URL`, evento `message`), o Code casa o `mXXXX` com a peça e grava na tabela **`LEADS`** (1 linha = 1 pessoa; N:1 com a 556) + ping no zap do Bruno com o nome da peça e o ordinal ("2ª pessoa"). **O bot NÃO responde cliente** — quem atende é o Bruno.
  - **O `wa_message_id` era uma mentira documentada em 3 lugares:** dizia "rastreio de lead", mas guarda o id da mensagem que o **bot envia**. Por isso o passo 4 do `/confere-ofertas` apontava pro vazio desde 02/07. Corrigido; quem rastreia lead é a `LEADS`.
  - **Freio que decide tudo:** o hook recebe **toda** mensagem, inclusive as ofertas que o próprio bot posta no grupo. O Code descarta `fromMe` + `@g.us` + mensagem sem id. Evento é `message` (não `message.any`, que incluiria os próprios envios). 21 testes de node cobrindo isso.
  - `responseMode: onReceived` (≠ do garimpo): o WAHA só quer o 200. Com `responseNode`, todo "oi" descartado penduraria o webhook até o timeout.
  - **Path secreto é o único freio** — o WAHA não assina o POST. **PII:** a `LEADS` guarda telefone de cliente (1ª tabela com dado pessoal do projeto).
  - Pendente do Bruno: criar a tabela `LEADS` na UI (criar tabela exige JWT, o Database Token não faz) + `WAHA_ADMIN_ID` (número pessoal) + redeploy do WAHA com o `WAHA_HOOK_URL`.
- [x] **Z-API → WAHA: a operação virou auto-hospedada (sem mensalidade).** `waha/stack-vps.yml` (Swarm+Traefik, `network_public`, domínio `waha.arvsystems.cloud`) **no ar na VPS**; `waha/docker-compose.yml` = o mesmo local, pra teste. Sessão `default` conectada no número da loja (`5511914563609`). Grupo real = **`120363410530925527@g.us`** (formato WAHA; o `120363429602486219-group` da Z-API era de OUTRO número e não existe aqui). `n8n/nsc-dispara-ofertas.json` migrado (`/api/sendImage` + header `X-Api-Key`) e **testado na mão: funcionando**. Skill `/dispara-oferta` reescrita pro WAHA (as 2 cópias).
  - **Simplificou:** a Z-API exigia base64 do acervo local; o WAHA busca o `photo_url` público do Baserow direto. Menos um passo.
  - **Gotchas do WAHA** (todos já resolvidos nas stacks, ver [[n8n-import-gotchas]] e a skill): sessão morre sem volume · **API key se regera a cada start** se não vier como env (o n8n toma 401 do nada) · `shm_size` não funciona em Swarm → **tmpfs no `/dev/shm`** ou o Chromium morre calado · `replicas: 1` obrigatório (sessão não se divide) · envio lento → **timeout 120s** no n8n (curto = post sai mas linha não vira `Disparado` = duplicata no tick seguinte).
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
- [x] **Bloco Ofertas RODANDO AO VIVO + gate de aprovação** — 6 skills (Marca: marca/acervo/lp · Ofertas: agenda/dispara-oferta/confere-ofertas). **Z-API conectada** (grupo GRUPO-TESTE `120363429602486219-group`). **Ciclo completo provado 2026-07-02** com 2 peças: `/agenda` → `Fila` → flip `Aprovado` → `/dispara-oferta` posta no grupo → `Disparado`+`posted_at`+`wa_message_id`. Campo **`caption`** (texto exato do post, humano aprova/edita) + portão: `/dispara-oferta` NUNCA dispara `Fila`. Gotchas Z-API: corpo UTF-8 (emoji quebra shell), imagem base64 do acervo, single_select aceita value string via `user_field_names=true`. Ver [[zapi-whatsapp-gotchas]].
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
  - **Rotina de deploy** (token no `.env`): `npx vercel deploy lp --prod --yes --scope brunoconstantinou-4051s-projects --token=$VERCEL_TOKEN` → depois `vercel alias set <deploy-url> nippon-speed-co.vercel.app` (o alias NÃO segue prod sozinho). SSO Deployment Protection vem LIGADO por padrão → desligar: `PATCH api.vercel.com/v10/projects/nippon-speed-co {"ssoProtection":null}`. Ver [[vercel-deploy-lp-gotchas]].
  - Pendentes de polish: trocar número de teste pelo convite do grupo real; gerar 3 imagens dos passos via `/nanobanana` (precisa GEMINI_API_KEY); melhorar qualidade do design system + usar imagens hi-res (Pinterest) na origem.
- ~~**Preço na LP/ofertas = "valor e frete sob consulta no grupo"**~~ → **revisto em 16/07, ver "Modelo de preço + legenda" nas Decisões travadas.** A **LP** segue sem fechar R$ (CTA → grupo). A **oferta no WhatsApp agora mostra o R$** (vem do form do Caio).
- Pendências: link do convite do grupo WhatsApp (placeholder `REPLACE_ME` na LP) · chaves Baserow/Z-API (Bloco Ofertas).

## Relacionado
[[caio-logistica-japao]] · [[infoproduto]] · [[carol-socia]] · [[crm-slotter-produto]]
