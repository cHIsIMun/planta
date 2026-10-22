// Requisitos e decisões em Markdown (seções 6.15 e 14.1). Três formas, que
// podem coexistir: título com ID (`## REQ-001 Título`), front matter com `id`
// (um requisito por arquivo) e seção sem ID, declarada na planta com
// `requirement Nome @"md:caminho#slug"`.

import { parse as parseYaml } from "yaml";
import { hash } from "../code/typescript.ts";

export interface Section {
  level: number;
  title: string;
  /** Âncora no estilo do GitHub: `## Cadastro de cliente` → `cadastro-de-cliente`. */
  slug: string;
  /** Linha do título, a partir de 1. */
  line: number;
  /** Texto da seção (sem o título), até o próximo título de nível igual ou maior. */
  text: string;
}

export interface MarkdownDoc {
  path: string;
  frontMatter: Record<string, unknown>;
  /** Texto do arquivo inteiro, sem o front matter. */
  body: string;
  /** Linha onde o corpo começa. */
  bodyLine: number;
  sections: Section[];
}

export interface DocItem {
  /** `REQ-001`, ou o nome do elemento quando declarado na planta. */
  id: string;
  kind: "requirement" | "decision";
  title: string;
  file: string;
  line: number;
  slug?: string;
  /** Texto normalizado; é dele que sai a impressão digital. */
  text: string;
  /** Texto legível, sem os blocos injetados, para o diff de `planta review`. */
  display: string;
  fingerprint: string;
  /** Front matter (`status`, `priority`, `owner`...). */
  attributes: Record<string, unknown>;
}

export function parseMarkdown(path: string, source: string): MarkdownDoc {
  const text = source.replace(/\r\n?/g, "\n");
  let frontMatter: Record<string, unknown> = {};
  let body = text;
  let bodyLine = 1;
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (fm) {
    const parsed = parseYaml(fm[1]!);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) frontMatter = parsed as Record<string, unknown>;
    body = text.slice(fm[0].length);
    bodyLine = fm[0].split("\n").length;
  }

  const lines = body.split("\n");
  const headings: { level: number; title: string; index: number }[] = [];
  let fence: string | undefined;
  lines.forEach((line, index) => {
    const f = /^\s*(```|~~~)/.exec(line);
    if (f) fence = fence === f[1] ? undefined : fence ?? f[1];
    if (fence) return;
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) headings.push({ level: h[1]!.length, title: h[2]!, index });
  });

  const sections = headings.map((h, i) => {
    const end = headings.slice(i + 1).find((n) => n.level <= h.level)?.index ?? lines.length;
    return {
      level: h.level,
      title: h.title,
      slug: slugify(h.title),
      line: bodyLine + h.index,
      text: lines.slice(h.index + 1, end).join("\n"),
    };
  });
  return { path, frontMatter, body, bodyLine, sections };
}

/** Slug do GitHub: minúsculas, sem pontuação, espaços viram hífen. Acentos ficam. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

/**
 * Texto para a impressão digital (seção 14.2): sem formatação Markdown, sem
 * comentários HTML e sem os blocos que a própria Planta injeta, com espaços
 * colapsados. Reformatar o requisito não conta como mudança; mudar o que ele
 * diz conta.
 */
const INJECTED = /<!--\s*planta:(trace|view)[\s\S]*?<!--\s*\/planta:\1\s*-->/g;

export function normalizeText(text: string): string {
  return text
    .replace(INJECTED, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/^\s*(#{1,6}|[-+*]|\d+\.|>)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Requisitos ou decisões com ID que casa com `idPattern` (títulos ou front matter). */
export function discover(doc: MarkdownDoc, idPattern: RegExp, kind: DocItem["kind"]): DocItem[] {
  const items: DocItem[] = [];
  const anchored = new RegExp(`^(${idPattern.source})\\b[\\s:.—–-]*(.*)$`, idPattern.flags.replace("g", ""));

  const fmId = doc.frontMatter.id;
  if (typeof fmId === "string" && anchored.test(fmId)) {
    const firstHeading = doc.sections[0];
    const title = typeof doc.frontMatter.title === "string" ? doc.frontMatter.title : firstHeading?.title ?? fmId;
    items.push(item(fmId, kind, title, doc.path, 1, undefined, doc.body, doc.frontMatter));
  }

  for (const s of doc.sections) {
    const m = anchored.exec(s.title);
    if (!m) continue;
    items.push(item(m[1]!, kind, m[m.length - 1] || s.title, doc.path, s.line, s.slug, s.text, attributesIn(s.text)));
  }
  return items;
}

/** Seção apontada por uma âncora `md:` (ou o arquivo inteiro, sem `#slug`). */
export function sectionFor(doc: MarkdownDoc, slug: string | undefined, id: string, kind: DocItem["kind"]): DocItem | undefined {
  if (!slug) {
    const title = typeof doc.frontMatter.title === "string" ? doc.frontMatter.title : doc.sections[0]?.title ?? id;
    return item(id, kind, title, doc.path, 1, undefined, doc.body, doc.frontMatter);
  }
  const s = doc.sections.find((x) => x.slug === slug);
  return s && item(id, kind, s.title, doc.path, s.line, s.slug, s.text, attributesIn(s.text));
}

function item(
  id: string,
  kind: DocItem["kind"],
  title: string,
  file: string,
  line: number,
  slug: string | undefined,
  raw: string,
  attributes: Record<string, unknown>,
): DocItem {
  const text = normalizeText(raw);
  const display = raw.replace(INJECTED, "").replace(/\n{3,}/g, "\n\n").trim();
  return { id, kind, title: title.trim(), file, line, ...(slug && { slug }), text, display, fingerprint: hash(text), attributes };
}

/** Atributos no corpo de uma seção de ADR: `Status: superseded` numa linha própria. */
function attributesIn(text: string): Record<string, unknown> {
  const status = /^\s*(?:\*\*)?status(?:\*\*)?\s*:\s*(?:\*\*)?([\p{L}-]+)/imu.exec(text);
  return status ? { status: status[1]!.toLowerCase() } : {};
}
