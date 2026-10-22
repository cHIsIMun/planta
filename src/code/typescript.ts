// Resolvedor TypeScript (seção 9.4): parser tree-sitter, localização de
// símbolos a partir de uma âncora e impressões digitais (seção 9.7).
//
// Tree-sitter em vez do compilador: funciona em código que não compila (comum
// durante o trabalho de agentes) e é rápido o bastante para cada salvamento.

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { Language as Grammar, type Node, Parser, Query, type Tree } from "web-tree-sitter";

const require = createRequire(import.meta.url);

/** `terraform` não tem símbolos de código: é lido pelo extrator de IaC. */
export type Language = "typescript" | "python" | "java" | "terraform";

export interface SourceFile {
  /** Relativo à raiz do projeto. */
  path: string;
  text: string;
  tree: Tree;
  language: Language;
}

export type SymbolKind = "class" | "interface" | "type" | "enum" | "function" | "variable" | "method" | "property";

export interface CodeSymbol {
  /** Nome como na âncora: `Classe`, `Classe.metodo`, `default`. */
  name: string;
  kind: SymbolKind;
  node: Node;
  /** Decorators aplicados ao símbolo, na ordem do código. */
  decorators: Node[];
  language: Language;
  /** Linha e coluna começam em 0, como no tree-sitter. */
  range: { start: [number, number]; end: [number, number] };
}

export interface FingerprintOptions {
  /**
   * Membros de classe que entram na assinatura só pelo nome, porque têm
   * impressão própria (operações declaradas na planta). Sem isso, mudar a
   * assinatura de uma operação acusaria drift duas vezes: nela e na classe.
   */
  membersByName?: Set<string>;
}

export interface Fingerprint {
  signature: string;
  body: string;
  /** Assinatura normalizada e legível, usada em `planta review`. */
  signatureText: string;
}

// ---------------------------------------------------------------------
//  Parser
// ---------------------------------------------------------------------

// O web-tree-sitter tem build ESM e CommonJS, cada uma com seu WASM. Um
// plugin carregado como CommonJS (um `.ts` fora de pacote ESM) veria a outra,
// não inicializada; o SDK usa esta, publicada aqui.
(globalThis as { __plantaTreeSitter?: { Query: typeof Query } }).__plantaTreeSitter = { Query };

const grammars = new Map<string, Promise<Grammar>>();

/** Gramática tree-sitter em WASM, carregada uma vez por processo. */
export function loadGrammar(wasm: string): Promise<Grammar> {
  let loaded = grammars.get(wasm);
  if (!loaded) {
    loaded = Parser.init().then(() => Grammar.load(require.resolve(wasm)));
    grammars.set(wasm, loaded);
  }
  return loaded;
}

/** Parser de uma gramática. */
export function parserFor(grammar: Grammar): Parser {
  const parser = new Parser();
  parser.setLanguage(grammar);
  return parser;
}

export class TypeScriptParser {
  private constructor(private readonly parsers: { ts: Parser; tsx: Parser }) {}

  static async create(): Promise<TypeScriptParser> {
    const [ts, tsx] = await Promise.all([
      loadGrammar("tree-sitter-typescript/tree-sitter-typescript.wasm"),
      loadGrammar("tree-sitter-typescript/tree-sitter-tsx.wasm"),
    ]);
    return new TypeScriptParser({ ts: parserFor(ts), tsx: parserFor(tsx) });
  }

  static handles(path: string): boolean {
    return /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(path) && !path.endsWith(".d.ts");
  }

  parse(path: string, text: string): SourceFile {
    const parser = /\.(tsx|jsx)$/.test(path) ? this.parsers.tsx : this.parsers.ts;
    return { path, text, tree: parser.parse(text)!, language: "typescript" };
  }
}

// ---------------------------------------------------------------------
//  Símbolos
// ---------------------------------------------------------------------

/** Todas as declarações de nível superior e os membros de classe do arquivo. */
export function listSymbols(file: SourceFile): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  for (const statement of file.tree.rootNode.namedChildren) {
    if (!statement) continue;
    const exported = statement.type === "export_statement";
    const decl = exported ? statement.childForFieldName("declaration") : statement;
    if (!decl) continue;
    const outer = exported ? decoratorsOf(statement) : [];
    const isDefault = exported && statement.children.some((c) => c?.type === "default");

    for (const sym of declared(decl)) {
      const top = { ...sym, decorators: [...outer, ...sym.decorators] };
      symbols.push(top);
      if (isDefault) symbols.push({ ...top, name: "default" });
      if (top.kind === "class") symbols.push(...members(top));
    }
  }
  return symbols;
}

