---
aliases: ["Hermes", "arquitetura do Hermes"]
resumo: "O mapa da esteira da NSC em três diagramas: o que existe e o que não existe hoje, os 4 degraus até o agente de garimpo, e os 3 gates que separam varredura de perícia e de oferta. O gate 2 é o único que falta, e o número dele é do Bruno."
frente: nippon
atualizado: 2026-08-19
---

# 🏁 Hermes — a arquitetura, em três desenhos

> Nota de **clareza**, não de estado. O estado vive em [[motor-ofertas-nsc]]; os números crus
> vivem em `curadoria/PROVA.md`. Aqui é só o mapa: **onde estamos, para onde vai, e o que
> decide o quê.**

---

## 1. A esteira inteira — o que existe e o que não

```mermaid
flowchart LR
  subgraph A["ACHAR o candidato"]
    A1["varrer.py<br/>busca do Mercari<br/>384 cards / 40 créditos"]
    A2["fila.py<br/>filtro barato<br/>só descarta, nunca promove"]
    A3["FILA.md<br/>você audita aqui"]
  end
  subgraph B["JULGAR a peça"]
    B1["coletar.py<br/>fotos + texto"]
    B2["traduzir"]
    B3["precificar.py<br/>35% + frete + margem + Wise"]
    B4["perícia<br/>1 agente por lote<br/>~63k tokens/peça"]
    B5["score.py<br/>veredito + 3 eixos"]
  end
  subgraph C["VENDER"]
    C1["Baserow<br/>fila de aprovação"]
    C2["n8n + WAHA<br/>dispara no grupo"]
    C3["conferida de vendido"]
  end

  A1 --> A2 --> A3 --> B1 --> B2 --> B3 --> B4 --> B5 --> C1 --> C2 --> C3
  B4 -.->|"fatos novos"| BASE[("base/fatos.json<br/>83 fatos")]
  BASE -.->|"data de graça"| A2
  A2 -.->|"contradição = erro na base"| BASE

  classDef ok fill:#d7f0d8,stroke:#2f9e44,color:#111
  classDef parado fill:#fff3bf,stroke:#e8a13a,color:#111
  classDef nunca fill:#ffe3e3,stroke:#e03131,color:#111
  classDef base fill:#e7f0ff,stroke:#3b6fd4,color:#111
  class A1,A2,A3,B1,B2,B3,B4,B5 ok
  class C1,C2 parado
  class C3 nunca
  class BASE base
```

🟩 **pronto e rodado** · 🟨 **existe mas parado desde 05/08** · 🟥 **nunca existiu**

O laço pontilhado é o que a sessão de 19/08 descobriu: **a base não só alimenta o filtro, ela é
auditada por ele.** Uma varredura de 40 créditos achou dois erros numa base que custou ~1,2
milhão de tokens de perícia.

---

## 2. Os 4 degraus até o Hermes

```mermaid
flowchart TD
  D1["1 · BASE DE FATOS<br/>83 fatos + 32 aliases<br/>data 17 de 19 peças sem busca"]
  D2["2 · FILTRO BARATO<br/>0 falso negativo em COMPRAR<br/>título contradiz a perícia em 0 de 17"]
  D3["3 · ESTUDO DOS VENDIDOS<br/>232 vendidos, 20 baldes<br/>só 6 com n≥5 — e todos sem época"]
  D4["4 · HERMES<br/>varredura agendada → filtro →<br/>perícia só no que passou → fila"]
  GARGALO["O que trava o 3 e o 4:<br/>RESOLUÇÃO DE DATAÇÃO.<br/>só 5 de 19 títulos dão janela estreita"]

  D1 --> D2 --> D3 --> D4
  D3 -.-> GARGALO
  GARGALO -.->|"engorda a cada rodada de curadoria"| D1

  classDef feito fill:#d7f0d8,stroke:#2f9e44,color:#111
  classDef meio fill:#fff3bf,stroke:#e8a13a,color:#111
  classDef falta fill:#ffe3e3,stroke:#e03131,color:#111
  classDef nota fill:#f1f3f5,stroke:#868e96,color:#111
  class D1,D2 feito
  class D3 meio
  class D4 falta
  class GARGALO nota
```

