// Diff arquitetural (seção 17.2): a diferença entre dois modelos expressa em
// elementos e relações, não em linhas. É a primeira leitura de um PR feito
// por agente: o que mudou na estrutura, o que toca dado sensível, o que
// precisa de revisão humana.

import { type CheckResult, displayKey } from "./check.ts";
import type { IrElement, IrModel, IrRelation, IrType } from "./ir.ts";
import { lineDiff } from "./text.ts";

export interface Snapshot {
  ir: IrModel;
  check?: CheckResult;
}

export type ChangeKind = "added" | "removed" | "changed";

export interface ElementChange {
  id: string;
  kind: string;
  change: ChangeKind;
  /** Linha principal: rota do endpoint, contagem de campos, transição de status. */
  summary: string;
  /** Detalhes: campos e dependências acrescentados, removidos ou alterados. */
  details: string[];
  /** Mudança de assinatura no código, com o texto antes e depois. */
  signature?: { before?: string; after: string };
  /** Campos ou o próprio elemento com `tag(pii)`. */
  pii: string[];
}

export interface ArchDiff {
  /** Agrupado pelo contexto, app ou deployment que contém o elemento. */
  groups: { title: string; changes: ElementChange[] }[];
  dependencies: { added: [string, string][]; removed: [string, string][]; violations: Record<string, string[]> };
  /** Violações de regra que não existiam na base (dependência, `have`, `match`, camada). */
  violations: { code: string; message: string }[];
  requirements: { key: string; title: string; before: number; after: number; textChanged: boolean }[];
  /** Elementos novos ou alterados desde a última revisão, no lado novo. */
  pending: number;
  empty: boolean;
}

export function diffModels(base: Snapshot, head: Snapshot): ArchDiff {
  const b = base.ir.elements;
  const h = head.ir.elements;
  const changes: ElementChange[] = [];

  for (const id of Object.keys(h)) {
    if (!b[id]) changes.push(added(id, h[id]!, head.ir));
    else {
      const c = changed(id, b[id]!, h[id]!, base, head);
      if (c) changes.push(c);
    }
  }
  for (const id of Object.keys(b)) if (!h[id]) changes.push(removed(id, b[id]!, base.ir));

  // Filhos de elementos acrescentados ou removidos viram detalhe do pai: um
  // serviço novo com três operações é uma mudança, não quatro.
  const wholes = new Set(changes.filter((c) => c.change !== "changed").map((c) => c.id));
  const visible = changes.filter((c) => {
    const parent = (c.change === "removed" ? b : h)[c.id]?.parent;
    return !(c.change !== "changed" && parent && wholes.has(parent));
  });

  const groupOf = (c: ElementChange) => {
    const ir = c.change === "removed" ? base.ir : head.ir;
    const top = topLevel(ir, c.id);
    const el = ir.elements[top];
    if (!el || top === c.id) return "Sistema";
    return `${{ context: "Contexto", app: "App", deployment: "Deployment" }[el.kind] ?? el.kind} ${el.name}`;
  };
  const groups = new Map<string, ElementChange[]>();
  for (const c of visible) groups.set(groupOf(c), [...(groups.get(groupOf(c)) ?? []), c]);
  const order: ChangeKind[] = ["added", "changed", "removed"];
  const sorted = [...groups].sort(([a], [z]) => (a === "Sistema" ? 1 : z === "Sistema" ? -1 : a.localeCompare(z)))
    .map(([title, list]) => ({ title, changes: list.sort((x, y) => order.indexOf(x.change) - order.indexOf(y.change) || x.id.localeCompare(y.id)) }));

  const depsBase = realDependencies(base);
  const depsHead = realDependencies(head);
  // Regras que cada dependência viola no lado novo (PL501 traz `from`/`to` em `data`).
  const violated: Record<string, string[]> = {};
  for (const d of head.check?.diagnostics ?? []) {
    if (d.code !== "PL501" || !d.data?.from || !d.data.to || !d.data.rule) continue;
    const key = `${d.data.from} → ${d.data.to}`;
    if (!(violated[key] ?? []).includes(d.data.rule)) violated[key] = [...(violated[key] ?? []), d.data.rule];
  }
  const dependencies = {
    added: [...depsHead].filter((d) => !depsBase.has(d)).sort().map((d) => d.split(" → ") as [string, string]),
    removed: [...depsBase].filter((d) => !depsHead.has(d)).sort().map((d) => d.split(" → ") as [string, string]),
    violations: violated,
  };
  const RULE_CODES = new Set(["PL501", "PL502", "PL503", "PL504"]);
  const before = new Set((base.check?.diagnostics ?? []).filter((d) => RULE_CODES.has(d.code)).map((d) => `${d.code} ${d.message}`));
  const newDeps = new Set(dependencies.added.map(([a, b]) => `${a} → ${b}`));
  const violations = (head.check?.diagnostics ?? [])
    .filter((d) => RULE_CODES.has(d.code) && !before.has(`${d.code} ${d.message}`))
    // As de dependências novas já aparecem na lista de dependências.
    .filter((d) => !(d.code === "PL501" && d.data?.from && newDeps.has(`${d.data.from} → ${d.data.to}`)))
    .map((d) => ({ code: d.code, message: d.message }));

  const requirements: ArchDiff["requirements"] = [];
  const reqs = new Map([...(base.check?.requirements ?? new Map())].map(([k, r]) => [k, r]));
  for (const [key, r] of head.check?.requirements ?? new Map()) {
    const before = reqs.get(key);
    const textChanged = !!before && before.fingerprint !== r.fingerprint;
    if (!before || before.justifiedBy.length !== r.justifiedBy.length || textChanged) {
      requirements.push({ key: displayKey(key), title: r.title, before: before?.justifiedBy.length ?? 0, after: r.justifiedBy.length, textChanged });
    }
  }
  requirements.sort((a, z) => a.key.localeCompare(z.key));

  const pending = [...(head.check?.reviewables.values() ?? [])].filter((r) => r.state !== "reviewed").length;
  return {
    groups: sorted,
    dependencies,
    violations,
    requirements,
    pending,
    empty: sorted.length === 0 && dependencies.added.length === 0 && dependencies.removed.length === 0 && requirements.length === 0 && violations.length === 0,
  };
}

