# Arquitetura do Hub — de "clona a pasta" para "cadastra uma linha"

> Desenho técnico do multi-loja do Motor de Ofertas. Fecha a lacuna que o [[motor-ofertas]] deixou aberta em 02/07: *"depois: organizar em repo separando template × instância"*.
> **Status: DESENHO.** Nada aqui foi construído. Data: 2026-07-16.

## O nome da coisa
A ideia aparece no vault com 4 nomes (`loja-in-a-box` no README, `kit` no SETUP, `sistema-template` no Foco Atual/Caio, `loja em caixa` no POSICIONAMENTO). Aqui ela se chama **hub**. Mesma ideia, um nome só.

## Escopo — quem pluga (decisão 2026-07-16)
**O hub é operado pelo Bruno, sempre.** Não é self-serve. Não tem signup, billing, onboarding, nem cliente mexendo em `.env`. Dois casos de uso, mesma máquina:
1. **Lojas próprias / do Caio** — o Bruno abre a loja nº2, nº3. Moat = velocidade de setup.
2. **Entrega pra empresa cliente** — o cliente compra o resultado; o hub é a ferramenta que faz em dias o que levaria meses. Cobra projeto, não licença.

> **O que isso mata do escopo:** UI de tenant, autenticação, isolamento hostil, cobrança por uso, multi-usuário. O "tenant" é uma linha numa tabela que só o Bruno enxerga. Isso é ~metade da complexidade de um SaaS de verdade, fora.
> **O que isso NÃO mata:** o caso 2 implica **handover** (o cliente um dia quer ver os leads dele) e **PII por tenant**. Ver "Isolamento" abaixo.

---

## O princípio: uma única fonte de verdade pro "qual loja é essa"

Hoje a resposta está espalhada em 4 lugares: `.env` (flat, sem namespace), node `Config` do n8n (literal), caminho de pasta (`marca/`, singular), e a sessão do WAHA (`default`). Toda loja nova replica os 4.

**No hub, a resposta mora num lugar só: a tabela `LOJAS` no Baserow.** Todo o resto lê dela.

```
                      ┌──────────────────┐
                      │  Baserow LOJAS   │  ← a ÚNICA fonte de verdade
                      │  1 linha = 1 loja│
                      └────────┬─────────┘
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌──────────┐  ┌────────────┐  ┌─────────┐
          │ 3 workflows│  │  8 skills  │  │  WAHA   │
          │   n8n      │  │ (1 cópia)  │  │ N sessões│
          │ (pra sempre)│  │            │  │ 1 container│
          └──────────┘  └────────────┘  └─────────┘
```

### Tabela `LOJAS` (registry) — o coração
Database 104, tabela nova. Campos:

| Campo | Tipo | Papel |
|---|---|---|
| `slug` | text (primário) | `nsc`, `loja-b`. **A chave de tudo.** Vira nome de sessão WAHA, nome de pasta, prefixo de workflow |
| `nome` | text | "Nippon Speed Co." |
| `status` | single_select | `Ativa · Pausada · Arquivada`. **O cron só lê `Ativa`** — pausar loja = flip de campo |
| `waha_session` | text | = `slug`. O que casa o inbound com a loja |
| `group_id` | text | `120363…@g.us` |
| `admin_id` | text | quem recebe o ping de lead (hoje sempre o Bruno; per-loja permite entregar) |
| `table_id` | number | tabela DISPARADOR da loja |
| `leads_table_id` | number | tabela LEADS da loja |
| `vercel_project` | text | `nippon-speed-co` |
| `form_secret` | text | freio leve do form de garimpo |
| `moeda_origem` | text | `JPY` hoje; a próxima loja pode não ser Japão |

> **Por que Baserow e não um `lojas.json` no repo:** o n8n precisa ler isso em runtime e não tem o repo. Já existe um Baserow, com token, com MCP. Zero infra nova.
> **O registry não guarda segredo.** `group_id`/`form_secret` são freios leves, já visíveis no fonte do form por design. Token de API continua no `.env` da infra.

### O `.env` encolhe pra infra compartilhada
Um `.env` na raiz do hub, não por loja:
- **Compartilhado:** `FIRECRAWL_API_KEY` · `BASEROW_API_URL` · `BASEROW_TOKEN` · `BASEROW_USER`/`PASSWORD` (JWT p/ criar tabela) · `VERCEL_TOKEN` · `WAHA_URL` · `WAHA_API_KEY` · `GEMINI_API_KEY`
- **Por loja:** só `LOJA_SLUG` — e nem isso, se a skill resolver pela pasta em que está.

Tudo que hoje é per-loja no `.env` (`BASEROW_TABLE_ID`, `WAHA_GROUP_ID`, `BASEROW_LEADS_TABLE_ID`, `N8N_WEBHOOK_URL`, `FORM_SECRET`, `WAHA_ADMIN_ID`) **sai do `.env` e vira coluna da `LOJAS`**.
As `ZAPI_*` morrem (Z-API saiu em 16/07; ficaram no `.env.example` por inércia).

