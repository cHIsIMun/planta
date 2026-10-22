// `planta render`: escolhe as views, renderiza e injeta diagramas em Markdown
// (seção 13.6), para que a documentação narrativa nunca tenha diagrama velho.

import type { CheckResult } from "../check.ts";
import type { FieldFact } from "../facts.ts";
import type { IrModel } from "../ir.ts";
import { renderD2 } from "./d2.ts";
import { renderMermaid, RenderError } from "./mermaid.ts";
import { autoViews, declaredViews, type View } from "./views.ts";

export interface Rendered {
  view: View;
  text?: string;
  error?: string;
}

/**
 * Views declaradas e automáticas. Uma view automática some quando já existe
 * uma declarada com o mesmo nome ou com o mesmo tipo e alvo: `view FluxoCompra
 * kind sequence of Vendas.FinalizarCompra` substitui `sequencia-Vendas.FinalizarCompra`.
 */
export function allViews(ir: IrModel): View[] {
  const declared = declaredViews(ir);
  const taken = (v: View) => declared.some((d) => d.name === v.name || (d.kind === v.kind && d.of === v.of && d.include.length === 0));
  return [...declared, ...autoViews(ir).filter((v) => !taken(v))];
}

export type Format = "mermaid" | "d2";

export function renderViews(views: View[], ir: IrModel, extractedFields?: Map<string, FieldFact[]>, format: Format = "mermaid"): Rendered[] {
  return views.map((view) => {
    try {
      if (format === "d2") return { view, text: renderD2(view, ir) };
      return { view, text: renderMermaid(view, { ir, ...(extractedFields && { extractedFields }) }) };
    } catch (e) {
      if (e instanceof RenderError) return { view, error: e.message };
      throw e;
    }
  });
}

/** Campos do código para entidades que não fixam campos na planta. */
export function extractedFields(ir: IrModel, result: CheckResult | undefined): Map<string, FieldFact[]> {
  const fields = new Map<string, FieldFact[]>();
  if (!result) return fields;
  for (const [id, factIds] of result.matches) {
    if (ir.elements[id]?.kind !== "entity" || ir.elements[id]?.fields) continue;
    const fact = result.facts.find((f) => factIds.includes(f.id) && f.kind === "entity");
    if (fact) fields.set(id, fact.data.fields as FieldFact[]);
  }
  return fields;
}

const MARKER = /(<!--\s*planta:view\s+(\S+)\s*-->)[\s\S]*?(<!--\s*\/planta:view\s*-->)/g;

export interface InjectResult {
  text: string;
  /** Marcadores que citam view inexistente ou que não renderiza, com a linha. */
  problems: { line: number; message: string }[];
}

/** Substitui o conteúdo entre `<!-- planta:view X -->` e `<!-- /planta:view -->`. */
export function inject(markdown: string, render: (name: string) => Rendered | undefined): InjectResult {
  const problems: InjectResult["problems"] = [];
  const text = markdown.replace(MARKER, (whole, open: string, name: string, close: string, offset: number) => {
    const line = markdown.slice(0, offset).split("\n").length;
    const rendered = render(name);
    if (!rendered) {
      problems.push({ line, message: `view \`${name}\` não existe` });
      return whole;
    }
    if (rendered.error || rendered.text === undefined) {
      problems.push({ line, message: rendered.error ?? `view \`${name}\` não renderizou` });
      return whole;
    }
    return `${open}\n\`\`\`mermaid\n${rendered.text}\`\`\`\n${close}`;
  });
  return { text, problems };
}
