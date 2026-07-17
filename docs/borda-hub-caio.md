# Borda do Caio — a primeira instância do hub

> A tela por papel onde o Caio opera a loja sozinho. **Construída em 16/07.** Runbook: [`../borda/README.md`](../borda/README.md).
> Contexto de produto: [[arquitetura-hub]] · plano da sessão: `~/.claude/plans/h-algo-bem-jarvis-resilient-swan.md`.

## O que é, e por que não é uma IDE

O produto que se vende (implementação high-ticket) entrega ao dono de negócio uma **borda por papel**:
uma superfície estreita por função, onde ele vê **só o que ele faz**. Sem pasta, sem arquivo, sem terminal.

Isso não é opinião de design, é a lição que a ARV já cobrou: o CEO rejeitou análise pronta
(*"mostrar o dado etapa a etapa e deixar o Andre concluir"*) e a conclusão registrada foi
**"o produto certo aqui era menos inteligente de propósito"**. O `garimpo/index.html` é a outra
metade da prova: é a única coisa deste vault que um não-técnico já opera sozinho, e é um form
estático. A referência de mercado (MazyoHub) entrega VS Code no navegador pro empresário — é
justamente o que o nosso próprio material diz que não funciona.

## A decisão travada: a v1 não tem IA

O estado da loja **já mora no Baserow**. Checando verbo por verbo contra o schema:

| Ação | IA? | O que é de fato |
|---|---|---|
| Ver fila · aprovar · editar legenda · agendar · descartar · marcar que sumiu | **não** | `GET`/`PATCH` em `rows/table/556` |
| Colar link | **não** | **já existe e roda** (`garimpo/`, no ar desde 15/07) |
| Enriquecer link | sim | `/agenda` — fica com o Bruno |
| Gerar post | sim | `/post-stories` — fica com o Bruno |

A prova é do próprio projeto: `agenda/SKILL.md:43` — *"Aprovação = humana, no Baserow (barato, sem
webhook)"*. **A borda é uma pele por papel em cima do flip que o Bruno já faz na mão.** O cron lê
`Aprovado`/`Agendado` e não sabe (nem precisa saber) quem escreveu.

**Os dois portões continuam existindo, sem mecanismo novo:** quem enriquece é o Bruno rodando
`/agenda`, então **o enriquecimento já É a conferida dele** — a mesma que pegou a condição
subestimada da row 5 e a peça falsa do boné DEKRA. O aprovar do Caio é o gate **comercial**
(preço, encaixe no nicho, Tam).

> ⚠️ **Quando o enriquecimento for automatizado (v3), a conferida do Bruno some calada.**
> Não é um detalhe de implementação: é a remoção silenciosa do freio que já pegou peça falsa duas
> vezes. Reinserir um freio explícito nesse momento, ou aceitar por escrito que ele saiu.

## O chat ficou de fora, e é o corte mais importante

Sem agente rodando server-side, um chat é teatro: o Caio digita e não acontece nada. O canal que
já funciona entre os dois é o WhatsApp, e ele é melhor que qualquer chat construído numa semana.
Chat entra quando existir o serviço do agente (v3), **ou nunca**.

## Stack, e o que decidiu

**Next.js na Vercel, Route Handlers como proxy. Nada novo na VPS.**

Quem decide é o token: o `BASEROW_TOKEN` dos workflows é escopo *all tables*. No browser ele não
vaza "a fila" — entrega a **`LEADS` (telefone de cliente)** e o `price_jpy` (referência de custo).
Isso mata "estático batendo direto no Baserow", que seria o caminho mais barato. O `secret` do
garimpo é aceitável porque lá **só escreve rascunho**; a borda **lê**.

Vercel porque o deploy já foi feito duas vezes neste projeto, a rotina está escrita e não tem
container, DNS nem Traefik no caminho. **FastAPI na VPS é a casa do agente (v3+), não de 6 rotas de
CRUD** — a borda *chama* o agente, nunca o hospeda.

**Um deploy por loja**, não multi-tenant: o deploy da loja B não tem credencial pra ler a tabela da
loja A. Isolamento vira infra em vez de `if`, e um filtro esquecido não é possível quando não há o
que filtrar.

## A costura da generalização

```
v1:  getLoja() → lê env (BASEROW_TABLE_ID)          ← 1 loja, no ar hoje
v2+: getLoja() → lê a LOJAS por LOJA_SLUG, cacheia  ← hub-compliant
```