---

## Camada 1 — n8n: 3 workflows, não 3N

Hoje: 3 workflows `nsc-*`, com `table_id` literal em 3 nodes Config (× 2 cópias em `versoes-em-prod/`). Nada lê `$env`. 5 lojas = 15 workflows editados na mão = drift garantido.

**No hub: os mesmos 3 workflows servem todas as lojas.** O node `Config` deixa de carregar identidade e passa a carregar só infra (`baserow_url`, tokens). A identidade vem de um lookup na `LOJAS`.

### 1. `hub — dispara ofertas` (cron 30min)
```
Schedule → GET LOJAS (status=Ativa) → loop por loja:
             GET <loja.table_id> (status=Aprovado)
             → WAHA POST /api/sendImage {session: loja.waha_session, chatId: loja.group_id}
             → PATCH status=Disparado
```
Loja nova entra no cron **sozinha**, no tick seguinte ao cadastro. Ninguém importa nada.

### 2. `hub — lead inbound` (webhook único)
**Aqui mora o achado que destrava o WAHA.** O `WHATSAPP_HOOK_URL` é global do container: uma URL pra todas as sessões. Isso foi diagnosticado como o pior gargalo (lead da loja B gravado na tabela da loja A), mas **é um falso problema**: o payload do WAHA **carrega o nome da sessão**. Basta o workflow rotear por ele.

```
Webhook (1 path só) → descarta fromMe/@g.us/sem-id (o freio de hoje, mantido)
  → lookup LOJAS por waha_session = payload.session   ← O ROTEAMENTO
  → sessão desconhecida? descarta e loga (não adivinha loja)
  → busca a peça em <loja.table_id> → dedup+ordinal em <loja.leads_table_id>
  → grava lead → ping em <loja.admin_id>
```
Não precisa de webhook por sessão, não precisa de feature nova do WAHA, não precisa de container por loja. O hook global só é perigoso porque hoje o outro lado é cego.

### 3. `hub — garimpo` (webhook único)
O form passa a mandar `loja` no corpo (`{secret, loja, items[]}`). O workflow resolve `LOJAS[slug]`, confere o `form_secret` **daquela loja** e insere na `table_id` dela. Um form por loja continua existindo (é uma página estática), mas todos batem no mesmo webhook.

> **Regra:** nenhum node do n8n volta a ter id de loja literal. Se um dia precisar, é bug de arquitetura, não atalho.

---

## Camada 2 — WAHA: 1 container, N sessões nomeadas

Fatos duros do levantamento:
- `replicas: 1` é obrigatório e está corretamente comentado: uma sessão não se divide entre réplicas.
- `WHATSAPP_DEFAULT_ENGINE: WEBJS` = **um Chromium de verdade por sessão**, `limits.memory: 2G`, `/dev/shm` tmpfs dimensionado pra 1.
- alias de rede `waha`, router Traefik `waha`, `container_name: waha` → um segundo container colide em tudo.
- WEBJS é frágil por natureza (quebrou o `refreshQR` em 16/07).

**1 número de WhatsApp = 1 loja = 1 sessão. Isso é regra do WhatsApp, não sua** — N lojas custam N sessões, não tem jeito. A pergunta é quanto custa cada uma e onde elas moram.

**Desenho:** um container WAHA, uma sessão por loja nomeada com o `slug` (`nsc`, `loja-b`), não `default`. Mata as colisões de alias/router/container name (gargalos 9), mata o `session: "default"` espalhado em 6 lugares (gargalo 5), e o roteamento por sessão do workflow 2 faz o resto.

**A decisão de verdade é a engine.** WEBJS não escala: 5 lojas ≈ 5 Chromium ≈ 5-10 GB de RAM brigando com n8n + Baserow na mesma VPS. Isso é teto físico, não config.
→ **A verificar antes de qualquer coisa:** a engine **NOWEB** (protocolo, sem browser) resolveria RAM **e** fragilidade de uma vez. O risco é o `sendImage` por URL, que é o caminho crítico da oferta. **Testar NOWEB com uma sessão de teste antes de cravar o desenho.** Se NOWEB não mandar imagem por URL, o hub tem um teto de ~2-3 lojas por VPS e isso precisa entrar na conta do preço.
→ **Também a verificar:** se o WAHA CORE (grátis) permite N sessões simultâneas ou se isso é Plus (pago). Muda o custo por loja.

---

## Camada 3 — Repo: propagar o padrão do `garimpo/`

