import { listarOfertas } from '@/lib/baserow'
import { Rodape, Topo } from '../components/Chrome'
import { GarimpoForm } from '../components/GarimpoForm'

export const dynamic = 'force-dynamic'

export default async function Garimpar() {
  // O badge da Fila é enfeite AQUI — a tela não depende dele pra funcionar. Por
  // isso a leitura falha em silêncio (0) em vez de virar tela de erro: o Baserow
  // fora do ar não pode impedir o Caio de VER o form. O envio, esse sim, precisa
  // do Baserow, e a rota diz o que houve quando ele apertar Mandar.
  let naFila = 0
  try {
    naFila = (await listarOfertas()).filter((o) => o.status === 'Fila').length
  } catch {
    naFila = 0
  }

  return (
    <main className="wrap">
      <Topo atual="garimpar" naFila={naFila} />

      <p className="eyebrow">Achou no Mercari</p>
      <h1>Garimpar</h1>
      <p className="lead">
        Cola o link, o título e o valor. Pode mandar <strong>quantas quiser de uma vez</strong>. O campo{' '}
        <strong>Tam / observação</strong> sai na oferta logo depois de &ldquo;Tam:&rdquo; — põe o tamanho, medida ou
        detalhe da peça. Vazio vira &ldquo;único&rdquo;.
      </p>

      <GarimpoForm />

      <Rodape />
    </main>
  )
}
