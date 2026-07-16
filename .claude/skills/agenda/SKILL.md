---
name: agenda
description: Processa uma URL CURADA do Mercari numa oferta pronta pra disparo — Firecrawl (dados+fotos) → traduz PT → grava na fila (Baserow DISPARADOR, status Fila) → preview no WhatsApp p/ aprovação → agenda. Curadoria é humana (URL vem do Bruno/Caio; a IA nunca escolhe produto). Use quando o Bruno mandar URL(s) do Mercari pra entrar na fila de ofertas.
---

# Agenda — URL Mercari → fila (Baserow) → preview → agendamento

Coração do Bloco Ofertas: transforma um item curado num registro pronto pra disparar no grupo.

> **Regra dura — curadoria humana.** A IA NUNCA descobre/escolhe produto. Processa só a URL dada.

## Input
- **Modo URL** — URL(s) do Mercari (curadas por Bruno/Caio) coladas no comando. Cria linha nova.
- **Modo lote (sem URL)** — roda sem argumento: pesca os **rascunhos do formulário do Caio** (linhas que já estão no Baserow, só com `source_url`) e enriquece cada uma. Ver seção "Modo lote".
- Config Baserow no `.env` (`BASEROW_API_URL`, `BASEROW_TOKEN`, `BASEROW_TABLE_ID=556`).
- WhatsApp = **WAHA** auto-hospedado (`WAHA_URL`, `WAHA_API_KEY`, `WAHA_GROUP_ID`). Não é mais pendência: está no ar desde 16/07 e o disparo roda no n8n. O `/agenda` **não envia nada** — só deixa a linha pronta.

## Fluxo
1. **Firecrawl** o item → `title`, `price_jpy`, `description`, `brand`, `condition`, `category`, `sold`, `image_urls`. API: `formats:["json"]` + `jsonOptions{prompt,schema}` (ver CLAUDE.md do projeto).
2. **Fotos → acervo** (reusa `/acervo`: download com **User-Agent de browser + Referer**, senão 403; salva `marca/acervo/<id>/`).
3. **Traduzir** `title` + `description` JA→PT (Claude inline). Manter tom de [[logistica-mercari]]/roteiro.
4. **Preço:** `price_brl` vem do **form do Caio** (campo Valor, em R$). **Esse R$ já é fechado: inclui frete do Japão + impostos** ("por nossa conta" é o modelo de venda da NSC) — NÃO somar nada, NÃO escrever "frete sob consulta". O único frete que sobra é escritório→casa do cliente, e isso se resolve no pv, fora da legenda. `price_jpy` (do Firecrawl) é referência interna, não vai pro post. **Sem `price_brl` = sem legenda:** segurar em `Fila` e reportar pro Bruno (o modelo do grupo exige preço).
5. **Montar a legenda final** (`caption`) — o texto EXATO que vai pro grupo. **Formato fechado pelo Bruno em 16/07** (curto; a foto faz o trabalho). Copiar ao pé da letra, inclusive as linhas em branco:
   ```
   *<Título da peça>*
   Tam: <a observação do Caio, como ele escreveu; "único" se vazio>

   R$ <preço>

   🏁 Quero essa peça: https://wa.me/<numero>?text=Estou%20interessado!%20(<mercari_id>)
   ```
   Regras do formato (não são enfeite, são o padrão):
   - **Título sempre entre asteriscos** — é o negrito do WhatsApp. Quem renderiza é o **app do WhatsApp**, não a API (vale igual no WAHA, na Z-API ou em qualquer outra), então o `*` vai **literal** no campo do Baserow.
   - **As 2 linhas em branco fazem parte** do formato: separam título+tam / preço / CTA. Sem elas o bloco fica pesado no grupo.
   - **A linha do Tam nunca some.** Vem do campo `tags` do Baserow (o que o Caio digitou no form). Vazio → `Tam: único` (peça sem tamanho: boné, chaveiro, pôster, miniatura).
   - **A observação é de quem escreveu: não inventar, não acrescentar.** *(Regra dura de 16/07 que **reverte** a "regra de autoria" tentada no mesmo dia.)* O que o Caio/Bruno digitou entra **como está**; o máximo permitido é **gramática e formato** (`tamanho M` → `M`). Se a nota já cita um defeito, ele fica **na mesma linha**, sem abrir linha própria (`Tam: F, medidas pv, aba desbotada`).
   - **NUNCA acrescentar defeito que só a `description` menciona.** Carimbar "leve mancha na lente" numa peça que o Caio deu como boa **desqualifica o produto por um detalhe pouco visual** e cria objeção de venda sozinho. **Quem decide o que desqualifica a peça é o Bruno, não a skill.**
   - **Divergência: reportar, não escrever.** Se o anúncio admite algo que a nota não diz, **dizer no report** e deixar o Bruno decidir no flip `Fila`→`Aprovado`. A legenda não muda por conta própria.
   - Sem gancho histórico, sem medidas técnicas (vão no pv), sem "valor/frete sob consulta".
   O `wa.me` fica porque é a captura de lead (grupo não tem botão "tenho interesse"). É isso que o Bruno aprova/edita.
   > **Texto pré-preenchido = `Estou interessado! (<mercari_id>)`** (decisão 16/07, revista no mesmo dia). O cliente vê uma frase normal e o id fica discreto no fim: ele não precisa entender o código, e o Bruno sabe de qual peça é sem perguntar de volta. **Antes era só o id** e ficou confuso pro cliente (quem não entende apaga antes de enviar, e aí o rastreio morre justo quando importa). **Não existe ganho técnico em manter só o id:** nada parseia essa mensagem. O `wa_message_id` guarda o id da mensagem que o **bot envia**, não a resposta do cliente; não há webhook de entrada, e o "avisar interessados" do `/confere-ofertas` nunca saiu do papel. **Quem lê é o Bruno, no 1:1.** Encurtador de URL testado e **descartado**: o `is.gd` falhou na hora, e encurtador que cai no meio de um disparo leva o CTA junto.
