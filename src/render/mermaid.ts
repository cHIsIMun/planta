// Renderizador Mermaid (seção 13.1): o padrão, porque GitHub, GitLab e a
// maioria das ferramentas de documentação o exibem nativamente.

import type { FieldFact } from "../facts.ts";
import type { IrElement, IrModel, IrRelation, IrType } from "../ir.ts";
import { container, select, type View } from "./views.ts";

export interface RenderInput {
  ir: IrModel;
  /**
   * Campos extraídos do código para entidades que não declaram campos na
   * planta. Aparecem como "não fixados" (em itálico).
   */
  extractedFields?: Map<string, FieldFact[]>;
}

export class RenderError extends Error {}

export const SUPPORTED = ["class", "er", "sequence", "c4.context", "c4.container", "c4.component", "deployment", "sitemap", "traceability"] as const;

export function renderMermaid(view: View, input: RenderInput): string {
  const body = (() => {
    switch (view.kind) {
      case "class": return classDiagram(view, input);
      case "er": return erDiagram(view, input);
      case "sequence": return sequenceDiagram(view, input.ir);
      case "c4.context": return c4Context(view, input.ir);
      case "c4.container": return c4Container(view, input.ir);
      case "c4.component": return c4Component(view, input.ir);
      case "deployment": return deploymentDiagram(view, input.ir);
      case "sitemap": return sitemap(view, input.ir);
      case "traceability": return traceability(view, input.ir);
      default: throw new RenderError(`view \`${view.name}\`: tipo \`${view.kind}\` ainda não tem renderizador Mermaid`);
    }
  })();
  const title = view.title ? `---\ntitle: ${view.title}\n---\n` : "";
  return `${title}${body.join("\n")}\n`;
}

// ---------------------------------------------------------------------
//  Utilitários
// ---------------------------------------------------------------------

const DATA_KINDS = ["entity", "value", "enum", "dto", "event"] as const;

function el(ir: IrModel, id: string): IrElement {
  const found = ir.elements[id];
  if (!found) throw new RenderError(`elemento \`${id}\` não existe no modelo`);
  return found;
}

function requireOf(view: View, ir: IrModel, kinds: string[]): IrElement {
  if (!view.of) throw new RenderError(`view \`${view.name}\` (${view.kind}) precisa de \`of\``);
  const target = el(ir, view.of);
  if (!kinds.includes(target.kind)) {
    throw new RenderError(`view \`${view.name}\`: \`of ${view.of}\` é ${target.kind}, esperava ${kinds.join(" ou ")}`);
  }
  return target;
}

/** Identificador seguro para Mermaid. */
function safe(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, "_");
}

/** Texto entre aspas para rótulos Mermaid. */
function quote(text: string): string {
  return `"${text.replace(/"/g, "#quot;")}"`;
}

function typeName(ir: IrModel, type: IrType | undefined): string {
  if (!type) return "";
  if ("map" in type) return `Map~${typeName(ir, type.map.key)},${typeName(ir, type.map.value)}~`;
  const base = ir.elements[type.ref]?.name ?? type.ref;
  return `${base}${type.list ? "[]" : ""}${type.optional ? "?" : ""}`;
}

interface Field {
  name: string;
  type?: IrType;
  modifiers: Record<string, unknown[]>;
  /** Extraído do código, não declarado na planta. */
  extracted?: boolean;
}

function fieldsOf(id: string, input: RenderInput): Field[] {
  const e = input.ir.elements[id]!;
  const declared = e.fields as Field[] | undefined;
  if (declared) return declared;
  return (input.extractedFields?.get(id) ?? []).map((f) => ({
    name: f.name,
    type: { ref: resolveExtracted(input.ir, id, f.type), ...(f.list && { list: true as const }), ...(f.optional && { optional: true as const }) },
    modifiers: f.modifiers,
    extracted: true,
  }));
}

/** Tipo extraído (`Pedido`) para o ID do elemento do mesmo contexto, quando existe. */
function resolveExtracted(ir: IrModel, owner: string, type: string): string {
  const ctx = container(ir, owner);
  const candidate = ctx ? `${ctx}.${type}` : type;
  return ir.elements[candidate] ? candidate : type;
}

function refOf(type: IrType | undefined): { ref: string; list: boolean; optional: boolean } | undefined {
  return type && "ref" in type ? { ref: type.ref, list: !!type.list, optional: !!type.optional } : undefined;
}

