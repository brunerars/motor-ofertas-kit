# Product

## Register

brand

## Users

**Colecionador e entusiasta de Fórmula 1 clássica**, sobretudo a era 1980-2000 (Senna, Prost, Schumacher, McLaren-Honda, a Ferrari vermelha). Rola o feed no celular, em momento de lazer, e reconhece uma peça de época pela livery, pelo patrocinador e pelo ano.

Valoriza **procedência acima de preço baixo**: quer saber de onde a peça veio, de que temporada é, e se é de época ou reedição. Desconfia de loja que trata memorabilia como produto de prateleira.

O trabalho que ele quer resolver: **encontrar peça de verdade, com história, sem cair em falsificação**. A Nippon Speed Co. garimpa no Mercari japonês e traz pro Brasil; a curadoria é do Caio, que mora no Japão.

## Product Purpose

Vender memorabilia de automobilismo vintage importada do Japão, através de **dois canais com papéis distintos** (travado em 08/07):

- **Feed = autoridade e branding.** Carrossel narrativo: história primeiro, produto só no último slide como desfecho. **Não vende, não tem badge, não tem preço.**
- **Stories, fixados do grupo e WhatsApp = venda.** Cartão de peça com badge "sob encomenda" e chamada direta.

Sucesso do feed não é venda no post: é a marca virar **referência de cultura de automobilismo** para que o grupo de WhatsApp, onde a venda acontece, encha de gente certa.

## Brand Personality

**Colecionador falando com colecionador.** Nunca loja falando com comprador.

Três palavras: **garimpeira, nostálgica, confiante.**

Vocabulário de garimpo (peça que marcou época, acervo, procedência). Informal e de dentro da cultura. Nostálgico sem ser melancólico, confiante **sem euforia de vendedor**. Frase curta, redonda e direta, **sem travessão**, verbo no presente.

Emoção-alvo ao rolar o feed: **reverência pela era**, e o reconhecimento de quem viveu aquilo. O desejo de posse vem depois, e vem sozinho.

## Anti-references

**Visuais (escolhidos pelo Bruno):**
- **Loja de hype/streetwear.** Drop, contagem regressiva, néon, urgência fabricada. Bate de frente com a escassez honesta: a peça é única e isso já basta.
- **Slide de apresentação corporativa.** Eyebrow em cima de toda seção, marcador `01/02/03` como andaime, card atrás de card. É exatamente o slop que o detector bane.
- **Conta de fã de F1** (vizinho mais próximo, logo o mais perigoso): colagem, logo de equipe espalhado, texto carimbado por cima da foto.

**De linguagem** (do `conteudo/voice-model.md`): travessão · falsa urgência ou countdown · promessa de preço/prazo · "linguagem de IA genérica" ("no mundo de hoje", "vamos mergulhar", "além disso") · tratar peça vintage como produto de prateleira.

## Design Principles

1. **História primeiro, peça no fim.** O feed compra atenção com narrativa, não com oferta. O produto é a recompensa emocional do último slide, nunca o argumento do primeiro.
2. **Fato checado ou não sai.** A autoridade da marca depende de acertar a era. Errar o ano de uma foto custa mais caro que deixar de postar. Na dúvida, suavizar ou perguntar.
3. **Escassez honesta.** Peça única, quando sai não volta. Isso é verdade e é suficiente. Nenhum mecanismo de urgência artificial.
4. **A curadoria é humana.** A máquina rascunha; quem decide o que é real, o que é publicável e o que desqualifica uma peça é o Bruno com o Caio. Vale pra escolha de foto, de peça e de licenciamento.
5. **Cada post fala de UMA era.** Misturar 1989 com 1990 na mesma imagem destrói a credibilidade com quem reconhece a livery. Coerência temporal por slide.

## Accessibility & Inclusion

- **WCAG AA** como piso: corpo ≥ 4.5:1, texto grande (≥18px ou bold ≥14px) ≥ 3:1.
- **Teste de miniatura (requisito da marca, além do AA):** o slide precisa continuar legível na **grade do perfil**, onde vira miniatura pequena. Título que só funciona em tela cheia falhou.
- Leitura acontece **no celular, muitas vezes sob luz forte**. Contraste é funcional, não estético: cinza claro "por elegância" está banido.
- Conteúdo é estático (PNG). Sem dependência de motion, hover ou interação, o que já elimina a classe de problemas de `prefers-reduced-motion`.
