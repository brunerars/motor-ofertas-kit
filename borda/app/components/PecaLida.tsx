import type { Oferta } from '@/lib/baserow'
import { formatarBrl } from '@/lib/caption'

/**
 * Card read-only ("No ar" / "Saiu do Mercari"). Depois de aprovada, a peça é do
 * cron — o Caio olha, não mexe.
 */

function quandoSai(o: Oferta): string {
  // A UI absorve a incerteza em vez de fingir precisão.
  //
  // O cron roda a cada 30min, e existe um modo de falha real: envio lento estoura
  // o timeout, o post SAI no grupo mas a linha não vira `Disparado`. Um status cru
  // dizendo "Aprovado" viraria mentira — o Caio re-aprovaria ou ligaria em pânico.
  // Falar em janela, e não em estado, é honesto nos dois casos.
  if (o.status === 'Aprovado') return 'Sai na próxima janela (até 30 min)'
  if (o.status === 'Agendado' && o.scheduledAt) {
    const d = new Date(o.scheduledAt)
    return `Marcado pra ${d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
  }
  if (o.status === 'Agendado') return 'Agendado'
  if (o.status === 'Disparado' && o.postedAt) {
    const d = new Date(o.postedAt)
    return `Saiu ${d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
  }
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
      {oferta.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="peca-foto" src={oferta.fotoUrl} alt={oferta.titulo} loading="lazy" />
      )}
      <div className="peca-corpo">
        <div className="peca-topo">
          <h2 className="peca-titulo">{oferta.titulo}</h2>
          {oferta.precoBrl !== null && <span className="peca-preco">{formatarBrl(oferta.precoBrl)}</span>}
        </div>
        <p className="peca-meta" style={{ marginTop: 10 }}>
          <span className={`selo ${SELO[oferta.status] ?? 'selo-fila'}`}>{quandoSai(oferta)}</span>
        </p>
        {acao}
      </div>
    </article>
  )
}
