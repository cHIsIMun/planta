// Fase 7: emite o modelo intermediário (`modelo.json`, seção 8.4), o contrato
// entre o compilador e renderizadores, visualizador, MCP e plugins.

import type * as A from "./ast.ts";
import type { Derived, ResolvedAnchor } from "./derive.ts";
import type { Links } from "./link.ts";
import type { MergedModel } from "./merge.ts";
import type { SymbolTable } from "./symbols.ts";

export const IR_SCHEMA = "planta.model/1";

const COMMON_KEYS = new Set(["kind", "name", "parent", "docs", "meta", "source", "anchor", "relations"]);

export type IrType =
  | { ref: string; list?: true; optional?: true; unresolved?: true }
  | { map: { key: IrType; value: IrType }; optional?: true };

export interface IrRelation {
  type: string;
  target: string;
  label?: string;
  unresolved?: true;
}

export interface IrElement {
  kind: string;
  name: string;
  parent?: string;
  docs?: string;
  meta: Derived["meta"] extends Map<string, infer M> ? M : never;
  source: A.Loc;
  anchor?: ResolvedAnchor & { inferred: boolean };
  relations: IrRelation[];
  [property: string]: unknown;
}

export interface IrModel {
  schema: typeof IR_SCHEMA;
  system?: { id: string; description?: string; owner?: string; version?: string };
  generatedAt?: string;
  gitCommit?: string;
  elements: Record<string, IrElement>;
  /** Requisitos descobertos em Markdown (`req:REQ-001`); preenchido pelos extratores. */
  requirements: Record<string, unknown>;
}

export interface EmitOptions {
  generatedAt?: string;
  gitCommit?: string;
}

export function emitIr(
  model: MergedModel,
  table: SymbolTable,
  links: Links,
  derived: Derived,
  options: EmitOptions = {},
): IrModel {
  const emitter = new Emitter(table, links, derived);
  for (const decl of model.decls) emitter.topDecl(decl);
  emitter.finish();

  const system = model.decls.find((d): d is A.SystemDecl => d.kind === "system");
  const elements: Record<string, IrElement> = {};
  for (const id of [...emitter.elements.keys()].sort()) elements[id] = emitter.elements.get(id)!;

  return {
    schema: IR_SCHEMA,
    ...(system && {
      system: {
        id: system.name.name,
        ...(system.description !== undefined && { description: system.description }),
        ...(system.owner !== undefined && { owner: system.owner }),
        ...(system.version !== undefined && { version: system.version }),
      },
    }),
    ...(options.generatedAt && { generatedAt: options.generatedAt }),
    ...(options.gitCommit && { gitCommit: options.gitCommit }),
    elements,
    requirements: {},
  };
}

class Emitter {
  readonly elements = new Map<string, IrElement>();
  /**
   * Relações gravadas em outro elemento (`on` na operação, `->` no nó de
   * origem). Rodam depois que todos os elementos existem, porque o alvo pode
   * ser declarado mais adiante ou em outro arquivo.
   */
  private readonly deferred: (() => void)[] = [];

  constructor(
    private readonly table: SymbolTable,
    private readonly links: Links,
    private readonly derived: Derived,
  ) {}

  /**
   * Registra o elemento com os campos comuns. Devolve `undefined` para a
   * segunda declaração de um ID duplicado (PL102), que fica fora do IR.
   */
  private element(
    id: string,
    decl: { kind: string; name: A.Ident; meta: A.Meta; loc: A.Loc },
    props: Record<string, unknown> = {},
    parent = this.table.symbols.get(id)?.parent,
  ): IrElement | undefined {
    if (this.table.symbols.get(id)?.decl !== decl) return undefined;
    for (const key of Object.keys(props)) {
      if (COMMON_KEYS.has(key)) throw new Error(`propriedade \`${key}\` de ${decl.kind} colide com campo comum do IR`);
    }
    const anchor = this.derived.anchors.get(id);
    const layer = this.derived.layers.get(id);
    const element: IrElement = {
      kind: decl.kind,
      name: decl.name.name,
      ...(parent && { parent }),
      ...(decl.meta.docs && { docs: decl.meta.docs }),
      meta: this.derived.meta.get(id)!,
      source: decl.loc,
      ...(anchor && { anchor: { ...anchor, inferred: false as const } }),
      ...props,
      relations: layer ? [{ type: "inLayer", target: layer }] : [],
    };
    this.elements.set(id, element);
    return element;
  }

