---
name: pinterest-mood
description: Baixa imagens de referência visual do Pinterest (pin/board CURADO por Bruno/Caio) pro banco de mood da marca (marca/mood/), gera descrição + tags por imagem e indexa em marca/mood/index.json. É o banco visual que o /post-from-idea consulta pra escolher capa/capítulo por tema — NÃO vira ideia de roteiro. Use quando o Bruno mandar link(s) de pin/board do Pinterest pra abastecer o mood/referência visual de uma loja.
---

# Pinterest Mood — referência visual curada → banco de imagens descrito

Enche a **biblioteca visual** de uma marca (`marca/mood/`) a partir de pins/boards do Pinterest. É o par visual do `/acervo` (que é foto da peça): `acervo/` = **produto**, `mood/` = **capa, capítulo, fundo, mood histórico**. Quem consome é o `/post-from-idea`, que **casa a descrição de cada imagem com o tema do post** e escolhe as que servem.

> **Papel (não confundir):** Pinterest **não vira ideia/roteiro** (isso é `instagram-reference`, a partir de reels/posts). Aqui é só **asset visual descrito**, consumido na hora de montar o carrossel.
> **Curadoria é humana:** Bruno/Caio mandam os links; a skill só processa a lista. Sem link, não roda.
> **Licenciamento:** imagem de terceiros (Pinterest) = risco de copyright em feed comercial. A skill baixa e descreve; **publicar só com o Bruno liberando** (a nota de origem vai no `index.json` e na `legenda.md` do post).

## Realidade da fonte (medido em 23/07, não suposto)
**Pinterest é fonte de MOOD, não de imagem-herói.** Numa rodada real: 44 stills baixados em 5 buscas, **5 passaram** o piso de 1080 de largura e 2 desses já eram repetidos. Não crie expectativa de capa full-bleed 1080×1440 vinda daqui.
- **Busca dirigida não sobe o teto.** Rodamos uma busca genérica e depois 4 dirigidas por capítulo: o resultado veio praticamente igual, porque o Pinterest serve imagem em resolução de web. Vale fazer busca por beat pra ganhar **variedade de assunto**, não resolução.
- **Piso de resolução sozinho NÃO basta.** As duas imagens "de alta" novas daquela rodada eram uma **miniatura de kit escala** e um **wallpaper de celular com recorte em fundo branco**. Passaram no piso e eram lixo. Por isso existe o filtro de conteúdo abaixo.

### Os dois filtros (aplicar sempre)
1. **Resolução.** Faixa de capítulo (`.ph`) precisa de **≥ 1080 × 835**. Capa full-bleed precisaria de 1080×1440 e quase nunca aparece. Descartar abaixo disso, ou marcar `uso: "só referência"`.
2. **Conteúdo.** Descartar o que não é foto de arquivo real: **miniatura/kit escala · wallpaper e fan edit · print de vídeo com legenda queimada · imagem com marca d'água**. Isso só se pega **abrindo a imagem** (passo 3), nunca pelos metadados.

