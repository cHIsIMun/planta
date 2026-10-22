// Extrator React (seção 10.3): rotas do react-router (JSX ou objetos), páginas,
// componentes, quem renderiza quem, stores (Zustand, Redux), chamadas entre
// funções do projeto e chamadas HTTP (`fetch` e axios, inclusive instâncias de
// `axios.create({ baseURL })`).
//
// As chamadas entre funções (`call`) são o que permite atribuir a um
// componente o HTTP feito por um hook ou módulo de API que ele usa.

import type { Node } from "web-tree-sitter";
import { type CodeSymbol, lineOf, listSymbols, type SourceFile, stringValue } from "../code/typescript.ts";
import type { Extractor, Fact } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const JSX = ["jsx_element", "jsx_self_closing_element", "jsx_fragment"];
const HTTP_VERBS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);
/** Componentes do roteador: não são da aplicação. */
const ROUTER = new Set(["Routes", "Route", "BrowserRouter", "HashRouter", "MemoryRouter", "Router", "RouterProvider", "Outlet", "Navigate", "Link", "NavLink"]);

interface Unit {
  file: SourceFile;
  name: string;
  /** Nó com o corpo (função, arrow function ou a chamada que cria a store). */
  node: Node;
  line: number;
  kind: "component" | "function" | "store";
}

export const react: Extractor = {
  name: "react",
  extract(files) {
    const tsx = files.filter((f) => f.language === "typescript");
    const units = new Map<string, Unit>();
    for (const file of tsx) for (const u of unitsOf(file)) if (!units.has(u.name)) units.set(u.name, u);
    const clients = axiosInstances(tsx);

    const facts: Fact[] = [];
    const add = (f: Fact) => facts.push(f);
    for (const u of units.values()) {
      const location = { file: u.file.path, symbol: u.name, line: u.line };
      if (u.kind === "component") add({ id: `ui.component:${u.file.path}#${u.name}`, kind: "ui.component", extractor: "react", location, data: { name: u.name } });
      if (u.kind === "store") add({ id: `ui.store:${u.file.path}#${u.name}`, kind: "ui.store", extractor: "react", location, data: { name: u.name } });
      if (u.kind === "store") continue;

      const rendered = new Set<string>();
      for (const tag of jsxTags(u.node)) {
        if (tag !== u.name && units.get(tag)?.kind === "component" && !rendered.has(tag)) {
          rendered.add(tag);
          add({ id: `ui.render:${u.name}->${tag}`, kind: "ui.render", extractor: "react", location, data: { parent: u.name, child: tag } });
        }
      }
      const called = new Set<string>();
      for (const call of descendants(u.node, "call_expression")) {
        const fn = call.childForFieldName("function");
        if (fn?.type === "identifier" && units.has(fn.text) && fn.text !== u.name && units.get(fn.text)!.kind !== "component" && !called.has(fn.text)) {
          called.add(fn.text);
          add({ id: `call:${u.name}->${fn.text}`, kind: "call", extractor: "react", location, data: { caller: u.name, callee: fn.text } });
        }
        const http = httpCall(call, clients);
        if (http) {
          add({
            id: `http.client:${http.method}:${http.path}:${u.name}`,
            kind: "http.client",
            extractor: "react",
            location: { ...location, line: lineOf(call) },
            data: { method: http.method, path: http.path, in: u.name },
          });
        }
      }
    }

    const routes = tsx.flatMap((f) => routesIn(f));
    for (const r of routes) {
      add({ id: `ui.route:${r.path}`, kind: "ui.route", extractor: "react", location: { file: r.file, line: r.line }, data: { path: r.path, component: r.component, guards: r.guards } });
    }
    for (const page of new Set(routes.map((r) => r.component))) {
      const u = units.get(page);
      if (u) add({ id: `ui.page:${page}`, kind: "ui.page", extractor: "react", location: { file: u.file.path, symbol: page, line: u.line }, data: { name: page } });
    }
    return [...new Map(facts.map((f) => [f.id, f])).values()];
  },
};

// ---------------------------------------------------------------------
//  Unidades: componentes, funções e stores de nível superior
// ---------------------------------------------------------------------

