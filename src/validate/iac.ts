// Deployment contra o IaC (seção 6.16), para Terraform (`tf:`), AWS CDK
// (`cdk:`), Kubernetes (`k8s:`) e Compose (`compose:`): âncoras resolvidas
// contra os recursos extraídos (PL201, PL202, PL205), tipo do recurso
// (PL209), propriedades, réplicas e requisitos do catálogo (PL418) e recursos
// sem descrição em nenhum deployment (PL340).

import { describedTypes, type IacFlavor, resourceType } from "../catalog/resources.ts";
import type { Fact } from "../facts.ts";
import type { IacResourceData } from "../extractors/terraform.ts";
import type { IrElement } from "../ir.ts";
import type { ValidationContext } from "./context.ts";

interface Scheme {
  flavor: IacFlavor;
  extractor: string;
  /** `source <tipo> "..."` do deployment que vale para o esquema. */
  sources: string[];
  label: string;
}

export const SCHEMES: Record<string, Scheme> = {
  tf: { flavor: "terraform", extractor: "terraform", sources: ["terraform"], label: "Terraform" },
  cdk: { flavor: "cloudformation", extractor: "aws-cdk", sources: ["cdk", "cloudformation"], label: "CDK" },
  k8s: { flavor: "kubernetes", extractor: "kubernetes", sources: ["k8s", "kubernetes", "helm"], label: "Kubernetes" },
  compose: { flavor: "compose", extractor: "compose", sources: ["compose"], label: "Compose" },
};

/** Tipos que agrupam outros recursos: implementam qualquer tipo, e o que está dentro deles conta como descrito. */
const GROUPING = new Set(["module", "construct"]);

const data = (f: Fact) => f.data as unknown as IacResourceData;
const under = (file: string, root: string) => root === "" || file === root || file.startsWith(`${root}/`);

/** Fonte de IaC do deployment de um elemento: `{ kind: "terraform", root: "infra/..." }`. */
function sourceOf(ctx: ValidationContext, id: string): { kind: string; root: string; deployment: string } | undefined {
  for (let current: string | undefined = id; current; current = ctx.elements[current]?.parent) {
    const el = ctx.elements[current]!;
    if (el.kind !== "deployment") continue;
    const iac = el.iac as { kind: string; path: string } | undefined;
    return iac ? { kind: iac.kind, root: iac.path.replace(/^\/+|\/+$/g, ""), deployment: current } : undefined;
  }
  return undefined;
}

/** O recurso pertence à fonte: mesma raiz (Terraform, com os módulos) ou arquivo sob ela. */
function inSource(f: Fact, root: string): boolean {
  return data(f).root === root || under(f.location.file, root);
}

export function matchIac(ctx: ValidationContext): void {
  const enabled = new Set(ctx.config.extractors.map((e) => e.use));
  const resources = ctx.facts.filter((f) => f.kind === "iac.resource");
  const missing = new Set<string>();

  for (const [id, el] of Object.entries(ctx.elements)) {
    const scheme = el.anchor && SCHEMES[el.anchor.scheme];
    if (!scheme || !el.anchor?.address || !enabled.has(scheme.extractor)) continue;
    const source = sourceOf(ctx, id);
    if (!source || !scheme.sources.includes(source.kind)) continue;
    // Índices (`[0]`, `["a"]`) endereçam instâncias de um mesmo bloco Terraform.
    const address = scheme.flavor === "terraform" ? el.anchor.address.replace(/\[[^\]]*\]/g, "") : el.anchor.address;
    const fact = resources.find((f) => data(f).flavor === scheme.flavor && data(f).address === address && inSource(f, source.root));
    if (fact) {
      ctx.link(id, fact);
      continue;
    }
    if (el.meta.status === "planned") {
      ctx.report("PL205", "info", `\`${id}\` está planejado e ainda não tem recurso no IaC`, el.source);
    } else if (!resources.some((f) => data(f).flavor === scheme.flavor && inSource(f, source.root))) {
      if (!missing.has(source.deployment)) ctx.report("PL202", "error", `nenhum recurso ${scheme.label} em ${source.root} (source do deployment)`, ctx.elements[source.deployment]!.source);
      missing.add(source.deployment);
    } else {
      ctx.report("PL201", "error", `âncora não resolve: recurso \`${address}\` não existe no ${scheme.label} de ${source.root}`, el.source);
    }
  }

  // Cobertura: só recursos de tipos que o catálogo descreve; o resto é
  // auxiliar (papéis IAM, security groups, task definitions, ConfigMaps).
  const matched = new Set([...ctx.matches.values()].flat());
  const matchedAddresses = new Set(resources.filter((f) => matched.has(f.id)).map((f) => `${data(f).flavor}:${data(f).root}:${data(f).address}`));
  const wanted = ctx.config.coverage.require.includes("iac.resource") || ctx.config.coverage.warn.includes("iac.resource");
  for (const f of resources) {
    if (matched.has(f.id)) continue;
    const d = data(f);
    if (!describedTypes(d.flavor).has(d.type) || insideMatched(d, matchedAddresses)) {
      ctx.cover(f.id);
      continue;
    }
    ctx.reported(f.id);
    if (!wanted) continue;
    ctx.report("PL340", "warning", `recurso ${d.address} (${d.type}) não aparece em nenhum deployment`, ctx.codeLoc(f.location.file, f.location.line));
  }
}