/** Símbolos com o nome dado; mais de um significa âncora ambígua (PL204). */
export function findSymbol(file: SourceFile, name: string): CodeSymbol[] {
  return listSymbols(file).filter((s) => s.name === name);
}

function declared(node: Node): CodeSymbol[] {
  const named = (kind: SymbolKind, nameNode: Node | null, target = node): CodeSymbol[] =>
    nameNode ? [symbol(nameNode.text, kind, target, decoratorsOf(target))] : [];

  switch (node.type) {
    case "class_declaration":
    case "abstract_class_declaration":
      return named("class", node.childForFieldName("name"));
    case "function_declaration":
    case "generator_function_declaration":
      return named("function", node.childForFieldName("name"));
    case "interface_declaration":
      return named("interface", node.childForFieldName("name"));
    case "type_alias_declaration":
      return named("type", node.childForFieldName("name"));
    case "enum_declaration":
      return named("enum", node.childForFieldName("name"));
    case "lexical_declaration":
    case "variable_declaration":
      return node.namedChildren
        .filter((d): d is Node => d?.type === "variable_declarator")
        .flatMap((d) => named("variable", d.childForFieldName("name"), d));
    default:
      return [];
  }
}

function members(cls: CodeSymbol): CodeSymbol[] {
  const body = cls.node.childForFieldName("body");
  if (!body) return [];
  const result: CodeSymbol[] = [];
  let pending: Node[] = [];
  for (const child of body.namedChildren) {
    if (!child) continue;
    // Decorators de método são irmãos anteriores ao método no class_body.
    if (child.type === "decorator") {
      pending.push(child);
      continue;
    }
    const name = child.childForFieldName("name");
    if (name && (child.type === "method_definition" || child.type === "public_field_definition")) {
      const kind = child.type === "method_definition" ? "method" : "property";
      result.push(symbol(`${cls.name}.${name.text}`, kind, child, [...pending, ...decoratorsOf(child)]));
    }
    // `method_signature` (sobrecarga) não é símbolo próprio: a implementação é.
    pending = [];
  }
  return result;
}

function symbol(name: string, kind: SymbolKind, node: Node, decorators: Node[]): CodeSymbol {
  return {
    name,
    kind,
    node,
    decorators,
    language: "typescript",
    range: { start: [node.startPosition.row, node.startPosition.column], end: [node.endPosition.row, node.endPosition.column] },
  };
}

export function decoratorsOf(node: Node): Node[] {
  return node.namedChildren.filter((c): c is Node => c?.type === "decorator");
}

// ---------------------------------------------------------------------
//  Impressões digitais
// ---------------------------------------------------------------------

/**
 * Assinatura: o que o símbolo promete ao resto do sistema. Corpo: como ele
 * cumpre, sem comentários, sem formatação e com variáveis locais renomeadas
 * de forma canônica.
 */
export function fingerprint(sym: CodeSymbol, options: FingerprintOptions = {}): Fingerprint {
  const signatureText = signatureOf(sym, options);
  const bodyNode = bodyOf(sym);
  // Métodos com impressão própria também ficam fora do corpo da classe.
  const tracked = sym.kind === "class" ? trackedMethods(bodyNode, options) : new Set<number>();
  return {
    signature: hash(signatureText),
    body: hash(bodyNode ? normalizedBody(bodyNode, tracked) : ""),
    signatureText,
  };
}

/** Nós (métodos e seus decorators) dos membros listados em `membersByName`. */
function trackedMethods(body: Node | null, options: FingerprintOptions): Set<number> {
  const ids = new Set<number>();
  if (!body || !options.membersByName) return ids;
  let decorators: Node[] = [];
  for (const m of body.namedChildren) {
    if (!m) continue;
    if (m.type === "decorator") {
      decorators.push(m);
      continue;
    }
    if (m.type === "method_definition" && options.membersByName.has(m.childForFieldName("name")?.text ?? "")) {
      for (const n of [...decorators, m]) ids.add(n.id);
    }
    decorators = [];
  }
  return ids;
}

