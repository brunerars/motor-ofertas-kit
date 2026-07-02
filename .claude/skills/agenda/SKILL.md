---
name: agenda
description: Processa uma URL CURADA do Mercari numa oferta pronta pra disparo — Firecrawl (dados+fotos) → traduz PT → grava na fila (Baserow DISPARADOR, status Fila) → preview no WhatsApp p/ aprovação → agenda. Curadoria é humana (URL vem do Bruno/Caio; a IA nunca escolhe produto). Use quando o Bruno mandar URL(s) do Mercari pra entrar na fila de ofertas.
---

# Agenda — URL Mercari → fila (Baserow) → preview → agendamento

Coração do Bloco Ofertas: transforma um item curado num registro pronto pra disparar no grupo.

> **Regra dura — curadoria humana.** A IA NUNCA descobre/escolhe produto. Processa só a URL dada.

## Input
- URL(s) do Mercari (curadas por Bruno/Caio).
- Config Baserow no `.env` (`BASEROW_API_URL`, `BASEROW_TOKEN`, `BASEROW_TABLE_ID=556`).
- (Z-API — pendente) número 1:1 do Bruno p/ preview; grupo p/ disparo (via `/dispara-oferta`).

## Fluxo
1. **Firecrawl** o item → `title`, `price_jpy`, `description`, `brand`, `condition`, `category`, `sold`, `image_urls`. API: `formats:["json"]` + `jsonOptions{prompt,schema}` (ver CLAUDE.md do projeto).
2. **Fotos → acervo** (reusa `/acervo`: download com **User-Agent de browser + Referer**, senão 403; salva `marca/acervo/<id>/`).
3. **Traduzir** `title` + `description` JA→PT (Claude inline). Manter tom de [[logistica-mercari]]/roteiro.
4. **Preço:** `price_brl` vazio = "sob consulta no grupo" (padrão). Se houver regra (câmbio+margem+frete), calcular.
5. **Montar a legenda final** (`caption`) — o texto EXATO que vai pro grupo (título · marca · era · estado · "valor e frete sob consulta no grupo" · link `wa.me` de interesse citando a peça). É isso que o Bruno aprova/edita.
6. **Subir a foto + gravar na fila.** Sobe `acervo/<id>/1.jpg` pro Baserow (`POST /api/user-files/upload-file/`, Database Token, multipart `-F file=@…`) → guarda a **URL pública** (`/media/user_files/…`, abre sem auth) em **`photo_url`**. Insere a linha `status=Fila` com `caption` + `photos` + `photo_url`. **Por quê:** o disparo roda no **n8n hospedado**, que NÃO acessa arquivo local → precisa da URL pública (o Z-API busca por ela; o CDN do Mercari dá 403, o Baserow não). Schema em `baserow-disparador-schema.md`.
7. **Aprovação = humana, no Baserow (barato, sem webhook).** Bruno revisa a linha (`caption` + foto), flipa `Fila`→**`Aprovado`** (ou edita a legenda / `Descartado`). A curadoria do ITEM já veio na URL; aqui ele só confere **tradução + foto**. *(Opcional: mandar o preview renderizado no 1:1 via Z-API — mas o ato de aprovar é o flip no Baserow.)*
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
# status é single_select → id da opção. Fila=2573 (conferir em baserow-disparador-schema.md se mudar).
```

## Desacoplamento
- `/acervo` = só fotos p/ vitrine (leve). `/agenda` = o pesado (traduz/preço/fila).
- Preview (passo 6) e disparo dependem da **Z-API** — Bloco Ofertas ainda a integrar.

## NÃO fazer
- Não escolher produto (URL vem do humano). Não fechar preço sem regra (default sob consulta).
- Não versionar segredos (`.env`).

## Relacionado
`baserow-disparador-schema.md` · `logistica-mercari.md` · skills `/acervo`, `/dispara-oferta` (a criar). Memória [[motor-ofertas-nsc]].
