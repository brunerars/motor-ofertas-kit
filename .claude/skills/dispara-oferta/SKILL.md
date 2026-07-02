---
name: dispara-oferta
description: Dispara no grupo de WhatsApp (via Z-API) as ofertas agendadas na fila do Baserow (status Agendado, scheduled_at vencido). Envia um resumo pré-janela antes do lote. Roda como cron/cloud routine. Use quando o Bruno quiser disparar as ofertas agendadas, ou pra configurar o agendamento recorrente.
---

# Dispara-oferta — fila agendada → grupo de WhatsApp

Lê a fila do Baserow (`DISPARADOR`) e posta no grupo via Z-API as ofertas cuja janela chegou. Pensado pra rodar em **cloud routine** (skill `/schedule`) ou cron.

## Config (`.env`)
- Baserow: `BASEROW_API_URL`, `BASEROW_TOKEN`, `BASEROW_TABLE_ID=556`.
- Z-API: `ZAPI_INSTANCE`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_GROUP_ID`.

## Fluxo
1. **Ler aprovados prontos** (PORTÃO DE APROVAÇÃO): `GET rows` onde `status=Aprovado` (sai já) **ou** `status=Agendado` com `scheduled_at <= agora`. **Nunca dispara `Fila`** — Fila = pendente da conferida do Bruno no Baserow. É a camada de aprovação barata (sem webhook).
2. **Resumo pré-janela (opcional):** antes do lote, `send-text` no grupo: "Nos próximos ~20min: N peças chegando 👇" (ver [[ideias-mercari-plus]]).
3. **Disparar cada oferta:** `send-image` no grupo com a foto principal (base64 do acervo) + o campo **`caption`** já aprovado (o texto exato que o Bruno revisou — não recompor).
4. **Marcar:** `PATCH` row → `status=Disparado`, `posted_at=agora`, guardar `wa_message_id` (rastreio de lead).

## Z-API — endpoints
```bash
Z="https://api.z-api.io/instances/$ZAPI_INSTANCE/token/$ZAPI_TOKEN"
# texto (resumo):
curl -s -X POST "$Z/send-text" -H "Client-Token: $ZAPI_CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$ZAPI_GROUP_ID\",\"message\":\"...\"}"
# imagem (oferta) — image aceita URL pública OU base64 (usar base64 do acervo local):
IMG64="data:image/jpeg;base64,$(base64 -w0 marca/acervo/<id>/1.jpg)"
curl -s -X POST "$Z/send-image" -H "Client-Token: $ZAPI_CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$ZAPI_GROUP_ID\",\"image\":\"$IMG64\",\"caption\":\"...\"}"
```
> Grupo: `phone` = `ZAPI_GROUP_ID` (formato `120363…-group`; pegar o id exato via `GET /chats`). Resposta traz `messageId` → `wa_message_id`.
> ⚠️ **Gotchas validados (2026-07-02):** emoji/acento inline no `-d` do shell **quebram o JSON (HTTP 400)** → montar o corpo num **arquivo UTF-8** (`json.dump`) e enviar com `--data-binary @arquivo`. Imagem = **base64 data URI** do acervo (CDN Mercari dá 403 em fetch server-side). Ver [[zapi-whatsapp-gotchas]].

## Agendamento (cloud routine)
Rodar via `/schedule` (cron do Claude Code) numa cadência (ex: a cada 20min em janela comercial). Regra de agendamento (X posts/hora) definida no `/agenda` ao setar `scheduled_at`.

## NÃO fazer
- Não disparar item sem foto/caption. Não repetir (só `status=Agendado`). Não versionar chaves.

## Relacionado
`baserow-disparador-schema.md` · skills `/agenda`, `/confere-ofertas`. `inbox/ideias-mercari-plus.txt` (features "+"). Memória [[motor-ofertas-nsc]].
