import { NextResponse } from 'next/server'
import { atualizarOferta, buscarOferta, type Patch, type Status } from '@/lib/baserow'
import { podeAprovar } from '@/lib/caption'
import { isoDeHoraLocal } from '@/lib/hora'

export const runtime = 'nodejs'

/**
 * O que a BORDA pode escrever em `status`.
 *
 * `Disparado` e `Vendido` NÃO estão aqui de propósito: quem escreve esses dois é
 * o n8n (o cron de disparo e o confere-vendidos). Se a borda pudesse marcá-los, a
 * fila mentiria pro cron — uma peça "Disparado" que nunca foi postada some pra
 * sempre sem ninguém notar.
 */
const PERMITIDOS: Status[] = ['Fila', 'Aprovado', 'Agendado', 'Descartado']

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idTxt } = await ctx.params
  const id = Number(idTxt)
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ erro: 'id_invalido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: 'corpo_invalido' }, { status: 400 })
  }

  // Allowlist. Nada que não esteja aqui atravessa pro Baserow — nem por engano,
  // nem por campo novo que apareça no schema depois.
  const patch: Patch = {}

  if (typeof body.caption === 'string') {
    patch.caption = body.caption
    // 🔴 O FREIO DE 20/07. Com o botão de enriquecer, o Caio consegue preparar a
    // peça inteira sozinho — e a conferida do Bruno (a que pegou a condição
    // subestimada da row 5 e o boné DEKRA falso) sairia do caminho SEM AVISO.
    // `docs/borda-hub-caio.md:38-40` exigia reinserir um freio explícito ou
    // aceitar por escrito que ele saiu. Este é o freio, e ele é deliberadamente
    // fraco: não bloqueia, não pede aprovação, só deixa de ser silencioso.
    //
    // A rota DERIVA o valor, não o aceita do cliente: quem salva legenda por aqui
    // é o Caio, por definição — o /agenda escreve direto no Baserow e nunca passa
    // por esta rota. Por isso `caption_by` não está na leitura do `body`.
    //
    // Legenda apagada não tem autor: volta a vazio, que lê como "/agenda".
    patch.caption_by = body.caption.trim() ? 'caio' : ''
  }
  if (typeof body.tags === 'string') patch.tags = body.tags
  if (typeof body.sold === 'boolean') patch.sold = body.sold

  // `title_pt` e `price_brl` são do CAIO — ele os digita no form do garimpo.
  // Ficavam de fora sem razão de segurança (o que vaza margem é o `price_jpy`, e
  // esse continua fora, junto com `title_ja`: não estão aqui, logo não passam).
  if (body.title_pt !== undefined) {
    if (typeof body.title_pt !== 'string' || !body.title_pt.trim()) {
      return NextResponse.json({ erro: 'titulo_invalido' }, { status: 400 })
    }
    patch.title_pt = body.title_pt.trim()
  }

  if (body.price_brl !== undefined) {
    // null limpa o preço (volta a "falta o preço"). O 0 não é preço de venda.
    if (body.price_brl === null) {
      patch.price_brl = null
    } else if (typeof body.price_brl !== 'number' || !Number.isFinite(body.price_brl) || body.price_brl <= 0) {
      return NextResponse.json({ erro: 'preco_invalido' }, { status: 400 })
    } else {
      patch.price_brl = body.price_brl
    }
  }

  if (body.status !== undefined) {
    const s = body.status as Status
    if (!PERMITIDOS.includes(s)) {
      return NextResponse.json({ erro: 'status_nao_permitido' }, { status: 403 })
    }
    patch.status = s
  }

  if (body.scheduled_at !== undefined) {
    if (body.scheduled_at === null || body.scheduled_at === '') {
      patch.scheduled_at = null
    } else if (typeof body.scheduled_at === 'string') {
      // 🔴 O `datetime-local` manda HORA DE PAREDE, sem fuso ("2026-07-17T14:30").
      // `new Date()` numa string dessas usa o fuso do RUNTIME — UTC na Vercel — e
      // gravava o 14:30 do Caio como 14:30Z = 11:30 aqui: a peça saía 3h cedo.
      // `isoDeHoraLocal` lê a parede no fuso da LOJA, não no do servidor.
      const iso = isoDeHoraLocal(body.scheduled_at)
      if (iso === null) {
        return NextResponse.json({ erro: 'data_invalida' }, { status: 400 })
      }
      patch.scheduled_at = iso
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ erro: 'nada_pra_mudar' }, { status: 400 })
  }

  try {
    if (patch.status !== undefined) {
      const atual = await buscarOferta(id)

      // Peça com `posted_at` JÁ FOI POSTADA — não importa o que o `status` diga.
      //
      // Isto não é redundância do PERMITIDOS: aquele valida o status de DESTINO, e
      // `Aprovado` é destino legítimo. O que faltava era olhar o estado ATUAL. Sem
      // isto, a borda aceita puxar uma linha já disparada de volta pra `Aprovado` —
      // e o cron de disparo relê a fila, vê `Aprovado`, e REPOSTA no grupo real.
      //
      // Achado em 16/07 pela porta dos fundos: #28 e #29 estavam em `Aprovado`
      // carregando `posted_at` + `wa_message_id` das 20h, e iam sair de novo às 9h.
      // O `Ainda dá pra disparar?` do n8n tranca só pelo `status`, que é justamente
      // o campo que todo mundo mexe. Enquanto o cadeado de lá tiver uma chave só,
      // a borda não pode ser quem a entrega.
      //
      // Bloqueia QUALQUER status (inclusive `Descartado`): linha postada é história,
      // e história se corrige no Baserow, com o Bruno vendo — não num botão do Caio.
      if (atual.postedAt) {
        return NextResponse.json(
          {
            erro: 'ja_postada',
            motivo: 'Essa peça já saiu no grupo. Se precisa mexer nela, fala com o Bruno.',
          },
          { status: 409 },
        )
      }

      // Aprovar/agendar exige preço e legenda. A regra é do projeto e vale no servidor,
      // não só no botão: "sem preço não há legenda" — nunca sai "sob consulta" no grupo.
      //
      // Valida contra o que ESTA requisição vai gravar (`patch.X ?? atual.X`), não
      // contra o que está no banco. O Caio põe o preço que faltava e aprova na mesma
      // ação: olhar só o `atual.precoBrl` recusaria por falta de um preço que chegou
      // junto, e ele leria "falta o preço" com o preço preenchido na tela.
      if (patch.status === 'Aprovado' || patch.status === 'Agendado') {
        const motivo = podeAprovar({
          precoBrl: patch.price_brl !== undefined ? patch.price_brl : atual.precoBrl,
          caption: patch.caption ?? atual.caption,
        })
        if (motivo) return NextResponse.json({ erro: 'incompleta', motivo }, { status: 409 })
      }
    }

    const oferta = await atualizarOferta(id, patch)
    return NextResponse.json({ oferta })
  } catch (e) {
    console.error(`[api/ofertas/${id}] PATCH`, e)
    return NextResponse.json({ erro: 'baserow_indisponivel' }, { status: 502 })
  }
}
