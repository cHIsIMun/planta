// Extrator Next.js (seção 10.3): a árvore de arquivos é o roteador.
//
// App Router (`app/`): `page.tsx` é rota de página; `route.ts` exporta os
// handlers HTTP (`GET`, `POST`...). Grupos `(marketing)` não entram no
// caminho; `[slug]` vira `:slug`; `[...x]` e `[[...x]]`, `*`; pastas `_x` são
// privadas. Pages Router (`pages/`): cada arquivo é uma rota; `pages/api/` são
// endpoints. Componentes, renderização e chamadas HTTP ficam com o extrator
// `react`, que pode rodar na mesma pasta.

import { hash, lineOf, listSymbols, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, HttpEndpointData } from "../facts.ts";
import { normalizeRoute } from "../facts.ts";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const PAGE = /^page\.(tsx|jsx|ts|js)$/;
const ROUTE = /^route\.(ts|js)$/;
const SPECIAL_PAGES = new Set(["_app", "_document", "_error", "404", "500"]);

export const nextjs: Extractor = {
  name: "nextjs",
  extract(files) {
    const facts: Fact[] = [];
    for (const file of files.filter((f) => f.language === "typescript")) {
      const parts = file.path.split("/");
      const app = parts.lastIndexOf("app");
      const pages = parts.lastIndexOf("pages");
      if (app >= 0 && app > pages) facts.push(...appRouter(file, parts.slice(app + 1)));
      else if (pages >= 0) facts.push(...pagesRouter(file, parts.slice(pages + 1)));
    }
    return facts;
  },
};

/** Segmentos de pasta → caminho de rota; `undefined` para pastas privadas e slots paralelos. */
function routePath(dirs: string[]): string | undefined {
  const out: string[] = [];
  for (const d of dirs) {
    if (d.startsWith("_") || d.startsWith("@")) return undefined;
    if (/^\(.*\)$/.test(d)) continue;
    if (/^\[\[?\.\.\./.test(d)) out.push("*");
    else if (/^\[.*\]$/.test(d)) out.push(`:${d.slice(1, -1)}`);
    else out.push(d);
  }
  return normalizeRoute(out.join("/"));
}

function appRouter(file: SourceFile, rest: string[]): Fact[] {
  const name = rest.at(-1)!;
  const path = routePath(rest.slice(0, -1));
  if (path === undefined) return [];
  if (PAGE.test(name)) return page(file, path);
  if (!ROUTE.test(name)) return [];
  const exported = new Set(listSymbols(file).map((s) => s.name));
  return METHODS.filter((m) => exported.has(m)).map((m) => endpoint(file, m, path, m));
}

function pagesRouter(file: SourceFile, rest: string[]): Fact[] {
  const base = rest.at(-1)!.replace(/\.(tsx|jsx|ts|js)$/, "");
  if (SPECIAL_PAGES.has(base)) return [];
  const dirs = [...rest.slice(0, -1), ...(base === "index" ? [] : [base])];
  const path = routePath(dirs);
  if (path === undefined) return [];
  // `pages/api/*`: o handler padrão atende qualquer método.
  if (dirs[0] === "api") return [endpoint(file, "ALL", path, defaultComponent(file) ?? "default")];
  return page(file, path);
}

/** Componente exportado por padrão: `export default function Home()` → `Home`. */
function defaultComponent(file: SourceFile): string | undefined {
  const symbols = listSymbols(file);
  const def = symbols.find((s) => s.name === "default");
  return def ? symbols.find((s) => s !== def && s.node === def.node)?.name ?? "default" : undefined;
}

function page(file: SourceFile, path: string): Fact[] {
  const component = defaultComponent(file);
  if (!component) return [];
  const location = { file: file.path, symbol: component, line: 1 };
  return [
    { id: `ui.route:${path}`, kind: "ui.route", extractor: "nextjs", location, data: { path, component, guards: [] } },
    { id: `ui.page:${file.path}#${component}`, kind: "ui.page", extractor: "nextjs", location, data: { name: component } },
  ];
}

function endpoint(file: SourceFile, method: string, path: string, handler: string): Fact {
  const symbol = listSymbols(file).find((s) => s.name === handler);
  const data: HttpEndpointData = { method, path, handler, params: [...path.matchAll(/:([^/]+)/g)].map((m) => ({ name: m[1]!, in: "path" })), responses: [{ status: 200 }], guards: [] };
  return {
    id: `http.endpoint:${method}:${path}`,
    kind: "http.endpoint",
    extractor: "nextjs",
    location: { file: file.path, symbol: handler, line: symbol ? lineOf(symbol.node) : 1 },
    // Os parâmetros (`request`, `{ params }`) são do framework, não do contrato: sem PL417.
    data: { ...data, frameworkHandler: true },
    fingerprint: { signature: hash(`${method} ${path}`), signatureText: `${method} ${path}` },
  };
}

