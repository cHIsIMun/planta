// Renderizador D2 (seção 13.4): deployment com ícones do provedor. Agrupadores
// viram contêineres; conexões usam o caminho completo do nó (`vpc.privada.db`).

import { resourceType } from "../catalog/resources.ts";
import type { IrModel } from "../ir.ts";
import { RenderError } from "./mermaid.ts";
import type { View } from "./views.ts";

export const D2_KINDS = new Set(["deployment"]);

export function renderD2(view: View, ir: IrModel): string {
  if (!D2_KINDS.has(view.kind)) throw new RenderError(`o renderizador D2 cobre só views de deployment; \`${view.name}\` é ${view.kind}`);
  const root = view.of && ir.elements[view.of];
  if (!root || root.kind !== "deployment") throw new RenderError(`view \`${view.name}\`: \`of\` deve ser um deployment`);

  const lines = ["direction: right", ""];
  const children = (parent: string) => Object.keys(ir.elements)
    .filter((id) => ir.elements[id]!.parent === parent)
    .sort((a, b) => ir.elements[a]!.source.line - ir.elements[b]!.source.line);
  const paths = new Map<string, string>();

  const emit = (id: string, path: string[], depth: number) => {
    const e = ir.elements[id]!;
    const pad = "  ".repeat(depth);
    const key = [...path, safe(e.name)];
    paths.set(id, key.join("."));
    const type = typeof e.resourceType === "string" ? resourceType(e.resourceType) : undefined;
    const props = [
      ...(type?.icon ? [`icon: ${type.icon}`] : []),
      ...(type?.shape ? [`shape: ${type.shape}`] : []),
    ];
    if (e.kind === "group") {
      const what = type?.label ?? (e.groupKind === "zone" ? "zona" : String(e.groupKind));
      lines.push(`${pad}${safe(e.name)}: ${quote(`${e.name} · ${what}`)} {`);
      for (const p of props) lines.push(`${pad}  ${p}`);
      for (const c of children(id)) emit(c, key, depth + 1);
      lines.push(`${pad}}`);
      return;
    }
    const name = e.replicas ? `${e.name} (×${e.replicas})` : e.name;
    const details = [
      type?.label ?? String(e.resourceType ?? ""),
      ...e.relations.filter((r) => r.type === "runs").map((r) => `app: ${label(ir, r.target)}`),
      ...group(e.relations.filter((r) => r.type === "stores").map((r) => label(ir, r.target)), "dados"),
      ...group(e.relations.filter((r) => r.type === "carries").map((r) => label(ir, r.target)), "canal"),
    ].filter(Boolean);
    const text = [name, ...details].join("\n");
    lines.push(props.length > 0 ? `${pad}${safe(e.name)}: ${quote(text)} {` : `${pad}${safe(e.name)}: ${quote(text)}`);
    if (props.length > 0) {
      for (const p of props) lines.push(`${pad}  ${p}`);
      lines.push(`${pad}}`);
    }
  };

  for (const c of children(view.of!)) emit(c, [], 0);
  const edges: string[] = [];
  for (const [id, path] of paths) {
    for (const r of ir.elements[id]!.relations.filter((x) => x.type === "connectsTo")) {
      const target = paths.get(r.target);
      if (target) edges.push(`${path} -> ${target}${r.label ? `: ${quote(r.label)}` : ""}`);
    }
  }
  if (edges.length > 0) lines.push("", ...edges);
  return `${lines.join("\n")}\n`;
}

function group(names: string[], what: string): string[] {
  return names.length > 0 ? [`${what}: ${names.join(", ")}`] : [];
}

function label(ir: IrModel, id: string): string {
  const el = ir.elements[id];
  return el?.kind === "channel" || el?.kind === "entity" ? id : el?.name ?? id;
}

/** Chave D2: identificadores simples ficam como estão; o resto vai entre aspas. */
function safe(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name) ? name : quote(name);
}

function quote(text: string): string {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}
