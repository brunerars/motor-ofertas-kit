---
name: marca
description: Gera o design system de uma marca (design-system2.html) a partir de um site de referência (template Webflow), aplicando o método Extract HTML Design System + camada de motion própria + recorte de logo/hero. É o 1º passo do Bloco Marca (semente reutilizável por loja). Use quando o Bruno quiser montar a identidade/design system de uma loja nova a partir de uma referência.
---

# Marca — referência → design system vivo

Transforma um site de referência (template Webflow baixado) no `design-system2.html` da marca: pattern library viva com tipografia, cores, componentes e motion. É a **semente** que a `/lp` e os posts consomem. Reutilizável por loja (o "testar várias lojas rápido").

## Input
- **Referência de design:** template Webflow baixado (via `sd.asimov.academy`) em `<projeto>/marca/referencia/<nome>/` (index.html + assets). Preferir template de loja/e-commerce da categoria certa.
- **Assets da marca:** logo(s), capas, imagens (em `<projeto>/marca/referencia/<Marca>/` ou `marca/assets/`).
- **Identidade:** nome + paleta (1 acento forte). Se o template for claro/mono, o acento da marca entra na `/lp`, NÃO aqui (o design system é clone fiel da referência).

## Fluxo
1. **Ler a referência** (index.html + CSS principal + style-guide). Arquivo grande/minificado → delegar leitura a subagente pra não estourar contexto.
2. **Aplicar o método Extract** — usar `extract-design-system-prompt.md` (nesta pasta) na íntegra: hero clone exato (só troca o texto p/ a marca), Typography, Colors, UI Components, Layout, Motion, Icons. Referenciar os MESMOS assets locais (`./assets/...`). NÃO redesenhar/inventar.
3. **Camada de motion própria** (regra dura — não o IX2 do Webflow): progressive enhancement — conteúdo `opacity:1` por padrão; estado pré-reveal só sob classe setada por script síncrono no head; reveal via **IntersectionObserver** (translateY+opacity, transition ~0.5s); rede de segurança `setTimeout` revela tudo; respeitar `prefers-reduced-motion`; cursor nativo se o custom não ficar impecável. Ver [[design-system-extract-motion-gotcha]].
4. **Preparar assets** — recortar logo à bounding box do alpha (canvas retrato grande vira logo minúsculo); recortar hero à faixa limpa (pôster com texto embutido sangra). Usar PIL:
   ```python
   from PIL import Image
   im=Image.open('logo.png'); b=im.getchannel('A').getbbox()
   im.crop((b[0]-18,b[1]-18,b[2]+18,b[3]+18)).save('logo-mark.png')
   ```
5. **Verificar** com screenshot headless (Edge, **profile isolado** `--user-data-dir` senão colide; hero sticky pode encher a captura → neutralizar só no screenshot). Iterar até limpo (sem faixas brancas, sem cursor solto).

## Saída
`<projeto>/marca/referencia/<ref>/design-system2.html` (abre offline). É a referência de tokens; a **pele da marca (dark+acento) entra na `/lp`**.

## NÃO fazer
- Não inventar estilo/cor fora da referência (o Extract é clone fiel).
- Não deixar conteúdo preso em `opacity:0`.
- Não dimensionar logo por height num canvas cheio de transparência (recortar à bbox antes).

## Relacionado
`extract-design-system-prompt.md` (este dir) · próximo passo: `/lp`. Memórias: [[design-system-extract-motion-gotcha]], [[motor-ofertas-nsc]], [[map-before-building-ui]].
