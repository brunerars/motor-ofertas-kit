#!/usr/bin/env node
/**
 * notion-anexar-post.mjs — anexa os slides de um post na pagina da ideia no Notion,
 * em qualidade original (upload nativo, sem hospedagem publica no meio).
 *
 * Uso:
 *   node notion-anexar-post.mjs --page <id-ou-url> [--replace] [--titulo "..."] slide-1.png slide-2.png ...
 *
 * Precisa de NOTION_TOKEN (env ou .env em qualquer diretorio acima do cwd) e da
 * integracao interna conectada na pagina (••• > Connections).
 *
 * Why native upload and not a public URL: the MCP attachment tool only takes a
 * publicly reachable source_url, which would mean hosting the art somewhere first.
 * This posts the local bytes straight to Notion.
 */

import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const API = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const MARKER = "Arte final · slides";
const SINGLE_PART_LIMIT = 20 * 1024 * 1024; // 20MB, above this Notion needs multi-part

// ---------------------------------------------------------------- args + token

function parseArgs(argv) {
  const out = { files: [], replace: false, page: null, titulo: MARKER };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--replace") out.replace = true;
    else if (a === "--page") out.page = argv[++i];
    else if (a === "--titulo") out.titulo = argv[++i];
    else if (a.startsWith("--")) die(`opcao desconhecida: ${a}`);
    else out.files.push(a);
  }
  return out;
}

/** Walks up from cwd looking for a .env, so the token can live at the vault root. */
function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  let dir = process.cwd();
  for (;;) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*NOTION_TOKEN\s*=\s*(.*)$/);
        if (m) {
          const v = m[1].trim().replace(/^["']|["']$/g, "");
          if (v) return v;
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  die(
    "NOTION_TOKEN nao encontrado.\n" +
      "  1. notion.so/my-integrations > New internal integration (Insert/Update/Read content)\n" +
      "  2. cole o Internal Integration Secret no .env da raiz do vault: NOTION_TOKEN=ntn_...\n" +
      "  3. na pagina do Notion: ••• > Connections > adicione a integracao"
  );
}

/** Accepts a raw id, a dashed uuid, or any notion.so URL that ends in the 32-hex id. */
function normalizePageId(raw) {
  if (!raw) die("faltou --page <id-ou-url>");
  const hex = raw.replace(/[^0-9a-fA-F]/g, "");
  const id = hex.length >= 32 ? hex.slice(-32) : null;
  if (!id) die(`nao consegui extrair um id de pagina de: ${raw}`);
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

function die(msg) {
  console.error(`\n  erro: ${msg}\n`);
  process.exit(1);
}

// ------------------------------------------------------------------- http

let TOKEN;

async function notion(path, { method = "GET", body, raw } = {}) {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Notion-Version": NOTION_VERSION,
  };
  // FormData sets its own content-type with the multipart boundary; don't override it.
  if (body && !raw) headers["Content-Type"] = "application/json";
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    method,
    headers,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json error body */
  }
  if (!res.ok) {
    const detail = json?.message || text || res.statusText;
    if (res.status === 404) {
      die(
        `${res.status} em ${method} ${path}\n  ${detail}\n\n` +
          "  404 aqui quase sempre significa que a integracao nao foi conectada na pagina.\n" +
          "  Abra a pagina no Notion: ••• > Connections > adicione a integracao."
      );
    }
    die(`${res.status} em ${method} ${path}\n  ${detail}`);
  }
  return json;
}

// ------------------------------------------------------------------- upload

async function uploadFile(path) {
  const info = await stat(path).catch(() => die(`arquivo nao encontrado: ${path}`));
  if (info.size > SINGLE_PART_LIMIT) {
    die(`${basename(path)} tem ${(info.size / 1048576).toFixed(1)}MB — acima do limite single-part de 20MB`);
  }
  const filename = basename(path);
  const created = await notion("/file_uploads", {
    method: "POST",
    body: { filename, content_type: "image/png" },
  });

  const form = new FormData();
  form.append("file", new Blob([await readFile(path)], { type: "image/png" }), filename);
  const sent = await notion(created.upload_url, { method: "POST", body: form, raw: true });

  if (sent.status !== "uploaded") die(`${filename}: upload terminou em status "${sent.status}"`);
  return { id: sent.id, filename, bytes: info.size };
}

// ------------------------------------------------------------- page surgery

async function listChildren(pageId) {
  const all = [];
  let cursor;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const page = await notion(`/blocks/${pageId}/children${q}`);
    all.push(...page.results);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return all;
}

const plain = (block) => {
  const rt = block?.[block.type]?.rich_text;
  return Array.isArray(rt) ? rt.map((t) => t.plain_text).join("") : "";
};

/** Finds the marker heading and every image block that follows it, uninterrupted. */
function findExistingArt(children, titulo) {
  const at = children.findIndex((b) => b.type === "heading_3" && plain(b).trim() === titulo);
  if (at === -1) return null;
  const ids = [children[at].id];
  for (let i = at + 1; i < children.length && children[i].type === "image"; i++) ids.push(children[i].id);
  return ids;
}

// ---------------------------------------------------------------------- main

const args = parseArgs(process.argv.slice(2));
if (!args.files.length) {
  die("uso: node notion-anexar-post.mjs --page <id-ou-url> [--replace] slide-1.png slide-2.png ...");
}
TOKEN = loadToken();
const pageId = normalizePageId(args.page);
const files = args.files.map((f) => resolve(f));

const existing = findExistingArt(await listChildren(pageId), args.titulo);
if (existing && !args.replace) {
  die(
    `a pagina ja tem "${args.titulo}" (${existing.length - 1} imagem/ns).\n` +
      "  Rode com --replace pra trocar a arte, ou mude --titulo pra anexar uma segunda leva."
  );
}

// Upload everything BEFORE touching the page: a failure halfway leaves the page
// untouched instead of half-populated.
console.log(`\n  ${files.length} slides -> ${pageId}\n`);
const uploaded = [];
for (const f of files) {
  const u = await uploadFile(f);
  uploaded.push(u);
  console.log(`  ok  ${u.filename}  ${(u.bytes / 1024).toFixed(0)}KB`);
}

if (existing) {
  for (const id of existing) await notion(`/blocks/${id}`, { method: "DELETE" });
  console.log(`\n  substituido: ${existing.length} blocos antigos removidos`);
}

const children = [
  {
    type: "heading_3",
    heading_3: { rich_text: [{ type: "text", text: { content: args.titulo } }] },
  },
  ...uploaded.map((u, i) => ({
    type: "image",
    image: {
      type: "file_upload",
      file_upload: { id: u.id },
      caption: [{ type: "text", text: { content: `slide ${i + 1}` } }],
    },
  })),
];

await notion(`/blocks/${pageId}/children`, { method: "PATCH", body: { children } });
console.log(`\n  anexado: "${args.titulo}" + ${uploaded.length} imagens\n`);
