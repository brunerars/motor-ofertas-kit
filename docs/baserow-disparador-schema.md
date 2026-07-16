# Baserow — tabela DISPARADOR (fila de ofertas)

Fonte da fila do `/agenda` → `/dispara-oferta`. Self-hosted ARV.

## Coordenadas
- **Host:** `https://baserow.arvsystems.cloud` (`BASEROW_API_URL`)
- **Database:** 104 · **Tabela:** 556 (`DISPARADOR`) → `BASEROW_TABLE_ID=556`
- **Auth runtime:** Database Token (`BASEROW_TOKEN`, header `Authorization: Token …`) — só linhas (CRUD de rows). Validado: read/insert/delete OK.
- **Auth schema (criar/alterar campos/tabelas):** exige **JWT de usuário** (`POST /api/user/token-auth/` → header `Authorization: JWT <token>`). O Database Token **nem é aceito** aqui: devolve `401 "Authentication credentials were not provided"` até pra listar tabelas. Credenciais em `BASEROW_USER`/`BASEROW_PASSWORD` no `.env` (fora do git) — nunca colar em chat.
  > **Tabela nova nasce visível pro Database Token?** Nesta instância sim (o token é escopo "all tables"): a 557 aceitou GET/POST logo após ser criada. Se um dia um token com escopo por-tabela for usado, lembrar de liberar a tabela nova nas permissões dele.

## Campos (usar `?user_field_names=true` nas chamadas)
| Campo | Tipo | Notas |
|---|---|---|
| `title_pt` | text (primário) | rótulo da linha |
| `mercari_id` | text | chave (da URL) |
| `source_url` | url | link do item |
| `title_ja` | text | Firecrawl |
| `description_pt` | long_text | tradução |
| `brand` `category` `condition` | text | Firecrawl |
| `price_jpy` | number (0dp) | Firecrawl; **referência interna, não vai pro post** |
| `price_brl` | number (2dp) | vem do form do Caio, **já fechado** (frete+impostos). Vazio = **sem legenda**: segura em `Fila` e reporta (nunca "sob consulta" no grupo) |
| `photos` | long_text | refs do acervo, ex `acervo/<id>/1.jpg,…` |
| `caption` | long_text | **texto exato do post** (o que o Bruno aprova/edita) |
| `photo_url` | url | **URL pública da foto principal** (upload no Baserow); o n8n manda essa URL pro **WAHA** (`file.url`) |
| `status` | single_select | `Fila·Aprovado·Agendado·Disparado·Vendido·Descartado` |
| `scheduled_at` `posted_at` | date (com hora) | agendamento / disparo |
| `sold` | boolean | `/confere-ofertas` |
| `tags` | text | **campo "Tam / observação" do form do Caio** → vira a linha `Tam:` da legenda (vazio → `único`) |
| `wa_message_id` | text | id da mensagem que **o bot enviou** (a oferta no grupo). **NÃO é rastreio de lead** — o nome engana; quem rastreia lead é a tabela `LEADS` |

## Fluxo de status (aprovação = flip no Baserow, sem webhook)
`Fila` (agenda inseriu, **pendente da conferida do Bruno**) → Bruno revisa `caption`+foto no Baserow e flipa → `Aprovado` (sai na próxima janela) / `Agendado` (com `scheduled_at`) → `Disparado` (posted_at, dispara-oferta) → `Vendido` (confere-ofertas) · `Descartado` (rejeitado).
**Portão:** `/dispara-oferta` NUNCA dispara `Fila` — só `Aprovado`/`Agendado`. A curadoria do item já veio na URL (humana); a conferida aqui é só tradução+foto. Calibração agora; tende a spot-check/auto conforme o template estabiliza.

## Endpoints úteis (Database Token)
- Inserir: `POST /api/database/rows/table/556/?user_field_names=true` body = {campos} (single_select `status` aceita o **id da opção**; "Fila"=2573).
- Listar Fila: `GET /api/database/rows/table/556/?user_field_names=true` (+ filtro por status).
- Atualizar: `PATCH /api/database/rows/table/556/{id}/?user_field_names=true`.

---

# Tabela LEADS (ciclo do lead — inbound do WhatsApp)

**1 linha = 1 pessoa interessada.** N leads : 1 peça (várias pessoas querem o mesmo boné) → tabela separada, não campo na 556.

- **Tabela: 557** → `BASEROW_LEADS_TABLE_ID=557` no `.env`. Mesmo database (104). Criada via API (JWT) em 16/07.
- **Quem escreve:** o workflow `n8n/nsc-lead-inbound.json`, quando o cliente clica no CTA da oferta e manda `Estou interessado! (mXXXX)`.

| Campo | Tipo | Notas |
|---|---|---|
| `lead` | text (primário) | rótulo: `nome_wa` ou, sem nome, o telefone |
| `phone` | text | número do interessado, sem `@c.us`. **PII** (ver abaixo) |
| `nome_wa` | text | `notifyName` do WhatsApp; pode vir vazio |
| `mercari_id` | text | a chave crua (sobrevive mesmo se a peça sumir da 556) |
| `peca` | **link_row → 556** | o link de verdade: clicar no lead abre a peça. O n8n preenche com `[row_id]` |
| `mensagem` | long_text | texto cru recebido |
| `recebido_em` | date (com hora, ISO) | quando chegou |
| `status` | single_select | `Novo · Respondido · Fechado · Perdido` (ids 2579-2582; **mandar por texto**) |
| `avisado_vendido` | boolean | munição pro passo 4 do `/confere-ofertas` (avisar que a peça saiu) |

> **Guarda os dois: `peca` (link) e `mercari_id` (texto).** O link é pra você navegar no Baserow; o texto é o que o n8n filtra (`filter__mercari_id__equal`) sem precisar resolver relação. Filtrar por link é chato; navegar por texto é chato. Cada um faz o que faz bem.
> **O link quer `row_id`, não `mercari_id`** → por isso o workflow busca a peça na 556 **antes** de gravar o lead. Peça não encontrada = grava o lead com o link vazio (perder o lead por causa do link seria pior).

**Dedup:** o workflow faz `GET …/?user_field_names=true&filter__mercari_id__equal=<id>` antes de inserir. Mesma pessoa + mesma peça = não insere nem avisa de novo. O mesmo GET dá o **ordinal** ("2ª pessoa") de graça.

## ⚠️ PII — isto aqui é dado de pessoa, não de peça
A `LEADS` guarda **telefone e nome de cliente**. É a primeira tabela do projeto com dado pessoal:
- Não exportar/colar em chat, doc ou repo.
- Se a base virar produto ou multi-loja, isto deixa de ser detalhe (retenção, consentimento, quem acessa).
- Um lead `Fechado`/`Perdido` antigo não precisa ficar pra sempre.

## Estado
1 linha real (`Benetton F1 boné`, row 3, `Fila`) inserida no setup como teste.

Ver [[motor-ofertas-nsc]] · skill `/agenda` (a construir).
