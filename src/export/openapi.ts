// `planta export --format openapi`: OpenAPI 3.1 a partir das APIs HTTP da
// planta. Esquemas para as entidades, valores, DTOs, enums e eventos usados
// por corpo, parâmetros e respostas, com os campos declarados.

import type { IrElement, IrModel, IrType } from "../ir.ts";
import { PRIMITIVES } from "../link.ts";

type Schema = Record<string, unknown>;

const PRIMITIVE_SCHEMAS: Record<string, Schema> = {
  string: { type: "string" }, text: { type: "string" }, int: { type: "integer", format: "int32" },
  long: { type: "integer", format: "int64" }, decimal: { type: "number" }, float: { type: "number" },
  bool: { type: "boolean" }, uuid: { type: "string", format: "uuid" }, date: { type: "string", format: "date" },
  time: { type: "string", format: "time" }, datetime: { type: "string", format: "date-time" },
  duration: { type: "string", format: "duration" }, json: {}, bytes: { type: "string", contentEncoding: "base64" },
  email: { type: "string", format: "email" }, url: { type: "string", format: "uri" }, void: {},
};

export function toOpenApi(ir: IrModel, options: { title?: string } = {}): Record<string, unknown> {
  const schemas: Record<string, Schema> = {};
  const names = new Map<string, string>();
  const pending: string[] = [];

  /** Nome do esquema: o nome do elemento, qualificado pelo contexto quando dois colidem. */
  const schemaName = (id: string) => {
    if (!names.has(id)) {
      const el = ir.elements[id]!;
      const taken = [...names.values()].includes(el.name);
      names.set(id, taken ? id.replace(/\./g, "_") : el.name);
      pending.push(id);
    }
    return names.get(id)!;
  };

  const schemaOf = (type: IrType | undefined): Schema => {
    if (!type) return {};
    if ("map" in type) return { type: "object", additionalProperties: schemaOf(type.map.value) };
    let base: Schema;
    if (PRIMITIVES.has(type.ref)) base = PRIMITIVE_SCHEMAS[type.ref] ?? {};
    else if (ir.elements[type.ref]) base = { $ref: `#/components/schemas/${schemaName(type.ref)}` };
    else base = {};
    return type.list ? { type: "array", items: base } : base;
  };

  const paths: Record<string, Record<string, unknown>> = {};
  const schemes = new Set<string>();
  const endpoints = Object.entries(ir.elements).filter(([, e]) => e.kind === "endpoint" && e.protocol === "http").sort(([a], [b]) => a.localeCompare(b));
  for (const [id, e] of endpoints) {
    const path = String(e.path).replace(/:([^/]+)/g, "{$1}").replace(/\/\*$/, "/{caminho}");
    const method = String(e.method).toLowerCase();
    if (method === "all") continue; // sem método fixo: não há como descrever no OpenAPI
    const params = (e.params as { name: string; type?: IrType; in?: string }[] | undefined) ?? [];
    const declaredInPath = new Set(params.filter((p) => (p.in ?? "query") === "path").map((p) => p.name));
    const parameters = [
      ...params.map((p) => ({ name: p.name, in: p.in ?? "query", required: (p.in ?? "query") === "path" || !p.type || !("optional" in p.type && p.type.optional), schema: schemaOf(p.type) })),
      // Parâmetros de caminho sem declaração na planta (`/clientes/:id` sem `param id`).
      ...[...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]!).filter((n) => !declaredInPath.has(n)).map((name) => ({ name, in: "path", required: true, schema: { type: "string" } })),
    ];
    const responses: Record<string, unknown> = {};
    for (const r of (e.responses as { status: number; type?: IrType }[] | undefined) ?? [{ status: 200 }]) {
      responses[String(r.status)] = { description: describe(r.status), ...(r.type && { content: { "application/json": { schema: schemaOf(r.type) } } }) };
    }
    if (Object.keys(responses).length === 0) responses["200"] = { description: "OK" };
    const auth = e.auth as { scheme: string; roles: string[] } | undefined;
    if (auth) schemes.add(auth.scheme);
    const reqs = e.relations.filter((r) => r.type === "justifiedBy").map((r) => r.target.replace(/^req:/, ""));
    (paths[path] ??= {})[method] = {
      operationId: id,
      ...(e.docs && { summary: e.docs.split("\n")[0], description: e.docs }),
      tags: [ir.elements[e.parent ?? ""]?.parent ?? "api"],
      ...(parameters.length > 0 && { parameters }),
      ...(e.body !== undefined && { requestBody: { required: true, content: { "application/json": { schema: schemaOf(e.body as IrType) } } } }),
      responses,
      ...(auth && { security: [{ [auth.scheme]: auth.roles }] }),
      ...(reqs.length > 0 && { "x-planta-requirements": reqs }),
      ...(e.meta.status === "deprecated" && { deprecated: true }),
    };
  }

  // Esquemas (inclusive os alcançados por campos de outros esquemas).
  while (pending.length > 0) {
    const id = pending.shift()!;
    schemas[names.get(id)!] = elementSchema(ir.elements[id]!, schemaOf);
  }

  return {
    openapi: "3.1.0",
    info: { title: options.title ?? ir.system?.id ?? "API", version: ir.system?.version ?? "0.0.0", ...(ir.system?.description && { description: ir.system.description }) },
    paths,
    components: {
      schemas,
      ...(schemes.size > 0 && {
        securitySchemes: Object.fromEntries([...schemes].map((s) => [s, s === "bearer" || s === "jwt" ? { type: "http", scheme: "bearer", bearerFormat: "JWT" } : { type: "http", scheme: s }])),
      }),
    },
  };
}

function elementSchema(el: IrElement, schemaOf: (t: IrType | undefined) => Schema): Schema {
  if (el.kind === "enum") return { type: "string", enum: el.values as string[] };
  const fields = (el.fields as { name: string; type: IrType; modifiers: Record<string, unknown[]> }[] | undefined) ?? [];
  const properties: Record<string, Schema> = {};
  const required: string[] = [];
  for (const f of fields) {
    const s = { ...schemaOf(f.type) };
    const max = f.modifiers.max?.[0];
    if (typeof max === "number" && (s.type === "string" || s.format === "email")) s.maxLength = max;
    if (f.modifiers.readonly) s.readOnly = true;
    properties[f.name] = s;
    if (!("ref" in f.type && f.type.optional)) required.push(f.name);
  }
  return {
    type: "object",
    ...(el.docs && { description: el.docs }),
    properties,
    ...(required.length > 0 && { required }),
  };
}

function describe(status: number): string {
  const text: Record<number, string> = {
    200: "OK", 201: "Criado", 202: "Aceito", 204: "Sem conteúdo", 400: "Requisição inválida", 401: "Não autenticado",
    403: "Sem permissão", 404: "Não encontrado", 409: "Conflito", 422: "Não processável",
  };
  return text[status] ?? `Status ${status}`;
}
