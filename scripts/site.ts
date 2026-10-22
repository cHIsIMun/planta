// Site de documentação (GitHub Pages): a especificação dividida em uma página
// por seção, com a página inicial. Gera `_site/`; `pnpm run site` e abrir
// `_site/index.html`.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Lexer, Marked, type Token, type Tokens } from "marked";
import { bundledLanguages, createHighlighter, type LanguageRegistration } from "shiki";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");
const REPO = "https://github.com/cHIsIMun/planta";
const VERSION: string = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;

const plantaGrammar = JSON.parse(readFileSync(join(ROOT, "editors/vscode/syntaxes/planta.tmLanguage.json"), "utf8")) as LanguageRegistration;
const LANGS = ["typescript", "ts", "yaml", "json", "python", "console", "shellsession", "markdown", "scheme", "bash", "sh"].filter((l) => l in bundledLanguages);
const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: [...new Set(LANGS), { ...plantaGrammar, name: "planta" }],
});
const loaded = new Set(highlighter.getLoadedLanguages());

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s: string) => s.replace(/`([^`]*)`/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
/** Âncora no estilo do GitHub, usada pelos links da própria especificação. */
const githubSlug = (s: string) => plain(s).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
/** Âncora e nome de arquivo sem acentos. */
const asciiSlug = (s: string) => githubSlug(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");

function highlight(code: string, lang: string, decorations: { start: number; end: number; class: string }[] = []): string {
  const language = lang === "console" && !loaded.has("console") ? "shellsession" : lang;
  if (!loaded.has(language)) return `<pre class="shiki"><code>${escape(code)}</code></pre>`;
  return highlighter.codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    decorations: decorations.map((d) => ({ start: d.start, end: d.end, properties: { class: d.class } })),
  });
}

// ---------------------------------------------------------------------
//  Especificação → seções
// ---------------------------------------------------------------------

interface Heading { depth: number; text: string; id: string }
interface Section { number: string; title: string; slug: string; tokens: Token[]; headings: Heading[] }

const source = readFileSync(join(ROOT, "planta-especificacao.md"), "utf8");
const tokens = Lexer.lex(source);
const sections: Section[] = [];
const preamble: Token[] = [];
let inSummary = false;
for (const token of tokens) {
  const heading = token.type === "heading" ? (token as Tokens.Heading) : undefined;
  const numbered = heading?.depth === 2 && /^(\d+)\.\s+(.*)$/.exec(heading.text);
  if (numbered) {
    sections.push({ number: numbered[1]!, title: numbered[2]!, slug: asciiSlug(`${numbered[1]} ${numbered[2]}`), tokens: [], headings: [] });
    continue;
  }
  if (sections.length > 0) {
    sections.at(-1)!.tokens.push(token);
    continue;
  }
  if (heading?.depth === 1 || token.type === "hr") continue;
  if (heading?.text === "Sumário") inSummary = true;
  else if (!inSummary) preamble.push(token);
}
sections[0]!.tokens.unshift(...preamble);

// Destinos dos links: `#9-âncoras-...` (GitHub) e `seção 9.3` → página#âncora.
const targets = new Map<string, string>();
const numbers = new Map<string, string>();
for (const s of sections) {
  const page = `${s.slug}.html`;
  targets.set(githubSlug(`${s.number}. ${s.title}`), page);
  numbers.set(s.number, page);
  const used = new Set<string>();
  for (const t of s.tokens) {
    if (t.type !== "heading") continue;
    const h = t as Tokens.Heading;
    let id = asciiSlug(h.text) || "secao";
    for (let i = 1; used.has(id); i++) id = `${asciiSlug(h.text)}-${i}`;
    used.add(id);
    s.headings.push({ depth: h.depth, text: plain(h.text), id });
    targets.set(githubSlug(h.text), `${page}#${id}`);
    const n = /^(\d+(?:\.\d+)+)\.?\s/.exec(h.text)?.[1];
    if (n) numbers.set(n, `${page}#${id}`);
  }
}

/** `seção 9.3` no texto vira link; fora de código e de links já existentes. */
function linkSections(text: string): string {
  return text.replace(/(?<![[\w])([Ss]eç(?:ão|ões))\s+(\d+(?:\.\d+)*)(?![\d\]])/g, (all, word: string, n: string) => (sectionHref(n) ? `[${word} ${n}](§${n})` : all));
}

/** Destino da seção `9.3`; sem âncora própria, o da seção que a contém. */
function sectionHref(n: string): string | undefined {
  let key = n;
  while (!numbers.has(key) && key.includes(".")) key = key.slice(0, key.lastIndexOf("."));
  return numbers.get(key);
}

