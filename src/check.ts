// `planta check` completo: fases 8–11 (seção 8.1) sobre o modelo das fases 1–7.
//
//  8. Resolução de âncoras: cada âncora de código vira um símbolo real, com
//     impressões digitais (PL201–PL209).
//  9. Extração: os extratores configurados produzem fatos.
// 10. Correspondência: elementos ↔ fatos, por âncora, chave natural e convenção.
// 11. Validação: cobertura (PL3xx), comparação estrutural e dependências
//     (PL4xx) e drift contra o `planta.lock` (PL401–PL404).

import { existsSync, globSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, matchesGlob, relative, resolve } from "node:path";
import type { Loc } from "./ast.ts";
import { CodeParser, type CodeSymbol, findSymbol, fingerprint, type Fingerprint, listSymbols, type SourceFile } from "./code/index.ts";
import { describeType, hash } from "./code/typescript.ts";
import { simpleType } from "./code/java.ts";
import type { Node } from "web-tree-sitter";
import type { Config, SeverityOrOff } from "./config.ts";
import { anchorText } from "./derive.ts";
import type { Diagnostic, Severity } from "./diagnostics.ts";
import { discover, type DocItem, parseMarkdown, sectionFor } from "./docs/markdown.ts";
import { django } from "./extractors/django.ts";
import { javaToPlanta, spring } from "./extractors/spring.ts";
import { fastapi } from "./extractors/fastapi.ts";
import { nextjs } from "./extractors/nextjs.ts";
import { angular } from "./extractors/angular.ts";
import { cdk } from "./extractors/cdk.ts";
import { kubernetes } from "./extractors/kubernetes.ts";
import { compose } from "./extractors/compose.ts";
import { imports } from "./extractors/imports.ts";
import { nestjs } from "./extractors/nestjs.ts";
import { react } from "./extractors/react.ts";
import { terraform } from "./extractors/terraform.ts";
import { typeorm } from "./extractors/typeorm.ts";
import { type Extractor, type Fact, type FieldFact, type HttpEndpointData, routeKey, type TextFile } from "./facts.ts";
import type { IrElement, IrType } from "./ir.ts";
import type { Lock, LockEntry } from "./lock.ts";
import type { Model } from "./model.ts";
import type { ValidationContext } from "./validate/context.ts";
import { matchRoutes, validateAppRoots, validateFrontend } from "./validate/frontend.ts";
import { matchIac, validateIac } from "./validate/iac.ts";
import { runRules } from "./rules/engine.ts";
import type { DependencyGraph } from "./rules/graph.ts";
import { loadPlugins, runPluginRules } from "./plugins.ts";
import { validateEvents, verifyProcesses } from "./rules/process.ts";

export const EXTRACTORS: Record<string, Extractor> = { nestjs, typeorm, django, react, angular, terraform, imports, spring, fastapi, nextjs, "aws-cdk": cdk, kubernetes, compose };

/** Tipos de elemento e os tipos de símbolo em que podem ser ancorados (PL209). */
const ANCHOR_KINDS: Record<string, readonly CodeSymbol["kind"][]> = {
  entity: ["class", "interface", "type"],
  value: ["class", "interface", "type"],
  dto: ["class", "interface", "type"],
  event: ["class", "interface", "type"],
  // Em Python, enumeração é classe (`TextChoices`, `enum.Enum`).
  enum: ["enum", "type", "variable", "class"],
  op: ["method", "function", "property", "variable"],
};
// Interface: repositórios do Spring Data (e gateways declarados por contrato).
const COMPONENT_SYMBOLS = ["class", "interface", "function", "variable"] as const;

const IGNORED_DIRS = new Set(["node_modules", "dist", "build", ".git", ".gerado"]);

/** Código ancorado de um elemento, depois da fase 8. */
export interface ResolvedCode {
  file: string;
  symbol: CodeSymbol;
  fingerprint: Fingerprint;
}

/** O que um humano revisa: impressão atual de cada elemento revisável. */
export interface Reviewable {
  id: string;
  anchor?: string;
  natural?: string;
  /** Ausente quando o elemento só é revisável pelos requisitos que o justificam. */
  signature?: string;
  body?: string;
  signatureText: string;
  /** Impressão atual de cada requisito que justifica o elemento, por ID exibido (`REQ-001`). */
  requirements: Record<string, string>;
  /** Requisitos cujo texto mudou desde a revisão (PL611). */
  requirementsChanged: string[];
  /** Requisitos que o elemento passou a citar depois da revisão. */
  requirementsAdded: string[];
  /** Arquivo de código de onde a impressão foi tirada, relativo à raiz do projeto. */
  file: string;
  line: number;
  state: "new" | "changed" | "reviewed";
  signatureChanged: boolean;
  bodyChanged: boolean;
}

export interface CheckResult {
  diagnostics: Diagnostic[];
  facts: Fact[];
  resolved: Map<string, ResolvedCode>;
  matches: Map<string, string[]>;
  /** Fatos com dono na planta (ou fora do que ela descreve): o resto é lacuna (`planta suggest`). */
  covered: Set<string>;
  /** Dependências reais entre elementos (imports, injeção, chamadas, HTTP), já no nível de componente. */
  dependencies: { from: string; to: string; kind: string }[];
  reviewables: Map<string, Reviewable>;
  requirements: Map<string, Requirement>;
}

/** Requisito ou decisão conhecido pelo modelo (seção 14). */
export interface Requirement extends DocItem {
  /** `req:REQ-001`, `adr:ADR-0007`, ou o ID do elemento `requirement`/`decision` declarado. */
  key: string;
  /** Elementos que o citam em `justifiedBy` ou `decidedBy`. */
  justifiedBy: string[];
}

const DOC_EXTRACTORS: Record<string, { kind: DocItem["kind"]; prefix: string; idPattern: string }> = {
  "markdown-requirements": { kind: "requirement", prefix: "req:", idPattern: "REQ-\\d+" },
  "markdown-decisions": { kind: "decision", prefix: "adr:", idPattern: "ADR-\\d+" },
};

/** `req:REQ-001` → `REQ-001`, como o lock e as mensagens mostram. */
export function displayKey(key: string): string {
  return key.replace(/^(req|adr):/, "");
}

