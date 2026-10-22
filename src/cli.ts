// Interface de linha de comando (seção 16).
//
// Códigos de saída (seção 11.7): 0 sem erros, 1 com erros, 2 falha de execução.

import { createRequire } from "node:module";
import { existsSync, globSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { type CheckResult, displayKey, type Requirement, type Reviewable, trackedMembers } from "./check.ts";
import { CodeParser, findSymbol, fingerprint } from "./code/index.ts";
import { parseMarkdown, sectionFor } from "./docs/markdown.ts";
import { ConfigError } from "./config.ts";
import type { Diagnostic } from "./diagnostics.ts";
import { format } from "./format.ts";
import { changedSince, headCommit, repoRoot, showFile, userEmail } from "./git.ts";
import { LockError, writeLock } from "./lock.ts";
import { loadProject as load, plantaFiles, type Project, ProjectError, verify as verifyProject } from "./project.ts";
import { allViews, extractedFields, type Format, inject, type Rendered, renderViews } from "./render/index.ts";
import { D2_KINDS } from "./render/d2.ts";
import { declaredViews } from "./render/views.ts";
import { diffModels, renderDiffMarkdown, renderDiffText } from "./diff.ts";
import { lineDiff } from "./text.ts";
import { snapshotAt } from "./snapshot.ts";
import { checkReviewPolicy, PolicyError } from "./policy.ts";
import { applySeverity } from "./severity.ts";
import { PluginError } from "./plugins.ts";
import { toMarkdown, toSarif } from "./report.ts";
import { suggest, uncovered } from "./suggest.ts";
import { serveMcp } from "./mcp.ts";
import { serveLsp } from "./lsp/server.ts";
import { applyEdits, pinAnchor } from "./lsp/edits.ts";
import { toOpenApi } from "./export/openapi.ts";
import { toStructurizr } from "./export/structurizr.ts";
import { elementContext, query, QueryError, search, summaryLine } from "./context.ts";
import { githubWorkflow } from "./ci/github.ts";
import { impact, injectTrace, renderImpact, traceRows, traceTable } from "./trace.ts";
import { buildSite } from "./viewer/site.ts";
import { createServer } from "node:http";

/** Versão do `package.json` (um nível acima, tanto em `src/` quanto em `dist/`). */
export const VERSION: string = createRequire(import.meta.url)("../package.json").version;

export interface Io {
  cwd: string;
  out: (text: string) => void;
  err: (text: string) => void;
  env?: Record<string, string | undefined>;
}

const defaultIo: Io = {
  cwd: process.cwd(),
  out: (t) => process.stdout.write(t),
  err: (t) => process.stderr.write(t),
  env: process.env,
};

const HELP = `planta ${VERSION}

Uso:
  planta check [--fast] [--base REF] [--dir planta] [--format text|json|sarif|markdown]
      Verifica a planta contra o código. Com --fast, só as fases 1–7
      (sintaxe, nomes, referências), sem ler o código. Com --base, também
      verifica a política de aceite nos commits desde REF (PL405).
      Grava <dir>/.gerado/modelo.json.
  planta review [--dir planta]
      Lista elementos novos e alterados desde a última revisão.
  planta accept <ID...> | --all | --changed-since REF  [--dir planta]
      Marca elementos como revisados no planta.lock.
  planta lock --prune [--dir planta]
      Remove do lock entradas de elementos que não existem mais.
  planta render [VIEW...] [--auto] [--fast] [--format mermaid|d2] [--dir planta]
      Gera diagramas em <dir>/.gerado/diagramas. Sem VIEW, as views
      declaradas (ou o conjunto automático, se não houver nenhuma). Com
      --format d2, deployments com ícones do provedor (.d2).
  planta render --inject GLOB [--check] [--fast] [--dir planta]
      Atualiza os diagramas entre <!-- planta:view X --> e <!-- /planta:view -->.
  planta trace [--format markdown|csv|html] [--dir planta]
      Matriz de rastreabilidade: requisito → processos, endpoints, operações, páginas.
  planta trace --inject GLOB [--check] [--dir planta]
      Preenche os blocos <!-- planta:trace --> dos arquivos de requisitos.
  planta impact <ID> [--dir planta]
      Elementos que dependem de um elemento ou de um requisito (REQ-001).
  planta suggest [--fact ID | --uncovered] [--dir planta]
      Declarações Planta para fatos do código que a planta não descreve.
  planta diff <REF> [REF2] [--format text|markdown|json] [--dir planta]
      Diff arquitetural entre REF e a árvore de trabalho (ou REF2).
  planta query "<seletor>" [--dir planta]
      Elementos por seletor: *, Vendas.*, ID, every endpoint where tag = publico.
  planta context <ID | REQ-001 | "descrição da tarefa"> [--dir planta]
      Contexto compacto em texto, como o servidor MCP entrega a agentes.
  planta mcp [--dir planta]
      Servidor MCP (stdio) para agentes de IA. Não expõe aceite.
  planta lsp [--stdio] [--dir planta]
      Servidor de linguagem (LSP) para editores: diagnósticos, completar,
      navegação, ações rápidas e CodeLens no código.
  planta ci github [--write] [--docs GLOB] [--dir planta]
      Workflow do GitHub Actions: anotações, política de aceite e diff no PR.
  planta serve [--port 4321] [--fast] [--dir planta]
      Visualizador web local, recalculado a cada recarga da página.
  planta export --format structurizr|openapi|json [--out ARQUIVO] [--fast] [--dir planta]
      Exporta o modelo: Structurizr DSL (C4 e deployment), OpenAPI 3.1 das
      APIs HTTP ou o IR (modelo.json). Sem --out, na saída padrão.
  planta export-site [--out <dir>/.gerado/site] [--fast] [--dir planta]
      Grava o visualizador como site estático (index.html).
  planta fmt [--check] [--pin-anchors] [arquivos ou pastas...]
      Formata arquivos .planta (padrão: a pasta planta/). Com --pin-anchors,
      antes escreve na planta as âncoras inferidas por convenção (PL210).
  planta --version
`;

/** Falha de execução: vira código de saída 2, não diagnóstico. */
class UsageError extends Error {}

export async function main(argv: string[], io: Io = defaultIo): Promise<number> {
  try {
    const [command, ...rest] = argv;
    switch (command) {
      case "check":
        return await check(rest, io);
      case "review":
        return await review(rest, io);
      case "accept":
        return await accept(rest, io);
      case "lock":
        return lock(rest, io);
      case "render":
        return await render(rest, io);
      case "serve":
        return await serve(rest, io);
      case "trace":
        return await trace(rest, io);
      case "impact":
        return await impactCommand(rest, io);
      case "diff":
        return await diff(rest, io);
      case "suggest":
        return await suggestCommand(rest, io);
      case "query":
        return queryCommand(rest, io);
      case "context":
        return await contextCommand(rest, io);
      case "mcp": {
        const { values } = parseArgs({ args: rest, options: DIR_OPTION });
        loadProject(values.dir, io); // falha cedo, com mensagem, se a pasta não existe
        await serveMcp({ dir: values.dir, cwd: io.cwd, version: VERSION }, process.stdin, process.stdout);
        return 0;
      }
      case "lsp": {
        // `--stdio` é o que os clientes de LSP passam; stdio é o único transporte.
        const { values } = parseArgs({ args: rest, options: { dir: { type: "string" }, stdio: { type: "boolean" } } });
        serveLsp({ ...(values.dir && { dir: values.dir }), version: VERSION });
        await new Promise(() => {}); // o servidor encerra o processo no `exit`
        return 0;
      }
      case "ci":
        return ci(rest, io);
      case "export":
        return await exportCommand(rest, io);
      case "export-site":
        return await exportSite(rest, io);
      case "fmt":
        return await fmt(rest, io);
      case "--version":
      case "-v":
        io.out(`${VERSION}\n`);
        return 0;
      case undefined:
      case "help":
      case "--help":
      case "-h":
        io.out(HELP);
        return 0;
      default:
        throw new UsageError(`comando desconhecido: ${command}`);
    }
  } catch (e) {
    const usage = e instanceof UsageError || e instanceof ProjectError || e instanceof PolicyError || e instanceof QueryError || e instanceof ConfigError || e instanceof LockError || e instanceof PluginError || (e instanceof TypeError && "code" in e);
    if (!usage) throw e;
    io.err(`planta: ${(e as Error).message}\n${e instanceof UsageError || e instanceof TypeError ? `\n${HELP}` : ""}`);
    return 2;
  }
}

// ---------------------------------------------------------------------
//  Projeto
// ---------------------------------------------------------------------

function loadProject(dirOption: string, io: Io): Project {
  return load(dirOption, io.cwd);
}

async function verify(project: Project, _io: Io): Promise<CheckResult> {
  return verifyProject(project);
}

const DIR_OPTION = { dir: { type: "string", default: "planta" } } as const;

// ---------------------------------------------------------------------
//  check
// ---------------------------------------------------------------------

async function check(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: { ...DIR_OPTION, fast: { type: "boolean", default: false }, format: { type: "string", default: "text" }, base: { type: "string" } },
  });
  if (!["text", "json", "sarif", "markdown"].includes(values.format)) throw new UsageError(`formato desconhecido: ${values.format}`);

  const project = loadProject(values.dir, io);
  const result = values.fast ? undefined : await verify(project, io);

  const generated = join(project.dir, ".gerado");
  mkdirSync(generated, { recursive: true });
  // A pasta é reconstruída a cada execução e não deve ir para o git (seção 4.2).
  writeFileSync(join(generated, ".gitignore"), "*\n");
  writeFileSync(join(generated, "modelo.json"), JSON.stringify(project.model.ir, null, 2) + "\n");

  const policy = values.base ? checkReviewPolicy(project, values.base) : [];
  const diagnostics = applySeverity([...project.model.diagnostics, ...(result?.diagnostics ?? []), ...policy], project.config, project.cwd).sort(byLocation);
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  if (values.format === "json") {
    io.out(JSON.stringify({ diagnostics }, null, 2) + "\n");
    return errors > 0 ? 1 : 0;
  }
  if (values.format === "sarif") {
    const root = repoRoot(io.cwd);
    io.out(toSarif(diagnostics, { version: VERSION, cwd: io.cwd, ...(root && { repoRoot: root }) }));
    return errors > 0 ? 1 : 0;
  }
  if (values.format === "markdown") {
    io.out(toMarkdown(diagnostics));
    return errors > 0 ? 1 : 0;
  }

  const { ir } = project.model;
  const system = ir.system ? ` · sistema ${ir.system.id}` : "";
  const facts = result ? ` · ${plural(result.facts.length, "fato")}` : "";
  io.out(`Planta ${VERSION}${system} · ${plural(project.files.length, "arquivo")} · ${plural(Object.keys(ir.elements).length, "elemento")}${facts}\n\n`);
  for (const d of diagnostics) io.out(renderDiagnostic(d));
  const warnings = diagnostics.filter((d) => d.severity === "warning").length;
  io.out(`${diagnostics.length > 0 ? "\n" : ""}${plural(errors, "erro")} · ${plural(warnings, "aviso")}\n`);
  return errors > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------
