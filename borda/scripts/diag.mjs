#!/usr/bin/env node
/** Diagnóstico: a página hidratou? Os botões existem? O console reclamou? */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const PORT = 9445
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const r = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ senha: process.env.BORDA_PASSPHRASE }),
})
const valor = (r.headers.get('set-cookie') ?? '').split(';')[0].split('=').slice(1).join('=')

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP || '/tmp'}/diag-prof`, 'about:blank',
])
let wsUrl = null
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250)
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl } catch {}
}
const ws = new WebSocket(wsUrl)
await new Promise((ok) => (ws.onopen = ok))
let seq = 0
const pend = new Map()
const logs = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
  if (m.method === 'Runtime.consoleAPICalled') {
    logs.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? '?').join(' ').slice(0, 300))
  }
  if (m.method === 'Runtime.exceptionThrown') {
    logs.push('[EXCEPTION] ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 400))
  }
}
const cmd = (method, params = {}, sessionId) =>
  new Promise((ok) => { const id = ++seq; pend.set(id, ok); ws.send(JSON.stringify({ id, method, params, sessionId })) })

const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true })
await cmd('Runtime.enable', {}, sessionId)
await cmd('Page.enable', {}, sessionId)
await cmd('Network.enable', {}, sessionId)
await cmd('Network.setCookie', { name: 'nsc_borda', value: valor, domain: new URL(BASE).hostname, path: '/', httpOnly: true }, sessionId)
await cmd('Page.navigate', { url: BASE }, sessionId)
await sleep(4000)

const js = async (e) => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true }, sessionId)).result?.value

console.log('URL final    :', await js(`location.pathname`))
console.log('botões na tela:', await js(`JSON.stringify([...document.querySelectorAll('button')].map(b=>b.textContent.trim()))`))
console.log('React hidratou?:', await js(`
  (() => {
    const el = document.querySelector('button');
    if (!el) return 'sem botao';
    return Object.keys(el).some(k => k.startsWith('__react')) ? 'SIM' : 'NAO — os botoes estao mortos';
  })()
`))
console.log('\n--- console do browser ---')
console.log(logs.length ? logs.join('\n') : '(vazio)')

ws.close()
edge.kill()
