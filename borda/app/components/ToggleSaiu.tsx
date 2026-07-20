'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Marca que o anúncio SUMIU DO MERCARI — não que o cliente comprou.
 *
 * Os dois se chamam "vendido" no vocabulário do projeto e são quase opostos no
 * modelo sob encomenda da NSC: a peça sumir do Mercari significa que alguém LÁ
 * comprou antes, ou seja, é PROBLEMA. Quem diz que o cliente comprou é a LEADS
 * (status Fechado), e ela tem PII — fica pra v2.
 *
 * Isto é o /confere-ofertas na mão: ele está 100% no papel desde 02/07 e a doc
 * dele ainda fala de Z-API (morta em 16/07). Um toggle entrega o valor hoje por
 * ~zero e não finge automação que não existe.
 */
export function ToggleSaiu({ id, sold }: { id: number; sold: boolean }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(false)

  async function alternar() {
    setOcupado(true)
    setErro(false)
    try {
      const r = await fetch(`/api/ofertas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sold: !sold }),
      })
      if (!r.ok) setErro(true)
      else router.refresh()
    } catch {
      setErro(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <div className="btns">
        <button className={sold ? 'btn' : 'btn btn-ghost'} disabled={ocupado} onClick={alternar}>
          {sold ? 'Ainda está lá' : 'Sumiu do Mercari'}
        </button>
      </div>
      {erro && (
        <div className="banner banner-err" role="alert">
          Não deu pra salvar. Tenta de novo.
        </div>
      )}
    </>
  )
}
