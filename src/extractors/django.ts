// Extrator Django (seção 10.3): models (campos, relações e as reversas que o
// Django cria), `TextChoices`, rotas de `urls.py` (inclusive `include` e
// routers do DRF), views de função, de classe e ViewSets, signals e jobs do
// Celery beat.
//
// Ações que a classe herda do framework (o `create` de um `ModelViewSet`)
// não existem no arquivo; o fato marca `inherited`, e a âncora
// `#ClienteViewSet.create` resolve para a classe.

import { posix } from "node:path";
import type { Node } from "web-tree-sitter";
import { unwrap } from "../code/python.ts";
import { hash, lineOf, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, FieldFact, HttpEndpointData } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const FIELD_TYPES: Record<string, string> = {
  CharField: "string", SlugField: "string", TextField: "text", EmailField: "email", URLField: "url",
  UUIDField: "uuid", IntegerField: "int", SmallIntegerField: "int", PositiveIntegerField: "int",
  PositiveSmallIntegerField: "int", BigIntegerField: "long", PositiveBigIntegerField: "long",
  AutoField: "int", BigAutoField: "long", SmallAutoField: "int", DecimalField: "decimal",
  FloatField: "float", BooleanField: "bool", NullBooleanField: "bool", DateTimeField: "datetime",
  DateField: "date", TimeField: "time", DurationField: "duration", JSONField: "json",
  BinaryField: "bytes", FileField: "string", ImageField: "string", GenericIPAddressField: "string",
};
const RELATIONS: Record<string, "one" | "many"> = { ForeignKey: "one", OneToOneField: "one", ManyToManyField: "many" };
const CHOICES = new Set(["TextChoices", "IntegerChoices", "Choices"]);

const VIEWSET_ACTIONS: Record<string, { method: string; detail: boolean }> = {
  list: { method: "GET", detail: false },
  create: { method: "POST", detail: false },
  retrieve: { method: "GET", detail: true },
  update: { method: "PUT", detail: true },
  partial_update: { method: "PATCH", detail: true },
  destroy: { method: "DELETE", detail: true },
};
const VIEWSET_BASES: Record<string, string[]> = {
  ModelViewSet: ["list", "create", "retrieve", "update", "partial_update", "destroy"],
  ReadOnlyModelViewSet: ["list", "retrieve"],
};
const MIXINS: Record<string, string[]> = {
  ListModelMixin: ["list"], CreateModelMixin: ["create"], RetrieveModelMixin: ["retrieve"],
  UpdateModelMixin: ["update", "partial_update"], DestroyModelMixin: ["destroy"],
};
/** Views genéricas do DRF e do Django: métodos HTTP que herdam prontos. */
const GENERIC_VIEWS: Record<string, string[]> = {
  ListAPIView: ["get"], CreateAPIView: ["post"], RetrieveAPIView: ["get"], DestroyAPIView: ["delete"],
  UpdateAPIView: ["put", "patch"], ListCreateAPIView: ["get", "post"], RetrieveUpdateAPIView: ["get", "put", "patch"],
  RetrieveDestroyAPIView: ["get", "delete"], RetrieveUpdateDestroyAPIView: ["get", "put", "patch", "delete"],
  ListView: ["get"], DetailView: ["get"], TemplateView: ["get"], CreateView: ["get", "post"],
  UpdateView: ["get", "post"], DeleteView: ["get", "post"], FormView: ["get", "post"],
};
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

export const django: Extractor = {
  name: "django",
  extract(files) {
    const py = files.filter((f) => f.language === "python");
    const project = new Project(py);
    return [...project.models(), ...project.routes(), ...project.signals(), ...project.jobs()];
  },
};

/** Campo com o que é preciso para criar o lado reverso da relação. */
type ModelField = FieldFact & { relation?: string; relatedName?: string };

interface Definition {
  file: SourceFile;
  node: Node;
  name: string;
  decorators: Node[];
  bases: string[];
}

