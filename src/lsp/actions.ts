// Ações rápidas e CodeLens (seção 18).
//
// Nos `.planta`: fixar âncora inferida (PL210), corrigir âncora movida
// (PL203), adicionar a dependência real em `uses` (PL420) e criar o elemento
// de uma referência inexistente (PL110).
//
// No código: CodeLens sobre cada símbolo ancorado, "Ir para a planta" e
// "Adicionar à planta" para fatos sem elemento, com `planta suggest`.

import {
  type CodeAction, CodeActionKind, type CodeLens, type Command, type Diagnostic as LspDiagnostic,
  type Range, type TextEdit, type WorkspaceEdit,
} from "vscode-languageserver";
import { displayKey } from "../check.ts";
import { CodeParser, type CodeSymbol, listSymbols } from "../code/index.ts";
import { suggest, uncovered } from "../suggest.ts";
import { addUses, appendTopLevel, type Edit, insertInto, pinAnchor, replaceAnchor } from "./edits.ts";
import { spanRange, uri } from "./features.ts";
import type { Analysis, Workspace } from "./workspace.ts";

/** Comando do cliente que abre uma posição: `[uri, range]`. */
export const REVEAL_COMMAND = "planta.revealLocation";

function workspaceEdit(ws: Workspace, edits: Edit[]): WorkspaceEdit {
  const changes: Record<string, TextEdit[]> = {};
  for (const e of edits) {
    (changes[uri(ws.abs(e.file))] ??= []).push({
      range: { start: { line: e.start.line - 1, character: e.start.column - 1 }, end: { line: e.end.line - 1, character: e.end.column - 1 } },
      newText: e.text,
    });
  }
  return { changes };
}

function fix(ws: Workspace, title: string, edit: Edit | undefined, diagnostic: LspDiagnostic, preferred = true): CodeAction[] {
  return edit ? [{ title, kind: CodeActionKind.QuickFix, diagnostics: [diagnostic], isPreferred: preferred, edit: workspaceEdit(ws, [edit]) }] : [];
}

// ---------------------------------------------------------------------
//  Arquivos .planta
// ---------------------------------------------------------------------

/** Tipos que dá para criar só com o nome, em ordem de preferência, e onde a declaração entra. */
const CREATABLE: Record<string, "context" | "top"> = {
  service: "context", entity: "context", value: "context", dto: "context", event: "context",
  external: "top", channel: "context", actor: "top", layer: "top",
  repository: "context", gateway: "context", component: "context", page: "context",
};

export function plantaActions(ws: Workspace, abs: string, diagnostics: LspDiagnostic[]): CodeAction[] {
  const a = ws.analyze();
  if (a.stale.has(ws.rel(abs))) return [];
  const actions: CodeAction[] = [];
  for (const d of diagnostics) {
    const data = d.data as Record<string, string> | undefined;
    if (!data) continue;
    switch (d.code) {
      case "PL210":
        actions.push(...fix(ws, `Fixar âncora inferida @"${data.anchor}"`, pinAnchor(a.model, data.element!, data.anchor!), d));
        break;
      case "PL203":
        actions.push(...fix(ws, `Atualizar âncora para @"${data.anchor}"`, replaceAnchor(a.model, data.element!, data.anchor!), d));
        break;
      case "PL420": {
        const target = a.model.symbols.symbols.get(data.uses!);
        if (target) actions.push(...fix(ws, `Adicionar \`uses ${target.name}\``, addUses(a.model, a.index, a.texts, data.element!, data.uses!), d));
        break;
      }
      case "PL110":
        actions.push(...createElement(ws, a, abs, d, data.name!, data.expects!.split(" ou ")));
        break;
    }
  }
  return actions;
}