//  review, accept, lock
// ---------------------------------------------------------------------

async function review(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args: argv, options: DIR_OPTION });
  const project = loadProject(values.dir, io);
  const result = await verify(project, io);
  const pending = [...result.reviewables.values()]
    .filter((r) => r.state !== "reviewed")
    .sort((a, b) => a.id.localeCompare(b.id));

  if (pending.length === 0) {
    io.out("Nada pendente de revisão.\n");
    return 0;
  }
  const parser = await CodeParser.create();
  for (const item of pending) {
    const what = item.state === "new" ? "novo"
      : item.signatureChanged ? "assinatura alterada"
      : item.bodyChanged ? "implementação alterada"
      : item.requirementsChanged.length > 0 ? "requisito alterado"
      : "vínculo novo com requisito";
    io.out(`${item.id.padEnd(52)} ${what}\n`);
    if (item.signatureText && (item.state === "new" || item.signatureChanged)) {
      const before = item.state === "changed" ? previousSignature(project, item, parser) : undefined;
      const lines = before !== undefined ? lineDiff(before, item.signatureText) : item.signatureText.split("\n").map((l) => `    ${l}`);
      for (const l of lines) io.out(`${l}\n`);
    }
    for (const key of item.requirementsChanged) {
      const req = [...result.requirements.values()].find((r) => displayKey(r.key) === key)!;
      io.out(`  ${key} ${req.title}: texto alterado desde a revisão\n`);
      const before = previousRequirement(project, item.id, req);
      if (before !== undefined) for (const l of lineDiff(before, req.display, 1)) io.out(`  ${l}\n`);
    }
    for (const key of item.requirementsAdded) io.out(`  justifiedBy ${key} (vínculo novo desde a revisão)\n`);
    const unchanged = Object.keys(item.requirements).filter((k) => !item.requirementsChanged.includes(k) && !item.requirementsAdded.includes(k));
    if (unchanged.length > 0) io.out(`  justifiedBy ${unchanged.join(", ")} (sem mudança)\n`);
    io.out("\n");
  }
  io.out(`${plural(pending.length, "elemento")} pendente${pending.length === 1 ? "" : "s"} · planta accept <ID> ou planta accept --all\n`);
  return 0;
}

