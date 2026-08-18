---
tipo: projeto
faixa: low-ticket
papel: hub de ESTADO da frente NSC / Motor de Ofertas (no vault)
atualizado: 2026-07-21
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

## 🔴 Ação imediata / pendências críticas
- **Reimportar os 2 workflows no n8n** — os arquivos estão consertados (commit `cccb488`, local), **produção não** → todo lead novo ainda cai na peça errada. Ver `baserow-filtro-vazio-tabela-inteira` (`.claude`).
- **`BASEROW_TOKEN` vazado (15/07) sem rotacionar** — em 3 workflows. Pendência mais velha e séria.
- Decidir onde consertar o "Tam: Tam:" · curadoria (Suzuka=reedição 2018, Honda=furo) · formato do feed 3:4.

## Relacionado
[[caio-logistica-japao]] · [[betchecker]] (frente-irmã low-ticket) · [[apostas-betkillers]] · `🎯 Foco Atual`