function createElement(ws: Workspace, a: Analysis, abs: string, d: LspDiagnostic, name: string, expects: string[]): CodeAction[] {
  const file = ws.rel(abs);
  const actions: CodeAction[] = [];
  const parts = name.split(".");
  const short = parts.at(-1)!;

  // `Componente.op` com o componente já declarado: a operação entra nele.
  if (expects.includes("op") && parts.length > 1) {
    const owner = resolveFrom(a, file, d.range, parts.slice(0, -1).join("."));
    const decl = owner && a.model.symbols.symbols.get(owner)?.decl;
    if (decl && "ops" in decl) {
      const edit = insertInto(a.index, a.texts, decl.name.loc, `op ${short}()`);
      actions.push(...fix(ws, `Criar \`op ${short}()\` em \`${owner}\``, edit, d));
    }
    return actions;
  }
  if (parts.length > 1) return actions;

  const context = enclosingContext(a, file, d.range);
  for (const kind of Object.keys(CREATABLE).filter((k) => expects.includes(k)).slice(0, 3)) {
    const text = `${kind} ${short}`;
    const edit = CREATABLE[kind] === "top" || !context
      ? appendTopLevel(a.texts, file, text)
      : insertInto(a.index, a.texts, context, text);
    actions.push(...fix(ws, `Criar \`${text}\``, edit, d, false));
  }
  return actions;
}

/** Nome do contexto (no arquivo) que contém a posição, pelo `loc` do nome. */
function enclosingContext(a: Analysis, file: string, range: Range) {
  const line = range.start.line + 1;
  const ast = a.model.files.find((f) => f.path === file);
  for (const decl of ast?.decls ?? []) {
    if (decl.kind !== "context") continue;
    const extent = a.index.extents.get(`${file}:${decl.name.loc.line}:${decl.name.loc.column}`);
    if (extent && extent.start.line <= line && line <= extent.end.line) return decl.name.loc;
  }
  return undefined;
}

/** Resolve um nome como o ligador faria a partir do contexto da posição. */
function resolveFrom(a: Analysis, file: string, range: Range, name: string): string | undefined {
  const context = enclosingContext(a, file, range);
  const ctxName = context && a.model.files.find((f) => f.path === file)?.decls.find((d) => d.name.loc === context)?.name.name;
  return [ctxName && `${ctxName}.${name}`, name].find((id): id is string => !!id && a.model.symbols.symbols.has(id));
}

// ---------------------------------------------------------------------
//  Arquivos de código
// ---------------------------------------------------------------------

interface Anchored {
  id: string;
  symbol: CodeSymbol;
}

/** Elementos ancorados no arquivo, com o símbolo no texto atual (o arquivo pode estar sendo editado). */
async function anchoredIn(ws: Workspace, abs: string): Promise<Anchored[]> {
  const path = ws.projectPath(abs);
  if (!CodeParser.hasSymbols(path)) return [];
  const text = ws.read(abs);
  if (text === undefined) return [];
  const a = ws.analyze();
  const verified = ws.checked?.model.ir.elements ?? {};
  const targets: { id: string; symbol: string }[] = [];
  for (const [id, el] of Object.entries(a.model.ir.elements)) {
    const anchor = verified[id]?.anchor ?? el.anchor;
    // Símbolo movido (PL203): vale onde a verificação o encontrou.
    const resolved = ws.checked?.result.resolved.get(id);
    if (resolved?.file === path) targets.push({ id, symbol: resolved.symbol.name });
    else if (anchor?.scheme === "code" && anchor.path === path && anchor.symbol) targets.push({ id, symbol: anchor.symbol });
  }
  if (targets.length === 0) return [];
  const symbols = listSymbols((await ws.codeParser()).parse(path, text));
  return targets.flatMap((t) => {
    const symbol = symbols.find((s) => s.name === t.symbol);
    return symbol ? [{ id: t.id, symbol }] : [];
  });
}

function revealCommand(ws: Workspace, a: Analysis, id: string, title: string): Command | undefined {
  const decl = a.model.symbols.symbols.get(id)?.decl;
  if (!decl) return undefined;
  const loc = decl.kind === "endpoint" && decl.implicitName ? decl.handler.loc : decl.name.loc;
  const length = decl.kind === "endpoint" && decl.implicitName ? decl.handler.name.length : decl.name.name.length;
  return { title, command: REVEAL_COMMAND, arguments: [uri(ws.abs(loc.file)), spanRange({ ...loc, length })] };
}

const LENS_STATE: Record<string, string> = { reviewed: "revisado", changed: "alterado desde a revisão", new: "nunca revisado" };

