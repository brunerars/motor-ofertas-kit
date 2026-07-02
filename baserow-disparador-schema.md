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
| `price_jpy` | number (0dp) | Firecrawl |
| `price_brl` | number (2dp) | vazio = "sob consulta" |
| `photos` | long_text | refs do acervo, ex `acervo/<id>/1.jpg,…` |
| `caption` | long_text | **texto exato do post** (o que o Bruno aprova/edita) |
| `photo_url` | url | **URL pública da foto principal** (upload no Baserow); o n8n manda essa URL pro Z-API |
| `status` | single_select | `Fila·Aprovado·Agendado·Disparado·Vendido·Descartado` |
| `scheduled_at` `posted_at` | date (com hora) | agendamento / disparo |
| `sold` | boolean | `/confere-ofertas` |
| `tags` | text | curadoria (csv) |
| `wa_message_id` | text | rastreio de lead |

## Fluxo de status (aprovação = flip no Baserow, sem webhook)
`Fila` (agenda inseriu, **pendente da conferida do Bruno**) → Bruno revisa `caption`+foto no Baserow e flipa → `Aprovado` (sai na próxima janela) / `Agendado` (com `scheduled_at`) → `Disparado` (posted_at, dispara-oferta) → `Vendido` (confere-ofertas) · `Descartado` (rejeitado).
**Portão:** `/dispara-oferta` NUNCA dispara `Fila` — só `Aprovado`/`Agendado`. A curadoria do item já veio na URL (humana); a conferida aqui é só tradução+foto. Calibração agora; tende a spot-check/auto conforme o template estabiliza.

## Endpoints úteis (Database Token)
- Inserir: `POST /api/database/rows/table/556/?user_field_names=true` body = {campos} (single_select `status` aceita o **id da opção**; "Fila"=2573).
- Listar Fila: `GET /api/database/rows/table/556/?user_field_names=true` (+ filtro por status).
- Atualizar: `PATCH /api/database/rows/table/556/{id}/?user_field_names=true`.

## Estado
1 linha real (`Benetton F1 boné`, row 3, `Fila`) inserida no setup como teste.

Ver [[motor-ofertas-nsc]] · skill `/agenda` (a construir).
