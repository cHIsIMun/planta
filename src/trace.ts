// Rastreabilidade (seção 14): matriz requisito → elementos, injeção da lista
// de implementações no próprio Markdown do requisito e análise de impacto.

import { dirname, join, relative } from "node:path";
import { displayKey, type Requirement, type Reviewable } from "./check.ts";
import type { IrElement, IrModel, IrType } from "./ir.ts";

export interface TraceRow {
  key: string;
  title: string;
  status: string;
  /** Elementos que justificam o requisito, por coluna. */
  columns: Record<Column, string[]>;
  review: "ok" | "changed" | "pending" | "none";
}

export type Column = "process" | "endpoint" | "op" | "page" | "other";

const COLUMN_TITLES: Record<Column, string> = {
  process: "Processos",
  endpoint: "Endpoints",
  op: "Operações",
  page: "Páginas",
  other: "Outros",
};

const REVIEW_TEXT: Record<TraceRow["review"], string> = {
  ok: "✓",
  changed: "⚠ alterado",
  pending: "pendente",
  none: "✗ sem implementação",
};

export function traceRows(ir: IrModel, requirements: Map<string, Requirement>, reviewables: Map<string, Reviewable>): TraceRow[] {
  return [...requirements.values()]
    .filter((r) => r.kind === "requirement")
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((r) => {
      const columns: Record<Column, string[]> = { process: [], endpoint: [], op: [], page: [], other: [] };
      for (const id of r.justifiedBy) {
        const el = ir.elements[id];
        if (!el) continue;
        const column: Column = el.kind === "process" || el.kind === "endpoint" || el.kind === "op" || el.kind === "page" ? el.kind : "other";
        columns[column].push(id);
      }
      const states = r.justifiedBy.map((id) => reviewables.get(id));
      const key = displayKey(r.key);
      const review: TraceRow["review"] = r.justifiedBy.length === 0 ? "none"
        : states.some((s) => s?.requirementsChanged.includes(key)) ? "changed"
        : states.every((s) => s?.state === "reviewed") ? "ok"
        : "pending";
      return { key, title: r.title, status: String(r.attributes.status ?? ""), columns, review };
    });
}

/** Rótulo curto de um elemento na matriz: rota do endpoint, `Componente.op`, nome. */
function label(ir: IrModel, id: string): string {
  const el = ir.elements[id]!;
  if (el.kind === "endpoint") return `${el.method} ${el.path ?? el.operation}`;
  if (el.kind === "op") return `${ir.elements[el.parent!]?.name ?? ""}.${el.name}`;
  return el.name;
}

export function traceTable(ir: IrModel, rows: TraceRow[], format: "markdown" | "csv" | "html"): string {
  const columns = (Object.keys(COLUMN_TITLES) as Column[]).filter((c) => c !== "other" || rows.some((r) => r.columns.other.length > 0));
  const header = ["Requisito", "Status", ...columns.map((c) => COLUMN_TITLES[c]), "Revisado"];
  const cells = rows.map((r) => [
    `${r.key} ${r.title}`,
    r.status || "–",
    ...columns.map((c) => r.columns[c].map((id) => label(ir, id)).join(", ") || "–"),
    REVIEW_TEXT[r.review],
  ]);

  if (format === "csv") {
    const csv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    return [header, ...cells].map((row) => row.map(csv).join(",")).join("\n") + "\n";
  }
  if (format === "html") {
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const tr = (row: string[], tag: string) => `<tr>${row.map((v) => `<${tag}>${esc(v)}</${tag}>`).join("")}</tr>`;
    return `<table>\n<thead>${tr(header, "th")}</thead>\n<tbody>\n${cells.map((c) => tr(c, "td")).join("\n")}\n</tbody>\n</table>\n`;
  }
  const md = (v: string) => v.replace(/\|/g, "\\|");
  return [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...cells.map((row) => `| ${row.map(md).join(" | ")} |`),
  ].join("\n") + "\n";
}

