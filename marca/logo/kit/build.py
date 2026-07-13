"""
Gera o kit de logo da Nippon Speed Co. em SVG com o texto convertido em PATH.

Por que path e não <text>: um SVG com <text font-family="Anton"> só renderiza certo
em máquina que tenha Anton instalada. Gráfica, bordadeira e o Illustrator do cliente
não têm. Path é geometria pura, abre igual em qualquer lugar.

Medidas tiradas da arte do Caio (marca/logo/fontes/caio-bloco-2026-07-13.jpeg),
normalizadas pra em (base font-size = 100):
  disco .757em · gap NIPPON->disco .15em · quadrado .17em
  tracking linha 1 = .022em · linha 2 = .037em · entrelinha .97em
Fidelidade conferida: erro de 0.2% (linha 1) e 0.4% (linha 2) contra o original.
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

FONT = "Anton-Regular.ttf"
FS = 100.0                      # unidade base
INK = "#111111"
RED = "#e60000"                 # o vermelho oficial (decisão: hinomaru, ver README)
PAPER = "#f5f5f5"

DISC = 0.757 * FS
GAP = 0.15 * FS
SQ = 0.17 * FS
TRACK1 = 0.022 * FS
TRACK2 = 0.037 * FS
LEADING = 0.97 * FS

font = TTFont(FONT)
upm = font["head"].unitsPerEm
cap = font["OS/2"].sCapHeight / upm * FS      # altura da caixa alta
gs = font.getGlyphSet()
cmap = font.getBestCmap()


def glyph_paths(text, x, baseline, track):
    """Devolve (lista de <path>, largura total) do texto, já posicionado."""
    out, cursor = [], x
    for ch in text:
        gname = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[gname].draw(pen)
        d = pen.getCommands()
        adv = gs[gname].width / upm * FS
        if d:
            # o glifo vem em unidades da fonte, com y pra cima: escala e inverte
            k = FS / upm
            out.append(
                f'<g transform="translate({cursor:.2f} {baseline:.2f}) scale({k:.6f} {-k:.6f})">'
                f'<path d="{d}"/></g>'
            )
        cursor += adv + track
    return out, cursor - x - track  # a última letra não leva tracking


def bloco(ink=INK, red=RED, mono=False):
    """Logo primária: o bloco de 2 linhas."""
    y1 = cap                       # baseline da linha 1
    y2 = y1 + LEADING              # baseline da linha 2
    p1, w1 = glyph_paths("NIPPON", 0, y1, TRACK1)
    p2, w2 = glyph_paths("SPEED CO", 0, y2, TRACK2)
    disc_x, disc_cy = w1 + GAP, y1 - cap / 2
    l1_w = disc_x + DISC
    sq_x = w2 + 0.02 * FS
    l2_w = sq_x + SQ
    W, H = max(l1_w, l2_w), y2
    disc_fill = ink if mono else red
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H:.2f}" width="{W:.0f}" height="{H:.0f}" role="img" aria-label="Nippon Speed Co.">
  <g fill="{ink}">
    {chr(10).join("    " + p for p in p1)}
    {chr(10).join("    " + p for p in p2)}
    <rect x="{sq_x:.2f}" y="{y2 - SQ:.2f}" width="{SQ:.2f}" height="{SQ:.2f}"/>
  </g>
  <circle cx="{disc_x + DISC / 2:.2f}" cy="{disc_cy:.2f}" r="{DISC / 2:.2f}" fill="{disc_fill}"/>
</svg>
'''


def horizontal(ink=INK, red=RED, mono=False):
    """Secundária: uma linha só, o disco vira separador."""
    y = cap
    d, g = 0.5 * FS, 0.28 * FS
    p1, w1 = glyph_paths("NIPPON", 0, y, TRACK1)
    x2 = w1 + g + d + g
    p2, w2 = glyph_paths("SPEED CO", x2, y, TRACK1)
    sq_x = x2 + w2 + 0.02 * FS
    W, H = sq_x + SQ, y
    disc_fill = ink if mono else red
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H:.2f}" width="{W:.0f}" height="{H:.0f}" role="img" aria-label="Nippon Speed Co.">
  <g fill="{ink}">
    {chr(10).join("    " + p for p in p1)}
    {chr(10).join("    " + p for p in p2)}
    <rect x="{sq_x:.2f}" y="{y - SQ:.2f}" width="{SQ:.2f}" height="{SQ:.2f}"/>
  </g>
  <circle cx="{w1 + g + d / 2:.2f}" cy="{y - cap / 2:.2f}" r="{d / 2:.2f}" fill="{disc_fill}"/>
</svg>
'''


def mark_formas(bg=None, red=RED, sq_color=PAPER, size=512):
    """Mark: o disco e o quadrado sozinhos. As duas formas da logo, sem letra.

    O conjunto (disco + quadrado) é centrado no canvas e o quadrado assenta na
    base do disco, como na logo. Tamanhos contidos: precisa sobrar respiro pro
    recorte circular do avatar não comer as formas.
    """
    d = size * 0.38
    s = size * 0.13
    gap = size * 0.05
    total = d + gap + s
    x0 = (size - total) / 2
    cy = size / 2
    bgrect = f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img" aria-label="Nippon Speed Co.">
  {bgrect}
  <circle cx="{x0 + d / 2:.2f}" cy="{cy:.2f}" r="{d / 2:.2f}" fill="{red}"/>
  <rect x="{x0 + d + gap:.2f}" y="{cy + d / 2 - s:.2f}" width="{s:.2f}" height="{s:.2f}" fill="{sq_color}"/>
</svg>
'''


ARQUIVOS = {
    "logo-primaria.svg": bloco(),
    "logo-primaria-dark.svg": bloco(ink=PAPER),
    "logo-primaria-mono.svg": bloco(mono=True),
    "logo-horizontal.svg": horizontal(),
    "logo-horizontal-dark.svg": horizontal(ink=PAPER),
    "logo-horizontal-mono.svg": horizontal(mono=True),
    "mark.svg": mark_formas(bg=INK),
    "mark-light.svg": mark_formas(bg=PAPER, sq_color=INK),
    "mark-transparente.svg": mark_formas(bg=None, sq_color=INK),
}

for nome, conteudo in ARQUIVOS.items():
    with open(nome, "w", encoding="utf-8") as f:
        f.write(conteudo)
    print(f"  {nome}")

print(f"\ncap-height={cap:.1f}  (unitsPerEm={upm})")
print("Vetor puro: nenhum <text>, só <path>, <circle> e <rect>.")