function renderSection(s: Section): string {
  let index = 0;
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const h = s.headings[index++]!;
        const level = Math.min(depth, 6);
        return `<h${level} id="${h.id}"><a class="hash" href="#${h.id}" aria-label="Link para esta seção"></a>${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      code({ text, lang }) {
        const language = (lang ?? "").trim().split(/\s/)[0]!;
        if (language === "mermaid") return `<pre class="mermaid">${escape(text)}</pre>\n`;
        return `<div class="code">${language && language !== "text" ? `<span class="lang">${escape(language)}</span>` : ""}${highlight(text, language)}</div>\n`;
      },
      link({ href, title, tokens }) {
        let target = href;
        if (href.startsWith("§")) target = sectionHref(href.slice(1)) ?? "#";
        else if (href.startsWith("#")) target = targets.get(decodeURIComponent(href.slice(1))) ?? href;
        const external = /^https?:/.test(target);
        return `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ""}${external ? ' rel="noopener"' : ""}>${this.parser.parseInline(tokens)}</a>`;
      },
      table(token) {
        const cell = (c: Tokens.TableCell, tag: string) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        const head = `<tr>${token.header.map((c) => cell(c, "th")).join("")}</tr>`;
        const body = token.rows.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("\n");
        return `<div class="table"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });
  // Reescreve `seção N` só no texto (fora de blocos e trechos de código).
  const markdown = s.tokens.map((t) => {
    if (t.type === "code" || t.type === "heading") return t.raw;
    return t.raw.split(/(`[^`]*`)/).map((part, i) => (i % 2 === 0 ? linkSections(part) : part)).join("");
  }).join("");
  return marked.parse(markdown) as string;
}

// ---------------------------------------------------------------------
//  Páginas
// ---------------------------------------------------------------------

const LOGO = `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 13.5H11V21.5M11 2.5V8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 8a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.6 1.6"/></svg>`;
const FAVICON = `data:image/svg+xml,${encodeURIComponent(LOGO.replace('class="logo"', 'xmlns="http://www.w3.org/2000/svg"').replace(/currentColor/g, "#3461c1"))}`;

function layout(options: { title: string; description: string; body: string; page: "home" | "docs"; mermaid?: boolean }): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escape(options.title)}</title>
<meta name="description" content="${escape(options.description)}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${FAVICON}">
<link rel="stylesheet" href="assets/site.css">
</head>
<body class="${options.page}">
<header class="bar">
  <div class="bar-inner">
    ${options.page === "docs" ? `<button class="menu" type="button" aria-expanded="false" aria-controls="nav" aria-label="Seções"><span></span><span></span></button>` : ""}
    <a class="brand" href="index.html">${LOGO}<span>Planta</span></a>
    <nav class="top" aria-label="Principal">
      <a href="${sections[0]!.slug}.html"${options.page === "docs" ? ' aria-current="true"' : ""}>Especificação</a>
      <a href="${sections.find((s) => s.number === "5")!.slug}.html">Guia rápido</a>
      <a href="${REPO}" rel="noopener">GitHub</a>
    </nav>
  </div>
</header>
${options.body}
<script src="assets/indice.js" defer></script>
<script src="assets/site.js" defer></script>
${options.mermaid ? `<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";const dark=matchMedia("(prefers-color-scheme: dark)").matches;mermaid.initialize({startOnLoad:true,theme:dark?"dark":"neutral",fontFamily:"inherit"});</script>` : ""}
</body>
</html>
`;
}

function sidebar(current: Section): string {
  const items = sections.map((s) => `<li><a href="${s.slug}.html"${s === current ? ' aria-current="page"' : ""}><span class="n">${s.number}</span>${escape(plain(s.title))}</a></li>`).join("\n");
  return `<aside class="side" id="nav">
  <div class="search"><input type="search" placeholder="Buscar" aria-label="Buscar na especificação" autocomplete="off" spellcheck="false"><kbd>⌘K</kbd></div>
  <ol class="sections">${items}</ol>
  <ol class="results" hidden></ol>
</aside>`;
}

function docPage(s: Section, i: number): string {
  const content = renderSection(s);
  const toc = s.headings.filter((h) => h.depth === 3);
  const prev = sections[i - 1];
  const next = sections[i + 1];
  const pager = `<nav class="pager" aria-label="Seções vizinhas">
    ${prev ? `<a class="prev" href="${prev.slug}.html"><small>Anterior</small>${prev.number}. ${escape(plain(prev.title))}</a>` : "<span></span>"}
    ${next ? `<a class="next" href="${next.slug}.html"><small>Próxima</small>${next.number}. ${escape(plain(next.title))}</a>` : "<span></span>"}
  </nav>`;
  const body = `<div class="docs-grid">
${sidebar(s)}
<main class="doc" id="conteudo">
  <p class="crumb">Seção ${s.number}</p>
  <h1>${escape(plain(s.title))}</h1>
  ${content}
  ${pager}
</main>
${toc.length > 1 ? `<nav class="toc" aria-label="Nesta página"><p>Nesta página</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${escape(h.text)}</a></li>`).join("")}</ol></nav>` : "<div></div>"}
</div>
<footer class="foot"><p>Planta ${VERSION}. Licença MIT. <a href="${REPO}/blob/main/planta-especificacao.md" rel="noopener">Editar a especificação no GitHub</a></p></footer>`;
  return layout({
    title: `${plain(s.title)} · Planta`,
    description: `Especificação da Planta, seção ${s.number}: ${plain(s.title)}.`,
    body,
    page: "docs",
    mermaid: content.includes('class="mermaid"'),
  });
}

