"""
Rasteriza o kit: PNG (1x/2x/3x), favicon e avatar do Instagram.

Usa o Edge headless (o mesmo motor que renderiza os posts) em vez de cairosvg,
pra não trazer dependência nova: cada SVG vira uma página, tira-se o screenshot
no tamanho pedido, com fundo transparente quando for o caso.
"""
import os
import subprocess
import tempfile

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
KIT = os.path.dirname(os.path.abspath(__file__))
PNG = os.path.join(KIT, "png")
os.makedirs(PNG, exist_ok=True)

# (svg, largura, altura, fundo, saida)
JOBS = [
    ("logo-primaria.svg", 780, 366, "transparent", "png/logo-primaria@2x.png"),
    ("logo-primaria.svg", 1170, 549, "transparent", "png/logo-primaria@3x.png"),
    ("logo-primaria-dark.svg", 780, 366, "transparent", "png/logo-primaria-dark@2x.png"),
    ("logo-primaria-mono.svg", 780, 366, "transparent", "png/logo-primaria-mono@2x.png"),
    ("logo-horizontal.svg", 1200, 172, "transparent", "png/logo-horizontal@2x.png"),
    ("logo-horizontal-dark.svg", 1200, 172, "transparent", "png/logo-horizontal-dark@2x.png"),
    ("mark.svg", 512, 512, "transparent", "png/mark-512.png"),
    ("mark.svg", 64, 64, "transparent", "png/favicon-64.png"),
    ("mark.svg", 32, 32, "transparent", "png/favicon-32.png"),
    ("mark.svg", 1080, 1080, "transparent", "png/avatar-instagram-1080.png"),
    ("mark-light.svg", 512, 512, "transparent", "png/mark-light-512.png"),
]


def render(svg, w, h, bg, out):
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    html,body{{margin:0;padding:0;background:{bg};}}
    img{{display:block;width:{w}px;height:{h}px;}}
    </style></head><body><img src="file:///{os.path.join(KIT, svg).replace(os.sep, '/')}"/></body></html>"""
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        page = f.name
    dest = os.path.join(KIT, out)
    subprocess.run([
        EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--default-background-color=00000000",
        f"--window-size={w},{h}", "--virtual-time-budget=4000",
        f"--screenshot={dest}", f"file:///{page.replace(os.sep, '/')}",
    ], capture_output=True)
    os.unlink(page)
    print(f"  {out}  ({w}x{h})")


for svg, w, h, bg, out in JOBS:
    render(svg, w, h, bg, out)

print("\nFundo transparente de verdade (--default-background-color=00000000).")
