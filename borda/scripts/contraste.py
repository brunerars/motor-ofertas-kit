# -*- coding: utf-8 -*-
# Varre o globals.css atras do defeito que deixou o selo "Saiu 17/07" ilegivel:
# parear um token que VIRA com o tema (--ink, --paper, --card...) com um que NAO
# vira (--white, --red...). Calcula o contraste real de cada par nos DOIS temas.
#
# Nao e firula: o bug passou por code review humano, por 9 guards e por um
# harness de screenshot. Nenhum deles olha contraste.
import io, re, sys

CSS = io.open('app/globals.css', encoding='utf-8').read()


def tokens(bloco):
    d = {}
    for k, v in re.findall(r'--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,6})', bloco):
        d[k] = v
    return d


claro = tokens(re.search(r':root\{(.*?)\}', CSS, re.S).group(1))
escuro = dict(claro)
escuro.update(tokens(re.search(r':root\[data-theme="dark"\]\{(.*?)\}', CSS, re.S).group(1)))

vira = {k for k in claro if claro.get(k) != escuro.get(k)}
print('tokens que VIRAM no tema escuro: %s' % ', '.join(sorted(vira)))
print('tokens FIXOS: %s' % ', '.join(sorted(set(claro) - vira)))
print()


def rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(h):
    def c(v):
        v /= 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb(h)
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)


def contraste(fg, bg):
    a, b = lum(fg), lum(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def resolve(valor, tema):
    m = re.match(r'var\(--([a-z-]+)\)', valor.strip())
    if m:
        return tema.get(m.group(1))
    return valor.strip() if valor.strip().startswith('#') else None


# cada regra com color E background declarados juntos
regras = re.findall(r'([.#][a-zA-Z0-9_.\- \[\]="]+)\{([^}]*)\}', CSS)
falhas = []
print('%-22s %-8s %-8s' % ('seletor', 'claro', 'escuro'))
print('-' * 46)
for sel, corpo in regras:
    mc = re.search(r'(?<!-)\bcolor\s*:\s*([^;]+)', corpo)
    mb = re.search(r'\bbackground\s*:\s*([^;]+)', corpo)
    if not (mc and mb):
        continue
    linhas = []
    for nome, tema in (('claro', claro), ('escuro', escuro)):
        fg, bg = resolve(mc.group(1), tema), resolve(mb.group(1), tema)
        if not fg or not bg:
            linhas.append(None); continue
        linhas.append(contraste(fg, bg))
    if any(l is None for l in linhas):
        continue
    marca = ''
    for nome, r in zip(('claro', 'escuro'), linhas):
        if r < 4.5:
            falhas.append((sel.strip(), nome, r)); marca = '   <<< ILEGIVEL'
    print('%-22s %-8.2f %-8.2f%s' % (sel.strip()[:22], linhas[0], linhas[1], marca))

print()
if falhas:
    print('REPROVADO (contraste < 4.5:1, o minimo do WCAG AA pra texto):')
    for sel, tema, r in falhas:
        print('   X %s no tema %s: %.2f:1' % (sel, tema, r))
    sys.exit(1)
print('OK: todo par color+background passa de 4.5:1 nos dois temas')
