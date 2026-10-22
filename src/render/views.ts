// Views (seção 6.18): quais elementos entram em cada diagrama. Tudo aqui lê
// só o IR: diagramas são projeções do modelo (P8).

import type { IrElement, IrModel } from "../ir.ts";

export interface View {
  /** Nome do arquivo e do marcador `<!-- planta:view NOME -->`. */
  name: string;
  kind: string;
  of?: string;
  title?: string;
  include: Selector[];
  exclude: Selector[];
  layout?: string;
}

export type Selector = "*" | { every: string } | { element: string; children?: true };

/** Views declaradas na planta. */
export function declaredViews(ir: IrModel): View[] {
  return Object.values(ir.elements)
    .filter((e) => e.kind === "view")
    .map((e) => ({
      name: e.name,
      kind: String(e.viewKind),
      ...(typeof e.of === "string" && { of: e.of }),
      ...(typeof e.title === "string" && { title: e.title }),
      include: (e.include as Selector[]) ?? [],
      exclude: (e.exclude as Selector[]) ?? [],
      ...(typeof e.layout === "string" && { layout: e.layout }),
    }));
}

/**
 * Conjunto padrão de `planta render --auto` (seção 6.18): C4 de contexto e de
 * contêineres, um diagrama de classes e um ER por contexto, uma sequência por
 * processo e um diagrama por deployment.
 */
export function autoViews(ir: IrModel): View[] {
  const all = Object.entries(ir.elements);
  const of = (kind: string) => all.filter(([, e]) => e.kind === kind).map(([id]) => id).sort();
  const view = (name: string, kind: string, target?: string): View => ({ name, kind, ...(target && { of: target }), include: [], exclude: [] });
  return [
    view("c4-contexto", "c4.context"),
    view("c4-containers", "c4.container"),
    ...of("context").flatMap((id) => [view(`classes-${id}`, "class", id), view(`er-${id}`, "er", id)]),
    ...of("process").map((id) => view(`sequencia-${id}`, "sequence", id)),
    ...of("deployment").map((id) => view(`deployment-${id}`, "deployment", id)),
  ];
}

/** IDs dos elementos selecionados pela view, na ordem do IR. */
export function select(ir: IrModel, view: View, kinds?: readonly string[]): string[] {
  const ids = Object.keys(ir.elements);
  const descendants = (root: string) => ids.filter((id) => isDescendant(ir, id, root));
  const pick = (s: Selector): string[] => {
    if (s === "*") return ids;
    if ("every" in s) return ids.filter((id) => ir.elements[id]!.kind === s.every);
    return s.children ? descendants(s.element) : [s.element];
  };

  const base = view.include.length > 0 ? view.include.flatMap(pick) : view.of ? descendants(view.of) : ids;
  const excluded = new Set(view.exclude.flatMap(pick));
  const chosen = new Set(base.filter((id) => !excluded.has(id) && (!kinds || kinds.includes(ir.elements[id]?.kind ?? ""))));
  return ids.filter((id) => chosen.has(id));
}

export function isDescendant(ir: IrModel, id: string, ancestor: string): boolean {
  let current = ir.elements[id]?.parent;
  while (current) {
    if (current === ancestor) return true;
    current = ir.elements[current]?.parent;
  }
  return false;
}

/** Contexto ou app mais próximo que contém o elemento. */
export function container(ir: IrModel, id: string): string | undefined {
  let current: string | undefined = id;
  while (current) {
    const el: IrElement | undefined = ir.elements[current];
    if (!el) return undefined;
    if (el.kind === "context" || el.kind === "app") return current;
    current = el.parent;
  }
  return undefined;
}
