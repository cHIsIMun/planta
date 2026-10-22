// Servidor MCP (seção 15.2): dá a agentes de IA uma visão estrutural do
// projeto. JSON-RPC 2.0 por linha no stdio. Nenhuma ferramenta faz aceite:
// só um humano fecha o ciclo de revisão (seção 12.6).

import { applySeverity } from "./severity.ts";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import { isAbsolute, relative, resolve } from "node:path";
import { displayKey } from "./check.ts";
import { elementContext, query, QueryError, type QueryState, rulesFor, search, summaryLine } from "./context.ts";
import { diffModels, renderDiffMarkdown } from "./diff.ts";
import { loadProject, type Project, verify } from "./project.ts";
import { allViews, extractedFields, renderViews } from "./render/index.ts";
import { snapshotAt } from "./snapshot.ts";
import { suggest } from "./suggest.ts";
import { codePath, impact, renderImpact } from "./trace.ts";

export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Este projeto descreve sua arquitetura na pasta planta/, verificada contra o código.
- Antes de alterar código, chame planta_context (com a tarefa ou os elementos envolvidos) e planta_rules para os arquivos que vai tocar.
- Toda mudança estrutural (endpoint, entidade, campo, evento, handler, job, página, rota, dependência, passo de processo) entra na planta na mesma alteração; use planta_suggest para fatos não cobertos.
- Funcionalidade nova precisa de justifiedBy para o requisito da tarefa.
- Antes de concluir, rode planta_check e corrija PL1xx, PL2xx, PL3xx e PL5xx.
- Não tente resolver PL401, PL402, PL403 ou PL611: são mudanças para um humano revisar. Não existe ferramenta de aceite.`;

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run(args: Record<string, unknown>, state: State): Promise<string> | string;
}

interface State extends QueryState {
  project: Project;
}

const str = (description: string) => ({ type: "string", description });
const schema = (props: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties: props, required, additionalProperties: false });

function arg(args: Record<string, unknown>, name: string): string {
  const v = args[name];
  if (typeof v !== "string" || v === "") throw new QueryError(`parâmetro \`${name}\` é obrigatório`);
  return v;
}

