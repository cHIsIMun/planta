// Extrator Spring (seção 10.3): controllers e rotas (`@RestController`,
// `@RequestMapping`, `@GetMapping`...), componentes injetáveis (`@Service`,
// `@Component`, `@Repository` e interfaces de Spring Data), entidades JPA,
// enums, injeção por construtor e `@Autowired`, consumidores de evento
// (`@EventListener`, `@KafkaListener`), jobs (`@Scheduled`) e, para
// `verify calls`, as chamadas entre métodos e as publicações de evento.
//
// `server.servlet.context-path` fica fora do código: use a opção `prefix` do
// extrator.

import type { Node } from "web-tree-sitter";
import { annotationsOf, listSymbols, parameterTypes, simpleType } from "../code/java.ts";
import { type CodeSymbol, hash, lineOf, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, FieldFact, HttpEndpointData } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const MAPPINGS: Record<string, string | undefined> = {
  GetMapping: "GET", PostMapping: "POST", PutMapping: "PUT", PatchMapping: "PATCH", DeleteMapping: "DELETE", RequestMapping: undefined,
};
const COMPONENTS = new Set(["Service", "Component", "Repository"]);
const REPOSITORY_BASES = /^(JpaRepository|CrudRepository|PagingAndSortingRepository|ListCrudRepository|MongoRepository|ReactiveCrudRepository)$/;
const JAVA_TYPES: Record<string, string> = {
  String: "string", Long: "long", long: "long", Integer: "int", int: "int", Short: "int", short: "int",
  BigDecimal: "decimal", Double: "float", double: "float", Float: "float", float: "float", Boolean: "bool",
  boolean: "bool", LocalDateTime: "datetime", Instant: "datetime", OffsetDateTime: "datetime", ZonedDateTime: "datetime",
  LocalDate: "date", LocalTime: "time", UUID: "uuid", Duration: "duration", byte: "bytes",
};
const COLLECTIONS = new Set(["List", "Set", "Collection", "Iterable"]);

export const spring: Extractor = {
  name: "spring",
  extract(files, config) {
    const prefix = typeof config.prefix === "string" ? config.prefix : "";
    return files.filter((f) => f.language === "java").flatMap((f) => extractFile(f, prefix));
  },
};

function extractFile(file: SourceFile, prefix: string): Fact[] {
  const facts: Fact[] = [];
  const symbols = listSymbols(file);
  for (const cls of symbols.filter((s) => s.kind === "class" || s.kind === "interface" || s.kind === "enum")) {
    const ann = new Map(cls.decorators.map((a) => [annotationName(a), a]));
    const location = { file: file.path, symbol: cls.name, line: lineOf(cls.node) };

    if (cls.kind === "enum") {
      const values = (cls.node.childForFieldName("body")?.namedChildren ?? []).filter((c) => c?.type === "enum_constant").map((c) => c!.childForFieldName("name")!.text);
      facts.push({ id: `enum:${cls.name}`, kind: "enum", extractor: "spring", location, data: { values } });
      continue;
    }
    if (ann.has("Entity")) facts.push(entity(file, cls, symbols));

    const controller = ann.get("RestController") ?? ann.get("Controller");
    const springData = cls.kind === "interface" && extendsInterfaces(cls.node).some((b) => REPOSITORY_BASES.test(b));
    if (controller) {
      facts.push({ id: `controller:${cls.name}`, kind: "controller", extractor: "spring", location, data: { prefix: mappingPaths(ann.get("RequestMapping"))[0] ?? "" } });
    } else if ([...ann.keys()].some((k) => COMPONENTS.has(k)) || springData) {
      facts.push({ id: `service:${cls.name}`, kind: "service", extractor: "spring", location, data: { name: cls.name } });
    } else {
      continue;
    }

    const fields = injectedFields(cls);
    for (const provider of new Set(fields.values())) {
      facts.push({ id: `di:${cls.name}->${provider}`, kind: "di", extractor: "spring", location, data: { consumer: cls.name, provider } });
    }
    const classPaths = controller ? mappingPaths(ann.get("RequestMapping")) : [];
    for (const method of symbols.filter((s) => s.kind === "method" && s.name.startsWith(`${cls.name}.`) && !s.name.includes("("))) {
      facts.push(...methodFacts(file, cls.name, method, controller ? (classPaths.length > 0 ? classPaths : [""]) : undefined, prefix));
      facts.push(...callFacts(file, cls.name, method, fields));
    }
  }
  return facts;
}

