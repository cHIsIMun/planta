// Onde o cursor está, só pelos tokens: funciona com o arquivo quebrado, que
// é o estado normal enquanto se digita. Cada `{` aberto antes do cursor é um
// bloco; o cabeçalho do bloco diz que declaração ele abre.

import { CharStream, type Token } from "antlr4ng";
import { PlantaLexer } from "../generated/PlantaLexer.js";

export type BlockKind =
  | "system" | "context" | "app" | "external" | "deployment" | "group" | "rule" | "view"
  | "data" | "component" | "api" | "endpoint" | "process" | "control" | "node" | "other";

export interface Block {
  kind: BlockKind;
  /** Palavra-chave que abriu o bloco (`service`, `entity`, `context`...). */
  keyword?: string;
  /** Nome declarado, quando o bloco declara um elemento. */
  name?: string;
  /** `root "..."` de contextos e apps. */
  root?: string;
  /** Âncora do cabeçalho, sem as aspas. */
  anchor?: string;
  /** `source terraform "/infra/..."` de um deployment. */
  source?: { kind: string; path: string };
}

const BLOCKS: Record<string, BlockKind> = {
  system: "system", context: "context", app: "app", external: "external", deployment: "deployment",
  network: "group", zone: "group", cluster: "group", group: "group", region: "group",
  rule: "rule", view: "view", entity: "data", value: "data", dto: "data", event: "data",
  service: "component", controller: "component", repository: "component", gateway: "component",
  middleware: "component", guard: "component", component: "component", page: "component", store: "component",
  api: "api", endpoint: "endpoint", process: "process",
  if: "control", else: "control", parallel: "control", foreach: "control",
};

/** Blocos cujo nome entra no ID dos elementos de dentro (seção 8.3). */
const SCOPING = new Set<BlockKind>(["context", "app", "external", "deployment", "data", "component", "api", "process"]);

export interface CursorContext {
  /** Blocos abertos, do mais externo para o mais interno. */
  blocks: Block[];
  /** Tokens significativos antes do cursor, sem o identificador sendo digitado. */
  before: Token[];
}

export function tokenize(text: string): Token[] {
  const lexer = new PlantaLexer(CharStream.fromString(text));
  lexer.removeErrorListeners();
  return lexer.getAllTokens().filter((t) => t.channel === 0);
}

/** `offset` é a posição do cursor no texto (em unidades UTF-16). */
export function cursorContext(text: string, offset: number): CursorContext {
  const tokens = tokenize(text).filter((t) => t.stop < offset || (t.start < offset && t.type === PlantaLexer.STRING && t.stop >= offset));
  // O identificador sob o cursor (ou o que vem sendo digitado) não conta como contexto.
  const last = tokens.at(-1);
  if (last && last.stop === offset - 1 && last.type !== PlantaLexer.STRING && /^[A-Za-z_]/.test(last.text ?? "")) tokens.pop();

  const blocks: Block[] = [];
  let header: Token[] = [];
  for (const t of tokens) {
    if (t.text === "{") {
      blocks.push(blockOf(header));
      header = [];
    } else if (t.text === "}") {
      blocks.pop();
      header = [];
    } else if (t.type === PlantaLexer.DOC_COMMENT) {
      header = [];
    } else {
      header.push(t);
    }
  }
  return { blocks, before: tokens };
}

/** O cabeçalho pode ter declarações anteriores sem bloco; vale a última palavra-chave de bloco. */
function blockOf(header: Token[]): Block {
  for (let i = header.length - 1; i >= 0; i--) {
    const word = header[i]!.text ?? "";
    const kind = BLOCKS[word];
    if (!kind) continue;
    // Em tipo de recurso (`api: ecs.service {`) a palavra é parte do nome.
    // Seguida de `:`, é o nome de um nó (`api: ecs.service {`).
    if (header[i - 1]?.text === "." || header[i - 1]?.text === ":" || header[i + 1]?.text === ":") continue;
    const rest = header.slice(i + 1);
    const name = kind === "endpoint" || kind === "control" ? undefined : rest.find((t) => /^[A-Za-z_]/.test(t.text ?? ""))?.text;
    const rootAt = rest.findIndex((t) => t.text === "root");
    const anchorAt = rest.findIndex((t) => t.text === "@");
    const sourceAt = rest.findIndex((t) => t.text === "source");
    return {
      kind,
      keyword: word,
      ...(name && { name }),
      ...(rootAt >= 0 && rest[rootAt + 1] && { root: unquote(rest[rootAt + 1]!.text!) }),
      ...(anchorAt >= 0 && rest[anchorAt + 1] && { anchor: unquote(rest[anchorAt + 1]!.text!) }),
      ...(sourceAt >= 0 && rest[sourceAt + 2] && { source: { kind: rest[sourceAt + 1]!.text!, path: unquote(rest[sourceAt + 2]!.text!) } }),
    };
  }
  // Nó de deployment com propriedades: `api: ecs.service { ... }`.
  if (header.some((t) => t.text === ":")) return { kind: "node" };
  return { kind: "other" };
}

/** IDs dos escopos, do mais interno para o mais externo, como o ligador procura. */
export function scopeIds(blocks: Block[]): string[] {
  const ids: string[] = [];
  let current: string | undefined;
  for (const b of blocks) {
    if (!SCOPING.has(b.kind) || !b.name) continue;
    current = current ? `${current}.${b.name}` : b.name;
    ids.unshift(current);
  }
  return ids;
}

function unquote(text: string): string {
  return text.startsWith('"') ? text.slice(1, -1).replace(/\\(.)/g, "$1") : text;
}
