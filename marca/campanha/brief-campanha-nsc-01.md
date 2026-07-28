---
tipo: brief-campanha
loja: Nippon Speed Co.
canal: Meta Ads (Facebook + Instagram)
status: campanha 01 fechada (v1) — criativo + copy prontos; sobe quando os gates fecharem
criado: 2026-07-08
revisado: 2026-07-08 (funil corrigido pelo Caio)
---

# Brief da Campanha 01 — Nippon Speed Co. (Meta Ads)

> **Funil real (validado pelo Caio):** anúncio → Instagram (vitrine que aquece) e/ou LP → **entrar no grupo** → a pessoa acompanha os garimpos → **quando bate o olho numa peça, ela chama (x1)**. O grupo é o destino da campanha. O x1 é o segundo passo, só depois do interesse. Peça é única: quando a pessoa chamar, pode estar disponível ou não, e tudo bem.

## 1. Objetivo e KPI
- **Objetivo Meta:** Tráfego. A campanha existe pra **encher o grupo** de gente certa, passando pela vitrine (Insta) ou pela LP.
- **Teste de destino (decisão do Caio: rodar os dois):**
  - **Rota A — perfil do Instagram:** replica o que já converte. O feed aquece e dá prova social, a bio leva à LP e ao grupo.
  - **Rota B — LP direto:** menos passos até o grupo. Insta fica como prova social e pool de retargeting.
  - Deixa o **custo por entrada no grupo** decidir qual escala.
- **KPI primário:** custo por entrada no grupo. **Secundários:** cliques no link, visitas ao perfil, seguidores ganhos, CTR.
- **Downstream (não é meta da campanha):** conversas 1:1 e vendas fechadas (fonte da verdade = Baserow). Isso vem depois, naturalmente.

## 2. Oferta e posicionamento (gancho: comunidade/curadoria + escassez)
Vender o **acesso** e a **curadoria**, nunca uma peça específica com estoque garantido. As peças mostradas são **exemplos do tipo de garimpo**, não catálogo.
> Todo dia a gente garimpa memorabilia de F1 e automobilismo direto do Japão. Entra no grupo e acompanha os achados. Peça é única: quando aparece a tua, você chama. Quando some, some.
- Pilares: garimpo no Japão · peça única (escassez real) · de colecionador para colecionador · do Japão pro Brasil sem complicação.
- **Não prometer disponibilidade** de item específico. A escassez é a mecânica, não só o gancho.
- Preço fica sob consulta no grupo (não expor R$ no anúncio).

## 3. Público
Mesmo com o Advantage+ abrindo o público no automático, começar com sementes de interesse:
- Fórmula 1 · Ayrton Senna · Michael Schumacher · Ferrari · McLaren · Williams · automobilismo · Grande Prêmio
- Colecionismo · vintage / streetwear de automobilismo · miniaturas / capacetes
- Idade 25 a 55, Brasil, gênero amplo (tende a masculino). Deixar o algoritmo expandir.

## 4. Estrutura da campanha
- 1 campanha (Tráfego) → **2 conjuntos** (A = perfil Instagram · B = LP) com o mesmo público e os mesmos criativos → 3 a 4 criativos cada.
- **Orçamento sugerido de teste:** R$ 40/dia por 7 dias (R$ 280), dividido entre as duas rotas (R$ 20 + R$ 20). Deixar rodar sem mexer nos 3 primeiros dias (fase de aprendizado).
- Posicionamentos: Advantage+ placements (feed + stories + reels).

## 5. Criativos (carrossel estático)
- Formato: **carrossel** 1080x1350 (feed) + variação 1080x1920 (stories), no design system NSC (Editorial Garage: tinta sobre papel, Anton, vermelho de corrida). Gerar via `/nanobanana` a partir do acervo.
- Sequência dos cards (4 a 6):
  1. **Capa/gancho:** "Garimpo de F1 direto do Japão" + wordmark NSC.
  2. Boné Schumacher F1 Ferrari DEKRA (exemplo de garimpo).
  3. Peltor de box '00 (colecionável) ou camisa de box Mercedes (exemplo).
  4. Boné Suzuka '90 / variedade (exemplo).
  5. **CTA:** "Entra no grupo e acompanha. Peça é única: quando some, some."
