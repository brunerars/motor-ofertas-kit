import type { Oferta } from '@/lib/baserow'
import { formatarBrl } from '@/lib/caption'
import { horaBR } from '@/lib/hora'

/**
 * Card read-only ("No ar" / "Saiu do Mercari"). Depois de aprovada, a peça é do
 * cron — o Caio olha, não mexe.
 */

// `horaBR` fixa o fuso da loja. Isto aqui é RSC: sem ele, o Vercel (UTC) mostrava
// "Saiu 03:41" pra um post das 00:41. Ver lib/hora.ts.
function quandoSai(o: Oferta): string {
  // A UI absorve a incerteza em vez de fingir precisão.
  //
  // O cron roda a cada 30min, e existe um modo de falha real: envio lento estoura
  // o timeout, o post SAI no grupo mas a linha não vira `Disparado`. Um status cru
  // dizendo "Aprovado" viraria mentira — o Caio re-aprovaria ou ligaria em pânico.
  // Falar em janela, e não em estado, é honesto nos dois casos.
  if (o.status === 'Aprovado') return 'Sai na próxima janela (até 30 min)'
  if (o.status === 'Agendado' && o.scheduledAt) return `Marcado pra ${horaBR(o.scheduledAt)}`
  if (o.status === 'Agendado') return 'Agendado'
  if (o.status === 'Disparado' && o.postedAt) return `Saiu ${horaBR(o.postedAt)}`
  return 'Já saiu no grupo'
}

const SELO: Record<string, string> = {
  Fila: 'selo-fila',
  Aprovado: 'selo-aprovado',
  Agendado: 'selo-agendado',
  Disparado: 'selo-disparado',
}

export function PecaLida({ oferta, acao }: { oferta: Oferta; acao?: React.ReactNode }) {
  return (
    <article className="peca">
      <div className="peca-cab">
        {oferta.fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="peca-foto" src={oferta.fotoUrl} alt={oferta.titulo} loading="lazy" />
        )}
        <div className="peca-cab-texto">
          <div className="peca-topo">
            <h2 className="peca-titulo">{oferta.titulo}</h2>
            {oferta.precoBrl !== null && <span className="peca-preco">{formatarBrl(oferta.precoBrl)}</span>}
          </div>
          {/* O link + o contador vêm ANTES do selo: são o que faz o Caio agir.
              "Saiu do Mercari" sem o link do Mercari pede que ele adivinhe qual
              anúncio conferir; e sem saber se alguém quis a peça, ele confere no
              escuro. Juntos viram o controle semi-automático: tem gente querendo →
              abre o anúncio → marca se sumiu. */}
          {(oferta.qtdLeads > 0 || oferta.sourceUrl) && (
            <p className="peca-meta" style={{ marginTop: 10 }}>
              {oferta.qtdLeads > 0 && (
                <>
                  {/* Só o NÚMERO. Quem é a pessoa não passa do servidor — ver paraBorda(). */}
                  <strong className="querem">
                    {oferta.qtdLeads === 1 ? '1 quer essa' : `${oferta.qtdLeads} querem essa`}
                  </strong>
                  {oferta.sourceUrl && ' · '}
                </>
              )}
              {/* `txt()` devolve '' e nunca null: sem a guarda vira <a href=""> apontando
                  pra própria página. O Peca.tsx tem esse bug latente; não herdar. */}
              {oferta.sourceUrl && (
                <a href={oferta.sourceUrl} target="_blank" rel="noreferrer">
                  ver no Mercari
                </a>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="peca-corpo">
        <p className="peca-meta" style={{ marginTop: 12 }}>
          <span className={`selo ${SELO[oferta.status] ?? 'selo-fila'}`}>{quandoSai(oferta)}</span>
        </p>
        {acao}
      </div>
    </article>
  )
}
