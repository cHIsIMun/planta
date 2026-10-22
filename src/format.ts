// `planta fmt`: formatação canônica preservando comentários e a quebra de
// linhas escolhida pelo autor. Só espaços em branco mudam: a sequência de
// tokens, inclusive comentários, sai idêntica à de entrada.
//
// Regras: indentação de 2 espaços por `{` aberta, mais 2 quando a linha
// continua uma declaração da linha anterior; espaçamento fixo entre tokens;
// no máximo uma linha em branco seguida; sem espaços no fim da linha; um
// `\n` no fim do arquivo.

import { ParserRuleContext, type ParseTree, TerminalNode, type Token } from "antlr4ng";
import type { Diagnostic } from "./diagnostics.ts";
import { PlantaLexer } from "./generated/PlantaLexer.js";
import * as P from "./generated/PlantaParser.js";
import { parse } from "./parse.ts";

const INDENT = "  ";

/** Regras cujo primeiro token começa uma linha "de declaração", e não uma continuação. */
const STATEMENTS = [
  P.UseDeclContext, P.TopDeclContext, P.ContextMemberContext, P.FieldBlockItemContext,
  P.ComponentItemContext, P.OpDeclContext, P.EndpointDeclContext, P.EndpointItemContext,
  P.ProcessItemContext, P.AppItemContext, P.DeployItemContext, P.NodePropContext,
  P.RuleStmtContext, P.ViewItemContext, P.SystemItemContext, P.AnnotationContext,
  P.EntityDeclContext, P.ValueDeclContext, P.DtoDeclContext, P.EnumDeclContext,
  P.AggregateDeclContext, P.ComponentDeclContext, P.ApiDeclContext, P.ChannelDeclContext,
  P.EventDeclContext, P.HandlerDeclContext, P.JobDeclContext, P.ProcessDeclContext,
  P.RouteDeclContext, P.GroupDeclContext, P.NodeDeclContext, P.ConnectionContext,
  P.SystemDeclContext, P.LayerDeclContext, P.ActorDeclContext, P.ExternalDeclContext,
  P.ContextDeclContext, P.AppDeclContext, P.RequirementDeclContext, P.DecisionDeclContext,
  P.DeploymentDeclContext, P.RuleDeclContext, P.ViewDeclContext,
];

const OPAQUE = new Set([PlantaLexer.STRING, PlantaLexer.DOC_COMMENT, PlantaLexer.LINE_COMMENT, PlantaLexer.BLOCK_COMMENT]);
const COMMENTS = new Set([PlantaLexer.DOC_COMMENT, PlantaLexer.LINE_COMMENT, PlantaLexer.BLOCK_COMMENT]);

export type FormatResult = { ok: true; text: string } | { ok: false; diagnostics: Diagnostic[] };

export function format(source: string, file = "<entrada>"): FormatResult {
  const { tree, tokens, diagnostics } = parse(source.replace(/\r\n?/g, "\n"), file);
  // Arquivo com erro de sintaxe não é formatado: a estrutura não é confiável.
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const starts = new Set<number>();
  collectStatementStarts(tree, starts);

  const lines = layout(tokens.filter((t) => t.type !== PlantaLexer.EOF), starts);
  alignColumns(lines);
  alignTrailingComments(lines);

  const out = lines.flatMap((line) => [...(line.blankBefore ? [""] : []), render(line)]);
  return { ok: true, text: out.length > 0 ? out.join("\n") + "\n" : "" };
}

interface Line {
  level: number;
  tokens: Token[];
  /** Espaço antes de cada token; `gaps[0]` é sempre "". */
  gaps: string[];
  blankBefore: boolean;
  continuation: boolean;
}

function layout(tokens: Token[], starts: Set<number>): Line[] {
  const lines: Line[] = [];
  let depth = 0;
  let previousEnd = 0;

  for (const group of groupByLine(tokens)) {
    const first = group[0]!;
    const closes = punct(first) === "}";
    const continuation = !closes && !COMMENTS.has(first.type) && !starts.has(first.tokenIndex);
    lines.push({
      level: Math.max(0, depth - (closes ? 1 : 0)) + (continuation ? 1 : 0),
      tokens: group,
      gaps: group.map((t, i) => (i > 0 && spaced(group[i - 1]!, t, group[i + 1]) ? " " : "")),
      blankBefore: lines.length > 0 && first.line - previousEnd > 1,
      continuation,
    });
    for (const token of group) {
      const p = punct(token);
      if (p === "{") depth++;
      else if (p === "}") depth--;
    }
    const last = group.at(-1)!;
    previousEnd = last.line + (last.text?.split("\n").length ?? 1) - 1;
  }
  return lines;
}

function render(line: Line): string {
  return (INDENT.repeat(line.level) + line.tokens.map((t, i) => line.gaps[i] + t.text).join("")).trimEnd();
}

