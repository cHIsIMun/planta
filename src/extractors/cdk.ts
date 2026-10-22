// Extrator AWS CDK (seção 10.3): os templates CloudFormation que o `cdk synth`
// grava em `cdk.out/*.template.json`. O endereço de um recurso é o caminho do
// construct (`ApiStack/Servico/Service`, sem o `/Resource` final); os caminhos
// intermediários viram agrupadores (`construct`), como os módulos do Terraform.

import { posix } from "node:path";
import { hash } from "../code/typescript.ts";
import type { Extractor, Fact, TextFile } from "../facts.ts";
import type { IacResourceData } from "./terraform.ts";

interface Resource {
  Type?: string;
  Properties?: Record<string, unknown>;
  Metadata?: Record<string, unknown>;
}

export const cdk: Extractor = {
  name: "aws-cdk",
  textFiles: /\.template\.json$/,
  extract(_files, _config, texts = []) {
    return texts.flatMap((t) => template(t));
  },
};

function template(file: TextFile): Fact[] {
  let parsed: { Resources?: Record<string, Resource> };
  try {
    parsed = JSON.parse(file.text);
  } catch {
    return [];
  }
  const root = posix.dirname(file.path);
  const resources = Object.entries(parsed.Resources ?? {});
  // Recurso sem caminho de construct (template escrito à mão): o ID lógico é o endereço.
  const addressOf = new Map(resources.map(([logical, r]) => [logical, String(r.Metadata?.["aws:cdk:path"] ?? logical).replace(/\/(Resource|Default)$/, "")]));
  const lineOf = (logical: string) => file.text.slice(0, Math.max(0, file.text.indexOf(`"${logical}"`))).split("\n").length;
  const facts: Fact[] = [];
  const constructs = new Map<string, number>();

  for (const [logical, r] of resources) {
    if (!r.Type || r.Type.startsWith("AWS::CDK::")) continue;
    const address = addressOf.get(logical)!;
    const attributes: IacResourceData["attributes"] = {};
    const expressions: string[] = [];
    const references = new Set<string>();
    for (const [key, value] of Object.entries(r.Properties ?? {})) {
      for (const ref of refsIn(value)) if (addressOf.has(ref)) references.add(addressOf.get(ref)!);
      if (value === null || typeof value !== "object") attributes[key] = value as string | number | boolean;
      else {
        // `{ Ref: X }` e `{ Fn::GetAtt: [X, a] }` apontam para outro recurso.
        const direct = directRef(value);
        attributes[key] = direct && addressOf.has(direct) ? `ref:${addressOf.get(direct)}` : JSON.stringify(value);
        if (!direct) expressions.push(key);
      }
    }
    const line = lineOf(logical);
    const data: IacResourceData = { flavor: "cloudformation", root, address, type: r.Type, attributes, expressions, references: [...references].sort() };
    const signatureText = [`${r.Type} ${address}`, ...Object.keys(attributes).sort().map((k) => `${k} = ${JSON.stringify(attributes[k])}`)].join("\n");
    facts.push({
      id: `iac.resource:${root}:${address}`, kind: "iac.resource", extractor: "aws-cdk",
      location: { file: file.path, symbol: address, line }, data: { ...data }, fingerprint: { signature: hash(signatureText), signatureText },
    });
    for (const to of data.references) {
      facts.push({ id: `iac.reference:${root}:${address}->${to}`, kind: "iac.reference", extractor: "aws-cdk", location: { file: file.path, line }, data: { root, from: address, to } });
    }
    const parts = address.split("/");
    for (let i = 1; i < parts.length; i++) {
      const prefix = parts.slice(0, i).join("/");
      if (!constructs.has(prefix)) constructs.set(prefix, line);
    }
  }
  const addresses = new Set(facts.map((f) => f.data.address));
  for (const [address, line] of constructs) {
    if (addresses.has(address)) continue;
    const data: IacResourceData = { flavor: "cloudformation", root, address, type: "construct", attributes: {}, expressions: [], references: [] };
    facts.push({ id: `iac.resource:${root}:${address}`, kind: "iac.resource", extractor: "aws-cdk", location: { file: file.path, symbol: address, line }, data: { ...data } });
  }
  return facts;
}

function directRef(value: object): string | undefined {
  const v = value as Record<string, unknown>;
  if (typeof v.Ref === "string") return v.Ref;
  const att = v["Fn::GetAtt"];
  if (Array.isArray(att) && typeof att[0] === "string") return att[0];
  if (typeof att === "string") return att.split(".")[0];
  return undefined;
}

function refsIn(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(refsIn);
  const direct = directRef(value);
  return [...(direct ? [direct] : []), ...Object.values(value).flatMap(refsIn)];
}