/** Assinatura no commit da última revisão, para o diff de `planta review` (seção 24.3). */
function previousSignature(project: Project, item: Reviewable, parser: CodeParser): string | undefined {
  const entry = project.lock.elements.get(item.id);
  if (!entry?.reviewed.commit || !entry.anchor) return undefined;
  const [path, symbol] = entry.anchor.split("#");
  const root = repoRoot(project.config.projectRoot);
  if (!path || !symbol || !root) return undefined;
  const text = showFile(root, entry.reviewed.commit, relative(root, join(realpathSync(project.config.projectRoot), path)));
  if (text === undefined) return undefined;
  const sym = findSymbol(parser.parse(path, text), symbol)[0];
  return sym && fingerprint(sym, { membersByName: trackedMembers(project.model.ir.elements, item.id) }).signatureText;
}

/** Texto do requisito no commit em que o elemento foi revisado, para o diff (seção 14.2). */
function previousRequirement(project: Project, id: string, req: Requirement): string | undefined {
  const commit = project.lock.elements.get(id)?.reviewed.commit;
  const root = repoRoot(project.config.projectRoot);
  if (!commit || !root) return undefined;
  const text = showFile(root, commit, relative(root, join(realpathSync(project.config.projectRoot), req.file)));
  if (text === undefined) return undefined;
  const doc = parseMarkdown(req.file, text);
  if (req.slug) return sectionFor(doc, req.slug, req.id, req.kind)?.display;
  // Requisito por front matter: o arquivo inteiro.
  return sectionFor(doc, undefined, req.id, req.kind)?.display;
}

