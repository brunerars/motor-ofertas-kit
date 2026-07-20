import 'server-only'
import { getLoja } from './loja'

/**
 * Cliente do Baserow — SERVER-ONLY.
 *
 * O `import 'server-only'` não é decoração: se um client component importar este
 * arquivo, o BUILD QUEBRA. É essa a linha que impede o token de ir pro browser.
 * O token é escopo de tabela, mas ainda assim ele nunca sai daqui.
 *
 * Contrato dos campos: docs/baserow-disparador-schema.md
 */

export const STATUS = ['Fila', 'Aprovado', 'Agendado', 'Disparado', 'Vendido', 'Descartado'] as const
export type Status = (typeof STATUS)[number]

/** O que o browser recebe. Note o que NÃO está aqui — ver `paraBorda()`. */
export type Oferta = {
  id: number
  titulo: string
  mercariId: string
  sourceUrl: string
  precoBrl: number | null
  fotoUrl: string | null
  caption: string
  /** o campo "Tam / observação" do form do Caio. Vazio → a legenda escreve "único". */
  tags: string
  status: Status
  scheduledAt: string | null
  postedAt: string | null
  sold: boolean
  /**
   * true = o /agenda já passou (tem foto).
   * A fila MOSTRA as cruas também: o Caio digitou link/título/valor/Tam no form e
   * precisa poder consertar o que errou. Escondê-las deixava a #31 real ("Boné
   * Ferrari 1997", sem preço) entalada — invisível pra ele, imprópria pra aprovar
   * e ignorada pelo /agenda (a skill segura em Fila quando falta preço).
   * Serve pra decidir o que o card mostra, não mais pra sumir com a peça.
   */
  enriquecida: boolean
  /**
   * Quantas pessoas mandaram "Estou interessado!" nesta peça.
   *
   * 🔴 SÓ O NÚMERO. Ver `paraBorda()`: a 556 traz o NOME junto e ele para lá.
   */
  qtdLeads: number
  /**
   * O título ORIGINAL do anúncio, em japonês (20/07).
   *
   * Passou a sair pro browser porque é o insumo do Caio: com ele na tela, o Caio
   * traduz e escreve a legenda sozinho quando não quer esperar o `/agenda`. Antes
   * estava cortado como "ruído" — era, enquanto ele não podia fazer nada com isso.
   */
  tituloJa: string
  /** Frase de condição do Mercari, crua. Contexto pro Caio; não vira legenda. */
  condicao: string
  marca: string
  /**
   * Quem escreveu a legenda. `''` = o `/agenda` (o Bruno).
   *
   * O freio que o `docs/borda-hub-caio.md:38-40` exigiu: enriquecer na borda tira
   * o Bruno do caminho, e sem isto ele sairia **calado**. Não bloqueia nada — só
   * torna visível qual peça foi pro grupo sem passar por ele.
   */
  captionPor: string
}

type Row = Record<string, unknown>

function baseUrl(): string {
  const u = process.env.BASEROW_API_URL
  if (!u) throw new Error('Falta a env BASEROW_API_URL. Ver .env.example.')
  return u.replace(/\/+$/, '')
}

function token(): string {
  // Token PRÓPRIO da borda, escopado só na DISPARADOR. NÃO é o BASEROW_TOKEN dos
  // workflows (esse é escopo "all tables" e alcança a LEADS, que tem telefone de
  // cliente). Um furo aqui não pode chegar em PII. Ver docs/arquitetura-hub.md.
  const t = process.env.BASEROW_TOKEN_BORDA
  if (!t) throw new Error('Falta a env BASEROW_TOKEN_BORDA (token escopado só na DISPARADOR).')
  return t
}

async function req(path: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!r.ok) {
    const corpo = await r.text().catch(() => '')
    // Nunca deixar o corpo do Baserow vazar pro cliente: pode ecoar payload.
    // Loga inteiro no servidor, devolve genérico.
    console.error(`[baserow] ${init?.method ?? 'GET'} ${path} → ${r.status}: ${corpo.slice(0, 500)}`)
    throw new BaserowError(r.status)
  }
  return r.json()
}

/**
 * Sobe um arquivo e devolve a URL pública (`/media/user_files/…`, abre sem auth).
 *
 * ✅ **Medido em 20/07: o token ESCOPADO da borda consegue** (HTTP 200), mesmo o
 * endpoint sendo de database e não de tabela. Isso importa porque a alternativa
 * seria trazer o `BASEROW_TOKEN` *all tables* pra cá — e ele alcança a `LEADS`,
 * que é PII. Se um dia isto voltar a dar 401, a saída é um token só-de-upload,
 * NÃO o all-tables.
 *
 * Não usa o `req()`: ali o Content-Type é `application/json` cravado, e multipart
 * precisa que o fetch monte o boundary sozinho.
 */
