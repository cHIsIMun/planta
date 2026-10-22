// Extrator Angular (seção 10.3): rotas (`Routes`, `RouterModule.forRoot` e
// `forChild`, `provideRouter`, com `loadComponent`, `loadChildren`, `children`
// e guards em `canActivate`/`canMatch`/`canActivateChild`), páginas,
// componentes, quem renderiza quem (pelo seletor no template, inline ou em
// `templateUrl`), stores (`signalStore`, `createFeature`, `createReducer`),
// chamadas entre componentes e serviços e chamadas HTTP do `HttpClient`.
//
// Serviços contam pelo método: `CestaComponent` chama `FeiraApi.fecharCesta`,
// que faz `POST /api/cestas/:id/fechar`. Os injetados vêm de `inject(T)` ou de
// parâmetros do construtor tipados.

import { dirname, posix } from "node:path";
import type { Node } from "web-tree-sitter";
import { decoratorCall, lineOf, listSymbols, type SourceFile, stringValue } from "../code/typescript.ts";
import type { Extractor, Fact, TextFile } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const HTTP_VERBS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "jsonp"]);
const GUARD_KEYS = ["canActivate", "canMatch", "canActivateChild", "canLoad"];
const STORE_FACTORIES = new Set(["signalStore", "createFeature", "createReducer"]);

interface Unit {
  file: SourceFile;
  name: string;
  node: Node;
  line: number;
  kind: "component" | "service" | "method" | "function" | "store";
  /** Classe dona, para métodos. */
  owner?: string;
}

interface ClassInfo {
  file: SourceFile;
  name: string;
  node: Node;
  kind: "component" | "service";
  /** Propriedade → classe injetada (`api` → `FeiraApi`, `http` → `HttpClient`). */
  injected: Map<string, string>;
  /** Campos com string literal (`base = '/api'`). */
  strings: Map<string, string>;
  selector?: string;
  template?: string;
}

export const angular: Extractor = {
  name: "angular",
  textFiles: /\.component\.html$/,
  extract(files, _config, texts = []) {
    const ts = files.filter((f) => f.language === "typescript");
    const templates = new Map(texts.map((t: TextFile) => [t.path, t.text]));
    const classes = new Map<string, ClassInfo>();
    const units = new Map<string, Unit>();
    for (const file of ts) {
      for (const info of classesOf(file, templates)) if (!classes.has(info.name)) classes.set(info.name, info);
      for (const u of unitsOf(file)) if (!units.has(u.name)) units.set(u.name, u);
    }
    for (const c of classes.values()) {
      const u = units.get(c.name);
      if (u) u.kind = c.kind;
    }
    const bySelector = new Map([...classes.values()].flatMap((c) => (c.selector ? c.selector.split(",").map((s) => [s.trim(), c.name] as const) : [])));

    const facts: Fact[] = [];
    const add = (f: Fact) => facts.push(f);
    for (const u of units.values()) {
      const location = { file: u.file.path, symbol: u.name, line: u.line };
      if (u.kind === "component") add({ id: `ui.component:${u.file.path}#${u.name}`, kind: "ui.component", extractor: "angular", location, data: { name: u.name } });
      if (u.kind === "store") {
        add({ id: `ui.store:${u.file.path}#${u.name}`, kind: "ui.store", extractor: "angular", location, data: { name: u.name } });
        continue;
      }
      const cls = classes.get(u.owner ?? u.name);
      // Componente: o template renderiza outros componentes pelo seletor.
      if (u.kind === "component" && cls?.template) {
        for (const tag of new Set([...cls.template.matchAll(/<([a-z][\w-]*)/g)].map((m) => m[1]!))) {
          const child = bySelector.get(tag);
          if (child && child !== u.name) add({ id: `ui.render:${u.name}->${child}`, kind: "ui.render", extractor: "angular", location, data: { parent: u.name, child } });
        }
      }
      // A classe inteira (com inicializadores de campos) conta para o componente; para serviços, cada método.
      if (u.kind === "service") continue;
      const scope = u.kind === "component" ? cls?.node ?? u.node : u.node;
      for (const call of scope.descendantsOfType("call_expression").filter((n): n is Node => !!n)) {
        const callee = calleeOf(call, cls, classes, units);
        if (callee && callee !== u.name) add({ id: `call:${u.name}->${callee}`, kind: "call", extractor: "angular", location, data: { caller: u.name, callee } });
        const http = cls && httpCall(call, cls);
        if (http) {
          add({
            id: `http.client:${http.method}:${http.path}:${u.name}`,
            kind: "http.client",
            extractor: "angular",
            location: { ...location, line: lineOf(call) },
            data: { method: http.method, path: http.path, in: u.name },
          });
        }
      }
    }

    const routes = routesIn(ts);
    for (const r of routes) {
      add({ id: `ui.route:${r.path}`, kind: "ui.route", extractor: "angular", location: { file: r.file, line: r.line }, data: { path: r.path, component: r.component, guards: r.guards } });
    }
    for (const page of new Set(routes.map((r) => r.component))) {
      const u = units.get(page);
      if (u) add({ id: `ui.page:${page}`, kind: "ui.page", extractor: "angular", location: { file: u.file.path, symbol: page, line: u.line }, data: { name: page } });
    }
    return [...new Map(facts.map((f) => [f.id, f])).values()];
  },
};

