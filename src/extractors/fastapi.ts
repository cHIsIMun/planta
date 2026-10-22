// Extrator FastAPI (seção 10.3): rotas (`@app.get`, `@router.post`...) com os
// prefixos de `APIRouter(prefix=...)` e `include_router(..., prefix=...)`,
// corpo e resposta por modelo Pydantic, injeção por `Depends` e os modelos
// Pydantic como `dto`, com campos.

import { posix } from "node:path";
import type { Node } from "web-tree-sitter";
import { unwrap } from "../code/python.ts";
import { hash, lineOf, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, FieldFact, HttpEndpointData } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";
import { pyString } from "./django.ts";

const VERBS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);
const PY_TYPES: Record<string, string> = {
  str: "string", int: "int", float: "float", bool: "bool", bytes: "bytes", datetime: "datetime", date: "date",
  time: "time", timedelta: "duration", UUID: "uuid", EmailStr: "email", HttpUrl: "url", AnyUrl: "url", Decimal: "decimal", dict: "json",
};

interface Router {
  file: SourceFile;
  name: string;
  prefix: string;
}

export const fastapi: Extractor = {
  name: "fastapi",
  extract(files) {
    const py = files.filter((f) => f.language === "python");
    const models = pydanticModels(py);
    const routers = new Map<string, Router>();
    for (const file of py) {
      for (const a of file.tree.rootNode.descendantsOfType("assignment")) {
        const right = a?.childForFieldName("right");
        const name = a?.childForFieldName("left")?.text;
        if (!a || !name || right?.type !== "call") continue;
        const fn = callee(right);
        if (fn === "APIRouter" || fn === "FastAPI") routers.set(`${file.path}:${name}`, { file, name, prefix: kwarg(right, "prefix") ?? "" });
      }
    }
    // Prefixo de `include_router`, encadeado: app → router → sub-router.
    const parent = new Map<string, { key: string; prefix: string }>();
    for (const file of py) {
      for (const call of file.tree.rootNode.descendantsOfType("call")) {
        const fn = call?.childForFieldName("function");
        if (!call || fn?.type !== "attribute" || fn.childForFieldName("attribute")?.text !== "include_router") continue;
        const target = resolveRouter(call.childForFieldName("arguments")?.namedChildren[0]?.text ?? "", file, routers);
        const owner = resolveRouter(fn.childForFieldName("object")?.text ?? "", file, routers);
        if (target && owner) parent.set(target, { key: owner, prefix: kwarg(call, "prefix") ?? "" });
      }
    }
    const fullPrefix = (key: string, seen = new Set<string>()): string => {
      if (seen.has(key)) return "";
      const p = parent.get(key);
      const own = routers.get(key)?.prefix ?? "";
      return p ? `${fullPrefix(p.key, new Set([...seen, key]))}/${p.prefix}/${own}` : own;
    };

    const facts: Fact[] = [...models.facts];
    for (const file of py) {
      for (const statement of file.tree.rootNode.namedChildren) {
        if (!statement) continue;
        const { decorators, definition } = unwrap(statement);
        if (definition.type !== "function_definition") continue;
        const handler = definition.childForFieldName("name")!.text;
        for (const d of decorators) {
          const call = d.namedChildren[0];
          const fn = call?.type === "call" ? call.childForFieldName("function") : undefined;
          const verb = fn?.type === "attribute" ? fn.childForFieldName("attribute")?.text ?? "" : "";
          const router = fn && resolveRouter(fn.childForFieldName("object")?.text ?? "", file, routers);
          if (!call || !router || !VERBS.has(verb)) continue;
          const route = pyString(call.childForFieldName("arguments")?.namedChildren[0] ?? undefined) ?? "";
          const path = normalizeRoute(`${fullPrefix(router)}/${route}`);
          const method = verb.toUpperCase();
          const params = parameters(definition, models.names, route);
          const status = kwargNode(call, "status_code")?.text;
          const data: HttpEndpointData = {
            method, path, handler, ...(params.body && { body: params.body }), params: params.list,
            responses: [{ status: status && /^\d+$/.test(status) ? Number(status) : 200 }], guards: [],
          };
          const signatureText = [`${method} ${path}`, ...(data.body ? [`body ${data.body}`] : []), ...data.params.map((p) => `param ${p.name}: ${p.type ?? "?"} in ${p.in}`)].join("\n");
          const location = { file: file.path, symbol: handler, line: lineOf(definition) };
          facts.push({ id: `http.endpoint:${method}:${path}`, kind: "http.endpoint", extractor: "fastapi", location, data: { ...data }, fingerprint: { signature: hash(signatureText), signatureText } });
          for (const provider of params.depends) {
            facts.push({ id: `di:${handler}->${provider}`, kind: "di", extractor: "fastapi", location, data: { consumer: handler, provider } });
          }
        }
      }
    }
    return facts;
  },
};

/** `router`, `clientes.router` (módulo importado) ou `app`, no arquivo ou no módulo citado. */
function resolveRouter(text: string, file: SourceFile, routers: Map<string, Router>): string | undefined {
  const parts = text.split(".");
  const name = parts.at(-1)!;
  if (parts.length === 1 && routers.has(`${file.path}:${name}`)) return `${file.path}:${name}`;
  const module = parts.at(-2);
  const candidates = [...routers.entries()].filter(([, r]) => r.name === name && (!module || posix.basename(r.file.path, ".py") === module));
  return candidates.length === 1 ? candidates[0]![0] : undefined;
}

