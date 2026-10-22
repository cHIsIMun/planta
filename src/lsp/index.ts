// Índice de posições para o editor: onde cada elemento é declarado e
// referenciado, onde estão as âncoras e os IDs de requisito, e a extensão de
// cada declaração. A AST guarda só o início de cada nó; o fim vem da árvore
// sintática.

import { ParserRuleContext, type ParseTree } from "antlr4ng";
import type * as A from "../ast.ts";
import * as P from "../generated/PlantaParser.js";
import type { Model } from "../model.ts";
import { parse } from "../parse.ts";

/** Trecho de uma linha. Linha e coluna começam em 1, como nos diagnósticos. */
export interface Span {
  file: string;
  line: number;
  column: number;
  length: number;
}

export type Occurrence =
  | (Span & { kind: "decl"; id: string })
  /** Um segmento de um nome qualificado: em `Vendas.Api.criar`, `Api` aponta para `Vendas.Api`. */
  | (Span & { kind: "ref"; id: string; ref: A.Ref; segment: number })
  | (Span & { kind: "anchor"; id: string; anchor: A.Anchor })
  /** `"REQ-001"` em `justifiedBy`/`decidedBy`, com as aspas. */
  | (Span & { kind: "trace"; key: string; relation: A.TraceClause["relation"] });

export interface Extent {
  start: { line: number; column: number };
  /** Coluna logo depois do último caractere. */
  end: { line: number; column: number };
}

export interface ProjectIndex {
  occurrences: Occurrence[];
  /** Ocorrências por arquivo, em ordem de posição. */
  byFile: Map<string, Occurrence[]>;
  /** Extensão da declaração cujo nome começa em `arquivo:linha:coluna`. */
  extents: Map<string, Extent>;
}

export function locKey(loc: { file: string; line: number; column: number }): string {
  return `${loc.file}:${loc.line}:${loc.column}`;
}

export function buildIndex(model: Model, texts: Map<string, string>): ProjectIndex {
  const occurrences: Occurrence[] = [];
  const lines = new Map([...texts].map(([f, t]) => [f, t.split("\n")]));
  const textAt = (s: Span) => lines.get(s.file)?.[s.line - 1]?.slice(s.column - 1, s.column - 1 + s.length);

  // Declarações. Um contexto mesclado tem um símbolo só, mas um nome em cada arquivo.
  for (const symbol of model.symbols.symbols.values()) {
    const decl = symbol.decl;
    if (decl.kind === "endpoint" && decl.implicitName) continue;
    occurrences.push({ kind: "decl", id: symbol.id, ...span(decl.name.loc, decl.name.name.length) });
    if ("anchor" in decl && decl.anchor) {
      occurrences.push({ kind: "anchor", id: symbol.id, anchor: decl.anchor, ...span(decl.anchor.loc, decl.anchor.raw.length + 3) });
    }
  }
  for (const file of model.files) {
    for (const decl of file.decls) {
      const first = model.symbols.symbols.get(decl.name.name)?.decl;
      if (decl.kind === "context" && first && first.name !== decl.name && first.name.loc !== decl.name.loc) {
        occurrences.push({ kind: "decl", id: decl.name.name, ...span(decl.name.loc, decl.name.name.length) });
      }
    }
  }

  // Referências, segmento a segmento. O segmento `i` de `n` aponta para o
  // prefixo correspondente do ID resolvido, o que vale também para `use` com alias.
  for (const [ref, resolution] of model.links) {
    if (resolution.kind !== "element") continue;
    const segments = ref.name.split(".");
    const target = resolution.id.split(".");
    let column = ref.loc.column;
    segments.forEach((segment, i) => {
      const id = target.slice(0, target.length - segments.length + 1 + i).join(".");
      const s = { file: ref.loc.file, line: ref.loc.line, column, length: segment.length };
      if (id && textAt(s) === segment) occurrences.push({ kind: "ref", id, ref, segment: i, ...s });
      column += segment.length + 1;
    });
  }

  // IDs de requisito em string.
  walk(model.files, (node) => {
    const clause = node as Partial<A.TraceClause>;
    if ((clause.relation !== "justifiedBy" && clause.relation !== "decidedBy") || !Array.isArray(clause.refs)) return;
    for (const r of clause.refs) {
      if (r.kind !== "id") continue;
      const key = `${clause.relation === "justifiedBy" ? "req" : "adr"}:${r.id}`;
      occurrences.push({ kind: "trace", key, relation: clause.relation, ...span(r.loc, r.id.length + 2) });
    }
  });

  const byFile = new Map<string, Occurrence[]>();
  for (const o of occurrences) byFile.set(o.file, [...(byFile.get(o.file) ?? []), o]);
  for (const list of byFile.values()) list.sort((a, b) => a.line - b.line || a.column - b.column);

  const extents = new Map<string, Extent>();
  for (const file of model.files) {
    const text = texts.get(file.path);
    if (text !== undefined) collectExtents(parse(text, file.path).tree, file.path, extents);
  }
  return { occurrences, byFile, extents };
}

function span(loc: A.Loc, length: number): Span {
  return { file: loc.file, line: loc.line, column: loc.column, length };
}

/** Percorre todos os objetos da AST, sem entrar em posições. */
function walk(node: unknown, visit: (node: object) => void, seen = new Set<object>()): void {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  visit(node);
  for (const [key, value] of Object.entries(node)) if (key !== "loc") walk(value, visit, seen);
}

/** Ocorrência que contém a posição (linha e coluna a partir de 1). */
export function occurrenceAt(index: ProjectIndex, file: string, line: number, column: number): Occurrence | undefined {
  return index.byFile.get(file)?.find((o) => o.line === line && column >= o.column && column <= o.column + o.length);
}

// ---------------------------------------------------------------------
//  Extensões
// ---------------------------------------------------------------------

/**
 * Toda regra com um `name` filho é uma declaração; a chave é o início do
 * nome, que é o `loc` do identificador na AST. Endpoints sem nome são
 * indexados também pelo handler, que é de onde vem o nome implícito.
 */
function collectExtents(tree: ParseTree, file: string, out: Map<string, Extent>): void {
  if (!(tree instanceof ParserRuleContext)) return;
  const name = tree.children.find((c) => c instanceof P.NameContext) as ParserRuleContext | undefined;
  const handler = tree instanceof P.EndpointDeclContext ? tree.qualifiedName() : undefined;
  for (const key of [name, handler]) {
    if (key?.start && tree.start && tree.stop) {
      out.set(locKey({ file, line: key.start.line, column: key.start.column + 1 }), extentOf(tree));
    }
  }
  for (const child of tree.children) collectExtents(child, file, out);
}

export function extentOf(ctx: ParserRuleContext): Extent {
  const stop = ctx.stop!;
  const lines = (stop.text ?? "").split("\n");
  return {
    start: { line: ctx.start!.line, column: ctx.start!.column + 1 },
    end: {
      line: stop.line + lines.length - 1,
      column: (lines.length > 1 ? 0 : stop.column) + lines.at(-1)!.length + 1,
    },
  };
}
