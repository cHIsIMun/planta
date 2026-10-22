// Carrega um projeto Planta do disco: arquivos `.planta`, configuração, lock e
// modelo. Usado pelo CLI, pelo servidor MCP e pelo diff entre versões.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { checkCode, type CheckResult } from "./check.ts";
import { type Config, loadConfig } from "./config.ts";
import { headCommit } from "./git.ts";
import { type Lock, readLock } from "./lock.ts";
import { buildModel, type Model } from "./model.ts";

export interface Project {
  /** Pasta `planta/`, absoluta. */
  dir: string;
  files: string[];
  config: Config;
  lock: Lock;
  model: Model;
  /** De onde os caminhos dos diagnósticos são exibidos. */
  cwd: string;
}

export class ProjectError extends Error {}

export function loadProject(dirOption: string, cwd: string): Project {
  const dir = resolve(cwd, dirOption);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new ProjectError(`pasta não encontrada: ${dirOption}`);
  const config = loadConfig(dir);
  const files = plantaFiles(dir);
  const sources = files.map((f) => ({ path: relative(cwd, f), text: readFileSync(f, "utf8") }));
  const commit = headCommit(cwd);
  const model = buildModel(sources, { generatedAt: new Date().toISOString(), ...(commit && { gitCommit: commit }) });
  return { dir, files, config, lock: readLock(dir), model, cwd };
}

export function verify(project: Project): Promise<CheckResult> {
  return checkCode({ model: project.model, config: project.config, lock: project.lock, cwd: project.cwd });
}

/** Todos os `.planta` sob `dir`, recursivamente, fora de `.gerado/`, em ordem estável. */
export function plantaFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".planta"))
    .map((e) => join(e.parentPath, e.name))
    .filter((f) => !relative(dir, f).split(/[\\/]/).includes(".gerado"))
    .sort();
}