function unitsOf(file: SourceFile): Unit[] {
  const zustand = /from\s+["']zustand["']/.test(file.text);
  return listSymbols(file).flatMap((s): Unit[] => {
    if (s.name.includes(".") || s.name === "default") return [];
    const body = bodyOf(s);
    if (!body) return [];
    const unit = { file, name: s.name, node: body, line: lineOf(s.node) };
    if (s.kind === "variable" && isStore(body, zustand)) return [{ ...unit, kind: "store" }];
    if (/^[A-Z]/.test(s.name) && JSX.some((t) => descendants(body, t).length > 0 || body.type === t)) return [{ ...unit, kind: "component" }];
    return [{ ...unit, kind: "function" }];
  });
}

/** Função declarada, ou valor de `const X = ...` que seja função ou chamada. */
function bodyOf(s: CodeSymbol): Node | undefined {
  if (s.kind === "function") return s.node;
  if (s.kind !== "variable") return undefined;
  const value = s.node.childForFieldName("value");
  if (!value) return undefined;
  if (["arrow_function", "function_expression", "call_expression"].includes(value.type)) return value;
  return undefined;
}

/** `create(...)`/`create<T>()(...)` do Zustand, `createSlice`/`configureStore` do Redux. */
function isStore(value: Node, zustand: boolean): boolean {
  if (value.type !== "call_expression") return false;
  let fn: Node | null = value.childForFieldName("function");
  while (fn?.type === "call_expression") fn = fn.childForFieldName("function");
  const name = fn?.type === "identifier" ? fn.text : undefined;
  return (zustand && name === "create") || name === "createSlice" || name === "configureStore";
}

function jsxTags(node: Node): string[] {
  return [...descendants(node, "jsx_opening_element"), ...descendants(node, "jsx_self_closing_element")]
    .map((el) => el.childForFieldName("name")?.text ?? "")
    .filter((tag) => /^[A-Z]/.test(tag) && !ROUTER.has(tag));
}

function descendants(node: Node, type: string): Node[] {
  return node.descendantsOfType(type).filter((n): n is Node => !!n);
}

// ---------------------------------------------------------------------
//  HTTP
// ---------------------------------------------------------------------

/** `const api = axios.create({ baseURL: "/api/v1" })`, em qualquer arquivo: nome → base. */
function axiosInstances(files: SourceFile[]): Map<string, string> {
  const instances = new Map<string, string>([["axios", ""]]);
  for (const file of files) {
    for (const decl of descendants(file.tree.rootNode, "variable_declarator")) {
      const value = decl.childForFieldName("value");
      if (value?.type !== "call_expression" || value.childForFieldName("function")?.text !== "axios.create") continue;
      const config = value.childForFieldName("arguments")?.namedChildren[0];
      const base = config?.type === "object"
        ? config.namedChildren.find((p) => p?.type === "pair" && p.childForFieldName("key")?.text === "baseURL")?.childForFieldName("value")
        : undefined;
      const name = decl.childForFieldName("name")?.text;
      if (name) instances.set(name, (base && stringValue(base)) ?? "");
    }
  }
  return instances;
}

function httpCall(call: Node, clients: Map<string, string>): { method: string; path: string } | undefined {
  const fn = call.childForFieldName("function");
  const args = call.childForFieldName("arguments")?.namedChildren.filter((a): a is Node => !!a) ?? [];
  if (fn?.type === "identifier" && fn.text === "fetch") {
    const path = urlPath(args[0]);
    if (!path) return undefined;
    const options = args[1]?.type === "object" ? args[1] : undefined;
    const method = options?.namedChildren.find((p) => p?.type === "pair" && p.childForFieldName("key")?.text === "method")?.childForFieldName("value");
    return { method: ((method && stringValue(method)) ?? "GET").toUpperCase(), path };
  }
  if (fn?.type === "member_expression") {
    const verb = fn.childForFieldName("property")?.text ?? "";
    const base = clients.get(fn.childForFieldName("object")?.text ?? "");
    if (base === undefined || !HTTP_VERBS.has(verb)) return undefined;
    const path = urlPath(args[0]);
    return path ? { method: verb.toUpperCase(), path: normalizeRoute(`${base}/${path}`) } : undefined;
  }
  return undefined;
}

/** Caminho de uma URL relativa: `"/x"`, `` `/x/${id}` `` → `/x/:id`. URLs externas não contam. */
function urlPath(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  let text: string | undefined;
  if (node.type === "string") text = stringValue(node);
  else if (node.type === "template_string") {
    text = node.children.map((c) => {
      if (!c || c.type === "`") return "";
      if (c.type === "template_substitution") {
        const expr = c.namedChildren[0];
        return `:${expr?.type === "identifier" ? expr.text : expr?.type === "member_expression" ? expr.childForFieldName("property")?.text ?? "param" : "param"}`;
      }
      return c.text;
    }).join("");
  }
  if (!text || /^[a-z]+:\/\//i.test(text)) return undefined;
  return normalizeRoute(text.replace(/[?#].*$/, ""));
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

function routesIn(file: SourceFile): Route[] {
  const routes: Route[] = [];
  // JSX: <Route> de nível mais alto (não aninhado em outro <Route>).
  for (const el of [...descendants(file.tree.rootNode, "jsx_element"), ...descendants(file.tree.rootNode, "jsx_self_closing_element")]) {
    if (tagOf(el) !== "Route" || hasRouteAncestor(el)) continue;
    routes.push(...jsxRoute(el, "", [], file));
  }
  // Objetos: createBrowserRouter([...]), useRoutes([...]), createHashRouter([...]).
  for (const call of descendants(file.tree.rootNode, "call_expression")) {
    const name = call.childForFieldName("function")?.text ?? "";
    if (!/^(create(Browser|Hash|Memory)Router|useRoutes)$/.test(name)) continue;
    const list = call.childForFieldName("arguments")?.namedChildren[0];
    if (list?.type === "array") routes.push(...objectRoutes(list, "", [], file));
  }
  return routes;
}

function tagOf(el: Node): string | undefined {
  const opening = el.type === "jsx_element" ? el.childForFieldName("open_tag") : el;
  return opening?.childForFieldName("name")?.text;
}

function hasRouteAncestor(el: Node): boolean {
  for (let p = el.parent; p; p = p.parent) if ((p.type === "jsx_element") && tagOf(p) === "Route") return true;
  return false;
}

function attribute(el: Node, name: string): Node | undefined | null {
  const opening = el.type === "jsx_element" ? el.childForFieldName("open_tag") : el;
  for (const a of opening?.namedChildren ?? []) {
    if (a?.type !== "jsx_attribute") continue;
    const [key, value] = a.namedChildren;
    if (key?.text !== name) continue;
    if (!value) return null; // atributo booleano: `<Route index />`
    return value.type === "jsx_expression" ? value.namedChildren[0] ?? undefined : value;
  }
  return undefined;
}

function jsxRoute(el: Node, parent: string, guards: string[], file: SourceFile): Route[] {
  const pathNode = attribute(el, "path");
  const path = join(parent, pathNode ? stringValue(pathNode) ?? "" : "");
  const element = attribute(el, "element");
  const target = element ? elementTarget(element) : undefined;
  const children = el.type === "jsx_element" ? el.namedChildren.filter((c): c is Node => !!c && (c.type === "jsx_element" || c.type === "jsx_self_closing_element") && tagOf(c) === "Route") : [];

  const routes: Route[] = [];
  if (children.length > 0) {
    // Rota de layout: o elemento envolve as filhas (guard com <Outlet />).
    const inherited = target && !pathNode ? [...guards, ...target.guards, target.component] : guards;
    for (const c of children) routes.push(...jsxRoute(c, path, inherited, file));
    if (target && pathNode) routes.push({ path: normalizeRoute(path), component: target.component, guards: [...guards, ...target.guards], file: file.path, line: lineOf(el) });
    return routes;
  }
  if (target) routes.push({ path: normalizeRoute(path), component: target.component, guards: [...guards, ...target.guards], file: file.path, line: lineOf(el) });
  return routes;
}

function objectRoutes(list: Node, parent: string, guards: string[], file: SourceFile): Route[] {
  const routes: Route[] = [];
  for (const obj of list.namedChildren) {
    if (obj?.type !== "object") continue;
    const props = new Map(obj.namedChildren.flatMap((p) => (p?.type === "pair" ? [[p.childForFieldName("key")?.text ?? "", p.childForFieldName("value")!] as const] : [])));
    const pathNode = props.get("path");
    const path = join(parent, pathNode ? stringValue(pathNode) ?? "" : "");
    const element = props.get("element");
    const target = element ? elementTarget(element) : undefined;
    const children = props.get("children");
    if (children?.type === "array") {
      const inherited = target && !pathNode ? [...guards, ...target.guards, target.component] : guards;
      routes.push(...objectRoutes(children, path, inherited, file));
      if (target && pathNode) routes.push({ path: normalizeRoute(path), component: target.component, guards: [...guards, ...target.guards], file: file.path, line: lineOf(obj) });
    } else if (target) {
      routes.push({ path: normalizeRoute(path), component: target.component, guards: [...guards, ...target.guards], file: file.path, line: lineOf(obj) });
    }
  }
  return routes;
}

/** `<RequireAuth><Checkout /></RequireAuth>` → componente `Checkout`, guard `RequireAuth`. */
function elementTarget(node: Node): { component: string; guards: string[] } | undefined {
  if (node.type === "parenthesized_expression") return node.namedChildren[0] ? elementTarget(node.namedChildren[0]) : undefined;
  const tag = node.type === "jsx_element" || node.type === "jsx_self_closing_element" ? tagOf(node) : undefined;
  if (!tag) return undefined;
  const inner = node.type === "jsx_element"
    ? node.namedChildren.filter((c): c is Node => !!c && (c.type === "jsx_element" || c.type === "jsx_self_closing_element"))
    : [];
  if (inner.length === 1) {
    const target = elementTarget(inner[0]!);
    if (target) return { component: target.component, guards: [tag, ...target.guards] };
  }
  return { component: tag, guards: [] };
}

function join(parent: string, path: string): string {
  if (path.startsWith("/")) return path;
  return [parent.replace(/\/+$/, ""), path].filter(Boolean).join("/") || "/";
}