function homePage(): string {
  const planta = `context Vendas root "/apps/api/src/vendas" {
  service ClientesService @"clientes.service.ts#ClientesService" {
    op criar(dto: CriarClienteDto) -> Cliente justifiedBy "REQ-001"
    uses ClienteRepository
  }
}`;
  const code = `@Injectable()
export class ClientesService {
  constructor(private readonly repo: ClienteRepository) {}

  async criar(dto: CriarClienteDto): Promise<Cliente> {
    return this.repo.salvar(dto);
  }
}`;
  const anchor = '@"clientes.service.ts#ClientesService"';
  const at = planta.indexOf(anchor);
  const cls = code.indexOf("ClientesService");
  const page = (n: string) => `${sections.find((s) => s.number === n)!.slug}.html`;
  const install = `npm install -D \\
  ${REPO}/releases/download/v${VERSION}/planta-${VERSION}.tgz\nnpx planta check`;
  const body = `<main>
<section class="hero">
  <div class="wrap">
    <h1>A arquitetura descrita, conferida no código.</h1>
    <p class="lead">Planta é uma linguagem para escrever a arquitetura de um sistema: contextos, entidades, endpoints, processos, regras de dependência e infraestrutura. Cada elemento aponta para o código que o implementa, e o <code>planta check</code> avisa quando os dois deixam de concordar.</p>
    <p class="actions"><a class="button primary" href="${sections[0]!.slug}.html">Ler a especificação</a><a class="button" href="${page("5")}">Guia rápido</a></p>
  </div>
  <div class="wrap wide">
    <figure class="pair">
      <div class="pane"><p class="file">planta/vendas.planta</p>${highlight(planta, "planta", [{ start: at, end: at + anchor.length, class: "tie" }])}</div>
      <div class="pane"><p class="file">apps/api/src/vendas/clientes.service.ts</p>${highlight(code, "typescript", [{ start: cls, end: cls + "ClientesService".length, class: "tie" }])}</div>
      <figcaption>A âncora liga o serviço descrito à classe real. Se a classe mudar de nome, de assinatura ou deixar de existir, a verificação aponta onde.</figcaption>
    </figure>
  </div>
</section>

<section class="wrap steps">
  <div><h2>Descreva</h2><p>Arquivos <code>.planta</code> ficam no repositório, ao lado do código, com uma sintaxe pensada para ser lida em revisão de pull request.</p></div>
  <div><h2>Ancore</h2><p>Cada elemento aponta para uma classe, função, rota ou recurso de infraestrutura. Quando o projeto segue convenções, a âncora é inferida.</p></div>
  <div><h2>Confira</h2><p>Os extratores leem o código, o validador compara com a planta e, no CI, cada divergência vira uma anotação no PR.</p></div>
</section>

<section class="wrap more">
  <h2>Um modelo, várias saídas</h2>
  <p>Do mesmo modelo saem diagramas Mermaid e D2, a matriz de rastreabilidade de requisitos, OpenAPI 3.1 e Structurizr. Agentes de IA consultam a arquitetura pelo servidor MCP, e a extensão do VS Code traz diagnósticos, navegação e completar de âncoras.</p>
  <p class="stack">NestJS, TypeORM, React, Next.js, Django, FastAPI, Spring, Terraform, AWS CDK, Kubernetes e Docker Compose.</p>
</section>

<section class="wrap start">
  <h2>Comece</h2>
  <p>Requer Node.js 22. Instale no projeto e rode a verificação:</p>
  <div class="code">${highlight(install, "bash")}</div>
  <p class="links"><a href="${page("5")}">Guia rápido</a><a href="${page("6")}">Referência da linguagem</a><a href="${page("9")}">Âncoras</a><a href="${page("16")}">Linha de comando</a></p>
</section>
</main>
<footer class="foot"><p>Planta ${VERSION}. Licença MIT. <a href="${REPO}" rel="noopener">Código no GitHub</a></p></footer>`;
  return layout({ title: "Planta", description: "Linguagem de especificação arquitetural ancorada em código.", body, page: "home" });
}

// ---------------------------------------------------------------------
//  Saída
// ---------------------------------------------------------------------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
cpSync(join(ROOT, "scripts/site"), join(OUT, "assets"), { recursive: true });
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(join(OUT, "index.html"), homePage());
sections.forEach((s, i) => writeFileSync(join(OUT, `${s.slug}.html`), docPage(s, i)));

const index = sections.flatMap((s) => [
  { t: plain(s.title), s: `${s.number}`, u: `${s.slug}.html` },
  ...s.headings.filter((h) => h.depth === 3 || h.depth === 4).map((h) => ({ t: h.text, s: `${s.number}. ${plain(s.title)}`, u: `${s.slug}.html#${h.id}` })),
]);
writeFileSync(join(OUT, "assets/indice.js"), `window.PLANTA_INDICE=${JSON.stringify(index)};\n`);
console.log(`_site/: ${sections.length + 1} páginas, ${index.length} entradas de busca`);
