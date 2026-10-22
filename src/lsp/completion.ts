// Autocompletar (seção 18): âncoras (arquivos sob o `root`, depois os
// símbolos do arquivo), IDs de requisito, nomes de elementos pelo tipo aceito
// na posição e palavras-chave do bloco.

import { readdirSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import type { Token } from "antlr4ng";
import { type CompletionItem, CompletionItemKind, type Range } from "vscode-languageserver";
import { COMPONENT_KINDS } from "../ast.ts";
import { CodeParser, listSymbols } from "../code/index.ts";
import { parseMarkdown } from "../docs/markdown.ts";
import { PRIMITIVES } from "../link.ts";
import { RESOURCE_TYPES } from "../catalog/resources.ts";
import { EXTRACTORS } from "../check.ts";
import { SCHEMES } from "../validate/iac.ts";
import type { ElementSymbol } from "../symbols.ts";
import { type Block, cursorContext, scopeIds } from "./scope.ts";
import type { Workspace } from "./workspace.ts";

const COMPONENTS = [...COMPONENT_KINDS] as string[];
const TYPES = ["entity", "value", "dto", "enum", "event"];

/** Tipos aceitos depois de cada palavra-chave (tabela 8.2). */
const AFTER: Record<string, string[] | "*"> = {
  uses: [...COMPONENTS, "external", "channel"],
  calls: ["endpoint"],
  renders: ["component", "page"],
  implements: COMPONENTS,
  body: TYPES,
  returns: TYPES,
  return: TYPES,
  actor: ["actor"],
  trigger: ["endpoint", "event", "job", "actor"],
  emit: ["event"],
  wait: ["event"],
  on: ["event"],
  via: ["channel"],
  layer: ["layer"],
  runs: ["app"],
  stores: ["context", "entity"],
  carries: ["channel"],
  justifiedBy: ["requirement"],
  decidedBy: ["decision"],
  contains: "*",
  use: "*",
  of: "*",
  include: "*",
  exclude: "*",
  guard: ["guard"],
};

const KEYWORDS: Partial<Record<Block["kind"] | "top", string[]>> = {
  top: ["system", "layer", "actor", "external", "context", "app", "requirement", "decision", "deployment", "rule", "view", "use"],
  system: ["description", "owner", "version"],
  context: ["entity", "value", "dto", "enum", "aggregate", ...COMPONENTS, "api", "channel", "event", "on", "job", "process"],
  app: ["contains", "route", ...COMPONENTS],
  external: ["op"],
  component: ["op", "uses", "calls", "renders", "implements", "justifiedBy", "decidedBy"],
  api: ["endpoint"],
  endpoint: ["body", "param", "returns", "auth", "rateLimit", "justifiedBy", "decidedBy"],
  process: ["justifiedBy", "decidedBy", "actor", "trigger", "verify", "step", "emit", "if", "parallel", "foreach", "wait", "fail", "return"],
  control: ["step", "emit", "if", "parallel", "foreach", "wait", "fail", "return"],
  deployment: ["network", "zone", "cluster", "group", "region"],
  group: ["network", "zone", "cluster", "group", "region"],
  rule: ["every"],
  view: ["include", "exclude", "layout", "style", "title"],
};

const IGNORED = new Set(["node_modules", "dist", "build", ".git", ".gerado"]);

export async function complete(ws: Workspace, abs: string, text: string, offset: number): Promise<CompletionItem[]> {
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  const prefix = text.slice(lineStart, offset);
  const line = text.slice(0, lineStart).split("\n").length - 1;
  const range = (from: number): Range => ({ start: { line, character: from }, end: { line, character: prefix.length } });
  const { blocks, before } = cursorContext(text, offset);

  const anchor = /@"([^"]*)$/.exec(prefix);
  if (anchor) return anchorItems(ws, blocks, anchor[1]!, prefix.length - anchor[1]!.length, range);

  const trace = /\b(justifiedBy|decidedBy)\b[^"\n]*(?:"[^"]*"\s*,\s*)*"([^"]*)$/.exec(prefix);
  if (trace) return requirementItems(ws, trace[1]!, false, range(prefix.length - trace[2]!.length));

  const word = /[A-Za-z_][\w.]*$|$/.exec(prefix)![0];
  const governing = governingWord(before, line);
  if (governing === undefined) {
    const block = blocks.at(-1);
    const words = KEYWORDS[block?.kind ?? "top"] ?? [];
    return words.map((w) => ({ label: w, kind: CompletionItemKind.Keyword, textEdit: { range: range(prefix.length - word.length), newText: w } }));
  }

  // No nível superior, `actor X` e `layer X` declaram: não há o que completar.
  // `nome: |` num deployment: tipo de recurso do catálogo.
  const inner = blocks.at(-1)?.kind;
  if (governing === ":" && (inner === "deployment" || inner === "group")) {
    return [...Object.entries(RESOURCE_TYPES)].map(([type, t]) => ({
      label: type, kind: CompletionItemKind.TypeParameter, detail: t.label, textEdit: { range: range(prefix.length - word.length), newText: type },
    }));
  }
  const accept = blocks.length === 0 && (governing === "actor" || governing === "layer") ? undefined : acceptAfter(governing, blocks);
  if (!accept) return [];
  const items = elementItems(ws, blocks, word, accept, range);
  // Tipo de dado (campo, parâmetro, retorno), não só evento: aceita primitivos.
  if (accept === TYPES) {
    if (!word.includes(".")) for (const p of PRIMITIVES) items.push({ label: p, kind: CompletionItemKind.Keyword, detail: "tipo primitivo" });
  }
  if (governing === "justifiedBy" || governing === "decidedBy") items.push(...requirementItems(ws, governing, true, range(prefix.length - word.length)));
  return items;
}

