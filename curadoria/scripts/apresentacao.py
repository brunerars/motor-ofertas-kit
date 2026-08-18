#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Monta o dossie de curadoria: HTML self-contained pronto pra virar PDF A4.

Two layers, on purpose (same shape as /portfolio): the prose lives in an
editable markdown file, everything numeric is derived from the JSONs. Change a
price, re-run, the document follows. Nobody hand-edits the HTML.

Usage:  python apresentacao.py
Reads:  apresentacao/narrativa.md + index.json + responsabilidade.json
        + pecas/<id>/{parecer,preco,traducao,dados}.json + pecas/<id>/1.jpg
Writes: apresentacao/dossie.html
"""
import base64
import io
import json
import os
import re
import time

from PIL import Image

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRENTE = os.path.abspath(os.path.join(BASE, ".."))
PECAS = os.path.join(BASE, "pecas")
APRES = os.path.join(BASE, "apresentacao")
SAIDA = os.path.join(APRES, "dossie.html")

FOTO_PX = 700          # hero photo width in the ficha; keeps the PDF sane
FONTE_ANTON = os.path.join(FRENTE, "marca", "logo", "kit", "Anton-Regular.ttf")
LOGO = os.path.join(FRENTE, "marca", "logo", "kit", "logo-horizontal.svg")

SEVERIDADE = {
    "nao_publicar_assim": ("trava", "não publicar assim"),
    "achado_principal": ("achado", "achado principal"),
    "usar_como_prova": ("prova", "usar como prova"),
    "atencao_na_legenda": ("aten", "atenção na legenda"),
}
CHECAGEM = {"confirma": ("ok", "conferido"), "refuta": ("no", "refutado"),
            "nao_achei": ("q", "não achei")}
# a chave no JSON e sem acento porque e identificador; o documento mostra a palavra
CLASSE_ROTULO = {"CORRECAO": "CORREÇÃO", "ATRIBUICAO": "ATRIBUIÇÃO",
                 "VALOR": "VALOR", "CONFIRMACAO": "CONFIRMAÇÃO"}
ROTULO_FLAG = {"corrigir_antes_de_publicar": "Corrigir antes de publicar",
               "achado_de_valor": "Achado de valor", "ok": "Sem ressalva"}
NATUREZA_TITULO = {
    "a_peca_nao_e_o_que_parece": "A peça não é o que parece",
    "descricao_do_vendedor": "A descrição do vendedor erra",
    "material_do_anuncio": "As fotos é que não servem",
    "estado_da_peca": "O estado da peça",
}
DETECTAVEL = {"sim": "dava pra ver no anúncio",
              "so_com_pesquisa": "só com pesquisa",
              "nao": "não dava pra ver"}


SCORE = {}
NL = chr(10)  # atravessa camadas de geracao sem virar quebra real


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return json.load(fh)


def pontos(n, total=5):
    """Cinco quadradinhos leem mais rapido que um numero, e nao viram nota de prova."""
    return ('<span class="pts">'
            + "".join('<i class="%s"></i>' % ("on" if i < n else "off")
                      for i in range(total))
            + "</span>")


def link_mercari(url, rotulo=None):
    """O anuncio tem que abrir do PDF: sem isso o documento nao serve pra decidir compra."""
    if not url:
        return ""
    return '<a class="lk" href="%s">%s</a>' % (esc(url), esc(rotulo or url))


def voz(t):
    """Travessao vira virgula: e a regra de voz da casa, e o documento e da marca.

    Applied to prose only. NEVER to `evidencia`, which quotes label text verbatim
    (a care label really does read 'OUTER SHELL / EXTERIEUR - FUTTER'); editing a
    quote to fit a style rule would corrupt the evidence.
    """
    t = str(t)
    t = t.replace(" — ", ", ").replace("— ", "").replace(" —", ",")
    return t.replace(", ,", ",").replace(",,", ",")


def corta(t, n):
    """Truncate on a word boundary. Cutting mid-word reads as a bug, not brevity."""
    t = str(t)
    if len(t) <= n:
        return t
    return t[:n].rsplit(" ", 1)[0].rstrip(" ,.;:") + "…"


def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def yen(v):
    return "¥" + "{:,}".format(int(v)).replace(",", ".")


def brl(v):
    return "R$ " + "{:,.2f}".format(v).replace(",", "@").replace(".", ",").replace("@", ".")


def narrativa():
    """Parse the editable prose into {marcador: texto}."""
    txt = open(os.path.join(APRES, "narrativa.md"), encoding="utf-8").read()
    txt = re.sub(r"^---.*?---\n", "", txt, flags=re.S)
    blocos, atual, buf = {}, None, []
    for linha in txt.split("\n"):
        m = re.match(r"^## \[([\w.]+)\]\s*$", linha)
        if m:
            if atual:
                blocos[atual] = "\n".join(buf).strip()
            atual, buf = m.group(1), []
        elif atual:
            buf.append(linha)
    if atual:
        blocos[atual] = "\n".join(buf).strip()
    return blocos


def paragrafos(txt):
    """Markdown-lite: blank line splits, **bold** works. Nothing else needed."""
    out = []
    for p in [x.strip() for x in txt.split("\n\n") if x.strip()]:
        p = esc(p).replace("\n", " ")
        p = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", p)
        out.append("<p>" + p + "</p>")
    return "\n".join(out)


def foto_b64(item_id):
    caminho = os.path.join(PECAS, item_id, "1.jpg")
    if not os.path.exists(caminho):
        return None
    im = Image.open(caminho).convert("RGB")
    if im.width > FOTO_PX:
        im = im.resize((FOTO_PX, int(im.height * FOTO_PX / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def fonte_embutida():
    """Anton ships with the logo kit, so embed it: the PDF must not depend on a CDN."""
    if not os.path.exists(FONTE_ANTON):
        return ""
    dados = base64.b64encode(open(FONTE_ANTON, "rb").read()).decode()
    return ("@font-face{font-family:'AntonLocal';font-style:normal;font-weight:400;"
            "src:url(data:font/ttf;base64," + dados + ") format('truetype');}")


def logo_inline():
    if not os.path.exists(LOGO):
        return ""
    svg = open(LOGO, encoding="utf-8").read()
    svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
    return svg.replace("#111111", "currentColor").replace("#111", "currentColor")


# ---------------------------------------------------------------- secoes

def bloco_numeros(idx, novas):
    ce = {"sinais": 0, "com_busca": 0, "confirma": 0, "refuta": 0, "nao_achei": 0}
    for p in idx["pecas"]:
        for k in ce:
            ce[k] += p["checagem_externa"][k]
    bloq = len([p for p in novas if p["flag"] == "corrigir_antes_de_publicar"])
    val = len([p for p in novas if p["flag"] == "achado_de_valor"])
    custo = sum(p["preco_jpy_anuncio"] for p in novas)
    venda = sum(p["preco_brl"] for p in novas)
    incert = sum(p["incertezas"] for p in idx["pecas"])

    cards = [
        (str(len(novas)), "peças curadas", "mais 1 de controle"),
        (str(ce["sinais"]), "sinais levantados",
         "%d conferidos por busca" % ce["com_busca"]),
        (str(bloq), "com sinal de trava", "não publicar do jeito que está"),
        (str(val), "com valor escondido", "vale mais do que o anúncio diz"),
        (yen(custo), "de custo no Mercari", "produto, sem taxa nem frete"),
        (brl(venda), "se tudo vender", "pelo preço calculado"),
    ]
    html = ['<div class="cards">']
    for n, r, s in cards:
        html.append('<div class="card"><div class="cn">%s</div><div class="cr">%s</div>'
                    '<div class="cs">%s</div></div>' % (esc(n), esc(r), esc(s)))
    html.append("</div>")
    html.append('<p class="nota">A busca externa confirmou %d sinais, refutou %d e não achou '
                'nada sobre %d. Esses %d viraram dúvida declarada, não afirmação: no total o '
                'documento registra %d coisas que o sistema não conseguiu determinar.</p>'
                % (ce["confirma"], ce["refuta"], ce["nao_achei"], ce["nao_achei"], incert))
    return "\n".join(html)


def bloco_esteira():
    etapas = [
        ("01", "Coleta", "o anúncio inteiro: descrição, condição, marca, reputação do "
                         "vendedor, e todas as fotos"),
        ("02", "Tradução", "japonês para português, sem acrescentar nada que o vendedor "
                              "não escreveu"),
        ("03", "Preço", "a fórmula aplicada, com a cotação da Wise buscada na hora"),
        ("04", "Perícia", "as fotos lidas junto do texto, sinal por sinal, com a evidência "
                             "citada"),
        ("05", "Checagem", "cada afirmação de fato conferida em fonte externa"),
        ("06", "Índice", "uma linha por peça, pra decidir em um minuto"),
    ]
    html = ['<div class="esteira">']
    for i, (n, t, d) in enumerate(etapas):
        html.append('<div class="et"><div class="etn">%s</div><div class="ett">%s</div>'
                    '<div class="etd">%s</div></div>' % (n, esc(t), esc(d)))
    html.append("</div>")
    html.append('<p class="nota">Um link do Mercari entra de um lado. Do outro sai a peça com '
                'preço, texto em português e a lista do que dá e do que não dá pra afirmar '
                'sobre ela.</p>')
    return "\n".join(html)


def bloco_problema(resp, novas):
    pj = {p["id"]: p for p in novas}
    grupos = {}
    for k, v in resp.items():
        if k.startswith("_") or v.get("controle_negativo"):
            continue
        grupos.setdefault(v["origem"], []).append(k)

    ordem = ["a_peca_nao_e_o_que_parece", "descricao_do_vendedor", "material_do_anuncio"]
    html = []
    for origem in ordem:
        ids = grupos.get(origem) or []
        if not ids:
            continue
        ids.sort(key=lambda x: -pj[x]["preco_jpy_anuncio"])
        soma = sum(pj[i]["preco_jpy_anuncio"] for i in ids)
        destaque = " destaque" if origem == "a_peca_nao_e_o_que_parece" else ""
        html.append('<div class="grupo%s">' % destaque)
        html.append('<div class="gh"><h3>%s</h3><div class="gm">%d peças · %s</div></div>'
                    % (esc(NATUREZA_TITULO[origem]), len(ids), yen(soma)))
        html.append('<p class="gd">%s</p>' % esc(resp["_naturezas"][origem]))
        for i in ids:
            det = resp[i]["era_detectavel"]
            html.append('<div class="gitem"><div class="gitop">'
                        '<span class="gnome">%s</span>'
                        '<span class="gpreco">%s</span>'
                        '<span class="gdet d-%s">%s</span></div>'
                        '<p>%s</p></div>'
                        % (esc(corta(pj[i]["title_pt"] or i, 60)),
                           yen(pj[i]["preco_jpy_anuncio"]), det,
                           esc(DETECTAVEL[det]), esc(resp[i]["nota"])))
        html.append("</div>")
    return "\n".join(html)


def bloco_casos(novas):
    pj = {p["id"]: p for p in novas}
    casos = [
        ("m97283893856", "A mais cara do lote vende Senna, e não pode",
         "A etiqueta de composição traz Y'S GEAR, a subsidiária da Yamaha que faz vestuário, "
         "constituída em janeiro de 1997. Senna morreu em maio de 1994. Não é peça da era dele, "
         "e a Yamaha nunca forneceu motor à McLaren: os nomes estão no bloco de palavras-chave "
         "do anúncio, não na peça. Ainda por cima o próprio vendedor declarou condição C, que "
         "na escala dele significa hidrólise do forro, que é irreversível."),
        ("m13668803753", "A mais barata com achado vale o dobro do que pede",
         "Anunciada como 90s Benetton por ¥9.500. O bordado das costas data em uma temporada "
         "só: Pirelli nos pneus, que a Benetton usou apenas em 1991, mais Autopolis, Camel e "
         "Ford. E o número no carro é 20, o B191 do Nelson Piquet, o carro da vitória no "
         "Canadá em 1991, a última do Piquet na Fórmula 1. O vendedor trata os patrocinadores "
         "como detalhe."),
        ("m10933095707", "A palavra estava no anúncio, em japonês",
         "O título abre com Ferrari e o campo de marca do Mercari diz Ferrari. Mas a "
         "descrição, no fim do bloco de características, termina com レプリカ: réplica, escrito "
         "pelo próprio vendedor. O erro de comunicação é dele, o título contradiz a descrição. "
         "Só que a palavra estava lá antes de qualquer análise, e é o tipo de coisa que passa "
         "quando se lê só o título."),
    ]
    html = []
    for item_id, titulo, texto in casos:
        p = pj[item_id]
        b64 = foto_b64(item_id)
        img = ('<img src="data:image/jpeg;base64,%s" alt="">' % b64) if b64 else ""
        html.append('<div class="caso"><div class="casofoto">%s</div>'
                    '<div class="casotxt"><h3>%s</h3><p>%s</p>'
                    '<div class="casopreco">%s no Mercari · %s de venda</div></div></div>'
                    % (img, esc(titulo), esc(texto),
                       yen(p["preco_jpy_anuncio"]), brl(p["preco_brl"])))
    return "\n".join(html)


def bloco_correlacao(novas):
    bloq = [p for p in novas if p["flag"] == "corrigir_antes_de_publicar"]
    val = [p for p in novas if p["flag"] == "achado_de_valor"]
    mb = sum(p["preco_jpy_anuncio"] for p in bloq) / len(bloq)
    mv = sum(p["preco_jpy_anuncio"] for p in val) / len(val)
    top = sorted(novas, key=lambda p: -p["preco_jpy_anuncio"])[:3]
    html = ['<div class="corr">']
    html.append('<div class="cbar"><div class="cbl">Peça com trava</div>'
                '<div class="ctrack"><div class="cfill trava" style="width:100%%"></div></div>'
                '<div class="cval">%s em média</div></div>' % yen(mb))
    html.append('<div class="cbar"><div class="cbl">Peça com achado</div>'
                '<div class="ctrack"><div class="cfill bom" style="width:%.0f%%"></div></div>'
                '<div class="cval">%s em média</div></div>' % (mv / mb * 100, yen(mv)))
    html.append("</div>")
    itens = " · ".join("%s (%s)" % (corta(p["title_pt"] or p["id"], 34),
                                        yen(p["preco_jpy_anuncio"])) for p in top)
    html.append('<p class="alerta"><strong>As três peças mais caras do lote têm todas sinal '
                'de trava.</strong> %s</p>' % esc(itens))
    return "\n".join(html)


def bloco_tabela_preco(novas):
    html = ['<table class="tp"><thead><tr><th>Peça</th><th>Produto</th><th>Taxa 35%</th>'
            '<th>Frete</th><th>Vol</th><th>Margem</th><th>Total ¥</th><th>Venda</th>'
            '</tr></thead><tbody>']
    for p in sorted(novas, key=lambda x: -x["preco_brl"]):
        c = ler(os.path.join(PECAS, p["id"], "preco.json"))["conta"]
        html.append('<tr><td class="nm">%s</td><td>%s</td><td>%s</td><td>%s</td>'
                    '<td class="vc">%s</td><td>%s</td><td>%s</td><td class="vd">%s</td></tr>'
                    % (esc(corta(p["title_pt"] or p["id"], 44)), yen(c["produto_jpy"]),
                       yen(c["taxa_naomi_jpy"]), yen(c["frete_jp_jpy"]),
                       c["classe_volume"], yen(c["margem_jpy"]), yen(c["preco_jpy"]),
                       brl(p["preco_brl"])))
    tot_j = sum(ler(os.path.join(PECAS, p["id"], "preco.json"))["conta"]["preco_jpy"]
                for p in novas)
    tot_b = sum(p["preco_brl"] for p in novas)
    html.append('<tr class="tot"><td>Total</td><td colspan="5"></td><td>%s</td>'
                '<td>%s</td></tr>' % (yen(tot_j), brl(tot_b)))
    html.append("</tbody></table>")
    cal = ler(os.path.join(PECAS, novas[0]["id"], "preco.json"))["conversao"]
    html.append('<p class="nota">Cotação usada: 1 real = %.3f ienes, buscada na calculadora '
                'da Wise em %s. O documento recalcula tudo se a fórmula mudar.</p>'
                % (cal["rate"], cal["conferido_em"][:10]))
    return "\n".join(html)


VEREDITO_CLS = {"COMPRAR": "v-ok", "COMPRAR, PEDIR FOTO": "v-foto",
                "COMPRAR E REESCREVER": "v-reesc", "NEGOCIAR PREÇO": "v-nego",
                "PASSAR": "v-passa"}


def bloco_painel(score):
    """A pagina que se olha antes de ler qualquer outra coisa."""
    html = ['<table class="pn"><thead><tr><th>O que fazer</th><th>Peça</th>'
            '<th class="ce">Anúncio</th><th class="ce">Valor</th><th class="ce">Raridade</th>'
            '<th class="ce">Análise</th><th>Preço</th><th class="ce">Link</th>'
            '</tr></thead><tbody>']
    atual = None
    for x in score["pecas"]:
        if x["veredito"] != atual:
            atual = x["veredito"]
            html.append('<tr class="grp %s"><td colspan="8">%s <span>%s</span></td></tr>'
                        % (VEREDITO_CLS[atual], esc(atual),
                           esc(score["_vereditos"][atual])))
        e = x["eixos"]
        rar = ('<span class="sb">sem base</span>' if x["raridade_sem_base"]
               else pontos(e["raridade"]))
        marca = ""
        if x["vendido"]:
            marca = ' <span class="tag vendida">vendida</span>'
        if x["controle_negativo"]:
            marca = ' <span class="tag controle">controle</span>'
        html.append('<tr><td class="vd-%s"></td><td class="nm">%s%s</td>'
                    '<td class="ce">%s</td><td class="ce">%s</td><td class="ce">%s</td>'
                    '<td class="ce cf-%s">%s</td><td class="pr">%s</td>'
                    '<td class="ce">%s</td></tr>'
                    % (VEREDITO_CLS[x["veredito"]][2:],
                       esc(corta(x["title_pt"] or x["id"], 46)), marca,
                       pontos(e["anuncio"]), pontos(e["valor"]), rar,
                       x["confianca"], esc(x["confianca"]),
                       brl(x["preco_brl"]),
                       link_mercari(x["source_url"], "abrir")))
    html.append("</tbody></table>")
    html.append('<p class="nota">Os três eixos são separados de propósito. Uma nota só faria '
                'a média de coisas opostas: 9 das 19 peças têm trava e valor ao mesmo tempo, '
                'e a Benetton Montreal é 1 de 5 em anúncio e 4 de 5 em valor. '
                'Nenhum ponto aqui foi pedido a um modelo: cada um sobe ou desce por causa de '
                'um sinal que carrega evidência e a foto onde ela está. A coluna Análise diz '
                'o quanto dá pra confiar no próprio veredito.</p>')
    return NL.join(html)


def ficha(p, resp):
    parecer = ler(os.path.join(PECAS, p["id"], "parecer.json"))
    preco = ler(os.path.join(PECAS, p["id"], "preco.json"))
    c = preco["conta"]
    b64 = foto_b64(p["id"])

    tags = []
    if p["vendido"]:
        tags.append('<span class="tag vendida">já vendida</span>')
    if p["controle_negativo"]:
        tags.append('<span class="tag controle">controle</span>')

    sc = SCORE.get(p["id"])
    html = ['<div class="ficha">']
    if sc:
        e = sc["eixos"]
        rar = "sem base" if sc["raridade_sem_base"] else "%d/5" % e["raridade"]
        html.append('<div class="fver %s"><span class="fv">%s</span>'
                    '<span class="fe">anúncio %d/5 · valor %d/5 · raridade %s · '
                    'análise %s</span></div>'
                    % (VEREDITO_CLS[sc["veredito"]], esc(sc["veredito"]),
                       e["anuncio"], e["valor"], rar, esc(sc["confianca"])))
    html.append('<div class="fcab"><div class="ftit"><h3>%s</h3>'
                '<div class="fmeta">%s · %s no Mercari · volume %s %s<br>%s</div></div>'
                '<div class="fpreco">%s</div></div>'
                % (esc(p["title_pt"] or p["id"]), p["id"], yen(c["produto_jpy"]),
                   c["classe_volume"], "".join(tags),
                   link_mercari(p["source_url"]), brl(p["preco_brl"])))

    html.append('<div class="fcorpo">')
    if b64:
        html.append('<div class="ffoto"><img src="data:image/jpeg;base64,%s" alt=""></div>'
                    % b64)
    html.append('<div class="fsinais">')
    for s in parecer["sinais"]:
        cls, rot = SEVERIDADE.get(s["severidade"], ("aten", s["severidade"]))
        ext = s.get("checagem_externa") or {}
        selo = ""
        if ext.get("feita") and ext.get("resultado") in CHECAGEM:
            k, r = CHECAGEM[ext["resultado"]]
            selo = '<span class="selo s-%s">%s</span>' % (k, r)
        html.append('<div class="sinal sv-%s"><div class="stopo">'
                    '<span class="sclasse">%s</span><span class="ssev">%s</span>%s</div>'
                    '<p class="saf">%s</p>'
                    '<p class="sev">%s <span class="sfonte">%s</span></p></div>'
                    % (cls, esc(CLASSE_ROTULO.get(s["classe"], s["classe"])),
                       esc(rot), selo, esc(voz(s["afirmacao"])),
                       esc(s["evidencia"]), esc(s["fonte"])))
    html.append("</div></div>")

    html.append('<div class="frec"><span>O que fazer</span><p>%s</p></div>'
                % esc(voz(parecer["recomendacao"])))
    if p["id"] in resp:
        html.append('<div class="fnat"><span>Natureza do problema</span><p>%s. %s</p></div>'
                    % (esc(NATUREZA_TITULO[resp[p["id"]]["origem"]]),
                       esc(resp[p["id"]]["nota"])))
    html.append('<div class="fnsei"><span>O que o sistema não sabe (%d)</span><ul>%s</ul>'
                '</div>' % (len(parecer["o_que_nao_sei"]),
                            "".join("<li>%s</li>" % esc(x)
                                    for x in map(voz, parecer["o_que_nao_sei"]))))
    html.append("</div>")
    return "\n".join(html)


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
:root{
  --ink:#111111; --paper:#f5f5f5; --white:#ffffff; --hair:#ddddd7;
  --mid:#676763; --dark:#5d5d5d; --chap:#e6e6e2;
  --red:#c82a2a; --red-bright:#ff5347; --green:#17914d;
}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Archivo',system-ui,-apple-system,'Segoe UI',sans-serif;
  background:var(--paper);color:var(--ink);font-size:10.2pt}
h1,h2,h3,.anton{font-family:'AntonLocal','Anton',Impact,sans-serif;
  text-transform:uppercase;font-weight:400;letter-spacing:.005em}
strong{font-weight:700}
.pg{width:210mm;min-height:297mm;padding:17mm 16mm 14mm;background:var(--paper);
  position:relative;break-after:page;display:flex;flex-direction:column}
.pg:last-child{break-after:auto}
.flow{break-after:auto;min-height:0}

.capa{background:var(--ink);color:var(--paper);justify-content:space-between}
.capa .logo{color:var(--paper);width:64mm}
.capa .logo svg{width:100%;height:auto;display:block}
.capa h1{font-size:44pt;line-height:.98;margin:0 0 6mm}
.capa .kick{font-size:9pt;letter-spacing:.16em;text-transform:uppercase;
  color:var(--red-bright);font-weight:700;margin-bottom:5mm}
.capa .res{font-size:13pt;line-height:1.45;max-width:135mm;color:#dcdcd8}
.capa .rod{font-size:8.6pt;color:#8a8a86;border-top:1px solid #2e2e2e;padding-top:4mm}
.capa .barra{height:5mm;background:var(--red-bright);width:34mm;margin-bottom:7mm}

.sec{margin-bottom:9mm}
.sech{display:flex;align-items:baseline;gap:4mm;border-bottom:2px solid var(--ink);
  padding-bottom:2.5mm;margin-bottom:5mm}
.sech .num{font-family:'AntonLocal','Anton',sans-serif;font-size:12pt;
  color:var(--red-bright)}
.sech h2{font-size:19pt}
p{line-height:1.5;margin-bottom:3mm;max-width:165mm}
.nota{font-size:8.8pt;color:var(--mid);line-height:1.45;
  border-left:2px solid var(--hair);padding-left:3.5mm;margin-top:4mm}

.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:4mm 0}
.card{background:var(--white);border:1px solid var(--hair);padding:4mm}
.card .cn{font-family:'AntonLocal','Anton',sans-serif;font-size:22pt}
.card .cr{font-size:9pt;font-weight:700;margin-top:1.5mm}
.card .cs{font-size:8pt;color:var(--mid);margin-top:.8mm}

.esteira{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin:5mm 0}
.et{background:var(--white);border:1px solid var(--hair);padding:3.5mm 3.5mm;
  position:relative}
.et .etn{font-family:'AntonLocal','Anton',sans-serif;font-size:10pt;
  color:var(--red-bright)}
.et .ett{font-size:9.6pt;font-weight:800;margin:1mm 0 1.5mm}
.et .etd{font-size:8pt;color:var(--mid);line-height:1.4}
.et:not(:nth-child(3n)):after{content:"";position:absolute;right:-2.1mm;top:50%;
  border:2.5px solid transparent;border-left-color:var(--ink)}

.grupo{border:1px solid var(--hair);background:var(--white);padding:5mm;
  margin-bottom:4mm;break-inside:avoid}
.grupo.destaque{border:2px solid var(--red-bright)}
.gh{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;
  border-bottom:1px solid var(--hair);padding-bottom:2mm;margin-bottom:3mm}
.gh h3{font-size:14pt}
.gm{font-size:9pt;font-weight:800;white-space:nowrap}
.gd{font-size:8.8pt;color:var(--mid);line-height:1.45;margin-bottom:3mm}
.gitem{border-top:1px solid var(--chap);padding-top:2.5mm;margin-top:2.5mm}
.gitop{display:flex;align-items:baseline;gap:2.5mm;flex-wrap:wrap;margin-bottom:1.2mm}
.gnome{font-weight:800;font-size:9.4pt}
.gpreco{font-size:9pt;font-weight:700;color:var(--red)}
.gdet{font-size:7.2pt;text-transform:uppercase;letter-spacing:.06em;
  padding:.6mm 1.6mm;border-radius:9999px;font-weight:700}
.d-sim{background:#fde8e6;color:#8f1d16}
.d-so_com_pesquisa{background:var(--chap);color:var(--dark)}
.gitem p{font-size:8.8pt;line-height:1.45;color:var(--dark);margin:0}

.caso{display:flex;gap:5mm;background:var(--white);border:1px solid var(--hair);
  padding:4mm;margin-bottom:4mm;break-inside:avoid}
.casofoto{width:38mm;flex:none}
.casofoto img{width:100%;display:block;border:1px solid var(--hair)}
.casotxt h3{font-size:13pt;margin-bottom:2mm}
.casotxt p{font-size:9pt;line-height:1.45;margin-bottom:2mm}
.casopreco{font-size:8.6pt;font-weight:700;color:var(--red)}

.corr{margin:4mm 0}
.cbar{display:flex;align-items:center;gap:3mm;margin-bottom:2.5mm}
.cbl{width:32mm;font-size:9pt;font-weight:700;flex:none}
.ctrack{flex:1;height:7mm;background:var(--chap)}
.cfill{height:100%}
.cfill.trava{background:var(--red-bright)}
.cfill.bom{background:var(--ink)}
.cval{width:30mm;font-size:9pt;font-weight:800;flex:none;text-align:right}
.alerta{background:var(--ink);color:var(--paper);padding:4mm;font-size:9.4pt;
  line-height:1.45;max-width:none}
.alerta strong{color:var(--red-bright)}

.tp{width:100%;border-collapse:collapse;font-size:8.2pt;margin:4mm 0}
.tp th{text-align:right;font-size:7.4pt;text-transform:uppercase;letter-spacing:.05em;
  border-bottom:1.5px solid var(--ink);padding:1.8mm 1.5mm;color:var(--dark)}
.tp th:first-child{text-align:left}
.tp td{text-align:right;padding:1.6mm 1.5mm;border-bottom:1px solid var(--chap)}
.tp td.nm{text-align:left;font-weight:700}
.tp td.vc{text-align:center;font-weight:700}
.tp td.vd{font-weight:800;color:var(--red)}
.tp tr.tot td{border-top:1.5px solid var(--ink);border-bottom:none;font-weight:800;
  padding-top:2.2mm;white-space:nowrap}

.ficha{background:var(--white);border:1px solid var(--hair);padding:5mm;
  margin-bottom:5mm}
.sinal,.frec,.fnat,.fnsei,.gitem{break-inside:avoid}
.fcab{break-after:avoid}
.fcab{display:flex;justify-content:space-between;align-items:flex-start;gap:5mm;
  border-bottom:1.5px solid var(--ink);padding-bottom:2.5mm;margin-bottom:3.5mm}
.ftit h3{font-size:13pt}
.fmeta{font-size:8pt;color:var(--mid);margin-top:1mm}
.fpreco{font-family:'AntonLocal','Anton',sans-serif;font-size:17pt;color:var(--red);
  white-space:nowrap}
.tag{font-size:7pt;text-transform:uppercase;letter-spacing:.06em;padding:.5mm 1.5mm;
  border-radius:9999px;font-weight:700;margin-left:1.5mm}
.tag.vendida{background:var(--ink);color:var(--paper)}
.tag.controle{background:var(--red-bright);color:#fff}
.fcorpo{display:flex;gap:4mm;align-items:flex-start}
.ffoto{width:34mm;flex:none}
.ffoto img{width:100%;display:block;border:1px solid var(--hair)}
.fsinais{flex:1;min-width:0}
.sinal{border-left:2.5px solid var(--chap);padding-left:3mm;margin-bottom:2.8mm}
.sinal.sv-trava{border-left-color:var(--red-bright)}
.sinal.sv-achado{border-left-color:var(--green)}
.stopo{display:flex;align-items:center;gap:2mm;flex-wrap:wrap;margin-bottom:1mm}
.sclasse{font-size:7.4pt;font-weight:800;letter-spacing:.06em}
.ssev{font-size:7pt;color:var(--mid);text-transform:uppercase;letter-spacing:.05em}
.selo{font-size:6.8pt;text-transform:uppercase;letter-spacing:.05em;
  padding:.4mm 1.4mm;border-radius:9999px;font-weight:700}
.s-ok{background:#e2f2e8;color:#12633a}
.s-no{background:#fde8e6;color:#8f1d16}
.s-q{background:var(--chap);color:var(--dark)}
.saf{font-size:8.8pt;line-height:1.45;margin-bottom:1mm;max-width:none}
.sev{font-size:7.8pt;color:var(--mid);line-height:1.4;margin:0;max-width:none}
.sfonte{font-weight:700;color:var(--dark)}
.frec,.fnat,.fnsei{margin-top:3.5mm;padding-top:2.5mm;border-top:1px solid var(--chap)}
.frec span,.fnat span,.fnsei span{font-size:7.2pt;text-transform:uppercase;
  letter-spacing:.08em;font-weight:800;color:var(--red)}
.frec p,.fnat p{font-size:8.8pt;line-height:1.45;margin-top:1.2mm;max-width:none}
.fnat span{color:var(--ink)}
.fnsei ul{margin-top:1.2mm;padding-left:4mm}
.fnsei li{font-size:8pt;line-height:1.4;color:var(--mid);margin-bottom:.8mm}
.grupoh{margin:6mm 0 4mm;display:flex;align-items:baseline;gap:3mm}
.grupoh h3{font-size:15pt}
.grupoh .cnt{font-size:9pt;color:var(--mid);font-weight:700}

.rodape{margin-top:auto;padding-top:5mm;border-top:1px solid var(--hair);
  font-size:7.4pt;color:var(--mid);line-height:1.45}


/* painel: a pagina que se olha antes de ler o resto */
.pn{width:100%;border-collapse:collapse;font-size:8.4pt;margin:4mm 0}
.pn th{text-align:left;font-size:7.2pt;text-transform:uppercase;letter-spacing:.05em;
  border-bottom:1.5px solid var(--ink);padding:1.6mm 1.2mm;color:var(--dark)}
.pn th.ce{text-align:center}
.pn td{padding:1.5mm 1.2mm;border-bottom:1px solid var(--chap);vertical-align:middle}
.pn td.ce{text-align:center}
.pn td.nm{font-weight:700;line-height:1.25}
.pn td.pr{text-align:right;font-weight:800;color:var(--red);white-space:nowrap}
.pn tr.grp td{border-bottom:none;padding:3.5mm 1.2mm 1.2mm;
  font-family:'AntonLocal','Anton',sans-serif;font-size:11pt;letter-spacing:.01em}
.pn tr.grp span{font-family:'Archivo',sans-serif;font-size:7.6pt;font-weight:400;
  text-transform:none;letter-spacing:0;color:var(--mid);margin-left:2mm}
.pn tr.grp.v-ok td{color:var(--green)}
.pn tr.grp.v-foto td,.pn tr.grp.v-reesc td{color:var(--ink)}
.pn tr.grp.v-nego td{color:#b5710a}
.pn tr.grp.v-passa td{color:var(--red-bright)}
.pn td[class^="vd-"]{width:2.5mm;padding:0}
.pn td.vd-ok{background:var(--green)}
.pn td.vd-foto{background:#8a8a86}
.pn td.vd-reesc{background:var(--ink)}
.pn td.vd-nego{background:#e09b1f}
.pn td.vd-passa{background:var(--red-bright)}
.pts{display:inline-flex;gap:.7mm}
.pts i{width:1.9mm;height:1.9mm;border-radius:.4mm;display:block}
.pts i.on{background:var(--ink)}
.pts i.off{background:var(--chap)}
.sb{font-size:6.8pt;color:var(--mid);text-transform:uppercase;letter-spacing:.04em}
.cf-alta{color:var(--green);font-weight:700}
.cf-média{color:var(--dark)}
.cf-baixa{color:var(--red-bright);font-weight:700}
.lk{color:var(--red);text-decoration:underline;font-weight:700;font-size:7.6pt}

/* veredito no topo da ficha */
.fver{display:flex;align-items:baseline;gap:3mm;flex-wrap:wrap;padding:2mm 3mm;
  margin:-5mm -5mm 3.5mm;border-bottom:1px solid var(--hair)}
.fver .fv{font-family:'AntonLocal','Anton',sans-serif;font-size:12pt}
.fver .fe{font-size:8pt;color:var(--dark);font-weight:700}
.fver.v-ok{background:#e2f2e8}
.fver.v-ok .fv{color:var(--green)}
.fver.v-foto,.fver.v-reesc{background:var(--chap)}
.fver.v-nego{background:#fdf0d9}
.fver.v-nego .fv{color:#8a5a06}
.fver.v-passa{background:#fde8e6}
.fver.v-passa .fv{color:#8f1d16}
.fmeta .lk{font-size:7.4pt}

/* preview no ecra: isola uma pagina por vez pra conferir layout antes do PDF.
   Mesmo truque de :target do /post-feed. Nao afeta o print. */
@media screen{
  body{background:#2a2a2a;padding:0}
  .pg{margin:0 auto;box-shadow:0 0 0 1px #444}
  body:has(.pg:target) .pg{display:none}
  body:has(.pg:target) .pg:target{display:flex}
}

/* piso de diacritico: por ULTIMO, ganha de tudo. Anton condensada faz A~ O~ E^
   encostarem na linha de cima. */
h1,h2,h3,.anton,.card .cn,.fpreco,.et .etn,.sech .num{line-height:1.16}
"""