async function accept(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { ...DIR_OPTION, all: { type: "boolean", default: false }, "changed-since": { type: "string" } },
  });
  const env = io.env ?? {};
  const project = loadProject(values.dir, io);

  // Só um humano fecha o ciclo (seção 12.6).
  if (project.config.review.forbidAgentAccept && env.PLANTA_AGENT === "1") {
    throw new PolicyError("aceite recusado: execução por agente (PLANTA_AGENT=1) e review.forbidAgentAccept está ativo");
  }
  const reviewer = env.PLANTA_REVIEWER || userEmail(io.cwd);
  if (!reviewer) throw new UsageError("não sei quem está revisando: defina PLANTA_REVIEWER ou `git config user.email`");

  const selectors = [positionals.length > 0, values.all, values["changed-since"] !== undefined].filter(Boolean).length;
  if (selectors !== 1) throw new UsageError("informe IDs, --all ou --changed-since REF");

  const reviewables = (await verify(project, io)).reviewables;
  let selected: Reviewable[];
  if (values.all) {
    selected = [...reviewables.values()].filter((r) => r.state !== "reviewed");
  } else if (values["changed-since"] !== undefined) {
    selected = changedReviewables(project, reviewables, values["changed-since"], io);
  } else {
    const unknown = positionals.filter((id) => !reviewables.has(id));
    if (unknown.length > 0) throw new UsageError(`não há o que revisar em: ${unknown.join(", ")} (elemento sem código ancorado?)`);
    selected = positionals.map((id) => reviewables.get(id)!);
  }

  const at = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const commit = headCommit(io.cwd);
  for (const r of selected) {
    project.lock.elements.set(r.id, {
      ...(r.anchor && { anchor: r.anchor }),
      ...(r.natural && { natural: r.natural }),
      ...(r.signature && { signature: r.signature }),
      ...(r.body && { body: r.body }),
      ...(Object.keys(r.requirements).length > 0 && { requirements: r.requirements }),
      reviewed: { by: reviewer, at, ...(commit && { commit }) },
    });
    io.out(`aceito: ${r.id}\n`);
  }
  writeLock(project.dir, project.lock);
  io.out(`${plural(selected.length, "elemento")} revisado${selected.length === 1 ? "" : "s"} por ${reviewer}\n`);
  return 0;
}

