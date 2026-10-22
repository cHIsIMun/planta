// Extrator Compose (seção 10.3): os serviços de um `docker-compose.yml` (ou
// `compose.yaml`). O endereço é o nome do serviço.

import { isMap, isScalar, parseDocument } from "yaml";
import { hash } from "../code/typescript.ts";
import type { Extractor, Fact, TextFile } from "../facts.ts";
import type { IacResourceData } from "./terraform.ts";

export const compose: Extractor = {
  name: "compose",
  textFiles: /(^|\/)(docker-)?compose(\.[\w-]+)?\.ya?ml$/,
  extract(_files, _config, texts = []) {
    return texts.flatMap((t) => services(t));
  },
};

function services(file: TextFile): Fact[] {
  const doc = parseDocument(file.text);
  if (doc.errors.length > 0) return [];
  const node = doc.get("services", true);
  if (!isMap(node)) return [];
  return node.items.flatMap((pair): Fact[] => {
    const name = isScalar(pair.key) ? String(pair.key.value) : undefined;
    if (!name) return [];
    const s = (doc.toJS() as { services: Record<string, Record<string, unknown>> }).services[name] ?? {};
    const attributes: IacResourceData["attributes"] = {};
    if (typeof s.image === "string") attributes.image = s.image;
    const replicas = (s.deploy as { replicas?: number } | undefined)?.replicas;
    if (typeof replicas === "number") attributes.replicas = replicas;
    const depends = Array.isArray(s.depends_on) ? s.depends_on.map(String) : s.depends_on && typeof s.depends_on === "object" ? Object.keys(s.depends_on) : [];
    const line = isScalar(pair.key) && pair.key.range ? file.text.slice(0, pair.key.range[0]).split("\n").length : 1;
    const data: IacResourceData = { flavor: "compose", root: file.path, address: name, type: "service", attributes, expressions: [], references: depends.sort() };
    const signatureText = [`service ${name}`, JSON.stringify(s)].join("\n");
    return [{
      id: `iac.resource:${file.path}:${name}`, kind: "iac.resource", extractor: "compose",
      location: { file: file.path, symbol: name, line }, data: { ...data }, fingerprint: { signature: hash(signatureText), signatureText: `service ${name}` },
    }];
  });
}
