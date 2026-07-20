#!/usr/bin/env node
/**
 * Dirige a UI de verdade (CDP) e exercita o fluxo do Caio ponta a ponta.
 *   node --env-file=.env.local scripts/drive.mjs http://localhost:3989
 *
 * Rodar SEMPRE contra o mock (`npm run mock` + `npm run dev:mock`): ele clica em
 * Aprovar, e aprovar contra o Baserow real faz o cron postar no grupo de verdade.
 *
 * Existe porque curl na API não pega o que quebra: em 16/07 o servidor devolvia
 * 200 e o Bruno achava que a borda tinha travado — o card sumia calado ao aprovar
 * e a fila ficava vazia. Bug de produto não aparece em teste de API.
 *
 * ⚠️ REINICIE O MOCK ANTES DE CADA CORRIDA. Ele guarda estado em memória: a corrida
 * passada aprova a 1ª peça, ela sai da fila, e a seguinte encontra a peça SEM PREÇO
 * no topo com o Aprovar (corretamente) desabilitado — parece bug e não é.
 * No Windows o `pkill` não mata: use a porta.
 *   netstat -ano | grep :4001 | grep LISTENING  → taskkill //F //PID <pid>
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.argv[2] ?? 'http://localhost:3989'
const PORT = 9444
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
  `--user-data-dir=${process.env.TEMP || '/tmp'}/drive-prof`, 'about:blank',
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
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
}
const cmd = (method, params = {}, sessionId) =>
  new Promise((ok) => { const id = ++seq; pend.set(id, ok); ws.send(JSON.stringify({ id, method, params, sessionId })) })

const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true })
await cmd('Page.enable', {}, sessionId)
await cmd('Network.enable', {}, sessionId)
await cmd('Network.setCookie', { name: 'nsc_borda', value: valor, domain: new URL(BASE).hostname, path: '/', httpOnly: true }, sessionId)
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true }, sessionId)

const js = async (e) => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sessionId)).result?.value
const texto = () => js(`document.body.innerText`)
const clicar = (rotulo) =>
  js(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(rotulo)});if(!b)return 'NAO ACHEI';if(b.disabled)return 'DESABILITADO';b.click();return 'clicou'})()`)

let falhas = 0
const checar = (nome, cond) => {
  if (!cond) falhas++
  console.log(`  ${cond ? '✓' : '✗'} ${nome}`)
}

await cmd('Page.navigate', { url: BASE }, sessionId)
await sleep(3000)

console.log('\n=== a fila mostra o que deve ===')
let t = await texto()
// INVERTIDO em 17/07. Antes: `esconde o rascunho cru e conta "1 peça chegando"`.
// A #31 real provou o custo: o Caio mandou o "Boné Ferrari 1997" e esqueceu o
// preço; sem preço não há legenda, o /agenda também segura, e a peça ficava
// invisível justo pra quem podia consertar. Rascunho cru não é lixo — é o
// formulário dele esperando conserto.
// /i obrigatório: `texto()` lê innerText, que APLICA o text-transform:uppercase do
// .peca-titulo. Na tela está "BONÉ FERRARI…", no mock está "Boné Ferrari…".
// Comparar case-sensitive falha por um motivo que nada tem a ver com o que se prova.
checar('MOSTRA o rascunho cru com título humano (a #31 real)', /Boné Ferrari Michael Schumacher 1997/i.test(t))
checar('MOSTRA o rascunho cru sem título (cai no id)', /m99988877766/i.test(t))
checar('sumiu o banner "peças chegando"', !/peças? chegando/.test(t))
checar('a peça sem foto avisa em vez de parecer quebrada', /A foto vem quando o Bruno preparar/.test(t))
checar('avisa o preço divergente da Suzuka (480 no card × 529 na legenda)', /na legenda está.*R\$\s?529/s.test(t))
checar('NÃO dá alarme falso na promoção (De R$ 650 por R$ 480)', !/R\$\s?650,00.*e.*R\$\s?480,00/s.test(t.split('Camisa Lotus')[1] ?? ''))
// O texto mudou junto com a regra: mandar esperar o Bruno por um campo que o
// PRÓPRIO Caio digitou no form era o que deixava a peça entalada.
checar('trava a peça sem preço, mas aponta pro Caio', /Falta o preço — dá pra pôr aqui mesmo/.test(t))
checar('não manda esperar o Bruno pelo preço', !/Sem preço\. O Bruno precisa completar/.test(t))

console.log('\n=== editar: o bug que o Bruno reportou ===')
console.log('  clicar em Editar →', await clicar('Editar'))
await sleep(800)
checar('o textarea APARECE', await js(`!!document.querySelector('textarea')`))
await js(`
  const ta=document.querySelector('textarea');
  const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
  set.call(ta,'*Boné Benetton F1*\\nTam: único\\n\\nR$ 350,00');
  ta.dispatchEvent(new Event('input',{bubbles:true}));
`)
console.log('  clicar em Salvar →', await clicar('Salvar'))
await sleep(2500)
t = await texto()
checar('confirma "Salvo." em vez de não dizer nada', /Salvo\./.test(t))

console.log('\n=== aprovar: o card NÃO pode sumir calado ===')
console.log('  clicar em Aprovar →', await clicar('Aprovar'))
await sleep(2500)
t = await texto()
checar('confirma o que aconteceu, com o nome da peça', /aprovado\. Sai no grupo na próxima janela/.test(t))
checar('nomeia a peça aprovada', /Boné Benetton F1 vermelho vintage/.test(t))

console.log('\n=== GARIMPAR: o loop se fecha DENTRO da borda (17/07) ===')
console.log('  mandar link era a única coisa que o Caio fazia num site à parte.')
// React é controlado: mexer no .value direto não dispara o onChange e o estado
// fica vazio. Mesmo truque do textarea acima — setter nativo + evento borbulhando.
const digitar = (sel, valor) => js(`(()=>{
  const el=document.querySelector(${JSON.stringify(sel)});
  if(!el) return 'NAO ACHEI';
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(el, ${JSON.stringify(valor)});
  el.dispatchEvent(new Event('input',{bubbles:true}));
  return 'ok';
})()`)

console.log('  clicar na aba Garimpar →', await js(`(()=>{const a=[...document.querySelectorAll('nav.abas a')].find(a=>a.textContent.trim()==='Garimpar');if(!a)return 'NAO ACHEI';a.click();return 'clicou'})()`))
await sleep(2500)
t = await texto()
checar('a aba Garimpar existe e abre', /Garimpar/i.test(t) && (await js(`!!document.querySelector('#url-0')`)))
checar('o rodapé não tem mais "Mandar links" (2 portas pra mesma ação)', !/Mandar links/i.test(t))

console.log('  digitar a peça →', await digitar('#url-0', 'https://jp.mercari.com/item/m88899900011'))
await digitar('#title-0', 'Boné Williams Rothmans 1994')
await digitar('#price-0', 'R$ 690,00')
await digitar('#note-0', 'Ajustável')
await sleep(300)
console.log('  clicar em Mandar pra fila →', await clicar('Mandar pra fila'))
await sleep(2500)
t = await texto()
checar('confirma pela CONTAGEM, não por "enviado"', /1 peça entrou na fila/.test(t))
checar('diz onde ela foi parar', /aba Fila/i.test(t))

// Link torto: o erro tem que aparecer NA LINHA, não só num banner genérico.
await digitar('#url-0', 'https://example.com/item/m123')
await sleep(200)
console.log('  mandar link torto →', await clicar('Mandar pra fila'))
await sleep(1200)
t = await texto()
checar('link fora do Mercari é barrado ANTES de sair da tela', /não é de uma peça do Mercari/.test(t))
checar('e o erro aparece na linha, não só no banner', /Cola o link de um item do Mercari/.test(t))

console.log('  voltar pra Fila →', await js(`(()=>{const a=[...document.querySelectorAll('nav.abas a')].find(a=>a.textContent.trim().startsWith('Fila'));if(!a)return 'NAO ACHEI';a.click();return 'clicou'})()`))
await sleep(2500)
t = await texto()
// O loop inteiro: ele mandou o link e a peça está na fila dele, na mesma sessão,
// sem trocar de site. É isto que a aba comprou.
checar('a peça que ele acabou de mandar está na Fila', /Boné Williams Rothmans 1994/i.test(t))
checar('e entrou como rascunho cru (sem foto, esperando o /agenda)', /A foto vem quando o Bruno preparar/.test(t))

const { data } = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: 390, height: Math.min((await cmd('Page.getLayoutMetrics', {}, sessionId)).cssContentSize.height, 4000), scale: 1 } }, sessionId)
const { writeFileSync } = await import('node:fs')
writeFileSync(process.argv[3] ?? './drive.png', Buffer.from(data, 'base64'))
console.log(`\nfoto: ${process.argv[3] ?? './drive.png'}`)

ws.close()
edge.kill()
console.log(falhas ? `\n✗ ${falhas} checagem(ns) falharam` : '\n✓ tudo passou')
process.exitCode = falhas ? 1 : 0