// ---------------------------------------------------------------------
//  Classes, unidades e injeção
// ---------------------------------------------------------------------

function classesOf(file: SourceFile, templates: Map<string, string>): ClassInfo[] {
  return listSymbols(file).flatMap((s): ClassInfo[] => {
    if (s.kind !== "class") return [];
    const decorators = s.decorators.flatMap((d) => decoratorCall(d) ?? []);
    const component = decorators.find((d) => d.name === "Component");
    const service = decorators.find((d) => d.name === "Injectable" || d.name === "Directive" || d.name === "Pipe");
    if (!component && !service) return [];
    const options = component ? props(component.args[0]) : new Map<string, Node>();
    const url = stringValue(options.get("templateUrl"));
    const template = options.get("template")?.text.slice(1, -1)
      ?? (url ? templates.get(posix.normalize(posix.join(dirname(file.path), url))) : undefined);
    return [{
      file,
      name: s.name,
      node: s.node,
      kind: component ? "component" : "service",
      injected: injections(s.node),
      strings: stringFields(s.node),
      selector: stringValue(options.get("selector")),
      template,
    }];
  });
}

function unitsOf(file: SourceFile): Unit[] {
  return listSymbols(file).flatMap((s): Unit[] => {
    if (s.name === "default") return [];
    const unit = { file, name: s.name, node: s.node, line: lineOf(s.node) };
    if (s.kind === "class") return [{ ...unit, kind: "function" }];
    if (s.kind === "method") return [{ ...unit, kind: "method", owner: s.name.split(".")[0] }];
    if (s.name.includes(".")) return [];
    if (s.kind === "function") return [{ ...unit, kind: "function" }];
    if (s.kind !== "variable") return [];
    const value = s.node.childForFieldName("value");
    if (value?.type === "call_expression" && STORE_FACTORIES.has(value.childForFieldName("function")?.text ?? "")) return [{ ...unit, node: value, kind: "store" }];
    if (value && ["arrow_function", "function_expression"].includes(value.type)) return [{ ...unit, node: value, kind: "function" }];
    return [];
  });
}

/** `private api = inject(FeiraApi)` e `constructor(private readonly http: HttpClient)`. */
function injections(cls: Node): Map<string, string> {
  const out = new Map<string, string>();
  const body = cls.childForFieldName("body");
  for (const member of body?.namedChildren ?? []) {
    if (member?.type === "public_field_definition") {
      const name = member.childForFieldName("name")?.text;
      const value = member.childForFieldName("value");
      if (name && value?.type === "call_expression" && value.childForFieldName("function")?.text === "inject") {
        const type = value.childForFieldName("arguments")?.namedChildren[0]?.text;
        if (type) out.set(name, type);
      }
    }
    if (member?.type === "method_definition" && member.childForFieldName("name")?.text === "constructor") {
      for (const p of member.childForFieldName("parameters")?.namedChildren ?? []) {
        const name = p?.childForFieldName("pattern")?.text;
        const type = p?.childForFieldName("type")?.namedChildren[0]?.text;
        if (name && type) out.set(name, type.replace(/<.*$/, ""));
      }
    }
  }
  return out;
}