// ---------------------------------------------------------------------
//  Rotas, eventos e jobs
// ---------------------------------------------------------------------

function methodFacts(file: SourceFile, cls: string, method: CodeSymbol, classPaths: string[] | undefined, prefix: string): Fact[] {
  const facts: Fact[] = [];
  const location = { file: file.path, symbol: method.name, line: lineOf(method.node) };
  for (const a of method.decorators) {
    const name = annotationName(a);
    if (classPaths && name in MAPPINGS) {
      const verbs = MAPPINGS[name] ? [MAPPINGS[name]!] : requestMethods(a);
      for (const verb of verbs) {
        for (const base of classPaths) {
          for (const sub of mappingPaths(a).length > 0 ? mappingPaths(a) : [""]) {
            const path = normalizeRoute([prefix, base, sub].filter(Boolean).join("/"));
            const data: HttpEndpointData = { method: verb, path, handler: method.name, ...httpParams(method), responses: [{ status: status(method) ?? 200 }], guards: [] };
            const signatureText = [`${verb} ${path}`, ...(data.body ? [`body ${data.body}`] : []), ...data.params.map((p) => `param ${p.name}: ${p.type ?? "?"} in ${p.in}`)].join("\n");
            facts.push({ id: `http.endpoint:${verb}:${path}`, kind: "http.endpoint", extractor: "spring", location, data: { ...data }, fingerprint: { signature: hash(signatureText), signatureText } });
          }
        }
      }
    }
    if (name === "EventListener" || name === "TransactionalEventListener") {
      const event = valueOf(a, "classes")?.text.replace(/\.class$/, "") ?? parameterTypes(method.node)[0] ?? "?";
      facts.push({ id: `event.handler:${event}:${method.name}`, kind: "event.handler", extractor: "spring", location, data: { event, handler: method.name } });
    }
    if (name === "KafkaListener" || name === "RabbitListener" || name === "JmsListener") {
      const topic = strings(valueOf(a, "topics") ?? valueOf(a, "queues") ?? valueOf(a, "destination"))[0] ?? "?";
      facts.push({ id: `event.handler:${topic}:${method.name}`, kind: "event.handler", extractor: "spring", location, data: { event: topic, handler: method.name } });
    }
    if (name === "Scheduled") {
      const cron = strings(valueOf(a, "cron"))[0] ?? `every ${valueOf(a, "fixedRate")?.text ?? valueOf(a, "fixedDelay")?.text ?? "?"}ms`;
      facts.push({ id: `job:${method.name}`, kind: "job", extractor: "spring", location, data: { cron, handler: method.name } });
    }
  }
  return facts;
}

function httpParams(method: CodeSymbol): Pick<HttpEndpointData, "body" | "params"> {
  let body: string | undefined;
  const params: HttpEndpointData["params"] = [];
  for (const p of method.node.childForFieldName("parameters")?.namedChildren ?? []) {
    if (p?.type !== "formal_parameter") continue;
    const type = simpleType(p.childForFieldName("type"));
    const name = p.childForFieldName("name")?.text ?? "?";
    for (const a of annotationsOf(p)) {
      const n = annotationName(a);
      if (n === "RequestBody") body = type;
      const where = n === "PathVariable" ? "path" : n === "RequestParam" ? "query" : n === "RequestHeader" ? "header" : undefined;
      if (where) params.push({ name: strings(valueOf(a, "value") ?? valueOf(a, "name"))[0] ?? name, in: where, type: javaToPlanta(type) });
    }
  }
  return { ...(body && { body }), params };
}

/** `@ResponseStatus(HttpStatus.CREATED)` → 201. */
function status(method: CodeSymbol): number | undefined {
  const a = method.decorators.find((d) => annotationName(d) === "ResponseStatus");
  const text = a && (valueOf(a, "value") ?? valueOf(a, "code"))?.text;
  const named: Record<string, number> = { OK: 200, CREATED: 201, ACCEPTED: 202, NO_CONTENT: 204 };
  return text ? named[text.split(".").at(-1)!] : undefined;
}

