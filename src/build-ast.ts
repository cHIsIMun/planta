// Fase 2: árvore do ANTLR → AST tipada. Só traduz a estrutura; não resolve nomes.

import type { ParserRuleContext, TerminalNode } from "antlr4ng";
import type * as A from "./ast.ts";
import * as P from "./generated/PlantaParser.js";

export function buildAst(tree: P.FileContext, path: string): A.FileAst {
  return new AstBuilder(path).file(tree);
}

function unquote(token: TerminalNode): string {
  return token.getText().slice(1, -1).replace(/\\(.)/g, (_, c: string) =>
    c === "n" ? "\n" : c === "t" ? "\t" : c,
  );
}

class AstBuilder {
  constructor(private readonly path: string) {}

  private loc(ctx: ParserRuleContext): A.Loc {
    return { file: this.path, line: ctx.start!.line, column: ctx.start!.column + 1 };
  }

  private ident(ctx: P.NameContext): A.Ident {
    return { name: ctx.getText(), loc: this.loc(ctx) };
  }

  private ref(ctx: P.QualifiedNameContext): A.Ref {
    return { name: ctx.getText(), loc: this.loc(ctx) };
  }

  private refs(ctx: P.QualifiedNameListContext | null): A.Ref[] {
    return ctx ? ctx.qualifiedName().map((q) => this.ref(q)) : [];
  }

  private anchor(ctx: P.AnchorContext | null): A.Anchor | undefined {
    return ctx ? { raw: unquote(ctx.STRING()), loc: this.loc(ctx) } : undefined;
  }

  private optString(token: TerminalNode | null): string | undefined {
    return token ? unquote(token) : undefined;
  }

  // -------------------------------------------------------------------
  //  Arquivo e metadados
  // -------------------------------------------------------------------

  file(ctx: P.FileContext): A.FileAst {
    return {
      path: this.path,
      uses: ctx.useDecl().map((u) => {
        const alias = u.name();
        return {
          target: this.ref(u.qualifiedName()),
          ...(alias && { alias: this.ident(alias) }),
          loc: this.loc(u),
        };
      }),
      decls: ctx.topDecl().map((d) => this.topDecl(d)),
    };
  }

  private meta(ctx: P.MetaContext): A.Meta {
    const docs = ctx.DOC_COMMENT().map((t) => t.getText().replace(/^\/\/\/ ?/, ""));
    return {
      ...(docs.length > 0 && { docs: docs.join("\n") }),
      annotations: ctx
        .annotation()
        .flatMap((a) => a.annotationItem())
        .map((item) => this.annotationItem(item)),
    };
  }

  private annotationItem(ctx: P.AnnotationItemContext | P.FieldModifierContext): A.Annotation {
    return {
      name: ctx.name().getText(),
      args: ctx.literalList()?.literal().map((l) => this.literal(l)) ?? [],
      loc: this.loc(ctx),
    };
  }

  private literal(ctx: P.LiteralContext): A.Literal {
    const str = ctx.STRING();
    if (str) return { kind: "string", value: unquote(str) };
    const num = ctx.NUMBER();
    if (num) return { kind: "number", value: Number(num.getText()) };
    const bool = ctx.BOOL();
    if (bool) return { kind: "bool", value: bool.getText() === "true" };
    return { kind: "name", value: ctx.name()!.getText() };
  }

  private typeRef(ctx: P.TypeRefContext): A.TypeRef {
    const optional = ctx.getText().endsWith("?");
    if (ctx.MAP()) {
      const [key, value] = ctx.typeRef();
      return { kind: "map", key: this.typeRef(key!), value: this.typeRef(value!), optional, loc: this.loc(ctx) };
    }
    return {
      kind: "named",
      ref: this.ref(ctx.qualifiedName()!),
      list: ctx.getText().replace(/\?$/, "").endsWith("[]"),
      optional,
      loc: this.loc(ctx),
    };
  }

