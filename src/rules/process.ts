// Verificação de processos (seção 11.6) e de eventos contra o código.
//
// `verify calls`: partindo do handler do gatilho, cada passo com código tem de
// ser alcançável pelo grafo de chamadas (PL702); cada `emit` tem de ser
// publicado nesse caminho (PL704). `verify order`: passos do mesmo bloco
// chamados no mesmo método aparecem na ordem declarada (PL703). O que não dá
// para seguir (passo sem código, gatilho sem handler) é informação (PL705).
//
// Eventos: publicado no código sem declaração (PL333) e declarado sem
// publicação (PL332), quando há extrator que enxerga publicações.

import type { Loc } from "../ast.ts";
import type { Fact } from "../facts.ts";
import type { IrElement } from "../ir.ts";
import type { ValidationContext } from "../validate/context.ts";
import { eventIndex, normalizeEvent } from "./graph.ts";

type FlowItem = { op: string; name?: string; target?: string; emit?: string; event?: string; then?: FlowItem[]; else?: FlowItem[]; body?: FlowItem[] };

interface Step {
  name?: string;
  /** Operação ou evento. */
  target: string;
  emit: boolean;
  /** Passos do mesmo bloco têm o mesmo número; `parallel` não ordena. */
  block: number;
  ordered: boolean;
}

export function verifyProcesses(ctx: ValidationContext): void {
  const calls = ctx.facts.filter((f) => f.kind === "call" && f.extractor !== "react");
  const emits = ctx.facts.filter((f) => f.kind === "event.emit");
  const edges = new Map<string, Fact[]>();
  for (const c of calls) edges.set(String(c.data.caller), [...(edges.get(String(c.data.caller)) ?? []), c]);
  const symbolOf = (op: string) => ctx.resolved.get(op)?.symbol.name;

  for (const [id, el] of Object.entries(ctx.elements)) {
    if (el.kind !== "process" || (el.verify !== "calls" && el.verify !== "order") || el.meta.status === "planned") continue;
    const loc = (step?: string) => (step && ctx.model.symbols.symbols.get(`${id}.${step}`)?.decl.loc) || el.source;

    const starts = triggerOps(ctx, el);
    if (starts === "no-handler") {
      ctx.report("PL701", "error", `\`${id}\`: com verify ${el.verify}, o gatilho precisa ter handler (endpoint, evento consumido ou job)`, el.source);
      continue;
    }
    const startSymbols = starts.map(symbolOf).filter((s): s is string => !!s);
    if (startSymbols.length === 0) {
      ctx.report("PL705", "info", `\`${id}\`: o handler do gatilho não tem código ancorado; verify ${el.verify} não tem por onde começar`, el.source);
      continue;
    }
    if (calls.length === 0) {
      ctx.report("PL705", "info", `\`${id}\`: nenhum extrator produziu chamadas entre métodos; verify ${el.verify} não se aplica`, el.source);
      continue;
    }

    const reach = new Set(startSymbols);
    const queue = [...startSymbols];
    while (queue.length > 0) {
      for (const c of edges.get(queue.shift()!) ?? []) {
        const callee = String(c.data.callee);
        if (!reach.has(callee)) {
          reach.add(callee);
          queue.push(callee);
        }
      }
    }

    const steps = flatten(el.flow as FlowItem[]);
    for (const step of steps) {
      if (step.emit) {
        if (emits.length === 0 && emitAwareRoots(ctx).length === 0) continue;
        const event = ctx.elements[step.target];
        const names = new Set([event?.name, event?.anchor?.symbol].filter((x): x is string => !!x).map(normalizeEvent));
        const found = emits.some((e) => reach.has(String(e.data.in)) && names.has(normalizeEvent(String(e.data.event))));
        if (!found) ctx.report("PL704", "warning", `\`${id}\`: o passo publica \`${step.target}\`, mas o caminho de código a partir do gatilho não publica esse evento`, loc(step.name));
        continue;
      }
      const target = ctx.elements[step.target];
      if (!target || ctx.elements[target.parent ?? ""]?.kind === "external") continue; // sistema externo: sem código para seguir
      const symbol = symbolOf(step.target);
      if (!symbol) {
        ctx.report("PL705", "info", `\`${id}\`: o passo ${step.name ?? step.target} chama \`${step.target}\`, que não tem código ancorado`, loc(step.name));
        continue;
      }
      if (!reach.has(symbol)) {
        ctx.report("PL702", "warning", `\`${id}\`: o passo ${step.name ?? step.target} (\`${step.target}\`) não é alcançável a partir do gatilho (${startSymbols.join(", ")})`, loc(step.name));
      }
    }

    if (el.verify === "order") checkOrder(ctx, id, steps, reach, calls, emits, symbolOf, loc);
  }
}

/** Operações por onde o processo começa; `no-handler` para gatilho sem código (um ator). */
function triggerOps(ctx: ValidationContext, el: IrElement): string[] | "no-handler" {
  const trigger = el.relations.find((r) => r.type === "triggeredBy")?.target;
  const t = trigger ? ctx.elements[trigger] : undefined;
  if (!t) return "no-handler";
  if (t.kind === "endpoint" || t.kind === "job") {
    const handler = t.relations.find((r) => r.type === "handledBy")?.target;
    return handler ? [handler] : "no-handler";
  }
  if (t.kind === "event") {
    const consumers = Object.entries(ctx.elements).filter(([, e]) => e.relations.some((r) => r.type === "consumes" && r.target === trigger)).map(([id]) => id);
    return consumers.length > 0 ? consumers : "no-handler";
  }
  return "no-handler";
}

