import { NextResponse } from 'next/server'
import { COOKIE, assinarCookie, opcoesCookie, senhaConfere } from '@/lib/auth'

export const runtime = 'nodejs'

/** Freio de força bruta. In-memory de propósito: 1 usuário, 1 instância. */
const tentativas = new Map<string, { n: number; ate: number }>()
const LIMITE = 8
const JANELA_MS = 10 * 60 * 1000

function chave(req: Request): string {
  // Na Vercel o IP real vem no x-forwarded-for. Sem ele, todo mundo divide o
  // mesmo balde — o que é mais restritivo, não menos. Falha fechando.
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
}

export async function POST(req: Request) {
  const k = chave(req)
  const agora = Date.now()
  const t = tentativas.get(k)

  if (t && t.ate > agora && t.n >= LIMITE) {
    return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })
  }
  if (t && t.ate <= agora) tentativas.delete(k)

  let senha = ''
  try {
    const body = (await req.json()) as { senha?: unknown }
    senha = typeof body.senha === 'string' ? body.senha : ''
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  if (!(await senhaConfere(senha))) {
    const at = tentativas.get(k) ?? { n: 0, ate: agora + JANELA_MS }
    at.n += 1
    tentativas.set(k, at)
    return NextResponse.json({ erro: 'senha_errada' }, { status: 401 })
  }

  tentativas.delete(k)
  const { valor, maxAge } = await assinarCookie()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, valor, opcoesCookie(maxAge))
  return res
}

/** Sair. Útil quando o Caio usa um celular emprestado. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '', opcoesCookie(0))
  return res
}
