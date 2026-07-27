/**
 * Lockup oficial (kit da marca: disco #e60000, ponto quadrado).
 * Markup idêntico ao garimpo/index.html:151 — não redesenhar: o Caio navega
 * entre as duas páginas e tem que ser a mesma casa.
 */
export function Logo() {
  return (
    <span className="logo-h" aria-label="Nippon Speed Co.">
      Nippon
      <span className="lg-disc" />
      Speed Co
      <span className="lg-sq" />
    </span>
  )
}