  private trace(ctx: P.TraceClauseContext): A.TraceClause {
    return {
      relation: ctx.JUSTIFIED_BY() ? "justifiedBy" : "decidedBy",
      refs: ctx.traceRef().map((r): A.TraceRef => {
        const str = r.STRING();
        return str
          ? { kind: "id", id: unquote(str), loc: this.loc(r) }
          : { kind: "ref", ref: this.ref(r.qualifiedName()!), loc: this.loc(r) };
      }),
      loc: this.loc(ctx),
    };
  }

  // -------------------------------------------------------------------
  //  Nível superior
  // -------------------------------------------------------------------

  private topDecl(ctx: P.TopDeclContext): A.TopDecl {
    const meta = this.meta(ctx.meta());
    const system = ctx.systemDecl();
    if (system) return this.system(system, meta);
    const layer = ctx.layerDecl();
    if (layer) return this.layer(layer, meta);
    const actor = ctx.actorDecl();
    if (actor) return this.actor(actor, meta);
    const external = ctx.externalDecl();
    if (external) return this.external(external, meta);
    const context = ctx.contextDecl();
    if (context) return this.context(context, meta);
    const app = ctx.appDecl();
    if (app) return this.app(app, meta);
    const req = ctx.requirementDecl();
    if (req) return this.traceTarget("requirement", req, meta);
    const decision = ctx.decisionDecl();
    if (decision) return this.traceTarget("decision", decision, meta);
    const deployment = ctx.deploymentDecl();
    if (deployment) return this.deployment(deployment, meta);
    const rule = ctx.ruleDecl();
    if (rule) return this.rule(rule, meta);
    const view = ctx.viewDecl();
    if (view) return this.view(view, meta);
    throw new Error(`declaração de nível superior desconhecida: ${ctx.getText()}`);
  }

  private system(ctx: P.SystemDeclContext, meta: A.Meta): A.SystemDecl {
    const decl: A.SystemDecl = { kind: "system", name: this.ident(ctx.name()), meta, loc: this.loc(ctx) };
    for (const item of ctx.systemItem()) {
      const value = unquote(item.STRING());
      if (item.DESCRIPTION()) decl.description = value;
      else if (item.OWNER()) decl.owner = value;
      else decl.version = value;
    }
    return decl;
  }

  private layer(ctx: P.LayerDeclContext, meta: A.Meta): A.LayerDecl {
    return {
      kind: "layer",
      name: this.ident(ctx.name()),
      meta,
      match: ctx.STRING().map(unquote),
      loc: this.loc(ctx),
    };
  }

  private actor(ctx: P.ActorDeclContext, meta: A.Meta): A.ActorDecl {
    const description = this.optString(ctx.STRING());
    return { kind: "actor", name: this.ident(ctx.name()), meta, ...(description && { description }), loc: this.loc(ctx) };
  }

  private external(ctx: P.ExternalDeclContext, meta: A.Meta): A.ExternalDecl {
    const description = this.optString(ctx.STRING());
    const metas = ctx.meta();
    return {
      kind: "external",
      name: this.ident(ctx.name()),
      meta,
      ...(description && { description }),
      ops: ctx.opDecl().map((op, i) => this.op(op, this.meta(metas[i]!))),
      loc: this.loc(ctx),
    };
  }

  private traceTarget<K extends "requirement" | "decision">(
    kind: K,
    ctx: P.RequirementDeclContext | P.DecisionDeclContext,
    meta: A.Meta,
  ): A.RequirementDecl | A.DecisionDecl {
    const title = this.optString(ctx.STRING());
    return {
      kind,
      name: this.ident(ctx.name()),
      meta,
      anchor: this.anchor(ctx.anchor())!,
      ...(title && { title }),
      loc: this.loc(ctx),
    };
  }

  // -------------------------------------------------------------------
  //  Contextos
  // -------------------------------------------------------------------

