// Carregamento de plugins (seção 19.5): os módulos de `plugins:` no
// `planta.config.yaml`, relativos à pasta `planta/` ou pacotes instalados no
// projeto.

import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Loc } from "./ast.ts";
import type { Config } from "./config.ts";
import { CATALOG, type Diagnostic } from "./diagnostics.ts";
import type { Extractor, Fact } from "./facts.ts";
import type { IrModel } from "./ir.ts";
import type { DependencyGraph } from "./rules/graph.ts";
import type { Dependency, ExtractorDefinition, PlantaElement, PluginDefinition, RuleContext, RuleDefinition } from "./sdk.ts";

export class PluginError extends Error {}

export interface LoadedPlugins {
  rules: RuleDefinition[];
  extractors: Record<string, Extractor>;
}

const cache = new Map<string, Promise<unknown>>();

export async function loadPlugins(config: Config): Promise<LoadedPlugins> {
  const loaded: LoadedPlugins = { rules: [], extractors: {} };
  for (const spec of config.plugins) {
    const url = locate(spec, config);
    let mod: { default?: unknown };
    try {
      if (!cache.has(url)) cache.set(url, import(url));
      mod = (await cache.get(url)) as { default?: unknown };
    } catch (e) {
      cache.delete(url);
      throw new PluginError(`plugin ${spec}: ${(e as Error).message}`);
    }
    for (const item of [mod.default ?? mod].flat()) add(loaded, item, spec);
  }
  return loaded;
}

function locate(spec: string, config: Config): string {
  if (spec.startsWith(".") || spec.startsWith("/")) return pathToFileURL(resolve(config.plantaDir, spec)).href;
  try {
    return pathToFileURL(createRequire(join(config.projectRoot, "package.json")).resolve(spec)).href;
  } catch {
    throw new PluginError(`plugin ${spec}: pacote não encontrado a partir de ${config.projectRoot}`);
  }
}

function add(loaded: LoadedPlugins, item: unknown, spec: string): void {
  if (!item || typeof item !== "object") throw new PluginError(`plugin ${spec}: export default deve ser um plugin, uma regra ou um extrator`);
  const o = item as Partial<PluginDefinition & RuleDefinition & ExtractorDefinition>;
  if (typeof o.check === "function") return addRule(loaded, o as RuleDefinition, spec);
  if (typeof o.extractFile === "function" || typeof o.extractProject === "function") return addExtractor(loaded, o as ExtractorDefinition, spec);
  if (!o.rules && !o.extractors) throw new PluginError(`plugin ${spec}: não contribui regras nem extratores`);
  for (const r of o.rules ?? []) addRule(loaded, r, spec);
  for (const e of o.extractors ?? []) addExtractor(loaded, e, spec);
}

function addRule(loaded: LoadedPlugins, rule: RuleDefinition, spec: string): void {
  if (!rule.id || !rule.id.includes("/")) throw new PluginError(`plugin ${spec}: o id da regra precisa de prefixo (\`acme/nome\`), recebido \`${rule.id}\``);
  // Descrição no catálogo: aparece nas regras do SARIF e em `planta check`.
  CATALOG[rule.id] = rule.description ?? rule.id;
  loaded.rules.push(rule);
}

function addExtractor(loaded: LoadedPlugins, def: ExtractorDefinition, spec: string): void {
  if (!def.name) throw new PluginError(`plugin ${spec}: extrator sem \`name\``);
  loaded.extractors[def.name] = {
    name: def.name,
    extract(files, config) {
      const ctx = { config };
      const facts = [...files.flatMap((f) => def.extractFile?.(f, ctx) ?? []), ...(def.extractProject?.(files, ctx) ?? [])];
      return facts.map((f) => ({ ...f, extractor: f.extractor ?? def.name }));
    },
  };
}

/** Roda as regras dos plugins sobre o modelo verificado. */
export async function runPluginRules(
  rules: RuleDefinition[],
  input: { ir: IrModel; facts: Fact[]; graph: DependencyGraph; codeLoc: (file: string, line?: number) => Loc },
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const elements = Object.entries(input.ir.elements).map(([id, el]) => Object.freeze({ ...el, id }) as PlantaElement);
  const byId = new Map(elements.map((e) => [e.id, e]));
  const dependencies: Dependency[] = input.graph.edges.map((e) => ({
    ...(e.from.elements[0] && { from: e.from.elements[0] }),
    ...(e.to.elements[0] && { to: e.to.elements[0] }),
    ...(e.from.file && { fromFile: e.from.file }),
    ...(e.to.file && { toFile: e.to.file }),
    kind: e.kind,
    ...(e.via && { via: e.via }),
    real: e.real,
  }));
  for (const rule of rules) {
    const ctx: RuleContext = {
      model: {
        ir: input.ir,
        element: (id) => byId.get(id),
        elements: (filter = {}) => elements.filter((e) => (!filter.kind || e.kind === filter.kind) && (!filter.tag || e.meta.tags.includes(filter.tag))),
      },
      facts: input.facts,
      dependencies,
      report(target, message, options = {}) {
        const loc = typeof target === "string" ? byId.get(target)?.source : "source" in target ? target.source : input.codeLoc(target.file, target.line);
        if (!loc) throw new PluginError(`regra ${rule.id}: elemento \`${String(target)}\` não existe`);
        diagnostics.push({ code: rule.id, severity: options.severity ?? rule.severity ?? "warning", message, loc });
      },
    };
    try {
      await rule.check(ctx);
    } catch (e) {
      if (e instanceof PluginError) throw e;
      throw new PluginError(`regra ${rule.id} falhou: ${(e as Error).message}`);
    }
  }
  return diagnostics;
}
