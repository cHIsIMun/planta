// Extrator `imports` (seção 10.3): de que arquivo do projeto cada arquivo
// depende. É a dependência real mais básica, e a que as regras de camada e de
// contexto (seção 6.17) usam quando não há injeção nem chamada declarada.
//
// Só imports que resolvem para arquivos do próprio projeto viram fato:
// pacotes de terceiros não são arquitetura da planta.

import { posix } from "node:path";
import type { Node } from "web-tree-sitter";
import { lineOf, type SourceFile, stringValue } from "../code/typescript.ts";
import type { Extractor, Fact } from "../facts.ts";

const TS_EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"];

export const imports: Extractor = {
  name: "imports",
  extract(files) {
    const paths = new Set(files.map((f) => f.path));
    const facts = new Map<string, Fact>();
    for (const file of files) {
      const found = file.language === "python" ? pythonImports(file, paths) : file.language === "typescript" ? tsImports(file, paths) : [];
      for (const { to, line } of found) {
        if (to === file.path) continue;
        const id = `import:${file.path}->${to}`;
        if (!facts.has(id)) facts.set(id, { id, kind: "import", extractor: "imports", location: { file: file.path, line }, data: { from: file.path, to } });
      }
    }
    return [...facts.values()];
  },
};

function tsImports(file: SourceFile, paths: Set<string>): { to: string; line: number }[] {
  const out: { to: string; line: number }[] = [];
  const add = (spec: string | undefined, node: Node) => {
    if (!spec?.startsWith(".")) return; // pacote, alias ou absoluto: fora do projeto
    const base = posix.normalize(posix.join(posix.dirname(file.path), spec));
    // `./x.js` em projetos ESM aponta para `./x.ts`.
    const candidates = [base, base.replace(/\.(m|c)?js$/, ""), base.replace(/\.jsx$/, "")];
    const to = candidates.flatMap((c) => TS_EXTENSIONS.map((ext) => c + ext)).find((p) => paths.has(p));
    if (to) out.push({ to, line: lineOf(node) });
  };
  const walk = (node: Node) => {
    if (node.type === "import_statement" || node.type === "export_statement") {
      const source = node.childForFieldName("source");
      if (source) add(stringValue(source), node);
    } else if (node.type === "call_expression") {
      const fn = node.childForFieldName("function");
      if (fn?.text === "require" || fn?.type === "import") add(stringValue(node.childForFieldName("arguments")?.namedChildren[0] ?? undefined), node);
    }
    for (const c of node.namedChildren) if (c) walk(c);
  };
  walk(file.tree.rootNode);
  return out;
}

/** `from .models import X`, `from vendas.models import X`, `import vendas.models`. */
function pythonImports(file: SourceFile, paths: Set<string>): { to: string; line: number }[] {
  const out: { to: string; line: number }[] = [];
  const resolve = (module: string, node: Node) => {
    const dots = /^\.*/.exec(module)![0].length;
    const name = module.slice(dots).replace(/\./g, "/");
    const bases = dots > 0
      ? [posix.join(posix.dirname(file.path), ...Array(dots - 1).fill(".."), name)]
      // Absoluto: relativo a alguma pasta do projeto (a raiz do Django, por exemplo).
      : [...new Set([...paths].map((p) => p.split("/")).flatMap((parts) => parts.map((_, i) => parts.slice(0, i).join("/"))))].map((root) => posix.join(root, name));
    for (const base of bases) {
      const to = [`${base}.py`, `${base}/__init__.py`].map((p) => posix.normalize(p)).find((p) => paths.has(p));
      if (to) return out.push({ to, line: lineOf(node) });
    }
    return undefined;
  };
  for (const node of file.tree.rootNode.descendantsOfType(["import_statement", "import_from_statement"])) {
    if (!node) continue;
    if (node.type === "import_from_statement") {
      const module = node.childForFieldName("module_name")?.text ?? "";
      // `from . import views`: o módulo é o nome importado.
      if (/^\.+$/.test(module)) {
        for (const n of node.childrenForFieldName("name")) if (n) resolve(`${module}${n.text.split(" ")[0]}`, node);
      } else {
        resolve(module, node);
      }
    } else {
      for (const n of node.childrenForFieldName("name")) if (n) resolve(n.text.split(" ")[0]!, node);
    }
  }
  return out;
}
