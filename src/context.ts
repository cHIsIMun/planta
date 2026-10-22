// Consultas ao modelo para humanos e agentes (seção 15): seletores, contexto
// compacto de um elemento (15.6) e regras aplicáveis.

import { type CheckResult, displayKey } from "./check.ts";
import type { Diagnostic } from "./diagnostics.ts";
import type { IrElement, IrModel, IrType } from "./ir.ts";
import { codePath, impact } from "./trace.ts";

export interface QueryState {
  ir: IrModel;
  check?: CheckResult;
  diagnostics: Diagnostic[];
}

// ---------------------------------------------------------------------
//  Seletores
// ---------------------------------------------------------------------

export class QueryError extends Error {}

/**
 * `*`, `Vendas.*`, `Vendas.Cliente`, `every endpoint`,
 * `every entity where tag = pii`, `every service where layer = aplicacao`.
 */
export function query(ir: IrModel, selector: string): string[] {
  const s = selector.trim();
  const ids = Object.keys(ir.elements);
  if (s === "*") return ids;
  if (s.endsWith(".*")) {
    const prefix = s.slice(0, -2);
    return ids.filter((id) => id.startsWith(`${prefix}.`));
  }
  const every = /^every\s+(\w+)(?:\s+where\s+(\w+)\s*=\s*"?([^"]+?)"?)?$/.exec(s);
  if (every) {
    const [, kind, attr, value] = every;
    return ids.filter((id) => {
      const el = ir.elements[id]!;
      if (el.kind !== kind) return false;
      if (!attr) return true;
      switch (attr) {
        case "tag": return el.meta.tags.includes(value!);
        case "owner": return el.meta.owner === value;
        case "status": return el.meta.status === value;
        case "layer": return el.relations.some((r) => r.type === "inLayer" && r.target === value);
        default: return String((el as Record<string, unknown>)[attr!] ?? "") === value;
      }
    });
  }
  if (ir.elements[s]) return [s];
  throw new QueryError(`seletor não reconhecido: \`${selector}\` (use \`*\`, \`Contexto.*\`, um ID ou \`every <tipo> [where tag = x]\`)`);
}

export function summaryLine(ir: IrModel, id: string): string {
  const el = ir.elements[id]!;
  const path = codePath(ir, id);
  const doc = el.docs?.split("\n")[0];
  return `${id} (${el.kind})${path ? ` → ${path}` : ""}${doc ? ` — ${doc}` : ""}`;
}

// ---------------------------------------------------------------------
//  Regras aplicáveis
// ---------------------------------------------------------------------

type Subject = { every?: string; where?: { attribute: string; value: unknown }; elementKind?: string; element?: string };
type Statement = { subject: Subject; modality: string; predicate: Record<string, unknown>; exceptVia?: string };

function subjectText(s: Subject): string {
  if (s.every) return `every ${s.every}${s.where ? ` where ${s.where.attribute} = ${String(s.where.value)}` : ""}`;
  return `${s.elementKind} ${s.element}`;
}

export function statementText(st: Statement): string {
  const modality = { must: "must", mustNot: "must not", may: "may" }[st.modality] ?? st.modality;
  const p = st.predicate;
  const predicate = p.dependOn ? `depend on ${subjectText(p.dependOn as Subject)}`
    : p.have ? `have ${String(p.have)}`
    : p.match ? `match "${String(p.match)}"`
    : p.inLayer ? `be in layer ${String(p.inLayer)}`
    : JSON.stringify(p);
  return `${subjectText(st.subject)} ${modality} ${predicate}${st.exceptVia ? ` except via ${st.exceptVia}` : ""}`;
}

function matchesSubject(ir: IrModel, id: string, s: Subject): boolean {
  const el = ir.elements[id]!;
  if (s.every) {
    if (el.kind !== s.every) return false;
    if (!s.where) return true;
    return s.where.attribute === "tag" ? el.meta.tags.includes(String(s.where.value)) : String((el.meta as unknown as Record<string, unknown>)[s.where.attribute]) === String(s.where.value);
  }
  if (!s.element) return false;
  if (s.element === id) return true;
  if (s.elementKind === "layer") return el.relations.some((r) => r.type === "inLayer" && r.target === s.element);
  // `context Vendas`, `app Web`: vale para tudo que está dentro.
  let current = el.parent;
  while (current) {
    if (current === s.element) return true;
    current = ir.elements[current]?.parent;
  }
  return false;
}

