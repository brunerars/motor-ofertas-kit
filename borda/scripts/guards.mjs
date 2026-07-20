#!/usr/bin/env node
/**
 * Prova os freios de ESCRITA no servidor.
 *
 *   node scripts/guards.mjs http://localhost:3989
 *
 * Botão desabilitado não é segurança: quem decide é a rota, e é ela que este script
 * ataca — direto, sem UI. O `drive.mjs` prova que o Caio consegue; este prova que
 * ninguém consegue o que não pode.
 *
 * Só contra o MOCK (`npm run mock` + `npm run dev:mock`): ele escreve status.
 * ⚠️ REINICIE O MOCK ANTES DE CADA CORRIDA (ele guarda estado; o happy path no fim
 * aprova a #101 e a corrida seguinte encontraria ela já fora da Fila).
 * No Windows: netstat -ano | grep :4001 | grep LISTENING → taskkill //F //PID <pid>
 */
const BASE = process.argv[2] ?? 'http://localhost:3989'

const r = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ senha: process.env.BORDA_PASSPHRASE }),
})
if (!r.ok) {
  console.error(`login falhou (${r.status}) — confere a BORDA_PASSPHRASE do .env.local`)
  process.exit(1)
}
const cookie = (r.headers.get('set-cookie') ?? '').split(';')[0]