/**
 * Relação entre dois elementos de dados, uma por par: um campo com
 * `inverse(x)` e o campo `x` do outro lado viram uma aresta só.
 */
interface Association {
  from: string;
  to: string;
  field: string;
  /** Cardinalidade do lado `to`, vista de `from`. */
  many: boolean;
  optional: boolean;
  /** Cardinalidade do lado `from`, quando há inverso. */
  inverseMany?: boolean;
  composition: boolean;
}

function associations(shown: Set<string>, input: RenderInput): Association[] {
  const result: Association[] = [];
  const drawn = new Set<string>();
  for (const id of shown) {
    for (const f of fieldsOf(id, input)) {
      const t = refOf(f.type);
      if (!t || !shown.has(t.ref)) continue;
      const target = input.ir.elements[t.ref]!;
      const inverseName = f.modifiers.inverse?.[0];
      const inverse = typeof inverseName === "string" ? fieldsOf(t.ref, input).find((x) => x.name === inverseName) : undefined;
      const inverseRef = refOf(inverse?.type);
      const pair = [`${id}.${f.name}`, inverse ? `${t.ref}.${inverse.name}` : ""].sort().join("|");
      if (drawn.has(pair)) continue;
      // Com inverso, desenha a partir do lado "um" (o que tem a lista), como na seção 13.3.
      if (inverseRef && !t.list && inverseRef.list) continue;
      drawn.add(pair);
      result.push({
        from: id,
        to: t.ref,
        field: f.name,
        many: t.list,
        optional: t.optional,
        ...(inverseRef && { inverseMany: inverseRef.list }),
        composition: target.kind === "value" || "cascade" in f.modifiers,
      });
    }
  }
  return result;
}

// ---------------------------------------------------------------------
//  Classes e ER
// ---------------------------------------------------------------------

function dataScope(view: View, ir: IrModel): Set<string> {
  if (view.of) requireOf(view, ir, ["context", "app"]);
  return new Set(select(ir, view, DATA_KINDS));
}

function classDiagram(view: View, input: RenderInput): string[] {
  const { ir } = input;
  const shown = dataScope(view, ir);
  const names = labels(ir, shown);
  const lines = ["classDiagram"];
  if (view.layout === "lr") lines.push("  direction LR");

  for (const id of shown) {
    const e = ir.elements[id]!;
    const stereotype = e.kind === "enum" ? "enumeration" : e.kind;
    const header = names.get(id)!;
    lines.push(`  class ${header} {`, `    <<${stereotype}>>`);
    if (e.kind === "enum") for (const v of (e.values as string[]) ?? []) lines.push(`    ${v}`);
    for (const f of fieldsOf(id, input)) {
      const t = refOf(f.type);
      // Relações com elementos do diagrama viram arestas, não atributos.
      if (t && shown.has(t.ref) && ir.elements[t.ref]!.kind !== "enum") continue;
      // `*` no fim deixa o membro em itálico: campo extraído, não fixado na planta.
      lines.push(`    ${typeName(ir, f.type).replace(/[<>]/g, "~")} ${f.name}${f.extracted ? "*" : ""}`);
    }
    lines.push("  }");
  }

  for (const a of associations(shown, input)) {
    const target = ir.elements[a.to]!;
    const from = names.get(a.from)!;
    const to = names.get(a.to)!;
    if (target.kind === "enum") {
      lines.push(`  ${from} --> ${to}`);
      continue;
    }
    const arrow = a.composition ? "*--" : "-->";
    const near = a.inverseMany ? "*" : "1";
    const far = a.many ? "*" : a.optional ? "0..1" : "1";
    const cardinality = target.kind === "value" && !a.many ? ` ${arrow} ` : ` "${near}" ${arrow} "${far}" `;
    lines.push(`  ${from}${cardinality}${to} : ${a.field}`);
  }
  return lines;
}

/** Nome curto quando é único no diagrama; senão, o ID com pontos trocados. */
function labels(ir: IrModel, ids: Iterable<string>): Map<string, string> {
  const list = [...ids];
  const count = new Map<string, number>();
  for (const id of list) count.set(ir.elements[id]!.name, (count.get(ir.elements[id]!.name) ?? 0) + 1);
  return new Map(list.map((id) => [id, count.get(ir.elements[id]!.name)! > 1 ? safe(id) : safe(ir.elements[id]!.name)]));
}