export async function codeLenses(ws: Workspace, abs: string): Promise<CodeLens[]> {
  const a = ws.analyze();
  const lenses: CodeLens[] = [];
  if (abs.endsWith(".tf")) return terraformLenses(ws, a, abs);
  for (const { id, symbol } of await anchoredIn(ws, abs)) {
    const el = a.model.ir.elements[id]!;
    const reqs = el.relations.filter((r) => r.type === "justifiedBy" || r.type === "decidedBy").map((r) => displayKey(r.target));
    const state = ws.checked?.result.reviewables.get(id)?.state;
    const title = [id, ...(reqs.length > 0 ? [reqs.join(", ")] : []), ...(state ? [LENS_STATE[state]] : [])].join(" · ");
    const command = revealCommand(ws, a, id, title);
    const line = symbol.range.start[0];
    if (command) lenses.push({ range: { start: { line, character: symbol.range.start[1] }, end: { line, character: symbol.range.start[1] } }, command });
  }
  return lenses;
}

/** Sobre cada bloco de recurso descrito num deployment: o nó da planta e o estado de revisão. */
function terraformLenses(ws: Workspace, a: Analysis, abs: string): CodeLens[] {
  const checked = ws.checked?.result;
  if (!checked) return [];
  const path = ws.projectPath(abs);
  const lenses: CodeLens[] = [];
  for (const [id, factIds] of checked.matches) {
    const fact = checked.facts.find((f) => factIds.includes(f.id) && f.kind === "iac.resource" && f.location.file === path);
    if (!fact) continue;
    const state = checked.reviewables.get(id)?.state;
    const command = revealCommand(ws, a, id, [id, String(a.model.ir.elements[id]?.resourceType ?? ""), ...(state ? [LENS_STATE[state]!] : [])].filter(Boolean).join(" · "));
    const line = (fact.location.line ?? 1) - 1;
    if (command) lenses.push({ range: { start: { line, character: 0 }, end: { line, character: 0 } }, command });
  }
  return lenses;
}

export async function codeActions(ws: Workspace, abs: string, range: Range): Promise<CodeAction[]> {
  const a = ws.analyze();
  const actions: CodeAction[] = [];
  const contains = (s: CodeSymbol) =>
    (s.range.start[0] < range.start.line || (s.range.start[0] === range.start.line && s.range.start[1] <= range.start.character))
    && (s.range.end[0] > range.start.line || (s.range.end[0] === range.start.line && s.range.end[1] >= range.start.character));

  // O símbolo ancorado mais interno sob o cursor (o método, não a classe).
  const under = (await anchoredIn(ws, abs)).filter((x) => contains(x.symbol))
    .sort((x, y) => (y.symbol.range.start[0] - x.symbol.range.start[0]) || x.symbol.name.length - y.symbol.name.length)[0];
  if (under) {
    const command = revealCommand(ws, a, under.id, `Ir para a planta: ${under.id}`);
    if (command) actions.push({ title: command.title, kind: CodeActionKind.Empty, command });
  }

  const checked = ws.checked;
  if (!checked) return actions;
  const path = ws.projectPath(abs);
  const text = ws.read(abs);
  const symbols = text !== undefined && CodeParser.hasSymbols(path) ? listSymbols((await ws.codeParser()).parse(path, text)) : [];
  const enclosing = symbols.filter(contains);
  for (const fact of uncovered(checked.result)) {
    if (fact.location.file !== path) continue;
    const line = (fact.location.line ?? 1) - 1;
    const here = line === range.start.line || enclosing.some((s) => s.name === fact.location.symbol || (s.range.start[0] <= line && line <= s.range.end[0] && s.kind === "method"));
    if (!here) continue;
    const s = suggest(fact, checked.model.ir, checked.model.derived);
    const edit = suggestionEdit(ws, a, s.container ?? s.context, s.text);
    if (edit) actions.push({ title: `Adicionar à planta: ${fact.id}`, kind: CodeActionKind.QuickFix, edit: workspaceEdit(ws, [edit]) });
  }
  return actions;
}

/** Declaração sugerida no fim do contêiner (a API do endpoint ou o contexto). */
function suggestionEdit(ws: Workspace, a: Analysis, container: string | undefined, text: string): Edit | undefined {
  if (!container) return undefined;
  const decl = a.index.occurrences.find((o) => o.kind === "decl" && o.id === container);
  if (!decl || a.stale.has(decl.file)) return undefined;
  const body = text.split("\n").filter((l) => !l.startsWith("// dentro de")).join("\n");
  return insertInto(a.index, a.texts, decl, body);
}
