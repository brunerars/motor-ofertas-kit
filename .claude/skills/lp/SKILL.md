---
name: lp
description: Monta uma landing page de loja (self-contained, dark+acento) a partir do design system da marca + acervo de fotos + roteiro-lp/logistica-mercari, e faz o deploy estático na Vercel (com nome decente e sem SSO). É o 3º passo do Bloco Marca. Use quando o Bruno quiser gerar/atualizar a LP de uma loja e subir pra teste (mandar pro cliente).
---

# LP — design system + acervo → landing no ar

Gera a landing de uma loja de logística Mercari e sobe na Vercel pra teste rápido. Consome o design system (`/marca`) e as fotos do acervo (`/acervo`). **Não scrapeia item** (isso é `/agenda`).

## Antes de montar — LER
- `<projeto>/roteiro-lp.md` — tom de voz + estrutura padrão de 7 seções + regras técnicas.
- `<projeto>/logistica-mercari.md` — copy canônica do "como funciona" (3 passos).
- `<projeto>/marca/acervo/index.json` — fotos de produto pra vitrine (preenchido pelo `/acervo`).

## Input
- Design system da marca (`/marca`) — tipografia (Anton+Archivo), grid.
- Marca: nome, logo (recortado à bbox), **paleta dark + 1 acento** (ex NSC: fundo `#0B0B0C`, acento vermelho `#E10600`).
- Peça em destaque + fotos de vitrine (do acervo).
- CTA: link do grupo WhatsApp, ou número de teste `wa.me/55DDDNUMERO` com `?text=` pré-preenchido citando a peça. Placeholder `REPLACE_ME` até ter o real.

## Fluxo
1. Montar `<projeto>/lp/` **self-contained**: `index.html` (fontes Anton+Archivo via Google Fonts CDN; CSS inline), `assets/img/` (marca), `assets/produto/` + `assets/acervo/` (fotos locais — **nada de hotlink**).
2. Estrutura (do `roteiro-lp.md`): nav · hero (bg de época **sem texto embutido** — recortar) · peça em destaque (galeria) · como funciona (3 passos de `logistica-mercari.md`) · vitrine (cards do `acervo/index.json`, cada um linkando `wa.me` com texto citando a peça) · timeline (opcional) · CTA final · footer.
3. **Pele dark + acento** (opção 2). **Motion**: progressive enhancement (IntersectionObserver, conteúdo visível por padrão, sem `opacity:0` preso). Preço = "sob consulta no grupo".
4. **Verificar** headless (Edge profile isolado): desktop 1440 + mobile 390. Nota: em headless o viewport CSS pode ser mais largo que a imagem (clipping falso na direita) — se um botão parecer cortado, checar geometria com probe de `getBoundingClientRect` antes de "consertar" (às vezes é artefato de captura, não bug).
5. **Deploy Vercel** (ver rotina abaixo). Verificar `curl` 200 + assets antes de mandar link.

## Rotina de deploy Vercel (não-interativa) — ver [[vercel-deploy-lp-gotchas]]
```bash
BASE="<projeto>"; set -a; source "$BASE/.env"; set +a   # VERCEL_TOKEN no .env
SCOPE="brunoconstantinou-4051s-projects"
# 1) deploy (scope OBRIGATÓRIO em modo não-interativo)
npx --yes vercel@latest deploy "$BASE/lp" --prod --yes --scope "$SCOPE" --token="$VERCEL_TOKEN" > dep.log 2>&1
DEP=$(grep -Eo "https://[a-z0-9-]+-$SCOPE\.vercel\.app" dep.log | head -1)
# 2) nome decente: renomear projeto (1x) via API depois alias a cada deploy
#    PATCH api.vercel.com/v10/projects/<id> {"name":"nippon-speed-co"}   (só na 1ª vez)
npx --yes vercel@latest alias set "$DEP" nippon-speed-co.vercel.app --scope "$SCOPE" --token="$VERCEL_TOKEN"
# 3) SSO Deployment Protection vem LIGADO (302 → login; cliente não abre). Desligar (1x):
curl -s -X PATCH "https://api.vercel.com/v10/projects/<id>?teamId=team_UAxVjXgJHIfUnZ6lMN8fevvq" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" -d '{"ssoProtection":null}'
```
Pré-vincular pasta pra redeploy não criar projeto novo: `lp/.vercel/project.json` = `{"projectId":"prj_...","orgId":"team_..."}`.
Instância NSC: projeto `nippon-speed-co` (prj_Zvxcj57IQYi3LfW8goOAddrqoFsK), URL https://nippon-speed-co.vercel.app.

## Loop de iteração
Editar `lp/` → rodar deploy + `alias set` (o alias NÃO segue prod sozinho) → mesma URL atualizada. SSO e nome já ficam prontos após a 1ª vez.

## NÃO fazer
- Não scrapear item aqui (fotos vêm do acervo; item real é `/agenda`).
- Não hotlinkar imagem (self-contained). Não versionar `.env`/`.vercel`.
- Não fechar preço (padrão "sob consulta no grupo").

## Relacionado
`roteiro-lp.md` · `logistica-mercari.md` · skills `/marca`, `/acervo`. Memórias: [[vercel-deploy-lp-gotchas]], [[design-system-extract-motion-gotcha]], [[motor-ofertas-nsc]].
