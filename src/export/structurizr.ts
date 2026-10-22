// `planta export --format structurizr`: o modelo em Structurizr DSL (C4).
//
// system → softwareSystem; actor → person; external → softwareSystem
// externo; app → container; componentes dos contextos que o app contém (e os
// do próprio app) → component; deployment → deploymentEnvironment com
// deploymentNode, infrastructureNode e containerInstance. Relações vêm de
// `uses`, `calls` (até o componente que trata o endpoint) e `renders`.

import { COMPONENT_KINDS } from "../ast.ts";
import type { IrModel } from "../ir.ts";

const COMPONENTS = new Set<string>(COMPONENT_KINDS);

export function toStructurizr(ir: IrModel): string {
  const els = ir.elements;
  const ids = new Map<string, string>();
  const used = new Set<string>();
  /** Identificador DSL único e estável a partir do ID da planta. */
  const ident = (id: string) => {
    if (!ids.has(id)) {
      let base = id.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "x";
      if (/^\d/.test(base)) base = `e_${base}`;
      let candidate = base;
      for (let i = 2; used.has(candidate); i++) candidate = `${base}_${i}`;
      used.add(candidate);
      ids.set(id, candidate);
    }
    return ids.get(id)!;
  };
  const q = (s: string | undefined) => `"${(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\s*\n\s*/g, " ")}"`;
  const of = (kind: string) => Object.entries(els).filter(([, e]) => e.kind === kind).sort(([a], [b]) => a.localeCompare(b));
  const ancestors = (id: string) => {
    const out: string[] = [];
    for (let c: string | undefined = id; c && els[c]; c = els[c]!.parent) out.push(c);
    return out;
  };

  const systemId = ir.system?.id ?? "Sistema";
  const system = ident(`system:${systemId}`);
  const lines: string[] = [`workspace ${q(systemId)} ${q(ir.system?.description)} {`, "", "  model {"];

  for (const [id, e] of of("actor")) lines.push(`    ${ident(id)} = person ${q(e.name)} ${q(String(e.description ?? e.docs ?? ""))}`);
  for (const [id, e] of of("external")) {
    lines.push(`    ${ident(id)} = softwareSystem ${q(e.name)} ${q(String(e.description ?? e.docs ?? ""))} {`, `      tags "Externo"`, "    }");
  }

  // Componente → container: o app que o contém (o mais específico), ou o próprio contexto.
  const apps = of("app");
  const containerOf = new Map<string, string>();
  const components = Object.keys(els).filter((id) => COMPONENTS.has(els[id]!.kind)).sort();
  for (const id of components) {
    const chain = ancestors(id);
    const owner = apps.find(([app]) => chain.includes(app))
      ?? apps.find(([, a]) => a.relations.some((r) => r.type === "contains" && r.target === id))
      ?? apps.find(([, a]) => a.relations.some((r) => r.type === "contains" && chain.includes(r.target)));
    const context = chain.find((c) => els[c]!.kind === "context");
    const target = owner?.[0] ?? context;
    if (target) containerOf.set(id, target);
  }
  const containers = [...new Set([...apps.map(([id]) => id), ...containerOf.values()])].sort();

  lines.push(`    ${system} = softwareSystem ${q(systemId)} ${q(ir.system?.description)} {`);
  for (const c of containers) {
    const e = els[c]!;
    const technology = e.kind === "app" ? String(e.framework ?? e.appKind ?? "") : "contexto sem app";
    lines.push(`      ${ident(c)} = container ${q(e.name)} ${q(e.docs ?? (e.kind === "app" ? String(e.appKind ?? "") : ""))} ${q(technology)} {`);
    for (const id of components.filter((x) => containerOf.get(x) === c)) {
      const comp = els[id]!;
      lines.push(`        ${ident(id)} = component ${q(comp.name)} ${q(comp.docs?.split("\n")[0])} ${q(comp.kind)}`);
    }
    lines.push("      }");
  }
  lines.push("    }", "");

  // Relações entre componentes (e de componentes para sistemas externos).
  const unit = (id: string): string | undefined => {
    const chain = ancestors(id);
    const comp = chain.find((c) => COMPONENTS.has(els[c]!.kind) && containerOf.has(c));
    if (comp) return comp;
    return chain.find((c) => els[c]!.kind === "external");
  };
  const handlerOf = (endpoint: string) => els[endpoint]?.relations.find((r) => r.type === "handledBy")?.target;
  const relations = new Map<string, string>();
  for (const id of components) {
    for (const r of els[id]!.relations) {
      const target = r.type === "calls" ? handlerOf(r.target) : r.type === "uses" || r.type === "renders" ? r.target : undefined;
      const to = target && unit(target);
      if (!to || to === id || !containerOf.has(id)) continue;
      const label = r.type === "calls" ? `chama ${els[r.target]?.method ?? ""} ${els[r.target]?.path ?? ""}`.trim() : r.type === "renders" ? "renderiza" : "usa";
      if (!relations.has(`${id}->${to}`)) relations.set(`${id}->${to}`, label);
    }
  }
  for (const [key, label] of relations) {
    const [from, to] = key.split("->") as [string, string];
    lines.push(`    ${ident(from)} -> ${ident(to)} ${q(label)}`);
  }
  for (const [id] of of("actor")) lines.push(`    ${ident(id)} -> ${system} "Usa"`);
  if (relations.size > 0 || of("actor").length > 0) lines.push("");

  // Deployment.
  const deployments = of("deployment");
  for (const [dep, d] of deployments) {
    lines.push(`    deploymentEnvironment ${q(d.name)} {`);
    const children = (parent: string) => Object.keys(els).filter((id) => els[id]!.parent === parent).sort((a, b) => els[a]!.source.line - els[b]!.source.line);
    const node = (id: string, depth: number) => {
      const e = els[id]!;
      const pad = "  ".repeat(depth);
      const tech = q(String(e.resourceType ?? e.groupKind ?? ""));
      if (e.kind === "group") {
        lines.push(`${pad}${ident(id)} = deploymentNode ${q(e.name)} "" ${tech} {`);
        for (const c of children(id)) node(c, depth + 1);
        lines.push(`${pad}}`);
        return;
      }
      const runs = e.relations.filter((r) => r.type === "runs" && els[r.target]?.kind === "app").map((r) => r.target);
      // No nível do ambiente só cabem deploymentNode: um nó solto sem app vira um.
      if (runs.length === 0) {
        lines.push(`${pad}${ident(id)} = ${depth === 3 ? "deploymentNode" : "infrastructureNode"} ${q(e.name)} "" ${tech}`);
        return;
      }
      const instances = typeof e.replicas === "number" ? ` ${e.replicas}` : "";
      lines.push(`${pad}${ident(id)} = deploymentNode ${q(e.name)} "" ${tech}${instances} {`);
      for (const app of runs) lines.push(`${pad}  containerInstance ${ident(app)}`);
      lines.push(`${pad}}`);
    };
    for (const c of children(dep)) node(c, 3);
    for (const id of Object.keys(els).filter((x) => ancestors(x).includes(dep))) {
      for (const r of els[id]!.relations.filter((x) => x.type === "connectsTo")) {
        if (ids.has(r.target)) lines.push(`      ${ident(id)} -> ${ident(r.target)}${r.label ? ` ${q(r.label)}` : ""}`);
      }
    }
    lines.push("    }");
  }
  lines.push("  }", "", "  views {");
  lines.push(`    systemContext ${system} "contexto" {`, "      include *", "      autolayout lr", "    }");
  lines.push(`    container ${system} "containers" {`, "      include *", "      autolayout lr", "    }");
  for (const c of containers.filter((x) => components.some((id) => containerOf.get(id) === x))) {
    lines.push(`    component ${ident(c)} ${q(`componentes-${els[c]!.name}`)} {`, "      include *", "      autolayout lr", "    }");
  }
  for (const [, d] of deployments) {
    lines.push(`    deployment * ${q(d.name)} ${q(`deployment-${d.name}`)} {`, "      include *", "      autolayout lr", "    }");
  }
  lines.push("  }", "}");
  return `${lines.join("\n")}\n`;
}

