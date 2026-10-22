// Extrai os blocos ```planta da especificação e os prepara para o parser.

export interface SpecExample {
  /** Linha (1-based) da primeira linha de código do bloco no Markdown. */
  line: number;
  /** Título da seção mais próxima acima do bloco. */
  section: string;
  code: string;
}

export function extractExamples(markdown: string): SpecExample[] {
  const examples: SpecExample[] = [];
  let section = "";
  let current: SpecExample | undefined;

  markdown.split("\n").forEach((text, i) => {
    if (current) {
      if (text.trim() === "```") {
        examples.push(current);
        current = undefined;
      } else {
        current.code += text + "\n";
      }
    } else if (text.trim() === "```planta") {
      current = { line: i + 2, section, code: "" };
    } else if (/^#{2,4} /.test(text)) {
      section = text.replace(/^#+ /, "");
    }
  });
  return examples;
}

const CONTEXT_MEMBER = new Set([
  "entity", "value", "dto", "enum", "aggregate",
  "service", "controller", "repository", "gateway", "middleware",
  "guard", "component", "page", "store",
  "api", "channel", "event", "on", "job", "process",
]);
const COMPONENT_ITEM = new Set(["op", "justifiedBy", "decidedBy"]);

/**
 * A seção 6 mostra trechos que não são arquivos completos (um `entity` solto,
 * um `op` fora de componente, `{ ... }` como reticências). Esta função os
 * envolve no menor contexto válido; arquivos completos passam inalterados.
 */
export function asFile(code: string): string {
  let body = code
    .replace(/\{ \.\.\. \}/g, "{ }")
    .replace(/\(\.\.\.\)/g, "()");

  // Comentário de documentação no fim do trecho precisa de um elemento depois (PL101).
  if (/^\s*\/\/\/.*\s*$/.test(body.trimEnd().split("\n").at(-1) ?? "")) {
    body += "actor Fragmento\n";
  }

  const firstWord = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("//") && !l.startsWith("#["))
    ?.split(/[\s(]/)[0];

  if (firstWord && COMPONENT_ITEM.has(firstWord)) {
    return `context Fragmento {\nservice Fragmento {\n${body}}\n}\n`;
  }
  if (firstWord && CONTEXT_MEMBER.has(firstWord)) {
    return `context Fragmento {\n${body}}\n`;
  }
  return body;
}