function bodyOf(sym: CodeSymbol): Node | null {
  switch (sym.kind) {
    case "class":
    case "function":
    case "method":
      return sym.node.childForFieldName("body");
    case "variable":
    case "property":
      return sym.node.childForFieldName("value");
    default:
      return null;
  }
}

function signatureOf(sym: CodeSymbol, options: FingerprintOptions): string {
  const decorators = sym.decorators.map((d) => tokens(d));
  switch (sym.kind) {
    case "class": {
      const byName = (m: Node | null) => !!m && m.type === "method_definition" && !!options.membersByName?.has(m.childForFieldName("name")?.text ?? "");
      const header = without(sym.node, ["body", "decorator"]);
      const members = (sym.node.childForFieldName("body")?.namedChildren ?? [])
        .filter((m): m is Node => !!m && isPublicMember(m))
        .filter((m) => !(m.type === "decorator" && byName(nextMember(m))))
        .map((m) => (m.type === "decorator" ? tokens(m) : byName(m) ? `${m.childForFieldName("name")!.text}(…)` : without(m, ["body", "value"])));
      return [...decorators, header, ...members.map((m) => `  ${m}`)].join("\n");
    }
    case "function":
    case "method":
      return [...decorators, without(sym.node, ["body", "decorator"])].join("\n");
    case "variable":
    case "property":
      // Função atribuída a constante ou campo: a assinatura é a da função.
      return [...decorators, without(sym.node, ["value", "decorator"]), arrowSignature(sym.node.childForFieldName("value"))]
        .filter(Boolean)
        .join("\n");
    default:
      return [...decorators, tokens(sym.node)].join("\n");
  }
}

function arrowSignature(value: Node | null): string {
  if (!value || (value.type !== "arrow_function" && value.type !== "function_expression")) return "";
  return without(value, ["body"]);
}

function nextMember(decorator: Node): Node | null {
  let next = decorator.nextNamedSibling;
  while (next?.type === "decorator") next = next.nextNamedSibling;
  return next;
}

/** Membros que fazem parte do contrato da classe: públicos, fora o construtor. */
function isPublicMember(member: Node): boolean {
  if (member.type === "decorator") {
    // Decorators só entram junto do membro seguinte se ele for público.
    const target = nextMember(member);
    return !!target && isPublicMember(target);
  }
  if (member.type !== "method_definition" && member.type !== "public_field_definition" && member.type !== "method_signature") {
    return false;
  }
  const name = member.childForFieldName("name");
  if (!name || name.type === "private_property_identifier" || name.text === "constructor") return false;
  return !member.namedChildren.some((c) => c?.type === "accessibility_modifier" && c.text !== "public");
}

/** Tokens do nó sem os filhos dos campos dados, com espaçamento normalizado. */
function without(node: Node, fields: string[]): string {
  const skip = new Set<number>();
  for (const field of fields) {
    if (field === "decorator") for (const d of decoratorsOf(node)) skip.add(d.id);
    else for (const c of node.childrenForFieldName(field)) if (c) skip.add(c.id);
  }
  return tokens(node, skip);
}

function tokens(node: Node, skip = new Set<number>(), rename?: Map<string, string>): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (skip.has(n.id) || n.type === "comment") return;
    // Literais de texto entram inteiros: as aspas não são tokens separados.
    if (n.type === "string" || n.type === "template_string") {
      out.push(n.text);
      return;
    }
    if (n.childCount === 0) {
      out.push(rename?.get(n.text) && isIdentifier(n) ? rename.get(n.text)! : n.text);
      return;
    }
    for (const c of n.children) if (c) walk(c);
  };
  walk(node);
  return joinTokens(out);
}

/** Junta tokens com um espaço, exceto onde ele só atrapalha a leitura. */
export function joinTokens(parts: string[]): string {
  let text = "";
  for (const part of parts) {
    const call = (/^[(<]/.test(part) && /[\w$]$/.test(text)) || (part === "[" && /[\w$)\]]$/.test(text));
    const glue = text === "" || call || /^[),.;:\]>?!]/.test(part) || /[(.[<@!]$/.test(text) ? "" : " ";
    text += glue + part;
  }
  return text;
}

