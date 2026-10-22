// Frontend contra o código (seção 6.14): rotas registradas (PL320, PL321),
// chamadas HTTP sem endpoint declarado (PL240), `calls`, `renders` e stores
// declarados contra o que o código faz (PL241, PL242) e elementos fora do
// `root` do app que os contém (PL230).
//
// A chamada HTTP feita por um hook ou módulo de API conta para o componente
// que o chama (fatos `call`, transitivamente): é assim que o frontend
// costuma ser escrito.

import type * as A from "../ast.ts";
import { type Fact, routeKey } from "../facts.ts";
import type { ValidationContext } from "./context.ts";

const UI_ELEMENTS = new Set(["page", "component", "guard", "store"]);

interface App {
  id: string;
  root: string;
  decl: A.AppDecl;
}

function apps(ctx: ValidationContext): App[] {
  return ctx.model.merged.decls
    .filter((d): d is A.AppDecl => d.kind === "app")
    .flatMap((decl) => {
      const root = ctx.elements[decl.name.name]?.root;
      return typeof root === "string" ? [{ id: decl.name.name, root, decl }] : [];
    });
}

const under = (file: string, root: string) => root === "" || file === root || file.startsWith(`${root}/`);

/** Nome do símbolo de código de um elemento: o resolvido, ou o da âncora. */
function unitOf(ctx: ValidationContext, id: string): string | undefined {
  return ctx.resolved.get(id)?.symbol.name ?? ctx.elements[id]?.anchor?.symbol;
}

// ---------------------------------------------------------------------
//  Rotas (antes da cobertura: as rotas de um app são dele, não PL301)
// ---------------------------------------------------------------------

export function matchRoutes(ctx: ValidationContext): void {
  const routes = ctx.facts.filter((f) => f.kind === "ui.route");
  for (const app of apps(ctx)) {
    const inApp = routes.filter((f) => under(f.location.file, app.root));
    if (inApp.length === 0 && app.decl.routes.length === 0) continue;
    const planned = ctx.elements[app.id]!.meta.status === "planned";
    const byPath = new Map(inApp.map((f) => [routeKey("GET", String(f.data.path)), f]));

    for (const route of app.decl.routes) {
      const fact = byPath.get(routeKey("GET", route.path));
      const target = targetOf(ctx, app, route.target.name);
      if (!fact) {
        if (!planned && ctx.elements[target ?? ""]?.meta.status !== "planned") {
          ctx.report("PL321", "error", `rota "${route.path}" de \`${app.id}\` não está registrada no código`, route.loc);
        }
        continue;
      }
      byPath.delete(routeKey("GET", route.path));
      ctx.cover(fact.id);
      const at = [ctx.codeLoc(fact.location.file, fact.location.line)];
      const component = String(fact.data.component);
      const expected = target && unitOf(ctx, target);
      if (expected && expected !== component) {
        ctx.report("PL321", "error", `rota "${route.path}": a planta leva a \`${target}\` (${expected}), o código renderiza ${component}`, route.loc, at);
      }
      const guards = fact.data.guards as string[];
      const guard = route.guard && targetOf(ctx, app, route.guard.name);
      const guardUnit = guard && unitOf(ctx, guard);
      if (guardUnit && !guards.includes(guardUnit)) {
        ctx.report("PL321", "error", `rota "${route.path}": a planta exige o guard \`${guard}\` (${guardUnit}), mas o código não o aplica`, route.loc, at);
      }
      const declaredGuards = new Set(guardUnit ? [guardUnit] : []);
      const extra = guards.filter((g) => !declaredGuards.has(g) && guardElement(ctx, app, g));
      for (const g of extra) {
        ctx.report("PL321", "error", `rota "${route.path}": o código aplica o guard ${g}, que a planta não declara na rota`, route.loc, at);
      }
    }
    for (const fact of byPath.values()) {
      ctx.reported(fact.id);
      ctx.report("PL320", "error", `rota "${fact.data.path}" (${fact.data.component}) registrada no código sem \`route\` em \`${app.id}\``,
        ctx.codeLoc(fact.location.file, fact.location.line));
    }
  }
}

function targetOf(ctx: ValidationContext, app: App, name: string): string | undefined {
  return [`${app.id}.${name}`, name].find((id) => ctx.elements[id]);
}

function guardElement(ctx: ValidationContext, app: App, unit: string): boolean {
  return Object.entries(ctx.elements).some(([id, el]) => el.parent === app.id && el.kind === "guard" && unitOf(ctx, id) === unit);
}

// ---------------------------------------------------------------------
//  Chamadas, renderização e stores
// ---------------------------------------------------------------------

