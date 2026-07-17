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

console.log('\n=== allowlist ===')
await checa('preço não é campo da borda: cai fora e sobra nada', 101, { price_brl: 1 }, 400, 'nada_pra_mudar')
await checa('sem cookie não escreve', 101, { status: 'Aprovado' }, 401, undefined, false)

console.log('\n=== e o que PODE, passa ===')
await checa('aprova a peça completa', 101, { status: 'Aprovado' }, 200)

console.log(falhas ? `\n✗ ${falhas} freio(s) falharam` : '\n✓ todos os freios seguraram')
process.exitCode = falhas ? 1 : 0