/** Linhas vizinhas (sem linha em branco entre elas) no mesmo nível que satisfazem `fits`. */
function runs(lines: Line[], fits: (line: Line) => boolean): Line[][] {
  const result: Line[][] = [];
  let run: Line[] = [];
  for (const line of lines) {
    const extends_ = run.length > 0 && !line.blankBefore && line.level === run[0]!.level && fits(line);
    if (extends_) run.push(line);
    else {
      if (run.length > 1) result.push(run);
      run = fits(line) ? [line] : [];
    }
  }
  if (run.length > 1) result.push(run);
  return result;
}

/**
 * Declarações que a spec escreve em tabela. Fica restrito a elas porque
 * alinhar faz uma linha nova mexer nas vizinhas, e o diff de PR é a leitura
 * principal da planta (P5).
 */
// Só no nível superior: `layer` também abre sujeito de regra, e `actor`, instrução de processo.
const ALIGNED = new Set([PlantaLexer.LAYER, PlantaLexer.ACTOR]);

/** `layer apresentacao match ...` / `layer infra    match ...`: alinha o que vem depois do nome. */
function alignColumns(lines: Line[]): void {
  const fits = (l: Line) =>
    l.level === 0 && !l.continuation && l.tokens.length >= 3 && ALIGNED.has(l.tokens[0]!.type) &&
    l.gaps[2] === " " && !COMMENTS.has(l.tokens[2]!.type);

  for (const run of runs(lines, fits)) {
    // Só alinha declarações da mesma palavra-chave.
    for (const group of groupWhile(run, (a, b) => a.tokens[0]!.text === b.tokens[0]!.text)) {
      if (group.length < 2) continue;
      const width = (l: Line) => l.tokens[0]!.text!.length + l.gaps[1]!.length + l.tokens[1]!.text!.length;
      const column = Math.max(...group.map(width));
      for (const l of group) l.gaps[2] = " ".repeat(column - width(l) + 1);
    }
  }
}

/** Comentários `//` no fim de linhas vizinhas começam na mesma coluna. */
function alignTrailingComments(lines: Line[]): void {
  const fits = (l: Line) => l.tokens.length > 1 && l.tokens.at(-1)!.type === PlantaLexer.LINE_COMMENT;
  for (const run of runs(lines, fits)) {
    const width = (l: Line) => render({ ...l, tokens: l.tokens.slice(0, -1), gaps: l.gaps.slice(0, -1) }).length;
    const column = Math.max(...run.map(width));
    for (const l of run) l.gaps[l.gaps.length - 1] = " ".repeat(column - width(l) + 1);
  }
}

function groupWhile<T>(items: T[], same: (a: T, b: T) => boolean): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && same(last.at(-1)!, item)) last.push(item);
    else groups.push([item]);
  }
  return groups;
}

function collectStatementStarts(node: ParseTree, starts: Set<number>): void {
  if (node instanceof TerminalNode) {
    if (node.symbol.type === PlantaLexer.DOC_COMMENT) starts.add(node.symbol.tokenIndex);
    return;
  }
  if (!(node instanceof ParserRuleContext)) return;
  if (node.start && STATEMENTS.some((cls) => node instanceof cls)) starts.add(node.start.tokenIndex);
  // Valores de enum um por linha não são continuação.
  if (node instanceof P.EnumDeclContext) for (const n of node.name().slice(1)) starts.add(n.start!.tokenIndex);
  if (node instanceof P.AggregateDeclContext) for (const c of node.CONTAINS()) starts.add(c.symbol.tokenIndex);
  for (let i = 0; i < node.getChildCount(); i++) collectStatementStarts(node.getChild(i)!, starts);
}

/** Agrupa tokens pela linha onde começam no arquivo original. */
function groupByLine(tokens: Token[]): Token[][] {
  const lines: Token[][] = [];
  for (const token of tokens) {
    const current = lines.at(-1);
    if (current && current[0]!.line === token.line) current.push(token);
    else lines.push([token]);
  }
  return lines;
}

/** Texto do token quando ele é pontuação ou palavra-chave; `undefined` para strings e comentários. */
function punct(token: Token): string | undefined {
  return OPAQUE.has(token.type) ? undefined : token.text;
}

function spaced(prev: Token, cur: Token, next: Token | undefined): boolean {
  const a = punct(prev);
  const b = punct(cur);

  if (a === "{") return b !== "}";
  if (b === "}") return a !== "{";
  if (a === "(" || a === "[" || a === "." || a === "@" || a === "#[" || a === "<") return false;
  if (b === "," || b === ")" || b === "]" || b === "." || b === ":" || b === "?" || b === ">" || b === "(" || b === "<") {
    return false;
  }
  // `Tipo[]` cola; `roles [a, b]` não.
  if (b === "[") return punct(next!) !== "]";
  return true;
}