function normalizedBody(body: Node, skip = new Set<number>()): string {
  const locals = new Map<string, string>();
  const declare = (name: Node | null) => {
    if (name && isIdentifier(name) && !locals.has(name.text)) locals.set(name.text, `$${locals.size}`);
  };
  const walk = (n: Node) => {
    switch (n.type) {
      case "variable_declarator":
        declarePattern(n.childForFieldName("name"), declare);
        break;
      case "required_parameter":
      case "optional_parameter":
        declarePattern(n.childForFieldName("pattern"), declare);
        break;
      case "catch_clause":
        declarePattern(n.childForFieldName("parameter"), declare);
        break;
      case "arrow_function": {
        const param = n.childForFieldName("parameter");
        if (param) declare(param);
        break;
      }
    }
    for (const c of n.namedChildren) if (c) walk(c);
  };
  walk(body);
  return tokens(body, skip, locals);
}

function declarePattern(pattern: Node | null, declare: (n: Node) => void): void {
  if (!pattern) return;
  if (isIdentifier(pattern)) return declare(pattern);
  for (const c of pattern.namedChildren) if (c) declarePattern(c.type === "pair_pattern" ? c.childForFieldName("value") : c, declare);
}

function isIdentifier(n: Node): boolean {
  return n.type === "identifier" || n.type === "shorthand_property_identifier" || n.type === "shorthand_property_identifier_pattern";
}

export function hash(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex").slice(0, 16)}`;
}

// ---------------------------------------------------------------------
//  Utilitários para extratores
// ---------------------------------------------------------------------

/** Nome e argumentos de um decorator: `@Post(':id')` → `{ name: "Post", args: [nó da string] }`. */
export function decoratorCall(decorator: Node): { name: string; args: Node[] } | undefined {
  const expr = decorator.namedChildren[0];
  if (!expr) return undefined;
  if (expr.type === "identifier") return { name: expr.text, args: [] };
  if (expr.type !== "call_expression") return undefined;
  const fn = expr.childForFieldName("function");
  const name = fn?.type === "member_expression" ? fn.childForFieldName("property")?.text : fn?.text;
  if (!name) return undefined;
  const args = expr.childForFieldName("arguments")?.namedChildren.filter((a): a is Node => !!a && a.type !== "comment") ?? [];
  return { name, args };
}

/** Valor de um literal de string (`'x'`, `"x"` ou template sem interpolação). */
export function stringValue(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "string") return node.namedChildren.map((c) => c?.text ?? "").join("");
  if (node.type === "template_string" && !node.namedChildren.some((c) => c?.type === "template_substitution")) {
    return node.text.slice(1, -1);
  }
  return undefined;
}

export interface TypeShape {
  /** Nome do tipo sem lista, nulidade nem `Promise`; `unknown` para tipos literais e funções. */
  base: string;
  list: boolean;
  nullable: boolean;
}

/** `Pedido[]`, `Array<Pedido>`, `string | null`, `Promise<Cliente | null>`. */
export function describeType(node: Node | null | undefined): TypeShape {
  if (!node) return { base: "unknown", list: false, nullable: false };
  if (node.type === "type_annotation") return describeType(node.namedChildren[0]);
  if (node.type === "parenthesized_type") return describeType(node.namedChildren[0]);
  if (node.type === "array_type") return { ...describeType(node.namedChildren[0]), list: true };
  if (node.type === "generic_type") {
    const name = node.childForFieldName("name")?.text;
    const arg = node.childForFieldName("type_arguments")?.namedChildren[0];
    if (name === "Array") return { ...describeType(arg), list: true };
    if (name === "Promise") return describeType(arg);
    return { base: "unknown", list: false, nullable: false };
  }
  if (node.type === "union_type") {
    const parts = flattenUnion(node);
    const real = parts.filter((p) => p.text !== "null" && p.text !== "undefined");
    if (real.length === 1) return { ...describeType(real[0]), nullable: real.length < parts.length };
    return { base: "unknown", list: false, nullable: false };
  }
  if (node.type === "type_identifier" || node.type === "predefined_type" || node.type === "nested_type_identifier") {
    return { base: node.text, list: false, nullable: false };
  }
  return { base: "unknown", list: false, nullable: false };
}

function flattenUnion(node: Node): Node[] {
  return node.namedChildren.flatMap((c) => (!c ? [] : c.type === "union_type" ? flattenUnion(c) : [c]));
}

/** Linha (1-based) do nó, para diagnósticos. */
export function lineOf(node: Node): number {
  return node.startPosition.row + 1;
}
