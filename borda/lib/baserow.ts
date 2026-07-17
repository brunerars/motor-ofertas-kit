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
  /** true = o /agenda já passou. Fila crua (sem foto) é lixo pro Caio, não se mostra. */
  enriquecida: boolean
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
 * Fica DE FORA de propósito:
 *  - `price_jpy`   → referência de custo do Bruno. Não é da conta do Caio, e um
 *                    vazamento aqui é vazamento de margem.
 *  - `wa_message_id` → id da mensagem que o BOT enviou. O nome engana (não é lead)
 *                    e não serve pra nada na UI.
 *  - `title_ja`, `description_pt`, `photos` → ruído. O que vale é a `caption`.
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

/** Só o que a borda tem direito de escrever. Nada de status por id, nada de preço. */
export type Patch = {
  caption?: string
  tags?: string
  status?: Status
  scheduled_at?: string | null
  sold?: boolean
}

export async function atualizarOferta(id: number, patch: Patch): Promise<Oferta> {
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
