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

## Depois (refino)
- Workflow gêmeo pro `/confere-ofertas` (diário: Firecrawl checa vendido → `Vendido` + avisa grupo). Claude gera quando quiser.