function topLevel(ir: IrModel, id: string): string {
  let current = id;
  while (ir.elements[current]?.parent) current = ir.elements[current]!.parent!;
  return current;
}

// ---------------------------------------------------------------------
//  Elementos
// ---------------------------------------------------------------------

function typeText(ir: IrModel, t: IrType | undefined): string {
  if (!t) return "";
  if ("map" in t) return `Map<${typeText(ir, t.map.key)}, ${typeText(ir, t.map.value)}>${t.optional ? "?" : ""}`;
  return `${ir.elements[t.ref]?.name ?? t.ref}${t.list ? "[]" : ""}${t.optional ? "?" : ""}`;
}

type Field = { name: string; type: IrType; modifiers: Record<string, unknown[]>; tags?: string[] };

function fields(el: IrElement): Field[] {
  return (el.fields as Field[] | undefined) ?? [];
}

function fieldText(ir: IrModel, f: Field): string {
  const mods = Object.entries(f.modifiers).map(([k, v]) => (v.length ? `${k}(${v.join(", ")})` : k));
  return `${f.name}: ${typeText(ir, f.type)}${mods.length ? ` ${mods.join(" ")}` : ""}`;
}

function piiOf(el: IrElement): string[] {
  const own = el.meta.tags.includes("pii") ? [el.name] : [];
  return [...own, ...fields(el).filter((f) => f.tags?.includes("pii")).map((f) => f.name)];
}

function nameOf(ir: IrModel, id: string): string {
  const el = ir.elements[id];
  if (!el) return id;
  if (el.kind === "op" && el.parent) return `${ir.elements[el.parent]?.name ?? el.parent}.${el.name}`;
  return el.name;
}

