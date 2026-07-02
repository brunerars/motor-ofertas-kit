# Roteiro LP — geração rápida de LP pra loja de logística Mercari

> Guia de TOM + estrutura pra montar uma LP nova nesse estilo em minutos. Semi-padrão: muda a marca, o produto e a paleta; a espinha e a voz ficam.
> Insumo de texto do "como funciona" vem de [[logistica-mercari]]. Identidade/tokens vêm do design system da marca.

## Insumos pra gerar uma LP
1. **Marca:** nome + logo (recortar justo se vier em canvas grande) + paleta (1 acento forte).
2. **Design system:** `design-system2.html` da marca (método Extract). Dá tipografia, grid e motion.
3. **Fotos de produto (só vitrine):** consumir do **acervo da marca** (`marca/acervo/`), preenchido pela skill `/acervo`. **A LP NÃO scrapeia item.** O item real (com tradução/preço/estado) é responsabilidade do `/agenda`, no agendamento — não aqui.
4. **Refs hi-res:** juntar imagens de alta qualidade (ex: Pinterest) ANTES de montar — hero, "como funciona", clima. Screenshot cru não entra.
5. **Logística:** copy dos 3 passos de [[logistica-mercari]].
6. **CTA:** link do grupo (ou número de teste `wa.me` na fase de brincar), com texto pré-preenchido citando a peça.

## Skill `/acervo` (fotos → biblioteca da marca)
Utilitário leve, desacoplado de `/lp` e `/agenda`: recebe URL(s) do Mercari → baixa as N fotos (`static.mercdn.net/item/detail/orig/photos/<id>_N.jpg`) → salva em `marca/acervo/` taggeado. Alimenta vitrine da LP, posts e futuras telas. NÃO traduz/precifica (isso é `/agenda`).

> **Regra dura — curadoria é humana.** A IA NUNCA escolhe/descobre produto (são milhares no Mercari; garimpo é know-how do Caio). Bruno/Caio fornecem as **URLs curadas**; `/acervo` e `/agenda` só processam a lista dada. Input sempre = URL(s) fornecida(s).

## Tom de voz (padrão dessa vertente)
- **Colecionador falando com colecionador.** "Garimpo", "peça que marcou época", "acervo". Nada de linguagem de e-commerce genérico.
- **Escassez honesta:** peça única, quando sai não volta. Sem falsa urgência/countdown.
- **Direto e sem promessa vazia:** procedência, nota fiscal, curadoria. Nunca inventar prazo/preço (ver [[logistica-mercari]]).
- **Nostalgia como gancho:** a era/época do item é o enredo (ex: F1 anos 80–90).
- Português BR, frases curtas, verbo no presente.

## Estrutura padrão da página (ordem)
1. **Nav** — logo + 3 links + CTA vermelho "Entrar no grupo".
2. **Hero** — imagem de época (SEM texto embutido; recortar faixa limpa se precisar) + overlay escuro. Headline do nome da marca (display condensado), subhead do nicho, micro-linha (anos · origem→destino), CTA grupo.
3. **Peça em destaque** — galeria (foto principal + miniaturas), marca, título, badges de estado, descrição PT, meta (categoria/origem), "valor e frete sob consulta no grupo", CTA.
4. **Como funciona** — 3 passos de [[logistica-mercari]] (com imagem/ícone por passo).
5. **Timeline / prova** — linha do tempo de eras ou grade de peças, pra dar lastro de acervo.
6. **CTA final** — bloco forte "entre no grupo e receba antes de todo mundo" + botão.
7. **Footer** — logo, tag origem→destino, ano.

## Design (padrão)
- Base **escura + 1 acento** da marca (NSC = vermelho de corrida `#E10600`). Fundo `#0B0B0C`, superfície `#141416`, texto `#F5F5F5`, mudo `#A2A2A2`.
- Tipografia: display condensado (Anton) + corpo (Archivo). Uppercase nos títulos.
- Motivo temático com parcimônia (xadrez de bandeira, hinomaru).

## Regras técnicas (não repetir os erros já pegos)
- **Self-contained** pra Vercel: fontes via Google Fonts CDN; imagens locais em `assets/`; nada de hotlink.
- **Imagens de card:** não jogar screenshot cru como foto de passo — usar imagem tratada/gerada (ver nota abaixo). Recortar logos/heros pra bounding box (evitar canvas transparente gigante = elemento minúsculo).
- **Motion:** progressive enhancement — conteúdo `opacity:1` por padrão, reveal via IntersectionObserver, nunca preso invisível. Ver [[design-system-extract-motion-gotcha]].
- **CTA:** todos apontam pro grupo. Placeholder `REPLACE_ME` até ter o link real.
- **Preço:** "sob consulta no grupo" (padrão atual).

## Imagens dos passos "como funciona"
Screenshots crus ficam feios como foto de card. Opções (em ordem de preferência):
1. Gerar 3 imagens branded por IA (`/nanobanana`) no clima da marca (garimpo/importação/entrega).
2. Referências reais tratadas (foto de peça, caixa etiquetada, print do grupo desfocado).
3. Ícone/ilustração minimalista + fundo da paleta (sem foto).

## Fluxo de deploy (teste rápido)
`vercel --prod --token=$VERCEL_TOKEN --yes` de dentro da pasta da LP → URL de teste pro cliente ver. Ajuste aqui → redeploy → novo link.

## Relacionado
[[logistica-mercari]] · [[motor-ofertas-nsc]] · [[design-system-extract-motion-gotcha]] · [[producao-conteudo-direcao]]
