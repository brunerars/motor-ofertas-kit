'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Oferta, Status } from '@/lib/baserow'
import { formatarBrl, podeAprovar, precoDivergente } from '@/lib/caption'
import type { Feito } from './FilaLista'
import { Legenda } from './Legenda'

type Modo = 'ver' | 'editando' | 'agendando'

export function Peca({ oferta, aoFazer }: { oferta: Oferta; aoFazer: (f: Feito) => void }) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('ver')
  const [caption, setCaption] = useState(oferta.caption)
  const [tags, setTags] = useState(oferta.tags)
  const [quando, setQuando] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [fotoQuebrou, setFotoQuebrou] = useState(false)

  const incompleta = podeAprovar(oferta)
  const divergente = precoDivergente(oferta)

  async function patch(body: Record<string, unknown>, feito?: Feito) {
    setOcupado(true)
    setErro(null)
    try {
      const r = await fetch(`/api/ofertas/${oferta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { erro?: string; motivo?: string }
        setErro(
          j.motivo ??
            (j.erro === 'baserow_indisponivel'
              ? 'A fila não respondeu. Tenta de novo em um minuto.'
              : 'Não deu pra salvar.'),
        )
        return
      }
      setModo('ver')
      if (feito) {
        // A peça vai sumir da lista. Quem avisa é a lista, não este card.
        aoFazer(feito)
      } else {
        // Edição: o card FICA. Confirma aqui mesmo, senão salvar parece não ter feito nada.
        setSalvo(true)
        setTimeout(() => setSalvo(false), 3000)
        router.refresh()
      }
    } catch {
      setErro('Sem conexão.')
    } finally {
      setOcupado(false)
    }
  }

  const mudarStatus = (status: Status) => patch({ status }, { titulo: oferta.titulo, status })

  return (
    <article className="peca">
      {oferta.fotoUrl && !fotoQuebrou && (
        // <img> e não next/image de propósito: é a MESMA URL pública do Baserow que
        // o WAHA busca pra postar. Se o que o Caio vê aqui passar por um otimizador,
        // ele deixa de ser o que sai no grupo — e o ponto do preview é ser idêntico.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="peca-foto"
          src={oferta.fotoUrl}
          alt={oferta.titulo}
          loading="lazy"
          onError={() => setFotoQuebrou(true)}
        />
      )}
      {fotoQuebrou && (
        // Foto quebrada não é detalhe estético: é a MESMA URL que o WAHA busca pra
        // postar. Se ela não abre, o disparo no grupo também falha. Um retângulo
        // cinza mudo deixaria o Caio decidindo às cegas — e ele julga a peça pela foto.
        //
        // NÃO desabilita o Aprovar: o `onError` também dispara com internet ruim, e
        // travar o botão por causa do 4G do Caio seria alarme falso — o tipo de coisa
        // que ensina a ignorar aviso. Diz o que houve e deixa ele decidir.
        <div className="peca-foto peca-foto-erro">
          <span>
            A foto não abriu aqui. Pode ser a sua internet — tenta recarregar. Se continuar assim, chama o
            Bruno antes de aprovar.
          </span>
        </div>
      )}

      <div className="peca-corpo">
        <div className="peca-topo">
          <h2 className="peca-titulo">{oferta.titulo}</h2>
          {oferta.precoBrl !== null && <span className="peca-preco">{formatarBrl(oferta.precoBrl)}</span>}
        </div>
        <p className="peca-meta">
          Tam: {oferta.tags.trim() || 'único'}
          {' · '}
          <a href={oferta.sourceUrl} target="_blank" rel="noreferrer">
            ver no Mercari
          </a>
        </p>

        {modo === 'ver' && (
          <>
            <Legenda caption={oferta.caption} />

            {divergente && (
              // NÃO bloqueia: mostra os dois números e deixa o humano concluir — a
              // lição do CEO da ARV ("mostrar o dado e deixar o Andre concluir").
              // Bloquear aqui também erraria: promoção legítima ("de X por Y") tem
              // dois preços e viraria alarme falso, que treina a ignorar o aviso.
              <div className="banner banner-warn" role="alert">
                O valor aqui em cima é <strong>{formatarBrl(oferta.precoBrl)}</strong>, mas na legenda está{' '}
                <strong>{divergente.map((p) => formatarBrl(p)).join(' e ')}</strong>.{' '}
                <strong>Vale o da legenda</strong> — é ela que sai no grupo. Se não for isso, fala com o Bruno.
              </div>
            )}

            {incompleta && (
              <div className="banner banner-warn" role="status">
                {incompleta}
              </div>
            )}
            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}
            {salvo && (
              <div className="banner banner-ok" role="status">
                Salvo.
              </div>
            )}

            <div className="btns">
              <button
                className="btn btn-primary"
                disabled={ocupado || Boolean(incompleta)}
                onClick={() => mudarStatus('Aprovado')}
              >
                Aprovar
              </button>
              <button className="btn" disabled={ocupado} onClick={() => setModo('editando')}>
                Editar
              </button>
              <button
                className="btn"
                disabled={ocupado || Boolean(incompleta)}
                onClick={() => setModo('agendando')}
              >
                Agendar
              </button>
              <button className="btn btn-ghost" disabled={ocupado} onClick={() => mudarStatus('Descartado')}>
                Descartar
              </button>
            </div>
          </>
        )}

        {modo === 'editando' && (
          <>
            <label htmlFor={`cap-${oferta.id}`}>Legenda (sai assim no grupo)</label>
            <textarea
              id={`cap-${oferta.id}`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <label htmlFor={`tam-${oferta.id}`}>Tam / observação</label>
            <input
              id={`tam-${oferta.id}`}
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="único"
            />

            <Legenda caption={caption} />

            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}

            <div className="btns">
              <button className="btn btn-primary" disabled={ocupado} onClick={() => patch({ caption, tags })}>
                {ocupado ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                className="btn"
                disabled={ocupado}
                onClick={() => {
                  setCaption(oferta.caption)
                  setTags(oferta.tags)
                  setErro(null)
                  setModo('ver')
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {modo === 'agendando' && (
          <>
            <label htmlFor={`dt-${oferta.id}`}>Sai quando?</label>
            <input
              id={`dt-${oferta.id}`}
              type="datetime-local"
              value={quando}
              onChange={(e) => setQuando(e.target.value)}
            />
            <p className="peca-meta">O disparo confere a fila a cada 30 min, então pode sair um pouco depois.</p>

            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}

            <div className="btns">
              <button
                className="btn btn-primary"
                disabled={ocupado || !quando}
                onClick={() =>
                  patch(
                    { status: 'Agendado' satisfies Status, scheduled_at: quando },
                    { titulo: oferta.titulo, status: 'Agendado' },
                  )
                }
              >
                Agendar
              </button>
              <button className="btn" disabled={ocupado} onClick={() => { setErro(null); setModo('ver') }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  )
}
