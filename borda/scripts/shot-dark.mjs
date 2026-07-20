#!/usr/bin/env node
/**
 * Captura a borda no TEMA ESCURO. O shot.mjs só fotografa o claro — e foi
 * exatamente no escuro que o selo "Saiu 17/07" ficou branco no branco.
 * Um harness que só olha um tema não vê metade da UI.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.argv[2] ?? 'http://localhost:3989'
const OUT = resolve(process.argv[3] ?? './shots-dark') // absoluto: o Edge ignora relativo
const PORT = 9355
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))
mkdirSync(OUT, { recursive: true })

const r = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ senha: process.env.BORDA_PASSPHRASE }),
})
const valor = (r.headers.get('set-cookie') ?? '').split(';')[0].split('=').slice(1).join('=')

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${OUT}/.prof`, 'about:blank'])
let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250)
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl } catch {}
}
const ws = new WebSocket(wsUrl)
await new Promise((ok) => (ws.onopen = ok))
let seq = 0
const pend = new Map()
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } }
const cmd = (method, params = {}, sessionId) =>
  new Promise((ok) => { const id = ++seq; pend.set(id, ok); ws.send(JSON.stringify({ id, method, params, sessionId })) })

const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true })
await cmd('Page.enable', {}, sessionId)
await cmd('Network.enable', {}, sessionId)
await cmd('Network.setCookie', { name: 'nsc_borda', value: valor, domain: new URL(BASE).hostname, path: '/', httpOnly: true }, sessionId)
// o toggle guarda a escolha; plantar antes de carregar evita flash e clique
await cmd('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.setItem('nsc-tema','dark')}catch(e){}
           document.documentElement.setAttribute('data-theme','dark')`,
}, sessionId)
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true }, sessionId)

for (const [nome, path] of [['fila', '/'], ['saiu', '/vendidos'], ['garimpar', '/garimpar']]) {
  await cmd('Page.navigate', { url: BASE + path }, sessionId)
  await sleep(2600)
  const tema = (await cmd('Runtime.evaluate', { expression: `document.documentElement.getAttribute('data-theme')`, returnByValue: true }, sessionId)).result?.value
  const h = (await cmd('Page.getLayoutMetrics', {}, sessionId)).cssContentSize.height
  const { data } = await cmd('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 390, height: Math.min(h, 4000), scale: 1 },
  }, sessionId)
  writeFileSync(`${OUT}/${nome}-dark.png`, Buffer.from(data, 'base64'))
  console.log(`  ${tema === 'dark' ? '✓' : '✗ TEMA NAO APLICOU:'} ${nome}-dark.png (data-theme=${tema})`)
}
ws.close()
edge.kill()
