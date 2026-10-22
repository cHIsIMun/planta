// Extrator NestJS (seção 10.3): controllers, rotas HTTP, serviços injetáveis,
// injeção de dependência, consumidores de evento e jobs agendados.

import type { Node } from "web-tree-sitter";
import { decoratorCall, hash, listSymbols, lineOf, stringValue, type CodeSymbol, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, HttpEndpointData } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const HTTP_DECORATORS: Record<string, string> = {
  Get: "GET", Post: "POST", Put: "PUT", Patch: "PATCH", Delete: "DELETE", Head: "HEAD", Options: "OPTIONS", All: "ALL",
};
const EVENT_DECORATORS = new Set(["OnEvent", "EventPattern", "MessagePattern"]);
const PARAM_DECORATORS: Record<string, string> = { Param: "path", Query: "query", Headers: "header" };

export const nestjs: Extractor = {
  name: "nestjs",
  extract(files) {
    const ts = files.filter((f) => f.language === "typescript");
    const prefix = globalPrefix(ts);
    return ts.flatMap((file) => extractFile(file, prefix));
  },
};

function extractFile(file: SourceFile, prefix: string): Fact[] {
  const facts: Fact[] = [];
  const symbols = listSymbols(file);

  for (const cls of symbols.filter((s) => s.kind === "class")) {
    const decorators = new Map(cls.decorators.flatMap((d) => {
      const call = decoratorCall(d);
      return call ? [[call.name, call] as const] : [];
    }));
    const controller = decorators.get("Controller");
    const injectable = decorators.get("Injectable");
    if (!controller && !injectable) continue;

    const location = { file: file.path, symbol: cls.name, line: lineOf(cls.node) };
    if (controller) {
      facts.push({
        id: `controller:${cls.name}`,
        kind: "controller",
        extractor: "nestjs",
        location,
        data: { prefix: controllerPrefix(controller.args[0]) },
      });
    } else {
      facts.push({ id: `service:${cls.name}`, kind: "service", extractor: "nestjs", location, data: { name: cls.name } });
    }

    for (const provider of constructorDependencies(cls)) {
      facts.push({
        id: `di:${cls.name}->${provider}`,
        kind: "di",
        extractor: "nestjs",
        location,
        data: { consumer: cls.name, provider },
      });
    }

    const methods = symbols.filter((s) => s.kind === "method" && s.name.startsWith(`${cls.name}.`));
    const classGuards = guardsOf(cls.decorators);
    const properties = constructorProperties(cls);
    for (const method of methods) {
      facts.push(...methodFacts(file, method, controller ? controllerPrefix(controller.args[0]) : undefined, prefix, classGuards));
      facts.push(...callFacts(file, cls.name, method, properties));
    }
  }
  return facts;
}

function methodFacts(file: SourceFile, method: CodeSymbol, controllerPath: string | undefined, prefix: string, classGuards: string[]): Fact[] {
  const facts: Fact[] = [];
  const location = { file: file.path, symbol: method.name, line: lineOf(method.node) };
  const calls = method.decorators.flatMap((d) => decoratorCall(d) ?? []);

  for (const call of calls) {
    const verb = HTTP_DECORATORS[call.name];
    if (verb && controllerPath !== undefined) {
      const path = normalizeRoute([prefix, controllerPath, stringValue(call.args[0]) ?? ""].filter(Boolean).join("/"));
      const status = calls.find((c) => c.name === "HttpCode")?.args[0]?.text;
      const data: HttpEndpointData = {
        method: verb,
        path,
        handler: method.name,
        ...httpParams(method),
        responses: [{ status: status ? Number(status) : verb === "POST" ? 201 : 200 }],
        guards: [...classGuards, ...guardsOf(method.decorators)],
      };
      const signatureText = [
        `${data.method} ${data.path}`,
        ...(data.body ? [`body ${data.body}`] : []),
        ...data.params.map((p) => `param ${p.name}: ${p.type ?? "?"} in ${p.in}`),
        ...data.responses.map((r) => `returns ${r.status}`),
        ...(data.guards.length > 0 ? [`guards ${data.guards.join(", ")}`] : []),
      ].join("\n");
      facts.push({
        id: `http.endpoint:${verb}:${path}`,
        kind: "http.endpoint",
        extractor: "nestjs",
        location,
        data: { ...data },
        fingerprint: { signature: hash(signatureText), signatureText },
      });
    }

    if (EVENT_DECORATORS.has(call.name)) {
      const event = stringValue(call.args[0]) ?? call.args[0]?.text ?? "?";
      facts.push({
        id: `event.handler:${event}:${method.name}`,
        kind: "event.handler",
        extractor: "nestjs",
        location,
        data: { event, handler: method.name },
      });
    }

    if (call.name === "Cron" || call.name === "Interval") {
      const cron = stringValue(call.args[0]) ?? call.args[0]?.text ?? "?";
      facts.push({ id: `job:${method.name}`, kind: "job", extractor: "nestjs", location, data: { cron, handler: method.name } });
    }
  }
  return facts;
}