/**
 * Palavra que decide o que se espera no cursor: a palavra-chave antes da
 * lista de nomes em curso (`uses A, B, |`), ou `:`/`=>`/`->`. `undefined`
 * quando o cursor começa uma declaração.
 */
function governingWord(before: Token[], line: number): string | undefined {
  const text = (i: number) => before[i]?.text ?? "";
  const ident = (i: number) => /^[A-Za-z_]/.test(text(i));
  const governs = (i: number) => AFTER[text(i)] !== undefined || [":", "=>", "->"].includes(text(i));
  let i = before.length - 1;
  if (i < 0) return undefined;
  if (governs(i)) return text(i);
  if (/^\d/.test(text(i)) && text(i - 1) === "returns") return "returns";
  if (text(i) === "," || text(i) === ".") {
    // Lista em curso: volta até o primeiro nome dela.
    while (i >= 0 && (text(i) === "," || text(i) === "." || (ident(i) && !governs(i)))) i--;
    return i >= 0 && governs(i) ? text(i) : undefined;
  }
  // Nome solto na mesma linha (`step persistir |`): nada a sugerir.
  if (before[i]!.line - 1 === line && ident(i)) return text(i);
  return undefined;
}

function acceptAfter(word: string, blocks: Block[]): string[] | "*" | undefined {
  const inner = blocks.at(-1)?.kind;
  if (word === ":") return inner === "process" || inner === "control" ? ["op"] : inner === "deployment" || inner === "group" ? undefined : TYPES;
  if (word === "=>") return blocks.some((b) => b.kind === "app") ? ["page", "component"] : ["op"];
  if (word === "->") return blocks.some((b) => b.kind === "deployment") ? ["node", "group"] : TYPES;
  return AFTER[word];
}

// ---------------------------------------------------------------------
//  Elementos
// ---------------------------------------------------------------------