function requestMethods(a: Node): string[] {
  const method = valueOf(a, "method");
  if (!method) return ["ALL"];
  const items = method.type === "element_value_array_initializer" ? method.namedChildren.filter((c): c is Node => !!c) : [method];
  return items.map((i) => i.text.split(".").at(-1)!.toUpperCase());
}

/** `@RequestMapping("/x")`, `@GetMapping(path = {"/a", "/b"})`. */
function mappingPaths(a: Node | undefined): string[] {
  if (!a) return [];
  return strings(valueOf(a, "value") ?? valueOf(a, "path"));
}

// ---------------------------------------------------------------------
//  Injeção e chamadas
// ---------------------------------------------------------------------

/** Campo → tipo, para campos injetados pelo construtor (o único, ou o `@Autowired`) e por `@Autowired`. */
function injectedFields(cls: CodeSymbol): Map<string, string> {
  const body = cls.node.childForFieldName("body");
  const fields = new Map<string, string>();
  const types = new Map<string, string>();
  for (const f of body?.namedChildren ?? []) {
    if (f?.type !== "field_declaration") continue;
    const type = simpleType(f.childForFieldName("type"));
    for (const d of f.childrenForFieldName("declarator")) {
      const name = d?.childForFieldName("name")?.text;
      if (!name) continue;
      types.set(name, type);
      if (annotationsOf(f).some((a) => annotationName(a) === "Autowired")) fields.set(name, type);
    }
  }
  const ctors = (body?.namedChildren ?? []).filter((c): c is Node => c?.type === "constructor_declaration");
  const ctor = ctors.length === 1 ? ctors[0] : ctors.find((c) => annotationsOf(c).some((a) => annotationName(a) === "Autowired"));
  for (const p of ctor?.childForFieldName("parameters")?.namedChildren ?? []) {
    const name = p?.childForFieldName("name")?.text;
    const type = p && simpleType(p.childForFieldName("type"));
    // O parâmetro vira campo de mesmo nome (`this.service = service`), ou o tipo do campo atribuído.
    if (name && type) fields.set(types.has(name) ? name : name, type);
  }
  // Lombok (`@RequiredArgsConstructor`): os campos `final` são injetados.
  if (cls.decorators.some((a) => /^(RequiredArgsConstructor|AllArgsConstructor)$/.test(annotationName(a)))) {
    for (const f of body?.namedChildren ?? []) {
      if (f?.type !== "field_declaration" || !/\bfinal\b/.test(f.namedChildren.find((c) => c?.type === "modifiers")?.text ?? "")) continue;
      for (const d of f.childrenForFieldName("declarator")) if (d?.childForFieldName("name")) fields.set(d.childForFieldName("name")!.text, simpleType(f.childForFieldName("type")));
    }
  }
  return fields;
}

function callFacts(file: SourceFile, cls: string, method: CodeSymbol, fields: Map<string, string>): Fact[] {
  const facts: Fact[] = [];
  for (const call of method.node.childForFieldName("body")?.descendantsOfType("method_invocation") ?? []) {
    if (!call) continue;
    const name = call.childForFieldName("name")?.text ?? "";
    const object = call.childForFieldName("object");
    const location = { file: file.path, symbol: method.name, line: lineOf(call) };
    const field = object?.type === "identifier" ? object.text : object?.type === "field_access" && object.childForFieldName("object")?.type === "this" ? object.childForFieldName("field")?.text : undefined;
    const type = field ? fields.get(field) : undefined;
    if (type && (name === "publishEvent" || name === "send" || name === "convertAndSend")) {
      const arg = call.childForFieldName("arguments")?.namedChildren[0];
      const event = arg?.type === "object_creation_expression" ? simpleType(arg.childForFieldName("type")) : arg ? strings(arg)[0] : undefined;
      if (event) {
        facts.push({ id: `event.emit:${event}:${method.name}:${location.line}`, kind: "event.emit", extractor: "spring", location, data: { event, in: method.name } });
        continue;
      }
    }
    const callee = type ? `${type}.${name}` : !object || object.type === "this" ? `${cls}.${name}` : undefined;
    if (callee && callee !== method.name) facts.push({ id: `call:${method.name}->${callee}:${location.line}`, kind: "call", extractor: "spring", location, data: { caller: method.name, callee } });
  }
  return facts;
}

