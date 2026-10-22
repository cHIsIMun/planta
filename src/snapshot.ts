// Modelo e verificação de uma versão do projeto num commit qualquer, para o
// diff arquitetural (seção 17.2). A árvore do commit é extraída com
// `git archive` numa pasta temporária: planta, código e lock como eram.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import type { Snapshot } from "./diff.ts";
import { repoRoot } from "./git.ts";
import { IR_SCHEMA } from "./ir.ts";
import { loadProject, ProjectError, verify } from "./project.ts";

export async function snapshotAt(ref: string, dirOption: string, cwd: string): Promise<Snapshot> {
  const root = repoRoot(cwd);
  if (!root) throw new ProjectError("`planta diff` precisa de um repositório git");
  const tree = mkdtempSync(join(tmpdir(), "planta-diff-"));
  try {
    try {
      const archive = execFileSync("git", ["archive", "--format=tar", ref], { cwd: root, maxBuffer: 1024 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
      execFileSync("tar", ["-x", "-C", tree], { input: archive });
    } catch {
      throw new ProjectError(`referência git desconhecida: ${ref}`);
    }
    // Mesma posição relativa dentro do repositório, para os caminhos baterem com os do lado novo.
    const at = join(tree, relative(root, realpathSync(cwd)));
    const dir = join(tree, relative(root, resolve(realpathSync(cwd), dirOption)));
    if (!existsSync(dir)) return { ir: { schema: IR_SCHEMA, elements: {}, requirements: {} } };
    const project = loadProject(dir, at);
    return { ir: project.model.ir, check: await verify(project) };
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
}
