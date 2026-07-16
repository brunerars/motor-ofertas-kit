---
name: confere-ofertas
description: Confere diariamente (via Firecrawl) se as ofertas já disparadas foram vendidas no Mercari; marca Vendido no Baserow e avisa no grupo (e nos interessados, se houver). Roda como cron/cloud routine. Use pra rodar a checagem de vendidos ou configurar a recorrência.
---

# Confere-ofertas — checa vendidos e avisa

Fecha o ciclo: descobre o que já vendeu no Mercari e atualiza a fila + o grupo. Roda diário (cloud routine `/schedule`).

## Config (`.env`)
- Baserow: `BASEROW_API_URL`, `BASEROW_TOKEN`, `BASEROW_TABLE_ID=556` · Firecrawl: `FIRECRAWL_API_KEY` · **WAHA**: `WAHA_URL`, `WAHA_API_KEY`, `WAHA_GROUP_ID`.
> ⚠️ **Esta skill nunca rodou** (100% no papel desde 02/07) e **falta o workflow n8n gêmeo**. O envio abaixo já está no WAHA (a Z-API saiu do fluxo em 16/07), mas **nada aqui foi testado** — ver a `/dispara-oferta`, que é a irmã já validada, antes de confiar.

## Fluxo
1. **Ler ativos:** `GET rows` onde `status=Disparado` e `sold=false`.
2. **Checar cada um:** Firecrawl `source_url` extraindo só `{sold}` (schema mínimo). Mercari marca "SOLD"/売り切れ quando vendido.
3. **Se vendeu:** `PATCH` row → `sold=true`, `status=Vendido`. Avisar no grupo via WAHA:
   `POST $WAHA_URL/api/sendText` · header `X-Api-Key` · corpo `{"session":"default","chatId":"$WAHA_GROUP_ID","text":"✅ Vendido: <título>. Chega mais no grupo."}`
   > Corpo com emoji/acento **quebra o JSON inline do shell** (HTTP 400) → montar em arquivo UTF-8 e mandar com `--data-binary @arquivo`.
4. **(se feature de interesse ativa)** avisar quem demonstrou interesse (leads ligados ao `wa_message_id`) que a peça saiu.

## Firecrawl (só status de venda)
```bash
curl -s -X POST "https://api.firecrawl.dev/v1/scrape" -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"<source_url>","formats":["json"],"jsonOptions":{"prompt":"Is this Mercari item sold?","schema":{"type":"object","properties":{"sold":{"type":"boolean"}}}},"waitFor":3000}'
```

## Agendamento
Cloud routine diária (`/schedule`), fora do horário de disparo.

## NÃO fazer
- Não re-avisar item já `Vendido`. Não versionar chaves.

## Relacionado
`docs/baserow-disparador-schema.md` · skills `/agenda`, `/dispara-oferta`. Feature do `inbox/ideias-mercari-plus.txt`. Memória [[motor-ofertas-nsc]].
