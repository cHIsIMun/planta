// Formatos de saída de `planta check` (seção 11.7) além de texto e JSON:
// SARIF, para anotações em PR (GitHub Code Scanning, GitLab, Azure DevOps), e
// Markdown, para comentário.

import { realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { CATALOG, type Diagnostic } from "./diagnostics.ts";

const LEVEL = { error: "error", warning: "warning", info: "note" } as const;

/** SARIF 2.1.0 com caminhos relativos à raiz do repositório. */
export function toSarif(diagnostics: Diagnostic[], options: { version: string; cwd: string; repoRoot?: string }): string {
  // O git devolve a raiz pelo caminho real (`/var` → `/private/var` no macOS).
  const cwd = realpathSync(options.cwd);
  const uri = (file: string) => {
    const abs = resolve(cwd, file);
    return (options.repoRoot ? relative(options.repoRoot, abs) : file).split("\\").join("/");
  };
  const codes = [...new Set(diagnostics.map((d) => d.code))].sort();
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "planta",
          version: options.version,
          rules: codes.map((id) => ({ id, shortDescription: { text: CATALOG[id] ?? id } })),
        },
      },
      results: diagnostics.map((d) => ({
        ruleId: d.code,
        level: LEVEL[d.severity],
        message: { text: d.message },
        locations: [{ physicalLocation: { artifactLocation: { uri: uri(d.loc.file) }, region: { startLine: d.loc.line, startColumn: d.loc.column } } }],
        ...(d.related && {
          relatedLocations: d.related.map((r, i) => ({ id: i, physicalLocation: { artifactLocation: { uri: uri(r.file) }, region: { startLine: r.line } } })),
        }),
      })),
    }],
  };
  return JSON.stringify(sarif, null, 2) + "\n";
}

export function toMarkdown(diagnostics: Diagnostic[]): string {
  const count = (s: Diagnostic["severity"]) => diagnostics.filter((d) => d.severity === s).length;
  const out = ["## Planta", "", `${count("error")} erro(s) · ${count("warning")} aviso(s) · ${count("info")} informação(ões)`, ""];
  if (diagnostics.length > 0) {
    out.push("| | Código | Local | Mensagem |", "|---|---|---|---|");
    const icon = { error: "✖", warning: "⚠", info: "ℹ" };
    for (const d of diagnostics) {
      out.push(`| ${icon[d.severity]} | ${d.code} | \`${d.loc.file}:${d.loc.line}\` | ${d.message.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`);
    }
    out.push("");
  }
  return out.join("\n");
}