class Project {
  /** Classes e funções de nível superior por nome. */
  private readonly classes = new Map<string, Definition[]>();
  private readonly functions = new Map<string, Definition[]>();

  constructor(private readonly files: SourceFile[]) {
    for (const file of files) {
      for (const statement of file.tree.rootNode.namedChildren) {
        if (!statement) continue;
        const { decorators, definition } = unwrap(statement);
        const name = definition.childForFieldName("name")?.text;
        if (!name) continue;
        const def = { file, node: definition, name, decorators, bases: basesOf(definition) };
        const map = definition.type === "class_definition" ? this.classes : definition.type === "function_definition" ? this.functions : undefined;
        map?.set(name, [...(map.get(name) ?? []), def]);
      }
    }
  }

  /** Definição pelo nome, preferindo a do mesmo pacote de `near`. */
  private find(map: Map<string, Definition[]>, name: string, near?: SourceFile): Definition | undefined {
    const all = map.get(name) ?? [];
    return all.find((d) => near && posix.dirname(d.file.path) === posix.dirname(near.path)) ?? all[0];
  }

  // -------------------------------------------------------------------
  //  Models
  // -------------------------------------------------------------------

  private isModel(def: Definition, seen = new Set<string>()): boolean {
    if (seen.has(def.name)) return false;
    seen.add(def.name);
    return def.bases.some((b) => b === "models.Model" || b === "Model" || (this.find(this.classes, last(b)) && this.isModel(this.find(this.classes, last(b))!, seen)));
  }

  private isEnum(def: Definition): boolean {
    return def.bases.some((b) => CHOICES.has(last(b)));
  }

  models(): Fact[] {
    const facts: Fact[] = [];
    const models = [...this.classes.values()].flat().filter((d) => this.isModel(d) && !metaFlag(d, "abstract"));
    const reverse = new Map<string, FieldFact[]>();
    const fieldsOf = new Map<Definition, ModelField[]>();

    for (const model of models) {
      const fields = this.ownFields(model);
      if (!fields.some((f) => "key" in f.modifiers)) {
        fields.unshift({ name: "id", type: "long", list: false, optional: false, modifiers: { key: [] }, line: lineOf(model.node) });
      }
      fieldsOf.set(model, fields);
      // Lado reverso das relações: o Django cria `cliente.pedidos` a partir de `Pedido.cliente`.
      for (const f of fields.filter((x) => x.relation)) {
        const accessor = f.relatedName ?? (f.relation === "one-to-one" ? model.name.toLowerCase() : `${model.name.toLowerCase()}_set`);
        if (accessor === "+" || accessor.endsWith("+")) continue;
        const many = f.relation !== "one-to-one";
        const back: FieldFact = { name: accessor, type: model.name, list: many, optional: !many, modifiers: {}, line: f.line };
        reverse.set(f.type, [...(reverse.get(f.type) ?? []), back]);
      }
    }

    for (const model of models) {
      const fields = [...fieldsOf.get(model)!, ...(reverse.get(model.name) ?? [])].map(({ relation: _r, relatedName: _n, ...f }: ModelField) => f);
      const signatureText = fields
        .map((f) => `${f.name}: ${f.type}${f.list ? "[]" : ""}${f.optional ? "?" : ""} ${Object.keys(f.modifiers).sort().join(" ")}`.trim())
        .join("\n");
      facts.push({
        id: `entity:${model.name}`,
        kind: "entity",
        extractor: "django",
        location: { file: model.file.path, symbol: model.name, line: lineOf(model.node) },
        data: { table: metaString(model, "db_table") ?? model.name, fields },
        fingerprint: { signature: hash(signatureText), signatureText },
      });
    }

    for (const def of [...this.classes.values()].flat().filter((d) => this.isEnum(d))) {
      const values = classBody(def).flatMap((s) => {
        const a = s.type === "expression_statement" ? s.namedChildren[0] : undefined;
        const left = a?.type === "assignment" ? a.childForFieldName("left") : undefined;
        return left?.type === "identifier" ? [left.text] : [];
      });
      facts.push({
        id: `enum:${def.name}`,
        kind: "enum",
        extractor: "django",
        location: { file: def.file.path, symbol: def.name, line: lineOf(def.node) },
        data: { values },
      });
    }
    return facts;
  }