  private context(ctx: P.ContextDeclContext, meta: A.Meta): A.ContextDecl {
    const root = ctx.rootClause();
    return {
      kind: "context",
      name: this.ident(ctx.name()),
      meta,
      ...(root && { root: unquote(root.STRING()) }),
      members: ctx.contextMember().map((m) => this.contextMember(m)),
      loc: this.loc(ctx),
    };
  }

  private contextMember(ctx: P.ContextMemberContext): A.ContextMember {
    const meta = this.meta(ctx.meta());
    const data = ctx.entityDecl() ?? ctx.valueDecl() ?? ctx.dtoDecl();
    if (data) return this.data(data, meta);

    const e = ctx.enumDecl();
    if (e) {
      return {
        kind: "enum",
        name: this.ident(e.name(0)!),
        meta,
        ...optional("anchor", this.anchor(e.anchor())),
        values: e.name().slice(1).map((n) => this.ident(n)),
        loc: this.loc(e),
      };
    }

    const agg = ctx.aggregateDecl();
    if (agg) {
      return {
        kind: "aggregate",
        name: this.ident(agg.name()),
        meta,
        root: this.ref(agg.qualifiedName()),
        contains: agg.qualifiedNameList().flatMap((l) => this.refs(l)),
        loc: this.loc(agg),
      };
    }

    const comp = ctx.componentDecl();
    if (comp) return this.component(comp, meta);

    const api = ctx.apiDecl();
    if (api) return this.api(api, meta);

    const ch = ctx.channelDecl();
    if (ch) {
      return {
        kind: "channel",
        name: this.ident(ch.name(0)!),
        meta,
        channelKind: ch.name(1)!.getText(),
        ...optional("anchor", this.anchor(ch.anchor())),
        loc: this.loc(ch),
      };
    }

    const ev = ctx.eventDecl();
    if (ev) {
      const via = ev.qualifiedName();
      const block = ev.fieldBlock();
      return {
        kind: "event",
        name: this.ident(ev.name()),
        meta,
        ...(via && { via: this.ref(via) }),
        ...optional("anchor", this.anchor(ev.anchor())),
        ...(block && { fields: this.fields(block) }),
        trace: block ? this.blockTrace(block) : [],
        loc: this.loc(ev),
      };
    }

    const on = ctx.handlerDecl();
    if (on) {
      const [event, target] = on.qualifiedName();
      return {
        kind: "handler",
        meta,
        event: this.ref(event!),
        target: this.ref(target!),
        trace: on.traceClause().map((t) => this.trace(t)),
        loc: this.loc(on),
      };
    }

    const job = ctx.jobDecl();
    if (job) {
      return {
        kind: "job",
        name: this.ident(job.name()),
        meta,
        cron: unquote(job.STRING()),
        target: this.ref(job.qualifiedName()),
        trace: job.traceClause().map((t) => this.trace(t)),
        loc: this.loc(job),
      };
    }

    const proc = ctx.processDecl()!;
    return {
      kind: "process",
      name: this.ident(proc.name()),
      meta,
      body: this.processBlock(proc.processBlock()),
      loc: this.loc(proc),
    };
  }

  private data(ctx: P.EntityDeclContext | P.ValueDeclContext | P.DtoDeclContext, meta: A.Meta): A.DataDecl {
    const block = ctx.fieldBlock();
    return {
      kind: ctx.start!.text as A.DataDecl["kind"],
      name: this.ident(ctx.name()),
      meta,
      ...optional("anchor", this.anchor(ctx.anchor())),
      ...(block && { fields: this.fields(block) }),
      trace: block ? this.blockTrace(block) : [],
      loc: this.loc(ctx),
    };
  }