/** Dentro de um agrupador descrito (`module.vpc.*`, um construct do CDK), o agrupador já o representa. */
function insideMatched(d: IacResourceData, matched: Set<string>): boolean {
  const sep = d.flavor === "cloudformation" ? "/" : ".";
  const parts = d.address.split(sep);
  for (let i = 1; i < parts.length; i++) {
    if (matched.has(`${d.flavor}:${d.root}:${parts.slice(0, i).join(sep)}`)) return true;
  }
  return false;
}

export function validateIac(ctx: ValidationContext): void {
  const resources = ctx.facts.filter((f) => f.kind === "iac.resource");
  for (const [id, el] of Object.entries(ctx.elements)) {
    if (el.kind !== "node" && el.kind !== "group") continue;
    const ids = new Set(ctx.matches.get(id) ?? []);
    const fact = resources.find((f) => ids.has(f.id));
    if (!fact || typeof el.resourceType !== "string") continue;
    const catalog = resourceType(el.resourceType);
    if (!catalog) continue; // PL150 já avisou na planta
    const d = data(fact);
    const at = [ctx.codeLoc(fact.location.file, fact.location.line)];
    if (GROUPING.has(d.type)) continue;
    const impl = catalog.iac?.[d.flavor];
    // `generic.*` não tem implementação conhecida: sem conferência de tipo.
    if (!impl) {
      if (catalog.iac && Object.keys(catalog.iac).length > 0) {
        ctx.report("PL209", "error", `\`${id}\` é ${el.resourceType}, que não se implementa em ${d.flavor}; \`${d.address}\` é ${d.type}`, el.source, at);
      }
      continue;
    }
    if (!impl.types.includes(d.type)) {
      ctx.report("PL209", "error", `\`${id}\` é ${el.resourceType}, mas \`${d.address}\` é ${d.type} (esperado: ${impl.types.join(" ou ")})`, el.source, at);
      continue;
    }
    for (const [attr, expected] of Object.entries(impl.requires ?? {})) {
      const actual = d.attributes[attr];
      if (actual !== undefined && !d.expressions.includes(attr) && !String(actual).toLowerCase().includes(expected)) {
        ctx.report("PL418", "warning", `\`${id}\` é ${el.resourceType}, mas \`${d.address}\` tem ${attr} = ${JSON.stringify(actual)}`, el.source, at);
      }
    }
    if (typeof el.replicas === "number" && impl.replicas) compare(ctx, id, el, fact, "replicas", el.replicas, impl.replicas, resources);
    for (const [prop, value] of Object.entries((el.props as Record<string, unknown> | undefined) ?? {})) {
      compare(ctx, id, el, fact, prop, value, impl.properties?.[prop] ?? defaultName(prop, d.flavor), resources);
    }
  }
}

/** Nome do atributo sem mapeamento no catálogo: `multiAz` → `multi_az` (Terraform), `MultiAz` (CloudFormation). */
function defaultName(prop: string, flavor: IacFlavor): string {
  if (flavor === "terraform") return prop.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  if (flavor === "cloudformation") return prop[0]!.toUpperCase() + prop.slice(1);
  return prop;
}

/** Recurso referenciado por um atributo: `aws_x.y.arn` (Terraform) ou `ref:Pilha/X` (CDK). */
function referenced(fact: Fact, attribute: string, resources: Fact[]): Fact | undefined {
  const d = data(fact);
  const value = d.attributes[attribute];
  if (typeof value !== "string") return undefined;
  let address: string | undefined;
  if (value.startsWith("ref:")) address = value.slice(4);
  else {
    const head = value.split(".").slice(0, 2).join(".");
    address = d.references.find((r) => r === head || r.endsWith(`.${head}`));
  }
  return address ? resources.find((f) => data(f).flavor === d.flavor && data(f).root === d.root && data(f).address === address) : undefined;
}

function compare(ctx: ValidationContext, id: string, el: IrElement, fact: Fact, prop: string, value: unknown, map: string | { via: string; attribute: string }, resources: Fact[]): void {
  const target = typeof map === "string" ? fact : referenced(fact, map.via, resources);
  if (!target) return;
  const attr = typeof map === "string" ? map : map.attribute;
  const d = data(target);
  const at = [ctx.codeLoc(target.location.file, target.location.line)];
  if (d.expressions.includes(attr)) return; // valor só conhecido no plano: sem evidência, sem diagnóstico
  const actual = d.attributes[attr];
  if (actual === undefined) {
    ctx.report("PL418", "warning", `\`${id}\` declara ${prop} = ${JSON.stringify(value)}, mas \`${d.address}\` não define ${attr}`, el.source, at);
  } else if (String(actual) !== String(value)) {
    ctx.report("PL418", "warning", `\`${id}\`: ${prop} é ${JSON.stringify(value)} na planta e ${attr} = ${JSON.stringify(actual)} em \`${d.address}\``, el.source, at);
  }
}