function stringFields(cls: Node): Map<string, string> {
  const out = new Map<string, string>();
  for (const member of cls.childForFieldName("body")?.namedChildren ?? []) {
    if (member?.type !== "public_field_definition") continue;
    const name = member.childForFieldName("name")?.text;
    const value = stringValue(member.childForFieldName("value") ?? undefined);
    if (name && value !== undefined) out.set(name, value);
  }
  return out;
}

/** `this.api.fecharCesta()` → `FeiraApi.fecharCesta`; `this.recarregar()` → `Classe.recarregar`; `f()` → `f`. */
function calleeOf(call: Node, cls: ClassInfo | undefined, classes: Map<string, ClassInfo>, units: Map<string, Unit>): string | undefined {
  const fn = call.childForFieldName("function");
  if (fn?.type === "identifier") return units.get(fn.text)?.kind === "function" || units.get(fn.text)?.kind === "store" ? fn.text : undefined;
  if (fn?.type !== "member_expression" || !cls) return undefined;
  const method = fn.childForFieldName("property")?.text ?? "";
  const object = fn.childForFieldName("object");
  if (object?.type === "this") return units.has(`${cls.name}.${method}`) ? `${cls.name}.${method}` : undefined;
  const prop = object?.type === "member_expression" && object.childForFieldName("object")?.type === "this" ? object.childForFieldName("property")?.text : undefined;
  const target = prop ? cls.injected.get(prop) : undefined;
  if (!target || !classes.has(target)) return undefined;
  return units.has(`${target}.${method}`) ? `${target}.${method}` : target;
}

function props(node: Node | undefined): Map<string, Node> {
  if (node?.type !== "object") return new Map();
  return new Map(node.namedChildren.flatMap((p) => (p?.type === "pair" ? [[p.childForFieldName("key")?.text ?? "", p.childForFieldName("value")!] as const] : [])));
}

// ---------------------------------------------------------------------
//  HTTP
// ---------------------------------------------------------------------

/** `this.http.get(...)`, com `http` injetado como `HttpClient`. */
function httpCall(call: Node, cls: ClassInfo): { method: string; path: string } | undefined {
  const fn = call.childForFieldName("function");
  if (fn?.type !== "member_expression") return undefined;
  const verb = fn.childForFieldName("property")?.text ?? "";
  const object = fn.childForFieldName("object");
  const prop = object?.type === "member_expression" && object.childForFieldName("object")?.type === "this" ? object.childForFieldName("property")?.text : undefined;
  if (!prop || cls.injected.get(prop) !== "HttpClient") return undefined;
  const args = call.childForFieldName("arguments")?.namedChildren.filter((a): a is Node => !!a) ?? [];
  if (verb === "request") {
    const method = stringValue(args[0]);
    const path = method && urlPath(args[1], cls);
    return path ? { method: method.toUpperCase(), path } : undefined;
  }
  if (!HTTP_VERBS.has(verb)) return undefined;
  const path = urlPath(args[0], cls);
  return path ? { method: verb === "jsonp" ? "GET" : verb.toUpperCase(), path } : undefined;
}

/**
 * Caminho da URL: `'/api/x'`, `` `${this.base}/x/${id}` `` → `/api/x/:id`, `this.base + '/x'`.
 * Uma base no início que não se resolve (`environment.apiUrl`) vale como vazia; URLs externas não contam.
 */