  /** Campos declarados no model e nos models abstratos de que ele herda. */
  private ownFields(model: Definition, seen = new Set<string>()): ModelField[] {
    if (seen.has(model.name)) return [];
    seen.add(model.name);
    const inherited = model.bases.flatMap((b) => {
      const base = this.find(this.classes, last(b));
      return base && metaFlag(base, "abstract") ? this.ownFields(base, seen) : [];
    });
    const own = classBody(model).flatMap((s) => {
      const a = s.type === "expression_statement" ? s.namedChildren[0] : undefined;
      if (a?.type !== "assignment") return [];
      const name = a.childForFieldName("left");
      const call = a.childForFieldName("right");
      if (name?.type !== "identifier" || call?.type !== "call") return [];
      const f = this.field(name.text, call);
      return f ? [f] : [];
    });
    return [...inherited, ...own];
  }

  private field(name: string, call: Node): ModelField | undefined {
    const fn = callee(call);
    const kind = last(fn);
    const relation = RELATIONS[kind];
    if (!FIELD_TYPES[kind] && !relation) return undefined;
    const kw = kwargs(call);
    const modifiers: Record<string, unknown[]> = {};
    let type = FIELD_TYPES[kind] ?? "unknown";
    let list = false;

    if (kw.get("primary_key")?.text === "True" || kind.endsWith("AutoField")) modifiers.key = [];
    if (kw.get("unique")?.text === "True" || kind === "OneToOneField") modifiers.unique = [];
    const max = kw.get("max_length")?.text;
    if (max && /^\d+$/.test(max)) modifiers.max = [Number(max)];
    const digits = kw.get("max_digits")?.text;
    if (digits) modifiers.precision = [Number(digits), Number(kw.get("decimal_places")?.text ?? 0)];
    if (kw.get("db_index")?.text === "True") modifiers.index = [];

    // `choices=Status.choices`: o tipo é a enumeração.
    const choices = kw.get("choices");
    const choiceClass = choices?.type === "attribute" ? choices.childForFieldName("object")?.text : undefined;
    if (choiceClass && this.find(this.classes, last(choiceClass))) type = last(choiceClass);

    let relatedName: string | undefined;
    if (relation) {
      const target = positional(call)[0] ?? kw.get("to");
      const text = target && (pyString(target) ?? target.text);
      type = text ? last(text) : "unknown";
      list = relation === "many";
      relatedName = kw.get("related_name") && pyString(kw.get("related_name")!);
    }
    const optional = kw.get("null")?.text === "True";
    return {
      name,
      type,
      list,
      optional,
      modifiers,
      line: lineOf(call),
      ...(relation && { relation: kind === "OneToOneField" ? "one-to-one" : relation }),
      ...(relatedName && { relatedName }),
    };
  }

  // -------------------------------------------------------------------
  //  Rotas
  // -------------------------------------------------------------------

  routes(): Fact[] {
    const urls = this.files.filter((f) => posix.basename(f.path) === "urls.py");
    const included = new Set<string>();
    for (const file of urls) for (const target of this.includesIn(file)) included.add(target);
    // Raízes: arquivos `urls.py` que nenhum outro inclui (o ROOT_URLCONF).
    const roots = urls.filter((f) => !included.has(f.path));
    const facts: Fact[] = [];
    for (const root of roots) facts.push(...this.patterns(root, "", new Set()));
    return [...new Map(facts.map((f) => [f.id, f])).values()];
  }

