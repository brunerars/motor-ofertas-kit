---
tipo: conteudo
projeto: motor-ofertas
formato: stories 9:16 (1080x1920) · destaque do Instagram
destaque: "Como funciona"
status: pronto para subir (aguarda @ oficial)
---

# Destaque — "Como funciona"

**Arquivos:** `capa.png` (capa do destaque) + `tela-1.png` … `tela-5.png` (nessa ordem).
**Fonte:** `destaque.html` (design system V1, render headless 1080×1920).

## Como subir
1. Publica `tela-1` … `tela-5` como stories, na ordem.
2. Cria o destaque "Como funciona" e adiciona os 5.
3. Edita a capa do destaque → escolhe `capa.png` (o app recorta o círculo no centro; a arte já é só o ícone centrado, sem texto — o nome vem do campo do app).
4. Na `tela-5`, cola o **sticker de link** apontando pro grupo: `https://chat.whatsapp.com/GvYbIleIhNu2S7mG6AsJMI` — a arte já diz "toca no link do grupo".

## Roteiro das telas
1. **Abertura** — "Como funciona · Do garimpo no Japão à sua porta" + rota JP→BR (fundo escuro).
2. **Passo 1 · Origem** — Garimpo no Japão (ícone lupa).
3. **Passo 2 · Importação** — Logística própria, frete e impostos por nossa conta (ícone caixa).
4. **Passo 3 · Entrega** — Entrega no Brasil, peça conferida e fotografada (ícone casa).
5. **CTA** — Peças novas toda semana no grupo + sticker de link.

> ⚠️ **@ ainda placeholder:** a `tela-5` usa `@nipponspeedco`. Quando o perfil existir, trocar no HTML e re-renderizar só essa tela.

> Copy dos 3 passos = a mesma do post 4:5 (`marca/conteudo/como-funciona/`) e da LP. Fonte da verdade: `logistica-mercari.md`. Se a operação mudar, muda lá e propaga pros três.

## Render
```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho-absoluto-desta-pasta>"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1080,1920 --virtual-time-budget=6000 \
  --screenshot="$DIR/capa.png" "file:///$DIR/destaque.html#capa"
for n in 1 2 3 4 5; do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1920 --virtual-time-budget=6000 \
    --screenshot="$DIR/tela-$n.png" "file:///$DIR/destaque.html#s$n"
done
```
