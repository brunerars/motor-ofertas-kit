# Direção C — "As eras"

Carrossel de feed, 6 slides, 3:4 (1080×1440). Exploração em cima do post
`04-suzuka-cobrou-duas-vezes`, que tirou 25/40 no critique e falhou o teste de AI slop.

## A direção em duas linhas

A cor de cada slide vem da **livery daquele carro naquele ano**, não do vermelho-símbolo genérico de
F1. O ano deixa de ser rótulo de 21px no canto e vira o corpo estrutural do slide, o degrau que faltava
entre o corpo e o título.

## A referência, com nome

**As artes de ano do próprio Caio**, em `marca/referencia/Nippon Speed Co. bruno/`
(`1970-1975.png` Lotus 72 · `1988 .png` McLaren MP4/4 · `1994 .png` Benetton B194 · `2000.png` Ferrari
F2004). Não é referência de fora: é o sistema que o dono da loja já usava antes de existir skill.

**O que foi herdado — o sistema:**
- a paleta muda com a era: preto+dourado JPS nos anos 70, vermelho+branco McLaren em 1988, azul-verde
  Mild Seven em 1994;
- o nome do carro/ano é o elemento tipográfico maior da arte;
- texto vive em bloco chapado, com aresta, nunca dissolvido em gradiente.

**O que NÃO foi herdado — o acabamento amador:** tarja preta atrás de cada linha de texto, bullet com
hífen, fundo borrado com a foto ampliada, sombra em tudo. Aqui o campo de cor é chapado e a foto é um
retângulo de aresta dura, sem scrim e sem texto por cima.

## As cores de era criadas (declaradas no `DESIGN.md`)

| Token | Hex | De que livery/ano | Contraste |
|---|---|---|---|
| `era1989McLarenRed` | `#c8102e` | faixa Marlboro da **McLaren MP4/5 (1989)**; a MP4/6 de **1991** usava a mesma | 5,9:1 com `paper` |
| `era1990FerrariRed` | `#d10a11` | rosso da **Ferrari 641 (1990)**, o carro de Prost | 5,6:1 com `paper` · 5,1:1 sobre `paper` |
| `era1990SuzukaGold` | `#c9a227` | o **bordado dourado do boné do GP do Japão 1990** — a peça do slide 6 | 7,8:1 sobre `ink` |

O branco da McLaren **não virou token novo**: é o `paper` (#f5f5f5) que já existia. Duplicar token por
narrativa é como design system apodrece.

## O arco de cor do carrossel

| Slide | Ano | Campo | Por quê |
|---|---|---|---|
| 1 · capa | 1989 › 1990 | tinta + placa dividida branco \| vermelho | a tese antes da história: uma equipe → duas equipes |
| 2 · o mesmo box | 1989 | **branco-papel** (carroceria da MP4/5), ano em vermelho Marlboro | eram dois carros idênticos: um campo só |
| 3 · venceu na pista | 1989 | **idem, espelhado** (texto em cima, foto embaixo) | mesmo ano, mesmo carro: a cor não tem motivo pra mudar. O que muda é a ordem |
| 4 · a conta chegou | 1990 | **a costura** — metade Ferrari vermelha, metade McLaren branca | agora são dois times, e o conflito cromático É a história |
| 5 · ele mesmo contou | 1991 | **vermelho Marlboro chapado**, texto branco | a MP4/6 invertida: o vermelho vira chão. O ano em que a história foi contada ao contrário |
| 6 · a peça | 1990 | tinta + **dourado** | o ano fecha a linha do tempo onde a peça nasceu |

**O slide 4 é onde a direção ganha.** O "1990" cai exatamente em cima da emenda: "19" sai branco no
vermelho, "90" sai vermelho no branco. Embaixo, `PROST · FERRARI` na metade vermelha e
`SENNA · McLAREN` na branca. A foto acima já tem a Ferrari embaixo à esquerda e a McLaren branca em
cima à direita — a barra continua esse eixo.

## O que mudou em relação ao post atual

| Atual | Aqui |
|---|---|
| eyebrow tracked em 6 de 6 slides | **zero eyebrow**. O ano é o rótulo |
| ano a 21px no canto superior direito | ano a **236–400px**, é o objeto do slide |
| foto sangra do topo e derrete num gradiente pra tinta | foto é **retângulo de aresta dura**, sem scrim, sem texto por cima |
| 6 slides no mesmo escuro | **arco de cor**: tinta → branco → branco → dividido → vermelho → dourado |
| escada tipográfica 34 → 96, sem degrau | **34 → 96 → 236** (razões 2,8 e 2,5) |
| dots como marcador | **fita do tempo** no rodapé: 6 células, cada uma com a cor da era daquele slide. A espinha 1989→1989→1990→1991 fica visível em todo slide |
| capítulos sempre foto-em-cima | s2 foto em cima, s3 espelhado. Ritmo sem trocar de gramática |

Cromo constante nos 6: tarja de tinta com o lockup no topo + fio de 7px na cor da era + fita do tempo
no rodapé.

## Gates

- **Detector impeccable:** exit 0 (`node .claude/skills/impeccable/scripts/detect.mjs
  marca/conteudo/exploracao/direcao-c-eras/post.html`, cwd em `projetos/Nippon-Speed`).
  **Sem nenhum waiver** — o post atual tinha dois.
- **Gate factual:** capítulo de 1989 com foto de 1989 (`s2.jpg`, `s3.jpg`), 1990 com foto de 1990
  (`s4.jpg`). A paleta de cada slide depende disso.
- **Diacrítico:** `GP DO JAPÃO` com `line-height: 1.2` (regra dura do `DESIGN.md`).
- **AA:** corpo ≥ 4,5:1 nas três paletas de era (tabela acima). Tinta sobre papel = 18,6:1.
- **Miniatura:** a capa aguenta 170px de largura — título em 3 linhas de Anton e a placa 1989 \| 1990
  em dois blocos de cor. Na tira dos 6 o arco cromático é o que se lê primeiro.

## Onde está fraco (honesto)

1. **A capa é o slide que menos usa o próprio sistema.** Continua sendo tinta com título grande; a
   gramática de era só aparece na placa do rodapé. Na grade do perfil é o menos distintivo dos seis.
2. **O slide 5 sozinho é o mais frágil contra o teste de slop** — vermelho chapado com tipo branco é a
   coisa mais previsível que se faz em F1. Ele só se defende pela **sequência** (chega depois de dois
   slides brancos). Fora do carrossel, é genérico.
3. **s2 e s3 dividem a paleta de propósito**, mas quem passa rápido pode ler como slide repetido. O
   espelhamento segura, e é o único freio.
4. **Três superfícies por slide** (tarja de tinta, campo de era, foto) dão muita aresta. Funciona no
   3:4 justamente porque as arestas são horizontais e full-bleed, mas é um sistema que perdoa pouco:
   errar 20px de altura estoura o campo.
5. **A fita do tempo substitui os dots** do design system V1. É decisão do Bruno se ela vira padrão ou
   se volta pros dots.
6. As fotos seguem sendo de terceiros (Pinterest), risco já assumido em 14/07.
