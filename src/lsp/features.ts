// Navegação nos arquivos `.planta` (seção 18): hover, ir para definição,
// referências, renomear, contorno e realce semântico.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type DocumentSymbol, type Hover, type Location, type Position, type Range, SymbolKind,
  type SymbolInformation, type TextEdit, type WorkspaceEdit,
} from "vscode-languageserver";
import { COMPONENT_KINDS } from "../ast.ts";
import { displayKey } from "../check.ts";
import { CodeParser, findSymbol } from "../code/index.ts";
import { parseMarkdown } from "../docs/markdown.ts";
import { lockPath, serialize } from "../lock.ts";
import { type Occurrence, occurrenceAt, type Span, locKey } from "./index.ts";
import type { Analysis, Workspace } from "./workspace.ts";

export function uri(abs: string): string {
  return pathToFileURL(abs).href;
}

export function spanRange(s: Span): Range {
  return { start: { line: s.line - 1, character: s.column - 1 }, end: { line: s.line - 1, character: s.column - 1 + s.length } };
}

function at(ws: Workspace, abs: string, pos: Position): { a: Analysis; o: Occurrence | undefined } {
  const a = ws.analyze();
  const file = ws.rel(abs);
  // Arquivo com erro de sintaxe: as posições do modelo são da última versão válida.
  if (a.stale.has(file)) return { a, o: undefined };
  return { a, o: occurrenceAt(a.index, file, pos.line + 1, pos.character + 1) };
}

/** Elemento sob o cursor: declaração, referência ou âncora. */
function elementAt(o: Occurrence | undefined): string | undefined {
  return o && o.kind !== "trace" ? o.id : undefined;
}

// ---------------------------------------------------------------------
//  Hover
// ---------------------------------------------------------------------

const STATE: Record<string, string> = {
  reviewed: "✅ revisado",
  changed: "✏️ alterado desde a revisão",
  new: "🆕 nunca revisado",
};

export function hover(ws: Workspace, abs: string, pos: Position): Hover | null {
  const { a, o } = at(ws, abs, pos);
  if (!o) return null;
  const value = o.kind === "trace" ? requirementMarkdown(ws, o.key) : elementMarkdown(ws, a, o.id, o.kind === "anchor");
  return value ? { contents: { kind: "markdown", value }, range: spanRange(o) } : null;
}