function erDiagram(view: View, input: RenderInput): string[] {
  const { ir } = input;
  const shown = new Set([...dataScope(view, ir)].filter((id) => ir.elements[id]!.kind === "entity"));
  const names = labels(ir, shown);
  const lines = ["erDiagram"];

  for (const id of shown) {
    const attributes = fieldsOf(id, input).filter((f) => {
      const t = refOf(f.type);
      return !(t && shown.has(t.ref));
    });
    lines.push(`  ${names.get(id)} {`);
    for (const f of attributes) {
      const keys = ["key" in f.modifiers && "PK", "unique" in f.modifiers && "UK"].filter(Boolean).join(", ");
      const type = typeName(ir, f.type).replace(/[^A-Za-z0-9_]/g, "") || "unknown";
      lines.push(`    ${type} ${f.name}${keys ? ` ${keys}` : ""}`);
    }
    lines.push("  }");
  }

  for (const a of associations(shown, input)) {
    // Cardinalidade dos dois lados: `||` um, `o|` zero ou um, `o{` zero ou mais.
    const right = a.many ? "o{" : a.optional ? "o|" : "||";
    const left = a.inverseMany === undefined ? (a.many ? "||" : "}o") : a.inverseMany ? "}o" : "||";
    lines.push(`  ${names.get(a.from)} ${left}--${right} ${names.get(a.to)} : ${a.field}`);
  }
  return lines;
}

// ---------------------------------------------------------------------
//  Sequência
// ---------------------------------------------------------------------

type FlowStmt = { op: string; [key: string]: unknown };

function sequenceDiagram(view: View, ir: IrModel): string[] {
  const proc = requireOf(view, ir, ["process"]);
  const seq = new Sequence(ir);
  const trigger = proc.relations.find((r) => r.type === "triggeredBy");
  const actors = (proc.actors as string[] | undefined) ?? [];
  const actor = actors[0] ? seq.actor(actors[0]) : undefined;
  for (const extra of actors.slice(1)) seq.actor(extra);

  let caller = seq.participant(view.of!, proc.name);
  let replyTo: string | undefined;
  let success: string | undefined;

  const target = trigger && !trigger.unresolved ? ir.elements[trigger.target] : undefined;
  if (target?.kind === "endpoint") {
    const api = ir.elements[target.parent!]!;
    caller = seq.participant(target.parent!, api.name);
    const from = actor ?? seq.actor("Usuário", "Usuário");
    seq.message(from, caller, "->>", `${target.method} ${target.path ?? target.operation}`);
    replyTo = from;
    const ok = ((target.responses as { status: number; type?: IrType }[]) ?? []).find((r) => r.status >= 200 && r.status < 300);
    if (ok) success = `${ok.status}${ok.type ? ` ${typeName(ir, ok.type)}` : ""}`;
  } else if (target?.kind === "event") {
    const handler = Object.entries(ir.elements).find(([, e]) => e.relations.some((r) => r.type === "consumes" && r.target === trigger!.target));
    const source = seq.channelOf(trigger!.target);
    if (handler) caller = seq.participant(handler[1].parent!, ir.elements[handler[1].parent!]!.name);
    seq.message(source, caller, "-)", target.name);
  } else if (target?.kind === "job") {
    const handler = target.relations.find((r) => r.type === "handledBy")?.target;
    const clock = seq.participant("$agendador", "Agendador");
    if (handler && ir.elements[handler]) caller = seq.participant(ir.elements[handler]!.parent!, ir.elements[ir.elements[handler]!.parent!]!.name);
    seq.message(clock, caller, "->>", `${target.name} (${target.cron})`);
  } else if (target?.kind === "actor") {
    replyTo = seq.actor(trigger!.target);
    seq.message(replyTo, caller, "->>", proc.name);
  }

  seq.flow((proc.flow as FlowStmt[]) ?? [], caller, replyTo);
  if (success && replyTo) seq.message(caller, replyTo, "-->>", success);
  return ["sequenceDiagram", ...seq.declarations(), ...seq.body];
}

class Sequence {
  readonly body: string[] = [];
  private readonly order: { id: string; line: string }[] = [];
  private indent = 1;

  constructor(private readonly ir: IrModel) {}

