---
tipo: conteudo
projeto: motor-ofertas
formato: stories 9:16 (1080x1920) · destaque do Instagram
destaque: "FAQ"
status: pronto para subir
---

# Destaque — "FAQ"

**Arquivos:** `capa.png` (capa do destaque) + `tela-1.png` … `tela-6.png` (nessa ordem).
**Fonte:** `destaque.html` (design system V1, render headless 1080×1920).

## Como subir
1. Publica `tela-1` … `tela-6` como stories, na ordem.
2. Cria o destaque "FAQ" e adiciona os 6.
3. Capa do destaque → `capa.png` (o app recorta o círculo no centro; a arte já é só o ícone centrado).
4. Na `tela-6`, cola o **sticker de link** do grupo: `https://chat.whatsapp.com/GvYbIleIhNu2S7mG6AsJMI`.

## Roteiro das telas
1. **Abertura** — "Perguntas frequentes" (fundo escuro).
2. **Prazo** — 20 a 40 dias em média depois que sai do Japão; chega no escritório em Mogi das Cruzes.
3. **Pagamento** — antecipado; Pix, débito ou crédito em até 12x (Mercado Pago).
4. **Custos** — frete internacional e impostos já no valor anunciado; o cliente só paga o envio de Mogi até ele.
5. **Trocas** — não há troca nem devolução; a contrapartida é descrição e foto fiéis ao estado.
6. **CTA** — pergunta no grupo + sticker de link.

## De onde vêm as respostas
Dado real do Caio (`briefs/2026-07-13-faq-respostas.txt`), consolidado em **`docs/logistica-mercari.md`** — que é a fonte da verdade. Se a operação mudar (prazo, forma de pagamento, política de troca), **muda lá primeiro** e depois propaga pra este destaque, pro post "Como funciona" e pra LP.

> ✅ **@ confirmado (14/07/2026):** o perfil é [@nipponspeedco](https://www.instagram.com/nipponspeedco/). O handle usado nos slides e na legenda está correto, nada a trocar.

> **Cuidado com a promessa:** o prazo conta **da saída do Japão**, não do fechamento do pedido (o garimpo vem antes). E o envio Mogi→cliente é por conta do cliente. As duas coisas estão escritas assim de propósito.

## Render
```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho-absoluto-desta-pasta>"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1080,1920 --virtual-time-budget=6000 \
  --screenshot="$DIR/capa.png" "file:///$DIR/destaque.html#capa"
for n in 1 2 3 4 5 6; do
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1920 --virtual-time-budget=6000 \
    --screenshot="$DIR/tela-$n.png" "file:///$DIR/destaque.html#s$n"
done
```
