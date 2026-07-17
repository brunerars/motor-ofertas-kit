import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE, cookieValido } from './lib/auth'

/**
 * O portão. Sem cookie válido, nada além do login existe.
 *
 * Deny-by-default: o matcher deixa passar SÓ o login, a rota que cria o cookie e
 * os estáticos. Tudo que for criado depois nasce protegido — se um dia uma rota
 * nova vazar, é por alguém ter mexido aqui, não por esquecimento.
 */
export async function middleware(req: NextRequest) {
  const ok = await cookieValido(req.cookies.get(COOKIE)?.value)
  if (ok) return NextResponse.next()

  // API responde 401 seco; página redireciona pro login. Um fetch que recebe HTML
  // de login em vez de 401 falha no `.json()` com um erro que não diz nada.
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ erro: 'nao_autenticado' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon|apple-touch-icon|assets).*)'],
}
