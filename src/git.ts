// Acesso mínimo ao git. Toda função devolve `undefined` fora de um repositório
// ou quando o comando falha: o git enriquece a revisão, mas não é obrigatório.

import { execFileSync } from "node:child_process";

function git(cwd: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch {
    return undefined;
  }
}

export function headCommit(cwd: string): string | undefined {
  return git(cwd, ["rev-parse", "--short", "HEAD"])?.trim();
}

export function userEmail(cwd: string): string | undefined {
  return git(cwd, ["config", "user.email"])?.trim() || undefined;
}

/** Conteúdo de um arquivo (relativo à raiz do repositório) num commit. */
export function showFile(cwd: string, commit: string, path: string): string | undefined {
  return git(cwd, ["show", `${commit}:${path}`]);
}

/** Arquivos alterados desde `ref`, inclusive na árvore de trabalho, relativos à raiz do repositório. */
export function changedSince(cwd: string, ref: string): Set<string> | undefined {
  const committed = git(cwd, ["diff", "--name-only", `${ref}...HEAD`]);
  const working = git(cwd, ["diff", "--name-only", "HEAD"]);
  const untracked = git(cwd, ["ls-files", "--others", "--exclude-standard"]);
  if (committed === undefined) return undefined;
  return new Set([committed, working ?? "", untracked ?? ""].join("\n").split("\n").filter(Boolean));
}

export interface CommitInfo {
  sha: string;
  author: string;
  /** E-mails dos trailers `Co-authored-by:` da mensagem. */
  coAuthors: string[];
}

/** Commits em `ref..HEAD` que tocam `path` (relativo à raiz do repositório). */
export function commitsTouching(cwd: string, ref: string, path: string): CommitInfo[] | undefined {
  const out = git(cwd, ["log", "--format=%H%x00%ae%x00%B%x1e", `${ref}..HEAD`, "--", path]);
  if (out === undefined) return undefined;
  return out.split("\x1e").map((c) => c.trim()).filter(Boolean).map((c) => {
    const [sha, author, body] = c.split("\x00") as [string, string, string];
    const coAuthors = [...(body ?? "").matchAll(/^co-authored-by:.*<([^>]+)>/gim)].map((m) => m[1]!.toLowerCase());
    return { sha: sha.slice(0, 7), author: author.toLowerCase(), coAuthors };
  });
}

/** Raiz do repositório, para converter caminhos do projeto em caminhos do git. */
export function repoRoot(cwd: string): string | undefined {
  return git(cwd, ["rev-parse", "--show-toplevel"])?.trim();
}
