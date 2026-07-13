---
tipo: conteudo
projeto: motor-ofertas
formato: stories 9:16 (1080x1920) · destaque do Instagram
destaque: "FAQ"
status: BLOQUEADO — falta dado real do Caio
---

# Destaque "FAQ" — o que falta pra produzir

O destaque de FAQ não foi produzido nesta rodada (13/07) porque metade das perguntas que um comprador faz depende de **dado que a gente ainda não tem**. `logistica-mercari.md:32` proíbe afirmar prazo em dias, valor de frete, percentual de imposto e política de troca sem número vindo do Caio. Inventar aqui vira promessa quebrada no 1:1.

## Perguntas que JÁ dá pra responder (copy pronta na cabeça, só montar)
1. **O que é a Nippon Speed Co.?** Curadoria de memorabilia de F1 e automobilismo vintage garimpada no Japão. De colecionador para colecionador.
2. **Como eu compro?** As peças caem no grupo do WhatsApp. Bateu o olho, você chama a gente no 1:1 e fecha.
3. **Por que peça única?** É garimpo, não estoque. Cada peça é uma. Quando some, some.
4. **Quanto custa?** Valor e frete são fechados no grupo, caso a caso (não tem tabela).
5. **Vou pagar imposto ou frete internacional?** Não. Frete internacional e impostos entram por nossa conta.
6. **Como recebo?** Você retira com a gente ou recebe por Correios/transportadora, como preferir.

## Perguntas que dependem do Caio (não produzir sem isso)
- [ ] **Prazo médio Japão → Brasil** (em quanto tempo a peça chega depois que fecha?)
- [ ] **Formas de pagamento** (Pix, cartão, parcelamento?)
- [ ] **Troca / garantia** (e o que acontece se a peça chegar diferente do anunciado?)
- [ ] **Frequência real** ("peças novas toda semana" se sustenta? quantas por semana?)

## Quando os dados chegarem
Clonar `marca/conteudo/destaques/como-funciona/destaque.html` (mesma malha 9:16, safe area já resolvida), trocar as telas por pergunta/resposta e renderizar `capa.png` + `tela-1..N.png`. Ícone sugerido pra capa: interrogação line-art no mesmo anel vermelho.