/** Linha principal de um elemento: o que um revisor quer ver primeiro. */
function headline(ir: IrModel, id: string, el: IrElement): string {
  switch (el.kind) {
    case "endpoint": {
      const handler = el.relations.find((r) => r.type === "handledBy")?.target;
      return `\`${el.method} ${el.path ?? el.operation}\`${handler ? ` → \`${nameOf(ir, handler)}\`` : ""}`;
    }
    case "op": {
      const params = ((el.params as { name: string; type: IrType }[]) ?? []).map((p) => `${p.name}: ${typeText(ir, p.type)}`).join(", ");
      return `\`${nameOf(ir, id)}(${params})${el.returns ? ` -> ${typeText(ir, el.returns as IrType)}` : ""}\``;
    }
    case "entity":
    case "value":
    case "dto":
    case "event": {
      const n = fields(el).length;
      return `\`${el.name}\`${el.fields ? ` (${n} ${n === 1 ? "campo" : "campos"})` : ""}`;
    }
    default:
      return `\`${el.name}\``;
  }
}

function traceText(el: IrElement): string[] {
  const reqs = el.relations.filter((r) => r.type === "justifiedBy" || r.type === "decidedBy").map((r) => `${r.type} ${displayKey(r.target)}`);
  const auth = el.auth as { scheme: string; roles: string[] } | undefined;
  const parts = [...reqs, ...(auth ? [`auth ${auth.scheme}${auth.roles.length ? ` [${auth.roles.join(", ")}]` : ""}`] : [])];
  return parts.length ? [parts.join(" · ")] : [];
}

function added(id: string, el: IrElement, ir: IrModel): ElementChange {
  const children = Object.entries(ir.elements).filter(([, c]) => c.parent === id).map(([cid, c]) => `➕ ${c.kind} ${headline(ir, cid, c)}`);
  const uses = el.relations.filter((r) => r.type === "uses").map((r) => `uses \`${nameOf(ir, r.target)}\``);
  return {
    id,
    kind: el.kind,
    change: "added",
    summary: headline(ir, id, el),
    details: [...traceText(el), ...(el.meta.status !== "active" ? [`status ${el.meta.status}`] : []), ...uses, ...children],
    pii: piiOf(el),
  };
}

function removed(id: string, el: IrElement, ir: IrModel): ElementChange {
  return { id, kind: el.kind, change: "removed", summary: headline(ir, id, el), details: [], pii: [] };
}

const COMPARED_RELATIONS = ["uses", "calls", "renders", "implements", "handledBy", "triggeredBy", "consumes", "justifiedBy", "decidedBy", "runs", "stores", "carries", "connectsTo", "inLayer", "contains"];

