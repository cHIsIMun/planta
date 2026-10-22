// Grafo de dependências para as regras (seção 6.17): arestas entre elementos
// (e arquivos sem elemento), declaradas na planta e reais, extraídas do código.
//
// "As dependências avaliadas são as reais": um import de `dominio` para
// `infra` viola a regra mesmo que a planta não declare `uses`.

import { matchesGlob } from "node:path";
import type * as A from "../ast.ts";
import type { Loc } from "../ast.ts";
import type { Fact } from "../facts.ts";
import type { IrElement } from "../ir.ts";
import type { ValidationContext } from "../validate/context.ts";

/** Ponta de uma aresta: os elementos donos (do mais específico) e, para dependências reais, o arquivo. */
export interface Endpoint {
  elements: string[];
  file?: string;
}

export type EdgeKind = "uses" | "calls" | "renders" | "implements" | "type" | "step" | "handler" | "consumes" | "import" | "di" | "call" | "http" | "emit";

export interface Edge {
  from: Endpoint;
  to: Endpoint;
  kind: EdgeKind;
  /** Dependência através de um contrato que as regras podem liberar com `except via`. */
  via?: "event" | "endpoint";
  /** Onde a dependência acontece: no código para as reais, na planta para as declaradas. */
  loc: Loc;
  real: boolean;
}

export const EDGE_TEXT: Record<EdgeKind, string> = {
  uses: "uses declarado", calls: "calls declarado", renders: "renders declarado", implements: "implements declarado",
  type: "tipo referenciado", step: "passo de processo", handler: "handler", consumes: "consumo de evento",
  import: "import", di: "injeção no construtor", call: "chamada", http: "chamada HTTP", emit: "publicação de evento",
};

const DECLARED: Record<string, { kind: EdgeKind; via?: "event" | "endpoint" }> = {
  uses: { kind: "uses" }, calls: { kind: "calls", via: "endpoint" }, renders: { kind: "renders" },
  implements: { kind: "implements" }, consumes: { kind: "consumes", via: "event" }, handledBy: { kind: "handler" },
};

export class DependencyGraph {
  readonly edges: Edge[] = [];
  private readonly byFile = new Map<string, string[]>();
  private readonly bySymbol = new Map<string, string[]>();
  private readonly layers: A.LayerDecl[];

  constructor(private readonly ctx: ValidationContext) {
    this.layers = ctx.model.merged.decls.filter((d): d is A.LayerDecl => d.kind === "layer");
    this.indexCode();
    this.declared();
    this.real();
  }

  element(id: string): IrElement | undefined {
    return this.ctx.elements[id];
  }

  /** O elemento e seus ancestrais, do mais específico para o mais geral. */
  ancestors(id: string): string[] {
    const out: string[] = [];
    for (let current: string | undefined = id; current && this.ctx.elements[current]; current = this.ctx.elements[current]!.parent) out.push(current);
    return out;
  }

  /** Camada do elemento (`in layer` ou `match`), herdada do ancestral mais próximo que tenha uma. */
  layerOf(id: string): string | undefined {
    for (const a of this.ancestors(id)) {
      const layer = this.ctx.model.derived.layers.get(a);
      if (layer) return layer;
    }
    return undefined;
  }

  /** Operações, campos e passos contam pelo componente, entidade ou processo que os contém. */
  unit(id: string): string {
    return this.ancestors(id).find((a) => !["op", "field", "step"].includes(this.ctx.elements[a]!.kind)) ?? id;
  }

  /** Dependências reais entre unidades distintas (para o diff arquitetural). */
  realDependencies(): { from: string; to: string; kind: EdgeKind }[] {
    const seen = new Map<string, { from: string; to: string; kind: EdgeKind }>();
    for (const e of this.edges) {
      if (!e.real || !e.from.elements[0] || !e.to.elements[0]) continue;
      const from = this.unit(e.from.elements[0]);
      const to = this.unit(e.to.elements[0]);
      if (from === to || this.ancestors(from).includes(to) || this.ancestors(to).includes(from)) continue;
      if (!seen.has(`${from} → ${to}`)) seen.set(`${from} → ${to}`, { from, to, kind: e.kind });
    }
    return [...seen.values()];
  }