  private includesIn(file: SourceFile): string[] {
    const out: string[] = [];
    for (const call of descendants(file.tree.rootNode, "call")) {
      if (last(callee(call)) !== "include") continue;
      const target = this.moduleFile(positional(call)[0], file);
      if (target) out.push(target.path);
    }
    return out;
  }

  /** `include("vendas.urls")` → o arquivo `vendas/urls.py` sob alguma raiz. */
  private moduleFile(arg: Node | undefined, from: SourceFile): SourceFile | undefined {
    const mod = arg && pyString(arg);
    if (!mod) return undefined;
    const tail = `${mod.replace(/\./g, "/")}.py`;
    return this.files.find((f) => f.path === tail || f.path.endsWith(`/${tail}`))
      ?? this.files.find((f) => f.path === posix.join(posix.dirname(from.path), tail));
  }

  private patterns(file: SourceFile, prefix: string, visiting: Set<string>): Fact[] {
    if (visiting.has(file.path)) return [];
    visiting = new Set([...visiting, file.path]);
    const facts: Fact[] = [];
    const routers = this.routers(file);

    for (const list of urlLists(file)) {
      for (const item of list) {
        if (item.type === "attribute" && item.childForFieldName("attribute")?.text === "urls") {
          // `urlpatterns += router.urls`
          const router = routers.get(item.childForFieldName("object")?.text ?? "");
          if (router) facts.push(...this.routerFacts(router, prefix));
          continue;
        }
        if (item.type !== "call") continue;
        const fn = last(callee(item));
        if (fn !== "path" && fn !== "re_path") continue;
        const [routeArg, viewArg] = positional(item);
        const route = routeArg && pyString(routeArg);
        if (route === undefined || !viewArg) continue;
        const full = joinRoute(prefix, fn === "re_path" ? regexToPath(route) : route);
        if (viewArg.type === "call" && last(callee(viewArg)) === "include") {
          const target = positional(viewArg)[0];
          const router = target?.type === "attribute" && target.childForFieldName("attribute")?.text === "urls"
            ? routers.get(target.childForFieldName("object")?.text ?? "")
            : undefined;
          if (router) facts.push(...this.routerFacts(router, full));
          const included = this.moduleFile(target, file);
          if (included) facts.push(...this.patterns(included, full, visiting));
          continue;
        }
        facts.push(...this.viewFacts(viewArg, full, file));
      }
    }
    return facts;
  }

  /** `router = DefaultRouter()` e `router.register(r"clientes", ClienteViewSet)`. */
  private routers(file: SourceFile): Map<string, { prefix: string; viewset: string; file: SourceFile }[]> {
    const routers = new Map<string, { prefix: string; viewset: string; file: SourceFile }[]>();
    for (const call of descendants(file.tree.rootNode, "call")) {
      const fn = call.childForFieldName("function");
      if (fn?.type !== "attribute" || fn.childForFieldName("attribute")?.text !== "register") continue;
      const router = fn.childForFieldName("object")?.text ?? "";
      const [prefixArg, viewArg] = positional(call);
      const prefix = prefixArg && pyString(prefixArg);
      if (prefix === undefined || !viewArg) continue;
      routers.set(router, [...(routers.get(router) ?? []), { prefix, viewset: last(viewArg.text), file }]);
    }
    return routers;
  }