function urlPath(node: Node | undefined, cls: ClassInfo): string | undefined {
  const text = urlText(node, cls, true);
  if (text === undefined || /^[a-z]+:\/\//i.test(text)) return undefined;
  return normalizeRoute(text.replace(/[?#].*$/, ""));
}

function urlText(node: Node | undefined, cls: ClassInfo, leading: boolean): string | undefined {
  if (!node) return undefined;
  if (node.type === "string") return stringValue(node);
  const field = (n: Node | null | undefined) =>
    n?.type === "member_expression" && n.childForFieldName("object")?.type === "this" ? cls.strings.get(n.childForFieldName("property")?.text ?? "") : undefined;
  if (node.type === "member_expression") return field(node) ?? (leading ? "" : undefined);
  if (node.type === "template_string") {
    let first = true;
    const parts = node.children.map((c) => {
      if (!c || c.type === "`") return "";
      const isFirst = first;
      first = false;
      if (c.type !== "template_substitution") return c.text;
      const expr = c.namedChildren[0];
      const resolved = field(expr);
      if (resolved !== undefined) return resolved;
      if (isFirst && leading) return "";
      return `:${expr?.type === "identifier" ? expr.text : expr?.type === "member_expression" ? expr.childForFieldName("property")?.text ?? "param" : "param"}`;
    });
    return parts.join("");
  }
  if (node.type === "binary_expression" && node.childForFieldName("operator")?.text === "+") {
    const left = urlText(node.childForFieldName("left") ?? undefined, cls, leading);
    const right = urlText(node.childForFieldName("right") ?? undefined, cls, false);
    return left !== undefined && right !== undefined ? left + right : undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------
//  Rotas
// ---------------------------------------------------------------------

interface Route {
  path: string;
  component: string;
  guards: string[];
  file: string;
  line: number;
}

/** Listas de rotas: `const x: Routes = [...]`, `forRoot([...])`, `provideRouter([...])`; as nomeadas podem ser filhas por `loadChildren`. */
function routesIn(files: SourceFile[]): Route[] {
  const named = new Map<string, { list: Node; file: SourceFile }>();
  const roots: { list: Node; file: SourceFile }[] = [];
  for (const file of files) {
    for (const decl of file.tree.rootNode.descendantsOfType("variable_declarator").filter((n): n is Node => !!n)) {
      const value = decl.childForFieldName("value");
      const type = decl.childForFieldName("type")?.text.replace(/^:\s*/, "") ?? "";
      if (value?.type === "array" && /^(Routes|Route\[\])$/.test(type)) named.set(decl.childForFieldName("name")!.text, { list: value, file });
    }
    for (const call of file.tree.rootNode.descendantsOfType("call_expression").filter((n): n is Node => !!n)) {
      const name = call.childForFieldName("function")?.text ?? "";
      if (!/^(RouterModule\.(forRoot|forChild)|provideRouter)$/.test(name)) continue;
      const arg = call.childForFieldName("arguments")?.namedChildren[0];
      if (arg?.type === "array") roots.push({ list: arg, file });
    }
  }
  // `loadChildren` de qualquer lista marca a nomeada como filha (não raiz).
  const children = new Set<string>();
  for (const { list } of [...named.values(), ...roots]) {
    for (const pair of list.descendantsOfType("pair").filter((n): n is Node => !!n)) {
      if (pair.childForFieldName("key")?.text === "loadChildren") {
        const target = lazyTarget(pair.childForFieldName("value") ?? undefined);
        if (target) children.add(target);
      }
    }
  }
  const top = [...roots, ...[...named].filter(([n]) => !children.has(n)).map(([, v]) => v)];
  return top.flatMap(({ list, file }) => routeList(list, "", [], file, named, new Set()));
}

function routeList(list: Node, parent: string, guards: string[], file: SourceFile, named: Map<string, { list: Node; file: SourceFile }>, seen: Set<string>): Route[] {
  const routes: Route[] = [];
  for (const obj of list.namedChildren) {
    if (obj?.type !== "object") continue;
    const p = props(obj);
    if (p.has("redirectTo")) continue;
    const path = join(parent, stringValue(p.get("path")) ?? "");
    const own = GUARD_KEYS.flatMap((k) => (p.get(k)?.type === "array" ? p.get(k)!.namedChildren.flatMap((g) => (g ? [g.text.replace(/\(.*$/, "")] : [])) : []));
    const all = [...guards, ...own];
    const component = p.get("component")?.text ?? lazyTarget(p.get("loadComponent"));
    if (component) routes.push({ path: normalizeRoute(path.replace(/\*\*$/, "*")), component, guards: all, file: file.path, line: lineOf(obj) });
    const nested = p.get("children");
    if (nested?.type === "array") routes.push(...routeList(nested, path, all, file, named, seen));
    const lazy = lazyTarget(p.get("loadChildren"));
    const target = lazy && named.get(lazy);
    if (target && !seen.has(lazy)) routes.push(...routeList(target.list, path, all, target.file, named, new Set([...seen, lazy])));
  }
  return routes;
}

/** `() => import('./x').then((m) => m.Pagina)` → `Pagina`. */
function lazyTarget(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  const member = node.descendantsOfType("member_expression").filter((n): n is Node => !!n).at(-1);
  const name = member?.childForFieldName("property")?.text;
  return name && name !== "then" ? name : undefined;
}

function join(parent: string, path: string): string {
  return [parent.replace(/\/+$/, ""), path].filter(Boolean).join("/") || "/";
}