  fileLayer(file: string): string | undefined {
    return this.layers.find((l) => l.match.some((g) => matchesGlob(file, g)))?.name.name;
  }

  /** Pasta (`root`) de um contexto ou app, relativa à raiz do projeto. */
  rootOf(id: string): string | undefined {
    return this.ctx.model.derived.roots.get(id);
  }

  // -------------------------------------------------------------------
  //  Código → elementos
  // -------------------------------------------------------------------

  private indexCode(): void {
    const add = (map: Map<string, string[]>, key: string, id: string) => {
      if (!(map.get(key) ?? []).includes(id)) map.set(key, [...(map.get(key) ?? []), id]);
    };
    for (const [id, r] of this.ctx.resolved) {
      add(this.bySymbol, r.symbol.name, id);
      if (this.ctx.elements[id]?.kind !== "op") add(this.byFile, r.file, id);
    }
    for (const [id, el] of Object.entries(this.ctx.elements)) {
      if (el.anchor?.scheme === "code" && el.anchor.path && !el.anchor.inherited && el.kind !== "op" && el.kind !== "field") add(this.byFile, el.anchor.path, id);
    }
  }

  /** Elementos ancorados no arquivo; sem nenhum, o contexto ou app cujo `root` o contém. */
  ownersOf(file: string): string[] {
    const own = this.byFile.get(file);
    if (own) return own;
    const containers = Object.keys(this.ctx.elements)
      .filter((id) => {
        const root = this.rootOf(id);
        const el = this.ctx.elements[id]!;
        return root !== undefined && (el.kind === "context" || el.kind === "app") && (file === root || file.startsWith(`${root}/`));
      })
      .sort((a, b) => this.rootOf(b)!.length - this.rootOf(a)!.length);
    return containers.slice(0, 1);
  }

  /** Elemento cujo código é o símbolo (`ClientesService.criar`, `Home`), se for um só. */
  bySymbolName(name: string): string | undefined {
    const ids = this.bySymbol.get(name) ?? [];
    return ids.length === 1 ? ids[0] : undefined;
  }

  // -------------------------------------------------------------------
  //  Arestas
  // -------------------------------------------------------------------

  private push(from: Endpoint, to: Endpoint, kind: EdgeKind, loc: Loc, real: boolean, via?: "event" | "endpoint"): void {
    if (from.elements.length === 0 && !from.file) return;
    if (to.elements.length === 0 && !to.file) return;
    this.edges.push({ from, to, kind, loc, real, ...(via && { via }) });
  }

  private declared(): void {
    for (const [id, el] of Object.entries(this.ctx.elements)) {
      if (this.ancestors(id).some((a) => this.ctx.elements[a]!.kind === "deployment") || el.kind === "rule" || el.kind === "view") continue;
      const from = { elements: [id] };
      for (const r of el.relations) {
        const spec = DECLARED[r.type];
        if (spec && this.ctx.elements[r.target]) this.push(from, { elements: [r.target] }, spec.kind, el.source, false, spec.via);
      }
      // Tipos referenciados em campos, parâmetros, retornos, corpo e respostas.
      for (const target of typeRefs(el)) if (this.ctx.elements[target] && target !== id) this.push(from, { elements: [target] }, "type", el.source, false);
      if (el.kind === "process") {
        for (const s of flowTargets(el.flow)) {
          if (!this.ctx.elements[s.id]) continue;
          this.push(from, { elements: [s.id] }, s.emit ? "emit" : "step", el.source, false, s.emit ? "event" : undefined);
        }
      }
    }
  }