  /** Só os participantes que aparecem em alguma mensagem ou nota. */
  declarations(): string[] {
    const used = (id: string) => this.body.some((l) => new RegExp(`(^|[\\s>)-])${id}([-:)]|$)`).test(l.trim()) || l.includes(`over ${id}:`));
    return this.order.filter((p) => used(p.id)).map((p) => p.line);
  }

  private declare(key: string, line: (id: string) => string): string {
    const id = safe(key);
    if (!this.order.some((p) => p.id === id)) this.order.push({ id, line: line(id) });
    return id;
  }

  actor(id: string, label = this.ir.elements[id]?.name ?? id): string {
    return this.declare(id, (s) => `  actor ${s} as ${label}`);
  }

  participant(id: string, label: string): string {
    const external = this.ir.elements[id]?.kind === "external";
    return this.declare(id, (s) => `  participant ${s} as ${external ? `${label} (externo)` : label}`);
  }

  /** Participante que representa o transporte de um evento: o canal, ou o próprio evento. */
  channelOf(event: string): string {
    const channel = this.ir.elements[event]?.channel;
    if (typeof channel === "string" && this.ir.elements[channel]) return this.participant(channel, this.ir.elements[channel]!.name);
    return this.participant(event, this.ir.elements[event]?.name ?? event);
  }

  message(from: string, to: string, arrow: string, text: string): void {
    this.body.push(`${"  ".repeat(this.indent)}${from}${arrow}${to}: ${text}`);
  }

  note(over: string, text: string): void {
    this.body.push(`${"  ".repeat(this.indent)}Note over ${over}: ${text}`);
  }

  private block(open: string, inner: () => void): void {
    this.body.push(`${"  ".repeat(this.indent)}${open}`);
    this.indent++;
    inner();
    this.indent--;
  }

  private line(text: string): void {
    this.body.push(`${"  ".repeat(this.indent)}${text}`);
  }

  flow(stmts: FlowStmt[], caller: string, replyTo: string | undefined): void {
    for (const s of stmts) this.stmt(s, caller, replyTo);
  }

  private stmt(s: FlowStmt, caller: string, replyTo: string | undefined): void {
    switch (s.op) {
      case "step":
        if (typeof s.target === "string") this.call(caller, s.target);
        else if (typeof s.emit === "string") this.message(caller, this.channelOf(s.emit), "-)", this.ir.elements[s.emit]?.name ?? s.emit);
        else this.note(caller, String(s.manual ?? s.name));
        return;
      case "emit":
        this.message(caller, this.channelOf(String(s.event)), "-)", this.ir.elements[String(s.event)]?.name ?? String(s.event));
        return;
      case "if": {
        const then = s.then as FlowStmt[];
        let otherwise = s.else as FlowStmt[];
        this.line(`alt ${s.condition}`);
        this.indent++;
        this.flow(then, caller, replyTo);
        this.indent--;
        // `else if` encadeado vira vários `else` do mesmo `alt`.
        while (otherwise.length === 1 && otherwise[0]!.op === "if") {
          const nested = otherwise[0]!;
          this.line(`else ${nested.condition}`);
          this.indent++;
          this.flow(nested.then as FlowStmt[], caller, replyTo);
          this.indent--;
          otherwise = nested.else as FlowStmt[];
        }
        if (otherwise.length > 0) {
          this.line("else");
          this.indent++;
          this.flow(otherwise, caller, replyTo);
          this.indent--;
        }
        this.line("end");
        return;
      }
      case "parallel": {
        const branches = s.body as FlowStmt[];
        branches.forEach((b, i) => {
          this.line(i === 0 ? "par" : "and");
          this.indent++;
          this.stmt(b, caller, replyTo);
          this.indent--;
        });
        if (branches.length > 0) this.line("end");
        return;
      }
      case "foreach":
        this.block(`loop ${s.description}`, () => this.flow(s.body as FlowStmt[], caller, replyTo));
        this.line("end");
        return;
      case "wait": {
        const event = String(s.event);
        const name = this.ir.elements[event]?.name ?? event;
        this.message(this.channelOf(event), caller, "--)", `${name}${s.timeout ? ` (timeout ${s.timeout})` : ""}`);
        return;
      }
      case "fail": {
        const text = [s.status, s.message].filter((x) => x !== undefined).join(" ") || "falha";
        if (replyTo) this.message(caller, replyTo, "-->>", text);
        else this.note(caller, `falha: ${text}`);
        return;
      }
      case "return":
        // A resposta de sucesso é desenhada no fim, com o status do endpoint.
        return;
    }
  }