export function elementMarkdown(ws: Workspace, a: Analysis, id: string, focusAnchor = false): string | undefined {
  // O IR verificado tem âncoras inferidas e o estado de revisão; o atual, o texto em edição.
  const el = a.model.ir.elements[id];
  if (!el) return undefined;
  const checked = ws.checked?.result;
  const out = [`**${el.kind}** \`${id}\``];
  if (el.docs) out.push("", el.docs);

  const facts: string[] = [];
  if (el.meta.owner) facts.push(`dono: ${el.meta.owner}`);
  if (el.meta.status !== "active") facts.push(`status: ${el.meta.status}`);
  if (el.meta.tags.length > 0) facts.push(`tags: ${el.meta.tags.join(", ")}`);
  const layer = a.model.derived.layers.get(id);
  if (layer) facts.push(`camada: ${layer}`);
  if (el.kind === "endpoint") facts.unshift(`${String(el.method)} ${String(el.path)}`);
  if (facts.length > 0) out.push("", facts.join(" · "));

  const anchor = ws.checked?.model.ir.elements[id]?.anchor ?? el.anchor;
  const resolved = checked?.resolved.get(id);
  if (anchor?.scheme === "code" && anchor.path) {
    const line = resolved?.symbol.range.start[0];
    const target = resolved?.file ?? anchor.path;
    const link = `${uri(join(ws.config.projectRoot, target))}${line !== undefined ? `#L${line + 1}` : ""}`;
    out.push("", `código: [${target}${anchor.symbol ? `#${resolved?.symbol.name ?? anchor.symbol}` : ""}](${link})${anchor.inferred ? " (inferida)" : ""}${anchor.inherited ? " (herdada)" : ""}`);
  } else if (anchor) {
    out.push("", `âncora: \`${anchor.raw}\``);
  }

  const review = checked?.reviewables.get(id);
  if (review) {
    const what = [review.signatureChanged && "assinatura", review.bodyChanged && "corpo", review.requirementsChanged.length > 0 && "requisito"].filter(Boolean);
    out.push("", `${STATE[review.state]}${review.state === "changed" && what.length > 0 ? ` (${what.join(", ")})` : ""}`);
    if (focusAnchor && review.signatureText) out.push("", "```ts", review.signatureText, "```");
  }

  const traced = el.relations.filter((r) => r.type === "justifiedBy" || r.type === "decidedBy");
  for (const r of traced) out.push("", requirementMarkdown(ws, r.target, true) ?? `**${displayKey(r.target)}** (não encontrado)`);
  return out.join("\n");
}

function requirementMarkdown(ws: Workspace, key: string, short = false): string | undefined {
  const req = ws.checked?.result.requirements.get(key);
  if (!req) return short ? undefined : `**${displayKey(key)}**: ainda não encontrado (salve para verificar)`;
  const text = req.display.length > 500 ? `${req.display.slice(0, 500)}…` : req.display;
  const head = `**${displayKey(req.key)}** ${req.title}${req.attributes.status === "superseded" ? " (substituída)" : ""}`;
  if (short) return `${head}\n\n> ${text.replace(/\n/g, "\n> ")}`;
  return [head, "", text, "", `${req.file}:${req.line} · justificado por ${req.justifiedBy.length} elemento(s)`].join("\n");
}

// ---------------------------------------------------------------------
//  Definição e referências
// ---------------------------------------------------------------------

export async function definition(ws: Workspace, abs: string, pos: Position): Promise<Location[]> {
  const { a, o } = at(ws, abs, pos);
  if (!o) return [];
  if (o.kind === "trace") {
    const req = ws.checked?.result.requirements.get(o.key);
    return req ? [location(join(ws.config.projectRoot, req.file), req.line - 1)] : [];
  }
  if (o.kind === "anchor") {
    const code = await anchorLocation(ws, a, o.id);
    return code ? [code] : [];
  }
  return declarations(ws, a, o.id);
}

function location(abs: string, line: number, character = 0, endLine = line, endCharacter = character): Location {
  return { uri: uri(abs), range: { start: { line, character }, end: { line: endLine, character: endCharacter } } };
}

export function declarations(ws: Workspace, a: Analysis, id: string): Location[] {
  return a.index.occurrences.filter((d) => d.kind === "decl" && d.id === id).map((d) => ({ uri: uri(ws.abs(d.file)), range: spanRange(d) }));
}

/** Código para onde a âncora aponta, resolvido na hora (o arquivo pode estar aberto e alterado). */
export async function anchorLocation(ws: Workspace, a: Analysis, id: string): Promise<Location | undefined> {
  const anchor = ws.checked?.model.ir.elements[id]?.anchor ?? a.model.derived.anchors.get(id);
  if (anchor?.scheme === "tf") {
    // O bloco do recurso, como a verificação o encontrou.
    const factId = ws.checked?.result.matches.get(id)?.find((f) => f.startsWith("iac.resource:"));
    const fact = factId ? ws.checked!.result.facts.find((f) => f.id === factId) : undefined;
    return fact ? location(join(ws.config.projectRoot, fact.location.file), (fact.location.line ?? 1) - 1) : undefined;
  }
  if (!anchor?.path) return undefined;
  const abs = join(ws.config.projectRoot, anchor.path);
  const text = ws.read(abs);
  if (text === undefined) return undefined;
  if (anchor.scheme === "md") {
    const section = anchor.symbol ? parseMarkdown(anchor.path, text).sections.find((s) => s.slug === anchor.symbol) : undefined;
    return location(abs, (section?.line ?? 1) - 1);
  }
  if (anchor.scheme !== "code" || !anchor.symbol || !CodeParser.hasSymbols(anchor.path)) return location(abs, 0);
  const sym = findSymbol((await ws.codeParser()).parse(anchor.path, text), anchor.symbol)[0];
  return sym ? location(abs, sym.range.start[0], sym.range.start[1], sym.range.end[0], sym.range.end[1]) : location(abs, 0);
}

export function references(ws: Workspace, abs: string, pos: Position, includeDeclaration: boolean): Location[] {
  const { a, o } = at(ws, abs, pos);
  if (!o) return [];
  const matches = o.kind === "trace"
    ? a.index.occurrences.filter((x) => x.kind === "trace" && x.key === o.key)
    : a.index.occurrences.filter((x) => (x.kind === "ref" || (includeDeclaration && x.kind === "decl")) && x.id === o.id);
  return matches.map((x) => ({ uri: uri(ws.abs(x.file)), range: spanRange(x) }));
}

// ---------------------------------------------------------------------
//  Renomear
// ---------------------------------------------------------------------

export class RenameError extends Error {}

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Trecho renomeável sob o cursor: o nome do elemento, não o caminho qualificado inteiro. */
export function prepareRename(ws: Workspace, abs: string, pos: Position): { range: Range; placeholder: string } | null {
  const { a, o } = at(ws, abs, pos);
  if (!o || (o.kind !== "decl" && o.kind !== "ref")) return null;
  const name = a.model.symbols.symbols.get(o.id)?.name;
  if (!name || a.texts.get(o.file)?.split("\n")[o.line - 1]?.slice(o.column - 1, o.column - 1 + o.length) !== name) return null;
  return { range: spanRange(o), placeholder: name };
}

/**
 * Renomeia o elemento em todos os `.planta` (não no código). Endpoints sem
 * nome herdam o da operação, então mudam junto; o histórico de revisão no
 * lock acompanha os IDs novos, porque o código revisado é o mesmo.
 */
export function rename(ws: Workspace, abs: string, pos: Position, newName: string): WorkspaceEdit | null {
  const { a, o } = at(ws, abs, pos);
  const id = elementAt(o);
  if (!id || o?.kind === "anchor") return null;
  if (!NAME.test(newName)) throw new RenameError(`nome inválido: ${newName}`);
  const table = a.model.symbols.symbols;
  const symbol = table.get(id)!;
  const renamed = (old: string) => (symbol.parent ? `${symbol.parent}.${newName}` : newName) + old.slice(id.length);
  if (newName === symbol.name) return null;
  if (table.has(renamed(id))) throw new RenameError(`\`${renamed(id)}\` já existe`);

  // Endpoints cujo nome implícito vem desta operação.
  const implicit = [...table.values()].filter((s) => s.decl.kind === "endpoint" && s.decl.implicitName
    && a.model.links.get(s.decl.handler)?.kind === "element" && (a.model.links.get(s.decl.handler) as { id: string }).id === id);
  const targets = new Map<string, string>([[id, symbol.name], ...implicit.map((s) => [s.id, s.name] as [string, string])]);

  const changes: Record<string, TextEdit[]> = {};
  for (const x of a.index.occurrences) {
    if ((x.kind !== "decl" && x.kind !== "ref") || !targets.has(x.id)) continue;
    const text = a.texts.get(x.file)?.split("\n")[x.line - 1]?.slice(x.column - 1, x.column - 1 + x.length);
    // Alias de `use ... as X` aponta para o elemento mas não tem o nome dele.
    if (text !== targets.get(x.id)) continue;
    (changes[uri(ws.abs(x.file))] ??= []).push({ range: spanRange(x), newText: newName });
  }

  const lockEdit = renameInLock(ws, [id, ...implicit.map((s) => s.id)], (old) => {
    const base = [id, ...implicit.map((s) => s.id)].find((t) => old === t || old.startsWith(`${t}.`))!;
    const endpoint = implicit.find((s) => s.id === base);
    return endpoint ? `${endpoint.parent}.${newName}${old.slice(base.length)}` : renamed(old);
  });
  if (lockEdit) changes[lockEdit.uri] = [lockEdit.edit];
  return { changes };
}

function renameInLock(ws: Workspace, ids: string[], to: (old: string) => string): { uri: string; edit: TextEdit } | undefined {
  const affected = (key: string) => ids.some((id) => key === id || key.startsWith(`${id}.`));
  const keys = [...ws.lock.elements.keys()];
  if (!keys.some(affected)) return undefined;
  const elements = new Map([...ws.lock.elements].map(([k, v]) => [affected(k) ? to(k) : k, v]));
  const file = lockPath(ws.dir);
  const old = ws.read(file) ?? "";
  const lines = old.split("\n");
  return {
    uri: uri(file),
    edit: { range: { start: { line: 0, character: 0 }, end: { line: lines.length - 1, character: lines.at(-1)!.length } }, newText: serialize({ elements }) },
  };
}

// ---------------------------------------------------------------------
//  Contorno, símbolos do workspace e realce
// ---------------------------------------------------------------------

export function documentSymbols(ws: Workspace, abs: string): DocumentSymbol[] {
  const a = ws.analyze();
  const file = ws.rel(abs);
  if (a.stale.has(file)) return [];
  const table = a.model.symbols.symbols;
  const nodes = new Map<string, DocumentSymbol>();
  const decls = a.index.occurrences.filter((o): o is Extract<Occurrence, { kind: "decl" }> => o.kind === "decl" && o.file === file);
  for (const d of decls) {
    const s = table.get(d.id)!;
    const extent = a.index.extents.get(locKey(d));
    const selection = spanRange(d);
    const range = extent
      ? { start: { line: extent.start.line - 1, character: extent.start.column - 1 }, end: { line: extent.end.line - 1, character: extent.end.column - 1 } }
      : selection;
    nodes.set(d.id, { name: s.name, detail: s.kind, kind: symbolKind(s.kind), range, selectionRange: selection, children: [] });
  }
  // Endpoints sem nome: o nome implícito, na posição do handler.
  for (const s of table.values()) {
    if (s.decl.kind !== "endpoint" || !s.decl.implicitName || s.decl.loc.file !== file) continue;
    const h = s.decl.handler.loc;
    const extent = a.index.extents.get(locKey(h));
    const selection = spanRange({ ...h, length: s.decl.handler.name.length });
    nodes.set(s.id, {
      name: s.name, detail: `${s.decl.method} ${s.decl.path}`, kind: SymbolKind.Function, selectionRange: selection, children: [],
      range: extent ? { start: { line: extent.start.line - 1, character: extent.start.column - 1 }, end: { line: extent.end.line - 1, character: extent.end.column - 1 } } : selection,
    });
  }

  const roots: DocumentSymbol[] = [];
  for (const [id, node] of nodes) {
    let parent = table.get(id)?.parent;
    while (parent && !nodes.has(parent)) parent = table.get(parent)?.parent;
    (parent ? nodes.get(parent)!.children! : roots).push(node);
  }
  const order = (list: DocumentSymbol[]) => {
    list.sort((x, y) => x.range.start.line - y.range.start.line || x.range.start.character - y.range.start.character);
    for (const n of list) order(n.children!);
  };
  order(roots);
  return roots;
}

export function workspaceSymbols(ws: Workspace, query: string): SymbolInformation[] {
  const a = ws.analyze();
  const q = query.toLowerCase();
  return a.index.occurrences
    .filter((o) => o.kind === "decl" && o.id.toLowerCase().includes(q))
    .slice(0, 200)
    .map((o) => {
      const s = a.model.symbols.symbols.get((o as { id: string }).id)!;
      return { name: s.name, kind: symbolKind(s.kind), containerName: s.parent ?? "", location: { uri: uri(ws.abs(o.file)), range: spanRange(o) } };
    });
}

function symbolKind(kind: string): SymbolKind {
  if ((COMPONENT_KINDS as readonly string[]).includes(kind)) return SymbolKind.Class;
  switch (kind) {
    case "context": case "app": case "external": case "deployment": return SymbolKind.Namespace;
    case "system": return SymbolKind.Package;
    case "api": return SymbolKind.Module;
    case "entity": case "value": case "dto": return SymbolKind.Struct;
    case "enum": return SymbolKind.Enum;
    case "event": return SymbolKind.Event;
    case "op": return SymbolKind.Method;
    case "endpoint": case "process": case "job": return SymbolKind.Function;
    case "field": return SymbolKind.Field;
    case "step": return SymbolKind.EnumMember;
    case "layer": case "actor": return SymbolKind.TypeParameter;
    default: return SymbolKind.Object;
  }
}

export const SEMANTIC_LEGEND = {
  tokenTypes: ["namespace", "class", "struct", "enum", "interface", "event", "method", "function", "property", "type", "enumMember", "variable"],
  tokenModifiers: ["declaration"],
};

function semanticType(kind: string): number {
  const t = (name: string) => SEMANTIC_LEGEND.tokenTypes.indexOf(name);
  if ((COMPONENT_KINDS as readonly string[]).includes(kind)) return t("class");
  switch (kind) {
    case "context": case "app": case "external": case "deployment": case "system": case "api": return t("namespace");
    case "entity": case "value": case "dto": return t("struct");
    case "enum": return t("enum");
    case "event": return t("event");
    case "channel": return t("interface");
    case "op": return t("method");
    case "endpoint": case "process": case "job": return t("function");
    case "field": return t("property");
    case "step": return t("enumMember");
    case "layer": case "actor": case "aggregate": return t("type");
    default: return t("variable");
  }
}

/** Nomes de elementos, pelo tipo do elemento: o TextMate não sabe se `Cliente` é entidade ou ator. */
export function semanticTokens(ws: Workspace, abs: string): number[] {
  const a = ws.analyze();
  const file = ws.rel(abs);
  if (a.stale.has(file)) return [];
  const data: number[] = [];
  let line = 0;
  let char = 0;
  let lastEnd = { line: -1, character: -1 };
  for (const o of a.index.byFile.get(file) ?? []) {
    if (o.kind !== "decl" && o.kind !== "ref") continue;
    const l = o.line - 1;
    const c = o.column - 1;
    if (l === lastEnd.line && c < lastEnd.character) continue; // sem sobreposição
    const kind = a.model.symbols.symbols.get(o.id)?.kind;
    if (!kind) continue;
    data.push(l - line, l === line ? c - char : c, o.length, semanticType(kind), o.kind === "decl" ? 1 : 0);
    line = l;
    char = c;
    lastEnd = { line: l, character: c + o.length };
  }
  return data;
}
