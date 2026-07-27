/**
 * Auth da borda — passphrase única → cookie httpOnly assinado.
 *
 * O Caio é UMA pessoa e o Bruno instala na mão. Não tem tabela de usuário, não
 * tem signup, não tem provider. Isso não é preguiça: login enterprise aqui é
 * fantasia de escala.
 *
 * O que a passphrase protege NÃO é a fila — é o BASEROW_TOKEN_BORDA, que vive
 * server-side e nunca desce pro browser. O freio do garimpo (secret no fonte) é
 * fraco por UM degrau: lá o pior caso é rascunho sujo, aqui é uma peça sair no
 * grupo sem ninguém ter mandado.
 *
 * Web Crypto (não `node:crypto`) de propósito: o middleware roda no Edge runtime.
 *
 * Quando virar cliente pagante (não é v1): passphrase POR PESSOA em vez de
 * compartilhada, e um campo `aprovado_por`. Com o sócio, "quem aprovou" é óbvio;
 * com um time de 3, é a primeira pergunta quando um post sai errado.
 * O passo seguinte natural não é OAuth — é magic link por WhatsApp, que já existe
 * aqui e cujo 2º fator é o celular que ele já usa pra operar.
 */

export const COOKIE = 'nsc_borda'
const TTL_MS = 90 * 24 * 60 * 60 * 1000

const enc = new TextEncoder()

function b64url(buf: ArrayBuffer): string {
  let s = ''
  const b = new Uint8Array(buf)
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(segredo: string, dado: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(dado)))
}

function segredoCookie(): string {
  const s = process.env.BORDA_COOKIE_SECRET
  if (!s) throw new Error('Falta a env BORDA_COOKIE_SECRET.')
  return s
}

/**
 * Compara por HMAC em vez de `===`.
 * Comparação de string sai no primeiro byte diferente e vaza a senha por timing.
 * Passar as duas pelo HMAC deixa o tempo constante.
 */
export async function senhaConfere(tentativa: string): Promise<boolean> {
  const real = process.env.BORDA_PASSPHRASE
  if (!real) throw new Error('Falta a env BORDA_PASSPHRASE.')
  const sal = segredoCookie()
  const [a, b] = await Promise.all([hmac(sal, tentativa), hmac(sal, real)])
  return a === b
}

/** Cookie = `<expira_em_ms>.<assinatura>`. Sem sessão em banco: o cookie é o estado. */
export async function assinarCookie(): Promise<{ valor: string; maxAge: number }> {
  const exp = String(Date.now() + TTL_MS)
  const sig = await hmac(segredoCookie(), exp)
  return { valor: `${exp}.${sig}`, maxAge: Math.floor(TTL_MS / 1000) }
}

export async function cookieValido(valor: string | undefined): Promise<boolean> {
  if (!valor) return false
  const i = valor.lastIndexOf('.')
  if (i < 1) return false

  const exp = valor.slice(0, i)
  const sig = valor.slice(i + 1)

  // Assinatura antes de expiração: um cookie forjado não merece nem ser lido.
  const esperada = await hmac(segredoCookie(), exp)
  if (sig !== esperada) return false

  const ts = Number(exp)
  return Number.isFinite(ts) && ts > Date.now()
}

export function opcoesCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