  /** Chamada a operação; um gateway que usa um sistema externo aparece como intermediário. */
  private call(caller: string, opId: string): void {
    const op = this.ir.elements[opId];
    if (!op?.parent) {
      this.message(caller, caller, "->>", `${opId}()`);
      return;
    }
    const owner = this.ir.elements[op.parent]!;
    const callee = this.participant(op.parent, owner.name);
    this.message(caller, callee, "->>", `${op.name}()`);
    for (const ext of owner.relations.filter((r) => r.type === "uses" && this.ir.elements[r.target]?.kind === "external")) {
      const external = this.ir.elements[ext.target]!;
      const ops = Object.values(this.ir.elements).filter((e) => e.parent === ext.target && e.kind === "op");
      this.message(callee, this.participant(ext.target, external.name), "->>", ops.length === 1 ? `${ops[0]!.name}()` : "chamada");
    }
  }
}

// ---------------------------------------------------------------------
//  C4
// ---------------------------------------------------------------------

/** O que liga apps, atores e externos, calculado a partir das relações do IR. */
class C4Graph {
  readonly rels = new Map<string, { from: string; to: string; label: string }>();

  constructor(private readonly ir: IrModel) {}

  ids(kind: string): string[] {
    return Object.keys(this.ir.elements).filter((id) => this.ir.elements[id]!.kind === kind).sort();
  }

  /** App que hospeda o elemento: o que o lista em `contains`, senão os que contêm seu contexto. */
  appsOf(id: string): string[] {
    const apps = this.ids("app");
    const contains = (app: string, target: string) => this.ir.elements[app]!.relations.some((r) => r.type === "contains" && r.target === target);
    let current: string | undefined = id;
    while (current) {
      const explicit = apps.filter((a) => contains(a, current!));
      if (explicit.length > 0) return explicit;
      if (this.ir.elements[current]?.kind === "app") return [current];
      current = this.ir.elements[current]?.parent;
    }
    return [];
  }

  rel(from: string, to: string, label: string): void {
    if (from !== to) this.rels.set(`${from}->${to}`, { from, to, label });
  }

  /** Relações entre apps, de apps para externos e de atores para apps. */
  build(): void {
    const entries = Object.entries(this.ir.elements);
    for (const [id, e] of entries) {
      for (const r of e.relations) {
        const target = this.ir.elements[r.target];
        if (!target) continue;
        if (r.type === "calls" && target.kind === "endpoint") {
          for (const from of this.appsOf(id)) for (const to of this.appsOf(r.target)) this.rel(from, to, `${String(target.protocol ?? "http").toUpperCase()}`);
        }
        if (r.type === "uses" && target.kind === "external") {
          for (const from of this.appsOf(id)) this.rel(from, r.target, "usa");
        }
      }
      if (e.kind === "process") {
        const trigger = e.relations.find((r) => r.type === "triggeredBy")?.target;
        for (const actor of (e.actors as string[] | undefined) ?? []) {
          const callers = trigger ? entries.filter(([, x]) => x.relations.some((r) => r.type === "calls" && r.target === trigger)).flatMap(([cid]) => this.appsOf(cid)) : [];
          const targets = callers.length > 0 ? callers : trigger ? this.appsOf(trigger) : this.appsOf(container(this.ir, e.parent ?? "") ?? "");
          for (const app of targets) this.rel(actor, app, "usa");
        }
      }
    }
  }
}

