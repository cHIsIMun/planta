// `planta.lock` (seção 12): o estado do código que um humano revisou.
// Chaves ordenadas e um bloco por elemento, para diffs pequenos e conflitos raros.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export const LOCK_SCHEMA = "planta.lock/1";

export interface Review {
  by: string;
  at: string;
  commit?: string;
}

export interface LockEntry {
  /** `caminho#Simbolo` revisado, para elementos ancorados. */
  anchor?: string;
  /** Chave natural, para elementos sem âncora própria (endpoints). */
  natural?: string;
  /** Ausente em elementos sem código ancorado (um processo, por exemplo). */
  signature?: string;
  body?: string;
  /** Impressão de cada requisito ou decisão que justifica o elemento, na revisão. */
  requirements?: Record<string, string>;
  reviewed: Review;
}

export interface Lock {
  elements: Map<string, LockEntry>;
}

export class LockError extends Error {}

export function lockPath(plantaDir: string): string {
  return join(plantaDir, "planta.lock");
}

export function readLock(plantaDir: string): Lock {
  const file = lockPath(plantaDir);
  if (!existsSync(file)) return { elements: new Map() };
  const raw = parseYaml(readFileSync(file, "utf8")) as { schema?: string; elements?: Record<string, LockEntry> } | null;
  if (raw?.schema !== LOCK_SCHEMA) throw new LockError(`${file}: esquema desconhecido (esperava ${LOCK_SCHEMA})`);
  return { elements: new Map(Object.entries(raw.elements ?? {})) };
}

export function writeLock(plantaDir: string, lock: Lock): void {
  writeFileSync(lockPath(plantaDir), serialize(lock));
}

export function serialize(lock: Lock): string {
  const lines = [`schema: ${LOCK_SCHEMA}`, "", "elements:"];
  const ids = [...lock.elements.keys()].sort();
  if (ids.length === 0) lines[2] = "elements: {}";
  for (const id of ids) {
    const e = lock.elements.get(id)!;
    lines.push(`  ${scalar(id)}:`);
    if (e.anchor) lines.push(`    anchor: ${scalar(e.anchor)}`);
    if (e.natural) lines.push(`    natural: ${scalar(e.natural)}`);
    if (e.signature) lines.push(`    signature: ${scalar(e.signature)}`);
    if (e.body) lines.push(`    body: ${scalar(e.body)}`);
    const reqs = Object.keys(e.requirements ?? {}).sort();
    if (reqs.length > 0) {
      lines.push("    requirements:");
      for (const r of reqs) lines.push(`      ${scalar(r)}: ${scalar(e.requirements![r]!)}`);
    }
    const r = e.reviewed;
    const commit = r.commit ? `, commit: ${JSON.stringify(r.commit)}` : "";
    lines.push(`    reviewed: { by: ${JSON.stringify(r.by)}, at: ${JSON.stringify(r.at)}${commit} }`);
    lines.push("");
  }
  return lines.join("\n").replace(/\n+$/, "\n");
}

/** Texto sem aspas quando o YAML o lê de volta igual; senão, entre aspas. */
function scalar(text: string): string {
  const plain = /^[A-Za-z0-9_./:#@*-][A-Za-z0-9_./:#@*\- ]*$/.test(text) && !/ #|: |\s$/.test(text) && !/^(true|false|null|~|-?\d)/.test(text);
  return plain ? text : JSON.stringify(text);
}
