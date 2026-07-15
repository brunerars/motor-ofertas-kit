# Garimpo — formulário de entrada do Caio

Página estática (Vercel) onde o **Caio** cola os links das peças que garimpou no Mercari. É o canal de entrada da Fase 2: substitui o "manda link solto no zap" por uma leva organizada que cai direto na fila.

## Fluxo
```
Caio abre o form no celular
  → cola de 1 a 20 links (nota opcional em cada)
  → Enviar  → POST JSON pro webhook do n8n
                → grava cada link como rascunho (Fila) no Baserow
  → /agenda (modo lote) enriquece os rascunhos (foto + tradução + preço)
  → Bruno aprova no Baserow (Fila → Aprovado)
  → n8n de disparo posta no grupo
```
O link cru **não vira post sozinho**: o form só entrega, o `/agenda` completa. Ver `.claude/skills/agenda/SKILL.md` (Modo lote) e `n8n/COMO-IMPORTAR.md` (webhook).

## Antes de publicar (2 placeholders no `index.html`)
- `WEBHOOK_URL` → a Production URL do webhook do n8n (`https://<n8n>/webhook/nsc-garimpo-...`).
- `SECRET` → a mesma string colada no node `Config` do workflow (`form_secret`).

Ambos ficam guardados no `.env` (`N8N_WEBHOOK_URL`, `FORM_SECRET`) — o `index.html` traz `__N8N_WEBHOOK_URL__` / `__FORM_SECRET__` como marcador até serem preenchidos.

## Deploy (Vercel, projeto separado da LP)
```bash
set -a; source ../.env; set +a
npx vercel deploy . --prod --yes --scope <scope> --token=$VERCEL_TOKEN
# desligar SSO Protection (senão bloqueia o Caio) — ver memória vercel-deploy-lp-gotchas
```

## Notas
- `noindex,nofollow` no `<head>` — é uso interno, não indexar.
- O `SECRET` num HTML estático é freio leve de spam (fica legível no fonte), não senha. Pra um form só-do-Caio, o path secreto do webhook + o secret bastam.
- Design system V1 da marca (Anton + Archivo, tinta sobre papel, disco `#e60000`), mobile-first.