// ---------------------------------------------------------------------
//  Entidades JPA
// ---------------------------------------------------------------------

function entity(file: SourceFile, cls: CodeSymbol, symbols: CodeSymbol[]): Fact {
  const fields: FieldFact[] = [];
  for (const f of symbols.filter((s) => s.kind === "property" && s.name.startsWith(`${cls.name}.`) && s.name.split(".").length === cls.name.split(".").length + 1)) {
    const node = f.node;
    if (/\b(static|transient)\b/.test(node.namedChildren.find((c) => c?.type === "modifiers")?.text ?? "")) continue;
    const ann = new Map(annotationsOf(node).map((a) => [annotationName(a), a]));
    if (ann.has("Transient")) continue;
    const typeNode = node.childForFieldName("type");
    const outer = simpleType(typeNode);
    const list = COLLECTIONS.has(outer);
    const inner = list && typeNode?.type === "generic_type" ? simpleType(typeNode.namedChildren[1]?.namedChildren[0] ?? null) : outer;
    const modifiers: Record<string, unknown[]> = {};
    if (ann.has("Id")) modifiers.key = [];
    const column = ann.get("Column");
    if (column && valueOf(column, "unique")?.text === "true") modifiers.unique = [];
    const length = column && valueOf(column, "length")?.text;
    if (length) modifiers.max = [Number(length)];
    const precision = column && valueOf(column, "precision")?.text;
    if (precision) modifiers.precision = [Number(precision), Number(valueOf(column!, "scale")?.text ?? 0)];
    // Como no TypeORM: opcional só quando o código diz (`nullable = true`, `@Nullable`, `Optional<T>`).
    const optional = (column && valueOf(column, "nullable")?.text === "true") || ann.has("Nullable") || outer === "Optional";
    fields.push({ name: f.name.split(".").at(-1)!, type: JAVA_TYPES[inner] ?? inner, list, optional: !!optional, modifiers, line: lineOf(node) });
  }
  const signatureText = fields.map((f) => `${f.name}: ${f.type}${f.list ? "[]" : ""}${f.optional ? "?" : ""} ${Object.keys(f.modifiers).sort().join(" ")}`.trim()).join("\n");
  const table = cls.decorators.find((a) => annotationName(a) === "Table");
  return {
    id: `entity:${cls.name}`,
    kind: "entity",
    extractor: "spring",
    location: { file: file.path, symbol: cls.name, line: lineOf(cls.node) },
    data: { table: (table && strings(valueOf(table, "name"))[0]) ?? cls.name, fields },
    fingerprint: { signature: hash(signatureText), signatureText },
  };
}

// ---------------------------------------------------------------------
//  Anotações
// ---------------------------------------------------------------------

export function annotationName(a: Node): string {
  return a.childForFieldName("name")?.text.split(".").at(-1) ?? "";
}

/** Valor de `chave = valor`; para `value`, também o argumento único sem chave. */
function valueOf(a: Node, key: string): Node | undefined {
  const args = a.childForFieldName("arguments");
  for (const c of args?.namedChildren ?? []) {
    if (c?.type === "element_value_pair" && c.childForFieldName("key")?.text === key) return c.childForFieldName("value") ?? undefined;
  }
  if (key === "value" && args?.namedChildren.length === 1 && args.namedChildren[0]?.type !== "element_value_pair") return args.namedChildren[0] ?? undefined;
  return undefined;
}

function strings(node: Node | undefined): string[] {
  if (!node) return [];
  if (node.type === "string_literal") return [node.namedChildren.filter((c) => c?.type === "string_fragment").map((c) => c!.text).join("")];
  if (node.type === "element_value_array_initializer") return node.namedChildren.flatMap((c) => (c ? strings(c) : []));
  return [];
}

function extendsInterfaces(node: Node): string[] {
  const list = node.namedChildren.find((c) => c?.type === "extends_interfaces")?.namedChildren[0];
  return (list?.namedChildren ?? []).map((t) => simpleType(t ?? null));
}

export function javaToPlanta(type: string): string {
  return JAVA_TYPES[type] ?? type;
}