- Deixar claro na arte que são **exemplos** do que rola, não estoque fixo.
- Testar 3 a 4 versões de capa (a capa é o que mais move CTR).

## 6. Copy (rascunho, na voz da marca)
**Texto principal v1 (comunidade):**
> Todo dia a gente garimpa memorabilia de Fórmula 1 e automobilismo direto do Japão. Bonés de equipe, itens de Grand Prix, peças que marcaram época. Entra no grupo e acompanha os achados. Peça é única: quando aparece a tua, você chama. Quando some, some.

**Texto principal v2 (prova/variedade):**
> Do Japão pro Brasil, a gente garimpa o que colecionador quer: bonés de equipe, itens raros de automobilismo, peças de outra época. Toda semana tem coisa nova no grupo. Entra e fica de olho.

- **Título:** Garimpo de F1 direto do Japão
- **Descrição:** Curadoria de colecionador
- **Botão:** Saiba mais (Rota B, leva à LP) · na Rota A o destino é o perfil.
- **Na LP e na bio do Insta:** botão claro "Entrar no grupo".

## 7. Mensuração
- Meta: cliques no link, visitas ao perfil, CTR, CPM, por conjunto (A vs B).
- Atribuição da entrada no grupo (imperfeita, mas suficiente pra decidir):
  - Rota B (LP): UTM na campanha + medir cliques no botão "Entrar no grupo".
  - Rota A (Insta): link da bio com encurtador próprio (mede clique) + visitas ao perfil.
  - Cruzar com o **crescimento líquido do grupo** no período (contagem manual/Baserow).
- Downstream: conversas 1:1 e vendas fechadas no grupo (Baserow).

## 8. Pré-requisitos (gates antes de subir)
1. **Perfil do Instagram populado** (feed com peças, prova social) e conta business, conectado a uma página do Facebook. Isso ficou mais crítico com a Rota A.
2. Meta Business Manager + método de pagamento.
3. LP com botão claro "Entrar no grupo" e o **link real do grupo** (trocar o número/placeholder de teste).
4. Grupo do WhatsApp criado, com regra/mensagem de boas-vindas.
5. WhatsApp Business pro x1 downstream (menos urgente, mas o número já tem que existir).

## Assets prontos (v1) — `marca/campanha/carrossel-01/`
- **Carrossel feed** (1080x1350): `slide-1..5-*.png` (capa · boné Ferrari DEKRA · camisa McLaren-Mercedes/West · boné Suzuka '90 · CTA).
- **Stories** (1080x1920): `story-1..5-*.png`.
- **Copy**: `copy.md` (3 variações de texto principal + títulos + descrição + legenda orgânica).
- **Fontes editáveis**: `carrossel.html` e `stories.html` (trocar foto/texto e re-renderizar é rápido).
- Placeholders a fechar antes de subir: **@ real do Insta** (hoje `@nipponspeedco`) e **link do grupo**.

## 9. Próximos passos
- [x] **Carrossel gerado** (feed + stories) no design system NSC, com fotos reais e carimbo "peça única".
- [x] **Copy fechada** (V1 comunidade · V2 escassez · V3 nostalgia); teste começa com V1 + V2.
- [ ] `/deep-research` de benchmark do nicho (CPM/CPC, ângulos que funcionam em memorabilia/colecionismo no BR).
- [ ] Popular o feed do Instagram (a Rota A depende disso) via `/conteudo` + acervo.
- [ ] Fechar os placeholders (@ do Insta + link do grupo) e trocar nas artes/copy.
- [ ] Quando os gates fecharem: montar a campanha (2 conjuntos A/B) e subir o teste de R$40/dia.
- [ ] (Se for repetir por loja) bakear a skill `/brief-campanha` que gera este documento a partir do design system + acervo + logística.

## Relacionado
[[motor-ofertas-nsc]] · [[caio-logistica-japao]] · producao-conteudo-direcao · lp-mobile-first-standard
