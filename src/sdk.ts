// API pública de plugins (seção 19.5). Um plugin é um módulo listado em
// `plugins:` no `planta.config.yaml` cujo `export default` é um plugin
// (`definePlugin`), uma regra (`defineRule`), um extrator (`defineExtractor`)
// ou uma lista deles.
//
// Tudo o que um plugin recebe é somente leitura: regras reportam, não mudam o
// modelo.

import type { Node, Query, Tree } from "web-tree-sitter";
import type { SourceFile } from "./code/typescript.ts";
import type { ExtractorConfig } from "./config.ts";
import type { Severity } from "./diagnostics.ts";
import type { Fact } from "./facts.ts";
import type { IrElement, IrModel } from "./ir.ts";

export type { Fact, IrElement, IrModel, Severity, SourceFile };

export interface PlantaElement extends IrElement {
  id: string;
}

/** Uma dependência do grafo das regras: declarada na planta ou extraída do código. */
export interface Dependency {
  from?: string;
  to?: string;
  fromFile?: string;
  toFile?: string;
  kind: string;
  via?: string;
  /** Extraída do código (import, injeção, chamada) e não só declarada. */
  real: boolean;
}

export interface RuleContext {
  model: {
    ir: IrModel;
    element(id: string): PlantaElement | undefined;
    /** Elementos, opcionalmente filtrados por tipo e por tag. */
    elements(filter?: { kind?: string; tag?: string }): PlantaElement[];
  };
  facts: Fact[];
  dependencies: Dependency[];
  /** Reporta no elemento (na planta) ou numa posição do código (`file` relativo à raiz do projeto). */
  report(target: PlantaElement | string | { file: string; line?: number }, message: string, options?: { severity?: Severity }): void;
}

export interface RuleDefinition {
  /** Vira o código do diagnóstico: `acme/pii-precisa-de-dono`. */
  id: string;
  description?: string;
  severity?: Severity;
  check(ctx: RuleContext): void | Promise<void>;
}

export interface ExtractContext {
  config: ExtractorConfig;
}

export interface ExtractorDefinition {
  name: string;
  /** Fatos de um arquivo. Deve ser pura: mesma entrada, mesma saída. */
  extractFile?(file: SourceFile, ctx: ExtractContext): Fact[];
  /** Fatos que dependem de vários arquivos. */
  extractProject?(files: SourceFile[], ctx: ExtractContext): Fact[];
}

export interface PluginDefinition {
  name?: string;
  rules?: RuleDefinition[];
  extractors?: ExtractorDefinition[];
}

export function defineRule(rule: RuleDefinition): RuleDefinition {
  return rule;
}

export function defineExtractor(extractor: ExtractorDefinition): ExtractorDefinition {
  return extractor;
}

export function definePlugin(plugin: PluginDefinition): PluginDefinition {
  return plugin;
}

// ---------------------------------------------------------------------
//  Consultas tree-sitter
// ---------------------------------------------------------------------

export interface QueryMatch {
  /** Texto da captura `@nome`. */
  text(name: string): string;
  node(name: string): Node | undefined;
  /** Linha e coluna começam em 0, como no tree-sitter. */
  range: { start: [number, number]; end: [number, number] };
}

/**
 * Consulta tree-sitter sobre a árvore de um `SourceFile` (seção 10.6). A
 * linguagem da consulta é a da árvore; `language` documenta e confere.
 */
export function tsQuery(language: "typescript" | "tsx" | "python", source: string): { matches(tree: Tree): QueryMatch[] } {
  const compiled = new WeakMap<object, Query>();
  return {
    matches(tree) {
      const lang = tree.language;
      if (language === "python" ? !/python/i.test(lang.name ?? "") : /python/i.test(lang.name ?? "")) {
        throw new Error(`tsQuery(${language}) aplicada a uma árvore de ${lang.name}`);
      }
      let query = compiled.get(lang);
      if (!query) {
        // A classe da mesma instância do web-tree-sitter que criou a árvore (ver code/typescript.ts).
        const runtime = (globalThis as { __plantaTreeSitter?: { Query: new (l: unknown, s: string) => Query } }).__plantaTreeSitter;
        if (!runtime) throw new Error("tsQuery: o núcleo da Planta ainda não carregou o tree-sitter");
        query = new runtime.Query(lang, source);
        compiled.set(lang, query);
      }
      return query.matches(tree.rootNode).map((m) => {
        const byName = new Map(m.captures.map((c) => [c.name, c.node]));
        const first = m.captures[0]?.node;
        return {
          text: (name: string) => byName.get(name)?.text ?? "",
          node: (name: string) => byName.get(name),
          range: first
            ? { start: [first.startPosition.row, first.startPosition.column], end: [first.endPosition.row, first.endPosition.column] }
            : { start: [0, 0], end: [0, 0] },
        };
      });
    },
  };
}
