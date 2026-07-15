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
- **WhatsApp:** Z-API (grupo + mídia + webhook de resposta)
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
- **Fase 3 — Nutrição:** captura lead, `/confere-ofertas`, avisa interessados.

## Decisões travadas
- Disparo agendado = **testar cloud routine do Claude Code** (não n8n, não worker VPS por ora)
- Botão "tenho interesse" em grupo **não existe nativo** → link `wa.me` com texto pré-preenchido referenciando o SKU
- Começar pelo Bloco Marca
- **LP = opção 2: base escura + vermelho de corrida** (mais próxima das artes do Caio; nicho pede impacto, não minimalismo de galeria). Deploy Vercel.
- **Motion:** não replicar o timing exato do IX2 do Webflow — usar camada própria de animação inteira (IntersectionObserver + CSS, progressive enhancement, conteúdo visível por padrão). Ver [[design-system-extract-motion-gotcha]].
- `jp.wings` / `jpwingsbr.com` são **referências**, não a marca própria

## Visão de produto + arquitetura de custo (decisão 2026-07-02)
Isto tende a virar um **kit "loja-in-a-box"** de setup rápido, com duas camadas separáveis:
- **Cérebro da loja (adaptável)** = a pasta do projeto no Obsidian (CLAUDE.md + `roteiro-lp` + `logistica` + `baserow-schema` + acervo). Clona e adapta por loja.
- **Kit de skills de operação** = as 6 skills. Setup = **trocar tokens no `.env`** (a fronteira humana) + ref de design + URLs curadas → loja no ar.

**Arquitetura de custo (token):**
- **Claude = setup (1×/loja, pesado) + por-item (tradução/legenda, barato) + curadoria/aprovação.**
- **Recorrente mecânico (disparo, confere-vendidos) → n8n = ~0 token** (HTTP puro, não é Claude).
- ⚠️ Custo desta sessão é de **P&D** (construção/debug), NÃO custo de regime. Pra número real: `/cost`.

**Cron de produção = n8n hospedado** (Schedule Trigger → GET Baserow `Aprovado` → POST Z-API → PATCH `Disparado`). Não usar cloud-routine do Claude (session-only) nem subir VPS worker novo. Mesma lógica já provada aqui.

**ROI/porém:** validar com **UMA loja rodando pro Caio (NSC)** antes de generalizar o kit. Moat = velocidade de setup + know-how de garimpo do Caio, não a tech. Depois: organizar em repo separando template × instância. Liga com [[crm-slotter-produto]] · [[framework-operacao]].

## Pendências de entrada (Bruno)
- [x] Nome/marca + logo → Nippon Speed Co. (assets entregues)
- [x] Referência de design → template Haus (asimov, entregue)
- [x] Produto piloto → item Mercari m71370664392
- [ ] Chaves (travam no Bloco Ofertas): Firecrawl · Baserow (base+token) · Z-API (instância) → `.env`, fora do git

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
- **Preço na LP/ofertas = "valor e frete sob consulta no grupo"** (não fecha R$; CTA → grupo WhatsApp).
- Pendências: link do convite do grupo WhatsApp (placeholder `REPLACE_ME` na LP) · chaves Baserow/Z-API (Bloco Ofertas).

## Relacionado
[[caio-logistica-japao]] · [[infoproduto]] · [[carol-socia]] · [[crm-slotter-produto]]
