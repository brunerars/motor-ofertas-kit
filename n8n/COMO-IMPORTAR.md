# n8n — importar o disparo de ofertas

Workflow: `nsc-dispara-ofertas.json`. Substitui o `/dispara-oferta` do Claude por um cron **persistente e 0 token**.

## O que ele faz
A cada 30 min: lê a fila do Baserow (`DISPARADOR`), pega as linhas **`Aprovado`** (e `Agendado` vencidas), posta cada uma no grupo via Z-API (`send-image` com `photo_url` + `caption`), e marca **`Disparado`** + `posted_at` + `wa_message_id`. **Nunca dispara `Fila`** (portão de aprovação) e **não spamma** se não houver nada aprovado.

## Passos (parte humana)
1. n8n → **Workflows → Import from File** → escolha `nsc-dispara-ofertas.json`.
2. Abra o node **`Config`** e preencha (são os mesmos valores do `.env`):
   - `baserow_token` → seu Database Token
   - `zapi_url` → `https://api.z-api.io/instances/<INSTANCE>/token/<TOKEN>`
   - `zapi_client_token` → Account Security Token
   - `group_id` → já vem com o GRUPO-TESTE; **troque pelo grupo real** quando for.
   > `baserow_url` (arvsystems) e `table_id` (556) já vêm certos.
3. **Testar:** aprove uma linha no Baserow (`Fila`→`Aprovado`) e clique **Execute Workflow**. Deve postar no grupo e virar `Disparado`.
4. **Ativar** (toggle no topo) → passa a rodar a cada 30 min sozinho.

## Ajustes
- **Janela/cadência:** node `Agenda` → mudar o intervalo (ex.: só horário comercial).
- **Segurança:** não commite o workflow **depois** de preencher os tokens no `Config` (ficam salvos nele). Pra versionar, exporte com placeholders ou use *n8n Credentials*.

---

# n8n — webhook do formulário de garimpo (entrada do Caio)

Workflow: `nsc-garimpo-webhook.json`. Recebe o `POST` do formulário da Vercel (`garimpo/`) e grava cada link como rascunho `Fila` no Baserow. **Não dispara nada** — é só a porta de entrada; o `/agenda` (modo lote) enriquece os rascunhos depois.

## O que ele faz
`Webhook` (POST, CORS liberado) → `Config` → `Validar + montar linhas` (confere o `form_secret`, teto de 20 itens, extrai o `mercari_id` de cada URL) → `Baserow: inserir (Fila)` (uma linha por peça) → `Responder ao form` (`{ok:true, count}`).

## Passos (parte humana)
1. n8n → **Workflows → Import from File** → `nsc-garimpo-webhook.json`.
2. Abra o node **`Config`** e preencha:
   - `baserow_token` → seu Database Token (o mesmo do disparo).
   - `form_secret` → invente uma string; **cole a MESMA** no `garimpo/index.html` (constante `SECRET`).
   > `baserow_url` (arvsystems) e `table_id` (556) já vêm certos.
3. **Ative** o workflow (toggle no topo). Só ativo o webhook responde.
4. Copie a **Production URL** do node `Webhook` (algo como `https://<seu-n8n>/webhook/nsc-garimpo-8f3a1c`) e cole no `garimpo/index.html` (constante `WEBHOOK_URL`) **e** no `.env` (`N8N_WEBHOOK_URL`). Depois, deploy do form na Vercel.
5. **Testar sem o form** (curl):
   ```bash
   curl -s -X POST "https://<seu-n8n>/webhook/nsc-garimpo-8f3a1c" \
     -H "Content-Type: application/json" \
     -d '{"secret":"<FORM_SECRET>","items":[{"url":"https://jp.mercari.com/item/m48149424293","note":"teste"}]}'
   ```
   Deve responder `{"ok":true,"count":1}` e aparecer uma linha nova na tabela 556 com `status=Fila`, `source_url` e `mercari_id` preenchidos, `photo_url` vazio.

## Notas
- **CORS:** o node `Webhook` está com `allowedOrigins: *` (typeVersion 2), que já responde o preflight `OPTIONS` do navegador. Sem isso o `fetch` do form seria bloqueado.
- **Path secreto:** o path `nsc-garimpo-8f3a1c` + o `form_secret` são o freio de spam. Se vazar, troque os dois (path no node Webhook, secret no Config e no form) e redeploy do form.
- **Enriquecer:** rode `/agenda` (sem URL) pra completar os rascunhos que entrarem (foto + tradução + preço) antes de aprovar.

## Depois (refino)
- Workflow gêmeo pro `/confere-ofertas` (diário: Firecrawl checa vendido → `Vendido` + avisa grupo). Claude gera quando quiser.
- **Dedup na entrada:** hoje o webhook não checa se o `mercari_id` já está na fila (link repetido vira linha repetida). Se virar incômodo, um `GET` antes do insert resolve.
