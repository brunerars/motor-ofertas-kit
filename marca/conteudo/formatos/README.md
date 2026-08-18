# Formatos de post — Nippon Speed Co.

Régua de tamanhos + gabaritos prontos pra postar e testar. Não são posts: são **cartões de teste**, feitos pro Caio subir e a gente ver com os próprios olhos o que a plataforma faz com cada formato.

Verificado contra a documentação da plataforma em **2026-07-17**.

## A resposta curta

| Formato | Tamanho | Onde usa | Veredito |
|---|---|---|---|
| **3:4** | **1080 × 1440** | **Post do feed** | ✅ **é o nosso padrão** |
| 4:5 | 1080 × 1350 | Padrão antigo do feed | ⚠️ ainda vale, mas corta na grade |
| 1:1 | 1080 × 1080 | Quadrado legado | ❌ aposentado |
| 9:16 | 1080 × 1920 | Stories, destaques, reels | ✅ outra superfície |

## Por que 3:4 (1080×1440)

Em **2026 o Instagram passou a aceitar o 3:4 como upload nativo do feed.** Antes o teto era 4:5 (1080×1350); agora o 1080×1440 sobe inteiro. E ele ganha em duas frentes ao mesmo tempo:

- **Ocupa mais tela no celular.** É mais alto que o 4:5 (proporção 1,33 contra 1,25), então preenche mais da rolagem, mais atenção por post.
- **Bate exato com a grade do perfil.** A grade migrou do quadrado pro 3:4. Post 3:4 aparece na grade **sem corte** — o que você vê no post é o que aparece na miniatura.

O 4:5 ainda funciona no feed, mas na grade ele é **recortado pra 3:4** (perde ~30px em cima e embaixo). Era o melhor possível na regra antiga; agora o 3:4 faz o mesmo trabalho sem esse corte.

## Os 4 arquivos

- `feed-3x4-1080x1440.png` — **o padrão**, o que vamos usar
- `antigo-4x5-1080x1350.png` — o formato antigo, **com o corte da grade marcado** em vermelho
- `quadrado-1x1-1080x1080.png` — o quadrado, pra ver o quanto perde de tela
- `stories-9x16-1080x1920.png` — a superfície de stories

Todos trazem **réguas nos quatro cantos**: se algum canto sumir depois de postado, a plataforma comeu borda e a gente vê na hora.

## Protocolo do teste (o que pedir pro Caio)

1. Postar os **4** no feed, um de cada vez.
2. Abrir o **perfil** e printar a **grade** (é onde o corte 3:4 aparece).
3. Abrir cada post no **feed** e printar (é onde o formato aparece inteiro).
4. Mandar os prints de volta.

**O que a gente está procurando:**
- No **3:4**: subiu inteiro, sem corte, no feed E na grade? **É o teste que confirma o padrão** na prática — vale mais que qualquer artigo.
- No **4:5**: dá pra ver a grade recortando o topo/base (as linhas vermelhas marcam o que sobrevive).
- No **1:1**: dá pra sentir na rolagem o quanto ocupa menos tela.

## Regerar

```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="<caminho absoluto desta pasta>"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1080,1440 --virtual-time-budget=6000 \
  --screenshot="$DIR/feed-3x4-1080x1440.png" "file:///$DIR/formatos.html#s1"
# trocar --window-size + #sN: s1=3:4 · s2=4:5 · s3=1:1 · s4=9:16
```

Fonte única: `formatos.html`, design system V1. Zero token de imagem.

## Relacionado

Skills `/post-feed` e `/post-stories` · `../ideias-feed.md` · memórias `post-feed-formato-3x4`, `nsc-conteudo-dois-canais`.