`getLoja()` **nasceu `async` mesmo lendo env**: na v2 vira chamada de rede. Síncrona agora e async
depois obrigaria a mexer em todo call-site — aí não seria costura, seria remendo.
Ninguém lê `BASEROW_TABLE_ID` fora do `lib/loja.ts`, o que honra a regra do
[[arquitetura-hub]]: *"nenhum node volta a ter id de loja literal"*.

| 100% template | Instância NSC |
|---|---|
| o fluxo fila → aprovar → agendar → no ar · auth · cliente Baserow · middleware · o mock · o harness de screenshot | cores/fontes · formato da legenda · Mercari/JPY/regex `m\d+` · semântica do Tam |

Na Fase 1 do hub, `borda/` migra pra `kit/templates/borda/` com os mesmos `__PLACEHOLDER__` do
`garimpo/` — que é o único artefato do repo que já fez isso certo.

## Verificado em 16/07 (com o que, e com o que não)

- ✅ **Portão:** sem cookie, página → 307 pro login e **API → 401 JSON** (não HTML: um fetch que
  recebe login em HTML falha no `.json()` com um erro que não diz nada).
- ✅ **Vazamento:** o payload da API **não tem `price_jpy` nem `wa_message_id`**.
- ✅ **Freios do servidor** (botão desabilitado não é segurança): `Disparado`/`Vendido` → **403**
  (são do cron) · aprovar sem preço → **409** · mexer em `price_brl` → rejeitado pela allowlist.
- ✅ **`status` sai por TEXTO**, nunca por id — provado no mock.
- ✅ **UTF-8** (acento + 🏁) atravessa inteiro, mandando por `--data-binary @arquivo`.
- ✅ **390 e 1440**, nenhuma tela rola na horizontal.
- ✅ **A fila esconde rascunho cru** e conta como *"1 peça chegando"*.
- ⚠️ **NÃO verificado: o ciclo real ponta a ponta.** A DISPARADOR tem 3 linhas e **todas já foram
  disparadas** — não existe peça em `Fila` (a row 23 do plano sumiu; a fila foi limpa depois do 16/07).
  A Fila foi provada contra o **mock**, não contra o Baserow real.
  **Não se flipou peça `Disparado` → `Fila` pra testar:** aprovar depois faria o cron **repostar no
  grupo real**. O teste de verdade é o Bruno rodar `/agenda` num link novo e o Caio aprovar.

## O que falta

- **v1:**
  - [x] **Token escopado na DISPARADOR** — `BASEROW_TOKEN_BORDA`, próprio (≠ o dos workflows). `npm run smoke` prova: lê a 556 e toma **401 na 557**. A borda não alcança telefone de cliente nem que queira.
  - [ ] **Versionar o `borda/`** — 40 arquivos ainda `??` no git. O `.gitignore` próprio já protege o `.env.local`.
  - [ ] **Deploy na Vercel** + **desligar o SSO** (senão o Caio toma tela de login da Vercel e parece bug da borda).
  - [ ] **Uma peça real em `Fila`** — hoje a 556 tem 3 linhas e **nenhuma em `Fila`** (nem rascunho do form). Depende de link novo do Caio → Bruno roda `/agenda`. **É o pré-requisito do teste que importa**, e não dá pra forjar: flipar uma linha `Disparado` de volta faria o cron repostar no grupo real.
  - [ ] **O Caio aprovar 1 peça real sozinho, sem perguntar nada.**
- **v2:** absorve o garimpo (URL única) · botão "pedir post" → fila de pedidos → o Bruno roda
  `/post-stories` → o PNG aparece na borda · `aprovado_por` + timestamp · leads **se** o recorte de
  PII for decidido.
- **v3:** enriquecimento automático (n8n + Claude API) **+ reinserir a conferida que some** ·
  `/nova-loja` cria o projeto Vercel da borda · FastAPI + Agent SDK **só se o chat se provar**.

## O risco que não é de código

A conversa com o Caio pra levantar o sistema-template **está desmarcada desde 24/06** enquanto a
tech correu sozinha. Esta borda é o que o **Bruno acha** que o Caio quer. O CRUD era barato o
bastante pra compensar construir e mostrar em vez de perguntar — **mas mostrar antes de construir a
v2**, que é onde o dinheiro começa a queimar.

**O teste que importa:** o Caio abre no celular, aprova uma peça sozinho e **não pergunta nada**.
Se ele perguntar, a borda falhou como produto mesmo com o código certo.
