// `planta suggest` (seção 10.2): declaração Planta para um fato do código que
// a planta ainda não descreve. O humano (ou o agente) revisa e cola.

import type { CheckResult } from "./check.ts";
import type { FieldFact, Fact, HttpEndpointData } from "./facts.ts";
import type { IrModel } from "./ir.ts";
import { type IacFlavor, plantaTypeFor } from "./catalog/resources.ts";
import { anchorText, type Derived } from "./derive.ts";

export interface Suggestion {
  fact: string;
  /** Contexto onde a declaração deve entrar, quando dá para saber pelo `root`. */
  context?: string;
  /** Elemento dentro do qual a declaração entra, quando não é o contexto (a API de um endpoint). */
  container?: string;
  text: string;
}

/** Fatos sem elemento correspondente, dos tipos que a planta descreve. */
export function uncovered(result: CheckResult): Fact[] {
  const matched = result.covered;
  const describable = new Set(["http.endpoint", "entity", "service", "controller", "event.handler", "job", "ui.route", "iac.resource"]);
  return result.facts.filter((f) => describable.has(f.kind) && !matched.has(f.id));
}

export function suggest(fact: Fact, ir: IrModel, derived: Derived): Suggestion {
  const context = contextFor(fact.location.file, ir, derived);
  const root = context ? derived.roots.get(context) : undefined;
  const anchor = (symbol: string) => `@"${anchorText(fact.location.file, symbol, root)}"`;
  const d = fact.data;

  switch (fact.kind) {
    case "http.endpoint": {
      const e = d as unknown as HttpEndpointData;
      // Rota relativa à `base` de uma API do mesmo contexto, se houver.
      const api = Object.entries(ir.elements).find(([, el]) => el.kind === "api" && el.protocol === "http" && (!context || el.parent === context)
        && typeof el.base === "string" && e.path.startsWith(el.base));
      const path = api ? e.path.slice(String(api[1].base).length) || "/" : e.path;
      const lines = [`endpoint ${e.method} "${path}" => ${e.handler} {`];
      if (e.body) lines.push(`  body ${e.body}`);
      for (const p of e.params) lines.push(`  param ${p.name}: ${plantaType(p.type)} in ${p.in}`);
      for (const r of e.responses) lines.push(`  returns ${r.status}`);
      lines.push("}");
      const where = api ? `// dentro de \`api ${api[1].name}\`` : "// dentro de uma `api ... http`";
      return { fact: fact.id, ...(context && { context }), ...(api && { container: api[0] }), text: `${where}\n${lines.join("\n")}` };
    }
    case "entity": {
      const fields = (d.fields as FieldFact[]).map((f) => {
        const mods = Object.entries(f.modifiers).map(([k, v]) => (v.length ? `${k}(${v.join(", ")})` : k));
        return `  ${f.name}: ${f.type === "unknown" ? "decimal /* number no código: ajuste o tipo */" : f.type}${f.list ? "[]" : ""}${f.optional ? "?" : ""}${mods.length ? ` ${mods.join(" ")}` : ""}`;
      });
      return { fact: fact.id, ...(context && { context }), text: `entity ${fact.location.symbol} ${anchor(fact.location.symbol!)} {\n${fields.join("\n")}\n}` };
    }
    case "service":
    case "controller":
      return { fact: fact.id, ...(context && { context }), text: `${fact.kind} ${fact.location.symbol} ${anchor(fact.location.symbol!)}` };
    case "event.handler":
      return {
        fact: fact.id,
        ...(context && { context }),
        text: `// o código consome o evento "${d.event}"; declare o evento e ligue-o ao handler\non NomeDoEvento => ${d.handler}`,
      };
    case "job": {
      const name = String(d.handler).split(".").at(-1)!.replace(/^./, (c) => c.toUpperCase());
      return { fact: fact.id, ...(context && { context }), text: `job ${name} cron "${d.cron}" => ${d.handler}` };
    }
    case "ui.route": {
      const app = Object.entries(ir.elements).find(([, el]) => el.kind === "app" && typeof el.root === "string" && fact.location.file.startsWith(`${el.root}/`))?.[0];
      const guards = (d.guards as string[]).map((g) => elementNamed(ir, app, g) ?? g);
      const target = elementNamed(ir, app, String(d.component)) ?? String(d.component);
      const text = `route "${d.path}" => ${target}${guards.length > 0 ? ` guard ${guards[0]}` : ""}`;
      return { fact: fact.id, ...(app && { container: app }), text: guards.length > 1 ? `${text} // o código também aplica ${guards.slice(1).join(", ")}` : text };
    }
    case "iac.resource": {
      const flavor = d.flavor as IacFlavor;
      const type = plantaTypeFor(flavor, String(d.type)) ?? `generic.${String(d.type).replace(/[^A-Za-z0-9_.]/g, "_").toLowerCase()}`;
      const root = String(d.root);
      const deployment = Object.entries(ir.elements).find(([, el]) => {
        const path = (el.iac as { path?: string } | undefined)?.path?.replace(/^\/+|\/+$/g, "");
        return el.kind === "deployment" && path !== undefined && (path === root || fact.location.file === path || fact.location.file.startsWith(`${path}/`));
      })?.[0];
      const scheme = { terraform: "tf", cloudformation: "cdk", kubernetes: "k8s", compose: "compose" }[flavor];
      const name = String(d.address).split(/[./]/).at(-1)!.replace(/[^A-Za-z0-9_]/g, "_");
      return { fact: fact.id, ...(deployment && { container: deployment }), text: `${name}: ${type} @"${scheme}:${d.address}"` };
    }
    default:
      return { fact: fact.id, text: `// sem sugestão para fatos do tipo ${fact.kind}` };
  }
}

/** Nome, no app, do elemento ancorado no símbolo `unit` (a página `Checkout`, o guard `Autenticado`). */
function elementNamed(ir: IrModel, app: string | undefined, unit: string): string | undefined {
  return Object.values(ir.elements).find((el) => el.parent === app && el.anchor?.symbol === unit)?.name;
}

/** Contexto cujo `root` contém o arquivo; o mais específico vence. */
function contextFor(file: string, ir: IrModel, derived: Derived): string | undefined {
  return Object.entries(ir.elements)
    .filter(([id, el]) => el.kind === "context" && derived.roots.has(id) && file.startsWith(`${derived.roots.get(id)}/`))
    .sort(([a], [b]) => derived.roots.get(b)!.length - derived.roots.get(a)!.length)[0]?.[0];
}

function plantaType(ts: string | undefined): string {
  switch (ts) {
    case "string": return "string";
    case "number": return "int";
    case "boolean": return "bool";
    case undefined: return "string";
    default: return ts;
  }
}