/** Pendentes cujo código ou declaração na planta mudou desde `ref`. */
function changedReviewables(project: Project, reviewables: Map<string, Reviewable>, ref: string, io: Io): Reviewable[] {
  const root = repoRoot(io.cwd);
  const changed = root && changedSince(root, ref);
  if (!root || !changed) throw new UsageError(`não consegui comparar com \`${ref}\` no git`);
  // O git devolve caminhos reais; `/var` → `/private/var` no macOS, por exemplo.
  const projectRoot = realpathSync(project.config.projectRoot);
  const cwd = realpathSync(io.cwd);
  return [...reviewables.values()].filter((r) => {
    if (r.state === "reviewed") return false;
    const code = relative(root, join(projectRoot, r.file));
    const plantaFile = project.model.ir.elements[r.id]?.source.file;
    return changed.has(code) || (plantaFile !== undefined && changed.has(relative(root, resolve(cwd, plantaFile))));
  });
}

function lock(argv: string[], io: Io): number {
  const { values } = parseArgs({ args: argv, options: { ...DIR_OPTION, prune: { type: "boolean", default: false } } });
  if (!values.prune) throw new UsageError("use `planta lock --prune`");
  const project = loadProject(values.dir, io);
  const removed = [...project.lock.elements.keys()].filter((id) => !project.model.ir.elements[id]);
  for (const id of removed) {
    project.lock.elements.delete(id);
    io.out(`removido: ${id}\n`);
  }
  writeLock(project.dir, project.lock);
  io.out(`${plural(removed.length, "entrada")} removida${removed.length === 1 ? "" : "s"}\n`);
  return 0;
}

// ---------------------------------------------------------------------
//  render
// ---------------------------------------------------------------------

async function render(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      ...DIR_OPTION,
      auto: { type: "boolean", default: false },
      fast: { type: "boolean", default: false },
      inject: { type: "string", multiple: true },
      check: { type: "boolean", default: false },
      format: { type: "string", default: "mermaid" },
    },
  });
  if (values.format !== "mermaid" && values.format !== "d2") throw new UsageError(`formato desconhecido: ${values.format}`);
  const format: Format = values.format;
  if (format === "d2" && values.inject) throw new UsageError("--inject gera Mermaid (é o que o GitHub e o GitLab desenham); --format d2 grava arquivos .d2");
  const project = loadProject(values.dir, io);
  // Sem `--fast`, entidades sem campos na planta são desenhadas com os campos do código.
  const fields = values.fast || project.config.extractors.length === 0 ? undefined : extractedFields(project.model.ir, await verify(project, io));
  const { ir } = project.model;
  const available = allViews(ir);
  const cache = new Map<string, Rendered>();
  const renderOne = (name: string): Rendered | undefined => {
    if (!cache.has(name)) {
      const view = available.find((v) => v.name === name);
      if (!view) return undefined;
      cache.set(name, renderViews([view], ir, fields, format)[0]!);
    }
    return cache.get(name);
  };

  if (values.inject) return injectInto(values.inject, values.check, renderOne, io);
  if (values.check) throw new UsageError("--check só vale com --inject");

  const declared = declaredViews(ir);
  const all = positionals.length > 0
    ? positionals
    : [...declared.map((v) => v.name), ...(values.auto || declared.length === 0 ? available.filter((v) => !declared.includes(v)).map((v) => v.name) : [])];
  // Sem views nomeadas, o D2 desenha só o que cobre: deployments.
  const names = format === "d2" && positionals.length === 0 ? all.filter((n) => D2_KINDS.has(available.find((v) => v.name === n)?.kind ?? "")) : all;
  const unknown = names.filter((n) => !available.some((v) => v.name === n));
  if (unknown.length > 0) throw new UsageError(`view não encontrada: ${unknown.join(", ")}`);

  const out = join(project.dir, ".gerado", "diagramas");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(project.dir, ".gerado", ".gitignore"), "*\n");
  let failed = false;
  for (const name of names) {
    const r = renderOne(name)!;
    if (r.error) {
      io.err(`✖ ${r.error}\n`);
      failed = true;
      continue;
    }
    const file = join(out, `${name}.${format === "d2" ? "d2" : "mmd"}`);
    writeFileSync(file, r.text!);
    io.out(`→ ${relative(io.cwd, file)}\n`);
  }
  return failed ? 1 : 0;
}