  private fields(ctx: P.FieldBlockContext): A.FieldDecl[] {
    return ctx.fieldBlockItem().flatMap((item) => {
      const f = item.fieldDecl();
      if (!f) return [];
      return [{
        kind: "field" as const,
        name: this.ident(f.name()),
        meta: this.meta(item.meta()),
        type: this.typeRef(f.typeRef()),
        modifiers: f.fieldModifier().map((m) => this.annotationItem(m)),
        ...optional("anchor", this.anchor(f.anchor())),
        loc: this.loc(f),
      }];
    });
  }

  /** `justifiedBy`/`decidedBy` soltos dentro de um bloco de campos valem para o elemento. */
  private blockTrace(ctx: P.FieldBlockContext): A.TraceClause[] {
    return ctx.fieldBlockItem().flatMap((item) => {
      const t = item.traceClause();
      return t ? [this.trace(t)] : [];
    });
  }

  private component(ctx: P.ComponentDeclContext, meta: A.Meta): A.ComponentDecl {
    const layer = ctx.layerClause();
    const decl: A.ComponentDecl = {
      kind: ctx.componentKind().getText() as A.ComponentKind,
      name: this.ident(ctx.name()),
      meta,
      ...optional("anchor", this.anchor(ctx.anchor())),
      ...(layer && { layer: this.ref(layer.qualifiedName()) }),
      ops: [],
      uses: [],
      calls: [],
      renders: [],
      implements: [],
      trace: [],
      loc: this.loc(ctx),
    };
    for (const item of ctx.componentBody()?.componentItem() ?? []) {
      const op = item.opDecl();
      const trace = item.traceClause();
      const list = this.refs(item.qualifiedNameList());
      if (op) decl.ops.push(this.op(op, this.meta(item.meta())));
      else if (trace) decl.trace.push(this.trace(trace));
      else if (item.USES()) decl.uses.push(...list);
      else if (item.CALLS()) decl.calls.push(...list);
      else if (item.RENDERS()) decl.renders.push(...list);
      else decl.implements.push(...list);
    }
    return decl;
  }

  private op(ctx: P.OpDeclContext, meta: A.Meta): A.OpDecl {
    const returns = ctx.typeRef();
    return {
      kind: "op",
      name: this.ident(ctx.name()),
      meta,
      params: ctx.paramList()?.param().map((p) => ({
        name: this.ident(p.name()),
        type: this.typeRef(p.typeRef()),
        loc: this.loc(p),
      })) ?? [],
      ...(returns && { returns: this.typeRef(returns) }),
      ...optional("anchor", this.anchor(ctx.anchor())),
      trace: ctx.traceClause().map((t) => this.trace(t)),
      loc: this.loc(ctx),
    };
  }

  private api(ctx: P.ApiDeclContext, meta: A.Meta): A.ApiDecl {
    const base = this.optString(ctx.STRING());
    const metas = ctx.meta();
    return {
      kind: "api",
      name: this.ident(ctx.name()),
      meta,
      protocol: ctx.protocol().getText() as A.ApiDecl["protocol"],
      ...(base !== undefined && { base }),
      endpoints: ctx.endpointDecl().map((e, i) => this.endpoint(e, this.meta(metas[i]!))),
      loc: this.loc(ctx),
    };
  }

  private endpoint(ctx: P.EndpointDeclContext, meta: A.Meta): A.EndpointDecl {
    const handler = this.ref(ctx.qualifiedName());
    const explicit = ctx.name();
    const sig = ctx.operationSig();
    const decl: A.EndpointDecl = {
      kind: "endpoint",
      name: explicit
        ? this.ident(explicit)
        : { name: handler.name.split(".").at(-1)!, loc: handler.loc },
      implicitName: !explicit,
      meta,
      method: sig.getChild(0)!.getText(),
      path: unquote(sig.STRING()),
      handler,
      params: [],
      responses: [],
      trace: [],
      loc: this.loc(ctx),
    };
    for (const item of ctx.endpointBody()?.endpointItem() ?? []) {
      const loc = this.loc(item);
      const trace = item.traceClause();
      if (trace) decl.trace.push(this.trace(trace));
      else if (item.BODY()) decl.body = this.typeRef(item.typeRef()!);
      else if (item.PARAM()) {
        const where = item.paramLocation();
        decl.params.push({
          name: this.ident(item.name(0)!),
          type: this.typeRef(item.typeRef()!),
          ...(where && { in: where.getText() }),
          loc,
        });
      } else if (item.RETURNS()) {
        const type = item.typeRef();
        decl.responses.push({ status: Number(item.NUMBER()!.getText()), ...(type && { type: this.typeRef(type) }), loc });
      } else if (item.AUTH()) {
        const [scheme, ...roles] = item.name().map((n) => n.getText());
        decl.auth = { scheme: scheme!, roles, loc };
      } else decl.rateLimit = unquote(item.STRING()!);
    }
    return decl;
  }