  finish(): void {
    for (const run of this.deferred) run();
  }

  private addTo(ref: A.Ref, ...relations: IrRelation[]): void {
    this.deferred.push(() => {
      const { id, unresolved } = this.id(ref);
      if (!unresolved) this.elements.get(id)?.relations.push(...relations);
    });
  }

  // -------------------------------------------------------------------
  //  Referências
  // -------------------------------------------------------------------

  private id(ref: A.Ref): { id: string; unresolved?: true } {
    const resolved = this.links.get(ref);
    if (resolved?.kind === "element") return { id: resolved.id };
    if (resolved?.kind === "primitive") return { id: resolved.name };
    return { id: ref.name, unresolved: true };
  }

  private relation(type: string, ref: A.Ref, label?: string): IrRelation {
    const { id, unresolved } = this.id(ref);
    return { type, target: id, ...(label !== undefined && { label }), ...(unresolved && { unresolved }) };
  }

  private relations(type: string, refs: A.Ref[]): IrRelation[] {
    return refs.map((r) => this.relation(type, r));
  }

  private trace(clauses: A.TraceClause[]): IrRelation[] {
    return clauses.flatMap((c) =>
      c.refs.map((r) =>
        r.kind === "ref"
          ? this.relation(c.relation, r.ref)
          : { type: c.relation, target: `${c.relation === "justifiedBy" ? "req" : "adr"}:${r.id}` },
      ),
    );
  }

  private type(type: A.TypeRef): IrType;
  private type(type: A.TypeRef | undefined): IrType | undefined;
  private type(type: A.TypeRef | undefined): IrType | undefined {
    if (!type) return undefined;
    if (type.kind === "map") {
      return { map: { key: this.type(type.key), value: this.type(type.value) }, ...(type.optional && { optional: true }) };
    }
    const { id, unresolved } = this.id(type.ref);
    return {
      ref: id,
      ...(type.list && { list: true }),
      ...(type.optional && { optional: true }),
      ...(unresolved && { unresolved }),
    };
  }

  private fields(owner: string, fields: A.FieldDecl[] | undefined) {
    return fields?.map((f) => {
      const id = `${owner}.${f.name.name}`;
      const meta = this.derived.meta.get(id);
      const anchor = this.derived.anchors.get(id);
      return {
        id,
        name: f.name.name,
        type: this.type(f.type),
        modifiers: Object.fromEntries(f.modifiers.map((m) => [m.name, m.args.map((a) => a.value)])),
        ...(f.meta.docs && { docs: f.meta.docs }),
        // O resto do `meta` de um campo é herdado da entidade; só as tags dizem algo novo.
        ...(meta && meta.tags.length > 0 && { tags: meta.tags }),
        ...(anchor && { anchor }),
      };
    });
  }

  // -------------------------------------------------------------------
  //  Declarações
  // -------------------------------------------------------------------

  topDecl(decl: A.TopDecl): void {
    const id = decl.name.name;
    switch (decl.kind) {
      case "system":
        return;
      case "layer":
        this.element(id, decl, { match: decl.match });
        return;
      case "actor":
        this.element(id, decl, optional({ description: decl.description }));
        return;
      case "external":
        this.element(id, decl, optional({ description: decl.description }));
        for (const op of decl.ops) this.op(`${id}.${op.name.name}`, op);
        return;
      case "requirement":
      case "decision":
        this.element(id, decl, optional({ title: decl.title }));
        return;
      case "context":
        this.element(id, decl, optional({ root: this.derived.roots.get(id) }));
        for (const member of decl.members) this.contextMember(member, id);
        return;
      case "app": {
        const app = this.element(id, decl, {
          appKind: decl.appKind,
          ...optional({ framework: decl.framework, root: this.derived.roots.get(id) }),
          routes: decl.routes.map((r) => ({
            path: r.path,
            target: this.id(r.target).id,
            ...(r.guard && { guard: this.id(r.guard).id }),
          })),
        });
        app?.relations.push(...this.relations("contains", decl.contains));
        for (const comp of decl.components) this.component(`${id}.${comp.name.name}`, comp);
        return;
      }
      case "deployment":
        this.element(id, decl, optional({ provider: decl.provider, region: decl.region, iac: decl.source }));
        this.deployItems(decl.items, id, id);
        return;
      case "rule":
        this.element(id, decl, {
          ...optional({ severity: decl.severity }),
          statements: decl.statements.map((s) => ({
            subject: this.subject(s.subject),
            modality: s.modality,
            predicate: this.predicate(s.predicate),
            ...optional({ exceptVia: s.exceptVia }),
          })),
        });
        return;
      case "view":
        this.element(id, decl, {
          viewKind: decl.viewKind,
          ...optional({ of: decl.of && this.id(decl.of).id, style: decl.style, title: decl.title, layout: decl.layout }),
          include: decl.include.map((s) => this.selector(s)),
          exclude: decl.exclude.map((s) => this.selector(s)),
        });
        return;
    }
  }

