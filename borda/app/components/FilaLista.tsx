'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Oferta, Status } from '@/lib/baserow'
import { Peca } from './Peca'

export type Feito = { titulo: string; status: Status }

/**
 * A lista da Fila.
 *
 * Existe por causa de um bug de PRODUTO, não de código: quando o Bruno aprovou a
 * primeira peça de verdade, o card **sumiu calado** (ela saiu do filtro `Fila`),
 * a tela ficou vazia e ele concluiu — com toda a razão — que a borda tinha
 * quebrado. O PATCH tinha dado 200.
 *
 * O gate do projeto é "o Caio aprova e NÃO pergunta nada". Ele perguntou. Uma
 * ação que dá certo e não deixa rastro é indistinguível de uma que falhou.
 * Por isso a lista guarda o que acabou de sair e diz o que aconteceu.
 */
export function FilaLista({ ofertas, chegando }: { ofertas: Oferta[]; chegando: number }) {
  const router = useRouter()
  const [feitos, setFeitos] = useState<Feito[]>([])

  function aoFazer(f: Feito) {
    setFeitos((atual) => [f, ...atual])
    router.refresh()
  }

  const vazia = ofertas.length === 0

  return (
    <>
      {feitos.map((f, i) => (
        <div key={i} className={`banner ${f.status === 'Descartado' ? 'banner-info' : 'banner-ok'}`} role="status">
          {f.status === 'Aprovado' && <><strong>{f.titulo}</strong> aprovado. Sai no grupo na próxima janela, até 30 min.</>}
          {f.status === 'Agendado' && <><strong>{f.titulo}</strong> agendado. Aparece em <strong>No ar</strong>.</>}
          {f.status === 'Descartado' && <><strong>{f.titulo}</strong> descartado. Não vai pro grupo.</>}
        </div>
      ))}

      {chegando > 0 && (
        <div className="banner banner-info" role="status">
          {chegando === 1 ? '1 peça chegando' : `${chegando} peças chegando`} — o Bruno tá preparando.
        </div>
      )}

      {vazia ? (
        <div className="vazio">
          <h2>{feitos.length ? 'Fila limpa' : 'Nada pra conferir'}</h2>
          <p>
            {feitos.length
              ? 'Você conferiu tudo. O que saiu daqui está em No ar.'
              : 'Quando o Bruno preparar as peças, elas aparecem aqui.'}
          </p>
        </div>
      ) : (
        <div className="pecas">
          {ofertas.map((o) => (
            <Peca key={o.id} oferta={o} aoFazer={aoFazer} />
          ))}
        </div>
      )}
    </>
  )
}