let falhas = 0
async function checa(nome, id, body, esperado, erroEsperado, comCookie = true) {
  const res = await fetch(`${BASE}/api/ofertas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(comCookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
  const j = await res.json().catch(() => ({}))
  const ok = res.status === esperado && (!erroEsperado || j.erro === erroEsperado)
  if (!ok) falhas++
  console.log(
    `  ${ok ? '✓' : '✗'} ${nome}`,
    ok ? '' : `→ recebeu ${res.status} ${JSON.stringify(j).slice(0, 90)}`,
  )
}

console.log('\n=== peça JÁ POSTADA é intocável (o achado de 16/07) ===')
console.log('  a #106 tem posted_at. O cron tranca só pelo status — a borda não pode destrancar.')
await checa('não deixa puxar de volta pra Aprovado (senão o cron reposta)', 106, { status: 'Aprovado' }, 409, 'ja_postada')
await checa('não deixa nem Descartar: linha postada é história', 106, { status: 'Descartado' }, 409, 'ja_postada')

console.log('\n=== Disparado e Vendido são do n8n, não da borda ===')
await checa('recusa Disparado', 101, { status: 'Disparado' }, 403, 'status_nao_permitido')
await checa('recusa Vendido', 101, { status: 'Vendido' }, 403, 'status_nao_permitido')

console.log('\n=== sem preço não há legenda ===')
await checa('recusa aprovar a peça sem preço', 102, { status: 'Aprovado' }, 409, 'incompleta')

// 🔴 O bug de 17/07: o `datetime-local` manda hora de PAREDE, sem fuso. `new Date()`
// numa string dessas usa o fuso do RUNTIME (UTC na Vercel), então o 14:30 do Caio
// virava 14:30Z = 11:30 no Brasil e a peça saía 3h CEDO. Silencioso: o Baserow
// aceitava, a tela relia em UTC e tudo parecia coerente consigo mesmo.
// Um assert de fuso não sobrevive em revisão de código — sobrevive aqui.
console.log('\n=== agendar grava a hora que o Caio QUIS (fuso da loja, não do servidor) ===')
async function checaAgenda(nome, parede, esperado) {
  const res = await fetch(`${BASE}/api/ofertas/101`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ scheduled_at: parede }),
  })
  const j = await res.json().catch(() => ({}))
  const gravado = j?.oferta?.scheduledAt ?? null
  const ok = res.status === 200 && gravado === esperado
  if (!ok) falhas++
  console.log(`  ${ok ? '✓' : '✗'} ${nome}`, ok ? '' : `→ gravou ${gravado}, esperava ${esperado}`)
}
await checaAgenda('14:30 em SP vira 17:30Z (não 14:30Z)', '2026-07-17T14:30', '2026-07-17T17:30:00.000Z')
await checaAgenda('23:30 em SP vira 02:30Z do dia SEGUINTE', '2026-07-17T23:30', '2026-07-18T02:30:00.000Z')
await checaAgenda('janeiro segue -03 (Brasil sem horário de verão desde 2019)', '2026-01-15T14:30', '2026-01-15T17:30:00.000Z')
await checa('data impossível não passa', 101, { scheduled_at: '2026-02-31T10:00' }, 400, 'data_invalida')
await checa('lixo não passa', 101, { scheduled_at: 'pizza' }, 400, 'data_invalida')
// Data sem hora não vem do <input type="datetime-local">; se vier, é chamada torta.
// Antes virava meia-noite UTC calado — a mesma família de bug.
await checa('data sem hora não passa', 101, { scheduled_at: '2026-07-17' }, 400, 'data_invalida')

console.log('\n=== allowlist ===')
// price_jpy é a REFERÊNCIA DE CUSTO do Bruno: vazar/escrever isso é mexer na margem.
// Fica fora da allowlist, então some antes de chegar no Baserow e o patch fica vazio.
await checa('price_jpy não é campo da borda: cai fora e sobra nada', 101, { price_jpy: 1 }, 400, 'nada_pra_mudar')
await checa('title_ja também não: o japonês é do /agenda', 101, { title_ja: 'x' }, 400, 'nada_pra_mudar')
await checa('sem cookie não escreve', 101, { status: 'Aprovado' }, 401, undefined, false)

console.log('\n=== título e preço são do CAIO (17/07) ===')
console.log('  ele digita os dois no form. Travados, um erro dele virava peça entalada')
console.log('  que só o Bruno destravava na mão — foi o que aconteceu com a #31 real.')
await checa('aceita corrigir o preço', 103, { price_brl: 480 }, 200)
await checa('aceita corrigir o título', 103, { title_pt: 'Boné Ferrari Schumacher 1997' }, 200)
await checa('preço negativo não passa', 103, { price_brl: -5 }, 400, 'preco_invalido')
await checa('preço zero não é preço de venda', 103, { price_brl: 0 }, 400, 'preco_invalido')
await checa('preço como texto não passa', 103, { price_brl: '480' }, 400, 'preco_invalido')
await checa('título vazio não passa', 103, { title_pt: '   ' }, 400, 'titulo_invalido')
await checa('null limpa o preço (volta a faltar, de propósito)', 103, { price_brl: null }, 200)
// O guard do posted_at vale pra QUALQUER campo, não só status: peça postada é história.
await checa('peça já postada não aceita nem preço novo', 106, { price_brl: 999, status: 'Aprovado' }, 409, 'ja_postada')

console.log('\n=== e o que PODE, passa ===')
// A #102 não tem preço NEM legenda. Mandar os dois + Aprovar na MESMA requisição
// tem que passar: o servidor valida contra o que ESTA requisição vai gravar
// (`patch.X ?? atual.X`), não contra o que está no banco. Olhando só o `atual`,
// ele recusaria por falta de coisas que chegaram junto — e o Caio leria
// "falta o preço" com o preço preenchido na tela.
await checa(
  'preço + legenda + aprovar na mesma ação (valida o que vai gravar, não o que está lá)',
  102,
  { price_brl: 390, caption: '*Jaqueta Team Lotus anos 90*\nTam: M\n\nR$ 390,00', status: 'Aprovado' },
  200,
)
await checa('aprova a peça completa', 101, { status: 'Aprovado' }, 200)

console.log('\n=== 🔴 PII: o nome do lead NÃO pode chegar no browser ===')
console.log('  a doc dizia que o escopo do token segurava (401 na LEADS/557). NÃO É ELE.')
console.log('  a 556 tem um campo LEADS (link_row) que traz o NOME junto:')
console.log('     #27 -> LEADS = [{"id":15,"value":"bruno constantinou"}]   (medido em prod)')
console.log('  quem segura é o paraBorda() montar o objeto campo a campo. Este guard prova.')
{
  const res = await fetch(`${BASE}/api/ofertas`, { headers: { cookie } })
  const cru = await res.text()
  const vazou = ['bruno constantinou', '5511965823369'].filter((s) => cru.includes(s))
  const contou = cru.includes('"qtdLeads":2')

  const ok1 = res.status === 200 && vazou.length === 0
  if (!ok1) falhas++
  console.log(`  ${ok1 ? '✓' : '✗'} nenhum nome/telefone de lead no payload`, ok1 ? '' : `→ VAZOU: ${vazou.join(', ')}`)

  const ok2 = contou
  if (!ok2) falhas++
  console.log(`  ${ok2 ? '✓' : '✗'} mas o CONTADOR chegou (qtdLeads: 2)`, ok2 ? '' : '→ o .length não saiu do servidor')

  // price_jpy e wa_message_id: mesma barreira, já valia antes. Não regredir.
  const outros = ['price_jpy', 'wa_message_id', 'title_ja'].filter((s) => cru.includes(s))
  const ok3 = outros.length === 0
  if (!ok3) falhas++
  console.log(`  ${ok3 ? '✓' : '✗'} sem price_jpy / wa_message_id / title_ja`, ok3 ? '' : `→ VAZOU: ${outros.join(', ')}`)
}

console.log('\n=== GARIMPAR: a 2ª porta de entrada (17/07) ===')
console.log('  a 1ª é o form standalone → webhook do n8n, que FICA no ar como fallback.')
console.log('  as duas gravam o MESMO rascunho cru na 556. Divergir quebra o /agenda.')

async function garimpo(items, comCookie = true) {
  const res = await fetch(`${BASE}/api/garimpo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(comCookie ? { cookie } : {}) },
    body: JSON.stringify({ items }),
  })
  return { status: res.status, j: await res.json().catch(() => ({})) }
}
function ok(nome, cond, detalhe = '') {
  if (!cond) falhas++
  console.log(`  ${cond ? '✓' : '✗'} ${nome}`, cond ? '' : `→ ${detalhe}`)
}
/** A linha como o Baserow guardou — é o que o /agenda vai ler depois. */
async function linhaCriada(id) {
  const res = await fetch(`${BASE}/api/ofertas`, { headers: { cookie } })
  const { ofertas } = await res.json()
  return ofertas.find((o) => o.id === id)
}