6. **Subir a foto + gravar na fila.** Sobe `acervo/<id>/1.jpg` pro Baserow (`POST /api/user-files/upload-file/`, Database Token, multipart `-F file=@…`) → guarda a **URL pública** (`/media/user_files/…`, abre sem auth) em **`photo_url`**. Insere a linha `status=Fila` com `caption` + `photos` + `photo_url`. **Por quê:** o disparo roda no **n8n hospedado**, que NÃO acessa arquivo local → precisa da URL pública (o **WAHA** busca por ela em `file.url`; o CDN do Mercari dá 403, o Baserow não). Schema em `docs/baserow-disparador-schema.md`.
7. **Aprovação = humana, no Baserow (barato, sem webhook).** Bruno revisa a linha (`caption` + foto), flipa `Fila`→**`Aprovado`** (ou edita a legenda / `Descartado`). A curadoria do ITEM já veio na URL; aqui ele só confere **tradução + foto**. *(Opcional: mandar o preview no 1:1 via WAHA (`sendImage`) — mas o ato de aprovar é o flip no Baserow.)*
8. **(opcional) Agendar:** setar `scheduled_at` (regra: X posts/hora, janela) → `status=Agendado`. Sem `scheduled_at`, o `Aprovado` sai na próxima janela.
> Calibração: aprovação LIGADA por post agora. Conforme o template estabiliza, cair pra spot-check / auto com portão de confiança (segurar só o ambíguo — condição com dano ou tradução incerta).

## Comando — inserir na fila (Database Token; valida sem user/senha)
```bash
BASE="<projeto>"; set -a; source "$BASE/.env"; set +a; API="${BASEROW_API_URL%/}"
curl -s -X POST "$API/api/database/rows/table/$BASEROW_TABLE_ID/?user_field_names=true" \
  -H "Authorization: Token $BASEROW_TOKEN" -H "Content-Type: application/json" \
  -d '{"mercari_id":"mXXXX","title_pt":"…","title_ja":"…","source_url":"…","description_pt":"…",
       "brand":"…","category":"…","condition":"…","price_jpy":2500,
       "photos":"acervo/mXXXX/1.jpg,…","tags":"…","sold":false,"status":2573}'
# status é single_select → id da opção. Fila=2573 (conferir em docs/baserow-disparador-schema.md se mudar).
```

