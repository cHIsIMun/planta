// Extrator Kubernetes (seção 10.3): manifestos YAML (vários documentos por
// arquivo), inclusive a saída renderizada de um Helm. O endereço é
// `Kind/namespace/nome` (seção 9.1); sem namespace, `default`.

import { parseAllDocuments } from "yaml";
import { hash } from "../code/typescript.ts";
import type { Extractor, Fact, TextFile } from "../facts.ts";
import type { IacResourceData } from "./terraform.ts";

export const kubernetes: Extractor = {
  name: "kubernetes",
  textFiles: /\.ya?ml$/,
  extract(_files, config, texts = []) {
    return texts.flatMap((t) => manifests(t, config.root));
  },
};

function manifests(file: TextFile, root: string): Fact[] {
  const facts: Fact[] = [];
  let docs;
  try {
    docs = parseAllDocuments(file.text);
  } catch {
    return [];
  }
  for (const doc of Array.isArray(docs) ? docs : [docs]) {
    if (doc.errors.length > 0) continue;
    const m = doc.toJS() as { kind?: string; apiVersion?: string; metadata?: { name?: string; namespace?: string }; spec?: Record<string, unknown> } | null;
    if (!m?.kind || !m.apiVersion || !m.metadata?.name) continue;
    const address = `${m.kind}/${m.metadata.namespace ?? "default"}/${m.metadata.name}`;
    const spec = m.spec ?? {};
    const pod = (spec.template as { spec?: Record<string, unknown> } | undefined)?.spec
      ?? ((spec.jobTemplate as { spec?: { template?: { spec?: Record<string, unknown> } } } | undefined)?.spec?.template?.spec)
      ?? (m.kind === "Pod" ? spec : undefined);
    const container = (pod?.containers as { image?: string }[] | undefined)?.[0];
    const attributes: IacResourceData["attributes"] = {};
    if (typeof spec.replicas === "number") attributes.replicas = spec.replicas;
    if (container?.image) attributes.image = container.image;
    if (typeof spec.schedule === "string") attributes.schedule = spec.schedule;
    if (typeof spec.type === "string") attributes.type = spec.type;
    const line = file.text.slice(0, doc.range[0]).split("\n").length;
    const data: IacResourceData = { flavor: "kubernetes", root, address, type: m.kind, attributes, expressions: [], references: [] };
    const signatureText = [`${m.kind} ${address}`, JSON.stringify(spec)].join("\n");
    facts.push({
      id: `iac.resource:${root}:${address}`, kind: "iac.resource", extractor: "kubernetes",
      location: { file: file.path, symbol: address, line }, data: { ...data }, fingerprint: { signature: hash(signatureText), signatureText: `${m.kind} ${address}` },
    });
  }
  return facts;
}
