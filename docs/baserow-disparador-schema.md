# Baserow — tabela DISPARADOR (fila de ofertas)

Fonte da fila do `/agenda` → `/dispara-oferta`. Self-hosted ARV.

## Coordenadas
- **Host:** `https://baserow.arvsystems.cloud` (`BASEROW_API_URL`)
- **Database:** 104 · **Tabela:** 556 (`DISPARADOR`) → `BASEROW_TABLE_ID=556`
- **Auth runtime:** Database Token (`BASEROW_TOKEN`, header `Authorization: Token …`) — só linhas (CRUD de rows). Validado: read/insert/delete OK.
- **Auth schema (criar/alterar campos):** exige JWT de usuário (`POST /api/user/token-auth/`). NÃO guardar senha; pegar JWT on-demand. ⚠️ senha usada no setup passou pelo chat → **rotacionar**.

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

- **Tabela:** `<PREENCHER>` → `BASEROW_LEADS_TABLE_ID` no `.env`. Mesmo database (104).
- **Quem escreve:** o workflow `n8n/nsc-lead-inbound.json`, quando o cliente clica no CTA da oferta e manda `Estou interessado! (mXXXX)`.

| Campo | Tipo | Notas |
|---|---|---|
| `lead` | text (primário) | rótulo: `nome_wa` ou, sem nome, o telefone |
| `phone` | text | número do interessado, sem `@c.us`. **PII** (ver abaixo) |
| `nome_wa` | text | `notifyName` do WhatsApp; pode vir vazio |
| `mercari_id` | text | **a chave que casa com a 556** |
| `mensagem` | long_text | texto cru recebido |
| `recebido_em` | date (com hora) | quando chegou |
| `status` | single_select | `Novo · Respondido · Fechado · Perdido` |
| `avisado_vendido` | boolean | munição pro passo 4 do `/confere-ofertas` (avisar que a peça saiu) |

> **Por que casa por `mercari_id` texto e não por link field:** link do Baserow exige o `row_id` da peça → obrigaria um GET a mais no n8n só pra descobrir o id. O texto casa direto e é o que os dois lados já falam.

**Dedup:** o workflow faz `GET …/?user_field_names=true&filter__mercari_id__equal=<id>` antes de inserir. Mesma pessoa + mesma peça = não insere nem avisa de novo. O mesmo GET dá o **ordinal** ("2ª pessoa") de graça.

## ⚠️ PII — isto aqui é dado de pessoa, não de peça
A `LEADS` guarda **telefone e nome de cliente**. É a primeira tabela do projeto com dado pessoal:
- Não exportar/colar em chat, doc ou repo.
- Se a base virar produto ou multi-loja, isto deixa de ser detalhe (retenção, consentimento, quem acessa).
- Um lead `Fechado`/`Perdido` antigo não precisa ficar pra sempre.

## Estado
1 linha real (`Benetton F1 boné`, row 3, `Fila`) inserida no setup como teste.

Ver [[motor-ofertas-nsc]] · skill `/agenda` (a construir).
