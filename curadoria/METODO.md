---
frente: nippon
---

# Curadoria de peça — o método, descoberto sobre 5 peças e endurecido sobre 19

> **Etapa 1** (2026-08-07, n=5): descobriu que a pergunta era outra.
> **Etapa 2** (2026-08-18, n=19, incluindo uma peça recusada por humano): confirmou a
> régua, acrescentou a classe de sinal que faltava e mediu o limite dela.
>
> A frente foi pausada e reaberta no mesmo 18/08 — de manhã "não é urgente agora", à
> tarde 18 URLs novas. Ela é **trabalho corrente dentro da frente Nippon**, não frente
> própria. Este doc é o resultado que importa: **quais sinais são verificáveis e quais
> são chute.** A lógica que sobreviver aqui é a que vira app na KVM 2.
>
> Resultado da rodada em `index.json` · material por peça em `pecas/<id>/`.

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

**Auditoria de símbolo oficial.** *(Classe nova, descoberta na Etapa 2 — ver "O que a peça
recusada ensinou".)* Bandeira, escudo, número de carro, wordmark, `©` e frase de licença
têm **forma canônica**: contam-se as faixas, lê-se a palavra, compara-se com o que a peça
diz de si mesma em outro lugar. Uma bandeira alemã tem três faixas horizontais pretas,
vermelhas e amarelas; se o bordado tem duas, vermelha sobre branca, isso é observável e
não depende de resolução. **Este é o sinal que sobrevive à foto de celular do jeito que
textura não sobrevive** — e é a única via pela qual o método chegou perto de uma peça
falsificada.

Dois casos que se repetem e viram sinal próprio:
- **A peça se contradiz sozinha** — a etiqueta traz um símbolo e o bordado traz outro,
  para a mesma coisa. Licenciado oficial não erra a bandeira do próprio piloto.
- **Marca protegida sem atribuição de licença em etiqueta nenhuma.** A ausência de texto é
  observável mesmo quando a autenticidade não é. Severidade: não publicar sem corrigir.

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
A Etapa 2 reforçou: **9 das 19 peças carregam bloqueio e sinal de valor ao mesmo tempo**
— uma jaqueta pode ser datável com precisão de um ano *e* ter atribuição errada no título.
Uma nota só teria escondido metade disso. A régua é reafirmada, e o `valida.py` continua
rejeitando qualquer parecer com chave de nota, score ou rating.

### O que mudou em 18/08: veredito e eixos, que não são a nota proibida

O documento de 36 páginas provou estar certo no conteúdo e errado no uso: **ninguém lê
36 páginas antes de fechar uma compra.** Faltava a leitura de 2 segundos.

A saída foi `scripts/score.py`, e ele respeita a proibição em vez de contorná-la:

1. **Não é uma nota, são três leituras separadas.** `anúncio` (o quanto do que o vendedor
   diz se sustenta), `valor` (o quanto a peça é mais do que ele sabe) e `raridade` (só o
   que a busca confirmou). Continuam separados exatamente pelo motivo medido: colapsar
   apagaria metade. A Benetton Montreal é `1/5` de anúncio e `4/5` de valor, e é isso que
   diz o que fazer com ela.
2. **Nenhum número é pedido a um modelo.** Cada ponto sobe ou desce por causa de um sinal
   que já carrega evidência e foto citada. O score é derivado, auditável e reproduzível:
   o `score.json` guarda o `porque` de cada eixo. Um score *pedido* seria o chute que a
   Etapa 1 rejeitou; um score *derivado* é só a contagem do que já foi provado.
3. **O eixo de raridade se cala quando não tem base.** Sem sinal de valor confirmado por
   busca, ele devolve `sem base` em vez de um meio-termo. A Magneti Marelli cai aí.
4. **A confiança da análise vai junto.** `alta`, `média` ou `baixa`, derivada de quantos
   sinais a busca confirmou e quantos ficaram sem resposta. É o que impede o veredito de
   errar com confiança: a Yamaha dá `PASSAR` com confiança alta, a Magneti Marelli dá
   `COMPRAR E REESCREVER` com confiança baixa, e o leitor sabe a diferença.

**Um gotcha que só apareceu rodando:** a primeira versão da raridade lia todos os sinais
confirmados, e a jaqueta Yamaha marcou `5/5` por causa da frase *"Senna morreu em 1994"*,
que é justamente a evidência que a **derruba**. Em CORREÇÃO e ATRIBUIÇÃO o texto fala do
que a peça **não** é. A raridade passou a ler só VALOR e CONFIRMAÇÃO, e caiu pra `1/5`.
Score derivado de texto precisa saber de qual classe o texto veio.

### A base de fatos (18/08): o conhecimento sai da prosa e vira consulta

As duas rodadas produziram 52 sinais confirmados por busca, e eles estavam presos
dentro dos pareceres, em prosa. Cada rodada nova reconsultava tudo do zero.

`scripts/destila.py` extraiu **83 fatos** desses pareceres para `base/fatos.json`:
patrocinador × temporada, licenciado × época, motor, pneu, piloto × equipe, e o que
um código significa (RN, código de área, ©). Cada fato carrega a peça de onde veio
(`visto_em`) e a frase que o sustenta (`frase_origem`), então dá pra conferir um por um.

**O ganho, medido:** `scripts/consultar.py` data **17 das 19 peças da Etapa 2 sem
gastar uma busca**, e as 6 datações que dá pra conferir contra a perícia batem exatamente
(Benetton do Piquet em 1991, Benetton Camel em 1992, Rothmans em 1994-1997, Panasonic
Toyota em 2002-2005, e as duas Ferrari em 2002-2006). A perícia custou ~63 mil tokens
por peça; a consulta custa zero e responde na hora. As 2 que ficam sem datação são peças
que de fato não têm patrocinador nenhum, então a resposta certa é o silêncio.

**A regra que emergiu, e ela vale pro app:** união dentro do mesmo par, interseção entre
pares diferentes. A Goodyear calçou a Benetton em 1990, perdeu 1991 para a Pirelli e
voltou em 1992: são dois períodos verdadeiros da mesma relação. A primeira versão pegava
o intervalo mais estreito e datava uma jaqueta de 1992 em 1990.

**Três armadilhas de derivar-de-texto, todas da mesma família.** Aconteceram nesta
rodada e vão acontecer no app:
1. A raridade lia todos os sinais confirmados e a jaqueta Yamaha marcou 5/5 por causa de
   *"Senna morreu em 1994"*, que é a frase que a **derruba**. Correção: ler só VALOR e
   CONFIRMAÇÃO.
2. A datação por peça lia a `afirmacao` inteira e puxava nomes citados por comparação
   (a Benetton do Piquet importou "Mild Seven" e "Ford na McLaren de 1993"). Correção:
   ler só a `evidencia`, que descreve o que está fisicamente na peça.
3. `100% COTTON SHELL` numa etiqueta de composição casou com a **Shell** petrolífera e
   quebrou a datação. Correção: marca cujo nome é palavra comum de etiqueta só conta
   quando o vizinho não entrega o outro sentido.

A régua: **ao derivar de texto de parecer, sempre filtrar por classe e por campo.** Texto
sem contexto de origem inverte o sinal.

**Recusar fato de datação deixa buraco.** Recusei `ford-benetton` (janela aberta demais)
e `marlboro-ferrari` (duas checagens divergentes), e os dois viraram contradição em peças
reais, porque o nome passou a casar só com o fato errado que sobrou. A saída certa não é
descartar: é **fechar a janela no que a checagem sustenta**, ou **gravá-la ampla** e
escrever a divergência dentro do fato.

**O veredito** é o que se lê primeiro: `COMPRAR` · `COMPRAR, PEDIR FOTO` ·
`COMPRAR E REESCREVER` · `NEGOCIAR PREÇO` · `PASSAR`. Ele sai da natureza do problema
(`responsabilidade.json`), não de uma média: peça sem trava compra, peça cujo problema é
a descrição compra e reescreve, peça que não é o que parece passa. `NEGOCIAR PREÇO`
dispara quando o ticket é alto **e** a datação ou a raridade caiu, porque aí o dinheiro
está pagando uma promessa que não se sustenta.

## A checagem externa (o que mudou na Etapa 2)

Na Etapa 1 o conhecimento de F1 saiu inteiro da cabeça do modelo, sem conferir nada.
Funcionou, mas era indistinguível de sorte. Na Etapa 2 **todo sinal que depende de fato
externo passa por busca** — patrocinador × temporada, quem tinha aquele motor, quem era
licenciado, o que significa um código de etiqueta — e o resultado (`confirma` / `refuta` /
`nao_achei`) fica gravado no sinal.

Números da rodada: **114 sinais, 65 com busca — 52 confirmaram, 1 refutou, 12 não
acharam.** Os 12 "não achei" são o ganho de verdade: viraram incerteza declarada em vez de
afirmação confiante. É a diferença entre um parecer e um chute bem escrito.

O que a busca abriu, e que o modelo sozinho não teria:
- Um **código de área de telefone** (818, criado em 1984) derrubou o "70s" de uma jaqueta
  de ¥38.000.
- A **data de constituição de uma empresa** (Y'S GEAR, 1997) provou que uma peça de
  ¥39.800 não pode ser da era de um piloto morto em 1994.
- **`RN` não prova fabricação nos EUA** — identifica empresa americana que fabrica,
  importa, distribui *ou* vende. Duas peças usavam o RN como prova de origem.

## O que a peça recusada ensinou

A Etapa 1 fechou dizendo que o método servia pra erro de descrição e valor escondido, e
**não** pra pegar falsificação, porque não havia peça falsa na amostra. A Etapa 2 corrigiu
isso: entrou `m33557684905`, o boné Schumacher/DEKRA que o Caio reprovou em 13/07, com o
gabarito escondido do perito.

**Resultado: parcial, e a honestidade importa.** O método não escreveu "é falsa" — pela
régua, não podia. Mas chegou em *não publicar* por dois caminhos que não dependem de
textura: a bandeira lateral não é a alemã que a descrição promete (duas faixas, vermelha
sobre branca), e a etiqueta da própria Michael Schumacher Collection traz o capacete em
preto, vermelho e amarelo — a peça carrega dois símbolos nacionais incompatíveis dentro de
si. Somado a isso, nenhuma etiqueta atribui licença Ferrari num boné que estampa o logo
Ferrari.

**A proibição de julgar por bordado e costura continua de pé** — nada aqui foi resolvido
olhando ponto ou trama. O que faltava era a **auditoria de símbolo oficial**, e uma amostra
de 5 peças coerentes não tinha como revelar isso.

Limite que permanece: **n=1 de peça recusada.** Não dá pra saber se o padrão de falha é
sempre esse (símbolo errado + licença ausente) ou se este caso foi sorte. A próxima rodada
precisa de mais recusadas, e é o único buraco que ainda importa nesta régua.

## O que isso significa pro app

O app não precisa de visão computacional treinada, nem de base de dados de falsificação,
nem de fine-tuning. Precisa de:

1. o scrape completo (feito, `scripts/coletar.py`)
2. as fotos passadas pro modelo junto do texto
3. conhecimento de F1 **mais busca externa que ancore cada afirmação** (o passo novo)
4. saída estruturada nas 4 classes, com evidência obrigatória
5. o gate mecânico (`scripts/valida.py`): sinal sem evidência ou sem fonte não passa,
   `o_que_nao_sei` vazio não passa, chave de nota agregada não passa

É uma app pequena. O valor não está na engenharia, está no prompt e na régua deste doc.

**Ordem de execução provada na Etapa 2:** coletar → traduzir → precificar → periciar →
indexar. A perícia roda **um agente por lote de peças**, e cada um lê as fotos inteiras.
Isso é o que torna a coisa paralelizável e o que manteve o contexto limpo com 19 peças.