export interface CheckInput {
  model: Model;
  config: Config;
  lock: Lock;
  /** Diretório de onde os caminhos dos diagnósticos são exibidos. */
  cwd: string;
}

export async function checkCode(input: CheckInput): Promise<CheckResult> {
  const [parser, plugins] = await Promise.all([CodeParser.create(), loadPlugins(input.config)]);
  const checker = new Checker(input, parser, plugins.extractors);
  const result = checker.run();
  if (plugins.rules.length > 0) {
    result.diagnostics.push(...await runPluginRules(plugins.rules, {
      ir: input.model.ir, facts: result.facts, graph: checker.graph!, codeLoc: (file, line) => checker.codeLocation(file, line),
    }));
  }
  return result;
}

class Checker {
  private readonly diagnostics: Diagnostic[] = [];
  private readonly files = new Map<string, SourceFile | null>();
  private readonly resolved = new Map<string, ResolvedCode>();
  private readonly matches = new Map<string, string[]>();
  private readonly matchedFacts = new Set<string>();
  /** Grafo de dependências das regras, para as regras dos plugins. */
  graph?: DependencyGraph;
  /** Lacunas reportadas pelos validadores com código próprio (PL320, PL340). */
  private readonly reportedFacts = new Set<string>();
  private readonly reviewables = new Map<string, Reviewable>();
  private readonly requirements = new Map<string, Requirement>();
  private readonly elements: Record<string, IrElement>;
  private facts: Fact[] = [];

  constructor(
    private readonly input: CheckInput,
    private readonly parser: CodeParser,
    private readonly pluginExtractors: Record<string, Extractor> = {},
  ) {
    this.elements = input.model.ir.elements;
  }

  run(): CheckResult {
    const extracted = this.extract();
    this.resolveAnchors(extracted);
    this.facts = extracted.facts;
    this.match();
    const ctx = this.context();
    matchRoutes(ctx);
    matchIac(ctx);
    validateEvents(ctx);
    this.coverage();
    this.compare();
    this.dependencies();
    validateFrontend(ctx);
    validateAppRoots(ctx);
    validateIac(ctx);
    this.graph = runRules(ctx);
    verifyProcesses(ctx);
    this.traceability();
    this.drift();
    this.annotateIr();
    return {
      diagnostics: this.diagnostics,
      facts: this.facts,
      resolved: this.resolved,
      matches: this.matches,
      covered: this.matchedFacts,
      dependencies: this.graph?.realDependencies() ?? [],
      reviewables: this.reviewables,
      requirements: this.requirements,
    };
  }

  // -------------------------------------------------------------------
  //  Arquivos e diagnósticos
  // -------------------------------------------------------------------

  private file(path: string): SourceFile | undefined {
    if (!this.files.has(path)) {
      const abs = join(this.input.config.projectRoot, path);
      const ok = CodeParser.handles(path) && existsSync(abs);
      this.files.set(path, ok ? this.parser.parse(path, readFileSync(abs, "utf8")) : null);
    }
    return this.files.get(path) ?? undefined;
  }

  codeLocation(file: string, line?: number): Loc {
    return this.codeLoc(file, line);
  }

  /** Posição de código para diagnóstico, exibida relativa ao diretório atual. */
  private codeLoc(file: string, line = 1): Loc {
    return { file: relative(this.input.cwd, join(this.input.config.projectRoot, file)) || file, line, column: 1 };
  }

  private report(code: string, severity: SeverityOrOff, message: string, loc: Loc, related?: Loc[], data?: Record<string, string>): void {
    if (severity === "off") return;
    this.diagnostics.push({ code, severity: severity as Severity, message, loc, ...(related && { related }), ...(data && { data }) });
  }

  /** Âncora para `file#symbol` como deve ser escrita no elemento `id`. */
  private anchorFor(id: string, file: string, symbol: string): string {
    return anchorText(file, symbol, this.input.model.derived.roots.get(id));
  }

  /** O que os validadores de frontend e IaC (em `validate/`) enxergam do verificador. */
  private context(): ValidationContext {
    return {
      model: this.input.model,
      config: this.input.config,
      elements: this.elements,
      facts: this.facts,
      resolved: this.resolved,
      matches: this.matches,
      report: (...args) => this.report(...args),
      codeLoc: (file, line) => this.codeLoc(file, line),
      link: (id, fact) => {
        this.matches.set(id, [...(this.matches.get(id) ?? []), fact.id]);
        this.matchedFacts.add(fact.id);
      },
      cover: (id) => this.matchedFacts.add(id),
      reported: (id) => this.reportedFacts.add(id),
    };
  }

  private ignores(id: string, category: "drift" | "coverage"): boolean {
    return this.elements[id]?.meta.ignore?.some((i) => i.category === category) ?? false;
  }

  // -------------------------------------------------------------------
  //  Fase 9: extração (feita antes da 8 para a detecção de movimento ver todo o código)
  // -------------------------------------------------------------------

  private extract(): { facts: Fact[]; files: SourceFile[] } {
    const { config } = this.input;
    const all = new Map<string, SourceFile>();
    const facts: Fact[] = [];
    for (const ext of config.extractors) {
      if (DOC_EXTRACTORS[ext.use]) continue; // Markdown: ver `traceability()`
      const extractor = EXTRACTORS[ext.use] ?? this.pluginExtractors[ext.use];
      if (!extractor) {
        this.report("PL103", "warning", `extrator desconhecido \`${ext.use}\`; disponíveis: ${[...Object.keys(EXTRACTORS), ...Object.keys(DOC_EXTRACTORS)].join(", ")}`, {
          file: "planta.config.yaml", line: 1, column: 1,
        });
        continue;
      }
      const files = this.sourceFiles(ext.root);
      for (const f of files) all.set(f.path, f);
      facts.push(...extractor.extract(files, ext, extractor.textFiles ? this.textFiles(ext.root, extractor.textFiles) : undefined));
    }
    // Dois extratores podem ver o mesmo arquivo; o fato vale uma vez.
    const unique = new Map(facts.map((f) => [f.id, f]));
    return { facts: [...unique.values()], files: [...all.values()] };
  }

