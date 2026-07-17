import { listarOfertas } from '@/lib/baserow'
import { getLoja } from '@/lib/loja'
import { Rodape, Topo } from '../components/Chrome'
import { PecaLida } from '../components/PecaLida'

export const dynamic = 'force-dynamic'

export default async function NoAr() {
  const loja = await getLoja()

  let ofertas
  try {
    ofertas = await listarOfertas()
  } catch {
    return (
      <main className="wrap">
        <Topo atual="agenda" naFila={0} />
        <div className="banner banner-err" role="alert">
          A fila não respondeu agora. Não é você — o Bruno já vai ver.
        </div>
        <Rodape garimpoUrl={loja.garimpoUrl} />
      </main>
    )
  }

  const naFila = ofertas.filter((o) => o.status === 'Fila' && o.enriquecida).length
  const esperando = ofertas.filter((o) => o.status === 'Aprovado' || o.status === 'Agendado')
  const sairam = ofertas
    .filter((o) => o.status === 'Disparado')
    .sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''))

  // Sinal honesto de que o disparo pode estar parado. O WAHA é frágil por natureza
  // (o WEBJS quebrou o refreshQR em 16/07) e o ban do número é questão de quando,
  // não de se. Quando isso acontece, a fila enche de "Aprovado" e trava sem motivo
  // visível. Um aviso vago é melhor que um silêncio que parece bug da borda.
  const travado = esperando.filter((o) => o.status === 'Aprovado').length >= 4

  return (
    <main className="wrap">
      <Topo atual="agenda" naFila={naFila} />

      <p className="eyebrow">Depois de aprovar</p>
      <h1>No ar</h1>
      <p className="lead">O que já está a caminho do grupo e o que já saiu. Daqui pra frente é automático.</p>

      {travado && (
        <div className="banner banner-warn" role="status">
          Tem bastante coisa esperando pra sair. Se continuar assim na próxima hora, chama o Bruno.
        </div>
      )}

      {esperando.length === 0 && sairam.length === 0 ? (
        <div className="vazio">
          <h2>Nada no ar</h2>
          <p>Quando você aprovar uma peça na fila, ela aparece aqui.</p>
        </div>
      ) : (
        <>
          {esperando.length > 0 && (
            <>
              <p className="eyebrow">A caminho</p>
              <div className="pecas">
                {esperando.map((o) => (
                  <PecaLida key={o.id} oferta={o} />
                ))}
              </div>
            </>
          )}

          {sairam.length > 0 && (
            <>
              <p className="eyebrow">Já saiu</p>
              <div className="pecas">
                {sairam.map((o) => (
                  <PecaLida key={o.id} oferta={o} />
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