const TRACE = /(<!--\s*planta:trace\s*-->)[\s\S]*?(<!--\s*\/planta:trace\s*-->)/g;

/**
 * Preenche cada `<!-- planta:trace -->` (seção 14.4) com os elementos que
 * justificam o requisito da seção onde o bloco está: links para a planta e
 * para o código, relativos ao arquivo Markdown.
 */
export function injectTrace(
  markdown: string,
  file: string,
  ir: IrModel,
  requirements: Requirement[],
  links: { projectRoot: string; plantaPath: (el: IrElement) => string },
): { text: string; problems: { line: number; message: string }[] } {
  const problems: { line: number; message: string }[] = [];
  const inFile = requirements.filter((r) => r.file === file).sort((a, b) => a.line - b.line);
  const dir = dirname(join(links.projectRoot, file));
  const rel = (abs: string) => relative(dir, abs).split("\\").join("/");

  const text = markdown.replace(TRACE, (whole, open: string, close: string, offset: number) => {
    const line = markdown.slice(0, offset).split("\n").length;
    const req = inFile.filter((r) => r.line <= line).at(-1);
    if (!req) {
      problems.push({ line, message: "bloco planta:trace fora de uma seção de requisito" });
      return whole;
    }
    const items = req.justifiedBy.map((id) => {
      const el = ir.elements[id]!;
      const planta = `[${id}](${rel(links.plantaPath(el))}#L${el.source.line})`;
      const path = codePath(ir, id);
      const code = path ? ` → [${path}](${rel(join(links.projectRoot, path))})` : "";
      return `- ${el.kind} ${planta}${code}`;
    });
    const body = items.length > 0 ? items.join("\n") : "_Nenhum elemento justifica este requisito._";
    return `${open}\n${body}\n${close}`;
  });
  return { text, problems };
}

/** Arquivo de código do elemento; um endpoint usa o do handler. */
export function codePath(ir: IrModel, id: string): string | undefined {
  const el = ir.elements[id];
  if (!el) return undefined;
  if (el.anchor?.path) return el.anchor.path;
  const handler = el.relations.find((r) => r.type === "handledBy")?.target;
  return handler ? ir.elements[handler]?.anchor?.path : undefined;
}

// ---------------------------------------------------------------------
//  Impacto (seção 14.5)
// ---------------------------------------------------------------------

export interface Impact {
  target: string;
  title: string;
  /** Para requisitos: elementos que o justificam. */
  justifiedBy: string[];
  /** Quem depende, direta ou transitivamente, do alvo (ou dos que o justificam). */
  dependents: { id: string; via: string; depth: number }[];
  processes: string[];
  requirements: string[];
}

/** Arestas "A depende de B" que o IR conhece, com o motivo. */
function dependencies(ir: IrModel): Map<string, { on: string; via: string }[]> {
  const deps = new Map<string, { on: string; via: string }[]>();
  const add = (from: string, on: string, via: string) => {
    if (from === on || !ir.elements[on]) return;
    deps.set(from, [...(deps.get(from) ?? []), { on, via }]);
  };
  const types = (from: string, t: IrType | undefined, via: string) => {
    if (!t) return;
    if ("map" in t) {
      types(from, t.map.key, via);
      types(from, t.map.value, via);
    } else add(from, t.ref, via);
  };
  const flow = (from: string, stmts: Record<string, unknown>[]) => {
    for (const s of stmts) {
      if (typeof s.target === "string") add(from, s.target, `passo ${s.name}`);
      for (const k of ["emit", "event"] as const) if (typeof s[k] === "string") add(from, s[k] as string, s.op === "wait" ? "aguarda" : "emite");
      for (const k of ["then", "else", "body"] as const) if (Array.isArray(s[k])) flow(from, s[k] as Record<string, unknown>[]);
    }
  };

  for (const [id, el] of Object.entries(ir.elements)) {
    for (const r of el.relations) {
      if (["uses", "calls", "renders", "implements", "handledBy", "triggeredBy", "consumes", "runs", "carries", "stores"].includes(r.type)) add(id, r.target, r.type);
    }
    for (const f of (el.fields as { type: IrType }[] | undefined) ?? []) types(id, f.type, "campo");
    for (const p of (el.params as { type: IrType }[] | undefined) ?? []) types(id, p.type, "parâmetro");
    types(id, el.returns as IrType | undefined, "retorno");
    types(id, el.body as IrType | undefined, "corpo");
    for (const r of (el.responses as { type?: IrType }[] | undefined) ?? []) types(id, r.type, "resposta");
    if (Array.isArray(el.flow)) flow(id, el.flow as Record<string, unknown>[]);
    // Mudar uma operação afeta o componente que a contém e, por ele, quem usa o componente.
    if (el.kind === "op" && el.parent) add(el.parent, id, "membro");
  }
  return deps;
}

