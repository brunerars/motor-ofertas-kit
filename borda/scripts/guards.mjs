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

console.log(falhas ? `\n✗ ${falhas} freio(s) falharam` : '\n✓ todos os freios seguraram')
process.exitCode = falhas ? 1 : 0