export async function subirArquivo(arquivo: File): Promise<string> {
  const form = new FormData()
  form.append('file', arquivo)

  const r = await fetch(`${baseUrl()}/api/user-files/upload-file/`, {
    method: 'POST',
    headers: { Authorization: `Token ${token()}` },
    body: form,
    cache: 'no-store',
  })

  if (!r.ok) {
    const corpo = await r.text().catch(() => '')
    console.error(`[baserow] upload → ${r.status}: ${corpo.slice(0, 300)}`)
    throw new BaserowError(r.status)
  }

  const j = (await r.json()) as { url?: unknown }
  const url = txt(j.url)
  if (!url) throw new BaserowError(502)
  return url
}

export class BaserowError extends Error {
  constructor(public status: number) {
    super(`Baserow respondeu ${status}`)
    this.name = 'BaserowError'
  }
}

/** Baserow devolve number como string ("350.00"). */
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function txt(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

/** single_select LÊ como objeto {id, value, color} e ESCREVE como string. */
function selValue(v: unknown): string {
  if (v && typeof v === 'object' && 'value' in v) return txt((v as { value: unknown }).value)
  return txt(v)
}

/**
 * Row do Baserow → o que a borda mostra.
 *
 * 🔴 ESTA FUNÇÃO É A BARREIRA DE PII, não o escopo do token.
 *
 * A doc dizia que o token segurava (ele toma 401 na LEADS/557). Só que a 556 tem
 * um campo `LEADS` (link_row → 557), criado sozinho junto com a relação, e campo
 * link do Baserow traz o CAMPO PRIMÁRIO da linha ligada — que na LEADS é o nome
 * ou o telefone do cliente. Medido com o token da borda:
 *
 *     #27 -> LEADS = [{"id": 15, "value": "bruno constantinou"}]
 *
 * Ou seja: o nome CHEGA aqui. O que impede ele de ir pro browser é esta função
 * montar o objeto campo a campo — o que ela não conhece, não passa. Manter assim:
 * nunca fazer spread de `row`.
 *
 * Fica DE FORA de propósito:
 *  - `LEADS`       → é PII. Só o `.length` sai daqui, nunca o `value`.
 *  - `price_jpy`   → referência de custo do Bruno. Não é da conta do Caio, e um
 *                    vazamento aqui é vazamento de margem.
 *  - `wa_message_id` → id da mensagem que o BOT enviou. O nome engana (não é lead)
 *                    e não serve pra nada na UI.
 *  - `description_pt`, `photos` → ruído. O que vale é a `caption`.
 *
 * ⚠️ O `title_ja` SAIU desta lista em 20/07 e agora passa (ver o tipo `Oferta`).
 * A razão da exclusão era "ruído", e ruído ele era enquanto o Caio não tinha o
 * que fazer com ele. Com o botão de enriquecer, o japonês é o insumo que ele
 * traduz. O `price_jpy` continua fora e a razão dele é OUTRA e não mudou: é
 * margem do Bruno, e a borda passou a ESCREVÊ-LO — o que torna o guard de PII
 * mais importante, não menos.
 */
function paraBorda(row: Row): Oferta {
  const fotoUrl = txt(row.photo_url) || null
  return {
    id: Number(row.id),
    titulo: txt(row.title_pt),
    mercariId: txt(row.mercari_id),
    sourceUrl: txt(row.source_url),
    precoBrl: num(row.price_brl),
    fotoUrl,
    caption: txt(row.caption),
    tags: txt(row.tags),
    status: (selValue(row.status) || 'Fila') as Status,
    scheduledAt: txt(row.scheduled_at) || null,
    postedAt: txt(row.posted_at) || null,
    sold: row.sold === true,
    enriquecida: Boolean(fotoUrl),
    // 🔴 `.length` e MAIS NADA. Cada item é {id, value} e `value` é o nome da pessoa.
    qtdLeads: Array.isArray(row.LEADS) ? row.LEADS.length : 0,
    tituloJa: txt(row.title_ja),
    condicao: txt(row.condition),
    marca: txt(row.brand),
    // Vazio = `/agenda`. Linhas antigas (e toda peça que o Bruno preparar) leem
    // certo sem ninguém migrar nada, e a skill não precisou mudar por causa disto.
    captionPor: txt(row.caption_by),
  }
}

export async function listarOfertas(): Promise<Oferta[]> {
  const { tableId } = await getLoja()
  const j = (await req(
    `/api/database/rows/table/${tableId}/?user_field_names=true&size=200`,
  )) as { results?: Row[] }
  return (j.results ?? []).map(paraBorda)
}

export async function buscarOferta(id: number): Promise<Oferta> {
  const { tableId } = await getLoja()
  const j = (await req(`/api/database/rows/table/${tableId}/${id}/?user_field_names=true`)) as Row
  return paraBorda(j)
}

/**
 * Só o que a borda tem direito de escrever. Nada de status por id.
 *
 * `title_pt` e `price_brl` entraram em 17/07, e a razão é que eles nunca deveriam
 * ter ficado fora: são os campos que o **próprio Caio digitou no form**. Sem eles,
 * um erro dele (esquecer o preço, ou mandar em iene — que o webhook rejeita de
 * propósito) virava peça entalada que só o Bruno destravava, na mão, no Baserow.
 * Não havia razão de segurança pra trava; era subproduto do desenho "a borda só
 * confere". O que vaza margem é o `price_jpy`, e esse continua fora.
 *
 * ⚠️ Isto é a 1ª de DUAS barreiras: a rota (`app/api/ofertas/[id]/route.ts`) só
 * copia campo a campo o que reconhece. Abrir aqui não abre lá.
 */
export type Patch = {
  title_pt?: string
  price_brl?: number | null
  caption?: string
  tags?: string
  status?: Status
  scheduled_at?: string | null
  sold?: boolean
  /**
   * Quem escreveu a legenda. Escrito junto com `caption` pela rota de PATCH.
   * Não é campo que o cliente manda: a rota o deriva (quem salvou legenda na
   * borda foi o Caio, por definição — o `/agenda` não passa por aqui).
   */
  caption_by?: string
}

/**
 * O que SÓ a rota de enriquecer escreve — o resultado mecânico do Firecrawl.
 *
 * Separado do `Patch` de propósito: a rota genérica (`app/api/ofertas/[id]`) copia
 * campo a campo o que reconhece, e ela **não reconhece nada daqui**. Ou seja, nem
 * um cliente malicioso nem um refactor distraído consegue escrever `photo_url`
 * pelo caminho normal — e `photo_url` é a URL que o WAHA busca pra postar no
 * grupo. Duas barreiras, como já valia pro `price_jpy`.
 */
export type PatchEnriquecido = {
  photo_url?: string
  title_ja?: string
  brand?: string
  category?: string
  condition?: string
  price_jpy?: number | null
}

/**
 * Uma peça NOVA, do jeito que ela nasce: rascunho cru.
 *
 * 🔴 Estes são exatamente os campos que o `Validar + montar linhas` do
 * `n8n/nsc-garimpo-webhook.json` monta — nem um a mais. As duas portas de entrada
 * (esta e o form standalone) gravam a MESMA linha, senão o /agenda em modo lote
 * trata a peça diferente conforme por onde ela entrou. Mudou lá, muda aqui.
 *
 * Não tem `photo_url` nem `caption` de propósito: a peça nasce crua. Quem escreve
 * a legenda é o /agenda, e é a `caption` VAZIA que a skill usa pra pescar o que
 * ainda não passou por ela (o filtro era `photo_url` vazio e mudou em 20/07,
 * quando a borda passou a preencher a foto sozinha — ver agenda/SKILL.md).
 */
export type NovaOferta = {
  mercari_id: string
  source_url: string
  /** o que o Caio digitou; o `mercari_id` é o fallback quando ele deixa vazio */
  title_pt: string
  /** o campo "Tam / observação" do form. Vazio → a legenda escreve "único". */
  tags: string
  status: Status
  /** omitido quando o Caio não pôs preço (ou pôs em iene). NÃO bloqueia a entrada. */
  price_brl?: number
}

export async function criarOferta(nova: NovaOferta): Promise<Oferta> {
  const { tableId } = await getLoja()

  // `status` por TEXTO, mesma regra do PATCH: id de single_select não se repete
  // entre tabelas e quebraria calado na loja 2.
  const j = (await req(`/api/database/rows/table/${tableId}/?user_field_names=true`, {
    method: 'POST',
    body: JSON.stringify(nova),
  })) as Row

  return paraBorda(j)
}

export async function atualizarOferta(id: number, patch: Patch | PatchEnriquecido): Promise<Oferta> {
  const { tableId } = await getLoja()

  // `status` vai por TEXTO ("Aprovado"), nunca por id de opção.
  // Ids de single_select NÃO se repetem entre tabelas: o /agenda manda `2573`
  // literal e isso funciona na NSC e quebra calado na loja 2. Não herdar.
  const j = (await req(`/api/database/rows/table/${tableId}/${id}/?user_field_names=true`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })) as Row

  return paraBorda(j)
}