function elementItems(ws: Workspace, blocks: Block[], word: string, accept: string[] | "*", range: (from: number) => Range): CompletionItem[] {
  const { model } = ws.analyze();
  const table = model.symbols;
  const scopes = scopeIds(blocks);
  const fits = (s: ElementSymbol) => accept === "*" || accept.includes(s.kind);
  // Um contêiner que leva a um elemento aceito também serve: `ClientesService.` → operações.
  const leads = (id: string): boolean => (table.children.get(id) ?? []).some((c) => fits(table.symbols.get(c)!) || leads(c));
  // Um escopo em volta não precisa ser oferecido como prefixo: os filhos dele já estão visíveis.
  const offer = (s: ElementSymbol) => fits(s) || (leads(s.id) && !scopes.includes(s.id));

  const dot = word.lastIndexOf(".");
  const items = new Map<string, CompletionItem>();
  const add = (s: ElementSymbol) => {
    if (items.has(s.name) || !offer(s)) return;
    items.set(s.name, {
      label: s.name,
      kind: itemKind(s.kind),
      detail: `${s.kind} ${s.id}`,
      ...(fits(s) ? {} : { commitCharacters: ["."] }),
      textEdit: { range: range(range(0).end.character - (word.length - dot - 1)), newText: s.name },
    });
  };

  if (dot >= 0) {
    const head = word.slice(0, dot);
    const base = [...scopes.map((s) => `${s}.${head}`), head].find((id) => table.symbols.has(id));
    for (const c of base ? table.children.get(base) ?? [] : []) add(table.symbols.get(c)!);
    return [...items.values()];
  }
  for (const scope of scopes) for (const c of table.children.get(scope) ?? []) add(table.symbols.get(c)!);
  for (const s of table.symbols.values()) if (!s.parent) add(s);
  return [...items.values()];
}

function requirementItems(ws: Workspace, relation: string, quote: boolean, range: Range): CompletionItem[] {
  const prefix = relation === "justifiedBy" ? "req:" : "adr:";
  return [...(ws.checked?.result.requirements.values() ?? [])]
    .filter((r) => r.key.startsWith(prefix))
    .map((r) => {
      const id = r.key.slice(prefix.length);
      return {
        label: id,
        kind: CompletionItemKind.Reference,
        detail: r.title,
        documentation: { kind: "markdown" as const, value: r.display.slice(0, 600) },
        filterText: quote ? `"${id}` : id,
        textEdit: { range, newText: quote ? `"${id}"` : id },
      };
    });
}

// ---------------------------------------------------------------------
//  Âncoras
// ---------------------------------------------------------------------

async function anchorItems(ws: Workspace, blocks: Block[], typed: string, start: number, range: (from: number) => Range): Promise<CompletionItem[]> {
  const scheme = /^([a-z][a-z0-9-]*):/.exec(typed);
  const rest = scheme ? typed.slice(scheme[0].length) : typed;
  const offset = start + (scheme ? scheme[0].length : 0);
  const root = [...blocks].reverse().find((b) => b.root !== undefined)?.root?.replace(/^\/+/, "");
  const markdown = scheme?.[1] === "md";
  if (scheme && SCHEMES[scheme[1]!]) return iacItems(ws, blocks, scheme[1]!, range(offset));
  if (scheme && !["code", "md"].includes(scheme[1]!)) return [];

  const hash = rest.indexOf("#");
  if (hash >= 0) {
    // `#Simbolo` sem caminho: o arquivo da âncora do componente em volta.
    const written = rest.slice(0, hash) || [...blocks].reverse().find((b) => b.anchor)?.anchor?.split("#")[0];
    if (!written) return [];
    const path = resolveAnchorPath(written, root);
    return symbolItems(ws, path, markdown, range(offset + hash + 1));
  }

  const dirPart = rest.slice(0, rest.lastIndexOf("/") + 1);
  const base = dirPart.startsWith("/") ? join(ws.config.projectRoot, dirPart) : join(ws.config.projectRoot, root ?? "", dirPart);
  let entries;
  try {
    entries = readdirSync(base, { withFileTypes: true });
  } catch {
    return [];
  }
  const from = offset + dirPart.length;
  return entries
    .filter((e) => !e.name.startsWith(".") && !IGNORED.has(e.name))
    .filter((e) => e.isDirectory() || (markdown ? e.name.endsWith(".md") : CodeParser.hasSymbols(e.name)))
    .map((e) => e.isDirectory()
      ? { label: `${e.name}/`, kind: CompletionItemKind.Folder, textEdit: { range: range(from), newText: `${e.name}/` }, command: { title: "", command: "editor.action.triggerSuggest" } }
      : { label: e.name, kind: CompletionItemKind.File, textEdit: { range: range(from), newText: `${e.name}#` }, command: { title: "", command: "editor.action.triggerSuggest" } });
}

/** Caminho relativo à raiz do projeto, como `parseAnchor` resolve. */
function resolveAnchorPath(written: string, root: string | undefined): string {
  if (written.startsWith("/")) return posix.normalize(written).replace(/^\/+/, "");
  return posix.normalize(root ? posix.join(root, written) : written);
}