function changed(id: string, before: IrElement, after: IrElement, base: Snapshot, head: Snapshot): ElementChange | undefined {
  const details: string[] = [];
  let summary = headline(head.ir, id, after);

  if (before.meta.status !== after.meta.status) summary += `: \`${before.meta.status}\` → \`${after.meta.status}\``;
  if (before.meta.owner !== after.meta.owner) details.push(`dono: ${before.meta.owner ?? "–"} → ${after.meta.owner ?? "–"}`);
  for (const t of after.meta.tags.filter((x) => !before.meta.tags.includes(x))) details.push(`➕ tag(${t})`);
  for (const t of before.meta.tags.filter((x) => !after.meta.tags.includes(x))) details.push(`➖ tag(${t})`);

  // Campos
  const bf = new Map(fields(before).map((f) => [f.name, f]));
  for (const f of fields(after)) {
    const old = bf.get(f.name);
    bf.delete(f.name);
    if (!old) details.push(`➕ campo \`${fieldText(head.ir, f)}\`${f.tags?.includes("pii") ? " 🔒" : ""}`);
    else if (fieldText(base.ir, old) !== fieldText(head.ir, f)) details.push(`✏️ campo \`${fieldText(base.ir, old)}\` → \`${fieldText(head.ir, f)}\``);
  }
  for (const f of bf.values()) details.push(`➖ campo \`${f.name}\``);

  // Relações declaradas
  const rel = (e: IrElement) => new Set(e.relations.filter((r: IrRelation) => COMPARED_RELATIONS.includes(r.type)).map((r) => `${r.type} ${r.target}${r.label ? ` "${r.label}"` : ""}`));
  const rb = rel(before);
  const rh = rel(after);
  const show = (key: string, ir: IrModel) => {
    const [type, target, ...label] = key.split(" ");
    return `${type} \`${type === "justifiedBy" || type === "decidedBy" ? displayKey(target!) : nameOf(ir, target!)}\`${label.length ? ` ${label.join(" ")}` : ""}`;
  };
  for (const r of rh) if (!rb.has(r)) details.push(`➕ ${show(r, head.ir)}`);
  for (const r of rb) if (!rh.has(r)) details.push(`➖ ${show(r, base.ir)}`);

  // Contrato declarado na planta: rota, parâmetros, retorno, corpo, auth, fluxo, valores.
  const contract = (e: IrElement, ir: IrModel) => JSON.stringify({
    method: e.method, path: e.path ?? e.operation, body: typeText(ir, e.body as IrType | undefined),
    params: ((e.params as { name: string; type: IrType; in?: string }[]) ?? []).map((p) => `${p.name}: ${typeText(ir, p.type)}${p.in ? ` in ${p.in}` : ""}`),
    returns: typeText(ir, e.returns as IrType | undefined),
    responses: ((e.responses as { status: number; type?: IrType }[]) ?? []).map((r) => `${r.status} ${typeText(ir, r.type)}`),
    auth: e.auth, rateLimit: e.rateLimit, values: e.values, cron: e.cron, routes: e.routes, props: e.props, replicas: e.replicas, resourceType: e.resourceType,
  });
  if (contract(before, base.ir) !== contract(after, head.ir)) {
    if (after.kind === "endpoint" || after.kind === "op") details.push(`✏️ antes: ${headline(base.ir, id, before)}`);
    else details.push("✏️ declaração alterada na planta");
  }
  if (JSON.stringify(before.flow ?? null) !== JSON.stringify(after.flow ?? null)) details.push(...flowDiff(before, after));

  // Assinatura no código
  const sb = base.check?.reviewables.get(id);
  const sh = head.check?.reviewables.get(id);
  const signature = sh?.signature && sb?.signature && sb.signature !== sh.signature && !onlyTrackedMembers(sb.signatureText, sh.signatureText)
    ? { before: sb.signatureText, after: sh.signatureText }
    : undefined;

  if (details.length === 0 && !signature && summary === headline(head.ir, id, after)) return undefined;
  return { id, kind: after.kind, change: "changed", summary, details, ...(signature && { signature }), pii: piiOf(after) };
}

/**
 * Classe cuja assinatura só mudou em membros que a planta rastreia como
 * operação (`nome(…)`): a mudança já aparece na própria operação.
 */
function onlyTrackedMembers(before: string, after: string): boolean {
  const changes = lineDiff(before, after).filter((l) => /^ {2}[+-] /.test(l));
  return changes.length > 0 && changes.every((l) => /^ {2}[+-] {3}[\w$]+\(…\)$/.test(l));
}

/** Passos acrescentados e removidos de um processo, pelo nome. */
function flowDiff(before: IrElement, after: IrElement): string[] {
  const steps = (flow: unknown): string[] => {
    const out: string[] = [];
    const walk = (list: Record<string, unknown>[]) => {
      for (const s of list) {
        if (s.op === "step") out.push(String(s.name));
        for (const k of ["then", "else", "body"]) if (Array.isArray(s[k])) walk(s[k] as Record<string, unknown>[]);
      }
    };
    if (Array.isArray(flow)) walk(flow as Record<string, unknown>[]);
    return out;
  };
  const b = steps(before.flow);
  const a = steps(after.flow);
  const lines = [...a.filter((s) => !b.includes(s)).map((s) => `➕ passo \`${s}\``), ...b.filter((s) => !a.includes(s)).map((s) => `➖ passo \`${s}\``)];
  return lines.length > 0 ? lines : ["✏️ fluxo alterado"];
}

