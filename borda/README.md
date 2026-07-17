# Borda — a mesa do Caio

A tela onde o Caio confere a fila, aprova e agenda. **Sem pasta, sem arquivo, sem IDE.**
1ª instância do hub. Desenho e faseamento: [`../docs/borda-hub-caio.md`](../docs/borda-hub-caio.md).

## A regra que explica todo o resto

**A v1 não tem IA.** O estado já mora no Baserow, então ver a fila, aprovar, editar a legenda e
agendar é `GET`/`PATCH` — nada mais. Quem enriquece o link (`/agenda`) e quem gera post
(`/post-stories`) continua sendo o Bruno.

Não é limitação: **é o modelo de negócio expresso em arquitetura.** O enriquecimento *é* a
conferida do Bruno; o aprovar do Caio é o gate comercial (preço, encaixe, Tam). Dois portões
reais, zero mecanismo novo.

## O que ela não toca

`n8n/` · `waha/` · schema do Baserow · `garimpo/` · `lp/` · o `BASEROW_TOKEN` dos workflows.
Deu errado? Apaga a pasta e o projeto na Vercel. Não tem o que desfazer.

## Rodar

```bash
cp .env.example .env.local     # preencher (o .gitignore já pega *.local)
npm install
npm run smoke                  # PRIMEIRO: prova que o token lê a 556 e NÃO lê a 557
npm run dev
```

**Sem o Baserow de verdade** — a fila real quase nunca tem peça em `Fila`, e criar linha de teste
lá é escrever em produção pra ver um botão:

```bash
npm run mock       # terminal 1: Baserow falso (peça normal + peça sem preço + rascunho cru)
npm run dev:mock   # terminal 2: a borda contra o mock, na 3989
```

**Screenshot das telas** (390 e 1440, e falha se alguma rolar na horizontal):

```bash
node --env-file=.env.local scripts/shot.mjs http://localhost:3989 ./shots
```

**Provar os freios de escrita** (ataca a rota direto, sem UI — botão desabilitado não é segurança):

```bash
npm run guards       # com o mock + dev:mock rodando
```

**Exercitar o fluxo do Caio** (clica de verdade: edita, salva, aprova):

```bash
node --env-file=.env.local scripts/drive.mjs http://localhost:3989 ./drive.png
```
Só contra o **mock** — ele clica em Aprovar, e aprovar no Baserow real faz o cron postar no grupo.
**Reinicie o mock antes de cada corrida** (ele guarda estado; a corrida anterior aprova a 1ª peça e
a seguinte acha a peça sem preço no topo, com o Aprovar travado — parece bug e não é).
No Windows o `pkill` não mata: `netstat -ano | grep :4001 | grep LISTENING` → `taskkill //F //PID <pid>`.

## Deploy (Vercel) — **no ar: https://nsc-borda.vercel.app**

Projeto `nsc-borda` · `prj_7S3N3eH36rO6FLZRUIp3EXFso909` · scope `brunoconstantinou-4051s-projects`.

```bash
npx vercel deploy --prod --yes --scope <scope> --token=$VERCEL_TOKEN
npx vercel alias set <deploy-url> nsc-borda.vercel.app   # o alias NÃO segue prod sozinho
```
- **`.vercel/project.json` tem que existir ANTES** (é gitignorado, então some em clone novo). Sem
  ele o CLI cria um projeto novo com o nome da **pasta** (`borda`) — genérico e colidindo entre
  lojas. Foi assim que nasceu o projeto fantasma `build` no deploy da LP.
- **SSO Deployment Protection vem LIGADO.** Desligar **na criação**, não depois
  (`PATCH /v9/projects/<id>?teamId=<t> {"ssoProtection":null}`): ligado, o Caio toma tela de login
  da Vercel e acha que a borda quebrou.
- **Env vars = as do `.env.example` menos `BASEROW_LEADS_TABLE_ID`**, que é só do smoke — a app
  nunca lê (`grep process.env app lib` prova). São 9.

Verificar prod (não confie em "deploy ready"):
```bash
python "$CLAUDE_JOB_DIR/tmp/verifica_prod.py"   # portão · SSO · login · fila real · vazamento
```
> **A rota de login lê o campo `senha`**, não `passphrase`. Mandar o nome errado dá 401 e parece
> senha errada — inclusive faz um teste de "senha errada" passar pelo motivo errado.

## Mapa

| Arquivo | Papel |
|---|---|
| `lib/loja.ts` | **A costura.** v1 lê env; v2 lê a tabela `LOJAS`. É `async` de propósito — na v2 vira rede, e nenhum call-site muda. Ninguém lê `BASEROW_TABLE_ID` fora daqui. |
| `lib/baserow.ts` | Cliente **server-only** (o `import 'server-only'` quebra o build se um client component importar). Corta `price_jpy` e `wa_message_id` antes de mandar pro browser. |
| `lib/caption.ts` | Lê a legenda (não monta — quem monta é a `/agenda`). Render do `*negrito*` do WhatsApp pro preview. |
| `lib/auth.ts` | Passphrase → cookie HMAC. Web Crypto, não `node:crypto`: o middleware roda no Edge. |
| `app/api/ofertas/[id]/` | Allowlist de escrita. `Disparado` e `Vendido` são **403** — quem escreve esses dois é o n8n. Linha com `posted_at` é **409**: já saiu no grupo, não se mexe. |

## Armadilhas (já pagas)

- **`status` sempre por TEXTO**, nunca por id. Os ids de `single_select` não se repetem entre
  tabelas: o `2573` literal da `/agenda` funciona na NSC e **quebra calado na loja 2**.
- **O cadeado do disparo tem uma chave só, e é o `status`.** O `Ainda dá pra disparar?` do n8n
  decide *só* por ele — então qualquer coisa que devolva uma linha postada pra `Aprovado` faz o
  cron **repostar no grupo real**. Não adianta o `PERMITIDOS` recusar `Disparado`: `Aprovado` é
  destino legítimo, e o buraco era não olhar o estado **atual**. Por isso o guard `ja_postada`
  (409) olha `posted_at`, que o n8n escreve e ninguém mais. Fixture `#106` no mock guarda isso.
- **"Vendido" são duas coisas.** `sold` = *o anúncio sumiu do Mercari* (problema: alguém no Japão
  comprou antes). `LEADS.status=Fechado` = *o cliente comprou*. A aba se chama **"Saiu do Mercari"**
  por isso.
- **A borda pode mentir sobre o disparo:** envio lento estoura o timeout, o post sai mas a linha não
  vira `Disparado`. Por isso o card fala em **janela** ("sai na próxima janela"), não em estado.
- **Ban do número é *quando*, não *se*** (ver `../docs/arquitetura-hub.md` §8.1). Quando cair, a fila
  enche de `Aprovado` sem motivo visível — daí o banner honesto no "No ar".
- **`--env-file` e emoji:** mandar JSON com acento/emoji pela linha de comando corrompe no shell do
  Windows. Usar `--data-binary @arquivo.json`.
