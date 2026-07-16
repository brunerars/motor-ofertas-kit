# SETUP — rodar o Motor de Ofertas

Runbook acionável. O `README.md` explica **o que é**; aqui é **como rodar** (na NSC ou numa loja nova). As skills estão em `.claude/skills/` deste repo — abrindo o Claude Code na raiz, elas aparecem.

## 0. Pré-requisitos
- **Claude Code** · **n8n** (hospedado, pro disparo) · **WAHA** (container próprio, pro WhatsApp) · contas: **Firecrawl · Baserow · Vercel**.

## 1. Configurar — PARTE HUMANA (1×)
1. `cp .env.example .env` e preencha os tokens (cada chave tem a origem no arquivo).
2. **WhatsApp (WAHA, auto-hospedado — sem mensalidade):** suba `waha/stack-vps.yml` no Portainer (Swarm+Traefik, `network_public`; as 5 `WAHA_*`/`WHATSAPP_*` vão na env da stack). DNS: A `waha` → IP da VPS, **Cloudflare DNS-only**. Abra `https://waha.<seu-dominio>/dashboard` e escaneie o QR com o número da loja. Ache o `group_id` em `GET /api/default/groups` — formato **`120363…@g.us`**.
   > O **domínio é só pra você** escanear o QR: o n8n fala com o WAHA por dentro da rede (`http://waha:3000`). **WAHA local não serve pra produção** — o n8n é hospedado e não alcança `localhost`.
3. **Baserow:** a fila é a tabela `DISPARADOR` (schema em `docs/baserow-disparador-schema.md`). Loja nova: o Claude cria via API.

## 2. Marca — CLAUDE (1× por loja)
- `/marca <ref-webflow>` → `design-system2.html`.
- `/acervo <urls-mercari>` → baixa as fotos curadas pro acervo.
- `/lp` → landing page self-contained + deploy Vercel.

## 3. Disparo — n8n (1×)
- Importe `n8n/nsc-dispara-ofertas.json`, preencha o node `Config` (ver `n8n/COMO-IMPORTAR.md`), **ative**. Roda a cada 30 min, 0 token.

## 4. Operação — o loop (recorrente)
1. Caio manda **URLs curadas** do Mercari.
2. `/agenda <url>` → traduz, monta legenda, **sobe a foto** (→ `photo_url`), grava na `Fila`.
3. Você revisa no Baserow (legenda + foto) e flipa **`Fila` → `Aprovado`**.
4. O n8n dispara os aprovados no grupo **sozinho** → marca `Disparado`.

> Divisão: **humano cura+aprova · Claude cria+traduz · n8n dispara.** (Tabelas completas no README.)

## 5. Abrir uma loja NOVA a partir deste template
- Copie a pasta e troque só a **instância**: `CLAUDE.md` (cérebro), `marca/` (assets+acervo), `.env`, `group_id` no n8n.
- As skills (`.claude/skills/`) **não mudam** — são o kit reutilizável.

## Com / sem vault Obsidian
- **No vault:** vive em `projetos/motor-ofertas/`; o `CLAUDE.md` linka outras notas (`[[caio-logistica-japao]]` etc.).
- **Standalone (repo próprio):** a pasta é auto-suficiente (skills + cérebro + docs + n8n + `.env.example`). Os `[[links]]` viram texto fora do Obsidian, mas nada quebra.

## Estrutura
```
motor-ofertas/
├─ README.md              # o que é + visão + divisão humano×Claude×n8n
├─ SETUP.md               # este runbook
├─ CLAUDE.md              # cérebro da loja (adaptável)
├─ .env.example           # guia de setup humano (tokens)
├─ .gitignore
├─ .claude/skills/        # O KIT (8 skills)
├─ marca/                 # a marca por tópico: acervo/ campanha/ conteudo/ referencia/
├─ lp/                    # landing page
├─ n8n/                   # workflow de disparo + guia de import
├─ docs/                  # fontes da verdade (roteiro-lp, logistica-mercari, baserow-schema)
├─ briefs/                # pedidos do Bruno/Caio já aplicados (histórico)
```

## Segredos
`.env` fora do git (`.gitignore`). Só `.env.example` versionado. 🔐 Rotacione a senha do Baserow (passou no chat no setup).
