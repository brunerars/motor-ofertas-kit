import { listarOfertas } from '@/lib/baserow'
import { getLoja } from '@/lib/loja'
import { Rodape, Topo } from './components/Chrome'
import { FilaLista } from './components/FilaLista'

export const dynamic = 'force-dynamic'

export default async function Fila() {
  const loja = await getLoja()

  let ofertas
  try {
    ofertas = await listarOfertas()
  } catch {
    return (
      <main className="wrap">
        <Topo atual="fila" naFila={0} />
        <div className="banner banner-err" role="alert">
          A fila não respondeu agora. Não é você — o Bruno já vai ver. Tenta daqui a pouco.
        </div>
        <Rodape garimpoUrl={loja.garimpoUrl} />
      </main>
    )
  }

  // Só o que o /agenda já enriqueceu. O rascunho cru que vem do form nasce com
  // title_pt = o próprio mXXXX e sem foto: mostrar isso pro Caio é mostrar lixo.
  const fila = ofertas.filter((o) => o.status === 'Fila' && o.enriquecida)
  const chegando = ofertas.filter((o) => o.status === 'Fila' && !o.enriquecida).length

  return (
    <main className="wrap">
      <Topo atual="fila" naFila={fila.length} />

      <p className="eyebrow">Pra conferir</p>
      <h1>A fila</h1>
      <p className="lead">
        Confere o preço e a legenda. <strong>Aprovar</strong> solta na próxima janela;{' '}
        <strong>agendar</strong> escolhe a hora.
      </p>

      <FilaLista ofertas={fila} chegando={chegando} />

      <Rodape garimpoUrl={loja.garimpoUrl} />
    </main>
  )
}
