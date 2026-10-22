// Visualizador web (seção 13.5): uma página só, com o modelo embutido.
// `planta serve` a serve recalculada a cada recarga; `planta export-site`
// grava o mesmo HTML para publicar como site estático.

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
}

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
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <a class="brand" href="#/">${escapeHtml(title)}</a>
  <span class="muted" id="summary"></span>
  <nav><a href="#/">Visão geral</a><a href="#/diagramas">Diagramas</a><a href="#/diagnosticos" id="diag-link">Diagnósticos</a></nav>
</header>
<div class="layout">
  <aside>
    <input id="search" type="search" placeholder="Filtrar elementos…" aria-label="Filtrar elementos">
    <div id="tree"></div>
  </aside>
  <main id="main"></main>
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
  --bg: #fbfbfa; --panel: #ffffff; --text: #1d1d1f; --muted: #6b6b70; --line: #e4e4e7;
  --accent: #2f6f4e; --accent-soft: #e6f1ea; --warn: #9a6700; --warn-soft: #fff4d6;
  --error: #b42318; --error-soft: #fde8e6; --info: #2459a8; --info-soft: #e7effb;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141416; --panel: #1c1c1f; --text: #ececef; --muted: #9a9aa2; --line: #2e2e33;
    --accent: #7cc49d; --accent-soft: #1f3329; --warn: #e3b341; --warn-soft: #3a2f12;
    --error: #f47067; --error-soft: #3d1d1b; --info: #79a6f0; --info-soft: #1b2840;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--sans); }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
code, .mono { font-family: var(--mono); font-size: 0.9em; }
.top { display: flex; align-items: center; gap: 16px; padding: 10px 20px; border-bottom: 1px solid var(--line); background: var(--panel); position: sticky; top: 0; z-index: 2; flex-wrap: wrap; }
.brand { font-weight: 650; color: var(--text); font-size: 1.05em; }
.top nav { margin-left: auto; display: flex; gap: 16px; }
.muted { color: var(--muted); }
.layout { display: grid; grid-template-columns: 300px 1fr; min-height: calc(100vh - 49px); }
aside { border-right: 1px solid var(--line); padding: 12px; overflow: auto; max-height: calc(100vh - 49px); position: sticky; top: 49px; background: var(--panel); }
aside input { width: 100%; padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--text); font: inherit; margin-bottom: 10px; }
.tree-group { margin: 10px 0 4px; font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.tree ul { list-style: none; margin: 0; padding-left: 14px; }
.tree > ul { padding-left: 0; }
.tree li { margin: 1px 0; }
.tree a { display: inline-block; padding: 1px 4px; border-radius: 4px; color: var(--text); }
.tree a.active { background: var(--accent-soft); color: var(--accent); }
.tree .kind { color: var(--muted); font-size: 0.78em; margin-right: 4px; }
main { padding: 24px 32px; max-width: 1100px; min-width: 0; }
h1 { font-size: 1.5em; margin: 0 0 4px; }
h2 { font-size: 1.05em; margin: 28px 0 8px; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
.chip { font-size: 0.78em; padding: 2px 8px; border-radius: 999px; background: var(--line); color: var(--text); }
.chip.reviewed { background: var(--accent-soft); color: var(--accent); }
.chip.changed { background: var(--warn-soft); color: var(--warn); }
.chip.new { background: var(--info-soft); color: var(--info); }
table { border-collapse: collapse; width: 100%; font-size: 0.92em; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 500; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; overflow: auto; }
.diagram svg { max-width: 100%; height: auto; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
.card .n { font-size: 1.6em; font-weight: 650; }
.diag { padding: 8px 12px; border-left: 3px solid var(--line); margin: 6px 0; background: var(--panel); border-radius: 0 6px 6px 0; }
.diag.error { border-color: var(--error); } .diag.warning { border-color: var(--warn); } .diag.info { border-color: var(--info); }
.flow { list-style: none; padding-left: 18px; border-left: 2px solid var(--line); margin: 4px 0; }
.flow li { margin: 3px 0; }
pre { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px; overflow: auto; font-size: 0.85em; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  aside { position: static; max-height: 40vh; border-right: 0; border-bottom: 1px solid var(--line); }
  main { padding: 16px; }
}
`;

// Roda no navegador. Constrói o DOM com textContent: nada do modelo vira HTML.
export const VIEWER_SCRIPT = String.raw`
const data = JSON.parse(document.getElementById("data").textContent);
const E = data.ir.elements;
const ids = Object.keys(E);
const children = {};
for (const id of ids) { const p = E[id].parent; if (p) (children[p] ??= []).push(id); }
const incoming = {};
for (const id of ids) for (const r of E[id].relations) (incoming[r.target] ??= []).push({ from: id, type: r.type });

function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "class") node.className = v; else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid !== undefined && kid !== null && kid !== false) node.append(kid instanceof Node ? kid : String(kid));
  return node;
}
const R = data.ir.requirements ?? {};
const link = (id) => E[id] ? h("a", { href: "#/e/" + encodeURIComponent(id) }, E[id].name)
  : R[id] ? h("a", { href: "#/r/" + encodeURIComponent(id) }, R[id].id + " " + R[id].title)
  : h("span", { class: "mono" }, id);
