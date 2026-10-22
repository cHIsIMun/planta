// Visualizador web (seção 13.5): uma página só, com o modelo embutido.
// `planta serve` a serve recalculada a cada recarga; `planta export-site`
// grava o mesmo HTML para publicar como site estático.
//
// A página responde, nesta ordem: a planta confere com o código? se não, o
// que fazer? e como é a arquitetura (contextos, apps, deployments), com cada
// elemento ligado ao código que o implementa.

import type { Diagnostic } from "../diagnostics.ts";
import type { IrModel } from "../ir.ts";

/** Versão fixa do Mermaid carregado pelo navegador para desenhar os diagramas. */
const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs";

export interface SiteData {
  ir: IrModel;
  /** Raiz do projeto, absoluta, para os links `vscode://file/...`. */
  projectRoot: string;
  diagrams: Record<string, { kind: string; of?: string; text?: string; error?: string }>;
  diagnostics: Diagnostic[];
  /** Estado de revisão por elemento (seção 12.3). */
  review: Record<string, "new" | "changed" | "reviewed">;
  /** A planta foi conferida contra o código (falso com `--fast` ou sem extratores). */
  verified?: boolean;
  /** Fatos extraídos do código. */
  facts?: number;
}

const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 13.5H11V21.5M11 2.5V8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 8a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6"/></svg>`;
const FAVICON = `data:image/svg+xml,${encodeURIComponent(LOGO.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/currentColor/g, "#3461c1"))}`;