  private routerFacts(registrations: { prefix: string; viewset: string; file: SourceFile }[], base: string): Fact[] {
    const facts: Fact[] = [];
    for (const r of registrations) {
      const def = this.find(this.classes, r.viewset, r.file);
      if (!def) continue;
      const methods = new Set(methodsOf(def));
      const actions = new Set<string>();
      for (const b of def.bases.map(last)) for (const a of VIEWSET_BASES[b] ?? MIXINS[b] ?? []) actions.add(a);
      for (const m of methods) if (VIEWSET_ACTIONS[m]) actions.add(m);
      const lookup = classAttribute(def, "lookup_field") ?? "pk";
      const list = joinRoute(base, r.prefix);
      const detail = joinRoute(list, `{${lookup}}`);
      for (const action of actions) {
        const spec = VIEWSET_ACTIONS[action]!;
        facts.push(this.endpoint(spec.method, spec.detail ? detail : list, `${def.name}.${action}`, def, !methods.has(action)));
      }
      // `@action(detail=True, methods=["post"])`
      for (const m of classBody(def)) {
        const { decorators, definition } = unwrap(m);
        const action = decorators.map((d) => d.namedChildren[0]).find((c) => c?.type === "call" && last(callee(c)) === "action");
        const name = definition.childForFieldName("name")?.text;
        if (!action || !name) continue;
        const kw = kwargs(action);
        const path = kw.get("url_path") ? pyString(kw.get("url_path")!) ?? name : name;
        const verbs = stringList(kw.get("methods")) ?? ["get"];
        for (const verb of verbs) facts.push(this.endpoint(verb.toUpperCase(), joinRoute(kw.get("detail")?.text === "True" ? detail : list, path), `${def.name}.${name}`, def, false));
      }
    }
    return facts;
  }

  /** `views.criar_cliente`, `ClienteView.as_view()` ou um nome importado. */
  private viewFacts(view: Node, route: string, file: SourceFile): Fact[] {
    const asView = view.type === "call" && view.childForFieldName("function")?.type === "attribute"
      && view.childForFieldName("function")!.childForFieldName("attribute")?.text === "as_view";
    const name = last((asView ? view.childForFieldName("function")!.childForFieldName("object")! : view).text);
    if (asView) {
      const def = this.find(this.classes, name, file);
      if (!def) return [];
      const own = methodsOf(def).filter((m) => HTTP_METHODS.includes(m));
      const inherited = def.bases.flatMap((b) => GENERIC_VIEWS[last(b)] ?? []).filter((m) => !own.includes(m));
      return [
        ...own.map((m) => this.endpoint(m.toUpperCase(), route, `${def.name}.${m}`, def, false)),
        ...inherited.map((m) => this.endpoint(m.toUpperCase(), route, `${def.name}.${m}`, def, true)),
      ];
    }
    const def = this.find(this.functions, name, file);
    if (!def) return [];
    return httpMethodsOf(def).map((m) => this.endpoint(m, route, def.name, def, false));
  }

  private endpoint(method: string, route: string, handler: string, def: Definition, inherited: boolean): Fact {
    const path = normalizeRoute(route);
    const params = [...path.matchAll(/:([^/]+)/g)].map((m) => ({ name: m[1]!, in: "path" }));
    const data: HttpEndpointData & { inherited?: true } = {
      method, path, handler, params, responses: [{ status: method === "POST" ? 201 : 200 }], guards: [],
      ...(inherited && { inherited: true }),
    };
    const signatureText = [`${method} ${path}`, ...params.map((p) => `param ${p.name} in path`)].join("\n");
    return {
      id: `http.endpoint:${method}:${path}`,
      kind: "http.endpoint",
      extractor: "django",
      location: { file: def.file.path, symbol: inherited ? def.name : handler, line: lineOf(def.node) },
      data: { ...data },
      fingerprint: { signature: hash(signatureText), signatureText },
    };
  }

  // -------------------------------------------------------------------
  //  Signals e jobs
  // -------------------------------------------------------------------

  /** `@receiver(post_save, sender=Cliente)`. */
  signals(): Fact[] {
    return [...this.functions.values()].flat().flatMap((def) => def.decorators.flatMap((d): Fact[] => {
      const call = d.namedChildren[0];
      if (call?.type !== "call" || last(callee(call)) !== "receiver") return [];
      const signal = last(positional(call)[0]?.text ?? "?");
      const sender = kwargs(call).get("sender")?.text;
      const event = sender ? `${signal}:${last(sender)}` : signal;
      return [{
        id: `event.handler:${event}:${def.name}`,
        kind: "event.handler",
        extractor: "django",
        location: { file: def.file.path, symbol: def.name, line: lineOf(def.node) },
        data: { event, handler: def.name },
      }];
    }));
  }