## Modo lote — enriquecer os rascunhos do formulário
O formulário de garimpo (`garimpo/`, na Vercel) deixa o Caio despejar links; o webhook do n8n (`n8n/nsc-garimpo-webhook.json`) grava cada um como **rascunho cru** no Baserow: só `source_url` + `mercari_id` + `tags` (a nota dele), `status=Fila`, `title_pt` = o próprio id (rótulo provisório) e **`photo_url` vazio**. Esse rascunho **não é disparável** (o n8n de disparo exige `photo_url` + `caption`). O `/agenda` em modo lote é quem completa.

Rodando `/agenda` **sem URL** (não pedir link — ir no banco):
1. **Listar os rascunhos:** `GET $API/api/database/rows/table/556/?user_field_names=true&size=200`, header `Authorization: Token $BASEROW_TOKEN`. Filtrar as linhas com `status=Fila` **e** `photo_url` vazio **e** `source_url` preenchido (é o formato do rascunho; a linha que o próprio `/agenda` cria já nasce completa, então não reaparece aqui).
2. **Reportar quantos achou e confirmar** antes de gastar Firecrawl no lote todo (o Caio pode ter mandado até 20). Sem rascunho pendente, avisar e parar — não inventar item.
3. **Para cada rascunho**, rodar os passos 1–6 do Fluxo (Firecrawl → acervo → traduzir → preço → `caption` → subir foto), **mas fazer `PATCH` na MESMA linha** (não `POST`), preservando `tags` (a nota do Caio ajuda na conferida) e o `mercari_id`:
   `PATCH $API/api/database/rows/table/556/{row_id}/?user_field_names=true` com `title_pt, title_ja, description_pt, brand, category, condition, price_jpy, photos, photo_url` (mantém `status=Fila`).
   > **Estado: ler tudo, mas escrever nada por conta própria (regra de 16/07).** O `condition` do Mercari costuma dizer "sem danos" enquanto a `description` admite desbotamento ou mancha. **Ler** a descrição inteira, sim — mas o defeito **NÃO entra na `caption`** se a nota do Caio não o cita. Vai **no report**, pro Bruno decidir. *Por quê: carimbar um detalhe pouco visual na legenda desqualifica a peça sozinho, e a chamada de o que vale a venda é comercial, do Bruno, não da skill.* Se o Bruno mandar incluir, aí sim entra na linha do Tam, por vírgula.
   > **Encaixe no nicho:** o Caio manda o link, mas quem aprova o encaixe é o Bruno. Se a peça foge do nicho da loja (ex.: grife de moda vs. memorabilia de F1), enriquecer mesmo assim mas **sinalizar no report** pra decisão de `Aprovado`/`Descartado`.
4. **Reportar** ao Bruno: quantos rascunhos entraram, quantos foram enriquecidos, e quais falharam (URL morta / item já vendido — marcar `Descartado` com o motivo) + qualquer ressalva de encaixe/estado. A aprovação segue igual: Bruno revisa e flipa `Fila`→`Aprovado` no Baserow.
> **Não duplica:** o modo lote sempre faz `PATCH` no `row_id` do rascunho, nunca cria linha nova. Idempotente — rodar de novo sobre uma linha já enriquecida (que já tem `photo_url`) simplesmente não a seleciona.

## Desacoplamento
- `/acervo` = só fotos p/ vitrine (leve). `/agenda` = o pesado (traduz/preço/fila).
- O disparo é do **n8n + WAHA** (`n8n/nsc-dispara-ofertas.json`, cron 30min, 0 token) — **integrado e rodando desde 16/07**. O `/agenda` para na linha `Fila`: nunca envia, nunca aprova.

## NÃO fazer
- Não escolher produto (URL vem do humano). **Não inventar preço:** o R$ vem do form do Caio, fechado. Sem `price_brl` não há legenda — segura em `Fila` e reporta (nunca escrever "sob consulta" na legenda do grupo).
- Não versionar segredos (`.env`).

## Relacionado
`docs/baserow-disparador-schema.md` · `docs/logistica-mercari.md` · skills `/acervo`, `/dispara-oferta` (existe e roda: n8n + WAHA). Memórias [[motor-ofertas-nsc]], [[nsc-preco-legenda-wpp]], [[agenda-modo-lote-form-caio]].
