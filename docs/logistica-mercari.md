# Logística Mercari (Caio) — fonte da verdade do "como funciona"

> Arquivo-padrão. Todo texto de "como funciona" nas LPs desse tipo de loja sai DAQUI, pra não reinventar a cada página. Se a operação mudar, muda aqui e as próximas LPs herdam.
> **Atualizado 2026-07-13 — dados operacionais fechados com o Caio** (`briefs/2026-07-13-faq-respostas.txt`): prazo, pagamento, escritório e política de troca agora são dado real, não mais lacuna. O que continua valendo do 08/07: frete internacional e impostos **por nossa conta**, entrega flexível, **sem menção a nota fiscal**.

## O modelo em uma linha
Curadoria de peças de coleção no **Mercari (Japão)** → compra e **importação por logística própria** (frete internacional e impostos inclusos no preço anunciado) → chega ao **escritório em Mogi das Cruzes, SP** conferido → **oferta no grupo de WhatsApp** → cliente paga (pagamento antecipado) e retira ou paga o envio até o endereço dele.

## Números e regras (confirmados 13/07)
| O quê | Dado real |
|---|---|
| **Prazo** | 20 a 40 dias em média, contados **da saída do Japão** |
| **Destino da remessa** | Escritório próprio em **Mogi das Cruzes, SP** |
| **Pagamento** | **Antecipado** (só encomendamos depois de pago) · Pix, débito ou **crédito em até 12x** via Mercado Pago |
| **O que já está no preço** | Frete internacional + impostos, do Japão até Mogi |
| **O que o cliente paga à parte** | Só o envio de Mogi até o endereço dele (ou retira no escritório, de graça) |
| **Troca / devolução** | **Não há.** Peças antigas e únicas; fotos e descrição fiéis ao estado, conferidas antes |

## Os 3 passos (copy canônica pra seção "Como funciona")

**Passo 01 — Origem / Garimpo no Japão.**
Em nosso grupo, enviamos uma curadoria única de artigos novos e seminovos anunciados no Japão. Bonés de equipes, itens de Grand Prix e colecionáveis que marcaram época. De colecionador para colecionador.

**Passo 02 — Importação / Logística própria.**
Despachamos seu pedido junto às encomendas do grupo por logística própria e com **frete internacional e impostos por nossa conta**.

**Passo 03 — Entrega no Brasil.**
Você retira com a gente ou recebe por Correios ou transportadora. Cada peça chega conferida, fotografada e com a história registrada.

## Regras de precificação (padrão atual)
- **LP** (e anúncio pago) **não fecha preço**: exibe "valor **sob consulta no grupo**", CTA → grupo.
- **Oferta no grupo fecha preço** (revisto 16/07): a legenda mostra o R$ limpo (`R$ 750,00`), que vem do form do Caio já fechado. **Nunca escrever "sob consulta" na legenda do WhatsApp.** Fechamento da entrega segue no 1:1.
- O preço anunciado por peça **já é final** até Mogi (frete internacional + impostos dentro). O envio Mogi→cliente é à parte.
## A fórmula por trás do R$ (fechada 18/08)

> **Isto não muda quem decide o preço.** O R$ que vai pro grupo continua vindo do Caio, fechado, e a regra de 16/07 segue de pé. O que passou a existir é **a conta que ele usa pra chegar nesse número** — agora auditável e reproduzível, em vez de morar só na cabeça dele. Fonte: base **CALCULADORA 35%** (Notion) + confirmações do Bruno em 18/08.

```
taxa_naomi = valor_produto × 0,35        (35% sobre o produto — daí o nome da base)
frete_jp   = ¥1.000                      (frete doméstico japonês, fixo)
soma       = valor_produto + taxa_naomi + frete_jp
preço_¥    = soma + margem
preço_R$   = quanto enviar de BRL pela Wise pra chegar preço_¥ no Japão → arredonda
```

**A margem depende do quanto a peça ocupa de espaço**, e é o único termo com julgamento humano dentro:

| Classe | O que é | Margem |
|---|---|---|
| **P** | envelope: chaveiro, pin, patch, adesivo, flâmula | ¥3.000 |
| **M** | pacote pequeno: boné, camiseta, camisa, polo | ¥4.000 |
| **G** | pacote médio: jaqueta leve, blusão, moletom, anorak | ¥6.000 |
| **GG** | volumoso: jaqueta com enchimento, pluma, macacão, capacete | ¥10.000 |

**A conversão é a calculadora da Wise, não a cotação comercial.** O que interessa é quanto de BRL sai da conta pra chegar o iene lá — taxa da Wise inclusa. A API pública dá o mesmo número da calculadora do site, sem token:

```
GET https://api.wise.com/v3/comparisons?sourceCurrency=BRL&targetCurrency=JPY&sendAmount=N
→ providers[alias="wise"].quotes[0] = { fee, rate, receivedAmount }
```

A relação é exata (`recebido = (envio − fee) × rate`) e a `fee` é **linear** no valor enviado, então dois pontos calibram a curva e permitem inverter: `envio = (preço_¥ / rate + a) / (1 − b)`. Medido em 18/08 com três pontos, o erro foi de 2 centavos. **Nunca guardar câmbio fixo** — o script recalibra a cada rodada e carimba a cotação usada.

Implementação: `curadoria/scripts/precificar.py`. Os parâmetros (35%, ¥100, tabela de margem, arredondamento) ficam no topo do arquivo, não espalhados no código — mudou a regra do Caio, muda ali.

O frete de **¥1.000 foi fechado pelo Bruno em 18/08**, corrigindo o ¥100 do primeiro cálculo. As classes de volume da rodada de curadoria também foram validadas por ele na mesma data.

- **(confirmar c/ Caio):** o critério de arredondamento. Hoje o script sobe pra dezena de reais, o que casa com o `R$ 750,00` canônico, mas não foi conferido contra o que ele faz na prática.

## Provas / diferenciais que podemos afirmar
- Peça vintage original, garimpada no Japão (mercado com o melhor acervo de memorabilia de automobilismo).
- Frete internacional e impostos **inclusos no preço** — sem custo escondido chegando depois.
- Logística própria, com retirada em Mogi ou envio à escolha do cliente.
- Curadoria: não é dropshipping, é seleção. De colecionador para colecionador.
- Descrição e fotos fiéis ao estado real da peça (é o que sustenta o "sem troca").
- **(confirmar c/ Caio):** volume/frequência real ("novidades toda semana" se sustenta?).

## O que NÃO afirmar sem dado
Valor de frete nacional fechado, percentual de imposto, "renda passiva", garantia de disponibilidade de peça específica. Prazo: usar **20 a 40 dias a partir da saída do Japão** — nunca prometer prazo cheio "porta a porta", que depende do garimpo.

## Relacionado
[[caio-logistica-japao]] · [[roteiro-lp]] · `motor-ofertas-nsc`
