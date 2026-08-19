---
tipo: prova
frente: Nippon-Speed
data: 2026-08-19
---

# A prova do filtro barato — números crus

> Documento interno, pro Bruno decidir se o Hermes entra em produção ou volta pra
> prancheta. Sem verniz: onde o número é ruim, ele está escrito ruim.

**Recomendação numa linha:** o funil está pronto pra rodar como **fila de leitura**;
o comparável **ainda não fala** e não deve ser usado pra nada.

---

## A limitação, antes dos números

O backtest roda contra **19 peças que o Bruno curou à mão**. Não é amostra aleatória do
Mercari — já passou por um filtro humano. Então ele mede **"o filtro preserva o que um
humano já gostou"**, e não *"o filtro acha coisa boa no mato"*.

A segunda pergunta só a varredura crua responde, e ela responde **parcialmente**: mostra
quanto o filtro sinaliza num universo não-curado, mas não tem gabarito pra dizer se
sinalizou certo.

---

## 1. A varredura funciona, e é barata

4 buscas × 2 estados (`on_sale` e `sold_out`), 40 créditos de Firecrawl.

| | |
|---|---|
| cards colhidos | **415** |
| cards únicos (o mesmo anúncio cai em 2 buscas) | **384** |
| descartados na entrada por serem Mercari Shops | **48** |
| custo por card | **~0,10 crédito** |
| custo por item aberto individualmente | 5 créditos |
| **razão** | **~52× mais barato** |

O filtro de vendidos foi provado antes de qualquer linha ser escrita: interseção **zero**
entre ativo e vendido, e **3 de 3** ids sorteados do conjunto vendido confirmaram
`sold=true` na página do item, com um controle ativo em `false`.

---

## 2. O filtro não corta compra boa — e quase não corta nada

**Falso negativo em `COMPRAR`: 0 de 13.** É o número que manda, e ele passou.

Mas o outro lado é honesto: **o filtro descartou 7 de 384 cards**, e os 7 foram por
dedup (já estão em `pecas/`). Nada mais foi cortado — e depois da decisão de 19/08 (ver o
adendo no fim) sabe-se que **nada será cortado por preço**, porque teto de preço esconderia
o achado raro. O poder de corte do funil é, hoje, essencialmente zero.

**Onde está o valor, então: nas flags.** Numa varredura crua de 377 cards:

| flag | cards | o que quer dizer |
|---|---|---|
| *(nenhuma)* | 336 | a base não reconhece nada de útil no título |
| `sem_ancora` | 34 | nenhuma entidade conhecida: vai pro fim da fila |
| `datavel` | 23 | janela de ≤12 temporadas, com os fatos anexados |
| `peixe_grande` | 18 | acima da faixa já operada — aparece marcado, nunca some |
| `piloto_sem_vinculo` | 8 | piloto ao lado de equipe que a base não liga a ele |

**41 dos 377 recebem algum sinal; os outros 336 não recebem nenhum.** Isso não é falha do filtro — é o tamanho real
da base. Ela conhece 62 entidades; o Mercari tem muito mais.

---

## 3. O número da tese: o barato prevê o caro?

Comparando a datação obtida **só pelo título** com a obtida pelo parecer de perícia:

| | |
|---|---|
| peças em que os dois datam | 17 |
| janela do título **idêntica** à do parecer | 9 |
| janela do título **contém** a do parecer | **16** |
| **contradiz o parecer** | **0** |
| janela útil (≤12 temporadas) só pelo título | 5 de 19 |

**A leitura:** o sinal barato é **impreciso, nunca errado**. Ele quase sempre devolve uma
janela mais larga que a verdadeira, e nunca uma janela incompatível. É essa propriedade
que torna seguro usá-lo pra descartar — e é ela, não a precisão, que sustenta o funil.

O contrapeso: só **5 de 19** títulos produzem janela realmente estreita. Título sozinho
serve pra **descartar**, não pra **concluir**.

---

## 4. O que os aliases destravaram

O `normaliza()` apagava japonês inteiro. Sobre os títulos crus:

**títulos sem entidade nenhuma: 9 de 24 (37%) → 1 de 24 (4%)**

O único que segue cego é o boné de Suzuka, que de fato não tem equipe nem patrocinador —
ali o silêncio é a resposta certa.

---

## 5. As flags caem no lugar certo?

`piloto_sem_vinculo` marcou 3 das 19 peças com gabarito:

- `m33557684905` — **PASSAR**, o boné DEKRA que o Caio já tinha reprovado (controle negativo)
- `m97283893856` — **PASSAR**, a Yamaha que vende Senna e não pode
- `m97609115294` — **COMPRAR**, **alarme falso**: a McLaren de Senna com motor Honda. O
  vínculo existe, mas por dois saltos (Senna→McLaren→motor Honda) que a regra não enxerga