function injectInto(patterns: string[], check: boolean, renderOne: (name: string) => Rendered | undefined, io: Io): number {
  const files = [...new Set(patterns.flatMap((p) => globSync(p, { cwd: io.cwd })))].sort();
  if (files.length === 0) throw new UsageError(`nenhum arquivo casa com ${patterns.join(", ")}`);
  let failed = false;
  for (const file of files) {
    const abs = resolve(io.cwd, file);
    const before = readFileSync(abs, "utf8");
    const { text, problems } = inject(before, renderOne);
    for (const p of problems) io.err(`✖ ${file}:${p.line}: ${p.message}\n`);
    if (problems.length > 0) failed = true;
    if (text === before) continue;
    if (check) {
      io.out(`desatualizado: ${file}\n`);
      failed = true;
    } else {
      writeFileSync(abs, text);
      io.out(`atualizado: ${file}\n`);
    }
  }
  return failed ? 1 : 0;
}

// ---------------------------------------------------------------------
//  Rastreabilidade
// ---------------------------------------------------------------------

async function trace(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: { ...DIR_OPTION, format: { type: "string", default: "markdown" }, inject: { type: "string", multiple: true }, check: { type: "boolean", default: false } },
  });
  const project = loadProject(values.dir, io);
  const result = await verify(project, io);
  const { ir } = project.model;

  if (!values.inject) {
    if (values.check) throw new UsageError("--check só vale com --inject");
    const format = values.format;
    if (format !== "markdown" && format !== "csv" && format !== "html") throw new UsageError(`formato desconhecido: ${format}`);
    io.out(traceTable(ir, traceRows(ir, result.requirements, result.reviewables), format));
    return 0;
  }

  const files = [...new Set(values.inject.flatMap((p) => globSync(p, { cwd: io.cwd })))].sort();
  if (files.length === 0) throw new UsageError(`nenhum arquivo casa com ${values.inject.join(", ")}`);
  const root = project.config.projectRoot;
  let failed = false;
  for (const file of files) {
    const abs = resolve(io.cwd, file);
    const before = readFileSync(abs, "utf8");
    const { text, problems } = injectTrace(before, relative(root, abs), ir, [...result.requirements.values()], {
      projectRoot: root,
      plantaPath: (el) => resolve(io.cwd, el.source.file),
    });
    for (const p of problems) io.err(`✖ ${file}:${p.line}: ${p.message}\n`);
    if (problems.length > 0) failed = true;
    if (text === before) continue;
    if (values.check) {
      io.out(`desatualizado: ${file}\n`);
      failed = true;
    } else {
      writeFileSync(abs, text);
      io.out(`atualizado: ${file}\n`);
    }
  }
  return failed ? 1 : 0;
}

async function impactCommand(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: DIR_OPTION });
  if (positionals.length !== 1) throw new UsageError("informe um ID: `planta impact Vendas.Cliente` ou `planta impact REQ-001`");
  const project = loadProject(values.dir, io);
  const result = await verify(project, io);
  const found = impact(project.model.ir, result.requirements, positionals[0]!);
  if (!found) throw new UsageError(`não conheço \`${positionals[0]}\`: nem elemento, nem requisito`);
  io.out(renderImpact(project.model.ir, found));
  return 0;
}

function queryCommand(argv: string[], io: Io): number {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: DIR_OPTION });
  if (positionals.length !== 1) throw new UsageError('use `planta query "<seletor>"`');
  const { ir } = loadProject(values.dir, io).model;
  const ids = query(ir, positionals[0]!);
  io.out(ids.length ? `${ids.map((id) => summaryLine(ir, id)).join("\n")}\n` : "Nenhum elemento.\n");
  return 0;
}

async function contextCommand(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: DIR_OPTION });
  if (positionals.length === 0) throw new UsageError("use `planta context <ID>` ou `planta context \"descrição da tarefa\"`");
  const target = positionals.join(" ");
  const project = loadProject(values.dir, io);
  const check = await verify(project, io);
  const state = { ir: project.model.ir, check, diagnostics: [...project.model.diagnostics, ...check.diagnostics] };
  const ids = state.ir.elements[target] ? [target] : search(state.ir, target);
  if (ids.length === 0) throw new UsageError(`nada na planta parece ligado a \`${target}\``);
  io.out(`${ids.map((id) => elementContext(state, id)).join("\n\n")}\n`);
  return 0;
}

