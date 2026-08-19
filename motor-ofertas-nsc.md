---
tipo: projeto
faixa: low-ticket
papel: hub de ESTADO da frente NSC / Motor de Ofertas (no vault)
frente: nippon
atualizado: 2026-08-19
aliases: ["motor-ofertas", "nsc"]
---
#foco

# 🏁 Motor de Ofertas / NSC — hub de estado

> Nota-hub de **estado** da frente no vault (os 19 ``motor-ofertas-nsc`` resolvem aqui). A **verdade técnica** do código vive no repo e no `projetos/motor-ofertas/CLAUDE.md`; aqui fica decisão + estado + próximo passo. Parceiro: [[caio-logistica-japao]]. Memória: `motor-ofertas-nsc` (`.claude`).

## O que é
Esteira de ofertas curadas do Mercari (Japão) → grupo de WhatsApp. 1ª instância: **Nippon Speed Co.** (memorabilia F1, parceria com o Caio). Fluxo: form/Garimpar do Caio → n8n → Baserow → `/agenda` (enriquece) → Bruno aprova → n8n + WAHA → grupo real → `Disparado`. Curadoria é **humana** (a IA nunca escolhe produto).

## Estado (20/07)
A **Borda do Caio ganhou autonomia** (`nsc-borda.vercel.app`, PR #1): aba Garimpar (manda link de dentro do app), meia-enriquecida (Firecrawl foto+japonês, sem IA), "Gestão de peças", legenda no modelo pronto. Esteira de dois no ar; saiu da Z-API paga pro **WAHA auto-hospedado**.

## Estado (07/08) — a curadoria virou método, e é a semente do 1º agente

A curadoria de peça deixou de ser olho no anúncio e virou **método escrito com
contrato de saída** (`curadoria/METODO.md` + `curadoria/pareceres.json`, commit
`20cb2f0`). Rodado sobre 5 peças reais: **em 5 de 5 o defeito estava na DESCRIÇÃO,
não na peça**, e em 2 de 5 a favor do comprador.

A premissa caiu: não é "nota de veracidade" (nenhuma das 5 era falsificada; a nota
teria dado 8/10 em todas e perdido tudo). É **revisor de anúncio** em 4 classes —
CORREÇÃO · ATRIBUIÇÃO · VALOR · CONFIRMAÇÃO — cada sinal com evidência e fonte, sem
nota agregada.

**Concordância com a curadoria manual:** o método reachou sozinho o *Suzuka =
reedição 2018* e o *furo do Honda* que já estavam nas pendências desta nota desde
20/07. Isso valida o método contra julgamento humano — mas não conta como achado
novo, e a honestidade importa aqui.

**O que é achado novo:**
- `m53001823873` **Tommy Hilfiger = Team Lotus 1994**, último ano da equipe (patch
  `with MUGEN HONDA`). Vendedor descreve como camisa multicolorida genérica a 6.000
  ienes. **A peça mais valiosa das cinco e a mais subprecificada.**
- `m58417466217` **Benetton = 1994** com precisão de um ano (Mild Seven × Ford só
  coexistem nessa temporada), contra o "anos 90" do vendedor.
- `m71164960236` **Ferrari com data errada**: `©1997` é copyright, não fabricação — e
  o boné comemora título que Schumacher não teve em 97.
- `m35956987972` **Honda não tem nada de Senna** — o nome só existe nas keywords de
  SEO do vendedor. Traduzir o título literalmente vende expectativa falsa.
- `m15083004696` **uma das 4 fotos é imagem de imprensa com marca d'água**, não é a
  peça. Mesmo problema do `s5.jpg`.

## Estado (18/08) — Etapa 2 rodada: 19 peças, a régua aguentou e ganhou uma classe

O Bruno curou 18 peças novas e a rodada saiu inteira: **coletar → traduzir → precificar →
periciar → indexar**. Entrou junto o boné `m33557684905`, reprovado pelo Caio em 13/07, como
**controle negativo com o gabarito escondido do perito**. Resultado em `curadoria/index.json`.

**O que mudou no método:**
- **Toda afirmação de fato agora passa por busca.** 114 sinais, 65 checados: 52 confirmam,
  1 refuta, **12 não acharam** — e os 12 viraram incerteza declarada em vez de afirmação.
  Na Etapa 1 o conhecimento de F1 saiu inteiro do modelo, sem conferir nada.
- **Classe de sinal nova: auditoria de símbolo oficial.** Bandeira, escudo, número, ©,
  frase de licença têm forma canônica — conta-se faixa, lê-se palavra. É a única via pela
  qual o método chegou perto da peça falsa, e sobrevive à foto de celular do jeito que
  textura não sobrevive. A proibição de julgar por bordado e costura **continua de pé**.
- **A precificação entrou na conta.** A fórmula do Caio (35% + frete + margem por ocupação
  → Wise → arredonda) saiu da cabeça dele e virou `curadoria/scripts/precificar.py`, com a
  régua escrita em [[logistica-mercari]]. Fechou a lacuna aberta desde 13/07.

**Os achados que valem dinheiro** (o vendedor não sabe o que tem):
- `m13668803753` **Benetton datada em 1991 por uma temporada só** (Pirelli + AUTOPOLIS +
  Camel + Ford), e o carro bordado é o **#20 do Piquet** — o B191 da vitória no Canadá.
  Anunciada como "90s Benetton" a ¥9.500.
- `m93339067779` **Benetton fechada em 1992** por combustível e pneu (Mobil + Goodyear +
  Technogym), não pela marca de cigarro. Já vendida — lição de velocidade.
- `m56921610317` a etiqueta diz **Benetton Formula 1**, a linha da equipe; o vendedor
  cadastrou como United Colors of Benetton e nunca cita a etiqueta.
- `m97609115294` **1991 cravado**: RA121E V12 é o motor do MP4/6, e a dupla Senna/Berger bate.

**Os bloqueios que teriam queimado a loja** (11 de 19 têm sinal de não publicar):
- `m97283893856` **a peça mais cara do lote (¥39.800) vende Senna e não pode.** A etiqueta é
  Y'S GEAR, empresa constituída em **1997**; Senna morreu em 1994. E a Yamaha nunca forneceu
  motor à McLaren. Ainda por cima a condição "C" declarada é **hidrólise do forro**, que é
  irreversível.
- `m31939814908` (¥38.000): o **código de área 818 só existe a partir de 1984**, o que mata
  o "70s" do título. E `RN` não prova fabricação nos EUA.
- `m10933095707`: a própria descrição diz **レプリカ** (réplica), mas título e marca dizem só
  "Ferrari".
- `m73359062125`: **não é HRC e não é F1** — é merchandise Honda Motor Sports, feito na China.

## Estado (18/08, fim do dia) — a base de fatos: o 1º degrau do Hermes

O conhecimento das duas rodadas saiu da prosa e virou consulta. `curadoria/base/fatos.json`
tem **83 fatos verificados** (patrocinador × temporada, licenciado, motor, pneu, piloto,
códigos), cada um com a peça de onde veio e a frase que o sustenta.

**O número que importa: 17 das 19 peças passam a ser datadas sem gastar uma busca**, e as
6 datações conferíveis batem exatamente com o que a perícia tinha achado. A perícia custa
~63 mil tokens por peça; a consulta custa zero. É isso que torna um agente de varredura
viável: o modelo caro só olha o que a tabela não resolve.

**A distância até o Hermes, medida.** Ele já está escrito no `docs/borda-tese-de-venda.md`
com a formulação certa ("garimpando candidatos, com a curadoria humana por cima"), e agora
tem 4 degraus com o 1º pronto:

1. ✅ **Base de fatos** — consulta grátis, cresce a cada rodada
2. **Filtro barato** — título + preço + base descartam o óbvio antes da perícia
   (medido: 120 candidatos do Mercari por 5 créditos de Firecrawl)
3. **Estudo dos vendidos** — o Mercari mostra o que já saiu, e é rótulo de saída do
   mesmo mercado onde compramos. É o que preenche o buraco de **0 vendas nossas
   registradas** (a `LEADS` tem 2 leads externos e nada saiu de "Novo")
4. **Hermes** — varredura → filtro → perícia só no que passou → fila pro humano

**O gargalo que sobra não é técnico.** A esteira está parada desde 05/08, o
`/confere-ofertas` nunca rodou (é quem escreveria `status=Vendido`), e `sold=true` no
Baserow significa *"sumiu do Mercari"*, não que vendemos. Sem instrumentar o desfecho,
a base aprende o critério de compra e nunca o de venda.

**Próximo passo:** a régua está madura o bastante pra virar app (FastAPI na KVM 2 pela
esteira do `pulse`, chamado pelo n8n na entrada do garimpo). O único buraco que resta é
**n=1 de peça recusada** — a próxima rodada precisa de mais reprovadas pra saber se o padrão
de falha é sempre símbolo errado + licença ausente, ou se foi sorte. A regra travada segue:
**o agente instrui, o Bruno decide**.

## Estado (19/08) — a varredura existe, e ela audita a base

Os degraus 2 e 3 do Hermes saíram do papel. `varrer.py` lê **página de busca** do Mercari
(o repo inteiro só sabia ler item), `fila.py` filtra e `comparaveis.py` agrupa os vendidos.
Prova com números crus em [[PROVA]].

**O que passou:**
- **384 cards únicos por 40 créditos** — ~0,10 crédito cada, contra 5 por item aberto (~52×).
  `status=sold_out` foi provado antes de tudo: interseção zero contra o ativo, e 3 de 3 ids
  confirmaram `sold=true` no item.
- **Falso negativo em `COMPRAR`: 0 de 13.** E a datação por título **contradiz** a do parecer
  em **0 de 17**, contendo a janela dele em 16. O sinal barato é impreciso, nunca errado — e é
  essa propriedade, não a precisão, que torna seguro descartar por título.
- **A cegueira em japonês caiu de 37% para 4%.** O `normaliza()` era `[^a-z0-9]+` e apagava
  japonês inteiro; `base/aliases.json` resolve com 32 entradas, todas apontando pra entidade
  que já existe na base.

**O achado que não estava no plano: a varredura barata achou 2 erros na base cara.**
Um anúncio *"Mild Seven Benetton Ford 1994"* deu contradição porque `ford-benetton` ia só
até 1992 — janela que eu mesmo fechei apertada demais ao readmitir o fato. E
`senna-williams-1994` **existia, tipado como `evento`**, que é excluído da datação: não
faltava fato, faltava tipo. Os dois confirmados por busca antes de entrar. **O funil barato
não é só consumidor da base — é auditor dela.**

**O que NÃO passou, e importa:**
- **O comparável ainda não fala.** 232 vendidos, 20 baldes, **6 com n≥5 e todos com janela
  indefinida**. O único balde com amostra é *"jaqueta Ferrari, qualquer época"*: ¥800 a
  ¥170.000. Devolve `sem base` onde importaria, e está certo em fazer isso.
- **O filtro sinaliza, não corta.** 7 descartes em 384, todos por dedup. O `teto_brl` nasce
  `null` em [[buscas]] porque é número do Bruno, não meu.
- **41 dos 377 recebem algum sinal; 336 não recebem nenhum** — é o tamanho da base
  (62 entidades), não falha do filtro.

**O mapa visual da esteira, dos 4 degraus e dos 3 gates:** [[HERMES]].
**Onde auditar os candidatos:** `curadoria/varredura/FILA.md`, que lista os sinalizados
inteiros e os descartes com motivo. Foi ele que faltou na primeira rodada — eu tinha
entregue só JSON, e o Bruno não conseguiu ver peça nenhuma do processo.

> [!FECHADO]- teto-de-preco-da-varredura · 2026-08-19
> Qual o preço final em R$ acima do qual a varredura descarta sozinha? Referência: as 19
> peças da Etapa 2 saíram entre R$ 330 e R$ 2.080, e a varredura crua trouxe candidato de
> R$ 72.950 (jaqueta Honda com autógrafo do Senna).
> destrava: o filtro passar de fila de leitura a cortador de volume.
> fechado: 19/08 — **não existe teto, e não vai existir.** O Bruno: *"se achar um item como
> uma jaqueta de Honda Senna autografada vale mostrar para nós com certeza, só não deve ser o
> foco porque vender um item desse exige confiança, logística e cuidado."* Descartar por preço
> esconderia justamente o achado raro, que é o que a curadoria caça. Virou a flag
> `peixe_grande` (≥ R$ 2.500, a borda da faixa já operada): a peça aparece marcada e nunca
> some. São 18 na varredura. Consequência: **o corte de volume terá de vir de resolução de
> datação, não de preço.**

**Próximo passo:** o número a perseguir não é acurácia, é **resolução de datação**. Enquanto
o título não estreitar a janela, o comparável não fala e o filtro só sinaliza. Cada rodada de
curadoria engorda a base, e é ela que move os dois.

## 🔴 Ação imediata / pendências críticas
- **Reimportar `nsc-lead-inbound.json` no n8n — MINA, não incêndio (reclassificado em 19/08).**
  O conserto é de **um** workflow, não dois: o `cccb488` tocou 4 linhas de `n8n/nsc-lead-inbound.json`
  (a nota antiga dizia "os 2 workflows" e estava errada). O defeito é real — filtro vazio no Baserow
  devolve a tabela inteira e o `results[0]` carimba o lead na 1ª linha, uma peça real e errada
  (`baserow-filtro-vazio-tabela-inteira`). **Mas o gatilho é webhook de mensagem recebida no WhatsApp**,
  e com a esteira parada desde 05/08 não sai `wa.me` novo, logo não entra lead novo: o raio de
  explosão hoje é ~zero. Chamar de *"todo lead novo cai na peça errada"* é correto como condicional e
  enganoso como urgência — foi o Bruno quem pegou isso em 19/08 (*"um mês depois?"*), e ele estava
  certo: um crítico que ninguém sentiu em um mês não era crítico. **Gatilho real: consertar antes de
  religar a esteira, não antes disso.**
- **`BASEROW_TOKEN` vazado (15/07) sem rotacionar** — em 3 workflows. Pendência mais velha e séria.
- Decidir onde consertar o "Tam: Tam:" · curadoria (Suzuka=reedição 2018, Honda=furo) · formato do feed 3:4.

## Relacionado
[[caio-logistica-japao]] · [[betchecker]] (frente-irmã low-ticket) · [[apostas-betkillers]] · `🎯 Foco Atual`
