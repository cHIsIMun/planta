// Fatos (seção 10.1): o que os extratores descobrem no código, num formato
// comum a todos os frameworks.

import type { ExtractorConfig } from "./config.ts";
import type { SourceFile } from "./code/typescript.ts";

export interface Fact {
  /** Estável entre execuções: `http.endpoint:POST:/api/v1/clientes`. */
  id: string;
  kind: string;
  extractor: string;
  location: { file: string; symbol?: string; line?: number };
  data: Record<string, unknown>;
  fingerprint?: { signature: string; body?: string; signatureText?: string };
}

export interface Extractor {
  name: string;
  /** Arquivos de texto (YAML, JSON) que o extrator lê além do código, pelo nome. */
  textFiles?: RegExp;
  /** Recebe os arquivos de código sob o `root` do extrator e, se pedir, os de texto. */
  extract(files: SourceFile[], config: ExtractorConfig, texts?: TextFile[]): Fact[];
}

/** Arquivo lido como texto (manifesto, template), com caminho relativo à raiz do projeto. */
export interface TextFile {
  path: string;
  text: string;
}

/** Campo de entidade como os extratores ORM o descrevem, já em tipos Planta. */
export interface FieldFact {
  name: string;
  /** Tipo Planta (`uuid`, `string`, `Pedido`) ou `unknown` quando o extrator não consegue decidir. */
  type: string;
  list: boolean;
  optional: boolean;
  modifiers: Record<string, unknown[]>;
  line: number;
}

export interface HttpEndpointData {
  method: string;
  path: string;
  handler: string;
  body?: string;
  params: { name: string; in: string; type?: string }[];
  responses: { status: number }[];
  guards: string[];
}

/** Normaliza rotas para comparação: `/clientes/{id}` e `/clientes/<int:id>` viram `/clientes/:id`. */
export function normalizeRoute(path: string): string {
  const clean = `/${path}`
    .replace(/\{([^}]+)\}/g, ":$1")
    .replace(/<(?:[^:>]+:)?([^>]+)>/g, ":$1")
    .replace(/\/+/g, "/")
    .replace(/(.)\/$/, "$1");
  return clean;
}

/** Mesma rota, ignorando o nome dos parâmetros: `/a/:id` casa com `/a/:clienteId`. */
export function routeKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizeRoute(path).replace(/:[^/]+/g, ":")}`;
}
