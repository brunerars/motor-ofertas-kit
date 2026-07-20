'use client'

import { useState } from 'react'
import { MAX_ITENS, mercariIdDe } from '@/lib/mercari'

/**
 * O form do garimpo, agora DENTRO da borda.
 *
 * Porte do `garimpo/index.html` (o standalone, que segue no ar como fallback).
 * Mudou o que tinha que mudar e nada além:
 *  - sem `secret` no corpo — quem é o gate aqui é o login do Caio (middleware);
 *  - POST em `/api/garimpo`, não no webhook do n8n;
 *  - reusa o design system da borda (`.btn`, `.banner`) em vez de trazer CSS junto.
 *
 * O que NÃO mudou é o comportamento: mesma validação de link, mesmo teto de 20,
 * mesma confirmação por CONTAGEM (nunca pelo status HTTP — ver o `enviar`).
 */

type Linha = { url: string; title: string; price: string; note: string }
type Aviso = { tipo: 'ok' | 'err' | 'info'; texto: string }

const vazia = (): Linha => ({ url: '', title: '', price: '', note: '' })

export function GarimpoForm() {
  const [linhas, setLinhas] = useState<Linha[]>([vazia()])
  const [invalidas, setInvalidas] = useState<Set<number>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  function mudar(i: number, campo: keyof Linha, valor: string) {
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)))
    // Digitar no link limpa o vermelho: o erro é sobre o que estava lá, não sobre
    // o que ele está escrevendo agora.
    if (campo === 'url' && invalidas.has(i)) {
      setInvalidas((s) => {
        const n = new Set(s)
        n.delete(i)
        return n
      })
    }
  }

  function adicionar() {
    if (linhas.length >= MAX_ITENS) return
    setLinhas((ls) => [...ls, vazia()])
  }

  function remover(i: number) {
    if (linhas.length <= 1) return
    setLinhas((ls) => ls.filter((_, j) => j !== i))
    setInvalidas(new Set())
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setAviso(null)

    // Valida aqui pra ele ver o erro NA LINHA, em vermelho. A rota valida de novo
    // e é ela a autoridade — isto é conveniência, não segurança.
    const ruins = new Set<number>()
    const items: Linha[] = []
    linhas.forEach((l, i) => {
      const url = l.url.trim()
      if (!url) return // linha totalmente em branco é só uma linha que ele não usou
      if (!mercariIdDe(url)) {
        ruins.add(i)
        return
      }
      items.push({ url, title: l.title.trim(), price: l.price.trim(), note: l.note.trim() })
    })

    if (ruins.size > 0) {
      setInvalidas(ruins)
      setAviso({ tipo: 'err', texto: 'Tem link que não é de uma peça do Mercari. Confere os marcados em vermelho.' })
      return
    }
    if (items.length === 0) {
      setAviso({ tipo: 'err', texto: 'Cola pelo menos um link antes de enviar.' })
      return
    }

    setEnviando(true)
    setAviso({ tipo: 'info', texto: `Enviando ${items.length === 1 ? '1 peça' : `${items.length} peças`}…` })

    try {
      const res = await fetch('/api/garimpo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const j = (await res.json().catch(() => null)) as {
        criadas?: { id: number }[]
        rejeitados?: { indice: number }[]
      } | null

      // 🔴 Confirma pela CONTAGEM, nunca pelo status. A lição é de 16/07: o webhook
      // devolvia 200 com corpo vazio quando o workflow explodia no meio, e o form
      // dizia "Recebido!" com o banco vazio. Peça que ele acha que mandou e não
      // existe é pior que erro na cara.
      const criadas = j?.criadas?.length ?? 0
      if (criadas === 0) throw new Error('nenhuma linha confirmada')

      const rejeitados = j?.rejeitados?.length ?? 0
      setAviso({
        tipo: 'ok',
        texto:
          `${criadas === 1 ? '1 peça entrou' : `${criadas} peças entraram`} na fila.` +
          (rejeitados > 0 ? ` ${rejeitados === 1 ? '1 link não entrou' : `${rejeitados} links não entraram`} — confere e manda de novo só ${rejeitados === 1 ? 'ele' : 'eles'}.` : '') +
          ' Elas aparecem na aba Fila.',
      })
      setLinhas([vazia()])
      setInvalidas(new Set())
    } catch {
      setAviso({
        tipo: 'err',
        texto: 'Não deu pra enviar agora. Tenta de novo em instantes — se persistir, avisa o Bruno.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const noTeto = linhas.length >= MAX_ITENS

  return (
    <form onSubmit={enviar}>
      <div className="garimpo-itens">
        {linhas.map((l, i) => (
          <div key={i} className={`garimpo-item${invalidas.has(i) ? ' invalida' : ''}`}>
            <div className="garimpo-item-cab">
              <span className="garimpo-n">Peça {i + 1}</span>
              {linhas.length > 1 && (
                <button
                  type="button"
                  className="garimpo-rm"
                  onClick={() => remover(i)}
                  aria-label={`Remover a peça ${i + 1}`}
                  title="Remover"
                >
                  ×
                </button>
              )}
            </div>

            <label htmlFor={`url-${i}`}>Link do produto (Mercari)</label>
            <input
              id={`url-${i}`}
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://jp.mercari.com/item/m..."
              value={l.url}
              onChange={(e) => mudar(i, 'url', e.target.value)}
            />
            {invalidas.has(i) && (
              <p className="campo-erro">Cola o link de um item do Mercari (jp.mercari.com/item/m…).</p>
            )}

            <label htmlFor={`title-${i}`}>Título do produto</label>
            <input
              id={`title-${i}`}
              type="text"
              autoComplete="off"
              placeholder="ex: Boné Ferrari Schumacher nº 1"
              value={l.title}
              onChange={(e) => mudar(i, 'title', e.target.value)}
            />

            <label htmlFor={`price-${i}`}>Valor de venda (R$)</label>
            <input
              id={`price-${i}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="ex: R$ 750,00"
              value={l.price}
              onChange={(e) => mudar(i, 'price', e.target.value)}
            />

            <label htmlFor={`note-${i}`}>
              Tam / observação <span className="label-leve">(opcional)</span>
            </label>
            <input
              id={`note-${i}`}
              type="text"
              autoComplete="off"
              placeholder="ex: F, medidas pv"
              value={l.note}
              onChange={(e) => mudar(i, 'note', e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="btns">
        <button type="button" className="btn btn-ghost btn-block" onClick={adicionar} disabled={noTeto || enviando}>
          {noTeto ? `Máximo de ${MAX_ITENS} por envio` : '+ adicionar outra peça'}
        </button>
      </div>

      <div className="btns">
        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Mandar pra fila'}
        </button>
      </div>

      <p className="garimpo-conta">
        {linhas.length === 1 ? '1 peça' : `${linhas.length} peças`} nesta leva
      </p>

      {aviso && (
        <div className={`banner banner-${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}
    </form>
  )
}
