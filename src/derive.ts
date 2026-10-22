// Fase 6: informação implícita que não depende do código. Âncoras resolvidas
// para caminhos do projeto (com a herança de operações), camada de cada
// elemento (`in layer` ou `match`), metadados normalizados e `owner` herdado.

import { matchesGlob, posix } from "node:path";
import type * as A from "./ast.ts";
import { resourceType } from "./catalog/resources.ts";
import { type Diagnostic } from "./diagnostics.ts";
import type { Links } from "./link.ts";
import type { MergedModel } from "./merge.ts";
import type { ElementSymbol, SymbolTable } from "./symbols.ts";

/** Esquemas cuja âncora é `caminho#fragmento`; os demais são um endereço opaco. */
const PATH_SCHEMES = new Set(["code", "md", "openapi", "sql"]);

export interface ResolvedAnchor {
  raw: string;
  scheme: string;
  /** Relativo à raiz do projeto, sem `/` inicial. */
  path?: string;
  /** Símbolo de código, seção Markdown, operação OpenAPI ou objeto SQL. */
  symbol?: string;
  /** Endereço em esquemas sem caminho: `tf:`, `k8s:`, `compose:`... */
  address?: string;
  /** Operação sem âncora própria que herdou a do componente (seção 6.10). */
  inherited?: true;
}

export interface ElementMeta {
  owner?: string;
  status: "planned" | "active" | "deprecated" | "experimental";
  tags: string[];
  since?: string;
  stereotype?: string;
  ignore?: { category: string; reason?: string }[];
  /** Anotações fora do vocabulário padrão, preservadas para plugins. */
  annotations?: { name: string; args: A.Literal[] }[];
}

export interface Derived {
  anchors: Map<string, ResolvedAnchor>;
  layers: Map<string, string>;
  meta: Map<string, ElementMeta>;
  /** Pasta base (sem `/` inicial) para âncoras relativas de cada elemento. */
  roots: Map<string, string>;
}

const STATUSES = new Set(["planned", "active", "deprecated", "experimental"]);
const MODIFIERS = new Set([
  "key", "unique", "index", "max", "min", "precision", "default",
  "inverse", "cascade", "readonly", "computed", "sensitive",
]);
const IGNORE_CATEGORIES = new Set(["drift", "coverage"]);

export function derive(
  model: MergedModel,
  table: SymbolTable,
  links: Links,
): { derived: Derived; diagnostics: Diagnostic[] } {
  const derived: Derived = { anchors: new Map(), layers: new Map(), meta: new Map(), roots: new Map() };
  const diagnostics: Diagnostic[] = [];
  const layers = model.decls.filter((d): d is A.LayerDecl => d.kind === "layer");

  // A tabela registra pais antes dos filhos, então o pai já está derivado.
  for (const symbol of table.symbols.values()) {
    const { id, decl } = symbol;
    const parent = symbol.parent;

    const ownRoot = (decl.kind === "context" || decl.kind === "app") && decl.root;
    const root = ownRoot ? stripSlash(ownRoot) : parent ? derived.roots.get(parent) : undefined;
    if (root !== undefined) derived.roots.set(id, root);

    const meta = normalizeMeta(decl.meta, diagnostics);
    meta.owner ??= parent ? derived.meta.get(parent)?.owner : undefined;
    if (meta.owner === undefined) delete meta.owner;
    if (decl.kind === "field") fieldModifiers(decl, meta, diagnostics);
    derived.meta.set(id, meta);

    const anchor = anchorOf(symbol, root, parent ? derived.anchors.get(parent) : undefined);
    if (anchor) derived.anchors.set(id, anchor);

    const layer = layerOf(decl, anchor, layers, links);
    if (layer) derived.layers.set(id, layer);

    if ((decl.kind === "node" || decl.kind === "group") && decl.resourceType && !resourceType(decl.resourceType)) {
      diagnostics.push({ code: "PL150", severity: "warning", message: `tipo de recurso \`${decl.resourceType}\` não está no catálogo; use generic.${decl.resourceType.split(".").at(-1)} se for intencional`, loc: decl.loc });
    }
  }

  return { derived, diagnostics };
}

function anchorOf(symbol: ElementSymbol, root: string | undefined, parent: ResolvedAnchor | undefined): ResolvedAnchor | undefined {
  const decl = symbol.decl;
  const own = "anchor" in decl ? decl.anchor : undefined;
  if (own) return parseAnchor(own.raw, root, parent);

  // Operação sem âncora: arquivo do componente, símbolo `Componente.op`.
  if (decl.kind === "op" && parent?.scheme === "code" && parent.symbol) {
    return {
      raw: `${parent.path ?? ""}#${parent.symbol}.${symbol.name}`,
      scheme: "code",
      ...(parent.path !== undefined && { path: parent.path }),
      symbol: `${parent.symbol}.${symbol.name}`,
      inherited: true,
    };
  }
  return undefined;
}