  // -------------------------------------------------------------------
  //  Processos
  // -------------------------------------------------------------------

  private processBlock(ctx: P.ProcessBlockContext): A.ProcessStmt[] {
    return ctx.processItem().map((item) => this.processStmt(item.processStmt(), this.meta(item.meta())));
  }

  private processStmt(ctx: P.ProcessStmtContext, meta: A.Meta): A.ProcessStmt {
    const loc = this.loc(ctx);
    const base = { meta, loc };
    if (ctx instanceof P.ProcTraceContext) return { ...base, kind: "trace", trace: this.trace(ctx.traceClause()) };
    if (ctx instanceof P.ProcTriggerContext) return { ...base, kind: "trigger", target: this.ref(ctx.qualifiedName()) };
    if (ctx instanceof P.ProcActorContext) return { ...base, kind: "actor", actor: this.ref(ctx.qualifiedName()) };
    if (ctx instanceof P.ProcVerifyContext) return { ...base, kind: "verify", level: ctx.getChild(1)!.getText() };
    if (ctx instanceof P.ProcStepContext) {
      return { ...base, kind: "step", name: this.ident(ctx.name()), target: this.stepTarget(ctx.stepTarget()) };
    }
    if (ctx instanceof P.ProcEmitContext) return { ...base, kind: "emit", event: this.ref(ctx.emitStmt().qualifiedName()) };
    if (ctx instanceof P.ProcIfContext) return { ...base, ...this.ifChain(ctx) };
    if (ctx instanceof P.ProcParallelContext) return { ...base, kind: "parallel", body: this.processBlock(ctx.processBlock()) };
    if (ctx instanceof P.ProcForeachContext) {
      return { ...base, kind: "foreach", description: unquote(ctx.STRING()), body: this.processBlock(ctx.processBlock()) };
    }
    if (ctx instanceof P.ProcWaitContext) {
      const timeout = this.optString(ctx.STRING());
      return { ...base, kind: "wait", event: this.ref(ctx.qualifiedName()), ...(timeout && { timeout }) };
    }
    if (ctx instanceof P.ProcFailContext) {
      const status = ctx.NUMBER();
      const message = this.optString(ctx.STRING());
      return {
        ...base,
        kind: "fail",
        ...(status && { status: Number(status.getText()) }),
        ...(message !== undefined && { message }),
      };
    }
    if (ctx instanceof P.ProcReturnContext) {
      const type = ctx.typeRef();
      return { ...base, kind: "return", ...(type && { type: this.typeRef(type) }) };
    }
    throw new Error(`instrução de processo desconhecida: ${ctx.getText()}`);
  }

  /** `if ... else if ... else` vira `if` com o `else` contendo outro `if`. */
  private ifChain(ctx: P.ProcIfContext | P.IfTailContext): {
    kind: "if"; condition: string; then: A.ProcessStmt[]; else?: A.ProcessStmt[];
  } {
    const [thenBlock, elseBlock] = ctx.processBlock();
    const tail = ctx.ifTail();
    const elseBody = tail
      ? [{ meta: { annotations: [] }, loc: this.loc(tail), ...this.ifChain(tail) }]
      : elseBlock && this.processBlock(elseBlock);
    return {
      kind: "if",
      condition: unquote(ctx.STRING()),
      then: this.processBlock(thenBlock!),
      ...(elseBody && { else: elseBody }),
    };
  }

