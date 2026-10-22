// Fase 5: resolve cada referência da AST (seção 6.2) e confere se o elemento
// encontrado é de um tipo aceito naquela posição (seção 8.2).

import { COMPONENT_KINDS, type Ref } from "./ast.ts";
import type * as A from "./ast.ts";
import { error, type Diagnostic } from "./diagnostics.ts";
import type { MergedModel } from "./merge.ts";
import type { ElementSymbol, SymbolTable } from "./symbols.ts";

export const PRIMITIVES = new Set([
  "string", "text", "int", "long", "decimal", "float", "bool", "uuid", "date",
  "time", "datetime", "duration", "json", "bytes", "email", "url", "void",
]);

export type Resolution = { kind: "element"; id: string } | { kind: "primitive"; name: string };

/** Resolução de cada `Ref` da AST, indexada pelo próprio objeto. */
export type Links = Map<Ref, Resolution>;

type Kind = ElementSymbol["kind"];

/** Tipos aceitos por posição (tabela 8.2). `"*"` aceita qualquer elemento. */
const ACCEPT = {
  uses: [...COMPONENT_KINDS, "external", "channel"],
  calls: ["endpoint"],
  renders: ["component", "page"],
  implements: [...COMPONENT_KINDS],
  operation: ["op"],
  event: ["event"],
  trigger: ["endpoint", "event", "job", "actor"],
  actor: ["actor"],
  type: ["entity", "value", "dto", "enum", "event"],
  channel: ["channel"],
  layer: ["layer"],
  route: ["page", "component"],
  guard: ["guard"],
  app: ["app"],
  stores: ["context", "entity"],
  aggregate: ["entity", "value"],
  aggregateRoot: ["entity"],
  trace: { justifiedBy: ["requirement"], decidedBy: ["decision"] },
  deployItem: ["node", "group"],
  any: "*",
} as const satisfies Record<string, readonly Kind[] | "*" | Record<string, readonly Kind[]>>;

type Accept = readonly Kind[] | "*";

export function link(model: MergedModel, table: SymbolTable): { links: Links; diagnostics: Diagnostic[] } {
  const linker = new Linker(model, table);
  linker.run();
  return { links: linker.links, diagnostics: linker.diagnostics };
}

class Linker {
  readonly links: Links = new Map();
  readonly diagnostics: Diagnostic[] = [];
  /** Atalhos de `use` por arquivo: alias → ID canônico. */
  private readonly uses = new Map<string, Map<string, string>>();

  constructor(
    private readonly model: MergedModel,
    private readonly table: SymbolTable,
  ) {}

  run(): void {
    for (const file of this.model.files) {
      const aliases = new Map<string, string>();
      for (const use of file.uses) {
        // `use` sempre recebe o nome completo, a partir do nível superior.
        if (!this.table.symbols.has(use.target.name)) {
          this.diagnostics.push(error("PL110", `\`use ${use.target.name}\`: elemento não existe`, use.target.loc));
          continue;
        }
        this.links.set(use.target, { kind: "element", id: use.target.name });
        aliases.set(use.alias?.name ?? use.target.name.split(".").at(-1)!, use.target.name);
      }
      this.uses.set(file.path, aliases);
    }
    for (const decl of this.model.decls) this.topDecl(decl);
  }

  // -------------------------------------------------------------------
  //  Resolução
  // -------------------------------------------------------------------

