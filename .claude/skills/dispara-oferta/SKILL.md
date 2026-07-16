---
name: dispara-oferta
description: Dispara no grupo de WhatsApp (via WAHA) as ofertas aprovadas/agendadas na fila do Baserow. Caminho MANUAL — em produção quem dispara é o n8n (cron 30min). Use quando o Bruno quiser disparar na mão, testar o envio, ou depurar o que o n8n está fazendo.
---

# Dispara-oferta — fila aprovada → grupo de WhatsApp (WAHA)

Lê a fila do Baserow (`DISPARADOR`) e posta no grupo via **WAHA**.

> **Em produção quem dispara é o n8n**, sozinho, a cada 30min (`n8n/nsc-dispara-ofertas.json` — Schedule → Baserow → filtra → `sendImage` → marca `Disparado`). Isso custa **0 token**. Esta skill é o caminho **manual**: testar envio, depurar, ou disparar fora da janela. As duas usam a MESMA lógica e o MESMO portão — se divergirem, o n8n é a fonte da verdade.

> **Trocou a Z-API pelo WAHA em 2026-07-16.** A Z-API saiu do fluxo (era paga). O WAHA é auto-hospedado (`devlikeapro/waha`, tier CORE, engine WEBJS). Stack da VPS em `waha/stack-vps.yml`; compose local em `waha/docker-compose.yml`.

## Config (`.env`)
- Baserow: `BASEROW_API_URL`, `BASEROW_TOKEN`, `BASEROW_TABLE_ID=556`.
- WAHA: `WAHA_URL`, `WAHA_API_KEY`, `WAHA_GROUP_ID`.
  - `WAHA_URL` **local** = `http://localhost:3000` · **o n8n** usa `http://waha:3000` (alias na `network_public`; rede interna, sem domínio, sem TLS).
  - `WAHA_GROUP_ID` no formato WAHA: `120363410530925527@g.us`. **O formato da Z-API (`120363…-group`) NÃO funciona** — nem a sintaxe, nem o número (eram grupos diferentes).
  - Sessão = `default`. Conferir viva antes de disparar: `GET /api/sessions` deve dizer `WORKING`.

## Fluxo
1. **Ler aprovados prontos** (PORTÃO DE APROVAÇÃO): `status=Aprovado` (sai já) **ou** `status=Agendado` com `scheduled_at <= agora`. **Nunca dispara `Fila`** — Fila = pendente da conferida do Bruno no Baserow. É a camada de aprovação barata (sem webhook).
2. **Resumo pré-janela (opcional):** antes do lote, `sendText` no grupo: "Nos próximos ~20min: N peças chegando 👇" (ver [[ideias-mercari-plus]]).
3. **Disparar cada oferta:** `sendImage` com **`photo_url`** (URL pública do Baserow) + o campo **`caption`** já aprovado — **o texto exato que o Bruno revisou, não recompor**. Quem monta legenda é o `/agenda`; aqui é repasse cru.
4. **Marcar:** `PATCH` row → `status=Disparado`, `posted_at=agora`, `wa_message_id` (rastreio de lead p/ `/confere-ofertas`).

## WAHA — endpoints
```bash
BASE="<projeto>"; set -a; source "$BASE/.env"; set +a
H=(-H "X-Api-Key: $WAHA_API_KEY" -H "Content-Type: application/json")

# a sessao esta viva? (WORKING). Se disser SCAN_QR_CODE, nada sai e o erro nao e obvio.
curl -s "${H[@]}" "$WAHA_URL/api/sessions"

# texto (resumo pre-janela)
curl -s -X POST "$WAHA_URL/api/sendText" "${H[@]}" \
  -d "{\"session\":\"default\",\"chatId\":\"$WAHA_GROUP_ID\",\"text\":\"...\"}"

# imagem (oferta) — file.url = photo_url publico do Baserow. SEM base64.
curl -s -X POST "$WAHA_URL/api/sendImage" "${H[@]}" \
  -d "{\"session\":\"default\",\"chatId\":\"$WAHA_GROUP_ID\",\"file\":{\"url\":\"<photo_url>\"},\"caption\":\"...\"}"
```
> **A resposta traz `id`** (não `messageId`, que era da Z-API) → vai pro `wa_message_id`. Pode vir **string ou objeto `{_serialized}`** — tratar os dois.
> **Corpo UTF-8:** emoji/acento inline no `-d` do shell quebram o JSON (HTTP 400). Montar o corpo num **arquivo UTF-8** (`json.dump`) e enviar com `--data-binary @arquivo`. A legenda tem 🏁 e acento — sempre cai nessa. Ver [[zapi-whatsapp-gotchas]] (o gotcha é do shell, não da API; vale igual no WAHA).

## O que ficou mais simples com o WAHA
A Z-API exigia **base64 do acervo local** (o CDN do Mercari dá 403 em fetch server-side). O WAHA busca direto a **URL pública do Baserow** (`photo_url`) — o mesmo campo que o n8n já usa. Nada de base64, nada de arquivo local.

## Gotchas do WAHA (validados 2026-07-16)
- **Sessão morre com o container** se não houver volume. As stacks (`waha/`) já montam `/app/.sessions` — não subir WAHA sem volume, ou é QR novo a cada deploy.
- **API key se regera a cada start** se não vier como env do container → o n8n toma 401 do nada. As stacks já fixam via `${WAHA_API_KEY}`.
- **Envio é lento** (WEBJS sobe um Chromium). No n8n o timeout é 120s. Curto demais = a requisição estoura, a linha **não** vira `Disparado`, **mas o post sai** → duplicata no tick seguinte.
- **WEBJS quebra quando o WhatsApp muda** (em 16/07: `Cmd.refreshQR is not a function` — o QR parava de renovar e escanear não adiantava). Se a sessão não conecta, olhar `docker logs waha` antes de culpar o resto.

## NÃO fazer
- Não disparar item sem `photo_url`/`caption`. Não disparar `Fila` (é o portão). Não recompor a legenda. Não versionar chaves.

## Relacionado
`docs/baserow-disparador-schema.md` · `waha/stack-vps.yml` · `n8n/nsc-dispara-ofertas.json` · skills `/agenda`, `/confere-ofertas`. `inbox/ideias-mercari-plus.txt` (features "+"). Memórias [[motor-ofertas-nsc]], [[n8n-import-gotchas]].
