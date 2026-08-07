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

**Próximo passo:** rodar mais ~10 URLs pelo método na mão antes de virar app (é o que
revela se a régua quebra). Depois: FastAPI na KVM 2 pela esteira do `pulse`, chamado
pelo n8n na entrada do garimpo. A regra travada segue: **o agente instrui, o Bruno
decide**.

## 🔴 Ação imediata / pendências críticas
- **Reimportar os 2 workflows no n8n** — os arquivos estão consertados (commit `cccb488`, local), **produção não** → todo lead novo ainda cai na peça errada. Ver `baserow-filtro-vazio-tabela-inteira` (`.claude`).
- **`BASEROW_TOKEN` vazado (15/07) sem rotacionar** — em 3 workflows. Pendência mais velha e séria.
- Decidir onde consertar o "Tam: Tam:" · curadoria (Suzuka=reedição 2018, Honda=furo) · formato do feed 3:4.

## Relacionado
[[caio-logistica-japao]] · [[betchecker]] (frente-irmã low-ticket) · [[apostas-betkillers]] · `🎯 Foco Atual`
