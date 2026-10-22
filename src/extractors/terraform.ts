// Extrator Terraform (seção 10.3): recursos (`iac.resource`) e referências
// entre eles (`iac.reference`), lidos do HCL com tree-sitter.
//
// Cada pasta com `.tf` que nenhum módulo local referencia é uma raiz (um
// ambiente: `envs/prod`); os módulos locais entram nela com o prefixo de
// endereço (`module.vpc.aws_vpc.this`), como no `terraform state`.

import { posix } from "node:path";
import type { Node } from "web-tree-sitter";
import { hash, lineOf, type SourceFile } from "../code/typescript.ts";
import type { IacFlavor } from "../catalog/resources.ts";
import type { Extractor, Fact } from "../facts.ts";

/** Dados de `iac.resource`, comuns a Terraform, CDK, Kubernetes e Compose. */
export interface IacResourceData {
  flavor: IacFlavor;
  /** Raiz (relativa à raiz do projeto) onde o endereço vale: pasta do ambiente, `cdk.out`, arquivo do Compose. */
  root: string;
  address: string;
  /** `aws_lb`, `module` ou `data.aws_ami`. */
  type: string;
  /** Atributos de nível superior: literais como valor, expressões como texto. */
  attributes: Record<string, string | number | boolean>;
  /** Atributos cujo valor é expressão (`var.x`, `aws_x.y.arn`): o valor real só se sabe no plano. */
  expressions: string[];
  /** Endereços referenciados pelos atributos. */
  references: string[];
}

interface Block {
  type: string;
  labels: string[];
  node: Node;
  file: SourceFile;
}

export const terraform: Extractor = {
  name: "terraform",
  extract(files) {
    const tf = files.filter((f) => f.language === "terraform");
    const byDir = new Map<string, SourceFile[]>();
    for (const f of tf) byDir.set(posix.dirname(f.path), [...(byDir.get(posix.dirname(f.path)) ?? []), f]);

    const modules = new Set<string>();
    for (const [dir, list] of byDir) {
      for (const b of list.flatMap(blocksOf)) {
        const source = b.type === "module" ? literal(attributeNode(b.node, "source")) : undefined;
        if (typeof source === "string" && source.startsWith(".")) modules.add(posix.normalize(posix.join(dir, source)));
      }
    }
    const facts: Fact[] = [];
    for (const dir of [...byDir.keys()].filter((d) => !modules.has(d)).sort()) facts.push(...expand(dir, dir, "", byDir, new Set()));
    return facts;
  },
};

function expand(root: string, dir: string, prefix: string, byDir: Map<string, SourceFile[]>, seen: Set<string>): Fact[] {
  if (seen.has(dir)) return [];
  seen = new Set([...seen, dir]);
  const facts: Fact[] = [];
  for (const b of (byDir.get(dir) ?? []).flatMap(blocksOf)) {
    let address: string;
    let type: string;
    if (b.type === "resource" && b.labels.length === 2) {
      [type, address] = [b.labels[0]!, `${b.labels[0]}.${b.labels[1]}`];
    } else if (b.type === "data" && b.labels.length === 2) {
      [type, address] = [`data.${b.labels[0]}`, `data.${b.labels[0]}.${b.labels[1]}`];
    } else if (b.type === "module" && b.labels.length === 1) {
      [type, address] = ["module", `module.${b.labels[0]}`];
    } else {
      continue;
    }
    const full = prefix + address;
    const { attributes, expressions, references } = attributesOf(b.node, prefix);
    const data: IacResourceData = { flavor: "terraform", root, address: full, type, attributes, expressions, references };
    // Assinatura: o que o recurso declara, em ordem estável. É o que a revisão (`planta.lock`) congela.
    const signatureText = [`${type} ${full}`, ...Object.keys(attributes).sort().map((k) => `${k} = ${JSON.stringify(attributes[k])}`), ...nestedBlocks(b.node).map((n) => `${n} { … }`)].join("\n");
    facts.push({
      id: `iac.resource:${root}:${full}`,
      kind: "iac.resource",
      extractor: "terraform",
      location: { file: b.file.path, symbol: full, line: lineOf(b.node) },
      data: { ...data },
      fingerprint: { signature: hash(signatureText), signatureText },
    });
    for (const to of references) {
      facts.push({ id: `iac.reference:${root}:${full}->${to}`, kind: "iac.reference", extractor: "terraform", location: { file: b.file.path, line: lineOf(b.node) }, data: { root, from: full, to } });
    }
    const source = b.type === "module" ? attributes.source : undefined;
    if (typeof source === "string" && source.startsWith(".")) {
      facts.push(...expand(root, posix.normalize(posix.join(dir, source)), `${full}.`, byDir, seen));
    }
  }
  return facts;
}

