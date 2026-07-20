import 'server-only'

/**
 * Firecrawl — o lado MECÂNICO do enriquecimento.
 *
 * 🔴 A borda continua SEM IA. Isto não é uma exceção à regra da v1: é raspagem
 * estruturada por HTTP, o mesmo tipo de chamada que o `/agenda` já faz antes de
 * pensar em qualquer coisa. O que exige julgamento — traduzir, redigir a legenda,
 * decidir o que desqualifica a peça — continua inteiro com o Bruno no `/agenda`.
 *
 * O schema aqui é o MESMO do `/agenda` (`.claude/skills/agenda/SKILL.md:19`) de
 * propósito: um lugar só decide o que se extrai de um anúncio. Se os dois pedirem
 * campos diferentes, a peça fica com um conjunto de dados conforme quem a tocou.
 */

/** O que o Mercari devolve. Nomes iguais aos do schema do `/agenda`. */
export type PecaMercari = {
  title: string
  price_jpy: number | null
  brand: string
  condition: string
  category: string
  sold: boolean
  image_urls: string[]
}

function chave(): string {
  const k = process.env.FIRECRAWL_API_KEY
  if (!k) throw new Error('Falta a env FIRECRAWL_API_KEY. Ver .env.example.')
  return k
}

/** Trocável só pra o mock responder nos testes — mesmo padrão do BASEROW_API_URL. */
function baseUrl(): string {
  return (process.env.FIRECRAWL_API_URL ?? 'https://api.firecrawl.dev').replace(/\/+$/, '')
}

export class FirecrawlError extends Error {
  constructor(public status: number) {
    super(`Firecrawl respondeu ${status}`)
    this.name = 'FirecrawlError'
  }
}

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    price_jpy: { type: 'number' },
    brand: { type: 'string' },
    condition: { type: 'string' },
    category: { type: 'string' },
    sold: { type: 'boolean' },
    image_urls: { type: 'array', items: { type: 'string' } },
  },
} as const

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function buscarPeca(sourceUrl: string): Promise<PecaMercari> {
  const r = await fetch(`${baseUrl()}/v1/scrape`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: sourceUrl,
      formats: ['json'],
      jsonOptions: {
        prompt:
          'Extract the product title, price in JPY, brand, condition, category, whether it is sold, and all photo URLs.',
        schema: SCHEMA,
      },
      // 🔴 NÃO é margem de segurança: o Mercari é JS-pesado e sem esperar a página
      // montar a extração volta VAZIA — não dá erro, dá campo em branco, que é pior.
      // Valor herdado do /acervo, onde já foi calibrado contra o site real.
      waitFor: 3500,
    }),
    cache: 'no-store',
  })

  if (!r.ok) {
    const corpo = await r.text().catch(() => '')
    console.error(`[firecrawl] ${r.status}: ${corpo.slice(0, 300)}`)
    throw new FirecrawlError(r.status)
  }

  const j = (await r.json()) as { data?: { json?: Record<string, unknown> } }
  const d = j.data?.json ?? {}

  const precoJpy = Number(d.price_jpy)
  return {
    title: txt(d.title),
    price_jpy: Number.isFinite(precoJpy) && precoJpy > 0 ? precoJpy : null,
    brand: txt(d.brand),
    condition: txt(d.condition),
    category: txt(d.category),
    // Só `=== true` conta. Um `sold` ausente vira false, e é o certo: na dúvida a
    // peça está viva, e quem confere de verdade se ela saiu é o /confere-ofertas.
    sold: d.sold === true,
    image_urls: Array.isArray(d.image_urls) ? d.image_urls.filter((u): u is string => typeof u === 'string') : [],
  }
}
