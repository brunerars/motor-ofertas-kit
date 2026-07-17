#!/usr/bin/env node
/**
 * Smoke do token da borda. Roda ANTES de qualquer UI.
 *
 *   npm run smoke        (usa ../.env via --env-file)
 *
 * Prova duas coisas, e a segunda é a que importa:
 *   1. o token LÊ a DISPARADOR (556)
 *   2. o token NÃO LÊ a LEADS (557)  ← o escopo. Se passar, o token está errado.
 *
 * A LEADS guarda telefone e nome de cliente (PII). A borda é a primeira coisa
 * deste projeto exposta na internet pública. Um furo nela não pode chegar lá.
 */

const API = (process.env.BASEROW_API_URL || '').replace(/\/+$/, '')
const TOKEN = process.env.BASEROW_TOKEN_BORDA
const DISPARADOR = process.env.BASEROW_TABLE_ID
const LEADS = process.env.BASEROW_LEADS_TABLE_ID

const falta = []
if (!API) falta.push('BASEROW_API_URL')
if (!TOKEN) falta.push('BASEROW_TOKEN_BORDA')
if (!DISPARADOR) falta.push('BASEROW_TABLE_ID')
if (falta.length) {
  console.error(`✗ Falta no .env: ${falta.join(', ')}`)
  console.error('  O BASEROW_TOKEN_BORDA é um token NOVO, escopado só na DISPARADOR.')
  console.error('  Baserow → base → ⋯ → API tokens → criar → marcar só a tabela DISPARADOR.')
  process.exit(1)
}

const get = (tabela) =>
  fetch(`${API}/api/database/rows/table/${tabela}/?user_field_names=true&size=1`, {
    headers: { Authorization: `Token ${TOKEN}` },
  })

let ok = true

// 1) Lê a DISPARADOR
const r1 = await get(DISPARADOR)
if (r1.ok) {
  const j = await r1.json()
  const linha = j.results?.[0]
  console.log(`✓ LÊ a DISPARADOR (${DISPARADOR}) — ${j.count} linhas`)
  if (linha) {
    console.log(`  amostra: #${linha.id} "${linha.title_pt}" · ${linha.status?.value ?? '?'}`)
    const semFoto = !linha.photo_url
    if (semFoto) console.log('  ⚠ a 1ª linha não tem photo_url (rascunho cru; a borda esconde)')
  }
} else {
  ok = false
  console.error(`✗ NÃO lê a DISPARADOR (${DISPARADOR}) → ${r1.status}`)
  console.error('  O token precisa de permissão de leitura NESTA tabela.')
}

// 2) NÃO pode ler a LEADS — este é o teste que vale
if (!LEADS) {
  console.log('· BASEROW_LEADS_TABLE_ID vazio no .env — pulei o teste de escopo.')
  console.log('  Preencha pra provar que o token NÃO alcança a LEADS.')
} else {
  const r2 = await get(LEADS)
  if (r2.ok) {
    ok = false
    console.error(`✗ ESCOPO FURADO: o token LÊ a LEADS (${LEADS}). Ela tem telefone de cliente.`)
    console.error('  Isso é um token "all tables". Crie um novo marcando SÓ a DISPARADOR.')
  } else {
    console.log(`✓ NÃO lê a LEADS (${LEADS}) → ${r2.status}. Escopo correto.`)
  }
}

console.log(ok ? '\n✓ Token pronto pra borda.' : '\n✗ Corrija antes de seguir.')

// exitCode em vez de process.exit(): o exit() derruba o processo com as conexões
// keep-alive do fetch ainda abertas, e o libuv do Node no Windows estoura um
// "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)" DEPOIS do relatório.
// O teste passa e o terminal parece que quebrou. Assim ele fecha limpo.
process.exitCode = ok ? 0 : 1
