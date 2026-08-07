# Curadoria de peça — o método, descoberto sobre 5 peças reais

> Etapa 1 do agente de curadoria, rodada em 2026-08-07 sobre 5 URLs curadas pelo Bruno.
> Este doc é o resultado que importa: **quais sinais são verificáveis e quais são chute.**
> A lógica que sobreviver aqui é a que vira app na KVM 2.

## A descoberta que muda o produto

O pedido original era "nota de veracidade da peça". Rodando sobre material real, **a
pergunta estava errada** — e errada de um jeito que teria produzido um agente inútil.

Nenhuma das 5 peças é falsificada. Em 5 de 5, o que estava errado era a **descrição**,
não a peça. E em 2 de 5 o erro era a favor do comprador: o vendedor não sabia o que
tinha na mão.

Uma "nota de autenticidade de 0 a 10" não teria capturado nada disso. Teria devolvido
`8/10` em todas as cinco e a informação real ficaria de fora.

**O que o agente deve responder não é "é verdadeira?" e sim: "o que eu posso afirmar
sobre esta peça, e o que o vendedor afirma que eu não posso sustentar?"**

## As 4 classes de sinal (a taxonomia que emergiu)

| classe | o que é | severidade |
|---|---|---|
| **CORREÇÃO** | o vendedor afirma algo que a própria peça contradiz | não publicar sem corrigir |
| **ATRIBUIÇÃO** | o título associa a peça a piloto/time que ela não carrega | não publicar sem corrigir |
| **VALOR** | a peça é mais do que o vendedor sabe (datação, raridade, história) | argumento de compra e pauta de post |
| **CONFIRMAÇÃO** | evidência física que sustenta o que foi declarado | usar na legenda como prova |

## O que é verificável (o agente pode afirmar)

**Datação por combinação de patrocinador.** É o sinal mais forte e mais barato que
existe nesta categoria. Cada dupla motor×patrocinador-título existe numa janela fechada
de temporadas. Duas peças foram datadas com precisão de UM ANO por isso, contra a
descrição vaga do vendedor. Não depende de olhar costura nem de conhecer o fabricante:
depende de saber F1.

**Contradição interna entre a data declarada e o conteúdo da peça.** Um boné que
comemora título mundial não pode ser de um ano em que o piloto não foi campeão. O sinal
é lógico, não perceptual.

**Copyright ≠ ano de fabricação.** `©1997` numa etiqueta é registro de design; o produto
carrega essa data por anos. Vendedor confunde os dois com frequência, e a confusão é
detectável sempre que o conteúdo da peça aponta pra outro período.

**Atribuição a piloto por keyword.** Vendedor japonês enche o título de nomes pra SEO
(prática padrão no Mercari, não fraude). Verificável: o nome aparece bordado/impresso na
peça, ou só no bloco de keywords no fim da descrição?

**Consistência entre condição declarada e o que as fotos mostram.** Dano declarado e
visível = vendedor honesto. Dano visível e não declarado = risco.

**Foto que não é da peça.** Marca d'água de terceiro, fundo de estúdio destoante, imagem
de catálogo no meio de fotos caseiras. Importa duas vezes: reduz o número de fotos
utilizáveis no post e traz problema de licenciamento (a Nippon já tem uma pendência
aberta exatamente disso, o `s5.jpg` sem origem).

**Reputação do vendedor.** Número de avaliações e proporção de negativas. Dado bruto na
página, zero interpretação.

## O que NÃO é verificável (o agente precisa se calar)

**Autenticidade por textura de bordado, costura ou etiqueta em foto de celular.**
Resolução, luz e ângulo não sustentam essa conclusão. Um agente que finge conseguir
isso é o pior resultado possível: erra com confiança sobre a única coisa que o Bruno
não tem como conferir sozinho.

**Ano exato sem âncora externa.** "Parece anos 90" não é datação. Sem patrocinador,
código de etiqueta ou licença que ancore, o agente diz *consistente com vintage, ano
indeterminado* — e para.

**Faixa de preço de mercado.** Exigiria base de comparáveis que não existe no vault.
Fora do escopo até haver histórico próprio de vendas.

**Se a peça vale a pena comprar.** É julgamento do dono da loja. O agente instrui a
decisão, não a toma — a regra travada da NSC (*"quem decide o que desqualifica é o
Bruno"*) continua de pé.

## A regra de saída

Todo sinal carrega **a evidência e a fonte** (`foto_3`, `etiqueta`, `descrição`,
`título`). Sem evidência citada, o sinal não entra no parecer.

Todo parecer termina com `o_que_nao_sei` preenchido. Um parecer sem incertezas
declaradas é um parecer que está escondendo chute.

**Nenhuma nota agregada.** Testado contra as 5 peças: qualquer número colapsaria
achados de naturezas opostas (uma correção de data e uma descoberta de valor) numa
escala só, e perderia os dois. A saída é a lista de sinais ranqueada por severidade.

## O que isso significa pra Etapa 2

O app não precisa de visão computacional treinada, nem de base de dados de falsificação,
nem de fine-tuning. Precisa de:

1. o scrape completo (feito, `scripts/coletar.py`)
2. as fotos passadas pro modelo junto do texto
3. conhecimento de F1 — que o modelo já tem, e que é a peça central do valor
4. saída estruturada nas 4 classes, com evidência obrigatória

É uma app pequena. O valor não está na engenharia, está no prompt e na régua deste doc.

## Limite honesto desta rodada

n=5, todas escolhidas pelo Bruno, nenhuma sabidamente falsificada. **Este método foi
validado pra encontrar erro de descrição e valor escondido, não pra pegar
falsificação** — não houve nenhuma na amostra pra testar contra. Quando aparecer uma
peça reprovada de verdade, rodar de novo e revisar esta régua.
