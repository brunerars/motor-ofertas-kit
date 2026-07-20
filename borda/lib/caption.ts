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
 * Sem preço não há legenda: a peça segura em `Fila`.
 * Regra do projeto — nunca escrever "valor sob consulta" no grupo, porque o R$
 * que o Caio manda no form JÁ inclui frete do Japão e impostos.
 *
 * As duas mensagens apontam pro caminho CERTO, e a diferença importa:
 *  - preço é campo DO CAIO (ele digita no form) → ele resolve aqui, agora.
 *  - legenda tem DOIS caminhos desde 20/07 (ver abaixo).
 *
 * ⚠️ A mensagem da legenda dizia "essa parte é com o Bruno" e virou meia-verdade
 * quando o botão de enriquecer chegou: com o japonês na tela, o Caio escreve
 * sozinho se não quiser esperar. Mandar esperar seria repetir o erro que a
 * mensagem do preço já tinha corrigido — mandar o Caio aguardar por algo que ele
 * mesmo resolve. Agora oferece os dois caminhos e deixa ele escolher.
 */
export function podeAprovar(o: { precoBrl: number | null; caption: string }): string | null {
  if (o.precoBrl === null) return 'Falta o preço — dá pra pôr aqui mesmo, no Editar.'
  if (!o.caption.trim()) return 'Falta a legenda — dá pra escrever no Editar, ou esperar o Bruno.'
  // O modelo deixou o título por preencher e o Caio aprovou por cima. Sem esta
  // trava, o grupo receberia "*✏️ traduz o título aqui*" — o andaime cru. Roda no
  // servidor também (route.ts chama isto), não só no botão.
  if (o.caption.includes(PLACEHOLDER_TITULO)) {
    return 'O título ainda está no modelo — troca "traduz o título aqui" pelo nome da peça.'
  }
  return null
}

/**
 * O texto que marca o buraco do título no modelo. Fica NUMA constante porque dois
 * lugares dependem dele casar exato: o `modeloLegenda` que o escreve e o
 * `podeAprovar` que barra a aprovação enquanto ele estiver lá.
 */
export const PLACEHOLDER_TITULO = 'traduz o título aqui'

/**
 * Monta a legenda no FORMATO PADRÃO, já com emoji, negrito, espaçamento e o CTA
 * do WhatsApp — o que o Caio não deveria ter que lembrar de digitar toda vez.
 *
 * 🔴 Isto NÃO é "a borda montar legenda" no sentido que a v1 proibia. Aquilo era
 * IA — traduzir, redigir, decidir. Isto é ANDAIME MECÂNICO: costura os campos que
 * o Caio já preencheu (título, Tam, preço, id) na moldura fixa. Nenhuma decisão,
 * nenhuma tradução. Mesma linha da meia-enriquecida: mecânico sim, julgamento não.
 *
 * O ÚNICO buraco que sobra é o título quando ele ainda é o id/vazio (o Caio traduz
 * do bloco japonês). Preço, Tam e CTA saem prontos dos dados que já existem.
 *
 * Formato é o mesmo do `/agenda` (CLAUDE.md, "Modelo de preço e legenda"): se os
 * dois divergirem, a legenda muda conforme quem a montou. Manter em sincronia.
 */
export function modeloLegenda(
  o: { titulo: string; mercariId: string; precoBrl: number | null; tags: string },
  waNumero: string,
): string {
  const t = o.titulo.trim()
  // title_pt nasce como o próprio id quando o Caio não põe título no form (o
  // webhook faz `title || id`). Nesse caso não há título de verdade — vira buraco.
  const titulo = !t || t === o.mercariId ? `✏️ ${PLACEHOLDER_TITULO}` : t

  const tam = o.tags.trim() || 'único'

  // Espaço NORMAL, não o nbsp que o toLocaleString com currency mete — a legenda
  // do /agenda usa espaço normal, e paridade importa (precosNaLegenda ainda pega,
  // mas o texto tem que bater). Preço ausente é buraco, mas quem barra a aprovação
  // é o `precoBrl === null` do podeAprovar, não este texto.
  const preco =
    o.precoBrl !== null
      ? `R$ ${o.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'R$ ✏️ põe o preço no campo Valor'

  const cta = `🏁 Quero essa peça: https://wa.me/${waNumero}?text=Estou%20interessado!%20(${o.mercariId})`

  // Duas linhas em branco separando título+Tam / preço / CTA — o formato de 16/07.
  return `*${titulo}*\nTam: ${tam}\n\n${preco}\n\n${cta}`
}

/**
 * Lê o R$ que o Caio digitou. Espelha o `parseBRL` do webhook do garimpo
 * (`n8n/nsc-garimpo-webhook.json`) de propósito: é a MESMA regra que decide o
 * preço quando ele manda pelo form, e ter duas leituras diferentes do mesmo
 * texto é como o "R$ 750" vira coisas distintas em cada porta de entrada.
 *
 * Devolve o motivo em vez de só `null` (o webhook não precisa, aqui a UI precisa):
 * "não entendi" e "isso é iene" pedem respostas diferentes do Caio.
 */
export type PrecoLido = { ok: true; valor: number } | { ok: false; erro: 'vazio' | 'iene' | 'invalido' }

export function lerPrecoBrl(s: string): PrecoLido {
  const raw = String(s ?? '').trim()
  if (!raw) return { ok: false, erro: 'vazio' }

  // Freio do iene: '¥ 2.500' viraria 2.5 → R$ 2,50 no grupo. Já aconteceu de o
  // Caio mandar em iene pelo form; lá a linha nasce sem preço e ele nem via.
  if (raw.includes('¥') || raw.includes('円') || raw.toUpperCase().includes('JPY')) {
    return { ok: false, erro: 'iene' }
  }

  let t = raw.replace(/[^0-9.,]/g, '').trim()
  if (!t) return { ok: false, erro: 'invalido' }
  // BR: ponto = milhar, vírgula = decimal ("1.250,50")
  if (t.includes(',')) t = t.split('.').join('').replace(',', '.')

  const n = parseFloat(t)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, erro: 'invalido' }
  return { ok: true, valor: n }
}

/** O título escrito na legenda = o 1º trecho em negrito (o formato manda `*Título*` na 1ª linha). */
export function tituloNaLegenda(caption: string): string | null {
  const m = caption.match(/\*([^*\n]+)\*/)
  return m ? m[1].trim() : null
}

/**
 * O campo `title_pt` bate com o título escrito na legenda?
 *
 * Mesmo motivo do `precoDivergente`: **quem sai no grupo é a legenda**. Editar o
 * título aqui não reescreve a legenda (quem monta é o /agenda), então sem este
 * aviso o Caio corrige o título, aprova, e o grupo recebe o título antigo — sem
 * ninguém notar.
 *
 * Devolve o título da legenda quando difere; `null` quando bate ou não há o que
 * comparar (rascunho cru não diverge de nada).
 */
export function tituloDivergente(o: { titulo: string; caption: string }): string | null {
  const meu = o.titulo.trim()
  if (!meu) return null
  const naLegenda = tituloNaLegenda(o.caption)
  if (naLegenda === null) return null
  // espaço a mais não é divergência
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  return norm(naLegenda) === norm(meu) ? null : naLegenda
}