  private contextMember(member: A.ContextMember, context: string): void {
    if (member.kind === "handler") {
      // `on E => op` vira `consumes` na operação que trata o evento.
      this.addTo(member.target, this.relation("consumes", member.event), ...this.trace(member.trace));
      return;
    }

    const id = `${context}.${member.name.name}`;
    switch (member.kind) {
      case "entity":
      case "value":
      case "dto": {
        const el = this.element(id, member, optional({ fields: this.fields(id, member.fields) }));
        el?.relations.push(...this.trace(member.trace));
        return;
      }
      case "enum":
        this.element(id, member, { values: member.values.map((v) => v.name) });
        return;
      case "aggregate":
        this.element(id, member, { root: this.id(member.root).id, contains: member.contains.map((r) => this.id(r).id) });
        return;
      case "api":
        this.element(id, member, { protocol: member.protocol, ...optional({ base: member.base }) });
        for (const endpoint of member.endpoints) this.endpoint(`${id}.${endpoint.name.name}`, endpoint, member);
        return;
      case "channel":
        this.element(id, member, { channelKind: member.channelKind });
        return;
      case "event": {
        const el = this.element(id, member, optional({
          channel: member.via && this.id(member.via).id,
          fields: this.fields(id, member.fields),
        }));
        el?.relations.push(...this.trace(member.trace));
        return;
      }
      case "job": {
        const el = this.element(id, member, { cron: member.cron });
        el?.relations.push(this.relation("handledBy", member.target), ...this.trace(member.trace));
        return;
      }
      case "process":
        this.process(id, member);
        return;
      default:
        this.component(id, member);
    }
  }

  private component(id: string, comp: A.ComponentDecl): void {
    const el = this.element(id, comp);
    el?.relations.push(
      ...this.relations("uses", comp.uses),
      ...this.relations("calls", comp.calls),
      ...this.relations("renders", comp.renders),
      ...this.relations("implements", comp.implements),
      ...this.trace(comp.trace),
    );
    for (const op of comp.ops) this.op(`${id}.${op.name.name}`, op);
  }

  private op(id: string, op: A.OpDecl): void {
    const el = this.element(id, op, {
      params: op.params.map((p) => ({ name: p.name.name, type: this.type(p.type) })),
      ...optional({ returns: this.type(op.returns) }),
    });
    el?.relations.push(...this.trace(op.trace));
  }

  private endpoint(id: string, e: A.EndpointDecl, api: A.ApiDecl): void {
    const route = api.protocol === "http" || api.protocol === "websocket"
      ? { path: joinPath(api.base, e.path) }
      : { operation: e.path };
    const el = this.element(id, e, {
      protocol: api.protocol,
      method: e.method,
      ...route,
      ...optional({ body: this.type(e.body) }),
      params: e.params.map((p) => ({ name: p.name.name, type: this.type(p.type), ...optional({ in: p.in }) })),
      responses: e.responses.map((r) => ({ status: r.status, ...optional({ type: this.type(r.type) }) })),
      ...optional({
        auth: e.auth && { scheme: e.auth.scheme, roles: e.auth.roles },
        rateLimit: e.rateLimit,
      }),
    });
    el?.relations.push(this.relation("handledBy", e.handler), ...this.trace(e.trace));
  }

