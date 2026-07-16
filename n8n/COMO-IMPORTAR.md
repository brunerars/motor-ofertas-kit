# n8n — importar o disparo de ofertas

Workflow: `nsc-dispara-ofertas.json`. Substitui o `/dispara-oferta` do Claude por um cron **persistente e 0 token**.

## O que ele faz
A cada 30 min: lê a fila do Baserow (`DISPARADOR`), pega as linhas **`Aprovado`** (e `Agendado` vencidas), e posta **uma a uma** no grupo via **WAHA** (`/api/sendImage` com `photo_url` + `caption`), marcando **`Disparado`** + `posted_at` + `wa_message_id`. **Nunca dispara `Fila`** (portão de aprovação) e **não spamma** se não houver nada aprovado.

> ⚠️ **Testar na mão com a agendada rodando é seguro agora, mas não era.** Foi assim que 3 peças viraram 5 posts em 16/07. Se for clicar em **"Test workflow"**, saiba que ele roda **junto** com a execução agendada, não no lugar dela. O que segura as duas hoje é o `reler a linha` (abaixo) — antes, nada segurava.

## Cadência: janela + uma peça por vez (16/07)
**Antes era rajada:** 5 aprovados = 5 posts seguidos, em segundos. É o padrão que derruba conta no WEBJS (o WhatsApp olha **volume e velocidade**, não se o horário é redondo).

Agora:
```
Filtrar aprovados (janela) → Loop Over Items → [done] fim
                                             → [loop] Espera humana (aleatória)
                                                        → Baserow: reler a linha
                                                        → Ainda dá pra disparar? --não--> volta pro Loop
                                                                   |sim
                                                        → Baserow: marcar Disparado   ← o cadeado, ANTES do envio
                                                        → WAHA: enviar
                                                        → Baserow: gravar message id
                                                        → volta pro Loop
```
- **Janela 9h-21h** (`America/Sao_Paulo`). Fora dela a fila **espera**, ninguém perde o lugar. Post de madrugada não é lido e ainda cheira a robô.
  > ⚠️ **Fuso:** o container do n8n roda em **UTC**. `new Date().getHours()` daria 9-21 UTC = **6h-18h no Brasil**. O código força `America/Sao_Paulo` via `toLocaleString`. Não "simplificar" isso.
- **Espera aleatória antes de cada envio** (node `Espera humana`). O número exato não importa; a **ausência de padrão** importa.
- **Teto por rodada = bound de sanidade**, não é mais o anti-duplicata (ver abaixo).

### ⚠️ Anti-duplicata: reler + marcar antes de enviar (16/07, pago com sangue)
**O que aconteceu:** em 16/07 três peças foram pro grupo **cinco vezes**. Duas execuções rodaram sobrepostas — A postou Lotus 22:30:49, B nasceu logo depois, e as duas seguiram postando Honda e Suzuka com ~35s de diferença.

**Por que:** o `Baserow: listar linhas` roda **uma vez, no topo da rodada**. Entre listar e enviar a última peça passam até **20 minutos**. A execução B leu a lista quando só o Lotus estava `Disparado`, e passou o resto da rodada postando de um **retrato desatualizado**. Marcar `Disparado` **depois** do envio piorava: o post já tinha caído no grupo antes da linha mudar.

**O teto nunca ia resolver isso.** Ele só garante que **uma** rodada caiba no cron. Não impede uma **segunda execução** de nascer no meio da primeira — que é exatamente o que acontece quando você clica **"Test workflow"** com a agendada rodando, ou deixa dois workflows ativos.

**O conserto, dentro do loop:**
1. **`Baserow: reler a linha`** — no instante do envio, pergunta o status **de agora**. Mata o retrato velho.
2. **`Ainda dá pra disparar?`** — já `Disparado` (outro chegou antes) ou `Descartado` (mudou de ideia no meio da rodada) → pula calado e segue pra próxima.
3. **`Baserow: marcar Disparado` ANTES do envio** — o cadeado. Quem chegar depois relê, vê `Disparado`, pula.

> **A troca que foi feita de propósito:** se o WAHA falhar, a peça fica `Disparado` sem ter saído. É silencioso, mas **detectável** (`status=Disparado` + `wa_message_id` vazio) e o pior caso é uma peça não postada. O oposto — duplicar no grupo — custa reputação com os clientes e risco de ban no WhatsApp. **Perder é mais barato que duplicar.**

