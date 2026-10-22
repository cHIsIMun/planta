// Resolução de código em várias linguagens: um parser tree-sitter por
// linguagem, e símbolos e impressões digitais despachados pela linguagem do
// arquivo. Quem só precisa de "um arquivo de código" usa este módulo.

import * as java from "./java.ts";
import * as py from "./python.ts";
import * as ts from "./typescript.ts";
import { type CodeSymbol, type Fingerprint, type FingerprintOptions, loadGrammar, parserFor, type SourceFile } from "./typescript.ts";

export type { CodeSymbol, Fingerprint, Language, SourceFile, SymbolKind } from "./typescript.ts";

export class CodeParser {
  private constructor(
    private readonly typescript: ts.TypeScriptParser,
    private readonly python: ReturnType<typeof parserFor>,
    private readonly terraform: ReturnType<typeof parserFor>,
    private readonly java: ReturnType<typeof parserFor>,
  ) {}

  static async create(): Promise<CodeParser> {
    const [typescript, python, terraform, javaGrammar] = await Promise.all([
      ts.TypeScriptParser.create(),
      loadGrammar("tree-sitter-python/tree-sitter-python.wasm"),
      loadGrammar("@tree-sitter-grammars/tree-sitter-hcl/tree-sitter-terraform.wasm"),
      loadGrammar("tree-sitter-java/tree-sitter-java.wasm"),
    ]);
    return new CodeParser(typescript, parserFor(python), parserFor(terraform), parserFor(javaGrammar));
  }

  static handles(path: string): boolean {
    return ts.TypeScriptParser.handles(path) || isPython(path) || path.endsWith(".java") || path.endsWith(".tf");
  }

  /** Linguagens com símbolos para âncoras `code:` (o Terraform é endereçado por `tf:`). */
  static hasSymbols(path: string): boolean {
    return ts.TypeScriptParser.handles(path) || isPython(path) || path.endsWith(".java");
  }

  parse(path: string, text: string): SourceFile {
    if (isPython(path)) return { path, text, tree: this.python.parse(text)!, language: "python" };
    if (path.endsWith(".tf")) return { path, text, tree: this.terraform.parse(text)!, language: "terraform" };
    if (path.endsWith(".java")) return { path, text, tree: this.java.parse(text)!, language: "java" };
    return this.typescript.parse(path, text);
  }
}

function isPython(path: string): boolean {
  return /\.pyi?$/.test(path);
}

export function listSymbols(file: SourceFile): CodeSymbol[] {
  if (file.language === "terraform") return [];
  if (file.language === "java") return java.listSymbols(file);
  return file.language === "python" ? py.listSymbols(file) : ts.listSymbols(file);
}

/** Símbolos com o nome dado; mais de um significa âncora ambígua (PL204). */
export function findSymbol(file: SourceFile, name: string): CodeSymbol[] {
  return listSymbols(file).filter((s) => s.name === name);
}

export function fingerprint(sym: CodeSymbol, options: FingerprintOptions = {}): Fingerprint {
  if (sym.language === "java") return java.fingerprint(sym, options);
  return sym.language === "python" ? py.fingerprint(sym, options) : ts.fingerprint(sym, options);
}
