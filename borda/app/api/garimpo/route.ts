import { NextResponse } from 'next/server'
import { criarOferta, type NovaOferta } from '@/lib/baserow'
import { lerPrecoBrl } from '@/lib/caption'
import { MAX_ITENS, mercariIdDe } from '@/lib/mercari'

export const runtime = 'nodejs'

/**
 * A SEGUNDA porta de entrada do garimpo — a de dentro da borda.
 *
 * A primeira é o form standalone (`garimpo-nsc.vercel.app`) → webhook do n8n, que
 * FICA NO AR como fallback (decisão do Bruno, 17/07). Nada de n8n é desligado:
 * isto é 100% aditivo. As duas gravam o MESMO rascunho cru na 556, e a paridade
 * campo a campo é o contrato — ver `NovaOferta` em `lib/baserow.ts` e o guard
 * "paridade com o webhook" no `scripts/guards.mjs`.
 *
 * Sem `secret`. O do form standalone é um freio de spam visível no fonte, e existe
 * porque aquele webhook é uma URL pública. Aqui o gate é o login do Caio: o
 * middleware pega `/api/*` e esta rota nasce autenticada (401 sem cookie).
 */

type ItemBruto = { url?: unknown; title?: unknown; price?: unknown; note?: unknown }

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function POST(req: Request) {
  let body: { items?: unknown }
  try {
    body = (await req.json()) as { items?: unknown }
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  const items = Array.isArray(body.items) ? (body.items as ItemBruto[]) : []
  if (items.length === 0) {
    return NextResponse.json({ erro: 'sem_itens' }, { status: 400 })
  }
  if (items.length > MAX_ITENS) {
    return NextResponse.json({ erro: 'acima_do_teto', teto: MAX_ITENS }, { status: 400 })
  }

  const criadas: { id: number; mercariId: string; titulo: string }[] = []
  const rejeitados: { indice: number; url: string; motivo: string }[] = []
  let baserowCaiu = false

  for (let i = 0; i < items.length; i++) {
    const it = items[i] ?? {}
    const url = txt(it.url)
    const id = mercariIdDe(url)

    // Link sem id NÃO derruba a leva: o Caio cola 8 peças de uma vez e perder as 7
    // boas por causa de 1 link torto é o pior resultado. Ele volta e conserta a que
    // sobrou — e a resposta diz qual foi.
    if (!id) {
      rejeitados.push({ indice: i, url, motivo: 'nao_e_link_de_peca_do_mercari' })
      continue
    }

    const nova: NovaOferta = {
      mercari_id: id,
      source_url: url,
      title_pt: txt(it.title) || id, // título do Caio, id como fallback; o /agenda refina
      tags: txt(it.note), // só a nota; o valor tem campo próprio
      status: 'Fila',
    }

    // 🔴 O IENE NÃO BLOQUEIA AQUI — e isso é DIFERENTE do `Peca.tsx` (editar), de
    // propósito. São dois momentos:
    //  - garimpar é despejo em lote: a linha nasce SEM preço e o Caio conserta
    //    depois, na Fila, que desde 17/07 mostra os rascunhos crus.
    //  - editar é conserto pontual, com a peça na frente: ali sim avisa e trava.
    // Espelha o webhook (`if (brl !== null) row.price_brl = brl`), que é o que
    // mantém as duas portas idênticas. Barrar aqui faria a mesma peça entrar pelo
    // standalone e não entrar pela borda.
    const preco = lerPrecoBrl(txt(it.price))
    if (preco.ok) nova.price_brl = preco.valor

    try {
      const oferta = await criarOferta(nova)
      criadas.push({ id: oferta.id, mercariId: oferta.mercariId, titulo: oferta.titulo })
    } catch (e) {
      console.error('[api/garimpo] criar', id, e)
      baserowCaiu = true
      rejeitados.push({ indice: i, url, motivo: 'nao_gravou' })
    }
  }

  // Baserow fora do ar e NADA entrou: isso não é "seus links estavam errados", é
  // o servidor. Dizer "8 rejeitados" mandaria o Caio conferir link que está certo.
  if (criadas.length === 0 && baserowCaiu) {
    return NextResponse.json({ erro: 'baserow_indisponivel' }, { status: 502 })
  }

  // O cliente conta `criadas` pra confirmar — nunca a resposta HTTP. É a lição de
  // 16/07: o webhook devolvia 200 com corpo vazio quando o workflow explodia no
  // meio, e o form dizia "Recebido!" com o banco vazio.
  return NextResponse.json({ criadas, rejeitados })
}