  /** Agenda do Celery beat (`CELERY_BEAT_SCHEDULE` ou `app.conf.beat_schedule`): tarefa → cron. */
  jobs(): Fact[] {
    const facts: Fact[] = [];
    for (const file of this.files) {
      for (const a of descendants(file.tree.rootNode, "assignment")) {
        const left = a.childForFieldName("left")?.text ?? "";
        const right = a.childForFieldName("right");
        if (!/(^|\.)(CELERY_BEAT_SCHEDULE|beat_schedule)$/.test(left) || right?.type !== "dictionary") continue;
        for (const pair of right.namedChildren) {
          const entry = pair?.type === "pair" ? pair.childForFieldName("value") : undefined;
          if (entry?.type !== "dictionary") continue;
          const fields = dictionary(entry);
          const task = fields.get("task") && pyString(fields.get("task")!);
          const schedule = fields.get("schedule");
          if (!task || !schedule) continue;
          const def = this.find(this.functions, last(task));
          if (!def) continue;
          const cron = schedule.type === "call" && last(callee(schedule)) === "crontab" ? crontab(schedule) : `every ${schedule.text}s`;
          facts.push({
            id: `job:${def.name}`,
            kind: "job",
            extractor: "django",
            location: { file: def.file.path, symbol: def.name, line: lineOf(def.node) },
            data: { cron, handler: def.name },
          });
        }
      }
    }
    return facts;
  }
}

// ---------------------------------------------------------------------
//  Utilitários de Python
// ---------------------------------------------------------------------