  /** Arquivos de texto sob `root` cujo nome casa com `pattern` (manifestos, templates do CDK). */
  private textFiles(root: string, pattern: RegExp): TextFile[] {
    const { projectRoot, coverage } = this.input.config;
    const base = join(projectRoot, root);
    if (!existsSync(base)) return [];
    const out: TextFile[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else {
          const path = relative(projectRoot, abs);
          if (pattern.test(path) && !coverage.ignore.some((g) => matchesGlob(path, g))) out.push({ path, text: readFileSync(abs, "utf8") });
        }
      }
    };
    // A própria raiz pode ser um arquivo (`compose.yaml`).
    if (statSync(base).isFile()) return pattern.test(root) ? [{ path: root, text: readFileSync(base, "utf8") }] : [];
    walk(base);
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }

  private sourceFiles(root: string): SourceFile[] {
    const { projectRoot, coverage } = this.input.config;
    const base = join(projectRoot, root);
    if (!existsSync(base) || statSync(base).isFile()) return [];
    const result: SourceFile[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else {
          const path = relative(projectRoot, abs);
          if (!CodeParser.handles(path) || coverage.ignore.some((g) => matchesGlob(path, g))) continue;
          const parsed = this.file(path);
          if (parsed) result.push(parsed);
        }
      }
    };
    walk(base);
    return result.sort((a, b) => a.path.localeCompare(b.path));
  }

  // -------------------------------------------------------------------
  //  Fase 8: âncoras
  // -------------------------------------------------------------------

  private resolveAnchors(extracted: { files: SourceFile[]; facts: Fact[] }): void {
    for (const [id, el] of Object.entries(this.elements)) {
      const anchor = el.anchor;
      if (anchor?.scheme !== "code" || !anchor.path || !anchor.symbol) continue;
      const planned = el.meta.status === "planned";
      const at = el.source;

      const file = this.file(anchor.path);
      if (!file) {
        if (!CodeParser.hasSymbols(anchor.path)) continue; // linguagem ainda sem resolvedor
        const moved = this.findMoved(id, anchor.symbol, undefined, extracted.files);
        if (moved) {
          this.useMoved(id, el, moved, at);
          continue;
        }
        if (planned) this.report("PL205", "info", `\`${id}\` está planejado e ainda não tem implementação`, at);
        else this.report("PL202", "error", `arquivo da âncora não existe: ${anchor.path}`, at);
        continue;
      }

      const found = findSymbol(file, anchor.symbol);
      if (found.length > 1) {
        this.report("PL204", "error", `âncora ambígua: ${found.length} símbolos \`${anchor.symbol}\` em ${anchor.path}`, at);
        continue;
      }
      const sym = found[0];
      if (!sym && this.inheritedAction(id, file, anchor.symbol, extracted.facts)) continue;
      if (!sym) {
        const moved = this.findMoved(id, anchor.symbol, file, extracted.files);
        if (moved) {
          this.useMoved(id, el, moved, at);
          continue;
        }
        if (planned) this.report("PL205", "info", `\`${id}\` está planejado e ainda não tem implementação`, at);
        else {
          const how = anchor.inherited ? " (âncora herdada do componente)" : "";
          this.report("PL201", "error", `âncora não resolve: \`${anchor.symbol}\` não existe em ${anchor.path}${how}`, at);
        }
        continue;
      }

      const accepted = ANCHOR_KINDS[el.kind] ?? COMPONENT_SYMBOLS;
      if (!accepted.includes(sym.kind)) {
        this.report("PL209", "error", `\`${id}\` é ${el.kind}, mas \`${anchor.symbol}\` é ${sym.kind}`, at);
        continue;
      }
      this.resolved.set(id, { file: file.path, symbol: sym, fingerprint: this.fingerprintOf(id, sym) });
    }
  }

  /**
   * Ação que a classe herda do framework (o `create` de um `ModelViewSet`):
   * não está no arquivo, mas o extrator a conhece. A âncora resolve para a
   * classe, e a impressão é a da rota que o framework registra.
   */
  private inheritedAction(id: string, file: SourceFile, symbol: string, facts: Fact[]): boolean {
    const fact = facts.find((f) => f.kind === "http.endpoint" && f.data.inherited && f.location.file === file.path && f.data.handler === symbol);
    const cls = fact && findSymbol(file, fact.location.symbol!)[0];
    if (!fact?.fingerprint || !cls) return false;
    const signatureText = `${symbol} (herdada pela classe)\n${fact.fingerprint.signatureText ?? ""}`;
    this.resolved.set(id, { file: file.path, symbol: cls, fingerprint: { signature: fact.fingerprint.signature, body: hash(""), signatureText } });
    return true;
  }

  private fingerprintOf(id: string, sym: CodeSymbol): Fingerprint {
    return fingerprint(sym, { membersByName: trackedMembers(this.elements, id) });
  }

  /**
   * Símbolo que sumiu de onde a âncora aponta (seção 9.8). Com a revisão no
   * lock: mesmo nome e mesma assinatura em outro arquivo é movimento; mesmo
   * corpo com outro nome no mesmo arquivo é renomeação. Sem revisão, só um
   * candidato de mesmo nome no projeto inteiro conta como movimento.
   */
  private findMoved(id: string, symbol: string, original: SourceFile | undefined, files: SourceFile[]): ResolvedCode | undefined {
    const reviewed = this.input.lock.elements.get(id);
    const depth = symbol.split(".").length;
    const name = symbol.split(".").at(-1);
    const all = (f: SourceFile) => listSymbols(f)
      .filter((s) => s.name.split(".").length === depth)
      .map((s) => ({ file: f.path, symbol: s, fingerprint: this.fingerprintOf(id, s) }));

    const sameName = files
      .filter((f) => f !== original)
      .flatMap(all)
      .filter((c) => c.symbol.name.split(".").at(-1) === name)
      .filter((c) => !reviewed || c.fingerprint.signature === reviewed.signature);
    if (sameName.length === 1) return sameName[0];

    if (reviewed?.body && original) {
      const renamed = all(original).filter((c) => c.fingerprint.body === reviewed.body);
      if (renamed.length === 1) return renamed[0];
    }
    return undefined;
  }

  private useMoved(id: string, el: IrElement, moved: ResolvedCode, at: Loc): void {
    const anchor = this.anchorFor(id, moved.file, moved.symbol.name);
    this.report(
      "PL203",
      "warning",
      `\`${id}\`: símbolo movido ou renomeado; atualize a âncora para @"${anchor}"`,
      at,
      [this.codeLoc(moved.file, moved.symbol.range.start[0] + 1)],
      { element: id, anchor },
    );
    if ((ANCHOR_KINDS[el.kind] ?? COMPONENT_SYMBOLS).includes(moved.symbol.kind)) this.resolved.set(id, moved);
  }

  // -------------------------------------------------------------------
  //  Fase 10: correspondência
  // -------------------------------------------------------------------

  private match(): void {
    const at = (file: string, symbol: string | undefined) => `${file}#${symbol ?? ""}`;
    const byLocation = new Map<string, Fact[]>();
    for (const f of this.facts) {
      const key = at(f.location.file, f.location.symbol);
      byLocation.set(key, [...(byLocation.get(key) ?? []), f]);
    }
    const link = (id: string, fact: Fact) => {
      this.matches.set(id, [...(this.matches.get(id) ?? []), fact.id]);
      this.matchedFacts.add(fact.id);
    };
    const factsAt = (id: string) => {
      const r = this.resolved.get(id);
      return r ? byLocation.get(at(r.file, r.symbol.name)) ?? [] : [];
    };

    // Por âncora: entidades e componentes.
    for (const [id, el] of Object.entries(this.elements)) {
      for (const fact of factsAt(id)) {
        const compatible =
          (fact.kind === "entity" && el.kind === "entity") ||
          (fact.kind === "enum" && el.kind === "enum") ||
          (fact.kind === "dto" && el.kind === "dto") ||
          ((fact.kind === "ui.component" || fact.kind === "ui.page") && ["page", "component", "guard"].includes(el.kind)) ||
          (fact.kind === "ui.store" && el.kind === "store") ||
          ((fact.kind === "controller" || fact.kind === "service") && isComponent(el.kind));
        if (compatible) link(id, fact);
      }
    }

    // Operações que tratam eventos (`on`) e jobs: pelo handler.
    const consumers = new Set(Object.entries(this.elements).filter(([, e]) => e.relations.some((r) => r.type === "consumes")).map(([id]) => id));
    for (const [id, el] of Object.entries(this.elements)) {
      if (el.kind !== "job") continue;
      const handler = el.relations.find((r) => r.type === "handledBy")?.target;
      const job = handler ? factsAt(handler).find((f) => f.kind === "job") : undefined;
      if (job) link(id, job);
    }
    for (const id of consumers) {
      for (const fact of factsAt(id).filter((f) => f.kind === "event.handler")) link(id, fact);
    }

    // Endpoints: pelo handler ancorado; senão, pela chave natural (método e rota).
    const endpoints = this.facts.filter((f) => f.kind === "http.endpoint");
    const byRoute = new Map(endpoints.map((f) => {
      const d = f.data as unknown as HttpEndpointData;
      return [routeKey(d.method, d.path), f];
    }));
    for (const [id, el] of Object.entries(this.elements)) {
      if (el.kind !== "endpoint" || el.protocol !== "http") continue;
      const handler = el.relations.find((r) => r.type === "handledBy")?.target;
      // Ações herdadas ficam todas no símbolo da classe: vale a do handler.
      const symbol = handler ? this.elements[handler]?.anchor?.symbol : undefined;
      const atHandler = handler ? factsAt(handler).filter((f) => f.kind === "http.endpoint") : [];
      const viaHandler = atHandler.find((f) => f.data.handler === symbol) ?? (atHandler.length === 1 ? atHandler[0] : undefined);
      // Rota registrada para qualquer método (view Django sem restrição): casa com o declarado.
      const fact = viaHandler ?? byRoute.get(routeKey(String(el.method), String(el.path))) ?? byRoute.get(routeKey("ALL", String(el.path)));
      if (fact) link(id, fact);
    }

    this.inferByConvention();
  }

  /** Elementos sem âncora casados por nome e tipo dentro do `root` (seção 9.5). */
  private inferByConvention(): void {
    if (!this.input.config.anchors.inferByConvention) return;
    const roots = this.input.model.derived.roots;
    for (const [id, el] of Object.entries(this.elements)) {
      if (el.anchor || this.matches.has(id) || !(el.kind === "entity" || isComponent(el.kind))) continue;
      const root = roots.get(id);
      const candidates = this.facts.filter((f) =>
        !this.matchedFacts.has(f.id) &&
        f.location.symbol === el.name &&
        (el.kind === "entity" ? f.kind === "entity" : f.kind === "controller" || f.kind === "service") &&
        (!root || f.location.file.startsWith(`${root}/`)));
      if (candidates.length > 1) {
        this.report("PL206", "error", `\`${id}\` casa por convenção com ${candidates.length} símbolos; fixe a âncora`, el.source);
        continue;
      }
      const fact = candidates[0];
      if (!fact) continue;
      const file = this.file(fact.location.file);
      const sym = file && findSymbol(file, el.name)[0];
      if (!sym) continue;
      const anchor = this.anchorFor(id, fact.location.file, el.name);
      this.report("PL210", "info", `âncora de \`${id}\` inferida: @"${anchor}" (fixe com \`planta fmt --pin-anchors\`)`, el.source, undefined, { element: id, anchor });
      this.resolved.set(id, { file: fact.location.file, symbol: sym, fingerprint: this.fingerprintOf(id, sym) });
      this.matches.set(id, [fact.id]);
      this.matchedFacts.add(fact.id);
      el.anchor = { raw: `${fact.location.file}#${el.name}`, scheme: "code", path: fact.location.file, symbol: el.name, inferred: true };
    }
  }

  // -------------------------------------------------------------------
  //  Fase 11: validação
  // -------------------------------------------------------------------

  private coverage(): void {
    const { require, warn } = this.input.config.coverage;
    for (const fact of this.facts) {
      if (this.matchedFacts.has(fact.id) || this.reportedFacts.has(fact.id)) continue;
      const level = require.includes(fact.kind) ? "required" : warn.includes(fact.kind) ? "warn" : undefined;
      if (!level) continue;
      const loc = this.codeLoc(fact.location.file, fact.location.line);
      const what = describeFact(fact);
      if (level === "required") this.report("PL301", "error", `cobertura: ${what} não aparece na planta`, loc);
      else this.report("PL302", "warning", `cobertura: ${what} não aparece na planta`, loc);
    }
  }

  private compare(): void {
    for (const [id, el] of Object.entries(this.elements)) {
      if (el.meta.status === "planned") continue;
      const facts = (this.matches.get(id) ?? []).map((f) => this.facts.find((x) => x.id === f)!);
      if (el.kind === "entity" || el.kind === "dto") {
        const fact = facts.find((f) => f.kind === el.kind);
        if (fact) this.compareFields(id, el, fact);
      }
      if (el.kind === "endpoint") {
        const fact = facts.find((f) => f.kind === "http.endpoint");
        if (fact) this.compareEndpoint(id, el, fact);
      }
      if (el.kind === "op") this.compareOp(id, el);
      if (el.kind === "enum") {
        const fact = facts.find((f) => f.kind === "enum");
        if (fact) this.compareEnum(id, el, fact);
      }
    }
  }

  private compareFields(id: string, el: IrElement, fact: Fact): void {
    const declared = el.fields as { name: string; type: IrType; modifiers: Record<string, unknown[]> }[] | undefined;
    if (!declared) return; // sem bloco de campos: nada a comparar (seção 11.4)
    const actual = new Map((fact.data.fields as FieldFact[]).map((f) => [f.name, f]));
    const loc = (f?: FieldFact) => this.codeLoc(fact.location.file, f?.line ?? fact.location.line);

    for (const field of declared) {
      const code = actual.get(field.name);
      actual.delete(field.name);
      if (!code) {
        this.report("PL410", "error", `campo \`${id}.${field.name}\` não existe no código`, el.source, [loc()]);
        continue;
      }
      const type = this.planType(field.type);
      if (!type || code.type === "unknown") continue;
      if (!typesCompatible(type.name, code.type) || type.list !== code.list) {
        this.report("PL411", "error",
          `tipo de \`${id}.${field.name}\` diverge: planta ${showType(type)}, código ${showType({ name: code.type, list: code.list, optional: code.optional })}`,
          el.source, [loc(code)]);
        continue;
      }
      const diffs: string[] = [];
      for (const mod of ["key", "unique"] as const) {
        if ((mod in field.modifiers) !== (mod in code.modifiers)) diffs.push(mod in field.modifiers ? `${mod} só na planta` : `${mod} só no código`);
      }
      if (type.optional !== code.optional) diffs.push(type.optional ? "opcional só na planta" : "opcional só no código");
      if (diffs.length > 0) {
        this.report("PL412", "error", `modificadores de \`${id}.${field.name}\` divergem: ${diffs.join(", ")}`, el.source, [loc(code)]);
      }
    }
    for (const extra of actual.values()) {
      this.report("PL310", "warning", `campo \`${extra.name}\` existe em ${fact.location.symbol} mas não está declarado em \`${id}\``, loc(extra));
    }
  }

  /** PL414: mesmos valores, em qualquer ordem. */
  private compareEnum(id: string, el: IrElement, fact: Fact): void {
    const declared = new Set((el.values as string[] | undefined) ?? []);
    const actual = new Set(fact.data.values as string[]);
    const missing = [...declared].filter((v) => !actual.has(v));
    const extra = [...actual].filter((v) => !declared.has(v));
    if (missing.length === 0 && extra.length === 0) return;
    const parts = [missing.length > 0 && `só na planta: ${missing.join(", ")}`, extra.length > 0 && `só no código: ${extra.join(", ")}`].filter(Boolean);
    this.report("PL414", "error", `valores de \`${id}\` divergem (${parts.join("; ")})`, el.source, [this.codeLoc(fact.location.file, fact.location.line)]);
  }

  private compareEndpoint(id: string, el: IrElement, fact: Fact): void {
    const d = fact.data as unknown as HttpEndpointData;
    const loc = [this.codeLoc(fact.location.file, fact.location.line)];
    const method = d.method === "ALL" ? String(el.method) : d.method;
    if (routeKey(String(el.method), String(el.path)) !== routeKey(method, d.path)) {
      this.report("PL415", "error", `\`${id}\`: planta declara ${el.method} ${el.path}, código registra ${d.method} ${d.path}`, el.source, loc);
      return;
    }
    const body = el.body as IrType | undefined;
    const declared = body && this.planType(body);
    if (declared && d.body && !typesCompatible(declared.name, d.body)) {
      this.report("PL416", "warning", `\`${id}\`: corpo declarado ${declared.name}, código recebe ${d.body}`, el.source, loc);
    }
  }

  private compareOp(id: string, el: IrElement): void {
    const code = this.resolved.get(id);
    // Linguagens tipadas: em Python, `self`, `request` e `pk=None` não dizem o contrato da operação.
    if (!code || (code.symbol.kind !== "method" && code.symbol.kind !== "function")) return;
    const sig = operationShape(code.symbol);
    if (!sig) return;
    // Handler com assinatura imposta pelo framework (route handler do Next.js).
    if (this.facts.some((f) => f.data.frameworkHandler && f.location.file === code.file && f.location.symbol === code.symbol.name)) return;
    const params = sig.params;
    const declared = (el.params as { name: string; type: IrType }[]) ?? [];
    const loc = [this.codeLoc(code.file, code.symbol.range.start[0] + 1)];

    if (params.length !== declared.length) {
      this.report("PL417", "error", `\`${id}\`: planta declara ${declared.length} parâmetro(s), código tem ${params.length}`, el.source, loc);
      return;
    }
    declared.forEach((p, i) => {
      const shape = params[i]!;
      const type = this.planType(p.type);
      if (type && !typesCompatible(type.name, shape.planta)) {
        this.report("PL417", "error", `\`${id}\`: parâmetro ${p.name} é ${type.name} na planta e ${shape.base} no código`, el.source, loc);
      }
    });
    const returns = el.returns as IrType | undefined;
    const declaredReturn = returns && this.planType(returns);
    if (declaredReturn) {
      const shape = sig.returns;
      const actual = shape.planta;
      if (!typesCompatible(declaredReturn.name, actual) || (actual !== "unknown" && declaredReturn.list !== shape.list)) {
        this.report("PL417", "error", `\`${id}\`: retorno é ${showType(declaredReturn)} na planta e ${shape.base}${shape.list ? "[]" : ""} no código`, el.source, loc);
      }
    }
  }

  /**
   * Tipo da planta no vocabulário do código: primitivos ficam como estão;
   * referências a elementos viram o nome do símbolo ancorado.
   */
  private planType(type: IrType): { name: string; list: boolean; optional: boolean } | undefined {
    if (!("ref" in type)) return undefined; // Map: sem comparação por enquanto
    const target = this.elements[type.ref];
    const name = target ? (target.anchor?.symbol?.split(".").at(-1) ?? target.name) : type.ref;
    return { name, list: !!type.list, optional: !!type.optional };
  }

  /** PL420/PL421: `uses` declarado contra a injeção de dependência real. */
  private dependencies(): void {
    const di = this.facts.filter((f) => f.kind === "di");
    const byName = new Map<string, string[]>();
    for (const [id, r] of this.resolved) {
      if (!isComponent(this.elements[id]!.kind)) continue;
      byName.set(r.symbol.name, [...(byName.get(r.symbol.name) ?? []), id]);
    }

    for (const [id, el] of Object.entries(this.elements)) {
      const r = this.resolved.get(id);
      if (!r || !isComponent(el.kind) || !(this.matches.get(id) ?? []).some((f) => f.startsWith("controller:") || f.startsWith("service:"))) continue;
      const declared = new Set(el.relations.filter((x) => x.type === "uses").map((x) => x.target));
      const real = di.filter((f) => f.location.file === r.file && f.data.consumer === r.symbol.name);

      for (const fact of real) {
        // Provedor sem elemento na planta (EventEmitter2, ConfigService...): não é dependência arquitetural.
        const providers = byName.get(String(fact.data.provider)) ?? [];
        if (providers.length !== 1 || declared.has(providers[0]!)) continue;
        this.report("PL420", "warning",
          `\`${id}\` depende de \`${providers[0]}\` (injeção no construtor), mas não declara \`uses ${this.elements[providers[0]!]!.name}\``,
          el.source, [this.codeLoc(r.file, fact.location.line)], { element: id, uses: providers[0]! });
      }
      for (const target of declared) {
        const t = this.resolved.get(target);
        if (!t || !isComponent(this.elements[target]!.kind)) continue;
        if (!real.some((f) => f.data.provider === t.symbol.name)) {
          this.report("PL421", "warning", `\`${id}\` declara \`uses ${this.elements[target]!.name}\`, mas o código não injeta essa dependência`, el.source);
        }
      }
    }
  }

  // -------------------------------------------------------------------
  //  Rastreabilidade (seção 14)
  // -------------------------------------------------------------------

  /** Requisitos e decisões em Markdown, âncoras `md:` e as referências a eles (PL6xx). */
  private traceability(): void {
    const { config } = this.input;
    const configured = new Set<string>();

    for (const ext of config.extractors) {
      const spec = DOC_EXTRACTORS[ext.use];
      if (!spec) continue;
      configured.add(spec.prefix);
      const paths = Array.isArray(ext.paths) ? ext.paths.map(String) : ["docs/**/*.md"];
      const pattern = new RegExp(typeof ext.idPattern === "string" ? ext.idPattern : spec.idPattern);
      const files = [...new Set(paths.flatMap((p) => globSync(p, { cwd: config.projectRoot })))].sort();
      for (const file of files) {
        const doc = parseMarkdown(file, readFileSync(join(config.projectRoot, file), "utf8"));
        for (const item of discover(doc, pattern, spec.kind)) this.addRequirement(spec.prefix + item.id, item);
      }
    }

    // `requirement Nome @"md:..."` e `decision Nome @"md:..."` declarados na planta.
    for (const [id, el] of Object.entries(this.elements)) {
      if ((el.kind !== "requirement" && el.kind !== "decision") || el.anchor?.scheme !== "md" || !el.anchor.path) continue;
      const abs = join(config.projectRoot, el.anchor.path);
      if (!existsSync(abs)) {
        this.report("PL202", "error", `arquivo da âncora não existe: ${el.anchor.path}`, el.source);
        continue;
      }
      const doc = parseMarkdown(el.anchor.path, readFileSync(abs, "utf8"));
      const item = sectionFor(doc, el.anchor.symbol, id, el.kind);
      if (!item) {
        this.report("PL201", "error", `âncora não resolve: seção \`#${el.anchor.symbol}\` não existe em ${el.anchor.path}`, el.source);
        continue;
      }
      this.addRequirement(id, { ...item, ...(el.title !== undefined && { title: String(el.title) }) });
    }

    for (const [id, el] of Object.entries(this.elements)) {
      for (const r of el.relations) {
        if (r.type !== "justifiedBy" && r.type !== "decidedBy") continue;
        const req = this.requirements.get(r.target);
        if (req) {
          req.justifiedBy.push(id);
          if (req.kind === "decision" && req.attributes.status === "superseded") {
            this.report("PL612", "warning", `\`${id}\` cita a decisão ${displayKey(r.target)}, marcada como substituída`, el.source);
          }
          continue;
        }
        // Sem extrator configurado não há como saber se o ID existe.
        const prefix = /^(req|adr):/.exec(r.target)?.[0];
        if (prefix && configured.has(prefix)) {
          const what = prefix === "req:" ? "requisito" : "decisão";
          this.report("PL601", "error", `\`${id}\` cita ${what} ${displayKey(r.target)}, que não existe nos documentos`, el.source);
        }
      }
    }

    for (const req of this.requirements.values()) {
      if (req.kind === "requirement" && req.justifiedBy.length === 0) {
        this.report("PL610", "warning", `${displayKey(req.key)} (${req.title}) não é justificado por nenhum elemento`, this.codeLoc(req.file, req.line));
      }
    }
  }

  private addRequirement(key: string, item: DocItem): void {
    const existing = this.requirements.get(key);
    if (existing) {
      this.report("PL602", "error", `ID ${displayKey(key)} repetido nos documentos`, this.codeLoc(item.file, item.line), [this.codeLoc(existing.file, existing.line)]);
      return;
    }
    this.requirements.set(key, { ...item, key, justifiedBy: [] });
    this.facts.push({
      id: `doc.section:${key}`,
      kind: "doc.section",
      extractor: item.kind === "requirement" ? "markdown-requirements" : "markdown-decisions",
      location: { file: item.file, line: item.line },
      data: { id: item.id, title: item.title, ...(item.slug && { slug: item.slug }), textHash: item.fingerprint },
    });
  }

  /** Impressão atual de cada requisito que justifica o elemento. */
  private requirementsOf(id: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const r of this.elements[id]!.relations) {
      const req = (r.type === "justifiedBy" || r.type === "decidedBy") && this.requirements.get(r.target);
      if (req) result[displayKey(req.key)] = req.fingerprint;
    }
    return result;
  }

  /** PL401–PL404 e PL611 contra o `planta.lock` (seções 12.3 e 14.2). */
  private drift(): void {
    const { lock, config } = this.input;

    for (const [id, r] of this.resolved) {
      this.addReviewable({ id, anchor: `${r.file}#${r.symbol.name}`, file: r.file, line: r.symbol.range.start[0] + 1, ...r.fingerprint });
    }
    for (const [id, factIds] of this.matches) {
      const el = this.elements[id]!;
      if (el.kind !== "endpoint") continue;
      const fact = this.facts.find((f) => f.id === factIds[0]);
      if (!fact?.fingerprint) continue;
      const d = fact.data as unknown as HttpEndpointData;
      this.addReviewable({
        id,
        natural: `${d.method} ${d.path}`,
        file: fact.location.file,
        line: fact.location.line ?? 1,
        signature: fact.fingerprint.signature,
        signatureText: fact.fingerprint.signatureText ?? "",
      });
    }

    // Recursos de IaC: a revisão congela o que o bloco declara (atributos e blocos internos).
    for (const [id, factIds] of this.matches) {
      const el = this.elements[id]!;
      if (el.kind !== "node" && el.kind !== "group") continue;
      const fact = this.facts.find((f) => f.id === factIds[0] && f.kind === "iac.resource");
      if (!fact?.fingerprint) continue;
      this.addReviewable({
        id,
        anchor: el.anchor?.raw ?? String(fact.data.address),
        file: fact.location.file,
        line: fact.location.line ?? 1,
        signature: fact.fingerprint.signature,
        signatureText: fact.fingerprint.signatureText ?? "",
      });
    }

    // Elementos sem código (processos, páginas sem âncora...) entram no ciclo de
    // revisão pelos requisitos que os justificam.
    for (const [id, el] of Object.entries(this.elements)) {
      if (this.reviewables.has(id) || Object.keys(this.requirementsOf(id)).length === 0) continue;
      const file = relative(this.input.config.projectRoot, resolve(this.input.cwd, el.source.file));
      this.addReviewable({ id, file, line: el.source.line, signatureText: "" });
    }

    const changedRequirements = new Map<string, string[]>();
    for (const item of this.reviewables.values()) {
      const el = this.elements[item.id]!;
      if (this.ignores(item.id, "drift") || el.meta.status === "planned") continue;
      for (const key of item.requirementsChanged) changedRequirements.set(key, [...(changedRequirements.get(key) ?? []), item.id]);
      if (item.state === "new") {
        this.report("PL403", "warning", `\`${item.id}\` nunca foi revisado (\`planta accept ${item.id}\`)`, el.source);
        continue;
      }
      const entry = lock.elements.get(item.id)!;
      if (item.signatureChanged) {
        this.report("PL401", config.drift.signatureChange,
          `\`${item.id}\`: assinatura alterada desde a revisão de ${entry.reviewed.at.slice(0, 10)} (\`planta review\`)`,
          el.source, [this.codeLoc(item.file, item.line)]);
      } else if (item.bodyChanged) {
        this.report("PL402", config.drift.bodyChange, `\`${item.id}\`: implementação alterada desde a revisão`, el.source, [this.codeLoc(item.file, item.line)]);
      }
    }

    for (const [key, ids] of changedRequirements) {
      const req = [...this.requirements.values()].find((r) => displayKey(r.key) === key)!;
      const list = ids.sort().map((x) => `\`${x}\``).join(", ");
      this.report("PL611", config.drift.requirementChange,
        `${key} (${req.title}) mudou desde a última revisão de ${ids.length === 1 ? "1 elemento" : `${ids.length} elementos`}: ${list}`,
        this.codeLoc(req.file, req.line));
    }

    for (const [id] of lock.elements) {
      if (!this.elements[id]) {
        this.report("PL404", "warning", `entrada \`${id}\` no planta.lock para elemento que não existe mais (\`planta lock --prune\`)`, {
          file: "planta.lock", line: 1, column: 1,
        });
      }
    }
  }

  private addReviewable(item: Omit<Reviewable, "state" | "signatureChanged" | "bodyChanged" | "requirements" | "requirementsChanged" | "requirementsAdded">): void {
    const entry: LockEntry | undefined = this.input.lock.elements.get(item.id);
    const requirements = this.requirementsOf(item.id);
    const signatureChanged = !!entry && item.signature !== undefined && entry.signature !== item.signature;
    const bodyChanged = !!entry && entry.body !== undefined && item.body !== undefined && entry.body !== item.body;
    const requirementsChanged = entry
      ? Object.keys(requirements).filter((k) => entry.requirements?.[k] !== undefined && entry.requirements[k] !== requirements[k])
      : [];
    // Vínculo novo não é mudança de texto (não gera PL611), mas deixa o elemento
    // pendente: sem isso, a impressão do requisito nunca chegaria ao lock.
    const requirementsAdded = entry ? Object.keys(requirements).filter((k) => entry.requirements?.[k] === undefined) : [];
    const pending = signatureChanged || bodyChanged || requirementsChanged.length > 0 || requirementsAdded.length > 0;
    this.reviewables.set(item.id, {
      ...item,
      requirements,
      requirementsChanged,
      requirementsAdded,
      state: !entry ? "new" : pending ? "changed" : "reviewed",
      signatureChanged,
      bodyChanged,
    });
  }

  /** Grava no IR o que as fases 8–10 descobriram (seção 8.4). */
  private annotateIr(): void {
    const ir = this.input.model.ir as typeof this.input.model.ir & { facts?: unknown; matches?: unknown };
    for (const [id, r] of this.resolved) {
      const el = this.elements[id]!;
      if (!el.anchor) continue;
      Object.assign(el.anchor, {
        resolved: {
          language: r.symbol.language,
          file: r.file,
          symbolKind: r.symbol.kind,
          range: r.symbol.range,
          fingerprint: { signature: r.fingerprint.signature, body: r.fingerprint.body },
        },
      });
    }
    ir.requirements = Object.fromEntries([...this.requirements.values()].sort((a, b) => a.key.localeCompare(b.key)).map((r) => [r.key, {
      kind: r.kind,
      id: r.id,
      title: r.title,
      ...(Object.keys(r.attributes).length > 0 && { attributes: r.attributes }),
      anchor: { scheme: "md", path: r.file, line: r.line, ...(r.slug && { section: r.slug }) },
      fingerprint: r.fingerprint,
      text: r.display,
      justifiedBy: r.justifiedBy,
    }]));
    ir.facts = { count: this.facts.length };
    ir.matches = Object.fromEntries([...this.matches].sort(([a], [b]) => a.localeCompare(b)));
  }
}

