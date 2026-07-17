#!/usr/bin/env node
/**
 * Screenshot das telas autenticadas, via CDP.
 *
 *   node --env-file=.env.local scripts/shot.mjs <base-url> <pasta-saida>
 *
 * Por que CDP e não `msedge --screenshot <arquivo.html>`:
 * salvar o HTML e abrir em file:// QUEBRA a hidratação do React (a origem não
 * bate) e a tela vira "Application error: a client-side exception". A página está
 * certa; o atalho é que estava errado. Aqui a gente loga de verdade, injeta o
 * cookie na sessão do browser e fotografa o app rodando.
 *
 * Gate mobile-first do projeto: 390 (iPhone) e 1440. Toda tela passa nos dois.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.argv[2] ?? 'http://localhost:3987'
const OUT = process.argv[3] ?? './shots'
const PORT = 9333

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))
if (!EDGE) {
  console.error('✗ msedge.exe não encontrado.')
  process.exit(1)
}

const TELAS = [
  { nome: 'login', path: '/login', auth: false },
  { nome: 'fila', path: '/', auth: true },
  { nome: 'noar', path: '/agenda', auth: true },
  { nome: 'saiu', path: '/vendidos', auth: true },
]
const LARGURAS = [390, 1440]

mkdirSync(OUT, { recursive: true })

// 1) Cookie de sessão de verdade, pela rota real de login
const r = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ senha: process.env.BORDA_PASSPHRASE }),
})
if (!r.ok) {
  console.error(`✗ login falhou (${r.status}). Confira BORDA_PASSPHRASE no .env.local.`)
  process.exit(1)
}
const setCookie = r.headers.get('set-cookie') ?? ''
const valor = setCookie.split(';')[0].split('=').slice(1).join('=')
console.log('✓ logado')

// 2) Edge headless com CDP
const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${OUT}/.prof`,
  'about:blank',
])
edge.on('error', (e) => {
  console.error('✗ Edge não subiu:', e.message)
  process.exit(1)
})

let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250)
  try {
    const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    wsUrl = v.webSocketDebuggerUrl
  } catch {
    /* ainda subindo */
  }
}
if (!wsUrl) {
  console.error('✗ CDP não respondeu.')
  edge.kill()
  process.exit(1)
}

const ws = new WebSocket(wsUrl)
await new Promise((ok, err) => {
  ws.onopen = ok
  ws.onerror = () => err(new Error('ws'))
})

let seq = 0
const pend = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m.result)
    pend.delete(m.id)
  }
}
const cmd = (method, params = {}, sessionId) =>
  new Promise((ok) => {
    const id = ++seq
    pend.set(id, ok)
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true })
await cmd('Page.enable', {}, sessionId)
await cmd('Network.enable', {}, sessionId)

const host = new URL(BASE).hostname
await cmd(
  'Network.setCookie',
  { name: 'nsc_borda', value: valor, domain: host, path: '/', httpOnly: true },
  sessionId,
)

let falhas = 0
for (const t of TELAS) {
  for (const w of LARGURAS) {
    await cmd(
      'Emulation.setDeviceMetricsOverride',
      { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 },
      sessionId,
    )
    await cmd('Page.navigate', { url: `${BASE}${t.path}` }, sessionId)
    await sleep(2200)

    // A página inteira, não só a dobra
    const { cssContentSize } = await cmd('Page.getLayoutMetrics', {}, sessionId)
    const alt = Math.min(Math.ceil(cssContentSize.height), 4000)

    // O corpo NUNCA pode rolar na horizontal. É o gate que pega o card estourando
    // a tela no celular — o defeito mais comum e o que o Caio veria primeiro.
    const { result } = await cmd(
      'Runtime.evaluate',
      { expression: 'document.documentElement.scrollWidth', returnByValue: true },
      sessionId,
    )
    const estoura = result.value > w
    if (estoura) {
      falhas++
      console.log(`  ✗ ${t.nome} @${w}: rola na horizontal (${result.value}px > ${w}px)`)
    }

    const { data } = await cmd(
      'Page.captureScreenshot',
      { format: 'png', clip: { x: 0, y: 0, width: w, height: alt, scale: 1 }, captureBeyondViewport: true },
      sessionId,
    )
    writeFileSync(`${OUT}/${t.nome}-${w}.png`, Buffer.from(data, 'base64'))
    console.log(`  ${estoura ? '✗' : '✓'} ${t.nome} @${w} → ${t.nome}-${w}.png (${alt}px)`)
  }
}

ws.close()
edge.kill()
console.log(falhas ? `\n✗ ${falhas} tela(s) rolando na horizontal.` : '\n✓ Nenhuma tela rola na horizontal.')
process.exitCode = falhas ? 1 : 0