/** Passos com alvo, em ordem. Depois de um `wait` o fluxo é outro: os passos seguintes não contam. */
function flatten(flow: FlowItem[]): Step[] {
  const out: Step[] = [];
  let blocks = 0;
  const walk = (items: FlowItem[], ordered: boolean): boolean => {
    const block = blocks++;
    for (const s of items) {
      if (s.op === "wait") return false;
      if (s.op === "step" && s.target) out.push({ ...(s.name && { name: s.name }), target: s.target, emit: false, block, ordered });
      if (s.op === "step" && s.emit) out.push({ ...(s.name && { name: s.name }), target: s.emit, emit: true, block, ordered });
      if (s.op === "emit" && s.event) out.push({ target: s.event, emit: true, block, ordered });
      if (s.op === "if") {
        walk(s.then ?? [], true);
        walk(s.else ?? [], true);
      }
      if (s.op === "foreach" && !walk(s.body ?? [], true)) return false;
      if (s.op === "parallel") walk(s.body ?? [], false);
    }
    return true;
  };
  walk(flow ?? [], true);
  return out;
}

/** Para cada par consecutivo do mesmo bloco, um método que faça os dois diretamente não pode inverter a ordem. */
function checkOrder(
  ctx: ValidationContext, id: string, steps: Step[], reach: Set<string>, calls: Fact[], emits: Fact[],
  symbolOf: (op: string) => string | undefined, loc: (step?: string) => Loc,
): void {
  /** Linhas, por método, em que o passo acontece diretamente. */
  const where = (step: Step): Map<string, number> => {
    const lines = new Map<string, number>();
    const put = (m: string, line: number) => lines.set(m, Math.min(lines.get(m) ?? Infinity, line));
    if (step.emit) {
      const event = ctx.elements[step.target];
      const names = new Set([event?.name, event?.anchor?.symbol].filter((x): x is string => !!x).map(normalizeEvent));
      for (const e of emits) if (names.has(normalizeEvent(String(e.data.event))) && reach.has(String(e.data.in))) put(String(e.data.in), e.location.line ?? 0);
    } else {
      const symbol = symbolOf(step.target);
      for (const c of calls) if (symbol && c.data.callee === symbol && reach.has(String(c.data.caller))) put(String(c.data.caller), c.location.line ?? 0);
    }
    return lines;
  };
  for (let i = 1; i < steps.length; i++) {
    const [a, b] = [steps[i - 1]!, steps[i]!];
    if (a.block !== b.block || !a.ordered) continue;
    const la = where(a);
    for (const [method, lineB] of where(b)) {
      const lineA = la.get(method);
      if (lineA !== undefined && lineB < lineA) {
        ctx.report("PL703", "warning", `\`${id}\`: a planta põe ${a.name ?? a.target} antes de ${b.name ?? b.target}, mas ${method} faz o contrário`, loc(b.name),
          [ctx.codeLoc(ctx.resolved.get(Object.keys(ctx.elements).find((k) => ctx.resolved.get(k)?.symbol.name === method) ?? "")?.file ?? "", lineB)]);
      }
    }
  }
}

// ---------------------------------------------------------------------
//  Eventos
// ---------------------------------------------------------------------

/** Extratores que enxergam publicações de evento: sem um deles, não há evidência para PL332/PL704. */
const EMIT_AWARE = new Set(["nestjs", "spring"]);

function emitAwareRoots(ctx: ValidationContext): string[] {
  return ctx.config.extractors.filter((e) => EMIT_AWARE.has(e.use)).map((e) => e.root);
}

export function validateEvents(ctx: ValidationContext): void {
  const emits = ctx.facts.filter((f) => f.kind === "event.emit");
  const roots = emitAwareRoots(ctx);
  if (emits.length === 0 && roots.length === 0) return;
  const index = eventIndex(ctx);
  const emitted = new Set<string>();
  for (const f of emits) {
    const event = index.get(normalizeEvent(String(f.data.event)));
    if (event) {
      emitted.add(event);
      ctx.link(event, f);
    } else {
      ctx.reported(f.id);
      ctx.report("PL333", "error", `evento "${f.data.event}" é publicado no código (${f.data.in}) mas não está declarado na planta`, ctx.codeLoc(f.location.file, f.location.line));
    }
  }
  // Só se cobra publicação onde algum código publica eventos: o contexto do
  // evento tem de ter `root` com ao menos uma publicação extraída.
  const watched = (id: string) => {
    let context = ctx.elements[id]?.parent;
    while (context && ctx.elements[context]?.kind !== "context") context = ctx.elements[context]?.parent;
    const root = context && ctx.model.derived.roots.get(context);
    return root !== undefined && (emits.some((f) => f.location.file.startsWith(`${root}/`)) || roots.some((r) => r === "" || root === r || root.startsWith(`${r}/`)));
  };
  for (const [id, el] of Object.entries(ctx.elements)) {
    if (el.kind !== "event" || emitted.has(id) || el.meta.status === "planned" || !watched(id)) continue;
    ctx.report("PL332", "warning", `evento \`${id}\` está declarado, mas nenhum código o publica`, el.source);
  }
}
