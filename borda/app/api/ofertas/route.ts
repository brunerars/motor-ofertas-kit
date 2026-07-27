import { NextResponse } from 'next/server'
import { listarOfertas } from '@/lib/baserow'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ofertas = await listarOfertas()
    return NextResponse.json({ ofertas })
  } catch (e) {
    console.error('[api/ofertas] GET', e)
    return NextResponse.json({ erro: 'baserow_indisponivel' }, { status: 502 })
  }
}
