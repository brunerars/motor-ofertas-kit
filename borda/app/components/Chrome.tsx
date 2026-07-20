import Link from 'next/link'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export type Aba = 'fila' | 'agenda' | 'vendidos' | 'garimpar'

/**
 * Navegação por PAPEL: as coisas que o Caio faz. Não é menu de sistema, não tem
 * "configurações", não tem pasta. Se um item novo não for algo que ele FAZ, ele
 * não entra aqui.
 *
 * "Garimpar" entrou em 17/07 por esse mesmo princípio: mandar link É o que ele
 * faz — era só a única dessas ações que morava num site à parte. As 3 primeiras
 * são ESTADO (onde a peça está); a 4ª é ENTRADA, por isso vem no fim.
 */
export function Topo({ atual, naFila }: { atual: Aba; naFila: number }) {
  const abas: { id: Aba; href: string; nome: string; badge?: number }[] = [
    { id: 'fila', href: '/', nome: 'Fila', badge: naFila || undefined },
    { id: 'agenda', href: '/agenda', nome: 'No ar' },
    { id: 'vendidos', href: '/vendidos', nome: 'Saiu do Mercari' },
    // Sem badge: badge conta coisa esperando ação, e aqui nunca há nada esperando.
    { id: 'garimpar', href: '/garimpar', nome: 'Garimpar' },
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

/**
 * O "Mandar links →" SAIU daqui em 17/07, junto com a chegada da aba Garimpar.
 *
 * O form standalone (`garimpo-nsc.vercel.app`) continua NO AR como fallback — a
 * decisão do Bruno foi não aposentar nem ele nem o webhook do n8n. O que saiu foi
 * o LINK: com a aba no topo, dois pontos de entrada pra mesma ação dentro do mesmo
 * app é a bagunça de "aditivo sem aposentar nada". O fallback segue acessível pela
 * URL direta, que é o que fallback precisa ser.
 *
 * `loja.garimpoUrl` continua existindo de propósito: é ele que guarda o endereço
 * do fallback por loja, e é o que a v2 apaga quando o standalone for desligado.
 */
export function Rodape() {
  return (
    <footer>
      <span>Nippon Speed Co. · canal interno</span>
    </footer>
  )
}