function last(dotted: string): string {
  return dotted.replace(/\(.*$/s, "").split(".").at(-1)!.replace(/^["']|["']$/g, "");
}

function basesOf(def: Node): string[] {
  return (def.childForFieldName("superclasses")?.namedChildren ?? []).filter((b): b is Node => !!b && b.type !== "keyword_argument").map((b) => b.text);
}

function classBody(def: Definition): Node[] {
  return (def.node.childForFieldName("body")?.namedChildren ?? []).filter((n): n is Node => !!n);
}

function methodsOf(def: Definition): string[] {
  return classBody(def).flatMap((n) => {
    const d = unwrap(n).definition;
    const name = d.type === "function_definition" ? d.childForFieldName("name")?.text : undefined;
    return name ? [name] : [];
  });
}

/** `lookup_field = "slug"` no corpo da classe. */
function classAttribute(def: Definition, name: string): string | undefined {
  for (const n of classBody(def)) {
    const a = n.type === "expression_statement" ? n.namedChildren[0] : undefined;
    if (a?.type === "assignment" && a.childForFieldName("left")?.text === name) return pyString(a.childForFieldName("right") ?? undefined);
  }
  return undefined;
}

/** Atributo de `class Meta` dentro do model. */
function metaFlag(def: Definition, name: string): boolean {
  return metaValue(def, name)?.text === "True";
}

function metaString(def: Definition, name: string): string | undefined {
  const v = metaValue(def, name);
  return v ? pyString(v) : undefined;
}

function metaValue(def: Definition, name: string): Node | undefined {
  const meta = classBody(def).find((n) => n.type === "class_definition" && n.childForFieldName("name")?.text === "Meta");
  for (const n of meta?.childForFieldName("body")?.namedChildren ?? []) {
    const a = n?.type === "expression_statement" ? n.namedChildren[0] : undefined;
    if (a?.type === "assignment" && a.childForFieldName("left")?.text === name) return a.childForFieldName("right") ?? undefined;
  }
  return undefined;
}

function callee(call: Node): string {
  return call.childForFieldName("function")?.text ?? "";
}

function positional(call: Node): Node[] {
  return (call.childForFieldName("arguments")?.namedChildren ?? []).filter((a): a is Node => !!a && a.type !== "keyword_argument" && a.type !== "comment");
}

function kwargs(call: Node): Map<string, Node> {
  const out = new Map<string, Node>();
  for (const a of call.childForFieldName("arguments")?.namedChildren ?? []) {
    if (a?.type !== "keyword_argument") continue;
    const name = a.childForFieldName("name")?.text;
    const value = a.childForFieldName("value");
    if (name && value) out.set(name, value);
  }
  return out;
}

function dictionary(node: Node): Map<string, Node> {
  const out = new Map<string, Node>();
  for (const pair of node.namedChildren) {
    if (pair?.type !== "pair") continue;
    const key = pair.childForFieldName("key");
    const value = pair.childForFieldName("value");
    const k = key && pyString(key);
    if (k && value) out.set(k, value);
  }
  return out;
}

/** Valor de um literal de string sem interpolação. */
export function pyString(node: Node | undefined): string | undefined {
  if (node?.type !== "string" || node.namedChildren.some((c) => c?.type === "interpolation")) return undefined;
  return node.namedChildren.filter((c) => c?.type === "string_content").map((c) => c!.text).join("");
}

function stringList(node: Node | undefined): string[] | undefined {
  if (!node || (node.type !== "list" && node.type !== "tuple")) return undefined;
  return node.namedChildren.flatMap((c) => (c && pyString(c) !== undefined ? [pyString(c)!] : []));
}

function descendants(node: Node, type: string): Node[] {
  return node.descendantsOfType(type).filter((n): n is Node => !!n);
}

/** Listas atribuídas a `urlpatterns` (`=` e `+=`). */
function urlLists(file: SourceFile): Node[][] {
  const lists: Node[][] = [];
  for (const a of [...descendants(file.tree.rootNode, "assignment"), ...descendants(file.tree.rootNode, "augmented_assignment")]) {
    if (a.childForFieldName("left")?.text !== "urlpatterns") continue;
    const right = a.childForFieldName("right");
    if (right?.type === "list") lists.push(right.namedChildren.filter((c): c is Node => !!c));
    else if (right?.type === "attribute" || right?.type === "binary_operator") lists.push(flattenSum(right));
  }
  return lists;
}

/** `[...] + router.urls` */
function flattenSum(node: Node): Node[] {
  if (node.type === "binary_operator") return [...flattenSum(node.childForFieldName("left")!), ...flattenSum(node.childForFieldName("right")!)];
  if (node.type === "list") return node.namedChildren.filter((c): c is Node => !!c);
  return [node];
}

/** Métodos HTTP de uma view de função: `@api_view([...])`, `@require_http_methods([...])`... */
function httpMethodsOf(def: Definition): string[] {
  for (const d of def.decorators) {
    const expr = d.namedChildren[0];
    const name = expr ? last(expr.type === "call" ? callee(expr) : expr.text) : "";
    if (name === "require_GET" || name === "require_safe") return ["GET"];
    if (name === "require_POST") return ["POST"];
    if (expr?.type === "call" && (name === "api_view" || name === "require_http_methods")) {
      const methods = stringList(positional(expr)[0]);
      if (methods) return methods.map((m) => m.toUpperCase());
      if (name === "api_view") return ["GET"];
    }
  }
  return ["ALL"];
}

function joinRoute(prefix: string, route: string): string {
  return [prefix, route].map((p) => p.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
}

/** `^clientes/(?P<pk>[^/.]+)/$` → `clientes/<pk>`, para os casos simples. */
function regexToPath(route: string): string {
  return route.replace(/^\^/, "").replace(/\$$/, "").replace(/\(\?P<(\w+)>[^)]*\)/g, "<$1>");
}

function crontab(call: Node): string {
  const kw = kwargs(call);
  const field = (name: string) => {
    const v = kw.get(name);
    return v ? (pyString(v) ?? v.text) : "*";
  };
  return [field("minute"), field("hour"), field("day_of_month"), field("month_of_year"), field("day_of_week")].join(" ");
}

