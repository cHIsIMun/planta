// Resolvedor Python (seção 9.3): `Nome`, `Classe.metodo`, `funcao`, e os
// atributos de classe (`Cliente.email`), que é onde o Django declara campos.

import type { Node } from "web-tree-sitter";
import { type CodeSymbol, type Fingerprint, type FingerprintOptions, hash, joinTokens, type SourceFile, type SymbolKind } from "./typescript.ts";

export function listSymbols(file: SourceFile): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  for (const statement of file.tree.rootNode.namedChildren) {
    if (!statement) continue;
    const { decorators, definition } = unwrap(statement);
    if (definition.type === "class_definition") {
      const cls = named(definition, "class", decorators);
      if (!cls) continue;
      symbols.push(cls);
      symbols.push(...members(cls));
    } else if (definition.type === "function_definition") {
      const fn = named(definition, "function", decorators);
      if (fn) symbols.push(fn);
    } else {
      symbols.push(...assigned(definition).map((name) => symbol(name.text, "variable", definition, [])));
    }
  }
  return symbols;
}

export function findSymbol(file: SourceFile, name: string): CodeSymbol[] {
  return listSymbols(file).filter((s) => s.name === name);
}

/** `@decorator\ndef f()`: o nó decorado e os decorators. */
export function unwrap(node: Node): { decorators: Node[]; definition: Node } {
  if (node.type !== "decorated_definition") return { decorators: [], definition: node };
  return {
    decorators: node.namedChildren.filter((c): c is Node => c?.type === "decorator"),
    definition: node.childForFieldName("definition") ?? node,
  };
}

function named(node: Node, kind: SymbolKind, decorators: Node[], prefix = ""): CodeSymbol | undefined {
  const name = node.childForFieldName("name")?.text;
  return name ? symbol(prefix + name, kind, node, decorators) : undefined;
}

/** Nomes à esquerda de `x = ...` ou `x: T = ...` num `expression_statement`. */
export function assigned(statement: Node): Node[] {
  if (statement.type !== "expression_statement") return [];
  const a = statement.namedChildren[0];
  if (a?.type !== "assignment") return [];
  const left = a.childForFieldName("left");
  return left?.type === "identifier" ? [left] : [];
}

function members(cls: CodeSymbol): CodeSymbol[] {
  const result: CodeSymbol[] = [];
  for (const child of cls.node.childForFieldName("body")?.namedChildren ?? []) {
    if (!child) continue;
    const { decorators, definition } = unwrap(child);
    if (definition.type === "function_definition") {
      const m = named(definition, "method", decorators, `${cls.name}.`);
      if (m) result.push(m);
    } else {
      for (const name of assigned(definition)) result.push(symbol(`${cls.name}.${name.text}`, "property", definition, []));
    }
  }
  return result;
}

function symbol(name: string, kind: SymbolKind, node: Node, decorators: Node[]): CodeSymbol {
  return {
    name,
    kind,
    node,
    decorators,
    language: "python",
    range: { start: [node.startPosition.row, node.startPosition.column], end: [node.endPosition.row, node.endPosition.column] },
  };
}

// ---------------------------------------------------------------------
//  Impressões digitais
// ---------------------------------------------------------------------

export function fingerprint(sym: CodeSymbol, options: FingerprintOptions = {}): Fingerprint {
  const signatureText = signatureOf(sym, options);
  const body = sym.kind === "class" || sym.kind === "function" || sym.kind === "method" ? sym.node.childForFieldName("body") : sym.node;
  const tracked = new Set<number>();
  if (sym.kind === "class") for (const m of trackedMembers(sym, options)) tracked.add(m.id);
  return { signature: hash(signatureText), body: hash(body ? normalizedBody(body, tracked) : ""), signatureText };
}

function trackedMembers(cls: CodeSymbol, options: FingerprintOptions): Node[] {
  return (cls.node.childForFieldName("body")?.namedChildren ?? []).filter((c): c is Node => {
    if (!c) return false;
    const def = unwrap(c).definition;
    return def.type === "function_definition" && !!options.membersByName?.has(def.childForFieldName("name")?.text ?? "");
  });
}

function signatureOf(sym: CodeSymbol, options: FingerprintOptions): string {
  const decorators = sym.decorators.map((d) => tokens(d));
  switch (sym.kind) {
    case "class": {
      const header = tokens(sym.node, skipFields(sym.node, ["body"]));
      // O contrato da classe: atributos (campos de um model), classes internas
      // (`Meta`) e métodos públicos; os de impressão própria, só pelo nome.
      const members = (sym.node.childForFieldName("body")?.namedChildren ?? []).flatMap((c) => {
        if (!c || c.type === "comment" || isDocstring(c)) return [];
        const { decorators: ds, definition } = unwrap(c);
        if (definition.type !== "function_definition") return [tokens(c)];
        const name = definition.childForFieldName("name")?.text ?? "";
        if (name.startsWith("_")) return [];
        if (options.membersByName?.has(name)) return [`${name}(…)`];
        return [...ds.map((d) => tokens(d)), tokens(definition, skipFields(definition, ["body"]))];
      });
      return [...decorators, header, ...members.map((m) => `  ${m}`)].join("\n");
    }
    case "function":
    case "method":
      return [...decorators, tokens(sym.node, skipFields(sym.node, ["body"]))].join("\n");
    default:
      return tokens(sym.node);
  }
}

function skipFields(node: Node, fields: string[]): Set<number> {
  const skip = new Set<number>();
  for (const f of fields) for (const c of node.childrenForFieldName(f)) if (c) skip.add(c.id);
  return skip;
}

function isDocstring(n: Node): boolean {
  return n.type === "expression_statement" && n.namedChildren[0]?.type === "string" && n.namedChildren.length === 1;
}

function tokens(node: Node, skip = new Set<number>(), rename?: Map<string, string>): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (skip.has(n.id) || n.type === "comment") return;
    if (n.type === "string") {
      out.push(n.text);
      return;
    }
    if (n.childCount === 0) {
      out.push(n.type === "identifier" && rename?.get(n.text) ? rename.get(n.text)! : n.text);
      return;
    }
    for (const c of n.children) if (c) walk(c);
  };
  walk(node);
  return joinTokens(out);
}

/** Corpo sem comentários nem docstrings, com parâmetros e variáveis locais renomeados. */
function normalizedBody(body: Node, skip: Set<number>): string {
  const locals = new Map<string, string>();
  const declare = (n: Node | null | undefined) => {
    if (n?.type === "identifier" && !locals.has(n.text)) locals.set(n.text, `$${locals.size}`);
  };
  const params = body.parent?.childForFieldName("parameters");
  for (const p of params?.namedChildren ?? []) {
    if (!p) continue;
    declare(p.type === "identifier" ? p : p.childForFieldName("name") ?? p.namedChildren[0]);
  }
  const walk = (n: Node) => {
    if (n.type === "assignment" && body.type === "block" && body.parent?.type === "function_definition") {
      declare(n.childForFieldName("left"));
    }
    if (n.type === "for_statement") declare(n.childForFieldName("left"));
    for (const c of n.namedChildren) if (c) walk(c);
  };
  walk(body);
  const docstrings = new Set<number>();
  for (const c of body.namedChildren) if (c && isDocstring(c)) docstrings.add(c.id);
  return tokens(body, new Set([...skip, ...docstrings]), locals);
}
