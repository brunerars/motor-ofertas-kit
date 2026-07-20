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
    // ⚠️ ESTA FRASE DIZIA "só a legenda é com o Bruno — ele escreve quando
    // preparar a peça", e virou MENTIRA em 20/07: com o japonês na tela, o Caio
    // escreve a legenda sozinho se quiser. Não é detalhe de texto — o card
    // passou a dizer três coisas contraditórias de uma vez (aqui, no aviso de
    // incompleta e no bloco do japonês), e quem lê isso não sabe se pode agir.
    //
    // Agora é NEUTRO: constata o que falta, sem atribuir dono. Quem oferece o
    // caminho é o bloco do japonês (uma vez só, no lugar certo).
    return (
      <div className="legenda-preview">
        <span className="cta">A legenda ainda não foi escrita.</span>
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
