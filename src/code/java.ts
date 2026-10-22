// Resolvedor Java (seção 9.3): `Classe`, `Classe.metodo`, `Classe.campo` e,
// para sobrecargas, `Classe.metodo(Tipo1,Tipo2)` com os nomes simples dos
// tipos. Sem parâmetros na âncora, um método sobrecarregado é ambíguo (PL204).

import type { Node } from "web-tree-sitter";
import { type CodeSymbol, type Fingerprint, type FingerprintOptions, hash, joinTokens, type SourceFile, type SymbolKind } from "./typescript.ts";

const TYPES: Record<string, SymbolKind> = {
  class_declaration: "class", record_declaration: "class", interface_declaration: "interface",
  enum_declaration: "enum", annotation_type_declaration: "interface",
};

export function listSymbols(file: SourceFile): CodeSymbol[] {
  const out: CodeSymbol[] = [];
  const visit = (node: Node, prefix: string) => {
    for (const child of node.namedChildren) {
      if (!child || !TYPES[child.type]) continue;
      const name = child.childForFieldName("name")?.text;
      if (!name) continue;
      const cls = symbol(prefix + name, TYPES[child.type]!, child);
      out.push(cls);
      out.push(...members(cls));
      // Classes internas: `Externa.Interna`.
      const body = child.childForFieldName("body");
      if (body) visit(body, `${cls.name}.`);
    }
  };
  visit(file.tree.rootNode, "");
  return out;
}

export function findSymbol(file: SourceFile, name: string): CodeSymbol[] {
  return listSymbols(file).filter((s) => s.name === name);
}

/** Anotações do nó (`@Service`, `@GetMapping("/x")`), na ordem do código. */
export function annotationsOf(node: Node): Node[] {
  const modifiers = node.namedChildren.find((c) => c?.type === "modifiers");
  return (modifiers?.namedChildren ?? []).filter((c): c is Node => c?.type === "annotation" || c?.type === "marker_annotation");
}

function members(cls: CodeSymbol): CodeSymbol[] {
  const body = cls.node.childForFieldName("body");
  const out: CodeSymbol[] = [];
  const methods = (body?.namedChildren ?? []).filter((m): m is Node => m?.type === "method_declaration");
  const count = new Map<string, number>();
  for (const m of methods) count.set(m.childForFieldName("name")!.text, (count.get(m.childForFieldName("name")!.text) ?? 0) + 1);
  for (const m of methods) {
    const name = m.childForFieldName("name")!.text;
    out.push(symbol(`${cls.name}.${name}`, "method", m));
    // Com sobrecarga, a forma com tipos desambigua: `criar(CriarClienteDto)`.
    if (count.get(name)! > 1) out.push(symbol(`${cls.name}.${name}(${parameterTypes(m).join(",")})`, "method", m));
  }
  for (const f of (body?.namedChildren ?? []).filter((x): x is Node => x?.type === "field_declaration")) {
    for (const d of f.childrenForFieldName("declarator")) {
      const name = d?.childForFieldName("name")?.text;
      if (name) out.push(symbol(`${cls.name}.${name}`, "property", f));
    }
  }
  // Componentes de record: `record ClienteCadastrado(Long id)`.
  if (cls.node.type === "record_declaration") {
    for (const p of cls.node.childForFieldName("parameters")?.namedChildren ?? []) {
      const name = p?.childForFieldName("name")?.text;
      if (p && name) out.push(symbol(`${cls.name}.${name}`, "property", p));
    }
  }
  return out;
}

/** Nomes simples dos tipos dos parâmetros: `List<Item>` → `List`, `java.util.UUID` → `UUID`. */
export function parameterTypes(method: Node): string[] {
  return (method.childForFieldName("parameters")?.namedChildren ?? [])
    .filter((p): p is Node => p?.type === "formal_parameter" || p?.type === "spread_parameter")
    .map((p) => simpleType(p.childForFieldName("type") ?? p.namedChildren.find((c) => c?.type.endsWith("type")) ?? null));
}

export function simpleType(type: Node | null): string {
  if (!type) return "?";
  if (type.type === "generic_type") return simpleType(type.namedChildren[0] ?? null);
  if (type.type === "scoped_type_identifier") return type.text.split(".").at(-1)!;
  if (type.type === "array_type") return `${simpleType(type.childForFieldName("element"))}[]`;
  return type.text;
}

function symbol(name: string, kind: SymbolKind, node: Node): CodeSymbol {
  return {
    name,
    kind,
    node,
    decorators: annotationsOf(node),
    language: "java",
    range: { start: [node.startPosition.row, node.startPosition.column], end: [node.endPosition.row, node.endPosition.column] },
  };
}

// ---------------------------------------------------------------------
//  Impressões digitais
// ---------------------------------------------------------------------

export function fingerprint(sym: CodeSymbol, options: FingerprintOptions = {}): Fingerprint {
  const signatureText = signatureOf(sym, options);
  const body = sym.kind === "property" ? null : sym.node.childForFieldName("body");
  const skip = new Set<number>();
  if (sym.kind === "class") {
    for (const m of body?.namedChildren ?? []) {
      if (m?.type === "method_declaration" && options.membersByName?.has(m.childForFieldName("name")?.text ?? "")) skip.add(m.id);
    }
  }
  return { signature: hash(signatureText), body: hash(body ? normalizedBody(body, skip) : tokens(sym.node)), signatureText };
}

function signatureOf(sym: CodeSymbol, options: FingerprintOptions): string {
  const header = (n: Node) => tokens(n, new Set(n.childrenForFieldName("body").filter((b): b is Node => !!b).map((b) => b.id)));
  if (sym.kind !== "class" && sym.kind !== "interface" && sym.kind !== "enum") return sym.kind === "property" ? tokens(sym.node) : header(sym.node);
  // Contrato da classe: cabeçalho, campos (num @Entity, os campos são o contrato,
  // mesmo privados) e métodos públicos; os de impressão própria, só pelo nome.
  const lines = [header(sym.node)];
  for (const m of sym.node.childForFieldName("body")?.namedChildren ?? []) {
    if (!m) continue;
    if (m.type === "field_declaration" || m.type === "enum_constant") lines.push(`  ${tokens(m)}`);
    if (m.type === "method_declaration") {
      const name = m.childForFieldName("name")?.text ?? "";
      if (options.membersByName?.has(name)) lines.push(`  ${name}(…)`);
      else if (/\bpublic\b/.test(m.namedChildren.find((c) => c?.type === "modifiers")?.text ?? "") || sym.kind === "interface") lines.push(`  ${header(m)}`);
    }
  }
  return lines.join("\n");
}

function tokens(node: Node, skip = new Set<number>(), rename?: Map<string, string>): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (skip.has(n.id) || n.type === "line_comment" || n.type === "block_comment") return;
    if (n.type === "string_literal") {
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

/** Corpo sem comentários, com parâmetros e variáveis locais renomeados. */
function normalizedBody(body: Node, skip: Set<number>): string {
  const locals = new Map<string, string>();
  const declare = (n: Node | null | undefined) => {
    if (n?.type === "identifier" && !locals.has(n.text)) locals.set(n.text, `$${locals.size}`);
  };
  for (const p of body.parent?.childForFieldName("parameters")?.namedChildren ?? []) declare(p?.childForFieldName("name"));
  for (const d of body.descendantsOfType("variable_declarator")) {
    if (d?.parent?.type === "local_variable_declaration") declare(d.childForFieldName("name"));
  }
  return tokens(body, skip, locals);
}