export function buildSite(data: SiteData): string {
  // `</script>` dentro do JSON fecharia a tag; U+2028/2029 quebram JavaScript antigo.
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const title = data.ir.system?.id ?? "Planta";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Planta</title>
<link rel="icon" href="${FAVICON}">
<style>${CSS}</style>
</head>
<body>
<header class="bar">
  <button class="menu" type="button" aria-expanded="false" aria-controls="nav" aria-label="Navegação"><span></span><span></span></button>
  <a class="brand" href="#/">${LOGO}<span>${escapeHtml(title)}</span></a>
  <button class="find" type="button" id="find-open"><span>Buscar elemento</span><kbd>⌘K</kbd></button>
  <a class="pill" id="status-pill" href="#/saude"></a>
</header>
<div class="layout">
  <nav class="side" id="nav" aria-label="Navegação"></nav>
  <main id="main"></main>
</div>
<div class="finder" id="finder" hidden>
  <div class="finder-box" role="dialog" aria-label="Buscar elemento">
    <input id="find-input" type="search" placeholder="Nome, tipo ou contexto" autocomplete="off" spellcheck="false" aria-label="Buscar elemento">
    <ol id="find-results"></ol>
  </div>
</div>
<script type="application/json" id="data">${json}</script>
<script type="module">
const MERMAID_URL = ${JSON.stringify(MERMAID_URL)};
${VIEWER_SCRIPT}
</script>
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const CSS = `
:root {
  --bg: #ffffff; --surface: #f5f5f7; --ink: #1d1d1f; --muted: #6e6e73; --line: rgba(0,0,0,.08);
  --accent: #3461c1; --accent-soft: rgba(52,97,193,.1);
  --ok: #1f7a4d; --ok-soft: rgba(31,122,77,.1);
  --warn: #9a6100; --warn-soft: rgba(201,130,0,.12);
  --error: #c0362c; --error-soft: rgba(192,54,44,.09);
  --bar: rgba(255,255,255,.75);
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1c1e; --surface: #2a2a2d; --ink: #f5f5f7; --muted: #a1a1a6; --line: rgba(255,255,255,.1);
    --accent: #86a8ff; --accent-soft: rgba(134,168,255,.13);
    --ok: #5fcf95; --ok-soft: rgba(95,207,149,.12);
    --warn: #f0b74a; --warn-soft: rgba(240,183,74,.13);
    --error: #ff7b70; --error-soft: rgba(255,123,112,.12);
    --bar: rgba(28,28,30,.75);
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--sans); letter-spacing: -.01em; -webkit-font-smoothing: antialiased; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: .18em; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
code, .mono { font-family: var(--mono); font-size: .88em; letter-spacing: 0; }
button { font: inherit; color: inherit; }

/* Barra */
.bar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 14px; height: 52px; padding: 0 20px;
  background: var(--bar); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid var(--line); }
.brand { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 600; font-size: 16px; letter-spacing: -.02em; }
.brand:hover { text-decoration: none; }
.brand svg { width: 22px; height: 22px; color: var(--accent); }
.find { display: flex; align-items: center; gap: 24px; margin-left: auto; height: 32px; padding: 0 10px 0 12px; border: 0; border-radius: 9px; background: var(--surface); color: var(--muted); font-size: 13px; cursor: pointer; }
.find kbd { font: inherit; font-size: 12px; }
.pill { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 980px; font-size: 13px; font-weight: 500; white-space: nowrap; }
.pill:hover { text-decoration: none; filter: brightness(.97); }
.pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pill.ok { background: var(--ok-soft); color: var(--ok); }
.pill.warn { background: var(--warn-soft); color: var(--warn); }
.pill.error { background: var(--error-soft); color: var(--error); }
.pill.off { background: var(--surface); color: var(--muted); }
.menu { display: none; width: 34px; height: 34px; margin-left: -8px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.menu span { display: block; width: 18px; height: 1.5px; margin: 5px auto; background: currentColor; border-radius: 1px; }

/* Layout */
.layout { display: grid; grid-template-columns: 248px minmax(0, 1fr); }
.side { position: sticky; top: 52px; height: calc(100vh - 52px); overflow-y: auto; padding: 20px 12px 40px; border-right: 1px solid var(--line); font-size: 14px; }
.side h2 { margin: 22px 10px 6px; color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: 0; }
.side ul { list-style: none; margin: 0; padding: 0; }
.side a { display: flex; align-items: baseline; gap: 8px; padding: 6px 10px; border-radius: 8px; color: var(--ink); }
.side a:hover { background: var(--surface); text-decoration: none; }
.side a[aria-current] { background: var(--accent-soft); color: var(--accent); font-weight: 500; }
.side .count { margin-left: auto; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.side .count.bad { color: var(--error); font-weight: 600; }
main { min-width: 0; max-width: 1040px; padding: 36px 48px 80px; }

/* Tipografia */
.eyebrow { margin: 0 0 4px; color: var(--muted); font-size: 14px; }
.eyebrow a { color: var(--muted); }
h1 { margin: 0; font-size: 34px; line-height: 1.15; letter-spacing: -.03em; }
h2.section { margin: 44px 0 6px; font-size: 21px; letter-spacing: -.02em; }
.hint { margin: 0 0 16px; color: var(--muted); }
.lede { max-width: 680px; margin: 10px 0 0; color: var(--muted); font-size: 17px; }
.docs { max-width: 680px; margin: 14px 0 0; white-space: pre-line; }

/* Estado (o primeiro bloco da visão geral) */
.state { margin: 28px 0 0; padding: 24px 26px; border-radius: 18px; }
.state.ok { background: var(--ok-soft); } .state.warn { background: var(--warn-soft); } .state.error { background: var(--error-soft); } .state.off { background: var(--surface); }
.state h2 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
.state.ok h2 { color: var(--ok); } .state.warn h2 { color: var(--warn); } .state.error h2 { color: var(--error); }
.state p { margin: 6px 0 0; max-width: 700px; }
.state .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.button { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 980px; background: var(--ink); color: var(--bg); font-size: 14px; font-weight: 500; }
.button:hover { text-decoration: none; opacity: .88; }
.cmd { display: inline-flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 10px; background: var(--bg); font-family: var(--mono); font-size: 13px; letter-spacing: 0; }

/* Mapa */
.map { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.place { display: block; padding: 18px 20px; border: 1px solid var(--line); border-radius: 16px; color: var(--ink); transition: border-color .2s ease; }
.place:hover { border-color: var(--accent); text-decoration: none; }
.place .kind { color: var(--muted); font-size: 13px; }
.place strong { display: block; margin: 2px 0 6px; font-size: 18px; letter-spacing: -.02em; }
.place p { margin: 0; color: var(--muted); font-size: 14px; }
.place .issues { margin-top: 10px; color: var(--error); font-size: 13px; font-weight: 500; }

/* Listas de elementos */
.rows { margin: 0; padding: 0; list-style: none; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.rows > li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; padding: 12px 16px; border-top: 1px solid var(--line); }
.rows > li:first-child { border-top: 0; }
.rows .name { font-weight: 500; }
.rows .sub { grid-column: 1 / -1; color: var(--muted); font-size: 13.5px; }
.rows .sig { grid-column: 1 / -1; display: grid; gap: 2px; margin-top: 4px; font-family: var(--mono); font-size: 12.5px; color: var(--muted); letter-spacing: 0; }
.rows .right { color: var(--muted); font-size: 13px; text-align: right; }
.method { display: inline-block; min-width: 54px; margin-right: 8px; padding: 1px 6px; border-radius: 6px; background: var(--accent-soft); color: var(--accent); font: 600 11.5px/1.6 var(--mono); text-align: center; letter-spacing: 0; }
.mark { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
.mark::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.mark.ok { color: var(--ok); } .mark.warn { color: var(--warn); } .mark.error { color: var(--error); } .mark.off { color: var(--muted); }

/* Elemento */
.head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-top: 14px; }
.open { display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border-radius: 980px; background: var(--accent-soft); color: var(--accent); font-size: 13.5px; font-weight: 500; }
.open:hover { text-decoration: none; filter: brightness(.97); }
.where { min-width: 0; color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table { border: 1px solid var(--line); border-radius: 14px; overflow: auto; }
th, td { padding: 9px 14px; text-align: left; vertical-align: top; border-top: 1px solid var(--line); }
thead th { border-top: 0; background: var(--surface); font-weight: 600; font-size: 13px; }
.facts { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; margin: 0; }
.facts dt { color: var(--muted); }
.facts dd { margin: 0; }
.flow { margin: 0; padding: 0; list-style: none; counter-reset: step; }
.flow > li { position: relative; padding: 0 0 14px 38px; counter-increment: step; }
.flow > li::before { content: counter(step); position: absolute; left: 0; top: 1px; width: 24px; height: 24px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-size: 12.5px; font-weight: 600; text-align: center; line-height: 24px; }
.flow .flow { margin-top: 10px; }
.rel { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 8px 16px; margin: 0; }
.rel dt { color: var(--muted); }
.rel dd { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }

/* Saúde */
.problem { margin: 0 0 14px; padding: 18px 20px; border: 1px solid var(--line); border-radius: 16px; }
.problem h3 { margin: 0; font-size: 17px; letter-spacing: -.015em; }
.problem .todo { margin: 4px 0 12px; color: var(--muted); }
.problem ul { margin: 0; padding: 0; list-style: none; }
.problem li { padding: 8px 0; border-top: 1px solid var(--line); }
.problem li .msg { display: block; }
.problem li .loc { color: var(--muted); font-size: 12.5px; }
.problem.error h3 { color: var(--error); } .problem.warning h3 { color: var(--warn); }

/* Diagramas */
.tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 20px 0 16px; }
.tabs a { padding: 6px 12px; border-radius: 980px; background: var(--surface); color: var(--ink); font-size: 13.5px; }
.tabs a:hover { text-decoration: none; filter: brightness(.97); }
.tabs a[aria-current] { background: var(--ink); color: var(--bg); }
.diagram { padding: 24px; border: 1px solid var(--line); border-radius: 16px; overflow: auto; text-align: center; }
.diagram svg { max-width: 100%; height: auto; }
details { margin-top: 12px; color: var(--muted); }
pre { margin: 8px 0 0; padding: 14px 16px; border-radius: 12px; background: var(--surface); overflow: auto; font-size: 12.5px; text-align: left; }
.empty { padding: 28px; border-radius: 16px; background: var(--surface); color: var(--muted); }

/* Busca */
.finder { position: fixed; inset: 0; z-index: 30; display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 0; background: rgba(0,0,0,.25); }
.finder[hidden] { display: none; }
.finder-box { width: min(620px, 100%); border-radius: 16px; background: var(--bg); box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden; }
.finder input { width: 100%; height: 54px; padding: 0 20px; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: var(--ink); font: inherit; font-size: 17px; outline: none; }
.finder ol { max-height: 50vh; margin: 0; padding: 6px; overflow-y: auto; list-style: none; }
.finder li a { display: flex; gap: 12px; align-items: baseline; padding: 9px 14px; border-radius: 10px; color: var(--ink); }
.finder li a:hover, .finder li a.on { background: var(--accent-soft); text-decoration: none; }
.finder li small { margin-left: auto; color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.finder .none { padding: 14px; color: var(--muted); }

@media (max-width: 860px) {
  .menu { display: block; }
  .find span { display: none; }
  .find { gap: 0; }
  .find kbd::before { content: "Buscar "; }
  .find kbd { font-size: 13px; }
  .pill { padding: 0 10px; }
  .layout { display: block; }
  .side { position: fixed; inset: 52px 0 0 0; z-index: 9; height: auto; background: var(--bg); border: 0; display: none; }
  .side.open { display: block; }
  main { padding: 24px 16px 64px; }
  h1 { font-size: 28px; }
  .rel { grid-template-columns: 1fr; gap: 2px; }
  .rel dd { margin-bottom: 10px; }
}
`;

// Roda no navegador. Constrói o DOM com textContent: nada do modelo vira HTML.
export const VIEWER_SCRIPT = String.raw`
const data = JSON.parse(document.getElementById("data").textContent);
const E = data.ir.elements;
const R = data.ir.requirements ?? {};
const ids = Object.keys(E);
const children = {};
for (const id of ids) { const p = E[id].parent; if (p) (children[p] ??= []).push(id); }
for (const list of Object.values(children)) list.sort((a, b) => E[a].source.line - E[b].source.line || a.localeCompare(b));
const incoming = {};
for (const id of ids) for (const r of E[id].relations) (incoming[r.target] ??= []).push({ from: id, type: r.type });

const KIND = {
  context: "Contexto", entity: "Entidade", value: "Objeto de valor", enum: "Enum", dto: "DTO", aggregate: "Agregado",
  controller: "Controller", service: "Serviço", repository: "Repositório", gateway: "Gateway", middleware: "Middleware",
  component: "Componente", op: "Operação", api: "API", endpoint: "Endpoint", event: "Evento", channel: "Canal",
  job: "Job", process: "Processo", app: "App", page: "Página", guard: "Guard", store: "Store",
  deployment: "Deployment", node: "Recurso", group: "Grupo", actor: "Ator", external: "Sistema externo",
  layer: "Camada", rule: "Regra", view: "View", requirement: "Requisito", decision: "Decisão",
};
const PLURAL = { entity: "entidades", value: "objetos de valor", enum: "enums", dto: "DTOs", endpoint: "endpoints", process: "processos",
  event: "eventos", job: "jobs", page: "páginas", component: "componentes", service: "serviços", controller: "controllers",
  repository: "repositórios", node: "recursos", guard: "guards", store: "stores", api: "APIs", channel: "canais" };
const REL = {
  uses: "Usa", calls: "Chama", renders: "Renderiza", contains: "Contém", inLayer: "Camada", handledBy: "Tratado por",
  justifiedBy: "Justificado por", decidedBy: "Decidido em", runs: "Executa", connectsTo: "Conecta a", consumes: "Consome",
  triggeredBy: "Disparado por", stores: "Guarda em", carries: "Transporta",
};
const REL_IN = {
  uses: "Usado por", calls: "Chamado por", renders: "Renderizado por", contains: "Faz parte de", inLayer: "Elementos da camada",
  handledBy: "Trata", justifiedBy: "Justifica", decidedBy: "Fundamenta", runs: "Executado em", connectsTo: "Recebe conexão de",
  consumes: "Consumido por", triggeredBy: "Dispara", stores: "Guarda", carries: "Transportado por",
};
const kindOf = (id) => KIND[E[id]?.kind] ?? E[id]?.kind ?? "";

function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false || v === null) continue;
    if (k === "class") node.className = v; else node.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid !== undefined && kid !== null && kid !== false) node.append(kid instanceof Node ? kid : String(kid));
  return node;
}
const href = (id) => "#/e/" + encodeURIComponent(id);
const label = (id) => E[id].kind === "endpoint" ? E[id].method + " " + E[id].path : E[id].name;
const link = (id, text) => E[id] ? h("a", { href: href(id) }, text ?? label(id))
  : R[id] ? h("a", { href: "#/r/" + encodeURIComponent(id) }, text ?? (R[id].id + " " + R[id].title))
  : h("span", { class: "mono" }, text ?? id.replace(/^req:/, ""));
const typeText = (t) => !t ? "" : t.map ? "Map<" + typeText(t.map.key) + ", " + typeText(t.map.value) + ">" + (t.optional ? "?" : "")
  : (E[t.ref]?.name ?? t.ref) + (t.list ? "[]" : "") + (t.optional ? "?" : "");
const typeNode = (t) => t && t.ref && E[t.ref] ? h("span", {}, link(t.ref), (t.list ? "[]" : "") + (t.optional ? "?" : "")) : h("span", { class: "mono" }, typeText(t));
const signature = (op) => op.name + "(" + (op.params ?? []).map((p) => p.name + ": " + typeText(p.type)).join(", ") + ")" + (op.returns ? " → " + typeText(op.returns) : "");
const editor = (file, line) => "vscode://file/" + data.projectRoot + "/" + file + ":" + (line ?? 1);
const ancestors = (id) => { const out = []; for (let c = E[id]?.parent; c; c = E[c]?.parent) out.unshift(c); return out; };
const plural = (n, kind) => n + " " + (n === 1 ? (KIND[kind] ?? kind).toLowerCase() : PLURAL[kind] ?? kind);
const within = (id, root) => id === root || ancestors(id).includes(root);

// ---------------------------------------------------------------------
//  Diagnósticos: por elemento e por tipo de problema, com o que fazer
// ---------------------------------------------------------------------

const diags = data.diagnostics;
const bySource = {};
for (const id of ids) { const s = E[id].source; (bySource[s.file + ":" + s.line] ??= []).push(id); }
/** Elemento a que o diagnóstico se refere: o declarado na linha, ou o citado na mensagem. */
function elementOf(d) {
  const here = bySource[d.loc.file + ":" + d.loc.line];
  if (here) return here[here.length - 1];
  const quoted = [...d.message.matchAll(/\x60([^\x60]+)\x60/g)].map((m) => m[1]).find((q) => E[q]);
  return quoted;
}
const diagsOf = (id) => diags.filter((d) => elementOf(d) === id);
const diagsWithin = (root) => diags.filter((d) => { const el = elementOf(d); return el && within(el, root); });

const GROUPS = [
  { test: (n) => n >= 100 && n < 200, title: "A planta tem erros de escrita", todo: "Corrija o arquivo .planta indicado. Enquanto houver erro de sintaxe ou de nome, o resto da verificação fica incompleto." },
  { test: (n) => n >= 200 && n < 230, title: "Âncoras que não encontram o código", todo: "A âncora aponta para um arquivo ou símbolo que não existe (ou existe mais de um). Corrija o caminho na planta, ou marque o elemento como planned se ainda não foi implementado." },
  { test: (n) => (n >= 230 && n < 300) || (n >= 410 && n < 500), title: "Planta e código dizem coisas diferentes", todo: "Decida quem está certo: atualize a planta para descrever o código, ou corrija o código para seguir a planta." },
  { test: (n) => n >= 300 && n < 400, title: "Código que a planta não descreve", todo: "Existe no código algo que a planta não menciona. Rode npx planta suggest --uncovered para gerar as declarações e cole na planta." },
  { test: (n) => n >= 400 && n < 410, title: "Mudanças esperando revisão", todo: "O código mudou (ou nunca foi revisado) desde a última revisão. Confira com npx planta review e aceite com npx planta accept <ID>." },
  { test: (n) => n >= 500 && n < 600, title: "Regras de arquitetura violadas", todo: "Uma dependência no código fere uma regra da planta. Remova a dependência, ou ajuste a regra se ela não vale mais." },
  { test: (n) => n >= 600 && n < 700, title: "Requisitos e decisões", todo: "Um requisito citado não existe, não tem implementação ou mudou. Atualize o documento ou o justifiedBy dos elementos." },
  { test: (n) => n >= 700 && n < 800, title: "Processos que o código não segue", todo: "Os passos declarados no processo não aparecem, ou aparecem em outra ordem, no caminho de código do gatilho." },
];
const groupOf = (d) => GROUPS.find((g) => g.test(Number(d.code.slice(2)))) ?? { title: "Outros", todo: "" };
const counts = { error: diags.filter((d) => d.severity === "error").length, warning: diags.filter((d) => d.severity === "warning").length };
const pending = Object.values(data.review).filter((s) => s !== "reviewed").length;
const state = data.verified === false ? "off" : counts.error ? "error" : counts.warning || pending ? "warn" : "ok";

// ---------------------------------------------------------------------
//  Navegação
// ---------------------------------------------------------------------

const tops = (kind) => ids.filter((id) => !E[id].parent && E[id].kind === kind).sort();
function nav() {
  const root = document.getElementById("nav");
  const item = (target, label, count, bad) => h("li", {}, h("a", { href: target, "data-href": target }, label,
    count !== undefined ? h("span", { class: "count" + (bad ? " bad" : "") }, count) : null));
  const issues = (id) => diagsWithin(id).filter((d) => d.severity === "error").length;
  const section = (title, list) => list.length ? [h("h2", {}, title), h("ul", {}, list)] : [];
  const reqs = Object.keys(R).filter((k) => R[k].kind === "requirement");
  root.replaceChildren(
    h("ul", {}, item("#/", "Visão geral"), item("#/saude", "Saúde", diags.length || undefined, counts.error > 0), item("#/diagramas", "Diagramas")),
    ...section("Contextos", tops("context").map((id) => item(href(id), E[id].name, issues(id) || undefined, true))),
    ...section("Apps", tops("app").map((id) => item(href(id), E[id].name, issues(id) || undefined, true))),
    ...section("Deployments", tops("deployment").map((id) => item(href(id), E[id].name, issues(id) || undefined, true))),
    ...section("Requisitos", reqs.length ? [item("#/requisitos", "Todos os requisitos", reqs.length)] : []),
  );
  markCurrent();
}
function markCurrent() {
  const hash = location.hash || "#/";
  let best = null;
  for (const a of document.querySelectorAll(".side a")) {
    a.removeAttribute("aria-current");
    const target = a.dataset.href;
    const id = decodeURIComponent((target.match(/^#\/e\/(.+)$/) ?? [])[1] ?? "");
    const current = decodeURIComponent((hash.match(/^#\/e\/(.+)$/) ?? [])[1] ?? "");
    if (target === hash || (id && current && within(current, id)) || (target === "#/diagramas" && hash.startsWith("#/diagramas")) || (target === "#/requisitos" && hash.startsWith("#/r/"))) best = a;
  }
  best?.setAttribute("aria-current", "page");
}

// ---------------------------------------------------------------------
//  Diagramas
// ---------------------------------------------------------------------

let mermaid;
async function drawDiagrams(container) {
  const nodes = [...container.querySelectorAll(".diagram[data-src]")];
  if (!nodes.length) return;
  try {
    mermaid ??= (await import(MERMAID_URL)).default;
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "neutral", fontFamily: getComputedStyle(document.body).fontFamily });
    for (const [i, node] of nodes.entries()) {
      const { svg } = await mermaid.render("d" + Date.now() + i, node.dataset.src);
      node.innerHTML = svg;
    }
  } catch (e) {
    for (const node of nodes) if (!node.querySelector("svg")) node.replaceChildren(h("p", { class: "hint" }, "Não foi possível desenhar o diagrama (o Mermaid é carregado da internet). O texto dele:"), h("pre", {}, node.dataset.src));
  }
}
function diagramTitle(name) {
  const d = data.diagrams[name];
  const of = d.of && E[d.of] ? E[d.of].name : "";
  return { "c4.context": "Sistema e atores", "c4.container": "Apps e conexões", er: "Dados de " + of, class: "Classes de " + of,
    sequence: "Sequência: " + of, deployment: "Deployment " + of }[d.kind] ?? name;
}
const diagramBox = (name) => {
  const d = data.diagrams[name];
  if (!d) return null;
  if (d.error) return h("p", { class: "empty" }, d.error);
  return h("div", {}, h("div", { class: "diagram", "data-src": d.text }, h("p", { class: "hint" }, "Desenhando…")),
    h("details", {}, h("summary", {}, "Texto Mermaid"), h("pre", {}, d.text)));
};
const diagramsOf = (id) => Object.keys(data.diagrams).filter((n) => data.diagrams[n].of === id && !data.diagrams[n].error);

// ---------------------------------------------------------------------
//  Páginas
// ---------------------------------------------------------------------

function stateBlock() {
  const total = ids.filter((id) => E[id].anchor).length;
  if (state === "off") return h("section", { class: "state off" }, h("h2", {}, "A planta não foi conferida com o código"),
    h("p", {}, "Esta página mostra só o que está escrito na planta. Para comparar com o código, configure extratores em planta.config.yaml e rode sem --fast."));
  if (state === "ok") return h("section", { class: "state ok" }, h("h2", {}, "A planta confere com o código."),
    h("p", {}, total + " elementos apontam para o código" + (data.facts ? ", comparados com " + data.facts + " fatos extraídos dele" : "") + ". Nada diverge e nada espera revisão."));
  const parts = [];
  if (counts.error) parts.push(counts.error === 1 ? "1 erro" : counts.error + " erros");
  if (counts.warning) parts.push(counts.warning === 1 ? "1 aviso" : counts.warning + " avisos");
  const title = counts.error ? "A planta e o código divergem." : pending && !counts.warning ? "Tudo confere, mas há mudanças para revisar." : "Há pontos para conferir.";
  const top = [...new Set(diags.map((d) => groupOf(d).title))].slice(0, 3);
  return h("section", { class: "state " + state }, h("h2", {}, title),
    h("p", {}, parts.join(" e ") + (top.length ? ": " + top.join("; ").toLowerCase() + "." : ".")),
    h("div", { class: "actions" }, h("a", { class: "button", href: "#/saude" }, "Ver o que corrigir"),
      pending ? h("span", { class: "cmd" }, "npx planta review") : null));
}

/** Elementos dentro de um elemento, inclusive o que um app contém por "contains". */
function scope(id) {
  const roots = [id, ...E[id].relations.filter((r) => r.type === "contains").map((r) => r.target)];
  return ids.filter((x) => x !== id && roots.some((r) => within(x, r)));
}
const FRONTEND = new Set(["spa", "web", "frontend", "mobile", "desktop"]);
function summary(id) {
  const all = scope(id);
  const kinds = ["entity", "endpoint", "process", "event", "job", "page", "component", "service", "node"];
  const parts = kinds.map((k) => [k, all.filter((x) => E[x].kind === k).length]).filter(([, n]) => n > 0).map(([k, n]) => plural(n, k));
  return parts.join(", ");
}
function place(id) {
  const el = E[id];
  const errors = diagsWithin(id).filter((d) => d.severity === "error").length;
  const detail = el.kind === "app" ? [el.appKind, el.framework].filter(Boolean).join(", ") : el.kind === "deployment" ? [el.provider, el.region].filter(Boolean).join(", ") : "";
  return h("a", { class: "place", href: href(id) }, h("span", { class: "kind" }, kindOf(id) + (detail ? " · " + detail : "")),
    h("strong", {}, el.name), h("p", {}, el.docs?.split("\n")[0] || summary(id) || "Sem elementos."),
    el.docs && summary(id) ? h("p", {}, summary(id)) : null,
    errors ? h("div", { class: "issues" }, errors === 1 ? "1 erro" : errors + " erros") : null);
}

function overview() {
  const sys = data.ir.system;
  const map = (kind, title, hint) => {
    const list = tops(kind);
    return list.length ? [h("h2", { class: "section" }, title), h("p", { class: "hint" }, hint), h("div", { class: "map" }, list.map(place))] : [];
  };
  const firstDiagram = ["c4.container", "c4.context"].map((k) => Object.keys(data.diagrams).find((n) => data.diagrams[n].kind === k && !data.diagrams[n].error)).find(Boolean);
  return h("div", {},
    h("p", { class: "eyebrow" }, "Arquitetura descrita em planta/"),
    h("h1", {}, sys?.id ?? "Planta"),
    sys?.description ? h("p", { class: "lede" }, sys.description) : null,
    stateBlock(),
    map("context", "Contextos", "Partes do domínio, cada uma com seus dados, APIs e processos."),
    map("app", "Apps", "O que é implantado e executado: backends, frontends e workers."),
    map("deployment", "Deployments", "Onde os apps rodam, conferido contra a infraestrutura como código."),
    firstDiagram ? [h("h2", { class: "section" }, diagramTitle(firstDiagram)), h("p", { class: "hint" }, h("a", { href: "#/diagramas" }, "Todos os diagramas")), diagramBox(firstDiagram)] : null);
}

function healthPage() {
  const head = [h("p", { class: "eyebrow" }, "Saúde"), h("h1", {}, state === "ok" ? "Nada a corrigir" : "O que corrigir")];
  if (state === "off") return h("div", {}, head, h("p", { class: "empty" }, "A planta não foi conferida com o código (modo --fast ou sem extratores)."));
  if (!diags.length) return h("div", {}, head, h("p", { class: "lede" }, "A planta confere com o código e não há nada esperando revisão."));
  const grouped = new Map();
  for (const d of diags) { const g = groupOf(d); if (!grouped.has(g.title)) grouped.set(g.title, { g, list: [] }); grouped.get(g.title).list.push(d); }
  const order = [...grouped.values()].sort((a, b) => (b.list.some((d) => d.severity === "error") ? 1 : 0) - (a.list.some((d) => d.severity === "error") ? 1 : 0));
  return h("div", {}, head,
    h("p", { class: "lede" }, "Os problemas estão agrupados pelo que fazer com eles. Cada item leva ao elemento na planta e ao arquivo no editor."),
    h("div", { style: "margin-top: 28px" }, order.map(({ g, list }) => problem(g, list))));
}
function problem(g, list) {
  const worst = list.some((d) => d.severity === "error") ? "error" : list.some((d) => d.severity === "warning") ? "warning" : "info";
  return h("section", { class: "problem " + worst }, h("h3", {}, g.title + " (" + list.length + ")"), g.todo ? h("p", { class: "todo" }, g.todo) : null,
    h("ul", {}, list.map(diagItem)));
}
/** Mensagem com os trechos entre crases como código, e como link quando são elementos. */
function richText(text) {
  return text.split(/\x60([^\x60]*)\x60/).map((part, i) => i % 2 === 0 ? part : E[part] ? h("a", { href: href(part), class: "mono" }, part) : h("code", {}, part));
}
function diagItem(d) {
  const el = elementOf(d);
  return h("li", {}, h("span", { class: "msg" }, richText(d.message)),
    h("span", { class: "loc" }, el ? [link(el, kindOf(el) + " " + el), " · "] : null,
      h("a", { href: editor(d.loc.file, d.loc.line), class: "mono" }, d.loc.file + ":" + d.loc.line), " · " + d.code));
}

/** Estado do elemento; em listas (quiet), só o que pede atenção. */
function statusMark(id, quiet) {
  // Inclui o que está dentro: um serviço com uma operação divergente não "confere".
  const own = diagsWithin(id);
  const review = data.review[id];
  if (own.some((d) => d.severity === "error")) return h("span", { class: "mark error" }, own.length === 1 ? "1 problema" : own.length + " problemas");
  if (own.some((d) => d.severity === "warning") || review === "changed" || review === "new") return h("span", { class: "mark warn" }, review === "new" ? "Nunca revisado" : review === "changed" ? "Mudou desde a revisão" : "Com avisos");
  if (quiet || data.verified === false || !E[id].anchor) return null;
  return h("span", { class: "mark ok" }, "Confere com o código");
}

function elementRows(list) {
  return h("ul", { class: "rows" }, list.map((id) => {
    const el = E[id];
    const ops = (children[id] ?? []).filter((c) => E[c].kind === "op");
    const fields = el.fields?.length ? el.fields.map((f) => f.name).join(", ") : "";
    const sub = el.kind === "endpoint" ? null : el.kind === "op" ? null : el.docs?.split("\n")[0] || (fields ? "Campos: " + fields : el.values?.length ? el.values.join(", ") : "");
    const name = el.kind === "endpoint"
      ? h("span", { class: "name" }, h("span", { class: "method" }, el.method), h("a", { href: href(id), class: "mono" }, el.path))
      : el.kind === "op" ? h("span", { class: "name mono" }, h("a", { href: href(id) }, signature(el)))
      : h("span", { class: "name" }, link(id));
    const handler = el.kind === "endpoint" ? el.relations.find((r) => r.type === "handledBy")?.target : undefined;
    const mark = statusMark(id, true);
    return h("li", {}, name, h("span", { class: "right" }, mark ?? (el.kind === "endpoint" || el.kind === "op" ? "" : kindOf(id))),
      handler ? h("span", { class: "sub" }, "Tratado por ", link(handler, (E[E[handler]?.parent]?.name ?? "") + "." + (E[handler]?.name ?? handler))) : null,
      sub ? h("span", { class: "sub" }, sub) : null,
      ops.length ? h("span", { class: "sig" }, ops.map((o) => h("a", { href: href(o) }, signature(E[o])))) : null);
  }));
}

const SECTIONS = [
  ["Dados", "Entidades, objetos de valor, enums e DTOs.", ["entity", "value", "aggregate", "enum", "dto"]],
  ["APIs", "Endpoints e quem os trata.", ["endpoint"]],
  ["Telas", "Páginas, componentes, guards e stores do frontend.", ["page", "component", "guard", "store"]],
  ["Componentes", "Controllers, serviços e repositórios, com as operações.", ["controller", "service", "repository", "gateway", "middleware"]],
  ["Eventos e processos", "O que acontece de forma assíncrona e os fluxos de negócio.", ["event", "channel", "job", "process"]],
  ["Recursos", "Recursos de infraestrutura e o que executa neles.", ["node", "group"]],
];

function containerPage(id) {
  const el = E[id];
  const all = scope(id);
  // Apps também contêm por "contains": os contextos e componentes que o app executa.
  const contained = el.relations.filter((r) => r.type === "contains").map((r) => r.target).filter((t) => E[t]?.kind === "context");
  const parts = [];
  // "component" é tela só em app de frontend; num contexto ou backend, é componente de código.
  const frontend = el.kind === "app" && FRONTEND.has(el.appKind);
  for (const [title, hint, base] of SECTIONS) {
    const kinds = frontend || title === "Recursos" ? base : title === "Telas" ? base.filter((k) => k !== "component") : title === "Componentes" ? [...base, "component"] : base;
    const list = all.filter((x) => kinds.includes(E[x].kind));
    if (list.length) parts.push(h("h2", { class: "section" }, title), h("p", { class: "hint" }, hint), elementRows(list));
  }
  if (contained.length) parts.push(h("h2", { class: "section" }, "Contém"), h("p", { class: "hint" }, "Partes do sistema que este app executa."), elementRows(contained));
  for (const name of diagramsOf(id)) parts.push(h("h2", { class: "section" }, diagramTitle(name)), diagramBox(name));
  const connections = all.flatMap((x) => E[x].relations.filter((r) => r.type === "connectsTo").map((r) => ({ from: x, ...r })));
  if (connections.length) parts.push(h("h2", { class: "section" }, "Conexões"),
    h("ul", { class: "rows" }, connections.map((c) => h("li", {}, h("span", {}, link(c.from), " → ", link(c.target)), h("span", { class: "right" }, c.label ?? "")))));
  return parts;
}

function elementPage(id) {
  const el = E[id];
  if (!el) return h("div", {}, h("h1", {}, "Elemento não encontrado"), h("p", { class: "lede" }, id));
  const crumbs = ancestors(id);
  const anchor = el.anchor;
  const resolved = anchor?.resolved;
  const file = resolved?.file ?? anchor?.path;
  const line = resolved ? resolved.range.start[0] + 1 : 1;
  const parts = [
    h("p", { class: "eyebrow" }, crumbs.length ? [crumbs.map((c, i) => [i ? " › " : "", link(c)]), " › "] : null, kindOf(id)),
    h("h1", {}, el.kind === "endpoint" ? h("span", {}, h("span", { class: "method", style: "font-size: .45em; vertical-align: middle" }, el.method), el.path) : el.name),
    h("div", { class: "head" },
      statusMark(id),
      anchor && file ? h("a", { class: "open", href: editor(file, line), title: "Abrir no VS Code" }, "Abrir no editor") : null,
      anchor ? h("span", { class: "where mono" }, file ? file + (anchor.symbol ? "#" + anchor.symbol : "") : anchor.raw) : null,
      h("a", { class: "where", href: editor(el.source.file, el.source.line) }, "Declarado em " + el.source.file + ":" + el.source.line)),
    el.docs ? h("p", { class: "docs" }, el.docs) : null,
  ];
  const own = diagsOf(id);
  if (own.length) parts.push(h("h2", { class: "section" }, "Problemas"), own.map((d) => problem(groupOf(d), [d])));

  const facts = [];
  if (el.kind === "endpoint") {
    for (const p of el.params ?? []) facts.push(["Parâmetro", h("span", { class: "mono" }, p.name + ": " + typeText(p.type) + " (" + (p.in ?? "query") + ")")]);
    if (el.body) facts.push(["Corpo", typeNode(el.body)]);
    for (const r of el.responses ?? []) facts.push(["Resposta " + r.status, r.type ? typeNode(r.type) : "sem corpo"]);
    if (el.auth) facts.push(["Autenticação", el.auth.scheme + (el.auth.roles?.length ? " (" + el.auth.roles.join(", ") + ")" : "")]);
  }
  if (el.kind === "op") facts.push(["Assinatura", h("span", { class: "mono" }, signature(el))]);
  if (el.kind === "app") facts.push(...[["Tipo", el.appKind], ["Framework", el.framework], ["Pasta", el.root && h("span", { class: "mono" }, el.root)]].filter(([, v]) => v));
  if (el.kind === "job" && el.cron) facts.push(["Agenda", h("span", { class: "mono" }, el.cron)]);
  if (el.kind === "node") {
    if (el.resourceType) facts.push(["Tipo de recurso", h("span", { class: "mono" }, el.resourceType)]);
    if (el.replicas !== undefined) facts.push(["Réplicas", el.replicas]);
    for (const [k, v] of Object.entries(el.props ?? {})) facts.push([k, h("span", { class: "mono" }, JSON.stringify(v))]);
  }
  if (el.meta.owner) facts.push(["Dono", el.meta.owner]);
  if (el.meta.status && el.meta.status !== "active") facts.push(["Status", el.meta.status]);
  if (el.meta.tags.length) facts.push(["Tags", el.meta.tags.join(", ")]);
  if (facts.length) parts.push(h("dl", { class: "facts", style: "margin-top: 24px" }, facts.map(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])));

  if (el.fields?.length) parts.push(h("h2", { class: "section" }, "Campos"), h("div", { class: "table" }, h("table", {},
    h("thead", {}, h("tr", {}, h("th", {}, "Campo"), h("th", {}, "Tipo"), h("th", {}, "Detalhes"))),
    h("tbody", {}, el.fields.map((f) => h("tr", {}, h("td", { class: "mono" }, f.name), h("td", {}, typeNode(f.type)),
      h("td", { class: "mono" }, Object.entries(f.modifiers).map(([k, v]) => v.length ? k + "(" + v.join(", ") + ")" : k).join(" "))))))));
  if (el.values?.length) parts.push(h("h2", { class: "section" }, "Valores"), h("p", { class: "mono" }, el.values.join(", ")));
  if (el.flow) parts.push(h("h2", { class: "section" }, "Passos"), h("p", { class: "hint" }, "Na ordem em que acontecem."), flowList(el.flow));

  if (["context", "app", "deployment", "group", "api"].includes(el.kind)) parts.push(...containerPage(id));
  else {
    const ops = (children[id] ?? []).filter((c) => E[c].kind === "op");
    if (ops.length) parts.push(h("h2", { class: "section" }, "Operações"), elementRows(ops));
    const others = (children[id] ?? []).filter((c) => E[c].kind !== "op");
    if (others.length) parts.push(h("h2", { class: "section" }, "Contém"), elementRows(others));
    for (const name of diagramsOf(id)) parts.push(h("h2", { class: "section" }, diagramTitle(name)), diagramBox(name));
  }

  const out = el.relations.filter((r) => r.type !== "contains" || !["context", "app"].includes(el.kind));
  const inc = (incoming[id] ?? []).filter((r) => r.type !== "inLayer" || el.kind === "layer");
  const groupRel = (list, labels, pick) => {
    const m = new Map();
    for (const r of list) (m.get(r.type) ?? m.set(r.type, []).get(r.type)).push(r);
    return [...m].map(([type, rs]) => [h("dt", {}, labels[type] ?? type), h("dd", {}, rs.map((r) => h("span", {}, link(pick(r)), r.label ? h("span", { class: "where" }, " " + r.label) : null)))]);
  };
  if (out.length || inc.length) parts.push(h("h2", { class: "section" }, "Ligações"), h("p", { class: "hint" }, "Do que este elemento depende e quem depende dele."),
    h("dl", { class: "rel" }, groupRel(out, REL, (r) => r.target), groupRel(inc, REL_IN, (r) => r.from)));
  return h("div", {}, parts);
}

function flowList(flow) {
  return h("ol", { class: "flow" }, flow.map((s) => {
    switch (s.op) {
      case "step": return h("li", {}, h("strong", {}, s.name), " — ", s.target ? link(s.target, E[s.target] ? (E[E[s.target].parent]?.name ?? "") + "." + E[s.target].name : undefined) : s.emit ? h("span", {}, "emite ", link(s.emit)) : h("em", {}, s.manual));
      case "emit": return h("li", {}, "Emite ", link(s.event));
      case "if": return h("li", {}, "Se ", h("em", {}, s.condition), flowList(s.then), s.else.length ? h("div", {}, "Senão", flowList(s.else)) : null);
      case "parallel": return h("li", {}, "Em paralelo", flowList(s.body));
      case "foreach": return h("li", {}, "Para cada ", h("em", {}, s.description), flowList(s.body));
      case "wait": return h("li", {}, "Aguarda ", link(s.event), s.timeout ? " (até " + s.timeout + ")" : "");
      case "fail": return h("li", {}, "Falha ", [s.status, s.message].filter(Boolean).join(" "));
      case "return": return h("li", {}, "Retorna ", s.type ? typeNode(s.type) : "");
      default: return h("li", {}, s.op);
    }
  }));
}

function requirementsPage() {
  const keys = Object.keys(R).filter((k) => R[k].kind === "requirement");
  return h("div", {}, h("p", { class: "eyebrow" }, "Rastreabilidade"), h("h1", {}, "Requisitos"),
    h("p", { class: "lede" }, "Requisitos dos documentos e os elementos da planta que os implementam."),
    h("ul", { class: "rows", style: "margin-top: 28px" }, keys.map((k) => h("li", {}, h("span", { class: "name" }, link(k)),
      h("span", { class: "right" }, R[k].justifiedBy.length ? R[k].justifiedBy.length + " elementos" : h("span", { class: "mark warn" }, "Sem implementação"))))));
}
function requirementPage(key) {
  const r = R[key];
  if (!r) return h("div", {}, h("h1", {}, "Requisito não encontrado"), h("p", { class: "lede" }, key));
  const label = { new: "Nunca revisado", changed: "Mudou desde a revisão", reviewed: "Revisado" };
  return h("div", {},
    h("p", { class: "eyebrow" }, h("a", { href: "#/requisitos" }, "Requisitos"), " › ", r.kind === "requirement" ? "Requisito" : "Decisão"),
    h("h1", {}, r.id + " " + r.title),
    h("div", { class: "head" }, h("a", { class: "open", href: editor(r.anchor.path, r.anchor.line) }, "Abrir o documento"),
      h("span", { class: "where mono" }, r.anchor.path + ":" + r.anchor.line),
      ...Object.entries(r.attributes ?? {}).map(([k, v]) => h("span", { class: "where" }, k + ": " + v))),
    h("p", { class: "docs" }, r.text),
    h("h2", { class: "section" }, (r.kind === "requirement" ? "Implementado por" : "Fundamenta") + " (" + r.justifiedBy.length + ")"),
    r.justifiedBy.length ? h("ul", { class: "rows" }, r.justifiedBy.map((id) => h("li", {},
      // ID completo: "criar" sozinho não distingue a operação do endpoint.
      h("span", { class: "name" }, h("a", { href: href(id), class: "mono" }, id)),
      h("span", { class: "right" }, data.review[id] ? label[data.review[id]] : kindOf(id)))))
      : h("p", { class: "empty" }, "Nenhum elemento cita este requisito. Adicione justifiedBy \"" + r.id + "\" a quem o implementa."));
}

function diagramsPage(current) {
  const names = Object.keys(data.diagrams);
  if (!names.length) return h("div", {}, h("h1", {}, "Diagramas"), h("p", { class: "empty" }, "Nenhum diagrama gerado."));
  const name = current && data.diagrams[current] ? current : names.find((n) => !data.diagrams[n].error) ?? names[0];
  return h("div", {}, h("p", { class: "eyebrow" }, "Diagramas"), h("h1", {}, diagramTitle(name)),
    h("p", { class: "lede" }, "Gerados da planta a cada recarga. Também saem em arquivo com npx planta render."),
    h("nav", { class: "tabs", "aria-label": "Diagramas" }, names.map((n) => h("a", { href: "#/diagramas/" + encodeURIComponent(n), "aria-current": n === name ? "page" : undefined }, diagramTitle(n)))),
    diagramBox(name));
}

// ---------------------------------------------------------------------
//  Busca (⌘K)
// ---------------------------------------------------------------------

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const entries = [
  ...ids.map((id) => ({ href: href(id), label: E[id].kind === "endpoint" ? E[id].method + " " + E[id].path : E[id].name, where: kindOf(id) + (E[id].parent ? " em " + E[E[id].parent].name : ""), key: fold(id + " " + E[id].name + " " + kindOf(id) + " " + (E[id].path ?? "")) })),
  ...Object.keys(R).map((k) => ({ href: "#/r/" + encodeURIComponent(k), label: R[k].id + " " + R[k].title, where: R[k].kind === "requirement" ? "Requisito" : "Decisão", key: fold(R[k].id + " " + R[k].title) })),
];
const finder = document.getElementById("finder");
const input = document.getElementById("find-input");
const results = document.getElementById("find-results");
let selected = 0;
function find() {
  const words = fold(input.value).split(/\s+/).filter(Boolean);
  const found = entries.filter((e) => words.every((w) => e.key.includes(w))).slice(0, 40);
  selected = 0;
  results.replaceChildren(...(found.length ? found.map((e, i) => h("li", {}, h("a", { href: e.href, class: i === 0 ? "on" : undefined }, e.label, h("small", {}, e.where))))
    : [h("li", { class: "none" }, "Nada encontrado.")]));
}
function openFinder() { finder.hidden = false; input.value = ""; find(); input.focus(); }
function closeFinder() { finder.hidden = true; }
document.getElementById("find-open").addEventListener("click", openFinder);
finder.addEventListener("click", (e) => { if (e.target === finder || e.target.closest("a")) closeFinder(); });
input.addEventListener("input", find);
input.addEventListener("keydown", (e) => {
  const links = [...results.querySelectorAll("a")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    selected = Math.max(0, Math.min(links.length - 1, selected + (e.key === "ArrowDown" ? 1 : -1)));
    links.forEach((a, i) => a.classList.toggle("on", i === selected));
    links[selected]?.scrollIntoView({ block: "nearest" });
  }
  if (e.key === "Enter" && links[selected]) { location.hash = links[selected].getAttribute("href"); closeFinder(); }
  if (e.key === "Escape") closeFinder();
});
addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); finder.hidden ? openFinder() : closeFinder(); }
});

// ---------------------------------------------------------------------
//  Roteamento
// ---------------------------------------------------------------------

const menu = document.querySelector(".menu");
const side = document.getElementById("nav");
menu.addEventListener("click", () => { const open = !side.classList.contains("open"); side.classList.toggle("open", open); menu.setAttribute("aria-expanded", String(open)); });
side.addEventListener("click", (e) => { if (e.target.closest("a")) { side.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); } });

function route() {
  const main = document.getElementById("main");
  const hash = location.hash;
  let m;
  const page = (m = hash.match(/^#\/e\/(.+)$/)) ? elementPage(decodeURIComponent(m[1]))
    : (m = hash.match(/^#\/r\/(.+)$/)) ? requirementPage(decodeURIComponent(m[1]))
    : (m = hash.match(/^#\/(?:diagramas|v)\/(.+)$/)) ? diagramsPage(decodeURIComponent(m[1]))
    : hash === "#/diagramas" ? diagramsPage()
    : hash === "#/saude" || hash === "#/diagnosticos" ? healthPage()
    : hash === "#/requisitos" ? requirementsPage()
    : overview();
  main.replaceChildren(page);
  markCurrent();
  drawDiagrams(main);
  window.scrollTo(0, 0);
}

const pill = document.getElementById("status-pill");
pill.className = "pill " + state;
pill.textContent = state === "off" ? "Não conferida" : state === "ok" ? "Confere com o código"
  : counts.error ? (counts.error === 1 ? "1 erro" : counts.error + " erros") : pending && !counts.warning ? pending + " para revisar" : counts.warning + (counts.warning === 1 ? " aviso" : " avisos");
addEventListener("hashchange", route);
nav();
route();
`;