const TOOLS: Tool[] = [
  {
    name: "planta_overview",
    description: "Resumo do sistema: contextos, apps, contagens por tipo, regras, requisitos e diagnósticos.",
    inputSchema: schema({}),
    run(_args, s) {
      const els = Object.entries(s.ir.elements);
      const byKind = (k: string) => els.filter(([, e]) => e.kind === k).map(([id]) => id);
      const lines = [`SISTEMA ${s.ir.system?.id ?? "?"}${s.ir.system?.description ? ` — ${s.ir.system.description}` : ""}`];
      for (const ctx of byKind("context")) {
        const kinds = new Map<string, number>();
        for (const [id, e] of els) if (id.startsWith(`${ctx}.`)) kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
        lines.push(`contexto ${ctx}: ${[...kinds].map(([k, n]) => `${n} ${k}`).join(", ")}`);
      }
      for (const app of byKind("app")) {
        const a = s.ir.elements[app]!;
        lines.push(`app ${app} (${[a.appKind, a.framework].filter(Boolean).join(", ")}) contém ${a.relations.filter((r) => r.type === "contains").map((r) => r.target).join(", ") || "–"}`);
      }
      for (const d of byKind("deployment")) lines.push(`deployment ${d}`);
      const rules = byKind("rule");
      if (rules.length) lines.push(`regras: ${rules.join(", ")}`);
      const reqs = Object.keys(s.check?.requirements ? Object.fromEntries(s.check.requirements) : {});
      if (reqs.length) lines.push(`requisitos: ${reqs.map(displayKey).join(", ")}`);
      const count = (sev: string) => s.diagnostics.filter((d) => d.severity === sev).length;
      lines.push(`diagnósticos: ${count("error")} erro(s), ${count("warning")} aviso(s)`);
      const pending = [...(s.check?.reviewables.values() ?? [])].filter((r) => r.state !== "reviewed").length;
      lines.push(`pendentes de revisão humana: ${pending}`);
      return lines.join("\n");
    },
  },
  {
    name: "planta_query",
    description: "Lista elementos por seletor: `*`, `Vendas.*`, um ID, `every endpoint`, `every entity where tag = pii`, `every service where layer = aplicacao`.",
    inputSchema: schema({ selector: str("Seletor de elementos") }, ["selector"]),
    run(args, s) {
      const ids = query(s.ir, arg(args, "selector"));
      return ids.length ? ids.map((id) => summaryLine(s.ir, id)).join("\n") : "Nenhum elemento.";
    },
  },
  {
    name: "planta_element",
    description: "Elemento completo: documentação, relações, requisitos, âncora, estado de revisão.",
    inputSchema: schema({ id: str("ID canônico, como Vendas.Cliente") }, ["id"]),
    run(args, s) {
      const id = arg(args, "id");
      const el = s.ir.elements[id];
      if (!el) throw new QueryError(`elemento desconhecido: ${id}`);
      const review = s.check?.reviewables.get(id);
      const incoming = Object.entries(s.ir.elements).flatMap(([from, e]) => e.relations.filter((r) => r.target === id).map((r) => ({ from, type: r.type })));
      return JSON.stringify({ id, ...el, incoming, review: review && { state: review.state, signature: review.signatureText || undefined } }, null, 2);
    },
  },
  {
    name: "planta_where",
    description: "Elementos da planta ancorados num arquivo de código (e, opcionalmente, num símbolo).",
    inputSchema: schema({ file: str("Caminho do arquivo, relativo à raiz do projeto ou absoluto"), symbol: str("Símbolo, como ClientesService.criar") }, ["file"]),
    run(args, s) {
      const raw = arg(args, "file");
      const root = s.project.config.projectRoot;
      const file = relative(root, isAbsolute(raw) ? raw : resolve(root, raw));
      const symbol = typeof args.symbol === "string" ? args.symbol : undefined;
      const ids = Object.keys(s.ir.elements).filter((id) => {
        const a = s.ir.elements[id]!.anchor;
        const path = (a as { resolved?: { file?: string } } | undefined)?.resolved?.file ?? a?.path;
        if (path !== file) return false;
        return !symbol || a?.symbol === symbol || a?.symbol?.startsWith(`${symbol}.`) || symbol.startsWith(`${a?.symbol}.`);
      });
      return ids.length ? ids.map((id) => elementContext(s, id)).join("\n\n") : `Nada na planta ancora ${file}${symbol ? `#${symbol}` : ""}. Se for estrutural, declare (planta_suggest).`;
    },
  },
  {
    name: "planta_impact",
    description: "Dependentes diretos e transitivos de um elemento ou requisito (REQ-001), e processos e requisitos afetados.",
    inputSchema: schema({ id: str("ID de elemento ou de requisito") }, ["id"]),
    run(args, s) {
      const found = impact(s.ir, s.check?.requirements ?? new Map(), arg(args, "id"));
      if (!found) throw new QueryError(`não conheço ${String(args.id)}`);
      return renderImpact(s.ir, found);
    },
  },
  {
    name: "planta_context",
    description: "Contexto compacto em texto, pronto para raciocínio: aceita um ID, um requisito (REQ-001) ou a descrição da tarefa.",
    inputSchema: schema({ target: str("ID, requisito ou descrição da tarefa") }, ["target"]),
    run(args, s) {
      const target = arg(args, "target");
      if (s.ir.elements[target]) return elementContext(s, target);
      const req = [...(s.check?.requirements.values() ?? [])].find((r) => r.key === target || displayKey(r.key) === target);
      if (req) {
        const head = `REQUISITO ${displayKey(req.key)} — ${req.title}\n${req.file}:${req.line}\n${req.text}`;
        return [head, ...req.justifiedBy.map((id) => elementContext(s, id))].join("\n\n");
      }
      const found = search(s.ir, target);
      if (found.length === 0) return "Nenhum elemento parece ligado a essa tarefa. Veja planta_overview e planta_query.";
      return [`Elementos mais ligados à tarefa (${found.length}):`, ...found.map((id) => elementContext(s, id))].join("\n\n");
    },
  },
  {
    name: "planta_rules",
    description: "Regras arquiteturais que se aplicam a um elemento ou aos elementos ancorados num arquivo.",
    inputSchema: schema({ target: str("ID de elemento ou caminho de arquivo") }, ["target"]),
    run(args, s) {
      const target = arg(args, "target");
      const root = s.project.config.projectRoot;
      const ids = s.ir.elements[target] ? [target] : Object.keys(s.ir.elements).filter((id) => {
        const p = codePath(s.ir, id);
        return p && p === relative(root, isAbsolute(target) ? target : resolve(root, target));
      });
      if (ids.length === 0) return `Nada na planta corresponde a ${target}.`;
      const lines = ids.flatMap((id) => rulesFor(s.ir, id).map((r) => `${id}: ${r.rule} — ${r.statement}`));
      return lines.length ? [...new Set(lines)].join("\n") : "Nenhuma regra se aplica.";
    },
  },
  {
    name: "planta_check",
    description: "Diagnósticos da verificação completa. `scope` filtra por prefixo de arquivo ou ID de elemento.",
    inputSchema: schema({ scope: str("Prefixo de arquivo (planta/ ou código) ou ID") }),
    run(args, s) {
      const scope = typeof args.scope === "string" ? args.scope : undefined;
      const list = s.diagnostics.filter((d) => !scope || d.loc.file.startsWith(scope) || d.message.includes(`\`${scope}`) || (d.related ?? []).some((r) => r.file.startsWith(scope)));
      if (list.length === 0) return "Nenhum diagnóstico.";
      return list.map((d) => `${d.severity.toUpperCase()} ${d.code} ${d.loc.file}:${d.loc.line} ${d.message}`).join("\n");
    },
  },
  {
    name: "planta_suggest",
    description: "Declaração Planta sugerida para um fato do código não coberto (ID como `http.endpoint:POST:/api/v1/x`). Sem `fact`, sugere para todos.",
    inputSchema: schema({ fact: str("ID do fato") }),
    run(args, s) {
      const matched = new Set([...(s.check?.matches.values() ?? [])].flat());
      const facts = (s.check?.facts ?? []).filter((f) => (typeof args.fact === "string" ? f.id === args.fact : !matched.has(f.id) && ["http.endpoint", "entity", "service", "controller", "event.handler", "job"].includes(f.kind)));
      if (facts.length === 0) return typeof args.fact === "string" ? `Fato desconhecido: ${args.fact}` : "Nenhum fato sem descrição.";
      return facts.map((f) => {
        const sug = suggest(f, s.ir, s.project.model.derived);
        return `// ${f.id} (${f.location.file})${sug.context ? ` · contexto ${sug.context}` : ""}\n${sug.text}`;
      }).join("\n\n");
    },
  },
  {
    name: "planta_trace",
    description: "Elementos que justificam um requisito, com estado de revisão.",
    inputSchema: schema({ requirement: str("ID do requisito, como REQ-001") }, ["requirement"]),
    run(args, s) {
      const id = arg(args, "requirement");
      const req = [...(s.check?.requirements.values() ?? [])].find((r) => r.key === id || displayKey(r.key) === id);
      if (!req) throw new QueryError(`requisito desconhecido: ${id}`);
      const lines = [`${displayKey(req.key)} ${req.title} (${req.file}:${req.line})`];
      for (const e of req.justifiedBy) lines.push(`  ${summaryLine(s.ir, e)} · ${s.check?.reviewables.get(e)?.state ?? "sem revisão"}`);
      if (req.justifiedBy.length === 0) lines.push("  nenhum elemento justifica este requisito");
      return lines.join("\n");
    },
  },
  {
    name: "planta_diff",
    description: "Diff arquitetural entre uma referência git (ex.: origin/main) e a árvore de trabalho.",
    inputSchema: schema({ base: str("Referência git de base") }, ["base"]),
    async run(args, s) {
      const base = await snapshotAt(arg(args, "base"), s.project.dir, s.project.cwd);
      return renderDiffMarkdown(diffModels(base, { ir: s.ir, ...(s.check && { check: s.check }) }));
    },
  },
];

