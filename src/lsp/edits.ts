// Edições de texto em arquivos `.planta`, usadas pelas ações rápidas do
// editor e por `planta fmt --pin-anchors`. Só inserem ou trocam trechos: o
// resto do arquivo, inclusive a formatação escolhida pelo autor, fica igual.

import type { Model } from "../model.ts";
import { type ProjectIndex, locKey } from "./index.ts";

export interface Pos {
  /** A partir de 1. */
  line: number;
  column: number;
}

export interface Edit {
  file: string;
  start: Pos;
  end: Pos;
  text: string;
}

export function applyEdits(text: string, edits: Edit[]): string {
  const lines = text.split("\n");
  const offset = (p: Pos) => lines.slice(0, p.line - 1).reduce((n, l) => n + l.length + 1, 0) + p.column - 1;
  const sorted = [...edits].sort((a, b) => offset(b.start) - offset(a.start));
  let out = text;
  for (const e of sorted) out = out.slice(0, offset(e.start)) + e.text + out.slice(offset(e.end));
  return out;
}

const insert = (file: string, at: Pos, text: string): Edit => ({ file, start: at, end: at, text });

/** ` @"âncora"` logo depois do nome do elemento (a posição da âncora na gramática). */
export function pinAnchor(model: Model, id: string, anchor: string): Edit | undefined {
  const decl = model.symbols.symbols.get(id)?.decl;
  if (!decl || ("anchor" in decl && decl.anchor)) return undefined;
  const { loc, name } = decl.name;
  return insert(loc.file, { line: loc.line, column: loc.column + name.length }, ` @"${anchor}"`);
}

/** Troca a âncora escrita do elemento por outra. */
export function replaceAnchor(model: Model, id: string, anchor: string): Edit | undefined {
  const decl = model.symbols.symbols.get(id)?.decl;
  const own = decl && "anchor" in decl ? decl.anchor : undefined;
  if (!own) return undefined;
  const { file, line, column } = own.loc;
  return { file, start: { line, column }, end: { line, column: column + own.raw.length + 3 }, text: `@"${anchor}"` };
}

/** Nome com que `target` deve ser escrito de dentro de `from`: curto no mesmo contexto. */
export function nameFrom(model: Model, from: string, target: string): string {
  const context = (id: string) => id.split(".")[0];
  const t = model.symbols.symbols.get(target);
  return t && context(from) === context(target) && t.parent === context(target) ? t.name : target;
}

/** `uses X` no componente: no fim da lista existente, ou numa linha nova do corpo. */
export function addUses(model: Model, index: ProjectIndex, texts: Map<string, string>, id: string, target: string): Edit | undefined {
  const decl = model.symbols.symbols.get(id)?.decl;
  if (!decl || !("uses" in decl)) return undefined;
  const name = nameFrom(model, id, target);
  const last = decl.uses.at(-1);
  if (last) return insert(last.loc.file, { line: last.loc.line, column: last.loc.column + last.name.length }, `, ${name}`);
  return insertInto(index, texts, decl.name.loc, `uses ${name}`);
}

/**
 * Linhas novas no fim do bloco da declaração cujo nome está em `nameLoc`,
 * com a indentação do bloco. Sem bloco, abre um.
 */
export function insertInto(index: ProjectIndex, texts: Map<string, string>, nameLoc: { file: string; line: number; column: number }, text: string): Edit | undefined {
  const extent = index.extents.get(locKey(nameLoc));
  const lines = texts.get(nameLoc.file)?.split("\n");
  if (!extent || !lines) return undefined;
  const indent = /^\s*/.exec(lines[extent.start.line - 1] ?? "")![0];
  const inner = (prefix: string) => text.split("\n").map((l) => (l ? prefix + l : l)).join("\n");
  const closeLine = lines[extent.end.line - 1] ?? "";
  const close = { line: extent.end.line, column: extent.end.column - 1 };

  if (closeLine[close.column - 1] !== "}") {
    return insert(nameLoc.file, extent.end, ` {\n${inner(`${indent}  `)}\n${indent}}`);
  }
  // `}` sozinho na linha: as linhas novas entram antes dela.
  if (closeLine.slice(0, close.column - 1).trim() === "") {
    const closeIndent = closeLine.slice(0, close.column - 1);
    return insert(nameLoc.file, { line: close.line, column: 1 }, `${inner(`${closeIndent}  `)}\n`);
  }
  return insert(nameLoc.file, close, `\n${inner(`${indent}  `)}\n${indent}`);
}

/** Declaração nova no fim do arquivo, separada por uma linha em branco. */
export function appendTopLevel(texts: Map<string, string>, file: string, text: string): Edit | undefined {
  const content = texts.get(file);
  if (content === undefined) return undefined;
  const lines = content.split("\n");
  const end = { line: lines.length, column: lines.at(-1)!.length + 1 };
  const lead = content.endsWith("\n") ? "\n" : "\n\n";
  return insert(file, end, `${lead}${text}\n`);
}