```
hub/
├─ .env                  # SÓ infra compartilhada
├─ kit/
│  ├─ .claude/skills/    # 8 skills, UMA cópia, zero literal de loja
│  ├─ templates/         # lp/ garimpo/ n8n/ com __PLACEHOLDER__
│  └─ docs/              # roteiro-lp · logistica-mercari · schema (fontes da verdade)
└─ lojas/
   ├─ nsc/               # a INSTÂNCIA: só o que é irredutivelmente da loja
   │  ├─ CLAUDE.md       #   o cérebro (voz, nicho, decisões)
   │  ├─ marca/          #   acervo/ conteudo/ campanha/ referencia/
   │  └─ lp/             #   a LP renderizada (.vercel/ GITIGNORED)
   └─ <loja-b>/
```
A skill resolve a loja pela pasta em que está (mesma ergonomia de hoje, `cd lojas/nsc`), pega o `slug`, e busca o resto no registry. **`marca/` deixa de ser singular por acidente e passa a ser singular por escopo.**

### `/nova-loja <slug>` — o "plug and play" de verdade
A skill que hoje não existe e é o produto inteiro:
1. cria `lojas/<slug>/` do template
2. insere a linha na `LOJAS`
3. cria DISPARADOR + LEADS via JWT (schema do `docs/baserow-disparador-schema.md`) e grava os ids no registry
4. cria a sessão WAHA `<slug>` e **para**, pedindo o QR (fronteira humana irredutível)
5. cria o projeto Vercel, desliga o SSO, grava em `vercel_project`
6. renderiza o form de garimpo com os placeholders da loja

Setup vira: **QR + identidade + URLs curadas.** O resto é a skill. É esse tempo que é cobrável no caso 2.

---

## Isolamento e PII — o que o caso 2 exige

O `baserow-disparador-schema.md` já avisou: *"Se a base virar produto ou multi-loja, isto deixa de ser detalhe (retenção, consentimento, quem acessa)"*. A `LEADS` guarda telefone e nome de cliente.

**Decisão: uma DISPARADOR e uma LEADS por loja, não uma tabela compartilhada com coluna `loja`.**
- Handover pro cliente (caso 2) = entregar uma tabela, não filtrar um export.
- Numa tabela compartilhada, o único freio contra vazar lead de um cliente pro outro é **lembrar do filtro**. Um filtro esquecido = incidente.
- Custo: risco de drift de schema entre tabelas. Mitigação: o schema mora num doc só e quem cria é a `/nova-loja`, nunca a mão.
- **Gotcha herdado:** ids de opção de `single_select` **não se repetem entre tabelas** (o `status=2573` hardcoded na `/agenda` quebraria na loja 2). Regra: sempre `?user_field_names=true` mandando o **valor por texto**, nunca o id. Isso já foi provado uma vez ("single_select aceita value string").

---

## Faseamento — e por que a Fase 0/1 não fere o gate

O gate escrito é: *"validar com UMA loja rodando pro Caio (NSC) antes de generalizar o kit"*. Ele continua de pé. O que segue não o atravessa:

- **Fase 0 — dívida pura, vale a N=1.** Nada aqui é "generalizar", é consertar o que já está errado hoje: `/agenda` ignora a própria env var e usa `556` literal · `.vercel/project.json` versionado · `status=2573` por id · `ZAPI_*` mortas no `.env.example` · as 8 skills existindo em 2 cópias divergindo.
- **Fase 1 — o registry, ainda só com a NSC.** Cria a `LOJAS` com 1 linha, reescreve os 3 workflows pra ler dela, nomeia a sessão `nsc`. **Prova o multi-tenant com um tenant só.** Testável, reversível, e já paga: acaba o drift das cópias e a NSC vira a primeira instância de verdade em vez de a única.
- **Fase 2 — a loja nº2 (Caio).** Aqui o gate se resolve sozinho: se `/nova-loja` levar horas, a tese está provada; se levar uma semana, o desenho está errado e você descobriu barato.
- **Fase 3 — caso 2 (cliente).** Só então: handover, retenção de PII, quem acessa o quê.

> **Verificação que precede tudo:** o teste de engine do WAHA (NOWEB + `sendImage` por URL). Se ele falhar, o teto de lojas por VPS entra no preço e a Fase 2 muda de forma. É o único item do desenho que pode invalidar o resto.

---

## O que continua honesto
- A tese de "loja em caixa" **segue hipótese: nunca se clonou uma segunda loja** e a NSC tem zero receita ([[padrao-construido-nao-vendido]]).
- O moat continua sendo **velocidade de setup + garimpo do Caio, não a tech** — este documento é sobre a velocidade, e não muda o resto.
- A conversa com o Caio pra levantar o sistema-template **está desmarcada desde 24/06** enquanto a tech correu sozinha.
- A bifurcação **produto/kit × consultoria+cérebro** (02/07) segue sem revisita. O escopo aqui (hub operado pelo Bruno) é compatível com as duas.

Ver [[motor-ofertas-nsc]] · [[caio-logistica-japao]] · `README.md` · `SETUP.md` · `docs/baserow-disparador-schema.md`
