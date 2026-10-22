// Política de aceite (seções 12.6 e 17.3): o agente pode mudar código e
// planta à vontade, mas só um humano fecha o ciclo de revisão. Na CI,
// `planta check --base <ref>` recusa o PR quando o lock foi alterado por uma
// identidade de agente.

import { join, matchesGlob, relative } from "node:path";
import { realpathSync } from "node:fs";
import type { Diagnostic } from "./diagnostics.ts";
import { commitsTouching, repoRoot } from "./git.ts";
import { lockPath } from "./lock.ts";
import type { Project } from "./project.ts";

export class PolicyError extends Error {}

export function isAgent(email: string, identities: string[]): boolean {
  const e = email.toLowerCase();
  return identities.some((pattern) => matchesGlob(e, pattern.toLowerCase()));
}

export function checkReviewPolicy(project: Project, baseRef: string): Diagnostic[] {
  const { forbidAgentAccept, agentIdentities } = project.config.review;
  if (!forbidAgentAccept || agentIdentities.length === 0) return [];

  const diagnostics: Diagnostic[] = [];
  const lockFile = relative(project.cwd, lockPath(project.dir)) || "planta.lock";
  const at = { file: lockFile, line: 1, column: 1 };

  const root = repoRoot(project.cwd);
  if (!root) throw new PolicyError("`--base` precisa de um repositório git");
  // A pasta sempre existe; o lock pode ainda não existir.
  const commits = commitsTouching(root, baseRef, relative(root, join(realpathSync(project.dir), "planta.lock")));
  if (!commits) throw new PolicyError(`não consegui ler o histórico desde \`${baseRef}\``);

  for (const c of commits) {
    const who = [c.author, ...c.coAuthors].filter((e) => isAgent(e, agentIdentities));
    if (who.length > 0) {
      diagnostics.push({
        code: "PL405",
        severity: "error",
        message: `planta.lock alterado no commit ${c.sha} por agente (${[...new Set(who)].join(", ")}): só um humano aceita mudanças`,
        loc: at,
      });
    }
  }
  const byReviewer = new Map<string, string[]>();
  for (const [id, entry] of project.lock.elements) {
    if (isAgent(entry.reviewed.by, agentIdentities)) byReviewer.set(entry.reviewed.by, [...(byReviewer.get(entry.reviewed.by) ?? []), id]);
  }
  for (const [who, ids] of byReviewer) {
    const list = ids.sort().slice(0, 5).map((i) => `\`${i}\``).join(", ") + (ids.length > 5 ? ` e mais ${ids.length - 5}` : "");
    diagnostics.push({ code: "PL405", severity: "error", message: `${ids.length} elemento(s) aceito(s) por ${who}, que é identidade de agente: ${list}`, loc: at });
  }
  return diagnostics;
}