// ---------------------------------------------------------------------
//  Protocolo
// ---------------------------------------------------------------------

interface Request {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpOptions {
  dir: string;
  cwd: string;
  version: string;
}

/** Estado fresco a cada chamada: o agente muda arquivos entre uma chamada e outra. */
async function load(options: McpOptions): Promise<State> {
  const project = loadProject(options.dir, options.cwd);
  const check = await verify(project);
  return { project, ir: project.model.ir, check, diagnostics: applySeverity([...project.model.diagnostics, ...check.diagnostics], project.config, project.cwd) };
}

export async function handle(req: Request, options: McpOptions): Promise<unknown> {
  switch (req.method) {
    case "initialize": {
      const asked = String(req.params?.protocolVersion ?? "");
      return {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
        serverInfo: { name: "planta", version: options.version },
        instructions: INSTRUCTIONS,
      };
    }
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) };
    case "tools/call": {
      const name = String(req.params?.name ?? "");
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) throw new RpcError(-32602, `ferramenta desconhecida: ${name}`);
      try {
        const text = await tool.run((req.params?.arguments as Record<string, unknown>) ?? {}, await load(options));
        return { content: [{ type: "text", text }] };
      } catch (e) {
        // Erro de uso da ferramenta volta para o agente como resultado, não como falha do protocolo.
        return { content: [{ type: "text", text: (e as Error).message }], isError: true };
      }
    }
    case "resources/list": {
      const s = await load(options);
      return {
        resources: [
          { uri: "planta://model", name: "Modelo completo (IR)", mimeType: "application/json" },
          ...allViews(s.ir).map((v) => ({ uri: `planta://view/${v.name}`, name: `Diagrama ${v.name} (${v.kind})`, mimeType: "text/x-mermaid" })),
          ...[...(s.check?.requirements.values() ?? [])].map((r) => ({ uri: `planta://requirement/${displayKey(r.key)}`, name: `${displayKey(r.key)} ${r.title}`, mimeType: "text/markdown" })),
        ],
      };
    }
    case "resources/templates/list":
      return {
        resourceTemplates: [
          { uriTemplate: "planta://element/{id}", name: "Elemento da planta", mimeType: "application/json" },
          { uriTemplate: "planta://view/{nome}", name: "Diagrama Mermaid", mimeType: "text/x-mermaid" },
          { uriTemplate: "planta://requirement/{id}", name: "Requisito", mimeType: "text/markdown" },
        ],
      };
    case "resources/read":
      return { contents: [await readResource(String(req.params?.uri ?? ""), options)] };
    default:
      throw new RpcError(-32601, `método desconhecido: ${req.method}`);
  }
}