export function parseAnchor(raw: string, root: string | undefined, parent?: ResolvedAnchor): ResolvedAnchor {
  const match = /^([a-z][a-z0-9-]*):(.*)$/.exec(raw);
  const scheme = match ? match[1]! : "code";
  const rest = match ? match[2]! : raw;

  if (!PATH_SCHEMES.has(scheme)) return { raw, scheme, address: rest };

  const hash = rest.indexOf("#");
  const file = hash < 0 ? rest : rest.slice(0, hash);
  const symbol = hash < 0 ? undefined : rest.slice(hash + 1);

  // `#Simbolo` sem caminho: mesmo arquivo da âncora do pai.
  const path = file === "" ? parent?.path : resolvePath(file, root);
  return {
    raw,
    scheme,
    ...(path !== undefined && { path }),
    ...(symbol && { symbol }),
  };
}

/**
 * Texto de âncora para `file#symbol` (caminho relativo à raiz do projeto):
 * relativo ao `root` do elemento quando o arquivo está sob ele, absoluto senão.
 */
export function anchorText(file: string, symbol: string, root: string | undefined): string {
  return `${root && file.startsWith(`${root}/`) ? file.slice(root.length + 1) : `/${file}`}#${symbol}`;
}

/** `/x` é relativo à raiz do projeto; o resto, ao `root` mais próximo. */
function resolvePath(file: string, root: string | undefined): string {
  return file.startsWith("/") ? stripSlash(posix.normalize(file)) : posix.normalize(root ? posix.join(root, file) : file);
}

function stripSlash(path: string): string {
  return path.replace(/^\/+/, "");
}

/**
 * `in layer` explícito vence; senão, a primeira camada (na ordem de
 * declaração) cujo `match` casa com o arquivo da âncora.
 */
function layerOf(
  decl: ElementSymbol["decl"],
  anchor: ResolvedAnchor | undefined,
  layers: A.LayerDecl[],
  links: Links,
): string | undefined {
  if ("layer" in decl && decl.layer) {
    const resolved = links.get(decl.layer);
    return resolved?.kind === "element" ? resolved.id : undefined;
  }
  if (anchor?.scheme !== "code" || !anchor.path) return undefined;
  const path = anchor.path;
  return layers.find((l) => l.match.some((glob) => matchesGlob(path, glob)))?.name.name;
}

function normalizeMeta(meta: A.Meta, diagnostics: Diagnostic[]): ElementMeta {
  const result: ElementMeta = { status: "active", tags: [] };
  const unknown: { name: string; args: A.Literal[] }[] = [];
  let status: A.Annotation | undefined;

  for (const a of meta.annotations) {
    const first = a.args[0];
    const text = first && first.kind !== "bool" ? String(first.value) : undefined;
    switch (a.name) {
      case "owner":
        // Em contexto mesclado, vale o primeiro `owner`.
        result.owner ??= text;
        break;
      case "tag":
        for (const arg of a.args) if (arg.kind !== "bool") result.tags.push(String(arg.value));
        break;
      case "status":
        if (status) {
          diagnostics.push(warning(`\`status\` repetido; vale \`${result.status}\``, a.loc));
        } else if (text && STATUSES.has(text)) {
          status = a;
          result.status = text as ElementMeta["status"];
        } else {
          diagnostics.push(warning(`status desconhecido \`${text ?? ""}\`; use ${[...STATUSES].join(", ")}`, a.loc));
        }
        break;
      case "since":
        if (text) result.since = text;
        break;
      case "stereotype":
        if (text) result.stereotype = text;
        break;
      case "ignore": {
        const reason = a.args[1]?.kind === "string" ? a.args[1].value : undefined;
        if (!text || !IGNORE_CATEGORIES.has(text)) {
          diagnostics.push(warning(`\`ignore\` aceita ${[...IGNORE_CATEGORIES].join(" ou ")}`, a.loc));
          break;
        }
        if (!reason) diagnostics.push(warning(`\`ignore(${text})\` exige justificativa: ignore(${text}, "motivo")`, a.loc));
        (result.ignore ??= []).push({ category: text, ...(reason && { reason }) });
        break;
      }
      default:
        diagnostics.push(warning(`anotação desconhecida \`${a.name}\``, a.loc));
        unknown.push({ name: a.name, args: a.args });
    }
  }
  if (unknown.length > 0) result.annotations = unknown;
  return result;
}

function fieldModifiers(field: A.FieldDecl, meta: ElementMeta, diagnostics: Diagnostic[]): void {
  for (const m of field.modifiers) {
    if (!MODIFIERS.has(m.name)) diagnostics.push(warning(`modificador desconhecido \`${m.name}\``, m.loc));
    // `sensitive` é atalho para `tag(pii)` no campo (seção 6.9).
    if (m.name === "sensitive" && !meta.tags.includes("pii")) meta.tags.push("pii");
  }
}

function warning(message: string, loc: A.Loc): Diagnostic {
  return { code: "PL103", severity: "warning", message, loc };
}