const typeText = (t) => !t ? "" : t.map ? "Map<" + typeText(t.map.key) + ", " + typeText(t.map.value) + ">" + (t.optional ? "?" : "")
  : (E[t.ref]?.name ?? t.ref) + (t.list ? "[]" : "") + (t.optional ? "?" : "");
const typeNode = (t) => t && t.ref && E[t.ref] ? h("span", {}, link(t.ref), (t.list ? "[]" : "") + (t.optional ? "?" : "")) : h("span", { class: "mono" }, typeText(t));

const GROUPS = [["context", "Contextos"], ["app", "Apps"], ["deployment", "Deployments"], ["actor", "Atores"], ["external", "Externos"],
  ["layer", "Camadas"], ["requirement", "Requisitos"], ["decision", "Decisões"], ["rule", "Regras"], ["view", "Views"]];

function tree(filter) {
  const root = document.getElementById("tree");
  root.replaceChildren();
  const match = (id) => !filter || id.toLowerCase().includes(filter) || (children[id] ?? []).some(match);
  const item = (id) => {
    if (!match(id)) return null;
    const kids = (children[id] ?? []).map(item).filter(Boolean);
    return h("li", {}, h("a", { href: "#/e/" + encodeURIComponent(id), "data-id": id }, h("span", { class: "kind" }, E[id].kind), E[id].name),
      kids.length ? h("ul", {}, kids) : null);
  };
  for (const [kind, label] of GROUPS) {
    const top = ids.filter((id) => !E[id].parent && E[id].kind === kind).map(item).filter(Boolean);
    if (top.length) root.append(h("div", { class: "tree-group" }, label), h("div", { class: "tree" }, h("ul", {}, top)));
  }
  // Requisitos e decisões descobertos nos documentos (seção 14).
  for (const [kind, label] of [["requirement", "Requisitos nos documentos"], ["decision", "Decisões nos documentos"]]) {
    const keys = Object.keys(R).filter((k) => R[k].kind === kind && !E[k] && (!filter || (k + " " + R[k].title).toLowerCase().includes(filter)));
    if (keys.length) root.append(h("div", { class: "tree-group" }, label), h("div", { class: "tree" }, h("ul", {},
      keys.map((k) => h("li", {}, h("a", { href: "#/r/" + encodeURIComponent(k), "data-id": k }, h("span", { class: "kind" }, R[k].id), R[k].title))))));
  }
  markActive();
}
function markActive() {
  const current = decodeURIComponent((location.hash.match(/^#\/[er]\/(.+)$/) ?? [])[1] ?? "");
  for (const a of document.querySelectorAll(".tree a")) a.classList.toggle("active", a.dataset.id === current);
}

let mermaid;
async function drawDiagrams(container) {
  const nodes = [...container.querySelectorAll(".diagram")];
  if (!nodes.length) return;
  try {
    mermaid ??= (await import(MERMAID_URL)).default;
    mermaid.initialize({ startOnLoad: false, theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default", securityLevel: "strict" });
    for (const [i, node] of nodes.entries()) {
      const { svg } = await mermaid.render("d" + Date.now() + i, node.dataset.src);
      node.innerHTML = svg;
    }
  } catch (e) {
    for (const node of nodes) if (!node.querySelector("svg")) node.replaceChildren(h("p", { class: "muted" }, "Não foi possível desenhar (sem acesso ao Mermaid?). Texto do diagrama:"), h("pre", {}, node.dataset.src));
  }
}
const diagram = (name) => {
  const d = data.diagrams[name];
  if (!d) return null;
  if (d.error) return h("p", { class: "muted" }, d.error);
  return h("div", {}, h("div", { class: "panel diagram", "data-src": d.text }, h("p", { class: "muted" }, "Desenhando…")),
    h("p", { class: "muted" }, h("a", { href: "#/v/" + encodeURIComponent(name) }, name)));
};

function diagnosticsOf(id) {
  const el = E[id];
  return data.diagnostics.filter((d) => d.loc.file === el.source.file && d.loc.line === el.source.line);
}
function diagNode(d) {
  return h("div", { class: "diag " + d.severity }, h("strong", { class: "mono" }, d.code), " ", d.message,
    h("div", { class: "muted mono" }, d.loc.file + ":" + d.loc.line));
}

function overview() {
  const count = (k) => ids.filter((id) => E[id].kind === k).length;
  const errors = data.diagnostics.filter((d) => d.severity === "error").length;
  const states = Object.values(data.review);
  const pending = states.filter((s) => s !== "reviewed").length;
  return h("div", {},
    h("h1", {}, data.ir.system?.id ?? "Planta"),
    data.ir.system?.description ? h("p", { class: "muted" }, data.ir.system.description) : null,
    h("div", { class: "cards" },
      ...[["Contextos", count("context")], ["Apps", count("app")], ["Entidades", count("entity")], ["Endpoints", count("endpoint")],
          ["Processos", count("process")], ["Erros", errors], ...(states.length ? [["Pendentes de revisão", pending]] : [])].map(([l, n]) =>
        h("div", { class: "card" }, h("div", { class: "n" }, n), h("div", { class: "muted" }, l)))),
    ...[["c4.context", "Contexto"], ["c4.container", "Contêineres"]].flatMap(([kind, label]) => {
      const name = Object.keys(data.diagrams).find((n) => data.diagrams[n].kind === kind && !data.diagrams[n].error);
      return name ? [h("h2", {}, label), diagram(name)] : [];
    }));
}

function elementPage(id) {
  const el = E[id];
  if (!el) return h("p", {}, "Elemento não encontrado: ", h("code", {}, id));
  const state = data.review[id];
  const anchor = el.anchor;
  const resolved = anchor?.resolved;
  const file = resolved?.file ?? anchor?.path;
  const line = resolved ? resolved.range.start[0] + 1 : 1;
  const parts = [
    h("p", { class: "muted mono" }, id),
    h("h1", {}, el.name),
    h("div", { class: "chips" },
      h("span", { class: "chip" }, el.kind),
      el.meta.status !== "active" ? h("span", { class: "chip" }, el.meta.status) : null,
      el.meta.owner ? h("span", { class: "chip" }, "dono: " + el.meta.owner) : null,
      ...el.meta.tags.map((t) => h("span", { class: "chip" }, "#" + t)),
      state ? h("span", { class: "chip " + state }, { new: "nunca revisado", changed: "alterado desde a revisão", reviewed: "revisado" }[state]) : null),
    el.docs ? h("p", {}, el.docs) : null,
  ];
  if (anchor) {
    parts.push(h("p", {}, "Código: ", file
      ? h("a", { href: "vscode://file/" + data.projectRoot + "/" + file + ":" + line, class: "mono" }, file + (anchor.symbol ? "#" + anchor.symbol : ""))
      : h("span", { class: "mono" }, anchor.raw), anchor.inherited ? h("span", { class: "muted" }, " (herdada)") : null));
  }
  parts.push(h("p", { class: "muted" }, "Declarado em ", h("span", { class: "mono" }, el.source.file + ":" + el.source.line)));

  if (el.kind === "endpoint") parts.push(h("p", { class: "mono" }, el.method + " " + (el.path ?? el.operation)));
  if (el.fields?.length) parts.push(h("h2", {}, "Campos"), h("table", {}, h("tr", {}, h("th", {}, "Nome"), h("th", {}, "Tipo"), h("th", {}, "Modificadores")),
    el.fields.map((f) => h("tr", {}, h("td", { class: "mono" }, f.name), h("td", {}, typeNode(f.type)),
      h("td", { class: "mono" }, Object.entries(f.modifiers).map(([k, v]) => v.length ? k + "(" + v.join(", ") + ")" : k).join(" "))))));
  if (el.values?.length) parts.push(h("h2", {}, "Valores"), h("p", { class: "mono" }, el.values.join(", ")));
  if (el.kind === "op") parts.push(h("p", { class: "mono" }, el.name + "(" + el.params.map((p) => p.name + ": " + typeText(p.type)).join(", ") + ")" + (el.returns ? " -> " + typeText(el.returns) : "")));
  if (el.flow) parts.push(h("h2", {}, "Fluxo"), flowList(el.flow));

  const kids = children[id] ?? [];
  if (kids.length) parts.push(h("h2", {}, "Contém"), h("table", {}, kids.map((k) => h("tr", {}, h("td", { class: "muted" }, E[k].kind), h("td", {}, link(k)), h("td", { class: "muted" }, E[k].docs?.split("\n")[0] ?? "")))));
  const rels = el.relations;
  if (rels.length) parts.push(h("h2", {}, "Relações"), h("table", {}, rels.map((r) => h("tr", {}, h("td", { class: "muted" }, r.type), h("td", {}, link(r.target)), h("td", { class: "muted" }, r.label ?? "")))));
  const inc = incoming[id] ?? [];
  if (inc.length) parts.push(h("h2", {}, "Usado por"), h("table", {}, inc.map((r) => h("tr", {}, h("td", { class: "muted" }, r.type), h("td", {}, link(r.from))))));

  const diags = diagnosticsOf(id);
  if (diags.length) parts.push(h("h2", {}, "Diagnósticos"), diags.map(diagNode));
  const own = Object.entries(data.diagrams).filter(([, d]) => d.of === id).map(([n]) => n);
  for (const name of own) parts.push(h("h2", {}, "Diagrama " + data.diagrams[name].kind), diagram(name));
  return h("div", {}, parts);
}

function flowList(flow) {
  return h("ul", { class: "flow" }, flow.map((s) => {
    switch (s.op) {
      case "step": return h("li", {}, h("strong", {}, s.name), " → ", s.target ? link(s.target) : s.emit ? h("span", {}, "emite ", link(s.emit)) : h("em", {}, s.manual));
      case "emit": return h("li", {}, "emite ", link(s.event));
      case "if": return h("li", {}, "se ", h("em", {}, s.condition), flowList(s.then), s.else.length ? h("div", {}, "senão", flowList(s.else)) : null);
      case "parallel": return h("li", {}, "em paralelo", flowList(s.body));
      case "foreach": return h("li", {}, "para cada ", h("em", {}, s.description), flowList(s.body));
      case "wait": return h("li", {}, "aguarda ", link(s.event), s.timeout ? " (timeout " + s.timeout + ")" : "");
      case "fail": return h("li", {}, "falha ", [s.status, s.message].filter(Boolean).join(" "));
      case "return": return h("li", {}, "retorna ", s.type ? typeNode(s.type) : "");
      default: return h("li", {}, s.op);
    }
  }));
}

function requirementPage(key) {
  const r = R[key];
  if (!r) return h("p", {}, "Requisito não encontrado: ", h("code", {}, key));
  const state = (id) => data.review[id];
  return h("div", {},
    h("p", { class: "muted mono" }, key),
    h("h1", {}, r.id + " " + r.title),
    h("div", { class: "chips" }, h("span", { class: "chip" }, r.kind === "requirement" ? "requisito" : "decisão"),
      ...Object.entries(r.attributes ?? {}).map(([k, v]) => h("span", { class: "chip" }, k + ": " + v)),
      r.justifiedBy.length === 0 ? h("span", { class: "chip changed" }, "sem implementação") : null),
    h("p", {}, "Documento: ", h("a", { href: "vscode://file/" + data.projectRoot + "/" + r.anchor.path + ":" + r.anchor.line, class: "mono" }, r.anchor.path + ":" + r.anchor.line)),
    h("div", { class: "panel", style: "white-space: pre-wrap" }, r.text),
    h("h2", {}, (r.kind === "requirement" ? "Justifica" : "Fundamenta") + " (" + r.justifiedBy.length + ")"),
    r.justifiedBy.length ? h("table", {}, r.justifiedBy.map((id) => h("tr", {}, h("td", { class: "muted" }, E[id]?.kind ?? ""),
      // ID completo: "criar" sozinho não distingue a operação do endpoint.
      h("td", {}, h("a", { href: "#/e/" + encodeURIComponent(id), class: "mono" }, id)),
      h("td", {}, state(id) ? h("span", { class: "chip " + state(id) }, { new: "nunca revisado", changed: "alterado", reviewed: "revisado" }[state(id)]) : null))))
      : h("p", { class: "muted" }, "Nenhum elemento cita este requisito."));
}

function diagramsPage() {
  return h("div", {}, h("h1", {}, "Diagramas"), h("table", {},
    Object.entries(data.diagrams).map(([name, d]) => h("tr", {}, h("td", {}, h("a", { href: "#/v/" + encodeURIComponent(name) }, name)),
      h("td", { class: "muted" }, d.kind), h("td", {}, d.of ? link(d.of) : ""), h("td", { class: "muted" }, d.error ?? "")))));
}
function viewPage(name) {
  const d = data.diagrams[name];
  if (!d) return h("p", {}, "Diagrama não encontrado.");
  return h("div", {}, h("h1", {}, name), h("p", { class: "muted" }, d.kind, d.of ? [" de ", link(d.of)] : ""), diagram(name),
    d.text ? h("details", {}, h("summary", { class: "muted" }, "Texto Mermaid"), h("pre", {}, d.text)) : null);
}
function diagnosticsPage() {
  if (!data.diagnostics.length) return h("div", {}, h("h1", {}, "Diagnósticos"), h("p", { class: "muted" }, "Nenhum diagnóstico."));
  return h("div", {}, h("h1", {}, "Diagnósticos"), data.diagnostics.map(diagNode));
}

function route() {
  const main = document.getElementById("main");
  const hash = location.hash;
  let m;
  const page = (m = hash.match(/^#\/e\/(.+)$/)) ? elementPage(decodeURIComponent(m[1]))
    : (m = hash.match(/^#\/r\/(.+)$/)) ? requirementPage(decodeURIComponent(m[1]))
    : (m = hash.match(/^#\/v\/(.+)$/)) ? viewPage(decodeURIComponent(m[1]))
    : hash === "#/diagramas" ? diagramsPage()
    : hash === "#/diagnosticos" ? diagnosticsPage()
    : overview();
  main.replaceChildren(page);
  markActive();
  drawDiagrams(main);
  window.scrollTo(0, 0);
}

const errors = data.diagnostics.filter((d) => d.severity === "error").length;
document.getElementById("summary").textContent = ids.length + " elementos · " + data.diagnostics.length + " diagnósticos";
if (errors) document.getElementById("diag-link").textContent = "Diagnósticos (" + errors + " erros)";
document.getElementById("search").addEventListener("input", (e) => tree(e.target.value.trim().toLowerCase()));
addEventListener("hashchange", route);
tree("");
route();
`;
