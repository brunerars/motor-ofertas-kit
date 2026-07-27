'use client'

/**
 * Tema claro/escuro. O Caio trabalha muito à noite.
 * Chave `nsc-tema` — a MESMA do garimpo/index.html, então a escolha dele
 * atravessa as duas páginas. Trocar a chave quebra essa continuidade.
 * Quem aplica no primeiro paint é o script inline do layout (evita o flash).
 */
export function ThemeToggle() {
  function alternar() {
    const raiz = document.documentElement
    const novo = raiz.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    raiz.setAttribute('data-theme', novo)
    try {
      localStorage.setItem('nsc-tema', novo)
    } catch {
      // Safari em aba privada joga aqui. O tema só não persiste; nada quebra.
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternar}
      aria-label="Alternar tema claro e escuro"
      title="Tema claro/escuro"
    >
      <svg className="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg className="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  )
}