> Bônus: o payload agora sai da linha **recém-lida**, não do retrato do topo. Legenda editada depois da aprovação sai correta. E sumiu o `$('Filtrar aprovados').item`, que atravessava a fronteira do `splitInBatches` — o ponto mais frágil de resolução de item do n8n.

### ⚠️ A cadência mora no `Config`, e só lá (16/07)
`cron_min` · `espera_min_s` · `espera_var_s`. O node `Espera humana` **e** o teto do `Filtrar aprovados` leem os **mesmos** três campos, e o teto **se recalcula sozinho**:
```
teto = floor( (cron_min * 60 * 0.75) / (espera_min_s + espera_var_s + 15) )
```
**Por que isso existe:** a espera vivia cravada no node Wait e o teto cravado no Code. Trocar a espera de 90s pra 225s deixou um teto de 15 valendo **56 min** contra um cron de **30 min**. Um número mudou, o outro não soube. **Agora não dá pra desalinhar.**

| espera | teto automático | pior caso |
|---|---|---|
| 90s | 12 | 21min |
| 180-225s (3 a 3min45) | 5 | 20min |
| 240-360s (4 a 6min, "5 em 5") | 3 | 19min |

> Teto baixo **não** trava a fila: o que sobra sai no tick seguinte. Com janela de 12h e cron de 30min são 24 rodadas por dia — mesmo com teto 3 dá 72 peças/dia, muito acima do volume real.
> **Mudou o intervalo no node `Agenda`? Mude o `cron_min` junto**, senão a conta do teto usa o número errado.

> **A proteção principal não é técnica:** é grupo **opt-in**. Ninguém recebe mensagem sem ter pedido. É isso que separa "loja" de "spam" aos olhos do WhatsApp.

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
- Workflow gêmeo pro `/confere-ofertas` (diário: Firecrawl checa vendido → `Vendido` + avisa grupo **+ avisa os leads da peça**, que agora existem). Claude gera quando quiser.
- **Dedup na entrada:** hoje o webhook do garimpo não checa se o `mercari_id` já está na fila (link repetido vira linha repetida). Se virar incômodo, um `GET` antes do insert resolve. *(O `nsc-lead-inbound` já nasceu com dedup.)*

---

# n8n — ciclo do lead (inbound do WhatsApp)

Workflow: `nsc-lead-inbound.json`. Fecha a ponta que faltava: o cliente clica no `🏁 Quero essa peça` da oferta, manda `Estou interessado! (mXXXX)`, e isso **vira dado** em vez de morrer no seu 1:1.

## O que ele faz
`Webhook (WAHA inbound)` → `Config` → `Filtrar + montar lead` (descarta grupo/próprio envio/mensagem sem id) → `Baserow: achar a peça` (GET na 556: dá o `row_id` pro link e o `title_pt` pro aviso) → `Baserow: leads desta peça` (GET na 557: dedup + ordinal) → `Dedup + ordinal` (monta a linha) → `Baserow: gravar lead` (POST na `LEADS`) → `Montar aviso` → `WAHA: avisar Bruno` (`/api/sendText`).

> **A peça é buscada ANTES de gravar** porque o campo `peca` é um link de verdade e link quer `row_id`, não `mercari_id`. O mesmo GET já traz o `title_pt` do aviso — dois coelhos.

**Não responde o cliente.** Quem atende é você; o bot só registra e te cutuca.

## Passos (parte humana)
1. ~~Criar a tabela `LEADS`~~ **feito: tabela 557**, criada via API (JWT) em 16/07 com o link real pra `DISPARADOR`. Já está no `.env` (`BASEROW_LEADS_TABLE_ID=557`) e no `Config` do workflow. Schema em `docs/baserow-disparador-schema.md`.
2. n8n → **Import from File** → `nsc-lead-inbound.json` (ou a cópia de `versoes-em-prod/`). No `Config`, preencha só o que é segredo: `baserow_token`, `waha_api_key`, `admin_id`. (`table_id=556` e `leads_table_id=557` já vêm certos.)
   > `admin_id` = **seu número PESSOAL** no formato `55DDDNUMERO@c.us`, não o da loja. Vazio = o lead é gravado mas **ninguém te avisa**.