export function impact(ir: IrModel, requirements: Map<string, Requirement>, target: string): Impact | undefined {
  const req = requirements.get(target) ?? [...requirements.values()].find((r) => displayKey(r.key) === target);
  if (!req && !ir.elements[target]) return undefined;

  const deps = dependencies(ir);
  const dependentsOf = new Map<string, { id: string; via: string }[]>();
  for (const [from, list] of deps) for (const d of list) dependentsOf.set(d.on, [...(dependentsOf.get(d.on) ?? []), { id: from, via: d.via }]);

  const roots = req ? req.justifiedBy : [target];
  const seen = new Set(roots);
  const dependents: Impact["dependents"] = [];
  let frontier = roots.map((id) => ({ id, depth: 0 }));
  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const { id, depth } of frontier) {
      for (const d of dependentsOf.get(id) ?? []) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        dependents.push({ id: d.id, via: d.via, depth: depth + 1 });
        next.push({ id: d.id, depth: depth + 1 });
      }
    }
    frontier = next;
  }

  const affected = [...roots, ...dependents.map((d) => d.id)];
  const reqs = new Set<string>();
  for (const id of affected) {
    for (const r of ir.elements[id]?.relations ?? []) {
      if ((r.type === "justifiedBy" || r.type === "decidedBy") && r.target !== req?.key) reqs.add(displayKey(r.target));
    }
  }
  return {
    target: req ? displayKey(req.key) : target,
    title: req?.title ?? ir.elements[target]!.name,
    justifiedBy: req ? [...req.justifiedBy] : [],
    dependents,
    processes: affected.filter((id) => ir.elements[id]?.kind === "process"),
    requirements: [...reqs].sort(),
  };
}

export function renderImpact(ir: IrModel, result: Impact): string {
  const where = (id: string) => {
    const el = ir.elements[id]!;
    const path = codePath(ir, id);
    return path ? `→ ${path}` : `(${el.source.file}:${el.source.line})`;
  };
  const line = (id: string, extra = "") => `  ${id} ${ir.elements[id]!.kind}${extra}  ${where(id)}`;
  const out = [`Impacto de ${result.target} (${result.title})`, ""];
  if (result.justifiedBy.length > 0 || ir.elements[result.target] === undefined) {
    out.push(`Justificado por (${result.justifiedBy.length}):`, ...result.justifiedBy.map((id) => line(id)), "");
  }
  out.push(`Dependentes (${result.dependents.length}):`);
  for (const d of result.dependents) out.push(`${"  ".repeat(d.depth - 1)}${line(d.id, ` · ${d.via}`)}`);
  if (result.dependents.length === 0) out.push("  nenhum");
  out.push("", `Processos afetados: ${result.processes.join(", ") || "nenhum"}`);
  const isRequirement = ir.elements[result.target] === undefined;
  out.push(`${isRequirement ? "Outros requisitos afetados" : "Requisitos afetados"}: ${result.requirements.join(", ") || "nenhum"}`);
  return out.join("\n") + "\n";
}
