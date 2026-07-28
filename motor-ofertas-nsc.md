---
tipo: projeto
faixa: low-ticket
papel: hub de ESTADO da frente NSC / Motor de Ofertas (no vault)
atualizado: 2026-07-21
aliases: ["motor-ofertas", "nsc"]
---
#foco

# 🏁 Motor de Ofertas / NSC — hub de estado

> Nota-hub de **estado** da frente no vault (os 19 `[[motor-ofertas-nsc]]` resolvem aqui). A **verdade técnica** do código vive no repo e no `projetos/motor-ofertas/CLAUDE.md`; aqui fica decisão + estado + próximo passo. Parceiro: [[caio-logistica-japao]]. Memória: `motor-ofertas-nsc` (`.claude`).

## O que é
Esteira de ofertas curadas do Mercari (Japão) → grupo de WhatsApp. 1ª instância: **Nippon Speed Co.** (memorabilia F1, parceria com o Caio). Fluxo: form/Garimpar do Caio → n8n → Baserow → `/agenda` (enriquece) → Bruno aprova → n8n + WAHA → grupo real → `Disparado`. Curadoria é **humana** (a IA nunca escolhe produto).

## Estado (20/07)
A **Borda do Caio ganhou autonomia** (`nsc-borda.vercel.app`, PR #1): aba Garimpar (manda link de dentro do app), meia-enriquecida (Firecrawl foto+japonês, sem IA), "Gestão de peças", legenda no modelo pronto. Esteira de dois no ar; saiu da Z-API paga pro **WAHA auto-hospedado**.

## 🔴 Ação imediata / pendências críticas
- **Reimportar os 2 workflows no n8n** — os arquivos estão consertados (commit `cccb488`, local), **produção não** → todo lead novo ainda cai na peça errada. Ver `baserow-filtro-vazio-tabela-inteira` (`.claude`).
- **`BASEROW_TOKEN` vazado (15/07) sem rotacionar** — em 3 workflows. Pendência mais velha e séria.
- Decidir onde consertar o "Tam: Tam:" · curadoria (Suzuka=reedição 2018, Honda=furo) · formato do feed 3:4.

## Relacionado
[[caio-logistica-japao]] · [[betchecker]] (frente-irmã low-ticket) · [[apostas-betkillers]] · [[🎯 Foco Atual]]
