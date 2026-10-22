// Estado do projeto no servidor de linguagem: documentos abertos por cima do
// disco, o modelo das fases 1–7 (refeito a cada tecla) e o resultado da
// verificação completa (refeito ao salvar).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type CheckResult, checkCode } from "../check.ts";
import { CodeParser } from "../code/index.ts";
import { type Config, loadConfig } from "../config.ts";
import type { Diagnostic } from "../diagnostics.ts";
import { type Lock, readLock } from "../lock.ts";
import { buildModel, type Model } from "../model.ts";
import { parse } from "../parse.ts";
import { plantaFiles } from "../project.ts";
import { buildIndex, type ProjectIndex } from "./index.ts";

export interface Analysis {
  model: Model;
  index: ProjectIndex;
  /** Texto com que o modelo foi construído, por caminho do diagnóstico. */
  texts: Map<string, string>;
  /** Diagnósticos das fases 1–7, já com os de sintaxe do texto atual. */
  diagnostics: Diagnostic[];
  /** Arquivos com erro de sintaxe, representados no modelo pela última versão válida. */
  stale: Set<string>;
}

export class Workspace {
  readonly overlays = new Map<string, string>();
  private readonly lastGood = new Map<string, string>();
  config: Config;
  lock: Lock;
  private analysis?: Analysis;
  /** Resultado da última verificação completa, com o modelo sobre o qual rodou. */
  checked?: { result: CheckResult; model: Model };
  private parser?: Promise<CodeParser>;

  /**
   * `root` é de onde os caminhos dos diagnósticos são relativos (a pasta do
   * workspace); `dir`, a pasta `planta/`.
   */
  constructor(readonly root: string, readonly dir: string) {
    this.config = loadConfig(dir);
    this.lock = readLock(dir);
  }

  /** Caminho como aparece nos diagnósticos e na AST. */
  rel(abs: string): string {
    return relative(this.root, abs);
  }

  abs(file: string): string {
    return resolve(this.root, file);
  }

  /** Caminho relativo à raiz do projeto, como nas âncoras e no lock. */
  projectPath(abs: string): string {
    return relative(this.config.projectRoot, abs);
  }

  read(abs: string): string | undefined {
    const open = this.overlays.get(abs);
    if (open !== undefined) return open;
    try {
      return readFileSync(abs, "utf8");
    } catch {
      return undefined;
    }
  }

  isPlanta(abs: string): boolean {
    return abs.endsWith(".planta") && !relative(this.dir, abs).startsWith("..");
  }

  open(abs: string, text: string): void {
    this.overlays.set(abs, text);
    if (this.isPlanta(abs)) this.analysis = undefined;
  }

  close(abs: string): void {
    this.overlays.delete(abs);
    if (this.isPlanta(abs)) this.analysis = undefined;
  }

  /** Arquivos de configuração e lock mudaram no disco. */
  reloadSettings(): void {
    this.config = loadConfig(this.dir);
    this.lock = readLock(this.dir);
    this.analysis = undefined;
  }

  /** Arquivos `.planta` mudaram no disco. */
  invalidate(): void {
    this.analysis = undefined;
  }

  analyze(): Analysis {
    if (this.analysis) return this.analysis;
    const files = new Set([...plantaFiles(this.dir), ...[...this.overlays.keys()].filter((f) => this.isPlanta(f))]);
    const sources: { path: string; text: string }[] = [];
    const syntax: Diagnostic[] = [];
    const stale = new Set<string>();

    for (const abs of [...files].sort()) {
      const text = this.read(abs);
      if (text === undefined) continue;
      const path = this.rel(abs);
      const errors = parse(text, path).diagnostics;
      if (errors.length === 0) {
        this.lastGood.set(abs, text);
        sources.push({ path, text });
        continue;
      }
      // Enquanto o arquivo não volta a ser válido, o modelo usa a última
      // versão boa: sem isso, cada tecla quebraria todas as referências a ele.
      syntax.push(...errors);
      stale.add(path);
      const good = this.lastGood.get(abs) ?? this.diskVersion(abs, path);
      if (good !== undefined) sources.push({ path, text: good });
    }

    const model = buildModel(sources);
    const texts = new Map(sources.map((s) => [s.path, s.text]));
    const diagnostics = [...syntax, ...model.diagnostics.filter((d) => !stale.has(d.loc.file))];
    this.analysis = { model, index: buildIndex(model, texts), texts, diagnostics, stale };
    return this.analysis;
  }

  /** O arquivo salvo, se for válido: a última versão boa de um documento aberto já quebrado. */
  private diskVersion(abs: string, path: string): string | undefined {
    try {
      const text = readFileSync(abs, "utf8");
      return parse(text, path).diagnostics.length === 0 ? text : undefined;
    } catch {
      return undefined;
    }
  }

  codeParser(): Promise<CodeParser> {
    return (this.parser ??= CodeParser.create());
  }

  /** Fases 8–11 sobre o modelo atual; o código vem do disco. */
  async check(): Promise<CheckResult> {
    // A verificação anota o IR (âncoras inferidas, campos extraídos): roda numa cópia.
    // O resultado vale mesmo que o texto mude enquanto ela roda: é a verificação
    // mais recente, e a próxima vem no próximo salvamento.
    const model = buildModel([...this.analyze().texts].map(([path, text]) => ({ path, text })));
    const result = await checkCode({ model, config: this.config, lock: this.lock, cwd: this.root });
    this.checked = { result, model };
    return result;
  }
}

/**
 * Pasta `planta/` do workspace: `dir` se existir; senão, a primeira pasta com
 * `planta.config.yaml`; senão, a primeira com arquivos `.planta`.
 */
export function findPlantaDir(root: string, dir = "planta"): string | undefined {
  const preferred = resolve(root, dir);
  if (existsSync(preferred) && statSync(preferred).isDirectory()) return preferred;
  const skip = new Set(["node_modules", ".git", "dist", "build", ".gerado"]);
  let withPlanta: string | undefined;
  const queue = [root];
  for (let depth = 0; depth < 5 && queue.length > 0; depth++) {
    for (const current of queue.splice(0)) {
      let entries;
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      if (entries.some((e) => e.isFile() && e.name === "planta.config.yaml")) return current;
      if (!withPlanta && entries.some((e) => e.isFile() && e.name.endsWith(".planta"))) withPlanta = current;
      for (const e of entries) if (e.isDirectory() && !skip.has(e.name) && !e.name.startsWith(".")) queue.push(join(current, e.name));
    }
  }
  return withPlanta;
}

/** Pasta `planta/` de um arquivo aberto fora de um projeto encontrado. */
export function plantaDirOf(file: string): string {
  for (let dir = dirname(file); ; dir = dirname(dir)) {
    if (existsSync(join(dir, "planta.config.yaml"))) return dir;
    if (dirname(dir) === dir) return dirname(file);
  }
}