{
  const semCookie = await garimpo([{ url: 'https://jp.mercari.com/item/m12345678901' }], false)
  ok('sem cookie não entra (herda o middleware)', semCookie.status === 401, `recebeu ${semCookie.status}`)
}

{
  const { status, j } = await garimpo([
    { url: 'https://jp.mercari.com/item/m12345678901', title: 'Boné Williams Rothmans 1994', price: 'R$ 690,00', note: 'Ajustável' },
  ])
  ok('cria o rascunho a partir de 1 link', status === 200 && j.criadas?.length === 1, `${status} ${JSON.stringify(j).slice(0, 120)}`)

  const o = j.criadas?.[0] ? await linhaCriada(j.criadas[0].id) : null
  ok('nasce em Fila', o?.status === 'Fila', `status ${o?.status}`)
  ok('guarda o mercari_id extraído do link', o?.mercariId === 'm12345678901', `id ${o?.mercariId}`)
  ok('guarda o link inteiro em source_url', o?.sourceUrl === 'https://jp.mercari.com/item/m12345678901')
  ok('guarda o título do Caio', o?.titulo === 'Boné Williams Rothmans 1994', `titulo ${o?.titulo}`)
  ok('a nota vai pro tags (é ela que vira a linha do Tam)', o?.tags === 'Ajustável', `tags ${o?.tags}`)
  ok('lê o preço em R$', o?.precoBrl === 690, `preco ${o?.precoBrl}`)
  // Rascunho cru: quem busca foto é o /agenda, e é o photo_url VAZIO que a skill
  // usa pra pescar o que ainda não passou por ela. Nascer com foto a esconderia.
  ok('nasce SEM foto (é assim que o /agenda a encontra)', o?.fotoUrl === null && o?.enriquecida === false, `foto ${o?.fotoUrl}`)
  ok('nasce sem legenda (quem escreve é o /agenda)', o?.caption === '', `caption ${o?.caption}`)
}

