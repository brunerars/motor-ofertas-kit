import { listarOfertas } from '@/lib/baserow'
import { Rodape, Topo } from './components/Chrome'
import { FilaLista } from './components/FilaLista'

export const dynamic = 'force-dynamic'

export default async function Fila() {

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
        <Rodape />
      </main>
    )
  }

  // TUDO que está na Fila, inclusive o rascunho cru que o /agenda ainda não tocou.
  //
  // Antes escondia as cruas ("mostrar isso pro Caio é mostrar lixo") e contava
  // como "1 peça chegando". O custo disso apareceu na #31 real: o Caio mandou o
  // "Boné Ferrari 1997" e ESQUECEU O PREÇO. Sem preço não há legenda, então a peça
  // não podia ser aprovada; o /agenda também segura nesse caso; e ela estava
  // invisível justo pra única pessoa capaz de resolver — quem digitou.
  // Rascunho cru não é lixo: é o formulário dele esperando conserto.
  const fila = ofertas.filter((o) => o.status === 'Fila')

  return (
    <main className="wrap">
      <Topo atual="fila" naFila={fila.length} />

      <p className="eyebrow">Pra conferir</p>
      <h1>A fila</h1>
      <p className="lead">
        Confere o preço e a legenda. <strong>Aprovar</strong> solta na próxima janela;{' '}
        <strong>agendar</strong> escolhe a hora.
      </p>

      <FilaLista ofertas={fila} />

      <Rodape />
    </main>
  )
}