  // -------------------------------------------------------------------
  //  Processos
  // -------------------------------------------------------------------

  private process(id: string, proc: A.ProcessDecl): void {
    const relations: IrRelation[] = [];
    const actors: string[] = [];
    let verify: string | undefined;

    const flow = (body: A.ProcessStmt[]): unknown[] =>
      body.flatMap((s): unknown[] => {
        switch (s.kind) {
          case "trace":
            relations.push(...this.trace([s.trace]));
            return [];
          case "trigger":
            relations.push(this.relation("triggeredBy", s.target));
            return [];
          case "actor":
            actors.push(this.id(s.actor).id);
            return [];
          case "verify":
            verify = s.level;
            return [];
          case "step": {
            const t = s.target;
            const target =
              t.kind === "op" ? { target: this.id(t.ref).id }
              : t.kind === "emit" ? { emit: this.id(t.event).id }
              : { manual: t.description };
            return [{ op: "step", name: s.name.name, ...target }];
          }
          case "emit":
            return [{ op: "emit", event: this.id(s.event).id }];
          case "if":
            return [{ op: "if", condition: s.condition, then: flow(s.then), else: flow(s.else ?? []) }];
          case "parallel":
            return [{ op: "parallel", body: flow(s.body) }];
          case "foreach":
            return [{ op: "foreach", description: s.description, body: flow(s.body) }];
          case "wait":
            return [{ op: "wait", event: this.id(s.event).id, ...optional({ timeout: s.timeout }) }];
          case "fail":
            return [{ op: "fail", ...optional({ status: s.status, message: s.message }) }];
          case "return":
            return [{ op: "return", ...optional({ type: this.type(s.type) }) }];
        }
      });

    const steps = flow(proc.body);
    const el = this.element(id, proc, {
      ...(actors.length > 0 && { actors }),
      ...optional({ verify }),
      flow: steps,
    });
    el?.relations.push(...relations);
  }

  // -------------------------------------------------------------------
  //  Deployment, regras e views
  // -------------------------------------------------------------------

  /** O ID do nó é curto (`producao.api`), mas `parent` aponta o grupo que o contém. */
  private deployItems(items: A.DeployItem[], deployment: string, parent: string): void {
    for (const item of items) {
      if (item.kind === "connection") {
        const [first, ...rest] = item.path;
        let from = first!;
        for (const to of rest) {
          this.addTo(from, this.relation("connectsTo", to, item.label));
          from = to;
        }
        continue;
      }

      const id = `${deployment}.${item.name.name}`;
      if (item.kind === "group") {
        this.element(id, item, { groupKind: item.groupKind, ...optional({ resourceType: item.resourceType }) }, parent);
        this.deployItems(item.items, deployment, id);
        continue;
      }

      const el = this.element(id, item, {
        resourceType: item.resourceType,
        ...optional({ replicas: item.replicas }),
        ...(item.props.length > 0 && { props: Object.fromEntries(item.props.map((p) => [p.name, p.value.value])) }),
      }, parent);
      el?.relations.push(
        ...(item.runs ? [this.relation("runs", item.runs)] : []),
        ...this.relations("stores", item.stores),
        ...this.relations("carries", item.carries),
      );
    }
  }

  private subject(s: A.Subject): unknown {
    if (s.kind === "element") return { elementKind: s.elementKind, element: this.id(s.ref).id };
    return {
      every: s.elementKind,
      ...(s.where && { where: { attribute: s.where.attribute, value: s.where.value.value } }),
    };
  }

  private predicate(p: A.Predicate): unknown {
    switch (p.kind) {
      case "depend": return { dependOn: this.subject(p.on) };
      case "have": return { have: p.property };
      case "match": return { match: p.pattern };
      case "inLayer": return { inLayer: this.id(p.layer).id };
    }
  }

  private selector(s: A.ViewSelector): unknown {
    switch (s.kind) {
      case "all": return "*";
      case "every": return { every: s.elementKind };
      case "ref": return { element: this.id(s.ref).id, ...(s.children && { children: true }) };
    }
  }
}

function joinPath(base: string | undefined, path: string): string {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`.replace(/\/$/, "") || "/";
}

/** Remove as chaves com valor `undefined`, para o JSON não carregar campos vazios. */
function optional<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