{
  // Título vazio → o id vira o título. Igual ao `title || id` do webhook: sem isso
  // a peça aparece na fila sem nome nenhum e o Caio não sabe qual é.
  const { j } = await garimpo([{ url: 'https://jp.mercari.com/item/m22222222222', title: '   ' }])
  const o = j.criadas?.[0] ? await linhaCriada(j.criadas[0].id) : null
  ok('título vazio cai no mercari_id (fallback do webhook)', o?.titulo === 'm22222222222', `titulo ${o?.titulo}`)
}

{
  // 🔴 O IENE NÃO BLOQUEIA AQUI, ao contrário do editar. Garimpar é despejo em
  // lote: a linha entra sem preço e ele conserta na Fila. Barrar faria a mesma
  // peça entrar pelo standalone e ser recusada pela borda.
  const { j } = await garimpo([{ url: 'https://jp.mercari.com/item/m33333333333', title: 'Boné Honda', price: '¥ 2.500' }])
  ok('preço em iene NÃO derruba o item', j.criadas?.length === 1, JSON.stringify(j).slice(0, 120))
  const o = j.criadas?.[0] ? await linhaCriada(j.criadas[0].id) : null
  ok('mas a linha nasce SEM preço (¥2.500 não vira R$ 2,50)', o?.precoBrl === null, `preco ${o?.precoBrl}`)
}

{
  const { status, j } = await garimpo([{ url: 'https://example.com/item/m99999999999' }])
  ok('link fora do Mercari é rejeitado', j.rejeitados?.length === 1, JSON.stringify(j).slice(0, 120))
  ok('e não cria linha nenhuma', (j.criadas?.length ?? 0) === 0 && status === 200)
}

{
  // Um link torto NÃO pode derrubar a leva: ele cola 8 de uma vez e perder as 7
  // boas por causa de 1 é o pior resultado possível.
  const { j } = await garimpo([
    { url: 'https://jp.mercari.com/item/m44444444444', title: 'boa' },
    { url: 'pizza', title: 'torta' },
  ])
  ok('link torto no meio da leva não derruba as boas', j.criadas?.length === 1 && j.rejeitados?.length === 1, JSON.stringify(j).slice(0, 140))
  ok('e a resposta diz QUAL caiu', j.rejeitados?.[0]?.indice === 1, JSON.stringify(j.rejeitados))
}

{
  const vazio = await garimpo([])
  ok('leva vazia não passa', vazio.status === 400 && vazio.j.erro === 'sem_itens', `${vazio.status} ${JSON.stringify(vazio.j)}`)
  const demais = await garimpo(Array.from({ length: 21 }, () => ({ url: 'https://jp.mercari.com/item/m55555555555' })))
  ok('teto de 20 por envio (igual ao webhook)', demais.status === 400 && demais.j.erro === 'acima_do_teto', `${demais.status} ${JSON.stringify(demais.j)}`)
}

console.log('\n=== ENRIQUECER: a metade MECÂNICA do /agenda (20/07) ===')
console.log('  Firecrawl → foto + japonês. NADA de traduzir, redigir legenda ou julgar')
console.log('  a peça: isso continua com o Bruno. A borda segue sem nenhuma IA.')