/** Dependências reais entre elementos: as do grafo das regras; sem ele, as da injeção de dependência. */
function realDependencies(s: Snapshot): Set<string> {
  const result = new Set<string>();
  if (!s.check) return result;
  if (s.check.dependencies) return new Set(s.check.dependencies.map((d) => `${d.from} → ${d.to}`));
  const byClass = new Map<string, string[]>();
  for (const [id, r] of s.check.resolved) {
    if (r.symbol.kind !== "class") continue;
    byClass.set(r.symbol.name, [...(byClass.get(r.symbol.name) ?? []), id]);
  }
  for (const f of s.check.facts.filter((x) => x.kind === "di")) {
    const from = byClass.get(String(f.data.consumer)) ?? [];
    const to = byClass.get(String(f.data.provider)) ?? [];
    if (from.length === 1 && to.length === 1) result.add(`${from[0]} → ${to[0]}`);
  }
  return result;
}

// ---------------------------------------------------------------------
//  Saída
// ---------------------------------------------------------------------

const ICON: Record<ChangeKind, string> = { added: "➕", changed: "✏️", removed: "➖" };

export function renderDiffMarkdown(diff: ArchDiff, title = "🏗️ Mudanças arquiteturais"): string {
  const out = [`## ${title}`, ""];
  if (diff.empty) {
    out.push("Nenhuma mudança arquitetural.", "");
  }
  for (const g of diff.groups) {
    out.push(`**${g.title}**`, "");
    for (const c of g.changes) {
      const icon = c.signature && c.change === "changed" && c.details.length === 0 ? "⚠️" : ICON[c.change];
      const pii = c.pii.length > 0 ? ` · 🔒 contém \`tag(pii)\`: ${c.pii.map((p) => `\`${p}\``).join(", ")}` : "";
      const sig = c.signature ? " · assinatura alterada" : "";
      out.push(`- ${icon} **${c.kind}** ${c.summary}${sig}${pii}`);
      for (const d of c.details) out.push(`  - ${d}`);
      if (c.signature) {
        out.push("", "  ```diff");
        // O diff em bloco usa o prefixo do próprio formato: "-", "+" ou espaço.
        for (const l of lineDiff(c.signature.before ?? "", c.signature.after)) out.push(`  ${l.slice(2, 3) === " " ? " " : l.slice(2, 3)}${l.slice(3)}`);
        out.push("  ```");
      }
    }
    out.push("");
  }
  if (diff.dependencies.added.length || diff.dependencies.removed.length) {
    out.push("**Dependências reais**", "");
    for (const [a, b] of diff.dependencies.added) {
      const rules = diff.dependencies.violations[`${a} → ${b}`] ?? [];
      out.push(`- ➕ \`${a}\` → \`${b}\`${rules.length > 0 ? ` ❌ viola ${rules.map((r) => `**${r}**`).join(", ")}` : ""}`);
    }
    for (const [a, b] of diff.dependencies.removed) out.push(`- ➖ \`${a}\` → \`${b}\``);
    out.push("");
  }
  if (diff.violations.length) {
    out.push("**Regras**", "");
    for (const v of diff.violations) out.push(`- ❌ ${v.code} ${v.message}`);
    out.push("");
  }
  if (diff.requirements.length) {
    out.push("**Requisitos**", "");
    for (const r of diff.requirements) {
      const count = r.before !== r.after ? `: ${r.before} → ${plural(r.after, "elemento")}` : "";
      out.push(`- ${r.key} ${r.title}${count}${r.textChanged ? " · ⚠️ texto alterado" : ""}`);
    }
    out.push("");
  }
  if (diff.pending > 0) {
    out.push(`**Pendente de revisão humana:** ${plural(diff.pending, "elemento")} (\`planta review\` ou \`planta accept --changed-since <base>\`)`, "");
  }
  return out.join("\n");
}

/** Texto para o terminal: o mesmo conteúdo, sem marcação Markdown. */
export function renderDiffText(diff: ArchDiff): string {
  return renderDiffMarkdown(diff, "Mudanças arquiteturais")
    .replace(/^## /gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^ {2}```diff\n|^ {2}```\n/gm, "")
    .replace(/^- /gm, "")
    .replace(/^ {2}- /gm, "    ");
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
