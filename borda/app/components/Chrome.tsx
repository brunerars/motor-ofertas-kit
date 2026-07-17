import Link from 'next/link'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export type Aba = 'fila' | 'agenda' | 'vendidos'

/**
 * Navegação por PAPEL: as três coisas que o Caio faz. Não é menu de sistema,
 * não tem "configurações", não tem pasta. Se um item novo não for algo que ele
 * FAZ, ele não entra aqui.
 */
export function Topo({ atual, naFila }: { atual: Aba; naFila: number }) {
  const abas: { id: Aba; href: string; nome: string; badge?: number }[] = [
    { id: 'fila', href: '/', nome: 'Fila', badge: naFila || undefined },
    { id: 'agenda', href: '/agenda', nome: 'No ar' },
    { id: 'vendidos', href: '/vendidos', nome: 'Saiu do Mercari' },
  ]

  return (
    <>
      <header className="top">
        <Logo />
        <ThemeToggle />
      </header>
      <nav className="abas" aria-label="Seções">
        {abas.map((a) => (
          <Link key={a.id} href={a.href} aria-current={a.id === atual ? 'page' : undefined}>
            {a.nome}
            {a.badge ? <span className="badge">{a.badge}</span> : null}
          </Link>
        ))}
      </nav>
    </>
  )
}

export function Rodape({ garimpoUrl }: { garimpoUrl: string | null }) {
  return (
    <footer>
      <span>Nippon Speed Co. · canal interno</span>
      {garimpoUrl && (
        // Link, não cópia: o form está no ar e testado desde 15/07. Reconstruir
        // seria arriscar a única coisa que já roda. A v2 absorve.
        <a href={garimpoUrl} target="_blank" rel="noreferrer">
          Mandar links →
        </a>
      )}
    </footer>
  )
}