// ---------------------------------------------------------------------

/** Operações declaradas na planta para um componente, pelo nome do método. */
export function trackedMembers(elements: Record<string, IrElement>, id: string): Set<string> {
  return new Set(Object.values(elements).filter((e) => e.parent === id && e.kind === "op").map((e) => e.anchor?.symbol?.split(".").at(-1) ?? e.name));
}

function isComponent(kind: string): boolean {
  return ["service", "controller", "repository", "gateway", "middleware", "guard", "component", "page", "store"].includes(kind);
}

function describeFact(fact: Fact): string {
  const d = fact.data;
  switch (fact.kind) {
    case "http.endpoint": return `rota ${d.method} ${d.path} (${d.handler})`;
    case "entity": return `entidade ${fact.location.symbol}`;
    case "event.handler": return `consumidor do evento "${d.event}" (${d.handler})`;
    case "job": return `job "${d.cron}" (${d.handler})`;
    case "ui.route": return `rota de frontend ${d.path} (${d.component})`;
    case "ui.component": return `componente ${d.name}`;
    case "ui.store": return `store ${d.name}`;
    case "iac.resource": return `recurso ${d.address} (${d.type})`;
    default: return `${fact.kind} ${fact.location.symbol ?? ""}`.trim();
  }
}

const STRINGISH = new Set(["string", "text", "email", "url", "uuid"]);
const TEMPORAL = new Set(["date", "time", "datetime"]);

