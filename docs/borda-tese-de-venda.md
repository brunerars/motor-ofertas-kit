---
tipo: doc-de-venda
frente: nippon-speed
papel: FONTE de copy pra conteúdo sobre o Borda — o brief de venda do /post-from-idea consulta este doc antes de escrever qualquer peça
status: RASCUNHO (Claude, 06/08) — aguardando revisão do Bruno antes de virar fonte
fontes: borda/README.md · docs/borda-hub-caio.md · lib/caption.ts · PecaLida.tsx · docs/baserow-disparador-schema.md · PRODUCT.md · diario 17/07 e 20/07
---

# Borda — tese de venda

> Como explicar (e vender) o Borda em conteúdo. O que está aqui é rastreável
> pro código e pros docs da frente; o que é futuro está rotulado como futuro.

## O que é, em uma frase

A tela onde o dono de uma loja de importados opera a operação inteira do
celular: confere a fila, aprova e agenda — sem pasta, sem arquivo, sem IDE.
No ar em nsc-borda.vercel.app (1ª instância: Nippon Speed Co.).

## A tese (o coração de qualquer peça)

**O sistema é deliberadamente NÃO-100%-automático.** Não é limitação, é o
modelo de negócio expresso em arquitetura: o valor da loja é a curadoria — o
garimpo, o olho pra veracidade, o preço. Automatizar isso destruiria o
produto. Frases-âncora (todas do código/docs da frente):

- "Dois portões reais, zero mecanismo novo." (`borda/README.md`)
- "O produto certo aqui era menos inteligente de propósito." (`docs/borda-hub-caio.md`)
- "A máquina rascunha; quem decide o que é real é o humano." (`PRODUCT.md` da NSC)
- "Andaime mecânico, não IA." (`lib/caption.ts`)

**Erro de venda a evitar (aconteceu no post 03 v3):** vender como "100%
automático" e mostrar a peça crua como problemática. Leitura errada: "o
sistema é o problema". Leitura certa: "rascunho cru não é lixo: é o
formulário dele esperando conserto" — o sistema DÁ VISIBILIDADE ao que falta.

## Quem decide o quê (a divisão que o post precisa mostrar)

| O humano define | A máquina fornece |
|---|---|
| Garimpo (achar a peça no Mercari — know-how do Caio) | Molde de legenda (costura os campos na moldura fixa, zero decisão) |
| Nome/título da peça | Meia-enriquecida (busca foto, título japonês, condição — sem traduzir, sem julgar) |
| Tamanho + observação (inclusive defeito — só o que o humano digitou) | Gates que bloqueiam erro caro no servidor |
| Raridade/veracidade (o olho do Caio + a conferida do Bruno) | Gestão de estado: fila → no ar → gestão de peças |
| Preço (fechado, já com frete e imposto) | Disparo agendado (n8n cron 30min → WAHA, ~0 token) |
| Aprovação final (gate comercial) | Registro do lead + contador "N querem essa" |
| Atendimento 1:1 e follow-up | O APONTAMENTO do follow-up ("avisa no pv que sumiu") |

## O fluxo em 8 passos

1. **Garimpo** — Caio acha a peça no Mercari (100% humano, é o moat).
2. **Settar infos** — aba Garimpar: link + título + preço R$ + Tam/observação
   (até 20 peças por leva).
3. **Fila** — rascunho entra cru e VISÍVEL ("formulário esperando conserto").
4. **Enriquecimento** — botão "Buscar do Mercari" puxa foto/título
   japonês/condição; tradução e redação seguem humanas (Bruno).
5. **Aprovação** — gate do Caio: preço, encaixe, Tam. Um toque.
6. **Disparo** — n8n a cada 30 min posta no grupo com legenda no molde.
7. **Lead** — cliente clica "🏁 Quero essa peça" → 1:1 no WhatsApp → sistema
   registra o interesse e avisa o Bruno ("2ª pessoa nessa peça").
8. **Follow-up** — o card mostra "N querem essa" e, se a peça sumiu do
   Mercari, manda avisar no pv. Quem avisa é humano.

## Os gates (a parte mais vendável — controle, não automação)

**Duros (bloqueiam no servidor; "botão desabilitado não é segurança"):**
- Sem preço não aprova · sem legenda não aprova · placeholder de título barra.
- Freio do iene: `¥ 2.500` rejeitado (viraria "R$ 2,50" no grupo).
- Linha já postada é história: não se edita por botão.
- Peça já vendida no Mercari não se enriquece.
- PII do lead nunca chega na tela do dono (só o contador).

**Macios (avisam e deixam o humano concluir — bloquear treinaria a ignorar):**
- Preço da legenda ≠ preço do campo → mostra os dois, "vale o da legenda".
- 4+ peças aprovadas paradas → "chama o Bruno" (ban do número é quando, não se).

**Casos reais que provam o gate humano (usáveis em peça, sem inventar):**
- Boné DEKRA falso pego ANTES de ir pro grupo (13/07) → `bloqueado`, nunca republicar.
- Condição subestimada (row 5) corrigida na aprovação.
- Reedição 2018 de boné "de época" segurada como ressalva de curadoria.

## O que NUNCA automatiza (e por quê)

Escolher peça · traduzir/redigir/julgar · aprovar · inventar defeito que o
humano não digitou (regra de 16/07, já foi tentado e revertido) · responder
cliente (o bot NÃO responde; quem atende é o Bruno). Automatizar o
enriquecimento sem repor o freio = "remoção silenciosa do freio que já pegou
peça falsa duas vezes" (aviso escrito em `docs/borda-hub-caio.md`).

## Pra onde isso vai (ROADMAP — rotular como futuro em toda peça)

O Bruno vai evoluir o Borda em público e produtizar pra outras lojas/empresas:
- **Agente de busca de ofertas** (Hermes agent) garimpando candidatos — com a
  curadoria humana mantida por cima.
- **Nota de veracidade da peça**: o agente pontua a chance de a peça ser
  legítima; a decisão continua humana (o gate ganha instrumento, não some).
- **Outras lojas**: o kit "loja-in-a-box" com o Borda como painel do dono.

CTA de conteúdo derivado disso: "me segue pra acompanhar a evolução desse
sistema" (build in public) — além do "me chama" padrão da marca.

## Ressalvas de honestidade (não vender como pronto)

- O teste-mestre ("o Caio abre no celular, aprova sozinho e não pergunta
  nada") ainda estava em aberto na última doc — há sinal de uso real, mas o
  ciclo ponta a ponta não foi carimbado. Não afirmar "dono opera 100% sozinho,
  validado".
- "Avisar interessados" automático e `/confere-ofertas` NÃO existem — o
  sistema aponta, o humano faz.
- Números da loja (R$ 200k/6m etc.) são do Caio: porte de terceiro, nunca
  receita do Bruno (regra da evidencia-bruno).