  /**
   * Procura `ref` do escopo mais interno para o mais externo, depois nos
   * `use` do arquivo e por fim no nível superior. Vence o primeiro candidato
   * de tipo aceito; candidatos de outro tipo não sombreiam, para que
   * `actor Cliente` num processo encontre o ator mesmo com uma entidade
   * `Cliente` no contexto.
   */
  private resolve(ref: Ref | undefined, scopes: string[], accept: Accept): void {
    if (!ref) return;
    const candidates: ElementSymbol[] = [];
    for (const id of this.candidateIds(ref, scopes)) {
      const symbol = this.table.symbols.get(id);
      if (!symbol || candidates.includes(symbol)) continue;
      if (accept === "*" || accept.includes(symbol.kind)) {
        this.links.set(ref, { kind: "element", id });
        return;
      }
      candidates.push(symbol);
    }

    const nearest = candidates[0];
    if (nearest) {
      this.diagnostics.push(error(
        "PL111",
        `\`${ref.name}\` é ${nearest.kind} (\`${nearest.id}\`), mas aqui se espera ${describe(accept)}`,
        ref.loc,
        [nearest.decl.name.loc],
      ));
    } else {
      this.diagnostics.push({ ...error("PL110", `referência \`${ref.name}\` não resolvida`, ref.loc), data: { name: ref.name, expects: describe(accept) } });
    }
  }

  private *candidateIds(ref: Ref, scopes: string[]): Generator<string> {
    for (const scope of scopes) yield `${scope}.${ref.name}`;
    const [head, ...rest] = ref.name.split(".");
    const alias = this.uses.get(ref.loc.file)?.get(head!);
    if (alias) yield [alias, ...rest].join(".");
    yield ref.name;
  }

  private type(type: A.TypeRef | undefined, scopes: string[]): void {
    if (!type) return;
    if (type.kind === "map") {
      this.type(type.key, scopes);
      this.type(type.value, scopes);
    } else if (PRIMITIVES.has(type.ref.name)) {
      this.links.set(type.ref, { kind: "primitive", name: type.ref.name });
    } else {
      this.resolve(type.ref, scopes, ACCEPT.type);
    }
  }

  private trace(clauses: A.TraceClause[], scopes: string[]): void {
    for (const clause of clauses) {
      for (const ref of clause.refs) {
        // IDs em string ("REQ-001") vêm dos extratores de Markdown e são
        // conferidos na validação (PL601), não aqui.
        if (ref.kind === "ref") this.resolve(ref.ref, scopes, ACCEPT.trace[clause.relation]);
      }
    }
  }

  private all(refs: Ref[], scopes: string[], accept: Accept): void {
    for (const ref of refs) this.resolve(ref, scopes, accept);
  }

  // -------------------------------------------------------------------
  //  Percurso
  // -------------------------------------------------------------------

  private topDecl(decl: A.TopDecl): void {
    const id = decl.name.name;
    switch (decl.kind) {
      case "external":
        for (const op of decl.ops) this.op(op, [`${id}.${op.name.name}`, id]);
        return;
      case "context":
        for (const member of decl.members) this.contextMember(member, id);
        return;
      case "app":
        this.all(decl.contains, [id], ACCEPT.any);
        for (const route of decl.routes) {
          this.resolve(route.target, [id], ACCEPT.route);
          this.resolve(route.guard, [id], ACCEPT.guard);
        }
        for (const comp of decl.components) this.component(comp, [id]);
        return;
      case "deployment":
        this.deployItems(decl.items, [id]);
        return;
      case "rule":
        for (const stmt of decl.statements) {
          this.subject(stmt.subject);
          if (stmt.predicate.kind === "depend") this.subject(stmt.predicate.on);
          if (stmt.predicate.kind === "inLayer") this.resolve(stmt.predicate.layer, [], ACCEPT.layer);
        }
        return;
      case "view":
        this.resolve(decl.of, [], ACCEPT.any);
        for (const sel of [...decl.include, ...decl.exclude]) {
          if (sel.kind === "ref") this.resolve(sel.ref, [], ACCEPT.any);
        }
        return;
    }
  }

  private subject(subject: A.Subject): void {
    if (subject.kind === "element") this.resolve(subject.ref, [], [subject.elementKind as Kind]);
  }