function parameters(fn: Node, models: Set<string>, route: string): { body?: string; list: HttpEndpointData["params"]; depends: string[] } {
  const inPath = new Set([...route.matchAll(/\{(\w+)(?::[^}]*)?\}/g)].map((m) => m[1]!));
  let body: string | undefined;
  const list: HttpEndpointData["params"] = [];
  const depends: string[] = [];
  for (const p of fn.childForFieldName("parameters")?.namedChildren ?? []) {
    if (!p || (p.type !== "typed_parameter" && p.type !== "typed_default_parameter" && p.type !== "default_parameter")) continue;
    const name = (p.childForFieldName("name") ?? p.namedChildren[0])?.text ?? "";
    const typeNode = p.childForFieldName("type");
    const value = p.childForFieldName("value");
    if (value?.type === "call" && callee(value) === "Depends") {
      const provider = value.childForFieldName("arguments")?.namedChildren[0]?.text ?? typeNode?.text;
      if (provider) depends.push(provider.split(".").at(-1)!);
      continue;
    }
    const type = typeNode ? fieldType(typeNode) : undefined;
    if (type && models.has(type.base)) {
      body = type.base;
      continue;
    }
    list.push({ name, in: inPath.has(name) ? "path" : "query", ...(type && { type: PY_TYPES[type.base] ?? type.base }) });
  }
  return { ...(body && { body }), list, depends };
}

// ---------------------------------------------------------------------
//  Modelos Pydantic
// ---------------------------------------------------------------------

function pydanticModels(files: SourceFile[]): { names: Set<string>; facts: Fact[] } {
  const classes = new Map<string, { file: SourceFile; node: Node; bases: string[] }>();
  for (const file of files) {
    for (const s of file.tree.rootNode.namedChildren) {
      const def = s && unwrap(s).definition;
      if (def?.type !== "class_definition") continue;
      const bases = (def.childForFieldName("superclasses")?.namedChildren ?? []).filter((b): b is Node => !!b && b.type !== "keyword_argument").map((b) => b.text.split(".").at(-1)!);
      classes.set(def.childForFieldName("name")!.text, { file, node: def, bases });
    }
  }
  const isModel = (name: string, seen = new Set<string>()): boolean => {
    if (name === "BaseModel") return true;
    const c = classes.get(name);
    if (!c || seen.has(name)) return false;
    seen.add(name);
    return c.bases.some((b) => isModel(b, seen));
  };
  const names = new Set([...classes.keys()].filter((n) => isModel(n)));
  const fieldsOf = (name: string, seen = new Set<string>()): FieldFact[] => {
    const c = classes.get(name);
    if (!c || seen.has(name)) return [];
    seen.add(name);
    const inherited = c.bases.filter((b) => names.has(b)).flatMap((b) => fieldsOf(b, seen));
    const own = (c.node.childForFieldName("body")?.namedChildren ?? []).flatMap((st): FieldFact[] => {
      const a = st?.type === "expression_statement" ? st.namedChildren[0] : undefined;
      const left = a?.childForFieldName("left");
      const type = a?.childForFieldName("type");
      if (a?.type !== "assignment" || left?.type !== "identifier" || !type) return [];
      const shape = fieldType(type);
      return [{ name: left.text, type: PY_TYPES[shape.base] ?? shape.base, list: shape.list, optional: shape.optional, modifiers: {}, line: lineOf(a) }];
    });
    return [...inherited, ...own];
  };
  const facts = [...names].map((name): Fact => {
    const c = classes.get(name)!;
    const fields = fieldsOf(name);
    const signatureText = fields.map((f) => `${f.name}: ${f.type}${f.list ? "[]" : ""}${f.optional ? "?" : ""}`).join("\n");
    return {
      id: `dto:${name}`, kind: "dto", extractor: "fastapi",
      location: { file: c.file.path, symbol: name, line: lineOf(c.node) },
      data: { fields }, fingerprint: { signature: hash(signatureText), signatureText },
    };
  });
  return { names, facts };
}

/** `str`, `list[Item]`, `Optional[int]`, `int | None`, `List[str]`. */
function fieldType(node: Node): { base: string; list: boolean; optional: boolean } {
  const inner = node.type === "type" ? node.namedChildren[0] ?? node : node;
  if (inner.type === "binary_operator") {
    const parts = [inner.childForFieldName("left"), inner.childForFieldName("right")].filter((p): p is Node => !!p);
    const real = parts.filter((p) => p.text !== "None");
    return { ...fieldType(real[0]!), optional: real.length < parts.length };
  }
  if (inner.type === "subscript" || inner.type === "generic_type") {
    const head = (inner.childForFieldName("value") ?? inner.namedChildren[0])!.text.split(".").at(-1)!;
    const arg = inner.childForFieldName("subscript") ?? inner.namedChildren.find((c) => c?.type === "type_parameter")?.namedChildren[0] ?? inner.namedChildren[1];
    const argShape = arg ? fieldType(arg) : { base: "unknown", list: false, optional: false };
    if (/^(list|List|set|Set|Sequence)$/.test(head)) return { ...argShape, list: true };
    if (head === "Optional") return { ...argShape, optional: true };
    return { base: head, list: false, optional: false };
  }
  return { base: inner.text.split(".").at(-1)!, list: false, optional: false };
}

function callee(call: Node): string {
  return call.childForFieldName("function")?.text.split(".").at(-1) ?? "";
}

function kwargNode(call: Node, name: string): Node | undefined {
  for (const a of call.childForFieldName("arguments")?.namedChildren ?? []) {
    if (a?.type === "keyword_argument" && a.childForFieldName("name")?.text === name) return a.childForFieldName("value") ?? undefined;
  }
  return undefined;
}

function kwarg(call: Node, name: string): string | undefined {
  const v = kwargNode(call, name);
  return v ? pyString(v) : undefined;
}
