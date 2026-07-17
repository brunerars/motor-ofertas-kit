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
    // A legenda é MESMO do Bruno (o /agenda traduz e monta), então esta frase
    // continua verdadeira. O "só ela" é que passou a importar: agora que a peça
    // crua aparece na fila, o Caio precisa saber que o resto do card é dele —
    // senão lê "o Bruno tá escrevendo" e conclui que não há nada a fazer, que é
    // exatamente o problema que trouxe a peça pra cá.
    return (
      <div className="legenda-preview">
        <span className="cta">Só a legenda é com o Bruno — ele escreve quando preparar a peça.</span>
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