export function validateFrontend(ctx: ValidationContext): void {
  const endpoints = new Map<string, string>();
  for (const [id, el] of Object.entries(ctx.elements)) {
    if (el.kind === "endpoint" && el.protocol === "http") endpoints.set(routeKey(String(el.method), String(el.path)), id);
  }
  const clients = ctx.facts.filter((f) => f.kind === "http.client");
  const calls = ctx.facts.filter((f) => f.kind === "call");
  const renders = ctx.facts.filter((f) => f.kind === "ui.render");
  const stores = new Set(ctx.facts.filter((f) => f.kind === "ui.store").map((f) => String(f.data.name)));
  const endpointOf = (f: Fact) => endpoints.get(routeKey(String(f.data.method), String(f.data.path)));

  for (const app of apps(ctx)) {
    const inApp = (f: Fact) => under(f.location.file, app.root);
    for (const f of clients.filter(inApp)) {
      if (endpointOf(f)) ctx.cover(f.id);
      else {
        ctx.reported(f.id);
        ctx.report("PL240", "error", `chamada HTTP ${f.data.method} ${f.data.path} (em ${f.data.in}) não corresponde a nenhum endpoint declarado`,
          ctx.codeLoc(f.location.file, f.location.line));
      }
    }

    const edges = new Map<string, string[]>();
    for (const c of calls.filter(inApp)) edges.set(String(c.data.caller), [...(edges.get(String(c.data.caller)) ?? []), String(c.data.callee)]);
    /** A unidade e tudo o que ela chama, menos stores (que são folhas). */
    const reachable = (unit: string) => {
      const seen = new Set([unit]);
      const queue = [unit];
      while (queue.length > 0) {
        for (const next of edges.get(queue.shift()!) ?? []) {
          if (seen.has(next) || stores.has(next)) continue;
          seen.add(next);
          queue.push(next);
        }
      }
      return seen;
    };

    const members = Object.entries(ctx.elements).filter(([, el]) => el.parent === app.id && UI_ELEMENTS.has(el.kind));
    const byUnit = new Map(members.flatMap(([id]) => {
      const u = unitOf(ctx, id);
      return u ? [[u, id] as const] : [];
    }));

    for (const [id, el] of members) {
      const unit = unitOf(ctx, id);
      if (!unit || el.kind === "store" || el.meta.status === "planned" || !ctx.resolved.has(id)) continue;
      const reach = reachable(unit);
      const actual = {
        calls: new Set(clients.filter((f) => inApp(f) && reach.has(String(f.data.in))).flatMap((f) => endpointOf(f) ?? [])),
        renders: new Set(renders.filter((f) => inApp(f) && f.data.parent === unit).flatMap((f) => byUnit.get(String(f.data.child)) ?? [])),
        uses: new Set(calls.filter((f) => inApp(f) && reach.has(String(f.data.caller)) && stores.has(String(f.data.callee))).flatMap((f) => byUnit.get(String(f.data.callee)) ?? [])),
      };
      for (const relation of ["calls", "renders", "uses"] as const) {
        // `uses` também aponta para externos e componentes; aqui só contam as stores.
        const declared = new Set(el.relations.filter((r) => r.type === relation && (relation !== "uses" || ctx.elements[r.target]?.kind === "store")).map((r) => r.target));
        for (const target of actual[relation]) {
          if (!declared.has(target)) {
            ctx.report("PL241", "warning", `\`${id}\` ${verb(relation)} \`${target}\` no código, mas não declara \`${relation} ${nameFrom(id, target)}\``, el.source);
          }
        }
        for (const target of declared) {
          if (!actual[relation].has(target)) {
            ctx.report("PL242", "warning", `\`${id}\` declara \`${relation} ${nameFrom(id, target)}\`, mas o código não ${verb(relation, true)}`, el.source);
          }
        }
      }
    }
  }
}

function verb(relation: "calls" | "renders" | "uses", negative = false): string {
  if (negative) return relation === "calls" ? "faz essa chamada" : relation === "renders" ? "renderiza esse componente" : "usa essa store";
  return relation === "calls" ? "chama" : relation === "renders" ? "renderiza" : "usa";
}

function nameFrom(from: string, target: string): string {
  const [app] = from.split(".");
  return target.startsWith(`${app}.`) && target.split(".").length === 2 ? target.split(".")[1]! : target;
}

// ---------------------------------------------------------------------
//  PL230
// ---------------------------------------------------------------------

/** Elementos do app (declarados nele ou em `contains`) com âncora fora do `root`. */
export function validateAppRoots(ctx: ValidationContext): void {
  for (const app of apps(ctx)) {
    const scope = new Set<string>();
    const add = (id: string) => {
      scope.add(id);
      for (const [child, el] of Object.entries(ctx.elements)) if (el.parent === id && !scope.has(child)) add(child);
    };
    for (const [id, el] of Object.entries(ctx.elements)) if (el.parent === app.id) add(id);
    for (const r of ctx.elements[app.id]!.relations) if (r.type === "contains") add(r.target);
    for (const id of scope) {
      const anchor = ctx.elements[id]?.anchor;
      if (anchor?.scheme !== "code" || !anchor.path || anchor.inherited || under(anchor.path, app.root)) continue;
      ctx.report("PL230", "warning", `\`${id}\` está em \`${app.id}\`, mas a âncora (${anchor.path}) fica fora do root ${app.root}`, ctx.elements[id]!.source);
    }
  }
}