**O degrau 3 roda, mas não fala.** O único balde com amostra é *"jaqueta Ferrari, qualquer
época"* — ¥800 a ¥170.000. Isso não julga peça nenhuma, e o script devolve `sem base` onde
importaria, que é o comportamento certo.

**A saída não é mais dado bruto, é mais base.** Cada rodada de curadoria engorda os fatos de
graça, e é isso que estreita a datação — que por sua vez destrava o comparável e o corte.

---

## 3. Os 3 gates — e o único que falta

```mermaid
flowchart LR
  M[("Mercari<br/>~400 cards/rodada")] --> G1{{"GATE 1<br/>mecânico"}}
  G1 --> FILA["FILA.md<br/>377 candidatos<br/>41 com sinal"]
  FILA --> G2{{"GATE 2<br/>NÃO EXISTE"}}
  G2 --> PER["perícia<br/>~63k tokens/peça"]
  PER --> G3{{"GATE 3<br/>humano"}}
  G3 --> OF["oferta no grupo"]

  classDef ok fill:#d7f0d8,stroke:#2f9e44,color:#111
  classDef falta fill:#ffe3e3,stroke:#e03131,color:#111
  classDef neutro fill:#f1f3f5,stroke:#868e96,color:#111
  class G1,G3 ok
  class G2 falta
  class M,FILA,PER,OF neutro
```

| gate | onde mora | quem decide | estado |
|---|---|---|---|
| **1 · varredura → fila** | `fila.py` | mecânico: dedup + flags. **Só descarta, nunca promove** | ✅ existe |
| **2 · fila → perícia** | *nenhum lugar* | **você**, por um teto de peças por rodada | ⛔ **é o buraco** |
| **3 · perícia → oferta** | `valida.py` + veredito + aprovação no Baserow | você | ✅ existe |

**Por que o gate 2 importa:** hoje nada limita quantas peças sobem para a perícia cara. Sem
ele, um funil que traz 400 candidatos não economiza — ele multiplica trabalho caro. O gate 1
quase não corta (7 de 384, e todos por dedup), e depois da decisão de 19/08 sabe-se que **não
vai cortar por preço**. Então o freio tem de ser humano e explícito.

> [!ABERTO]+ teto-de-pericia-por-rodada · 2026-08-19
> **Quantas peças por rodada podem subir da fila para a perícia cara?** É o gate 2, e o número
> é seu. Referência medida: a Etapa 2 periciou **19 peças em 21 minutos** com 7 peritos em
> paralelo, a ~63k tokens cada. A fila de hoje tem 377 candidatos, dos quais **41 carregam
> algum sinal** — e é desses 41 que a escolha sairia.
> destrava: o Hermes poder rodar sozinho. Sem teto, varredura agendada vira multiplicador de
> custo em vez de funil.

---

## A regra que atravessa os três

**O agente instrui, você decide.** Ela não é promessa de prompt, é estrutura:

- o filtro **só descarta** — não ranqueia por desejabilidade, porque ranquear seria escolher
- **todo descarte é auditável**: motivo + o trecho do título que o disparou, em `FILA.md`
- **nenhuma nota agregada** em lugar nenhum, com gate mecânico (`valida-varredura.py`)
  recusando `nota`, `score`, `rating`, `ranking`, `preco_de_mercado`
- **entidade tirada de título é hipótese**, sempre marcada — título de Mercari é SEO do
  vendedor, e foi assim que uma peça Honda vendeu "Senna" sem ter nada dele
- **as buscas são fronteira humana** (`buscas.json`): o agente nunca inventa uma consulta,
  porque escolher o universo é escolher produto um passo antes

---

## Onde clicar

| quero… | abrir |
|---|---|
| os números crus, com o que deu errado | `curadoria/PROVA.md` |
| auditar os candidatos e os descartes | `curadoria/varredura/FILA.md` |
| a régua do que é verificável | `curadoria/METODO.md` |
| o estado da frente e o próximo passo | [[motor-ofertas-nsc]] |
| a conta do preço | [[logistica-mercari]] |