function c4Lines(ir: IrModel, kind: "C4Context" | "C4Container", view: View): string[] {
  const g = new C4Graph(ir);
  g.build();
  const system = ir.system;
  const lines: string[] = [kind];
  if (view.title === undefined) lines.push(`  title ${kind === "C4Context" ? "Contexto" : "Contêineres"} — ${system?.id ?? "sistema"}`);

  for (const id of g.ids("actor")) lines.push(`  Person(${safe(id)}, ${quote(ir.elements[id]!.name)}, ${quote(String(ir.elements[id]!.description ?? ""))})`);
  if (kind === "C4Context") {
    lines.push(`  System(${safe(system?.id ?? "sistema")}, ${quote(system?.id ?? "Sistema")}, ${quote(system?.description ?? "")})`);
  } else {
    lines.push(`  System_Boundary(${safe(system?.id ?? "sistema")}_b, ${quote(system?.id ?? "Sistema")}) {`);
    for (const id of g.ids("app")) {
      const app = ir.elements[id]!;
      const tech = [app.framework, app.appKind].filter(Boolean).join(", ");
      const contexts = app.relations.filter((r) => r.type === "contains").map((r) => ir.elements[r.target]?.name ?? r.target);
      lines.push(`    Container(${safe(id)}, ${quote(app.name)}, ${quote(tech)}, ${quote(contexts.join(", "))})`);
    }
    lines.push("  }");
  }
  for (const id of g.ids("external")) lines.push(`  System_Ext(${safe(id)}, ${quote(ir.elements[id]!.name)}, ${quote(String(ir.elements[id]!.description ?? ""))})`);

  // No C4 de contexto, tudo que é app vira o próprio sistema.
  const collapse = (id: string) => (kind === "C4Context" && ir.elements[id]?.kind === "app" ? system?.id ?? "sistema" : id);
  const seen = new Set<string>();
  for (const r of g.rels.values()) {
    const from = collapse(r.from);
    const to = collapse(r.to);
    const key = `${from}->${to}`;
    if (from === to || seen.has(key)) continue;
    seen.add(key);
    lines.push(`  Rel(${safe(from)}, ${safe(to)}, ${quote(r.label)})`);
  }
  return lines;
}

function c4Context(view: View, ir: IrModel): string[] {
  return c4Lines(ir, "C4Context", view);
}

function c4Container(view: View, ir: IrModel): string[] {
  return c4Lines(ir, "C4Container", view);
}

const COMPONENT_KINDS = ["service", "controller", "repository", "gateway", "middleware", "guard", "component", "page", "store"];

function c4Component(view: View, ir: IrModel): string[] {
  const scope = view.of ? requireOf(view, ir, ["context", "app"]) : undefined;
  const shown = new Set(select(ir, view, COMPONENT_KINDS));
  const lines = ["C4Component"];
  lines.push(`  Container_Boundary(${safe(view.of ?? "componentes")}_b, ${quote(scope?.name ?? "Componentes")}) {`);
  for (const id of shown) {
    const c = ir.elements[id]!;
    lines.push(`    Component(${safe(id)}, ${quote(c.name)}, ${quote(c.kind)}, ${quote(c.docs?.split("\n")[0] ?? "")})`);
  }
  lines.push("  }");
  const outside = new Set<string>();
  const rels: string[] = [];
  for (const id of shown) {
    for (const r of ir.elements[id]!.relations.filter((x: IrRelation) => x.type === "uses" || x.type === "calls")) {
      const target = r.type === "calls" ? ir.elements[r.target]?.parent : r.target;
      if (!target || !ir.elements[target]) continue;
      if (!shown.has(target)) outside.add(target);
      rels.push(`  Rel(${safe(id)}, ${safe(target)}, ${quote(r.type === "calls" ? "chama" : "usa")})`);
    }
  }
  for (const id of outside) {
    const o = ir.elements[id]!;
    lines.push(o.kind === "external" ? `  System_Ext(${safe(id)}, ${quote(o.name)})` : `  Component_Ext(${safe(id)}, ${quote(o.name)}, ${quote(o.kind)})`);
  }
  return [...lines, ...[...new Set(rels)]];
}

// ---------------------------------------------------------------------
//  Deployment
// ---------------------------------------------------------------------