async function enriquecer(id, corpo = {}) {
  const res = await fetch(`${BASE}/api/ofertas/${id}/enriquecer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(corpo),
  })
  return { status: res.status, j: await res.json().catch(() => ({})) }
}

{
  const res = await fetch(`${BASE}/api/ofertas/110/enriquecer`, { method: 'POST' })
  ok('sem cookie não enriquece', res.status === 401, `recebeu ${res.status}`)
}

{
  const { status, j } = await enriquecer(110)
  ok('enriquece o rascunho cru', status === 200, `${status} ${JSON.stringify(j).slice(0, 140)}`)

  const o = await linhaCriada(110)
  ok('gravou a foto re-hospedada', Boolean(o?.fotoUrl) && o.enriquecida === true, `foto ${o?.fotoUrl}`)
  // A foto NÃO pode ser a do Mercari: o CDN de lá dá 403 pro WAHA e a peça sairia
  // sem imagem no grupo. Tem que ser a URL do Baserow.
  ok('a foto é re-hospedada, não a URL do Mercari', !/mercdn\.net/.test(o?.fotoUrl ?? ''), o?.fotoUrl)
  ok('gravou o título japonês (o insumo do Caio)', o?.tituloJa?.includes('フェラーリ'), `ja ${o?.tituloJa}`)
  ok('gravou a condição', Boolean(o?.condicao), `cond ${o?.condicao}`)

  // 🔴 A LINHA INTEIRA DO DESENHO: o mecânico entra, o julgamento não.
  ok('NÃO traduziu o título (title_pt intocado)', o?.titulo === 'Boné Ferrari Schumacher 1997', `titulo ${o?.titulo}`)
  ok('NÃO escreveu legenda (é do /agenda)', o?.caption === '', `caption ${o?.caption}`)
  ok('NÃO mexeu no preço em R$ (é do Caio)', o?.precoBrl === 620, `preco ${o?.precoBrl}`)
}

{
  const { status, j } = await enriquecer(110)
  ok('não re-raspa peça já enriquecida (Firecrawl é pago)', status === 409 && j.erro === 'ja_enriquecida', `${status} ${JSON.stringify(j)}`)
  const forcado = await enriquecer(110, { refazer: true })
  ok('mas refazer:true força', forcado.status === 200, `${forcado.status}`)
}

{
  const { status, j } = await enriquecer(106) // tem posted_at
  ok('peça já postada é intocável aqui também', status === 409 && j.erro === 'ja_postada', `${status} ${JSON.stringify(j)}`)
}

{
  const { status, j } = await enriquecer(111) // Firecrawl diz sold:true
  ok('peça vendida no Mercari não é preparada', status === 409 && j.erro === 'vendida_no_mercari', `${status} ${JSON.stringify(j)}`)
  const o = await linhaCriada(111)
  ok('e a linha fica intacta', !o?.fotoUrl && !o?.tituloJa, `foto ${o?.fotoUrl} ja ${o?.tituloJa}`)
  // `sold` é campo do /confere-ofertas (o cron). Se a borda o escrevesse, a fila
  // passaria a mentir pro cron — mesmo motivo de Disparado/Vendido darem 403.
  ok('e a borda NÃO marca sold (é campo do cron)', o?.sold === false, `sold ${o?.sold}`)
}

{
  const { status, j } = await enriquecer(112) // Firecrawl 500
  ok('Firecrawl fora do ar → 502 honesto', status === 502 && j.erro === 'firecrawl_falhou', `${status} ${JSON.stringify(j)}`)
  const o = await linhaCriada(112)
  // 🔴 O pior resultado possível seria `photo_url` gravada apontando pro vazio: a
  // peça pareceria pronta e o disparo falharia no grupo.
  ok('e NÃO deixa a linha meio-gravada', !o?.fotoUrl && !o?.tituloJa, `foto ${o?.fotoUrl}`)
}

{
  // O caso traiçoeiro: 200 com corpo vazio é o que o Mercari devolve quando a
  // página não montou. Sem trava, gravaria uma peça em branco com cara de pronta.
  const { status, j } = await enriquecer(113)
  ok('resposta vazia não vira peça "enriquecida" em branco', status === 502 && j.erro === 'nada_veio', `${status} ${JSON.stringify(j)}`)
  const o = await linhaCriada(113)
  ok('e a linha fica intacta', !o?.fotoUrl && !o?.tituloJa)
}

console.log('\n=== 🔴 price_jpy: a borda agora ESCREVE, e mesmo assim não pode VAZAR ===')
console.log('  é a referência de custo do Bruno. Antes a borda só lia; escrever torna')
console.log('  o guard mais importante, não menos.')
{
  const res = await fetch(`${BASE}/api/ofertas`, { headers: { cookie } })
  const cru = await res.text()
  ok('price_jpy não aparece no payload, mesmo gravado', !cru.includes('price_jpy') && !cru.includes('4200'), 'VAZOU o preço em iene')
  ok('mas o título japonês chega (o Caio precisa dele)', cru.includes('tituloJa'), 'o título japonês não saiu do servidor')
}

console.log('\n=== a marcação de autoria (o freio de 20/07) ===')
console.log('  o Caio consegue preparar a peça inteira sozinho. A conferida do Bruno')
console.log('  sai do caminho — o freio é ela não sair CALADA.')
{
  await checa('escrever legenda na borda marca o autor', 110, { caption: '*Boné Ferrari*\nTam: Ajustável\n\nR$ 620,00' }, 200)
  const o = await linhaCriada(110)
  ok('a peça diz que a legenda é do Caio', o?.captionPor === 'caio', `captionPor ${o?.captionPor}`)

  await checa('apagar a legenda tira o autor', 110, { caption: '' }, 200)
  const limpa = await linhaCriada(110)
  ok('legenda vazia não tem autor (volta a ler como /agenda)', limpa?.captionPor === '', `captionPor ${limpa?.captionPor}`)

  // O cliente não escolhe o autor: a rota DERIVA. Senão a marcação não vale nada.
  await checa('o cliente não consegue se dizer /agenda', 110, { caption: 'x', caption_by: 'agenda' }, 200)
  const forjada = await linhaCriada(110)
  ok('mandar caption_by no corpo não engana a rota', forjada?.captionPor === 'caio', `captionPor ${forjada?.captionPor}`)
}

console.log('\n=== 🔴 PARIDADE com o webhook: as duas portas gravam a MESMA linha ===')
console.log('  este é O guard que importa. O /agenda pesca por `Fila` + caption vazia e')
console.log('  não sabe por onde a peça entrou — se os campos divergirem, ele trata')
console.log('  diferente a mesma peça conforme a porta. Comparação ESTÁTICA: o tipo')
console.log('  NovaOferta (lib/baserow.ts) × o `const row` do Code node do n8n.')
{
  const { readFileSync } = await import('node:fs')
  const raiz = new URL('../../', import.meta.url)

  const wf = JSON.parse(readFileSync(new URL('n8n/nsc-garimpo-webhook.json', raiz), 'utf8'))
  const code = wf.nodes.find((n) => n.name === 'Validar + montar linhas')?.parameters?.jsCode ?? ''
  // os campos do literal `const row = {...}` + os que o Code adiciona depois (row.x = )
  const bloco = code.match(/const row = \{([\s\S]*?)\n {2}\};/)?.[1] ?? ''
  const doWebhook = new Set([
    ...[...bloco.matchAll(/^\s{4}([a-z_]+):/gm)].map((m) => m[1]),
    ...[...code.matchAll(/row\.([a-z_]+) = /g)].map((m) => m[1]),
  ])

  const ts = readFileSync(new URL('borda/lib/baserow.ts', raiz), 'utf8')
  const tipo = ts.match(/export type NovaOferta = \{([\s\S]*?)\n\}/)?.[1] ?? ''
  const daBorda = new Set([...tipo.matchAll(/^ {2}([a-z_]+)\??:/gm)].map((m) => m[1]))

  const soNoWebhook = [...doWebhook].filter((c) => !daBorda.has(c))
  const soNaBorda = [...daBorda].filter((c) => !doWebhook.has(c))

  ok(`achou os campos dos dois lados (webhook ${doWebhook.size} × borda ${daBorda.size})`, doWebhook.size >= 5 && daBorda.size >= 5,
    `webhook=[${[...doWebhook]}] borda=[${[...daBorda]}]`)
  ok('a borda não deixou campo do webhook pra trás', soNoWebhook.length === 0, `faltam na borda: ${soNoWebhook.join(', ')}`)
  ok('a borda não inventou campo que o webhook não grava', soNaBorda.length === 0, `só na borda: ${soNaBorda.join(', ')}`)
}

console.log(falhas ? `\n✗ ${falhas} freio(s) falharam` : '\n✓ todos os freios seguraram')
process.exitCode = falhas ? 1 : 0
