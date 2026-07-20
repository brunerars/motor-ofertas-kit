import 'server-only'
import { subirArquivo } from './baserow'

/**
 * A foto do anúncio → uma URL pública que o WhatsApp consegue buscar.
 *
 * Por que não usar a URL do Mercari direto no `photo_url`: quem busca a foto na
 * hora de postar é o WAHA, do servidor. O CDN do Mercari responde **403** pra
 * quem não parece browser — a peça sairia no grupo sem imagem, ou não sairia.
 * Por isso a foto é baixada aqui e re-hospedada no Baserow, que serve
 * `/media/user_files/…` sem auth. Mesma mecânica do `/agenda`.
 */

/**
 * 🔴 SEM ESTES DOIS HEADERS O DOWNLOAD DÁ 403 — não é superstição, é o CDN do
 * Mercari barrando cliente que não parece navegador. Copiados do `/acervo`
 * (`.claude/skills/acervo/SKILL.md:44-51`), onde a lição foi paga.
 */
const HEADERS_CDN = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  Referer: 'https://jp.mercari.com/',
}

export class FotoError extends Error {
  constructor(public motivo: 'download' | 'upload') {
    super(`Falhou no ${motivo} da foto`)
    this.name = 'FotoError'
  }
}

/**
 * Baixa a foto e sobe pro Baserow. Devolve a URL pública.
 *
 * Quem chama NÃO deve gravar `photo_url` se isto explodir: `photo_url` apontando
 * pro vazio é pior que `photo_url` ausente — a peça pareceria pronta e o disparo
 * falharia no grupo. O ausente pelo menos se vê na fila.
 */
export async function reHospedarFoto(urlOriginal: string, mercariId: string): Promise<string> {
  let bytes: ArrayBuffer
  let tipo: string
  try {
    const r = await fetch(urlOriginal, { headers: HEADERS_CDN, cache: 'no-store' })
    if (!r.ok) {
      console.error(`[foto] download ${urlOriginal} → ${r.status}`)
      throw new FotoError('download')
    }
    bytes = await r.arrayBuffer()
    tipo = r.headers.get('content-type') ?? 'image/jpeg'
  } catch (e) {
    if (e instanceof FotoError) throw e
    console.error('[foto] download', e)
    throw new FotoError('download')
  }

  if (bytes.byteLength === 0) throw new FotoError('download')

  const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg'
  const arquivo = new File([bytes], `${mercariId}.${ext}`, { type: tipo })

  try {
    return await subirArquivo(arquivo)
  } catch (e) {
    console.error('[foto] upload', e)
    throw new FotoError('upload')
  }
}