function deploymentDiagram(view: View, ir: IrModel): string[] {
  requireOf(view, ir, ["deployment"]);
  const lines = ["flowchart LR"];
  const children = (parent: string) => Object.keys(ir.elements).filter((id) => ir.elements[id]!.parent === parent).sort((a, b) => ir.elements[a]!.source.line - ir.elements[b]!.source.line);

  const node = (id: string, depth: number) => {
    const e = ir.elements[id]!;
    const pad = "  ".repeat(depth);
    if (e.kind === "group") {
      const type = e.resourceType ? ` · ${e.resourceType}` : "";
      lines.push(`${pad}subgraph ${safe(id)}[${quote(`${e.groupKind} ${e.name}${type}`)}]`);
      for (const c of children(id)) node(c, depth + 1);
      lines.push(`${pad}end`);
      return;
    }
    const runs = e.relations.filter((r) => r.type === "runs" || r.type === "stores" || r.type === "carries").map((r) => `${r.type} ${ir.elements[r.target]?.name ?? r.target}`);
    const replicas = e.replicas ? ` ×${e.replicas}` : "";
    const label = [`${e.name}${replicas}`, String(e.resourceType), ...runs].join("<br/>");
    const type = String(e.resourceType);
    const shape = /rds|postgres|mysql|dynamo|database|\.db$/.test(type)
      ? [`[(`, `)]`]
      : /sqs|queue|kafka|sns|topic/.test(type)
        ? [`[[`, `]]`]
        : type.startsWith("actor.")
          ? [`([`, `])`]
          : [`[`, `]`];
    lines.push(`${pad}${safe(id)}${shape[0]}${quote(label)}${shape[1]}`);
  };

  for (const c of children(view.of!)) node(c, 1);
  for (const id of Object.keys(ir.elements).filter((x) => x.startsWith(`${view.of}.`))) {
    for (const r of ir.elements[id]!.relations.filter((x) => x.type === "connectsTo")) {
      lines.push(`  ${safe(id)} -->${r.label ? `|${quote(r.label)}|` : ""} ${safe(r.target)}`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------
//  Sitemap
// ---------------------------------------------------------------------

/** Rotas de um app de frontend, as páginas que elas abrem e o que cada página renderiza. */
function sitemap(view: View, ir: IrModel): string[] {
  const app = requireOf(view, ir, ["app"]);
  const lines = ["flowchart LR", `  ${safe(view.of!)}([${quote(app.name)}])`];
  const routes = (app.routes as { path: string; target: string; guard?: string }[]) ?? [];
  routes.forEach((r, i) => {
    const route = `${safe(view.of!)}_r${i}`;
    const guard = r.guard ? `|${quote(`guard ${ir.elements[r.guard]?.name ?? r.guard}`)}|` : "";
    lines.push(`  ${safe(view.of!)} --> ${route}[${quote(r.path)}]`);
    lines.push(`  ${route} -->${guard} ${safe(r.target)}[${quote(ir.elements[r.target]?.name ?? r.target)}]`);
  });
  const pages = new Set(routes.map((r) => r.target));
  for (const page of pages) {
    for (const rel of ir.elements[page]?.relations.filter((x) => x.type === "renders") ?? []) {
      lines.push(`  ${safe(page)} -.-> ${safe(rel.target)}[${quote(ir.elements[rel.target]?.name ?? rel.target)}]`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------
//  Rastreabilidade
// ---------------------------------------------------------------------

interface IrRequirement {
  kind: "requirement" | "decision";
  id: string;
  title: string;
  justifiedBy: string[];
}

/**
 * Grafo requisito → elemento (seção 14). Os requisitos vêm de `ir.requirements`,
 * preenchido pela verificação contra os documentos; sem ela, o diagrama sai vazio.
 */
function traceability(view: View, ir: IrModel): string[] {
  const requirements = Object.entries((ir.requirements ?? {}) as Record<string, IrRequirement>);
  const wantsDecisions = view.include.some((s) => s !== "*" && "every" in s && s.every === "decision");
  const shownReqs = requirements.filter(([, r]) => r.kind === "requirement" || wantsDecisions);
  const linked = new Set(shownReqs.flatMap(([, r]) => r.justifiedBy));
  // Com `include`, entram os tipos pedidos (inclusive os sem requisito); sem, os que têm vínculo.
  const elements = view.include.length > 0
    ? select(ir, view).filter((id) => !["requirement", "decision"].includes(ir.elements[id]!.kind))
    : [...linked].filter((id) => ir.elements[id]);

  const lines = ["flowchart LR"];
  for (const [key, r] of shownReqs) {
    lines.push(`  ${safe(key)}([${quote(`${r.id}<br/>${r.title}`)}])`);
    if (r.justifiedBy.length === 0 && r.kind === "requirement") lines.push(`  class ${safe(key)} semImplementacao`);
  }
  for (const id of elements) {
    const e = ir.elements[id]!;
    lines.push(`  ${safe(id)}[${quote(`${e.kind}<br/>${e.kind === "endpoint" ? `${e.method} ${e.path ?? e.operation}` : e.name}`)}]`);
  }
  const shown = new Set(elements);
  for (const [key, r] of shownReqs) for (const id of r.justifiedBy) if (shown.has(id)) lines.push(`  ${safe(key)} --> ${safe(id)}`);
  lines.push("  classDef semImplementacao stroke-dasharray: 5 5");
  return lines;
}
