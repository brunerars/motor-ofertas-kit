import { parseCaption } from '@/lib/caption'

/**
 * O preview da legenda. É o que VAI SAIR no grupo, com o negrito renderizado
 * como o app do WhatsApp renderiza. O Caio aprova o que vê.
 *
 * Segmentos em vez de dangerouslySetInnerHTML: a legenda é texto editável, e
 * injetar HTML nela seria XSS de graça.
 */
export function Legenda({ caption }: { caption: string }) {
  if (!caption.trim()) {
    return (
      <div className="legenda-preview">
        <span className="cta">Sem legenda ainda. O Bruno tá escrevendo.</span>
      </div>
    )
  }

  return (
    <div className="legenda-preview">
      {parseCaption(caption).map((s, i) =>
        s.negrito ? <strong key={i}>{s.texto}</strong> : <span key={i}>{s.texto}</span>,
      )}
    </div>
  )
}