  private contextMember(member: A.ContextMember, context: string): void {
    const scopes = "name" in member ? [`${context}.${member.name.name}`, context] : [context];
    switch (member.kind) {
      case "entity":
      case "value":
      case "dto":
      case "event":
        if (member.kind === "event") this.resolve(member.via, scopes, ACCEPT.channel);
        for (const field of member.fields ?? []) this.type(field.type, scopes);
        this.trace(member.trace, scopes);
        return;
      case "enum":
      case "channel":
        return;
      case "aggregate":
        this.resolve(member.root, scopes, ACCEPT.aggregateRoot);
        this.all(member.contains, scopes, ACCEPT.aggregate);
        return;
      case "api":
        for (const endpoint of member.endpoints) this.endpoint(endpoint, scopes);
        return;
      case "handler":
        this.resolve(member.event, scopes, ACCEPT.event);
        this.resolve(member.target, scopes, ACCEPT.operation);
        this.trace(member.trace, scopes);
        return;
      case "job":
        this.resolve(member.target, scopes, ACCEPT.operation);
        this.trace(member.trace, scopes);
        return;
      case "process":
        this.process(member.body, scopes);
        return;
      default:
        this.component(member, [context]);
    }
  }

  private component(comp: A.ComponentDecl, parentScopes: string[]): void {
    const scopes = [`${parentScopes[0]}.${comp.name.name}`, ...parentScopes];
    this.resolve(comp.layer, scopes, ACCEPT.layer);
    this.all(comp.uses, scopes, ACCEPT.uses);
    this.all(comp.calls, scopes, ACCEPT.calls);
    this.all(comp.renders, scopes, ACCEPT.renders);
    this.all(comp.implements, scopes, ACCEPT.implements);
    this.trace(comp.trace, scopes);
    for (const op of comp.ops) this.op(op, [`${scopes[0]}.${op.name.name}`, ...scopes]);
  }

  private op(op: A.OpDecl, scopes: string[]): void {
    for (const param of op.params) this.type(param.type, scopes);
    this.type(op.returns, scopes);
    this.trace(op.trace, scopes);
  }

  private endpoint(endpoint: A.EndpointDecl, scopes: string[]): void {
    this.resolve(endpoint.handler, scopes, ACCEPT.operation);
    this.type(endpoint.body, scopes);
    for (const param of endpoint.params) this.type(param.type, scopes);
    for (const response of endpoint.responses) this.type(response.type, scopes);
    this.trace(endpoint.trace, scopes);
  }

  private process(body: A.ProcessStmt[], scopes: string[]): void {
    for (const stmt of body) {
      switch (stmt.kind) {
        case "trace":
          this.trace([stmt.trace], scopes);
          break;
        case "trigger":
          this.resolve(stmt.target, scopes, ACCEPT.trigger);
          break;
        case "actor":
          this.resolve(stmt.actor, scopes, ACCEPT.actor);
          break;
        case "step":
          if (stmt.target.kind === "op") this.resolve(stmt.target.ref, scopes, ACCEPT.operation);
          if (stmt.target.kind === "emit") this.resolve(stmt.target.event, scopes, ACCEPT.event);
          break;
        case "emit":
        case "wait":
          this.resolve(stmt.event, scopes, ACCEPT.event);
          break;
        case "return":
          this.type(stmt.type, scopes);
          break;
        case "if":
          this.process(stmt.then, scopes);
          this.process(stmt.else ?? [], scopes);
          break;
        case "parallel":
        case "foreach":
          this.process(stmt.body, scopes);
          break;
      }
    }
  }

  private deployItems(items: A.DeployItem[], scopes: string[]): void {
    for (const item of items) {
      switch (item.kind) {
        case "connection":
          this.all(item.path, scopes, ACCEPT.deployItem);
          break;
        case "group":
          this.deployItems(item.items, scopes);
          break;
        case "node":
          this.resolve(item.runs, scopes, ACCEPT.app);
          this.all(item.stores, scopes, ACCEPT.stores);
          this.all(item.carries, scopes, ACCEPT.channel);
          break;
      }
    }
  }
}

function describe(accept: Accept): string {
  return accept === "*" ? "qualquer elemento" : accept.join(" ou ");
}