3. **Ative** o workflow e copie a **Production URL** do node `Webhook`.
4. Cole essa URL no `.env` (`WAHA_HOOK_URL`) **e** no env da stack do WAHA (Portainer → a stack já lê `WHATSAPP_HOOK_URL: ${WAHA_HOOK_URL}`). **Redeploy do WAHA** — sem isso o hook não existe.
5. **Conferir que o hook pegou:** `GET /api/sessions/default` (header `X-Api-Key`) deve mostrar o webhook. Se não mostrar, `docker logs waha`.

## Testar (na ordem — o 2º é o que importa)
```bash
# 1) simular o WAHA sem depender do WhatsApp:
curl -s -X POST "https://<n8n>/webhook/nsc-lead-4d9b2e" -H "Content-Type: application/json" \
  -d '{"event":"message","session":"default","payload":{"from":"5511988887777@c.us","fromMe":false,"body":"Estou interessado! (m71370664392)","_data":{"notifyName":"Teste"}}}'
# -> linha nova na LEADS + ping no seu zap
```
2. **O teste que mais importa:** dispare uma oferta no grupo e confirme que **nenhum lead** apareceu. O hook recebe TUDO, inclusive os posts do próprio bot. Se aparecer lead, o filtro `@g.us`/`fromMe` furou.
3. **Dedup:** mande a mesma mensagem 2× → 1 linha, 1 aviso.
4. **Ruído:** mande "oi" → nada acontece, sem erro vermelho no n8n.

## ⚠️ Gotcha do hook — a env NÃO entra em sessão que já existe (queimou em 16/07)
`WHATSAPP_HOOK_URL` é o **padrão aplicado quando a sessão é CRIADA**. A sessão `default` já existia, e o `WHATSAPP_RESTART_ALL_SESSIONS: "True"` a restaura **com a config salva no volume** — que não tinha hook. Resultado: env setada, stack redeployada, e o WAHA continua sem webhook nenhum.

**Sintoma:** `GET /api/sessions/default` volta `WORKING`, número logado, e `config.webhooks` **vazio**. O n8n fica ativo esperando um POST que nunca chega. Nada dá erro.

**Solução (não precisa de redeploy):** gravar o webhook direto na sessão —
```bash
curl -s -X PUT "https://waha.arvsystems.cloud/api/sessions/default" \
  -H "X-Api-Key: $WAHA_API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"default","config":{"webhooks":[{"url":"'"$WAHA_HOOK_URL"'","events":["message"]}]}}'
```
A sessão **reinicia** pra aplicar (volta sozinha pelo volume, sem QR — validado em 16/07). A config fica no volume e sobrevive a restart. **Conferir depois:** `GET /api/sessions/default` tem que mostrar o webhook em `config.webhooks`.

> A env nas stacks fica assim mesmo: serve pra **sessão nova** (ex.: loja nova, onde ela é criada depois da env). Pra sessão que já existe, é o PUT.

## Notas
- **`responseMode: onReceived`** (≠ do garimpo, que usa `responseNode`). O WAHA só quer o `200`, não lê corpo. Com `responseNode`, toda mensagem descartada (grupo, "oi") deixaria o webhook pendurado até estourar timeout.
  > **O preço disso:** o webhook responde `200` **sempre**, mesmo se o fluxo quebrar depois. `200` aqui **não prova nada** — quem conta a verdade é a lista de **Executions** do n8n. (Diferente do garimpo, onde `200` vazio era sintoma de nó renomeado.)
- **`WHATSAPP_HOOK_EVENTS: message`** e não `message.any`: `message.any` inclui os **próprios envios** → cada oferta postada viraria lead fantasma. O Code node filtra `fromMe` de novo mesmo assim (cinto e suspensório).
- **Path secreto é o único freio:** o WAHA **não assina** o POST (não há secret nem HMAC). Se vazar, troque o path no node Webhook e o `WAHA_HOOK_URL`, e redeploy do WAHA.
- **Timeout 120s** no node de aviso, mesma razão do envio de imagem (o WAHA fala por um Chromium de verdade).
- **PII:** a `LEADS` guarda telefone de cliente. Ver a nota no schema.