function httpParams(method: CodeSymbol): Pick<HttpEndpointData, "body" | "params"> {
  let body: string | undefined;
  const params: HttpEndpointData["params"] = [];
  for (const param of method.node.childForFieldName("parameters")?.namedChildren ?? []) {
    if (!param) continue;
    const type = typeName(param.childForFieldName("type"));
    const name = param.childForFieldName("pattern")?.text;
    for (const d of param.namedChildren.filter((c): c is Node => c?.type === "decorator")) {
      const call = decoratorCall(d);
      if (!call) continue;
      if (call.name === "Body") body = type;
      const where = PARAM_DECORATORS[call.name];
      if (where) params.push({ name: stringValue(call.args[0]) ?? name ?? "?", in: where, ...(type && { type }) });
    }
  }
  return { ...(body && { body }), params };
}

/**
 * Chamadas do método a outros métodos (`this.service.criar()` → `ClientesService.criar`,
 * `this.validar()` → `Classe.validar`) e eventos publicados (`this.eventos.emit('x')`,
 * `this.bus.publish(new X())`), na ordem em que aparecem: é o grafo de `verify calls`.
 */
function callFacts(file: SourceFile, cls: string, method: CodeSymbol, properties: Map<string, string>): Fact[] {
  const facts: Fact[] = [];
  const body = method.node.childForFieldName("body");
  for (const call of body?.descendantsOfType("call_expression") ?? []) {
    const fn = call?.childForFieldName("function");
    if (!call || fn?.type !== "member_expression") continue;
    const name = fn.childForFieldName("property")?.text ?? "";
    const object = fn.childForFieldName("object");
    const location = { file: file.path, symbol: method.name, line: lineOf(call) };
    let callee: string | undefined;
    if (object?.type === "this") callee = `${cls}.${name}`;
    else if (object?.type === "member_expression" && object.childForFieldName("object")?.type === "this") {
      const type = properties.get(object.childForFieldName("property")?.text ?? "");
      if (type && (name === "emit" || name === "publish")) {
        const arg = call.childForFieldName("arguments")?.namedChildren[0];
        const event = arg?.type === "new_expression" ? arg.childForFieldName("constructor")?.text : stringValue(arg ?? undefined);
        if (event) {
          facts.push({ id: `event.emit:${event}:${method.name}:${location.line}`, kind: "event.emit", extractor: "nestjs", location, data: { event, in: method.name } });
          continue;
        }
      }
      if (type) callee = `${type}.${name}`;
    }
    if (callee && callee !== method.name) {
      facts.push({ id: `call:${method.name}->${callee}:${location.line}`, kind: "call", extractor: "nestjs", location, data: { caller: method.name, callee } });
    }
  }
  return facts;
}

/** Propriedades criadas pelo construtor e seus tipos: `private readonly repo: ClienteRepository`. */
function constructorProperties(cls: CodeSymbol): Map<string, string> {
  const body = cls.node.childForFieldName("body");
  const ctor = body?.namedChildren.find((m) => m?.type === "method_definition" && m.childForFieldName("name")?.text === "constructor");
  const props = new Map<string, string>();
  for (const p of ctor?.childForFieldName("parameters")?.namedChildren ?? []) {
    const name = p?.childForFieldName("pattern")?.text;
    const type = p && typeName(p.childForFieldName("type"));
    if (name && type) props.set(name, type);
  }
  return props;
}

/** Classes injetadas pelo construtor: `constructor(private readonly s: ClientesService)`. */
function constructorDependencies(cls: CodeSymbol): string[] {
  const body = cls.node.childForFieldName("body");
  const ctor = body?.namedChildren.find((m) => m?.type === "method_definition" && m.childForFieldName("name")?.text === "constructor");
  return (ctor?.childForFieldName("parameters")?.namedChildren ?? []).flatMap((p) => {
    // `@Inject('TOKEN')` injeta por string: não dá para saber a classe.
    if (!p || p.namedChildren.some((c) => c?.type === "decorator" && decoratorCall(c)?.name === "Inject")) return [];
    const type = typeName(p.childForFieldName("type"));
    return type ? [type] : [];
  });
}

/** Texto do tipo anotado: `dto: CriarClienteDto` → `CriarClienteDto`. */
function typeName(annotation: Node | null): string | undefined {
  const type = annotation?.namedChildren[0];
  if (!type) return undefined;
  return type.text;
}

function guardsOf(decorators: Node[]): string[] {
  return decorators.flatMap((d) => {
    const call = decoratorCall(d);
    return call?.name === "UseGuards" ? call.args.map((a) => a.text) : [];
  });
}

function controllerPrefix(arg: Node | undefined): string {
  if (!arg) return "";
  const direct = stringValue(arg);
  if (direct !== undefined) return direct;
  // `@Controller({ path: 'clientes' })`
  const pair = arg.type === "object"
    ? arg.namedChildren.find((p) => p?.type === "pair" && p.childForFieldName("key")?.text === "path")
    : undefined;
  return stringValue(pair?.childForFieldName("value") ?? undefined) ?? "";
}

/** `app.setGlobalPrefix('api/v1')`, normalmente no `main.ts`. */
function globalPrefix(files: SourceFile[]): string {
  for (const file of files) {
    const index = file.text.indexOf("setGlobalPrefix");
    if (index < 0) continue;
    const node = file.tree.rootNode.descendantForIndex(index);
    const call = node?.parent?.parent;
    if (call?.type === "call_expression") {
      const value = stringValue(call.childForFieldName("arguments")?.namedChildren[0] ?? undefined);
      if (value !== undefined) return value;
    }
  }
  return "";
}
