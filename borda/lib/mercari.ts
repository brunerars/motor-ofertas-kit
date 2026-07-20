/**
 * O que dá pra derivar de um link do Mercari, sem rede.
 *
 * Client-safe de propósito: a mesma regra vale no form (avisar o Caio antes de
 * enviar) e na rota (a autoridade). Duas leituras diferentes do mesmo link é como
 * a peça entra por uma porta e não entra pela outra.
 *
 * ⚠️ ESTE ARQUIVO TEM UM GÊMEO EM PRODUÇÃO: o `Validar + montar linhas` do
 * `n8n/nsc-garimpo-webhook.json`, que serve o form standalone (mantido como
 * fallback). As duas portas gravam a MESMA linha na 556 — se divergirem, o
 * /agenda passa a tratar a peça diferente conforme por onde ela entrou.
 */

/**
 * A regra copiada é a do FORM standalone (`garimpo/index.html:186`), não a do
 * Code node.
 *
 * O webhook roda `url.match(/m[0-9]+/i)` na URL inteira — mais frouxo — porque
 * quem barra link de fora do Mercari lá é o JS do form, ANTES do POST. O contrato
 * efetivo daquela porta é o dos dois juntos, e é ele que se copia aqui: o mesmo
 * conjunto de links entra pelas duas.
 *
 * (A proibição de `\d`/`\/` é do n8n — regex colada na mão no editor perde a
 * barra invertida. Aqui é arquivo versionado, não se aplica. Mantido `[0-9]` só
 * pra os dois lados lerem igual.)
 */
const MERCARI_RE = /mercari\.com\/item\/(m[0-9]+)/i

/** `null` quando o link não é uma peça do Mercari. Nunca adivinha. */
export function mercariIdDe(url: string): string | null {
  const m = String(url ?? '').match(MERCARI_RE)
  return m ? m[1].toLowerCase() : null
}

/** Teto por envio. Igual ao do webhook — isto é despejo em lote, não importação. */
export const MAX_ITENS = 20