function ci(argv: string[], io: Io): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { ...DIR_OPTION, write: { type: "boolean", default: false }, docs: { type: "string", default: "docs/**/*.md" } },
  });
  if (positionals[0] !== "github") throw new UsageError("use `planta ci github` (outros provedores ainda não)");
  const yaml = githubWorkflow({ dir: values.dir, docs: values.docs });
  if (!values.write) {
    io.out(yaml);
    return 0;
  }
  const file = resolve(io.cwd, ".github/workflows/planta.yml");
  if (existsSync(file)) throw new UsageError(`${relative(io.cwd, file)} já existe; remova ou rode sem --write para ver o conteúdo`);
  mkdirSync(resolve(io.cwd, ".github/workflows"), { recursive: true });
  writeFileSync(file, yaml);
  io.out(`→ ${relative(io.cwd, file)}\n`);
  return 0;
}

async function suggestCommand(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { ...DIR_OPTION, fact: { type: "string", multiple: true }, uncovered: { type: "boolean", default: false } } });
  const project = loadProject(values.dir, io);
  const result = await verify(project, io);
  const facts = values.fact
    ? values.fact.map((id) => result.facts.find((f) => f.id === id) ?? (() => { throw new UsageError(`fato desconhecido: ${id} (veja \`planta suggest --uncovered\`)`); })())
    : uncovered(result);
  if (facts.length === 0) {
    io.out("Nenhum fato sem descrição na planta.\n");
    return 0;
  }
  for (const f of facts) {
    const s = suggest(f, project.model.ir, project.model.derived);
    io.out(`// ${f.id} (${f.location.file}:${f.location.line ?? 1})${s.context ? ` · contexto ${s.context}` : ""}\n${s.text}\n\n`);
  }
  return 0;
}

// ---------------------------------------------------------------------
//  Diff arquitetural
// ---------------------------------------------------------------------

async function diff(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { ...DIR_OPTION, format: { type: "string", default: "text" } } });
  if (positionals.length < 1 || positionals.length > 2) throw new UsageError("use `planta diff <REF> [REF2]`");
  if (!["text", "markdown", "json"].includes(values.format)) throw new UsageError(`formato desconhecido: ${values.format}`);
  const [baseRef, headRef] = positionals as [string, string | undefined];

  const base = await snapshotAt(baseRef, values.dir, io.cwd);
  const head = headRef
    ? await snapshotAt(headRef, values.dir, io.cwd)
    : await (async () => {
      const project = loadProject(values.dir, io);
      return { ir: project.model.ir, check: await verify(project, io) };
    })();

  const result = diffModels(base, head);
  if (values.format === "json") io.out(JSON.stringify(result, null, 2) + "\n");
  else io.out(values.format === "markdown" ? renderDiffMarkdown(result) : renderDiffText(result));
  return 0;
}

// ---------------------------------------------------------------------
//  Visualizador
// ---------------------------------------------------------------------

/** HTML do visualizador com o estado atual do projeto. */
async function siteHtml(dirOption: string, fast: boolean, io: Io): Promise<string> {
  const project = loadProject(dirOption, io);
  const result = fast || project.config.extractors.length === 0 ? undefined : await verify(project, io);
  const { ir } = project.model;
  const fields = extractedFields(ir, result);
  const diagrams = Object.fromEntries(renderViews(allViews(ir), ir, fields).map((r) => [r.view.name, {
    kind: r.view.kind,
    ...(r.view.of && { of: r.view.of }),
    ...(r.text !== undefined && { text: r.text }),
    ...(r.error && { error: r.error }),
  }]));
  return buildSite({
    ir,
    projectRoot: project.config.projectRoot,
    diagrams,
    diagnostics: [...project.model.diagnostics, ...(result?.diagnostics ?? [])].sort(byLocation),
    review: Object.fromEntries([...(result?.reviewables.values() ?? [])].map((r) => [r.id, r.state])),
    verified: result !== undefined,
    ...(result && { facts: result.facts.length }),
  });
}

async function exportSite(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { ...DIR_OPTION, out: { type: "string" }, fast: { type: "boolean", default: false } } });
  const html = await siteHtml(values.dir, values.fast, io);
  const out = resolve(io.cwd, values.out ?? join(values.dir, ".gerado", "site"));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), html);
  io.out(`→ ${relative(io.cwd, join(out, "index.html"))}\n`);
  return 0;
}