/**
 * Comparação tolerante (seção 11.4): o código muitas vezes diz menos que a
 * planta (`string` do TypeScript não distingue `uuid` de `email`).
 */
export function typesCompatible(declared: string, actual: string): boolean {
  if (actual === "unknown" || declared === actual) return true;
  if (actual === "string" && STRINGISH.has(declared)) return true;
  if (actual === "text" && declared === "string") return true;
  if (actual === "datetime" && TEMPORAL.has(declared)) return true;
  if (actual === "void" && declared === "void") return true;
  return false;
}

interface TypeShapeInPlanta { base: string; planta: string; list: boolean }

/** Parâmetros e retorno de um método em linguagem tipada (TypeScript, Java); `undefined` nas outras. */
function operationShape(sym: CodeSymbol): { params: TypeShapeInPlanta[]; returns: TypeShapeInPlanta } | undefined {
  if (sym.language === "typescript") {
    const shape = (t: ReturnType<typeof describeType>) => ({ base: t.base, planta: tsToPlanta(t.base), list: t.list });
    const params = (sym.node.childForFieldName("parameters")?.namedChildren ?? []).filter((p) => p?.type.endsWith("_parameter"));
    return { params: params.map((p) => shape(describeType(p!.childForFieldName("type")))), returns: shape(describeType(sym.node.childForFieldName("return_type"))) };
  }
  if (sym.language === "java") {
    const params = (sym.node.childForFieldName("parameters")?.namedChildren ?? []).filter((p) => p?.type === "formal_parameter");
    return { params: params.map((p) => javaShape(p!.childForFieldName("type"))), returns: javaShape(sym.node.childForFieldName("type")) };
  }
  return undefined;
}

