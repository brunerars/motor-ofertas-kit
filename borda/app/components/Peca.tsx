'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Oferta, Status } from '@/lib/baserow'
import { formatarBrl, lerPrecoBrl, modeloLegenda, podeAprovar, precoDivergente, tituloDivergente } from '@/lib/caption'
import type { Feito } from './FilaLista'
import { Legenda } from './Legenda'

type Modo = 'ver' | 'editando' | 'agendando'

/** Número → o que se digita num campo de preço ("770" · "480,5"). */
function paraCampo(v: number | null): string {
  return v === null ? '' : String(v).replace('.', ',')
}

export function Peca({
  oferta,
  aoFazer,
  waNumero,
}: {
  oferta: Oferta
  aoFazer: (f: Feito) => void
  waNumero: string
}) {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('ver')
  const [titulo, setTitulo] = useState(oferta.titulo)
  const [preco, setPreco] = useState(paraCampo(oferta.precoBrl))
  const [caption, setCaption] = useState(oferta.caption)
  const [tags, setTags] = useState(oferta.tags)
  const [quando, setQuando] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [fotoQuebrou, setFotoQuebrou] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const incompleta = podeAprovar(oferta)
  const divergente = precoDivergente(oferta)
  const tituloTorto = tituloDivergente(oferta)

  async function patch(body: Record<string, unknown>, feito?: Feito) {
    setOcupado(true)
    setErro(null)
    try {
      const r = await fetch(`/api/ofertas/${oferta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { erro?: string; motivo?: string }
        setErro(
          j.motivo ??
            (j.erro === 'baserow_indisponivel'
              ? 'A fila não respondeu. Tenta de novo em um minuto.'
              : 'Não deu pra salvar.'),
        )
        return
      }
      setModo('ver')
      if (feito) {
        // A peça vai sumir da lista. Quem avisa é a lista, não este card.
        aoFazer(feito)
      } else {
        // Edição: o card FICA. Confirma aqui mesmo, senão salvar parece não ter feito nada.
        setSalvo(true)
        setTimeout(() => setSalvo(false), 3000)
        router.refresh()
      }
    } catch {
      setErro('Sem conexão.')
    } finally {
      setOcupado(false)
    }
  }

  const mudarStatus = (status: Status) => patch({ status }, { titulo: oferta.titulo, status })

  /**
   * A legenda no formato padrão, dos campos ATUAIS (o Caio pode ter mexido no
   * título/preço/Tam antes de gerar). Emoji, negrito, espaçamento e o CTA do
   * WhatsApp vêm prontos — ele só troca o que é dele. Não traduz nada.
   */
  function montarModelo() {
    const lido = lerPrecoBrl(preco)
    setCaption(
      modeloLegenda(
        {
          titulo: titulo.trim(),
          mercariId: oferta.mercariId,
          precoBrl: lido.ok ? lido.valor : oferta.precoBrl,
          tags: tags.trim(),
        },
        waNumero,
      ),
    )
  }

  /**
   * Entra no Editar já com a moldura montada quando ainda não há legenda — é o
   * "sempre no jeito" que o Bruno pediu: o Caio abre e o padrão está lá, só faltando
   * o que é dele. Legenda existente NÃO é sobrescrita (o botão "Montar no modelo"
   * faz isso de propósito).
   */
  function editar() {
    if (!caption.trim()) montarModelo()
    setModo('editando')
  }

  /**
   * Busca os dados do anúncio (foto + japonês). É a METADE MECÂNICA do que o
   * /agenda faz — nada de tradução nem legenda, isso continua com o Bruno.
   */
  async function enriquecer() {
    setBuscando(true)
    setErro(null)
    try {
      const r = await fetch(`/api/ofertas/${oferta.id}/enriquecer`, { method: 'POST' })
      const j = (await r.json().catch(() => ({}))) as { erro?: string; motivo?: string; fotoFalhou?: boolean }
      if (!r.ok) {
        setErro(j.motivo ?? 'Não deu pra buscar os dados agora. Tenta de novo em instantes.')
        return
      }
      if (j.fotoFalhou) {
        // Os dados vieram, a foto não. Dizer isso é melhor que um "pronto!" que
        // deixa ele procurando uma foto que não chegou.
        setErro('Peguei os dados, mas a foto não veio. Dá pra tentar de novo.')
      }
      router.refresh()
    } catch {
      setErro('Sem conexão.')
    } finally {
      setBuscando(false)
    }
  }

  async function copiarJa() {
    try {
      await navigator.clipboard.writeText(oferta.tituloJa)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Clipboard bloqueado (contexto inseguro, permissão negada). O texto está na
      // tela e dá pra selecionar na mão — não vale virar erro vermelho por isso.
    }
  }

  function salvarEdicao() {
    const t = titulo.trim()
    if (!t) {
      setErro('O título não pode ficar vazio.')
      return
    }

    // Lê o R$ com a MESMA regra do form do garimpo (lerPrecoBrl espelha o parseBRL
    // do webhook). Campo vazio = limpar o preço de propósito, não é erro: volta pra
    // "falta o preço" e a peça deixa de poder ser aprovada, que é o correto.
    const lido = lerPrecoBrl(preco)
    if (!lido.ok && lido.erro !== 'vazio') {
      setErro(
        lido.erro === 'iene'
          ? 'Esse valor está em iene. Põe em real — o preço que a gente cobra já inclui o frete do Japão e os impostos.'
          : 'Não entendi o valor. Escreve assim: 750,00',
      )
      return
    }

    patch({ title_pt: t, price_brl: lido.ok ? lido.valor : null, caption, tags })
  }

  return (
    <article className="peca">
      <div className="peca-cab">
        {oferta.fotoUrl && !fotoQuebrou && (
          // <img> e não next/image de propósito: é a MESMA URL pública do Baserow que
          // o WAHA busca pra postar. Se o que o Caio vê aqui passar por um otimizador,
          // ele deixa de ser o que sai no grupo — e o ponto do preview é ser idêntico.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="peca-foto"
            src={oferta.fotoUrl}
            alt={oferta.titulo}
            loading="lazy"
            onError={() => setFotoQuebrou(true)}
          />
        )}
        {/* Nos dois estados abaixo a miniatura só ROTULA; quem explica é o banner no
            corpo. Uma caixa de 72px não comporta frase, e a frase é o que importa. */}
        {!oferta.fotoUrl && <div className="peca-foto peca-foto-vazia">sem foto</div>}
        {fotoQuebrou && <div className="peca-foto peca-foto-erro">não abriu</div>}

        <div className="peca-cab-texto">
          <div className="peca-topo">
            <h2 className="peca-titulo">{oferta.titulo}</h2>
            {oferta.precoBrl !== null && <span className="peca-preco">{formatarBrl(oferta.precoBrl)}</span>}
          </div>
          <p className="peca-meta">
            Tam: {oferta.tags.trim() || 'único'}
            {/* `txt()` devolve '' e nunca null → sem esta guarda vira <a href="">, que
                recarrega a própria página e parece que o link do Mercari quebrou. */}
            {oferta.sourceUrl && (
              <>
                {' · '}
                <a href={oferta.sourceUrl} target="_blank" rel="noreferrer">
                  ver no Mercari
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="peca-corpo">
        {!oferta.fotoUrl && (
          // Rascunho cru. O texto ANTIGO dizia "a foto vem quando o Bruno preparar
          // a peça" — virou mentira em 20/07: agora o próprio Caio busca. Deixar a
          // frase velha ensinaria ele a esperar por algo que está a um toque.
          // `-info` e não `-warn`: não há nada errado, só falta uma etapa.
          <div className="banner banner-info">
            <p>Essa peça ainda está crua — sem foto e sem o texto do anúncio.</p>
            <div className="btns">
              <button className="btn" disabled={buscando || ocupado} onClick={enriquecer}>
                {buscando ? 'Buscando… demora uns segundos' : 'Buscar do Mercari'}
              </button>
            </div>
          </div>
        )}

        {/* O japonês só aparece DEPOIS de buscar, e só pra peça que ainda não tem
            legenda: com a legenda escrita ele já cumpriu o papel e vira ruído.
            É o insumo do Caio — com ele na tela, quem não quer esperar o /agenda
            traduz e escreve a legenda no Editar. */}
        {oferta.tituloJa && !oferta.caption.trim() && (
          <div className="banner banner-info">
            <p className="ja-rotulo">Do anúncio, em japonês</p>
            <p className="ja-texto" lang="ja">
              {oferta.tituloJa}
            </p>
            {oferta.condicao && (
              <p className="ja-cond" lang="ja">
                {oferta.condicao}
              </p>
            )}
            <div className="btns">
              <button className="btn" onClick={copiarJa}>
                {copiado ? 'Copiado!' : 'Copiar o título'}
              </button>
            </div>
            {/* Sem "ou esperar o Bruno" aqui: quem diz isso é o aviso de legenda
                faltando, logo abaixo. Repetir a escolha em dois lugares foi o que
                deixou o card dizendo três coisas ao mesmo tempo. Este bloco tem
                UM trabalho: entregar o texto cru e dizer o que fazer com ele. */}
            <p className="ja-dica">
              Dá pra traduzir e escrever a legenda no <strong>Editar</strong>.
            </p>
          </div>
        )}
        {fotoQuebrou && (
          // Foto quebrada não é detalhe estético: é a MESMA URL que o WAHA busca pra
          // postar. Se ela não abre, o disparo no grupo também falha. Uma miniatura
          // muda deixaria o Caio decidindo às cegas — e ele julga a peça pela foto.
          //
          // NÃO desabilita o Aprovar: o `onError` também dispara com internet ruim, e
          // travar o botão por causa do 4G do Caio seria alarme falso — o tipo de coisa
          // que ensina a ignorar aviso. Diz o que houve e deixa ele decidir.
          <div className="banner banner-warn" role="alert">
            A foto não abriu aqui. Pode ser a sua internet — tenta recarregar. Se continuar assim, chama o
            Bruno antes de aprovar.
          </div>
        )}

        {modo === 'ver' && (
          <>
            <Legenda caption={oferta.caption} />

            {divergente && (
              // NÃO bloqueia: mostra os dois números e deixa o humano concluir — a
              // lição do CEO da ARV ("mostrar o dado e deixar o Andre concluir").
              // Bloquear aqui também erraria: promoção legítima ("de X por Y") tem
              // dois preços e viraria alarme falso, que treina a ignorar o aviso.
              <div className="banner banner-warn" role="alert">
                O valor aqui em cima é <strong>{formatarBrl(oferta.precoBrl)}</strong>, mas na legenda está{' '}
                <strong>{divergente.map((p) => formatarBrl(p)).join(' e ')}</strong>.{' '}
                <strong>Vale o da legenda</strong> — é ela que sai no grupo. Se não for isso, fala com o Bruno.
              </div>
            )}

            {tituloTorto && (
              // Irmão do `divergente`, e existe pelo mesmo motivo: quem sai no grupo
              // é a LEGENDA. Editar o título aqui não a reescreve (quem monta é o
              // /agenda), então sem este aviso o Caio corrige o título, aprova, e o
              // grupo recebe o antigo — sem ninguém notar. Também não bloqueia.
              <div className="banner banner-warn" role="alert">
                O título aqui em cima é <strong>{oferta.titulo}</strong>, mas a legenda diz{' '}
                <strong>{tituloTorto}</strong>. <strong>Vale o da legenda</strong> — é ela que sai no grupo. Pra
                mudar de verdade, edita a legenda também.
              </div>
            )}

            {incompleta && (
              <div className="banner banner-warn" role="status">
                {incompleta}
              </div>
            )}
            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}
            {salvo && (
              <div className="banner banner-ok" role="status">
                Salvo.
              </div>
            )}

            <div className="btns">
              <button
                className="btn btn-primary"
                disabled={ocupado || Boolean(incompleta)}
                onClick={() => mudarStatus('Aprovado')}
              >
                Aprovar
              </button>
              <button className="btn" disabled={ocupado} onClick={editar}>
                Editar
              </button>
              <button
                className="btn"
                disabled={ocupado || Boolean(incompleta)}
                onClick={() => setModo('agendando')}
              >
                Agendar
              </button>
              <button className="btn btn-ghost" disabled={ocupado} onClick={() => mudarStatus('Descartado')}>
                Descartar
              </button>
            </div>
          </>
        )}

        {modo === 'editando' && (
          <>
            {/* Título e Valor são campos DO CAIO: ele os digita no form do garimpo.
                Sem eles aqui, esquecer o preço (ou mandar em iene, que o webhook
                rejeita) virava peça entalada que só o Bruno destravava na mão. */}
            <label htmlFor={`tit-${oferta.id}`}>Título</label>
            <input
              id={`tit-${oferta.id}`}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <label htmlFor={`pre-${oferta.id}`}>Valor de venda (R$)</label>
            <input
              id={`pre-${oferta.id}`}
              type="text"
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="750,00"
            />
            <label htmlFor={`tam-${oferta.id}`}>Tam / observação</label>
            <input
              id={`tam-${oferta.id}`}
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="único"
            />

            <div className="legenda-topo">
              <label htmlFor={`cap-${oferta.id}`}>Legenda (sai assim no grupo)</label>
              {/* Regenera a moldura dos campos ATUAIS. Fica aqui, colado na legenda,
                  porque é sobre ela: o Caio mexeu no título/preço/Tam acima e quer
                  o padrão de novo, sem apagar e digitar 🏁 na mão. */}
              <button type="button" className="btn btn-mini" disabled={ocupado} onClick={montarModelo}>
                Montar no modelo
              </button>
            </div>
            <textarea
              id={`cap-${oferta.id}`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <Legenda caption={caption} />

            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}

            <div className="btns">
              <button className="btn btn-primary" disabled={ocupado} onClick={salvarEdicao}>
                {ocupado ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                className="btn"
                disabled={ocupado}
                onClick={() => {
                  setTitulo(oferta.titulo)
                  setPreco(paraCampo(oferta.precoBrl))
                  setCaption(oferta.caption)
                  setTags(oferta.tags)
                  setErro(null)
                  setModo('ver')
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {modo === 'agendando' && (
          <>
            <label htmlFor={`dt-${oferta.id}`}>Sai quando?</label>
            <input
              id={`dt-${oferta.id}`}
              type="datetime-local"
              value={quando}
              onChange={(e) => setQuando(e.target.value)}
            />
            <p className="peca-meta">O disparo confere a fila a cada 30 min, então pode sair um pouco depois.</p>

            {erro && (
              <div className="banner banner-err" role="alert">
                {erro}
              </div>
            )}

            <div className="btns">
              <button
                className="btn btn-primary"
                disabled={ocupado || !quando}
                onClick={() =>
                  patch(
                    { status: 'Agendado' satisfies Status, scheduled_at: quando },
                    { titulo: oferta.titulo, status: 'Agendado' },
                  )
                }
              >
                Agendar
              </button>
              <button className="btn" disabled={ocupado} onClick={() => { setErro(null); setModo('ver') }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  )
}