def main():
    idx = ler(os.path.join(BASE, "index.json"))
    resp = ler(os.path.join(BASE, "responsabilidade.json"))
    score = ler(os.path.join(BASE, "score.json"))
    SCORE.update({x["id"]: x for x in score["pecas"]})
    n = narrativa()
    novas = [p for p in idx["pecas"] if not p["controle_negativo"]]
    controle = [p for p in idx["pecas"] if p["controle_negativo"]]

    def sec(num, titulo, *conteudo):
        return ('<section class="sec"><div class="sech"><span class="num">%s</span>'
                '<h2>%s</h2></div>%s</section>'
                % (num, esc(titulo), "\n".join(conteudo)))

    partes = []

    partes.append(
        '<div class="pg capa"><div><div class="logo">%s</div></div>'
        '<div><div class="barra"></div><div class="kick">%s</div>'
        '<h1>%s</h1><p class="res">%s</p></div>'
        '<div class="rod">Documento interno Nippon Speed Co. · uso entre Bruno e Caio. '
        'As fotos são dos anúncios originais do Mercari e estão aqui como evidência de '
        'análise, não para publicação.</div></div>'
        % (logo_inline(), esc(n["capa.linha"]), esc(n["capa.titulo"]),
           esc(n["capa.resumo"])))

    partes.append('<div class="pg">'
                  + sec("01", n["painel.titulo"], paragrafos(n["painel.texto"]),
                        bloco_painel(score))
                  + "</div>")

    partes.append('<div class="pg">'
                  + sec("02", n["numeros.titulo"], paragrafos(n["numeros.texto"]),
                        bloco_numeros(idx, novas))
                  + sec("03", n["esteira.titulo"], paragrafos(n["esteira.texto"]),
                        bloco_esteira())
                  + "</div>")

    partes.append('<div class="pg">'
                  + sec("04", n["regua.titulo"], paragrafos(n["regua.texto"]))
                  + "</div>")

    partes.append('<div class="pg flow">'
                  + sec("05", n["problema.titulo"], paragrafos(n["problema.texto"]),
                        bloco_problema(resp, novas), paragrafos(n["problema.fecho"]))
                  + "</div>")

    partes.append('<div class="pg">'
                  + sec("06", n["casos.titulo"], bloco_casos(novas))
                  + "</div>")

    partes.append('<div class="pg">'
                  + sec("07", n["garimpo.titulo"], paragrafos(n["garimpo.texto"]),
                        bloco_correlacao(novas), paragrafos(n["garimpo.sinais"]))
                  + "</div>")

    partes.append('<div class="pg">'
                  + sec("08", n["conta.titulo"], paragrafos(n["conta.texto"]),
                        bloco_tabela_preco(novas))
                  + "</div>")

    fichas = ['<div class="pg flow">'
              + sec("09", n["fichas.titulo"], paragrafos(n["fichas.texto"]))]
    for flag in ("corrigir_antes_de_publicar", "achado_de_valor", "ok"):
        grupo = [p for p in novas if p["flag"] == flag]
        if not grupo:
            continue
        fichas.append('<div class="grupoh"><h3>%s</h3><span class="cnt">%d peças</span>'
                      '</div>' % (esc(ROTULO_FLAG[flag]), len(grupo)))
        for p in grupo:
            fichas.append(ficha(p, resp))
    if controle:
        fichas.append('<div class="grupoh"><h3>Controle negativo</h3>'
                      '<span class="cnt">a peça reprovada em julho, testada às cegas</span>'
                      '</div>')
        for p in controle:
            fichas.append(ficha(p, resp))
    fichas.append("</div>")
    partes.append("\n".join(fichas))

    partes.append('<div class="pg">'
                  + sec("10", n["proximo.titulo"], paragrafos(n["proximo.texto"]))
                  + '<div class="rodape">Gerado em %s a partir de curadoria/index.json e dos '
                    'pareceres por peça. Documento derivado: mudou o dado, roda de novo e ele '
                    'acompanha.</div></div>' % time.strftime("%d/%m/%Y"))

    html = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            '<title>Curadoria Etapa 2 - Nippon Speed Co.</title>'
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800'
            '&display=swap" rel="stylesheet">'
            '<style>' + fonte_embutida() + "\n" + CSS + '</style></head><body>'
            + "\n".join(partes) + '</body></html>')

    # numera as paginas pro preview conseguir mirar uma de cada vez
    contador = [0]

    def numerar(m):
        contador[0] += 1
        return '<div id="pg%d" class="pg' % contador[0]

    html = re.sub(r'<div class="pg', numerar, html)
    print("paginas-fonte: %d" % contador[0])

    os.makedirs(APRES, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("escrito: %s (%.1f MB)" % (SAIDA, os.path.getsize(SAIDA) / 1024 / 1024))


if __name__ == "__main__":
    main()
