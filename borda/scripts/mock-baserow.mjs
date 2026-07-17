#!/usr/bin/env node
/**
 * Baserow FALSO, pra desenvolver a Fila sem encostar na tabela de produção.
 *
 *   node scripts/mock-baserow.mjs 4001
 *   BASEROW_API_URL=http://localhost:4001 npx next dev
 *
 * Por que isto existe: a DISPARADOR de verdade quase nunca tem peça em `Fila`
 * (o Bruno enriquece e o Caio aprova no mesmo dia), e criar linha de teste lá
 * é escrever em produção pra ver um botão. Aqui a fila é fixture: dá pra ver o
 * card cheio, o card sem preço e o rascunho cru, sempre, sem risco.
 *
 * Fala só o que a borda usa: GET lista, GET linha, PATCH linha.
 */

import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? 4001)

const linhas = [
  {
    id: 101,
    title_pt: 'Boné Benetton F1 vermelho vintage',
    mercari_id: 'm71370664392',
    source_url: 'https://jp.mercari.com/item/m71370664392',
    price_jpy: 2500,
    price_brl: '350.00',
    photo_url: 'https://placehold.co/800x800/c82a2a/ffffff/png?text=Benetton',
    caption:
      '*Boné Benetton F1 vermelho vintage*\nTam: único\n\nR$ 350,00\n\n🏁 Quero essa peça: https://wa.me/5511914563609?text=Estou%20interessado!%20(m71370664392)',
    tags: '',
    status: { id: 2573, value: 'Fila', color: 'light-gray' },
    scheduled_at: null,
    posted_at: null,
    sold: false,
  },
  {
    // Sem preço: tem que aparecer com o freio ligado e o Aprovar desabilitado.
    // "Sem preço não há legenda" — nunca sai "sob consulta" no grupo.
    id: 102,
    title_pt: 'Jaqueta Team Lotus anos 90',
    mercari_id: 'm55512340000',
    source_url: 'https://jp.mercari.com/item/m55512340000',
    price_jpy: 8800,
    price_brl: '',
    photo_url: 'https://placehold.co/800x800/111111/ffffff/png?text=Lotus',
    caption: '',
    tags: 'M, leve desgaste na gola',
    status: { id: 2573, value: 'Fila', color: 'light-gray' },
    scheduled_at: null,
    posted_at: null,
    sold: false,
  },
  {
    // ⚠️ O CASO REAL DA ROW 29 (16/07): o campo diz 480,00 e a legenda diz 529,00.
    // A borda mostrava 480 no chip e o cliente receberia 529 — porque quem sai no
    // grupo é a legenda. Fixture permanente: este bug não volta calado.
    id: 104,
    title_pt: 'Boné Suzuka Circuit 30th Anniversary',
    mercari_id: 'm15083004696',
    source_url: 'https://jp.mercari.com/item/m15083004696',
    price_jpy: 3900,
    price_brl: '480.00',
    photo_url: 'https://placehold.co/800x800/8a5a00/ffffff/png?text=Suzuka',
    caption:
      '*Boné Suzuka Circuit 30th Anniversary*\nTam: único\n\nR$ 529,00\n\n🏁 Quero essa peça: https://wa.me/5511914563609?text=Estou%20interessado!%20(m15083004696)',
    tags: '',
    status: { id: 2573, value: 'Fila', color: 'light-gray' },
    scheduled_at: null,
    posted_at: null,
    sold: false,
  },
  {
    // Promoção legítima: DOIS preços na legenda, e o do campo (480) é um deles.
    // NÃO pode dar alarme — alarme falso treina o Caio a ignorar o aviso, que é
    // pior do que não ter aviso nenhum.
    id: 105,
    title_pt: 'Camisa Lotus by Tommy Hilfiger',
    mercari_id: 'm44455566677',
    source_url: 'https://jp.mercari.com/item/m44455566677',
    price_jpy: 5200,
    price_brl: '480.00',
    photo_url: 'https://placehold.co/800x800/1f8a4c/ffffff/png?text=Lotus+promo',
    caption:
      '*Camisa Lotus by Tommy Hilfiger*\nTam: M\n\nDe R$ 650,00 por R$ 480,00\n\n🏁 Quero essa peça: https://wa.me/5511914563609?text=Estou%20interessado!%20(m44455566677)',
    tags: 'M',
    status: { id: 2573, value: 'Fila', color: 'light-gray' },
    scheduled_at: null,
    posted_at: null,
    sold: false,
  },
  {
    // ⚠️ O CASO REAL DE 16/07: peça que JÁ SAIU no grupo (posted_at + wa_message_id).
    // A #28 e a #29 estavam assim, só que com status "Aprovado" — e o cron de disparo
    // ia repostar as duas às 9h, porque o "Ainda dá pra disparar?" do n8n tranca só
    // pelo status. Fixture permanente pro guard `ja_postada` (409) não sumir num
    // refactor: enquanto o cadeado de lá tiver uma chave só, a borda não pode girá-la.
    id: 106,
    title_pt: 'Boné Honda F1 Grand Prix',
    mercari_id: 'm22233344455',
    source_url: 'https://jp.mercari.com/item/m22233344455',
    price_jpy: 4100,
    price_brl: '520.00',
    photo_url: 'https://placehold.co/800x800/111111/ffffff/png?text=Honda',
    caption:
      '*Boné Honda F1 Grand Prix*\nTam: único\n\nR$ 520,00\n\n🏁 Quero essa peça: https://wa.me/5511914563609?text=Estou%20interessado!%20(m22233344455)',
    tags: '',
    status: { id: 2576, value: 'Disparado', color: 'dark-gray' },
    scheduled_at: null,
    posted_at: '2026-07-16T23:00:00.706000Z',
    sold: false,
  },
  {
    // Rascunho cru do form do Caio: sem foto, título = o próprio id.
    // A borda TEM que esconder isto e contar como "1 peça chegando".
    id: 103,
    title_pt: 'm99988877766',
    mercari_id: 'm99988877766',
    source_url: 'https://jp.mercari.com/item/m99988877766',
    price_jpy: null,
    price_brl: '',
    photo_url: '',
    caption: '',
    tags: '',
    status: { id: 2573, value: 'Fila', color: 'light-gray' },
    scheduled_at: null,
    posted_at: null,
    sold: false,
  },
]

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const m = url.pathname.match(/^\/api\/database\/rows\/table\/(\d+)\/(?:(\d+)\/)?$/)
  if (!m) return json(res, 404, { error: 'nao_existe_no_mock' })

  const rowId = m[2] ? Number(m[2]) : null

  if (req.method === 'GET' && rowId === null) {
    return json(res, 200, { count: linhas.length, next: null, previous: null, results: linhas })
  }
  if (req.method === 'GET') {
    const l = linhas.find((x) => x.id === rowId)
    return l ? json(res, 200, l) : json(res, 404, { error: 'row_nao_existe' })
  }
  if (req.method === 'PATCH') {
    let corpo = ''
    req.on('data', (d) => (corpo += d))
    req.on('end', () => {
      const l = linhas.find((x) => x.id === rowId)
      if (!l) return json(res, 404, { error: 'row_nao_existe' })
      const p = JSON.parse(corpo || '{}')
      // single_select: a borda manda TEXTO. Se um dia mandar id, o mock quebra —
      // que é o ponto: o id 2573 só existe na 556 e some na loja 2.
      if (typeof p.status === 'string') l.status = { id: 0, value: p.status, color: 'gray' }
      for (const k of ['caption', 'tags', 'scheduled_at', 'sold']) if (k in p) l[k] = p[k]
      console.log(`PATCH ${rowId}`, JSON.stringify(p))
      return json(res, 200, l)
    })
    return
  }
  return json(res, 405, { error: 'metodo' })
}).listen(PORT, () => console.log(`Baserow falso em http://localhost:${PORT} (${linhas.length} linhas)`))