async function symbolItems(ws: Workspace, path: string, markdown: boolean, range: Range): Promise<CompletionItem[]> {
  const text = ws.read(join(ws.config.projectRoot, path));
  if (text === undefined) return [];
  if (markdown) {
    return parseMarkdown(path, text).sections.map((s) => ({ label: s.slug, kind: CompletionItemKind.Reference, detail: s.title, textEdit: { range, newText: s.slug } }));
  }
  if (!CodeParser.hasSymbols(path)) return [];
  const file = (await ws.codeParser()).parse(path, text);
  return listSymbols(file).map((s) => ({
    label: s.name,
    kind: s.kind === "method" ? CompletionItemKind.Method : s.kind === "property" ? CompletionItemKind.Property
      : s.kind === "function" ? CompletionItemKind.Function : s.kind === "interface" ? CompletionItemKind.Interface
      : s.kind === "enum" ? CompletionItemKind.Enum : s.kind === "variable" ? CompletionItemKind.Variable : CompletionItemKind.Class,
    detail: `${s.kind} · linha ${s.range.start[0] + 1}`,
    textEdit: { range, newText: s.name },
  }));
}

/** Endereços de recursos do IaC do deployment em volta (`source terraform|cdk|k8s|compose "..."`). */
async function iacItems(ws: Workspace, blocks: Block[], scheme: string, range: Range): Promise<CompletionItem[]> {
  const spec = SCHEMES[scheme]!;
  const source = [...blocks].reverse().find((b) => b.source)?.source;
  const extractor = EXTRACTORS[spec.extractor];
  if (!source || !spec.sources.includes(source.kind) || !extractor) return [];
  const root = source.path.replace(/^\/+|\/+$/g, "");
  // Módulos locais podem estar fora da pasta do ambiente: lê a árvore do extrator (ou a fonte do deployment).
  const base = ws.config.extractors.find((e) => e.use === spec.extractor)?.root ?? root;
  const parser = await ws.codeParser();
  const abs = join(ws.config.projectRoot, base);
  let entries: string[];
  try {
    entries = statSync(abs).isFile()
      ? [abs]
      : readdirSync(abs, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && !e.parentPath.split(/[\\/]/).some((d) => IGNORED.has(d) || d === ".terraform"))
        .map((e) => join(e.parentPath, e.name));
  } catch {
    return [];
  }
  const rel = (p: string) => relative(ws.config.projectRoot, p).split(sep).join("/");
  const files = entries.filter((p) => CodeParser.handles(p)).map((p) => parser.parse(rel(p), ws.read(p) ?? ""));
  const texts = extractor.textFiles ? entries.filter((p) => extractor.textFiles!.test(rel(p))).map((p) => ({ path: rel(p), text: ws.read(p) ?? "" })) : undefined;
  const under = (file: string) => file === root || file.startsWith(`${root}/`);
  return extractor.extract(files, { use: spec.extractor, root: base }, texts)
    .filter((f) => f.kind === "iac.resource" && f.data.flavor === spec.flavor && (f.data.root === root || under(f.location.file)) && !String(f.data.type).startsWith("data."))
    .map((f) => ({
      label: String(f.data.address),
      kind: CompletionItemKind.Value,
      detail: `${f.data.type} · ${f.location.file}:${f.location.line}`,
      textEdit: { range, newText: String(f.data.address) },
    }));
}

export function itemKind(kind: string): CompletionItemKind {
  if (COMPONENTS.includes(kind)) return CompletionItemKind.Class;
  switch (kind) {
    case "context": case "app": case "system": case "external": case "deployment": case "api": return CompletionItemKind.Module;
    case "entity": case "value": case "dto": return CompletionItemKind.Struct;
    case "enum": return CompletionItemKind.Enum;
    case "event": return CompletionItemKind.Event;
    case "op": return CompletionItemKind.Method;
    case "endpoint": return CompletionItemKind.Function;
    case "field": return CompletionItemKind.Field;
    case "requirement": case "decision": return CompletionItemKind.Reference;
    default: return CompletionItemKind.Value;
  }
}