### A armadilha do ano
Buscar por um ano devolve o ano vizinho. "Suzuka 1990" trouxe **maioria de 1989** (as duas batidas Senna×Prost se confundem em toda a internet). **Sempre** preencher `ano` + `confianca_ano`, e quando houver discriminador visual objetivo, registrá-lo na `description` (ex.: em 1990 Senna era McLaren **#27** contra a Ferrari de Prost; em 1989 os dois eram McLaren).

Ao ser invocado, anuncie: **"Rodando o pinterest-mood (banco visual)."**

## Frente (mesma regra das skills de conteúdo)
Salva em `<frente corrente>/marca/mood/`. Se rodar da raiz do vault ou ambíguo, **pergunte a frente** ou aceite por argumento; nunca um default silencioso. Esta é a instância NSC.

> **Raiz da frente (importante — esta skill tem cópia na raiz do vault):** os caminhos `marca/...` são relativos à **raiz da frente resolvida** (ex.: `projetos/Nippon-Speed/`), NÃO ao cwd. O `BASE` do comando abaixo é justamente isso — preencha com o caminho da frente.

## Input
- 1+ URLs de **pin** (`pinterest.com/pin/...`) ou **board** (`pinterest.com/<user>/<board>/`), coladas ou num arquivo.
- (opcional) um `slug` de tema pro lote (ex.: `suzuka`, `ferrari-vermelha`, `era-turbo`) → agrupa em `marca/mood/<slug>/`. Sem slug, deriva do board/pin.

## Fluxo
1. **Confirmar as URLs** (listar). Se nenhuma, parar e pedir.
2. **Baixar** com `gallery-dl` pra `marca/mood/<slug>/` (comando abaixo). Board baixa o board inteiro; pin baixa a imagem.
3. **Descrever cada imagem**: abra cada arquivo com o Read (o Claude vê a imagem) e escreva, na ótica do editorial NSC:
   - `description` — o que é (foto de arquivo/livery/piloto/circuito/pôster), curta e factual.
   - `tags` — era/tema (`90s`, `suzuka`, `ferrari`, `senna`, `turbo`), tipo (`arquivo`, `livery`, `retrato`, `capa`), mood/cor dominante (`vermelho`, `p&b`, `noturno`).
   - `theme` — a que tema de post ela serve melhor (casa com os temas de `marca/conteudo/ideias-feed.md`).
   > A qualidade da descrição é o que faz a ponte escolher certo depois. Descrição preguiçosa = seleção ruim no post.
4. **Indexar** em `marca/mood/index.json` (formato abaixo). Não duplicar (dedup por caminho de arquivo).
5. **Reportar**: nº de imagens baixadas, por tema, e falhas (pin privado, board que exigiu login).

## Comando (por URL)
```bash
BASE="<caminho-do-projeto>"            # ex: projetos/Nippon-Speed
SLUG="suzuka"                          # tema do lote
URL="https://www.pinterest.com/pin/XXXXXXXX/"
DIR="$BASE/marca/mood/$SLUG"
mkdir -p "$DIR"
# gallery-dl baixa direto no diretório (-D). Board = baixa tudo; pin = 1 imagem.
gallery-dl -D "$DIR" "$URL" 2>&1 | tail -20
# se não estiver no PATH: python -m gallery_dl -D "$DIR" "$URL"
```
> **Gotchas do gallery-dl/Pinterest:** board/pin **público** baixa sem login. Board **privado** ou conteúdo logado → exige cookies: `gallery-dl --cookies-from-browser chrome -D "$DIR" "$URL"`. Se vier vazio, é quase sempre isso (ou o board mudou de URL). O `gallery-dl` já está instalado (v1.32.7); não é dependência do Claude, é CLI.

## index.json (o /post-from-idea consome)
`marca/mood/index.json` = array de:
```json
{
  "file": "mood/<slug>/<arquivo>.jpg",
  "source_url": "<url do pin/board>",
  "largura": 1772,
  "altura": 1170,
  "serve_para": "capitulo",
  "ano": "1989",
  "confianca_ano": "alta",
  "description": "<o que é, factual e curto>",
  "tags": ["90s","suzuka","arquivo","vermelho"],
  "theme": "Suzuka 1989",
  "used": false
}
```
`serve_para`: `capa` (≥1080×1440) · `capitulo` (≥1080×835) · `só referência` (abaixo disso).
Item reprovado no filtro de conteúdo entra com `"bloqueado": "<motivo>"` — nunca é apagado calado, pra não rebaixar o mesmo pin de novo na próxima rodada.
> `used` marca o que já foi pra um post (o `/post-from-idea` seta ao usar), pra não repetir imagem entre posts.

## NÃO fazer
- Não gerar ideia/roteiro a partir do Pinterest (é asset visual, não narrativa).
- Não descobrir/escolher board sozinho — input = URL(s) curada(s).
- Não publicar imagem de terceiros sem o Bruno liberar; sempre registrar a origem.

## Relacionado
`/post-from-idea` (consome o `mood/`) · `/acervo` (o par: foto da peça) · `/post-feed` (render). Banco de temas: `marca/conteudo/ideias-feed.md`. Memórias: [[nsc-conteudo-dois-canais]] · [[producao-conteudo-direcao]].