async function serve(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { ...DIR_OPTION, port: { type: "string", default: "4321" }, fast: { type: "boolean", default: false } } });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 0) throw new UsageError(`porta inválida: ${values.port}`);
  // Falha cedo se a planta não carrega, em vez de na primeira requisição.
  await siteHtml(values.dir, values.fast, io);

  const server = createServer((req, res) => {
    if (req.url !== "/" && !req.url?.startsWith("/?")) {
      res.writeHead(404).end();
      return;
    }
    siteHtml(values.dir, values.fast, io).then(
      (html) => res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(html),
      (e: Error) => res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(`planta: ${e.message}`),
    );
  });
  await new Promise<void>((done) => server.listen(port, "127.0.0.1", done));
  // Com `--port 0` o sistema escolhe a porta; mostra a real.
  const address = server.address();
  io.out(`Planta em http://localhost:${typeof address === "object" && address ? address.port : port} (Ctrl+C para sair)\n`);
  await new Promise<void>((done) => server.on("close", done));
  return 0;
}

// ---------------------------------------------------------------------
//  fmt
// ---------------------------------------------------------------------

async function fmt(argv: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { ...DIR_OPTION, check: { type: "boolean", default: false }, "pin-anchors": { type: "boolean", default: false } },
  });
  if (values["pin-anchors"]) {
    if (values.check) throw new UsageError("--pin-anchors e --check não combinam");
    await pinAnchors(values.dir, io);
  }

  const targets = positionals.length > 0 ? positionals : [values.dir];
  const files = targets.flatMap((t) => {
    const path = resolve(io.cwd, t);
    if (!existsSync(path)) throw new UsageError(`não encontrado: ${t}`);
    return statSync(path).isDirectory() ? plantaFiles(path) : [path];
  });

  let failed = false;
  for (const file of files) {
    const shown = relative(io.cwd, file);
    const source = readFileSync(file, "utf8");
    const result = format(source, shown);
    if (!result.ok) {
      for (const d of result.diagnostics) io.err(renderDiagnostic(d));
      failed = true;
      continue;
    }
    if (result.text === source) continue;
    if (values.check) {
      io.out(`${shown}\n`);
      failed = true;
    } else {
      writeFileSync(file, result.text);
      io.out(`formatado: ${shown}\n`);
    }
  }
  return failed ? 1 : 0;
}

async function exportCommand(argv: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { ...DIR_OPTION, format: { type: "string" }, out: { type: "string" }, fast: { type: "boolean", default: false } } });
  const format = values.format;
  if (format !== "structurizr" && format !== "openapi" && format !== "json") throw new UsageError("--format deve ser structurizr, openapi ou json");
  const project = loadProject(values.dir, io);
  // A verificação acrescenta ao IR o que só o código diz (âncoras resolvidas, campos extraídos).
  if (!values.fast && format === "json") await verify(project, io);
  const { ir } = project.model;
  const text = format === "structurizr" ? toStructurizr(ir) : format === "openapi" ? `${JSON.stringify(toOpenApi(ir), null, 2)}\n` : `${JSON.stringify(ir, null, 2)}\n`;
  if (!values.out) {
    io.out(text);
    return 0;
  }
  const file = resolve(io.cwd, values.out);
  writeFileSync(file, text);
  io.out(`→ ${relative(io.cwd, file)}\n`);
  return 0;
}

/** Escreve na planta as âncoras que a verificação inferiu por convenção (PL210). */
async function pinAnchors(dir: string, io: Io): Promise<void> {
  const project = loadProject(dir, io);
  const result = await verify(project, io);
  const edits = result.diagnostics
    .filter((d) => d.code === "PL210" && d.data)
    .map((d) => pinAnchor(project.model, d.data!.element!, d.data!.anchor!))
    .filter((e) => e !== undefined);
  for (const file of new Set(edits.map((e) => e.file))) {
    const abs = resolve(io.cwd, file);
    writeFileSync(abs, applyEdits(readFileSync(abs, "utf8"), edits.filter((e) => e.file === file)));
  }
  io.out(`${edits.length} ${edits.length === 1 ? "âncora fixada" : "âncoras fixadas"}\n`);
}

// ---------------------------------------------------------------------

function byLocation(a: Diagnostic, b: Diagnostic): number {
  return a.loc.file.localeCompare(b.loc.file) || a.loc.line - b.loc.line || a.loc.column - b.loc.column;
}

function renderDiagnostic(d: Diagnostic): string {
  const icon = d.severity === "error" ? "✖" : d.severity === "warning" ? "⚠" : "ℹ";
  const at = (l: Diagnostic["loc"]) => `${l.file}:${l.line}:${l.column}`;
  const related = (d.related ?? []).map((l) => `        ↳ ${at(l)}\n`).join("");
  return `${icon} ${d.code} ${at(d.loc)}\n        ${d.message}\n${related}`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
