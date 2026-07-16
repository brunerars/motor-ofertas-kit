# n8n — importar o disparo de ofertas

Workflow: `nsc-dispara-ofertas.json`. Substitui o `/dispara-oferta` do Claude por um cron **persistente e 0 token**.

## O que ele faz
A cada 30 min: lê a fila do Baserow (`DISPARADOR`), pega as linhas **`Aprovado`** (e `Agendado` vencidas), posta cada uma no grupo via **WAHA** (`/api/sendImage` com `photo_url` + `caption`), e marca **`Disparado`** + `posted_at` + `wa_message_id`. **Nunca dispara `Fila`** (portão de aprovação) e **não spamma** se não houver nada aprovado.

## Passos (parte humana)
1. n8n → **Workflows → Import from File** → escolha `nsc-dispara-ofertas.json`.
2. Abra o node **`Config`** e preencha (são os mesmos valores do `.env`):
   - `baserow_token` → seu Database Token
   - `waha_api_key` → a `WAHA_API_KEY` (a MESMA que está na env da stack do WAHA; se divergir, o n8n toma 401)
   - `waha_url` → **`http://waha:3000`** (rede interna). **Não usar o domínio público** pra falar com o vizinho de porta: é mais lento, gasta TLS e amarra no Traefik.
   - `group_id` → formato **`120363…@g.us`**. O formato da Z-API (`120363…-group`) **não funciona**.
   - `waha_session` → `default`
   > `baserow_url` (arvsystems) e `table_id` (556) já vêm certos. Se importar de `versoes-em-prod/`, tudo isso já vem preenchido.
   > **Timeout do node de envio = 120s, não reduza.** O WAHA envia por um Chromium e é lento. Se estourar, o post **sai** mas a linha **não** vira `Disparado` → a peça é postada de novo no tick seguinte.
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

## ⚠️ Gotcha do import — o "1" que quebra tudo (queimou em 16/07)
**Importar por cima de um canvas que já tem os nós antigos quebra o workflow em silêncio.** O n8n renomeia pra não colidir (`Config` → **`Config1`**) e reescreve as referências — mas erra: carimba o `1` até em referência de nó que **não** foi renomeado (`$('Webhook (form do Caio)')` vira `$('Webhook (form do Caio)1')`, que não existe). O Code node estoura na 1ª linha.

**Sintoma que engana:** o webhook responde **`200` com corpo vazio, até com secret errado**, e **nenhuma linha** aparece no Baserow. Parece problema de Baserow/secret/preço — não é. É referência de nó por nome.

**Como evitar:**
1. **Apague o workflow antigo** no n8n (ou os nós antigos do canvas) **antes** de importar. Import em canvas limpo não colide, não carimba `1`.
2. Depois de importar, confira no Code node se as chamadas `$('Config')` e `$('Webhook (form do Caio)')` batem com os nomes reais na tela.

**Diagnóstico rápido** (separa "não registrado" de "quebrado por dentro"):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "<URL>/webhook/path-que-nao-existe" -d '{}'   # 404 = n8n normal
curl -s -X POST "<PRODUCTION_URL>" -H "Content-Type: application/json" -d '{}'                  # 200 vazio = refs quebradas
```
Um `{}` sem secret **tem** que dar erro de `unauthorized`. Se der `200` vazio, o código não está rodando.

## ⚠️ Qual arquivo importar
- `n8n/*.json` = **template versionado**, com `<PREENCHER_...>` no `Config`. Importar este e esquecer de preencher = workflow no ar com secret placeholder (foi o que aconteceu em 16/07: o `form_secret` ficou `<PREENCHER_FORM_SECRET>` e nada autenticava).
- `n8n/versoes-em-prod/*.json` = **espelho do que roda**, com os segredos já dentro. **É este que se importa.** Fora do git (`.gitignore`), fica só na máquina do Bruno.

## Notas
- **CORS:** o node `Webhook` está com `allowedOrigins: *` (typeVersion 2), que já responde o preflight `OPTIONS` do navegador. Sem isso o `fetch` do form seria bloqueado.
- **Path secreto:** o path `nsc-garimpo-8f3a1c` + o `form_secret` são o freio de spam. Se vazar, troque os dois (path no node Webhook, secret no Config e no form) e redeploy do form.
- **Enriquecer:** rode `/agenda` (sem URL) pra completar os rascunhos que entrarem (foto + tradução + preço) antes de aprovar.

## Depois (refino)
- Workflow gêmeo pro `/confere-ofertas` (diário: Firecrawl checa vendido → `Vendido` + avisa grupo). Claude gera quando quiser.
- **Dedup na entrada:** hoje o webhook não checa se o `mercari_id` já está na fila (link repetido vira linha repetida). Se virar incômodo, um `GET` antes do insert resolve.
