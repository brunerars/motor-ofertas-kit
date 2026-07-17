'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '../components/Logo'

export default function Login() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)

    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })

      if (r.ok) {
        // refresh() antes de push() senão o middleware ainda não enxerga o cookie
        // e a home rebate pro login. Sintoma: "a senha certa não entra".
        router.refresh()
        router.push('/')
        return
      }

      const j = (await r.json().catch(() => ({}))) as { erro?: string }
      setErro(
        j.erro === 'muitas_tentativas'
          ? 'Muita tentativa. Espera uns minutos.'
          : 'Senha errada.',
      )
    } catch {
      setErro('Sem conexão. Tenta de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-wrap">
      <Logo />
      <p className="eyebrow">Uso interno</p>
      <h1>A mesa</h1>
      <p className="lead">As peças que o Bruno preparou, prontas pra você conferir e soltar no grupo.</p>

      <form onSubmit={entrar}>
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />

        {erro && (
          <div className="banner banner-err" role="alert">
            {erro}
          </div>
        )}

        <div className="btns">
          <button type="submit" className="btn btn-primary btn-block" disabled={enviando || !senha}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      <footer>
        <span>Nippon Speed Co.</span>
      </footer>
    </main>
  )
}
