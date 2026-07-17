import { listarOfertas } from '@/lib/baserow'
import { getLoja } from '@/lib/loja'
import { Rodape, Topo } from '../components/Chrome'
import { PecaLida } from '../components/PecaLida'
import { ToggleSaiu } from '../components/ToggleSaiu'

export const dynamic = 'force-dynamic'

/**
 * "Saiu do Mercari" — nome honesto, e é de propósito.
 *
 * O campo se chama `sold` e o status se chama `Vendido`, mas os dois significam
 * "o anúncio sumiu do Mercari", não "o cliente comprou". No modelo sob encomenda
 * isso quase se opõe: sumir de lá é problema, porque a peça foi vendida pra outra
 * pessoa e a NSC não consegue mais comprar. Chamar essa aba de "Vendidos" seria
 * mentir pro Caio na palavra que mais importa pra ele.
 */
export default async function SaiuDoMercari() {
  const loja = await getLoja()

  let ofertas
  try {
    ofertas = await listarOfertas()
  } catch {
    return (
      <main className="wrap">
        <Topo atual="vendidos" naFila={0} />
        <div className="banner banner-err" role="alert">
          A fila não respondeu agora. Não é você — o Bruno já vai ver.
        </div>
        <Rodape garimpoUrl={loja.garimpoUrl} />
      </main>
    )
  }

  const naFila = ofertas.filter((o) => o.status === 'Fila' && o.enriquecida).length
  const noGrupo = ofertas.filter((o) => o.status === 'Disparado' || o.status === 'Vendido')
  const sumiram = noGrupo.filter((o) => o.sold || o.status === 'Vendido')
  const vivas = noGrupo.filter((o) => !o.sold && o.status !== 'Vendido')

  return (
    <main className="wrap">
      <Topo atual="vendidos" naFila={naFila} />

      <p className="eyebrow">Controle do garimpo</p>
      <h1>Saiu do Mercari</h1>
      <p className="lead">
        Peças que já foram pro grupo. Se alguém <strong>lá no Japão</strong> comprou antes da gente,
        marca aqui — assim ninguém promete o que não dá pra buscar.
      </p>

      {vivas.length === 0 && sumiram.length === 0 ? (
        <div className="vazio">
          <h2>Nada no grupo ainda</h2>
          <p>As peças aparecem aqui depois que saem no grupo.</p>
        </div>
      ) : (
        <>
          {vivas.length > 0 && (
            <>
              <p className="eyebrow">Ainda dá pra buscar</p>
              <div className="pecas">
                {vivas.map((o) => (
                  <PecaLida key={o.id} oferta={o} acao={<ToggleSaiu id={o.id} sold={o.sold} />} />
                ))}
              </div>
            </>
          )}

          {sumiram.length > 0 && (
            <>
              <p className="eyebrow">Já foram</p>
              <div className="pecas">
                {sumiram.map((o) => (
                  <PecaLida key={o.id} oferta={o} acao={<ToggleSaiu id={o.id} sold={o.sold} />} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Rodape garimpoUrl={loja.garimpoUrl} />
    </main>
  )
}
