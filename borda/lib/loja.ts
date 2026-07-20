import 'server-only'

/**
 * A COSTURA da generalização.
 *
 * v1  → resolve a loja por env. Uma loja, um deploy, ship hoje.
 * v2+ → resolve pela tabela LOJAS do Baserow (ver docs/arquitetura-hub.md),
 *       buscando por LOJA_SLUG e cacheando. NENHUM call-site muda.
 *
 * É async DE PROPÓSITO, mesmo lendo env: na v2 isso vira uma chamada de rede.
 * Se nascesse síncrona, todo call-site teria que mudar depois — e aí não seria
 * costura, seria remendo.
 *
 * Regra herdada do arquitetura-hub.md: "nenhum node volta a ter id de loja literal".
 * Ninguém lê process.env.BASEROW_TABLE_ID fora daqui.
 */

export type Loja = {
  /** chave de tudo. Vira nome de sessão WAHA, pasta e prefixo de workflow. */
  slug: string
  nome: string
  /** tabela DISPARADOR (a fila de ofertas) */
  tableId: number
  /** moeda de origem do garimpo. A NSC é Japão/Mercari; a próxima loja pode não ser. */
  moedaOrigem: string
  /** onde o Caio manda os links. Hoje é uma página à parte, no ar desde 15/07. */
  garimpoUrl: string | null
  /**
   * O WhatsApp da loja, só dígitos (`5511914563609`). É o número do `wa.me` no CTA
   * da legenda — o "🏁 Quero essa peça". PÚBLICO (está na LP e no grupo), não é
   * segredo. Muda por loja: mandar o cliente pro WhatsApp errado é o pior defeito
   * possível da legenda, então nunca cravar isso no componente.
   */
  waNumero: string
}

function exigir(nome: string): string {
  const v = process.env[nome]
  if (!v) throw new Error(`Falta a env ${nome}. Ver .env.example.`)
  return v
}

let cache: Loja | null = null

export async function getLoja(): Promise<Loja> {
  if (cache) return cache

  // ── v1: env ────────────────────────────────────────────────────────────────
  const tableId = Number(exigir('BASEROW_TABLE_ID'))
  if (!Number.isInteger(tableId)) {
    throw new Error(`BASEROW_TABLE_ID inválido: ${process.env.BASEROW_TABLE_ID}`)
  }

  cache = {
    slug: process.env.LOJA_SLUG ?? 'nsc',
    nome: process.env.LOJA_NOME ?? 'Nippon Speed Co.',
    tableId,
    moedaOrigem: process.env.LOJA_MOEDA_ORIGEM ?? 'JPY',
    garimpoUrl: process.env.GARIMPO_URL ?? null,
    // Default = o número da NSC, no mesmo padrão de LOJA_SLUG/NOME acima (v1 tem
    // literal por loja; v2 lê da tabela LOJAS). `replace` limpa espaço/traço se
    // alguém puser "+55 11 ..." no env — o wa.me só aceita dígitos.
    waNumero: (process.env.LOJA_WA_NUMERO ?? '5511914563609').replace(/\D/g, ''),
  }

  // ── v2: trocar o bloco acima por um GET na LOJAS ───────────────────────────
  // const slug = exigir('LOJA_SLUG')
  // const row = await baserowGet(LOJAS_TABLE_ID, { filter__slug__equal: slug })
  // cache = { slug, nome: row.nome, tableId: row.table_id, ... }

  return cache
}