// ---------------------------------------------------------------------
//  HCL
// ---------------------------------------------------------------------

function blocksOf(file: SourceFile): Block[] {
  const body = file.tree.rootNode.namedChildren.find((c) => c?.type === "body");
  return (body?.namedChildren ?? []).flatMap((n): Block[] => {
    if (n?.type !== "block") return [];
    const type = n.namedChildren.find((c) => c?.type === "identifier")?.text ?? "";
    const labels = n.namedChildren.filter((c): c is Node => c?.type === "string_lit").map((c) => templateText(c));
    return [{ type, labels, node: n, file }];
  });
}

function blockBody(block: Node): Node | undefined {
  return block.namedChildren.find((c): c is Node => c?.type === "body");
}

function attributeNode(block: Node, name: string): Node | undefined {
  for (const a of blockBody(block)?.namedChildren ?? []) {
    if (a?.type === "attribute" && a.namedChildren[0]?.text === name) return a.namedChildren[1] ?? undefined;
  }
  return undefined;
}

function nestedBlocks(block: Node): string[] {
  return (blockBody(block)?.namedChildren ?? []).filter((c): c is Node => c?.type === "block").map((c) => c.namedChildren[0]?.text ?? "");
}

function attributesOf(block: Node, prefix: string): Pick<IacResourceData, "attributes" | "expressions" | "references"> {
  const attributes: IacResourceData["attributes"] = {};
  const expressions: string[] = [];
  const references = new Set<string>();
  const visit = (body: Node | undefined) => {
    for (const a of body?.namedChildren ?? []) {
      if (a?.type === "block") visit(blockBody(a));
      if (a?.type !== "attribute") continue;
      const [key, value] = a.namedChildren;
      if (!key || !value) continue;
      for (const r of referencesIn(value)) references.add(prefix + r);
      if (body !== blockBody(block)) continue; // atributos de blocos internos só contam para as referências
      const v = literal(value);
      if (v !== undefined) attributes[key.text] = v;
      else {
        attributes[key.text] = value.text;
        expressions.push(key.text);
      }
    }
  };
  visit(blockBody(block));
  return { attributes, expressions, references: [...references].sort() };
}

/** Valor de literal (`"x"`, `3`, `true`); `undefined` para expressões e strings com interpolação. */
function literal(node: Node | undefined): string | number | boolean | undefined {
  const lit = node?.type === "expression" ? node.namedChildren[0] : node;
  const value = lit?.type === "literal_value" ? lit.namedChildren[0] : undefined;
  if (!value) return undefined;
  if (value.type === "numeric_lit") return Number(value.text);
  if (value.type === "bool_lit") return value.text === "true";
  if (value.type === "string_lit") {
    if (value.namedChildren.some((c) => c?.type === "template_interpolation")) return undefined;
    return templateText(value);
  }
  return undefined;
}

function templateText(stringLit: Node): string {
  return stringLit.namedChildren.filter((c) => c?.type === "template_literal").map((c) => c!.text).join("");
}

/** `aws_s3_bucket.web.arn` → `aws_s3_bucket.web`; `module.vpc.vpc_id` → `module.vpc`; `data.x.y.id` → `data.x.y`. */
function referencesIn(expr: Node): string[] {
  const out: string[] = [];
  for (const v of expr.descendantsOfType("variable_expr")) {
    if (!v) continue;
    const head = v.text;
    const attrs: string[] = [];
    for (let s = v.nextNamedSibling; s?.type === "get_attr"; s = s.nextNamedSibling) attrs.push(s.text.replace(/^\./, ""));
    if (head === "module" && attrs[0]) out.push(`module.${attrs[0]}`);
    else if (head === "data" && attrs.length >= 2) out.push(`data.${attrs[0]}.${attrs[1]}`);
    else if (/_/.test(head) && attrs[0] && !["var", "local", "each", "count", "path", "terraform", "self"].includes(head)) out.push(`${head}.${attrs[0]}`);
  }
  return out;
}