/** Regras cujo sujeito alcança o elemento (pelo tipo, camada, contexto ou nome). */
export function rulesFor(ir: IrModel, id: string): { rule: string; statement: string }[] {
  const out: { rule: string; statement: string }[] = [];
  for (const [rid, rule] of Object.entries(ir.elements)) {
    if (rule.kind !== "rule") continue;
    for (const st of (rule.statements as Statement[]) ?? []) {
      if (matchesSubject(ir, id, st.subject)) out.push({ rule: rid, statement: statementText(st) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------
//  Contexto compacto (seção 15.6)
// ---------------------------------------------------------------------

function typeText(ir: IrModel, t: IrType | undefined): string {
  if (!t) return "";
  if ("map" in t) return `Map<${typeText(ir, t.map.key)}, ${typeText(ir, t.map.value)}>`;
  return `${ir.elements[t.ref]?.name ?? t.ref}${t.list ? "[]" : ""}${t.optional ? "?" : ""}`;
}

function opText(ir: IrModel, op: IrElement): string {
  const params = ((op.params as { name: string; type: IrType }[]) ?? []).map((p) => `${p.name}: ${typeText(ir, p.type)}`).join(", ");
  const reqs = op.relations.filter((r) => r.type === "justifiedBy").map((r) => displayKey(r.target));
  return `${op.name}(${params})${op.returns ? ` -> ${typeText(ir, op.returns as IrType)}` : ""}${reqs.length ? ` [${reqs.join(", ")}]` : ""}`;
}

const nameOf = (ir: IrModel, id: string) => {
  const el = ir.elements[id];
  if (!el) return displayKey(id);
  return (el.kind === "op" || el.kind === "endpoint") && el.parent ? `${ir.elements[el.parent]?.name}.${el.name}` : el.name;
};

/** Descrição densa de um elemento, para caber em poucas centenas de tokens. */
export function elementContext(state: QueryState, id: string): string {
  const { ir } = state;
  const el = ir.elements[id];
  if (!el) throw new QueryError(`elemento desconhecido: ${id}`);
  const lines: string[] = [];
  const doc = el.docs ? ` — "${el.docs.split("\n")[0]}"` : "";
  lines.push(`${el.kind.toUpperCase()} ${id}${doc}`);

  const facts: string[] = [];
  const path = codePath(ir, id);
  if (path) facts.push(`código: ${path}${el.anchor?.symbol ? `#${el.anchor.symbol}` : ""}`);
  const layer = el.relations.find((r) => r.type === "inLayer")?.target;
  if (layer) facts.push(`camada: ${layer}`);
  if (el.meta.owner) facts.push(`dono: ${el.meta.owner}`);
  if (el.meta.status !== "active") facts.push(`status: ${el.meta.status}`);
  if (el.meta.tags.length) facts.push(`tags: ${el.meta.tags.join(", ")}`);
  const reqs = el.relations.filter((r) => r.type === "justifiedBy" || r.type === "decidedBy").map((r) => displayKey(r.target));
  if (reqs.length) facts.push(`requisitos: ${reqs.join(", ")}`);
  const trigger = el.relations.find((r) => r.type === "triggeredBy")?.target;
  if (trigger) {
    const t = ir.elements[trigger];
    facts.push(`gatilho: ${t?.kind === "endpoint" ? `${t.method} ${t.path}` : nameOf(ir, trigger)}`);
  }
  if (facts.length) lines.push(facts.join(" | "));

  if (el.kind === "endpoint") {
    const handler = el.relations.find((r) => r.type === "handledBy")?.target;
    lines.push(`${el.method} ${el.path ?? el.operation}${handler ? ` → ${nameOf(ir, handler)}` : ""}`);
    if (el.body) lines.push(`corpo: ${typeText(ir, el.body as IrType)}`);
    const responses = (el.responses as { status: number; type?: IrType }[]) ?? [];
    if (responses.length) lines.push(`respostas: ${responses.map((r) => `${r.status}${r.type ? ` ${typeText(ir, r.type)}` : ""}`).join(", ")}`);
  }
  const fields = (el.fields as { name: string; type: IrType; modifiers: Record<string, unknown[]> }[] | undefined) ?? [];
  if (fields.length) {
    const mods = (m: Record<string, unknown[]>) => Object.entries(m).map(([k, v]) => (v.length ? `${k}(${v.join(", ")})` : k)).join(" ");
    lines.push(`campos: ${fields.map((f) => `${f.name}: ${typeText(ir, f.type)}${Object.keys(f.modifiers).length ? ` ${mods(f.modifiers)}` : ""}`).join("; ")}`);
  }
  const ops = Object.values(ir.elements).filter((c) => c.parent === id && c.kind === "op");
  if (ops.length) lines.push(`operações: ${ops.map((o) => opText(ir, o)).join("; ")}`);
  if (el.kind === "op") lines.push(opText(ir, el));
  const uses = el.relations.filter((r) => r.type === "uses" || r.type === "calls").map((r) => nameOf(ir, r.target));
  if (uses.length) lines.push(`usa: ${uses.join(", ")}`);

  if (Array.isArray(el.flow)) {
    lines.push("passos:");
    let n = 0;
    const walk = (stmts: Record<string, unknown>[], depth: number) => {
      const pad = "  ".repeat(depth);
      for (const s of stmts) {
        if (s.op === "step") {
          const target = typeof s.target === "string" ? nameOf(ir, s.target) : typeof s.emit === "string" ? `emite ${nameOf(ir, s.emit)}` : `"${String(s.manual)}"`;
          const where = typeof s.target === "string" ? codePath(ir, s.target) : undefined;
          lines.push(`${pad}${++n} ${String(s.name)} → ${target}${where ? `    ${where}` : ""}`);
        } else if (s.op === "if") {
          lines.push(`${pad}se "${String(s.condition)}":`);
          walk(s.then as Record<string, unknown>[], depth + 1);
          if ((s.else as unknown[]).length) {
            lines.push(`${pad}senão:`);
            walk(s.else as Record<string, unknown>[], depth + 1);
          }
        } else if (s.op === "parallel") {
          lines.push(`${pad}em paralelo:`);
          walk(s.body as Record<string, unknown>[], depth + 1);
        } else if (s.op === "foreach") {
          lines.push(`${pad}para cada "${String(s.description)}":`);
          walk(s.body as Record<string, unknown>[], depth + 1);
        } else if (s.op === "fail") lines.push(`${pad}falha ${[s.status, s.message].filter((x) => x !== undefined).join(" ")}`);
        else if (s.op === "emit") lines.push(`${pad}emite ${nameOf(ir, String(s.event))}`);
        else if (s.op === "wait") lines.push(`${pad}aguarda ${nameOf(ir, String(s.event))}${s.timeout ? ` (timeout ${s.timeout})` : ""}`);
        else if (s.op === "return") lines.push(`${pad}retorna${s.type ? ` ${typeText(ir, s.type as IrType)}` : ""}`);
      }
    };
    walk(el.flow as Record<string, unknown>[], 1);
  }

  const dependents = impact(ir, state.check?.requirements ?? new Map(), id)?.dependents.filter((d) => d.depth === 1) ?? [];
  if (dependents.length) lines.push(`usado por: ${dependents.map((d) => `${nameOf(ir, d.id)} (${d.via})`).join(", ")}`);
  if (el.kind === "event") {
    const consumers = Object.entries(ir.elements).filter(([, e]) => e.relations.some((r) => r.type === "consumes" && r.target === id)).map(([cid]) => nameOf(ir, cid));
    if (consumers.length) lines.push(`consumidores: ${consumers.join(", ")}`);
  }
  const rules = rulesFor(ir, id);
  if (rules.length) lines.push(`regras aplicáveis: ${rules.map((r) => `${r.rule} (${r.statement})`).join("; ")}`);

  const review = state.check?.reviewables.get(id);
  if (review) {
    const entry = review.state === "new" ? "nunca revisado" : review.state === "changed" ? "alterado desde a revisão" : "revisado";
    lines.push(`estado: ${entry}`);
  }
  const diags = state.diagnostics.filter((d) => d.message.includes(`\`${id}\``));
  if (diags.length) lines.push(`diagnósticos: ${diags.map((d) => `${d.code} ${d.message}`).join(" | ")}`);
  return lines.join("\n");
}

/**
 * Elementos mais ligados a uma descrição de tarefa: palavras (por um radical
 * simples, "excluir" casa com "exclusão") no ID, no nome, na documentação e
 * no texto dos requisitos que justificam o elemento.
 */
export function search(ir: IrModel, text: string, limit = 5): string[] {
  const norm = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const stems = norm(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 4).map((w) => (w.length >= 6 ? w.slice(0, 5) : w));
  if (stems.length === 0) return [];
  const reqText = new Map<string, string>();
  for (const [key, r] of Object.entries((ir.requirements ?? {}) as Record<string, { title: string; text: string; justifiedBy: string[] }>)) {
    for (const id of r.justifiedBy) reqText.set(id, `${reqText.get(id) ?? ""} ${key} ${r.title} ${r.text}`);
  }
  const score = (id: string) => {
    const el = ir.elements[id]!;
    const own = norm(`${id} ${el.docs ?? ""}`);
    const reqs = norm(reqText.get(id) ?? "");
    return stems.reduce((n, w) => n + (norm(el.name).includes(w) ? 3 : own.includes(w) ? 1 : 0) + (reqs.includes(w) ? 2 : 0), 0);
  };
  return Object.keys(ir.elements)
    .filter((id) => !["layer", "view", "rule", "system"].includes(ir.elements[id]!.kind))
    .map((id) => [id, score(id)] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .slice(0, limit)
    .map(([id]) => id);
}
