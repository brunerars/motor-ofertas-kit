#!/usr/bin/env node
/**
 * Firecrawl FALSO, pra exercitar o enriquecimento sem gastar crédito nem depender
 * do Mercari estar de pé.
 *
 *   node scripts/mock-firecrawl.mjs 4002
 *   FIRECRAWL_API_URL=http://localhost:4002 ... next dev
 *
 * Responde por `mercari_id` embutido na URL, o que deixa cada caso de teste
 * escolher o cenário pelo próprio link:
 *   m1111…  peça normal, com fotos
 *   m2222…  peça JÁ VENDIDA no Mercari (alguém comprou antes)
 *   m3333…  o Firecrawl explode (500)
 *   m4444…  responde 200 mas vem VAZIO — o caso traiçoeiro: sem o `waitFor` o
 *           Mercari devolve exatamente isso, e é erro que não parece erro.
 * qualquer outro → peça normal.
 *
 * Serve `/foto.jpg` também: o passo de re-hospedar precisa de uma imagem de
 * verdade pra baixar, e ir no CDN real do Mercari num teste seria absurdo.
 */

import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? 4002)

// PNG 1×1 válido. O `reHospedarFoto` só precisa de bytes que existam.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const normal = (porta) => ({
  title: 'フェラーリ キャップ 1997 シューマッハ',
  price_jpy: 4200,
  brand: 'Ferrari',
  condition: '目立った傷や汚れなし',
  category: '帽子',
  sold: false,
  image_urls: [`http://localhost:${porta}/foto.jpg`],
})

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

createServer((req, res) => {
  if (req.url.startsWith('/foto.jpg')) {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': PIXEL.length })
    return res.end(PIXEL)
  }

  if (req.method !== 'POST' || !req.url.startsWith('/v1/scrape')) {
    return json(res, 404, { error: 'nao_existe_no_mock' })
  }

  let corpo = ''
  req.on('data', (d) => (corpo += d))
  req.on('end', () => {
    const { url = '' } = JSON.parse(corpo || '{}')
    console.log(`scrape ${url}`)

    if (url.includes('m2222')) {
      return json(res, 200, { data: { json: { ...normal(PORT), sold: true } } })
    }
    if (url.includes('m3333')) {
      return json(res, 500, { error: 'firecrawl caiu' })
    }
    if (url.includes('m4444')) {
      // 200 com json vazio — o que o Mercari devolve quando a página não montou.
      return json(res, 200, { data: { json: {} } })
    }
    return json(res, 200, { data: { json: normal(PORT) } })
  })
}).listen(PORT, () => console.log(`Firecrawl falso em http://localhost:${PORT}`))
