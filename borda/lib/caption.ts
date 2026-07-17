/**
 * Render da legenda do WhatsApp — para o PREVIEW da borda.
 *
 * Quem renderiza o `*negrito*` de verdade é o app do WhatsApp, não a API
 * (vale igual no WAHA, na Z-API ou em qualquer outra). O preview existe pra
 * o Caio ver o que VAI SAIR, não uma aproximação: ele aprova o que vê.
 *
 * Formato definitivo da legenda (16/07) — ver CLAUDE.md, "Modelo de preço e legenda":
 *
 *   *<Título da peça>*
 *   Tam: <observação do Caio, como ele escreveu; "único" se vazio>
 *
 *   R$ <preço>
 *
 *   🏁 Quero essa peça: https://wa.me/<numero>?text=...
 *
 * NÃO é este arquivo que monta a legenda — quem monta é a skill /agenda, e é ela
 * a dona do formato. Aqui só se LÊ o que já está gravado no campo `caption`.
 * Mudou o formato? Mexe na skill, não aqui.
 *
 * Client-safe de propósito: o preview roda no browser.
 */

export type Segmento = { texto: string; negrito: boolean }

/**
 * Quebra a legenda em segmentos de negrito. Newlines ficam dentro do texto —
 * quem cuida da quebra é o CSS (`white-space: pre-wrap` no .legenda-preview).
 *
 * Regra do WhatsApp: `*negrito*` não atravessa linha e não aceita vazio (`**`).
 */
export function parseCaption(caption: string): Segmento[] {
  const out: Segmento[] = []
  const re = /\*([^*\n]+)\*/g
  let ultimo = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(caption)) !== null) {
    if (m.index > ultimo) out.push({ texto: caption.slice(ultimo, m.index), negrito: false })
    out.push({ texto: m[1], negrito: true })
    ultimo = m.index + m[0].length
  }
  if (ultimo < caption.length) out.push({ texto: caption.slice(ultimo), negrito: false })

  return out.length ? out : [{ texto: caption, negrito: false }]
}

/** Formata em BRL. `null` devolve string vazia — quem decide o que fazer é a UI. */
export function formatarBrl(v: number | null): string {
  if (v === null) return ''
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Todos os R$ que aparecem DENTRO da legenda.
 *
 * Existe porque o campo `price_brl` e o preço escrito na legenda podem divergir —
 * e divergiram de verdade na row 29 (campo 480,00 · legenda 529,00). Isso não é
 * detalhe: **quem sai no grupo é a legenda**. O n8n lê a `caption` e repassa crua
 * ("o n8n não monta legenda"). O `price_brl` é metadado; o cliente nunca o vê.
 *
 * Sem isto, o chip do card mostra 480 e o cliente recebe 529.
 */
export function precosNaLegenda(caption: string): number[] {
  const out: number[] = []
  // R$ 1.250,50 · R$ 750 · R$750,00
  for (const m of caption.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/g)) {
    const n = Number(m[1].replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

/**
 * O campo bate com a legenda?
 *
 * A regra é "o `price_brl` aparece na legenda", não "é igual ao primeiro R$".
 * A diferença importa: uma legenda de promoção ("de R$ 529,00 por R$ 480,00")
 * tem dois preços e está CERTA — comparar com o primeiro daria falso alarme e
 * treinaria o Caio a ignorar o aviso, que é o pior resultado possível.
 *
 * Devolve os preços da legenda quando o do campo não está entre eles; `null`
 * quando está tudo bem (ou quando não há o que comparar).
 */
export function precoDivergente(o: { precoBrl: number | null; caption: string }): number[] | null {
  if (o.precoBrl === null) return null
  const naLegenda = precosNaLegenda(o.caption)
  if (naLegenda.length === 0) return null
  const bate = naLegenda.some((p) => Math.abs(p - o.precoBrl!) < 0.005)
  return bate ? null : naLegenda
}

/**
 * Sem preço não há legenda: a peça segura em `Fila` e o Bruno é avisado.
 * Regra do projeto — nunca escrever "valor sob consulta" no grupo, porque o R$
 * que o Caio manda no form JÁ inclui frete do Japão e impostos.
 */
export function podeAprovar(o: { precoBrl: number | null; caption: string }): string | null {
  if (o.precoBrl === null) return 'Sem preço. O Bruno precisa completar antes de aprovar.'
  if (!o.caption.trim()) return 'Sem legenda. O Bruno precisa completar antes de aprovar.'
  return null
}