  private stepTarget(ctx: P.StepTargetContext): A.StepTarget {
    const emit = ctx.emitStmt();
    if (emit) return { kind: "emit", event: this.ref(emit.qualifiedName()) };
    const str = ctx.STRING();
    if (str) return { kind: "manual", description: unquote(str) };
    return { kind: "op", ref: this.ref(ctx.qualifiedName()!) };
  }

  // -------------------------------------------------------------------
  //  Apps
  // -------------------------------------------------------------------

  private app(ctx: P.AppDeclContext, meta: A.Meta): A.AppDecl {
    const names = ctx.name();
    const root = ctx.rootClause();
    const decl: A.AppDecl = {
      kind: "app",
      name: this.ident(names[0]!),
      meta,
      appKind: names[1]!.getText(),
      ...(ctx.FRAMEWORK() && { framework: names[2]!.getText() }),
      ...(root && { root: unquote(root.STRING()) }),
      contains: [],
      routes: [],
      components: [],
      loc: this.loc(ctx),
    };
    for (const item of ctx.appItem()) {
      const itemMeta = this.meta(item.meta());
      const route = item.routeDecl();
      const comp = item.componentDecl();
      if (route) {
        const [target, guard] = route.qualifiedName();
        decl.routes.push({
          meta: itemMeta,
          path: unquote(route.STRING()),
          target: this.ref(target!),
          ...(guard && { guard: this.ref(guard) }),
          loc: this.loc(route),
        });
      } else if (comp) decl.components.push(this.component(comp, itemMeta));
      else decl.contains.push(...this.refs(item.qualifiedNameList()));
    }
    return decl;
  }

  // -------------------------------------------------------------------
  //  Deployment
  // -------------------------------------------------------------------

  private deployment(ctx: P.DeploymentDeclContext, meta: A.Meta): A.DeploymentDecl {
    const names = ctx.name();
    const strings = ctx.STRING().map(unquote);
    let n = 1;
    let s = 0;
    const provider = ctx.PROVIDER() ? names[n++]!.getText() : undefined;
    const region = ctx.REGION() ? strings[s++] : undefined;
    const source = ctx.SOURCE() ? { kind: names[n]!.getText(), path: strings[s]! } : undefined;
    return {
      kind: "deployment",
      name: this.ident(names[0]!),
      meta,
      ...(provider && { provider }),
      ...(region !== undefined && { region }),
      ...(source && { source }),
      items: ctx.deployItem().map((i) => this.deployItem(i)),
      loc: this.loc(ctx),
    };
  }

  private deployItem(ctx: P.DeployItemContext): A.DeployItem {
    const meta = this.meta(ctx.meta());
    const group = ctx.groupDecl();
    if (group) {
      const type = group.resourceType();
      return {
        kind: "group",
        groupKind: group.groupKind().getText() as A.GroupDecl["groupKind"],
        name: this.ident(group.name()),
        meta,
        ...(type && { resourceType: type.getText() }),
        ...optional("anchor", this.anchor(group.anchor())),
        items: group.deployItem().map((i) => this.deployItem(i)),
        loc: this.loc(group),
      };
    }

    const conn = ctx.connection();
    if (conn) {
      const label = this.optString(conn.STRING());
      return {
        kind: "connection",
        meta,
        path: conn.qualifiedName().map((q) => this.ref(q)),
        ...(label !== undefined && { label }),
        loc: this.loc(conn),
      };
    }

    const node = ctx.nodeDecl()!;
    const decl: A.NodeDecl = {
      kind: "node",
      name: this.ident(node.name()),
      meta,
      resourceType: node.resourceType().getText(),
      stores: [],
      carries: [],
      ...optional("anchor", this.anchor(node.anchor())),
      props: node.nodeProp().map((p) => ({ name: p.name().getText(), value: this.literal(p.literal()), loc: this.loc(p) })),
      loc: this.loc(node),
    };
    for (const clause of node.nodeClause()) {
      if (clause.RUNS()) decl.runs = this.ref(clause.qualifiedName()!);
      else if (clause.STORES()) decl.stores.push(...this.refs(clause.qualifiedNameList()));
      else if (clause.CARRIES()) decl.carries.push(...this.refs(clause.qualifiedNameList()));
      else decl.replicas = Number(clause.NUMBER()!.getText());
    }
    return decl;
  }