async function readResource(uri: string, options: McpOptions) {
  const s = await load(options);
  const m = /^planta:\/\/(model|element|view|requirement)(?:\/(.+))?$/.exec(uri);
  if (!m) throw new RpcError(-32602, `recurso desconhecido: ${uri}`);
  const [, kind, raw] = m;
  const id = raw && decodeURIComponent(raw);
  switch (kind) {
    case "model":
      return { uri, mimeType: "application/json", text: JSON.stringify(s.ir, null, 2) };
    case "element": {
      const el = id && s.ir.elements[id];
      if (!el) throw new RpcError(-32602, `elemento desconhecido: ${id}`);
      return { uri, mimeType: "application/json", text: JSON.stringify({ id, ...el }, null, 2) };
    }
    case "view": {
      const view = allViews(s.ir).find((v) => v.name === id);
      if (!view) throw new RpcError(-32602, `view desconhecida: ${id}`);
      const [r] = renderViews([view], s.ir, extractedFields(s.ir, s.check));
      if (r?.error) throw new RpcError(-32603, r.error);
      return { uri, mimeType: "text/x-mermaid", text: r!.text! };
    }
    default: {
      const req = [...(s.check?.requirements.values() ?? [])].find((r) => displayKey(r.key) === id || r.key === id);
      if (!req) throw new RpcError(-32602, `requisito desconhecido: ${id}`);
      return { uri, mimeType: "text/markdown", text: `## ${displayKey(req.key)} ${req.title}\n\n${req.display}\n` };
    }
  }
}

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

/** Lê requisições por linha e responde na mesma ordem. Termina quando a entrada fecha. */
export async function serveMcp(options: McpOptions, input: Readable, output: Writable): Promise<void> {
  // Quem roda a partir do servidor é agente: `planta accept` recusa (seção 12.6).
  process.env.PLANTA_AGENT = "1";
  const send = (msg: unknown) => output.write(`${JSON.stringify(msg)}\n`);
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let req: Request;
    try {
      req = JSON.parse(line) as Request;
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } });
      continue;
    }
    const notification = req.id === undefined;
    try {
      const result = await handle(req, options);
      if (!notification) send({ jsonrpc: "2.0", id: req.id, result });
    } catch (e) {
      if (notification) continue;
      const code = e instanceof RpcError ? e.code : -32603;
      send({ jsonrpc: "2.0", id: req.id, error: { code, message: (e as Error).message } });
    }
  }
}