**Pegou as duas falsificações conhecidas do lote, ao custo de 1 alarme falso em 13 compras.**
Como a flag não descarta, o alarme falso custa uma olhada, não uma peça.

Vale registrar que a primeira versão da regra errava **nos dois sentidos**: contava
entidades empilhadas (≥4), acusava a McLaren-Honda legítima e **deixava passar a Yamaha**.
Perguntar à base a quem o piloto está ligado é o que consertou.

---

## 6. O comparável ainda NÃO fala

Este é o número ruim, e ele é o mais importante do documento.

- 232 anúncios vendidos lidos
- 20 baldes formados, **6 com n ≥ 5**
- **os 6 têm janela `indefinida`**

Ou seja: o único balde com amostra é *"jaqueta Ferrari, qualquer época"* — **¥800 a
¥170.000**, mediana ¥7.199. Uma faixa dessas não julga peça nenhuma. Os baldes que
seriam úteis (equipe × temporada × tipo) têm n=1 ou n=2 e devolvem `sem base`, como
devem.

**A causa é o item 3:** o título raramente estreita a datação, então quase tudo cai no
balde "indefinida". O comparável não está errado — está **vazio de resolução**.

**O que destravaria:** mais fatos na base (cada rodada acrescenta) e varredura recorrente,
que dá série de preço e tempo até sair. Uma varredura só é uma foto.

---

## 7. O achado que não estava no plano

A varredura crua **encontrou dois erros na base cara** — e este é, de longe, o melhor
resultado do dia, porque é o volante girando:

1. **`ford-benetton` ia só até 1992.** Um anúncio *"Mild Seven Benetton Ford 1994"* deu
   contradição. A Benetton foi equipe de fábrica da Ford **até 1994** (o B194 do título do
   Schumacher); só o B195 troca pro Renault. **A janela era minha, e eu a fechei apertada
   demais ontem** ao readmitir o fato — exatamente a lição que estava escrita no METODO e
   que mordeu de novo.

2. **`senna-williams-1994` existia, mas tipado como `evento`** — e `evento` é excluído da
   datação de propósito. Não faltava fato: **faltava tipo**. Senna *foi* piloto da Williams
   em 1994; isso é relação de temporada, não acontecimento. Tipado errado, o fato era
   invisível.

Os dois foram confirmados por busca externa antes de entrar. Depois da correção, os dois
anúncios que davam contradição **datam em 1994 cravado**.

Auditei os outros 20 fatos `evento`: são momentos pontuais de verdade (corrida, estreia,
morte). Só esse um estava no tipo errado.

**A lição operável:** 40 créditos de varredura acharam dois defeitos numa base que custou
~1,2 milhão de tokens de perícia. O funil barato não é só consumidor da base — ele é
**auditor** dela.

---

## Veredito

| | |
|---|---|
| varredura | **entra**. Barata, provada, com o estado vindo da consulta |
| filtro como **fila de leitura** | **entra**. Não corta compra boa e as flags acertam |
| filtro como **cortador de volume** | **não vai existir por preço**. Ver abaixo |
| comparável | **não entra**. n insuficiente onde importa; devolve `sem base` e está certo |
| base como coisa **auto-corrigível** | **entra**, e é o achado do dia |

## Adendo de 19/08 — não existe teto de preço, por decisão

Perguntado sobre o teto, o Bruno respondeu que **não há um**: *"se achar um item como uma jaqueta
de Honda Senna autografada vale mostrar para nós com certeza, só não deve ser o foco porque vender
um item desse exige confiança, logística e cuidado."*

Isso muda o desenho pra melhor. Descartar por preço esconderia **justamente o achado raro**, que é
o que a curadoria caça. O portão virou a flag `peixe_grande` (acima de R$ 2.500, a borda da faixa
que a loja já operou): a peça aparece, marcada, e nunca some. Na varredura, 18 peças caem aí —
incluindo a Honda/Senna autografada a R$ 72.950 e uma Ferrari a R$ 460 mil que quase certamente é
anúncio furado, e que agora dá pra ver em vez de sumir.

Consequência honesta: **o filtro segue sem cortar volume**, e agora sabe-se que não vai cortar por
preço. O corte real terá de vir de resolução de datação — o mesmo gargalo do item 6.

**O próximo número a perseguir** não é acurácia — é **resolução de datação**. Enquanto o
título não estreitar a janela, o comparável não fala e o filtro só sinaliza. Cada rodada de
curadoria engorda a base, e é isso que move os dois.