  // -------------------------------------------------------------------
  //  Regras e views
  // -------------------------------------------------------------------

  private rule(ctx: P.RuleDeclContext, meta: A.Meta): A.RuleDecl {
    const names = ctx.name();
    return {
      kind: "rule",
      name: this.ident(names[0]!),
      meta,
      ...(ctx.SEVERITY() && { severity: names[1]!.getText() }),
      statements: ctx.ruleStmt().map((s) => {
        const pred = s.predicate();
        const mod = s.modality();
        const except = s.exception();
        return {
          subject: this.subject(s.subject()),
          modality: mod.MAY() ? "may" : mod.NOT() ? "mustNot" : "must",
          predicate: this.predicate(pred),
          ...(except && { exceptVia: except.elementKind().getText() }),
          loc: this.loc(s),
        };
      }),
      loc: this.loc(ctx),
    };
  }

  private subject(ctx: P.SubjectContext): A.Subject {
    const elementKind = ctx.elementKind().getText();
    if (!ctx.EVERY()) return { kind: "element", elementKind, ref: this.ref(ctx.qualifiedName()!) };
    const attribute = ctx.name();
    return {
      kind: "every",
      elementKind,
      ...(attribute && { where: { attribute: attribute.getText(), value: this.literal(ctx.literal()!) } }),
    };
  }

  private predicate(ctx: P.PredicateContext): A.Predicate {
    if (ctx.DEPEND()) return { kind: "depend", on: this.subject(ctx.subject()!) };
    if (ctx.HAVE()) return { kind: "have", property: ctx.property()!.getText() };
    if (ctx.MATCH()) return { kind: "match", pattern: unquote(ctx.STRING()!) };
    return { kind: "inLayer", layer: this.ref(ctx.qualifiedName()!) };
  }

  private view(ctx: P.ViewDeclContext, meta: A.Meta): A.ViewDecl {
    const names = ctx.name();
    const of = ctx.qualifiedName();
    const decl: A.ViewDecl = {
      kind: "view",
      name: this.ident(names[0]!),
      meta,
      viewKind: ctx.viewKind().getText(),
      ...(of && { of: this.ref(of) }),
      ...(ctx.STYLE() && { style: names[1]!.getText() }),
      include: [],
      exclude: [],
      loc: this.loc(ctx),
    };
    for (const item of ctx.viewItem()) {
      if (item.TITLE()) decl.title = unquote(item.STRING()!);
      else if (item.LAYOUT()) decl.layout = item.name()!.getText();
      else (item.INCLUDE() ? decl.include : decl.exclude).push(...item.viewSelector().map((v) => this.selector(v)));
    }
    return decl;
  }

  private selector(ctx: P.ViewSelectorContext): A.ViewSelector {
    if (ctx.EVERY()) return { kind: "every", elementKind: ctx.elementKind()!.getText() };
    const ref = ctx.qualifiedName();
    if (!ref) return { kind: "all" };
    return { kind: "ref", ref: this.ref(ref), children: ctx.getText().endsWith(".*") };
  }
}

/** Espalha `{ [key]: value }` só quando o valor existe, para não gravar `undefined` na AST. */
function optional<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}
