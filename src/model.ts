// Fases 1–7 de ponta a ponta: texto `.planta` → modelo intermediário (IR).

import type { FileAst } from "./ast.ts";
import { buildAst } from "./build-ast.ts";
import { derive, type Derived } from "./derive.ts";
import type { Diagnostic } from "./diagnostics.ts";
import { emitIr, type EmitOptions, type IrModel } from "./ir.ts";
import { link, type Links } from "./link.ts";
import { merge, type MergedModel } from "./merge.ts";
import { parse } from "./parse.ts";
import { buildSymbols, type SymbolTable } from "./symbols.ts";

export interface Source {
  path: string;
  text: string;
}

export interface Model {
  files: FileAst[];
  merged: MergedModel;
  symbols: SymbolTable;
  links: Links;
  derived: Derived;
  ir: IrModel;
  diagnostics: Diagnostic[];
}

export function buildModel(sources: Source[], options: EmitOptions = {}): Model {
  const diagnostics: Diagnostic[] = [];
  const files: FileAst[] = [];

  for (const { path, text } of sources) {
    const parsed = parse(text, path);
    diagnostics.push(...parsed.diagnostics);
    // A árvore de um arquivo com erro de sintaxe tem nós faltando; ele fica
    // fora do modelo até ser corrigido.
    if (parsed.diagnostics.length === 0) files.push(buildAst(parsed.tree, path));
  }

  const merged = merge(files);
  diagnostics.push(...merged.diagnostics);

  const symbols = buildSymbols(merged.model);
  diagnostics.push(...symbols.diagnostics);

  const linked = link(merged.model, symbols.table);
  diagnostics.push(...linked.diagnostics);

  const derived = derive(merged.model, symbols.table, linked.links);
  diagnostics.push(...derived.diagnostics);

  const ir = emitIr(merged.model, symbols.table, linked.links, derived.derived, options);

  return {
    files,
    merged: merged.model,
    symbols: symbols.table,
    links: linked.links,
    derived: derived.derived,
    ir,
    diagnostics,
  };
}
