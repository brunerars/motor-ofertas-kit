/**
 * Fuso. O único lugar da borda que sabe que a loja opera no Brasil.
 *
 * 🔴 POR QUE ISTO EXISTE (bug de 17/07, as "3 horas na frente"):
 *
 * O Baserow guarda UTC e está CERTO. Quem mentia era a borda, nas duas pontas:
 *
 *   1. EXIBIR — `PecaLida` é RSC, então `toLocaleString('pt-BR')` roda no
 *      servidor da Vercel, que é UTC. O `'pt-BR'` fixa o FORMATO (dia/mês, 24h),
 *      NÃO o fuso. O card dizia "Saiu 03:41" pra um post das 00:41.
 *
 *   2. GRAVAR — `<input type="datetime-local">` entrega HORA DE PAREDE, sem
 *      fuso ("2026-07-17T14:30"). `new Date(...)` de uma string sem offset usa o
 *      fuso do RUNTIME = UTC na Vercel. O Caio marcava 14:30 pensando em
 *      Brasília e a peça era gravada pra 14:30Z = 11:30 daqui: postava 3h cedo.
 *      Este era o pior dos dois, e ficava escondido atrás do primeiro (UTC
 *      entrava, UTC saía, e a tela parecia coerente consigo mesma).
 *
 * A lição já existia uma camada acima: o nó `Filtrar aprovados` do
 * `nsc-dispara-ofertas.json` fixa `timeZone: 'America/Sao_Paulo'` e tem o
 * comentário avisando que o container roda em UTC. A borda nasceu depois e não
 * herdou. Se um dia houver loja fora do Brasil, isto vira campo da `LOJAS` —
 * por ora é constante, e é honesto que seja.
 */
export const FUSO_LOJA = 'America/Sao_Paulo'

/** Quanto o fuso da loja está deslocado do UTC, em ms, NAQUELE instante. */
function deslocamentoNo(instante: number): number {
  // `formatToParts` é a única forma de perguntar ao ICU "que horas são em SP
  // neste instante" sem depender do fuso do processo.
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_LOJA,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instante))

  const p = (tipo: string) => Number(partes.find((x) => x.type === tipo)?.value ?? 0)
  // `hour` volta 24 à meia-noite com hour12:false em algumas versões do ICU.
  const comoSeFosseUtc = Date.UTC(p('year'), p('month') - 1, p('day'), p('hour') % 24, p('minute'), p('second'))
  return comoSeFosseUtc - instante
}

/**
 * Hora de parede na loja (`2026-07-17T14:30`) → instante UTC (`...T17:30:00Z`).
 * Devolve `null` se a string não for uma data válida — quem responde 400 é a rota.
 */
export function isoDeHoraLocal(parede: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(parede.trim())
  if (!m) return null
  const [, ano, mes, dia, hora, min, seg] = m

  // Finge que a parede é UTC, mede o deslocamento real, corrige.
  const chute = Date.UTC(+ano, +mes - 1, +dia, +hora, +min, +(seg ?? 0))
  if (Number.isNaN(chute)) return null

  // Segunda passada: numa virada de horário de verão o deslocamento do "chute"
  // pode ser o do lado errado da virada. O Brasil não tem DST desde 2019, mas
  // isso é decisão política e já mudou — a 2ª passada é barata e não apodrece.
  const corrigido = chute - deslocamentoNo(chute)
  const instante = chute - deslocamentoNo(corrigido)

  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return null
  // Rejeita data impossível (31/02 vira 03/03 no Date.UTC e passaria calado).
  const voltou = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_LOJA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
  if (voltou !== `${ano}-${mes}-${dia}`) return null

  return d.toISOString()
}

/** Instante UTC do Baserow → `17/07, 14:30` na hora da loja. */
export function horaBR(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: FUSO_LOJA,
  })
}