/** `List<Cliente>` → lista de Cliente; `Optional<X>`, `ResponseEntity<X>`, `Mono<X>` → X. */
function javaShape(type: Node | null): TypeShapeInPlanta {
  if (!type) return { base: "unknown", planta: "unknown", list: false };
  const outer = simpleType(type);
  if (type.type === "generic_type") {
    const arg = type.namedChildren[1]?.namedChildren[0] ?? null;
    if (["List", "Set", "Collection", "Iterable", "Flux"].includes(outer)) return { ...javaShape(arg), list: true };
    if (["Optional", "ResponseEntity", "Mono", "CompletableFuture"].includes(outer)) return javaShape(arg);
    return { base: outer, planta: "unknown", list: false };
  }
  if (type.type === "void_type") return { base: "void", planta: "void", list: false };
  const planta = javaToPlanta(outer);
  return { base: outer, planta: outer === "Object" ? "unknown" : planta, list: false };
}

/** Tipo TypeScript (já sem `Promise`, lista e nulidade) no vocabulário Planta. */
function tsToPlanta(base: string): string {
  switch (base) {
    case "string": return "string";
    case "boolean": return "bool";
    case "Date": return "datetime";
    case "void": return "void";
    case "number":
    case "any":
    case "unknown":
    case "object":
      return "unknown";
    default:
      return /^[A-Z]/.test(base) ? base : "unknown";
  }
}

function showType(t: { name: string; list: boolean; optional: boolean }): string {
  return `${t.name}${t.list ? "[]" : ""}${t.optional ? "?" : ""}`;
}
