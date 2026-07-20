import { NextResponse } from 'next/server'
import { atualizarOferta, buscarOferta, type PatchEnriquecido } from '@/lib/baserow'
import { buscarPeca } from '@/lib/firecrawl'
import { reHospedarFoto } from '@/lib/foto'

export const runtime = 'nodejs'
/**
 * Firecrawl (~5s, com `waitFor` de 3.5s) + download da foto + upload no Baserow
 * não cabem no tempo padrão de uma função. Sem isto o Caio vê "buscando…" e leva
 * um erro genérico no fim, sem nunca saber que foi tempo.
 */
export const maxDuration = 60

/**
 * A METADE MECÂNICA do enriquecimento — o que o Caio consegue fazer sozinho.
 *
 * O que esta rota faz: raspa o anúncio, re-hospeda a foto, grava os dados crus.
 * O que ela NÃO faz, e é a linha inteira do desenho: **não traduz, não escreve
 * legenda, não julga a peça**. Isso continua sendo o `/agenda`, com o Bruno.
 * A borda segue sem nenhuma chamada de LLM.
 *
 * Com a foto no lugar e o título japonês à vista, o Caio decide: traduz e escreve
 * a legenda ele mesmo (o textarea do Editar já existe), ou espera o Bruno.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idTxt } = await ctx.params
  const id = Number(idTxt)
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ erro: 'id_invalido' }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as { refazer?: unknown }
  const refazer = body.refazer === true

  let atual
  try {
    atual = await buscarOferta(id)
  } catch (e) {
    console.error(`[enriquecer/${id}] ler`, e)
    return NextResponse.json({ erro: 'baserow_indisponivel' }, { status: 502 })
  }

  // Mesma trava do PATCH, pelo mesmo motivo: linha postada é história, e história
  // se corrige no Baserow com o Bruno vendo — não num botão do Caio.
  if (atual.postedAt) {
    return NextResponse.json(
      { erro: 'ja_postada', motivo: 'Essa peça já saiu no grupo. Se precisa mexer nela, fala com o Bruno.' },
      { status: 409 },
    )
  }

  // Firecrawl é pago por chamada. Peça já enriquecida não se re-raspa por engano —
  // só quando alguém pedir de propósito.
  if (atual.fotoUrl && !refazer) {
    return NextResponse.json(
      { erro: 'ja_enriquecida', motivo: 'Essa peça já tem os dados do Mercari.' },
      { status: 409 },
    )
  }

  if (!atual.sourceUrl) {
    return NextResponse.json(
      { erro: 'sem_link', motivo: 'Essa peça não tem link do Mercari. Descarta e manda de novo.' },
      { status: 409 },
    )
  }

  let peca
  try {
    peca = await buscarPeca(atual.sourceUrl)
  } catch (e) {
    console.error(`[enriquecer/${id}] firecrawl`, e)
    return NextResponse.json(
      { erro: 'firecrawl_falhou', motivo: 'Não deu pra ler o anúncio agora. Tenta de novo em instantes.' },
      { status: 502 },
    )
  }

  // Peça vendida no Mercari = alguém comprou antes da gente. Preparar uma peça
  // morta é pior que não preparar: ela ficaria pronta pra ir pro grupo. NÃO grava
  // nada — inclusive não marca `sold`, que é do /confere-ofertas (o cron), e a
  // borda escrevendo campo de cron é como a fila passa a mentir.
  if (peca.sold) {
    return NextResponse.json(
      {
        erro: 'vendida_no_mercari',
        motivo: 'Essa peça já foi vendida no Mercari — alguém comprou antes. Melhor descartar.',
      },
      { status: 409 },
    )
  }

  const patch: PatchEnriquecido = {}
  if (peca.title) patch.title_ja = peca.title
  if (peca.brand) patch.brand = peca.brand
  if (peca.category) patch.category = peca.category
  if (peca.condition) patch.condition = peca.condition
  // Referência de custo do Bruno. Gravar é ok (fica no servidor); o que não pode é
  // CHEGAR no browser — quem corta é o paraBorda(), e o guard de PII prova.
  if (peca.price_jpy !== null) patch.price_jpy = peca.price_jpy

  // 🔴 A FOTO É O ÚLTIMO PASSO, e falhar nela NÃO impede o resto de ser gravado —
  // mas o contrário seria desastre. `photo_url` é a URL que o WAHA busca pra
  // postar: gravá-la apontando pro vazio deixaria a peça com cara de pronta e o
  // disparo falharia no grupo. Sem foto a peça continua visivelmente incompleta
  // na fila, que é honesto.
  let fotoFalhou = false
  if (peca.image_urls.length > 0) {
    try {
      patch.photo_url = await reHospedarFoto(peca.image_urls[0], atual.mercariId)
    } catch (e) {
      console.error(`[enriquecer/${id}] foto`, e)
      fotoFalhou = true
    }
  } else {
    fotoFalhou = true
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { erro: 'nada_veio', motivo: 'O anúncio não devolveu nada de útil. Confere o link no Mercari.' },
      { status: 502 },
    )
  }

  try {
    const oferta = await atualizarOferta(id, patch)
    return NextResponse.json({ oferta, fotoFalhou })
  } catch (e) {
    console.error(`[enriquecer/${id}] gravar`, e)
    return NextResponse.json({ erro: 'baserow_indisponivel' }, { status: 502 })
  }
}