  private real(): void {
    const loc = (f: Fact) => this.ctx.codeLoc(f.location.file, f.location.line);
    const codeEnd = (file: string) => ({ elements: this.ownersOf(file), file });
    const events = eventIndex(this.ctx);
    const endpoints = new Map<string, string>();
    for (const [id, el] of Object.entries(this.ctx.elements)) {
      if (el.kind === "endpoint") endpoints.set(`${String(el.method)} ${String(el.path).replace(/:[^/]+/g, ":")}`, id);
    }

    for (const f of this.ctx.facts) {
      switch (f.kind) {
        case "import":
          this.push(codeEnd(String(f.data.from)), codeEnd(String(f.data.to)), "import", loc(f), true);
          break;
        case "di": {
          const consumer = this.bySymbolName(String(f.data.consumer));
          const provider = this.bySymbolName(String(f.data.provider));
          if (consumer && provider) this.push({ elements: [consumer], file: f.location.file }, { elements: [provider] }, "di", loc(f), true);
          break;
        }
        case "call": {
          const caller = this.bySymbolName(String(f.data.caller)) ?? this.bySymbolName(String(f.data.caller).split(".")[0]!);
          const callee = this.bySymbolName(String(f.data.callee)) ?? this.bySymbolName(String(f.data.callee).split(".")[0]!);
          if (caller && callee) this.push({ elements: [caller], file: f.location.file }, { elements: [callee] }, "call", loc(f), true);
          break;
        }
        case "http.client": {
          const endpoint = endpoints.get(`${String(f.data.method)} ${String(f.data.path).replace(/:[^/]+/g, ":")}`);
          const caller = this.bySymbolName(String(f.data.in));
          const from = caller ? { elements: [caller], file: f.location.file } : codeEnd(f.location.file);
          if (endpoint) this.push(from, { elements: [endpoint] }, "http", loc(f), true, "endpoint");
          break;
        }
        case "event.emit": {
          const event = events.get(normalizeEvent(String(f.data.event)));
          const emitter = this.bySymbolName(String(f.data.in));
          if (event && emitter) this.push({ elements: [emitter], file: f.location.file }, { elements: [event] }, "emit", loc(f), true, "event");
          break;
        }
      }
    }
  }
}

/** Referências `{ ref: "Id" }` de tipos em qualquer propriedade do elemento. */
function typeRefs(el: IrElement): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const o = v as Record<string, unknown>;
    if (typeof o.ref === "string") out.push(o.ref);
    for (const [k, x] of Object.entries(o)) if (k !== "relations" && k !== "meta" && k !== "source" && k !== "anchor" && k !== "flow") walk(x);
  };
  walk(el);
  return out;
}

export interface FlowStep {
  name?: string;
  id: string;
  emit: boolean;
}

/** Alvos dos passos de um processo, em ordem, sem distinguir blocos. */
export function flowTargets(flow: unknown): FlowStep[] {
  const out: FlowStep[] = [];
  const walk = (items: unknown) => {
    for (const s of (items as Record<string, unknown>[] | undefined) ?? []) {
      if (typeof s.target === "string") out.push({ ...(typeof s.name === "string" && { name: s.name }), id: s.target, emit: false });
      if (typeof s.emit === "string") out.push({ ...(typeof s.name === "string" && { name: s.name }), id: s.emit, emit: true });
      if (s.op === "emit" && typeof s.event === "string") out.push({ id: s.event, emit: true });
      for (const k of ["then", "else", "body"]) walk(s[k]);
    }
  };
  walk(flow);
  return out;
}

/** `cliente.cadastrado`, `ClienteCadastrado` e `CLIENTE_CADASTRADO` são o mesmo evento. */
export function normalizeEvent(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Eventos da planta pelo nome normalizado (e pelo símbolo da âncora, se houver). */
export function eventIndex(ctx: ValidationContext): Map<string, string> {
  const index = new Map<string, string>();
  for (const [id, el] of Object.entries(ctx.elements)) {
    if (el.kind !== "event") continue;
    index.set(normalizeEvent(el.name), id);
    if (el.anchor?.symbol) index.set(normalizeEvent(el.anchor.symbol.split(".").at(-1)!), id);
  }
  return index;
}
