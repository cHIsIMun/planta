// Severidade configurada (seção 11.3): `diagnostics` no `planta.config.yaml`
// muda a severidade de um código no projeto inteiro, e `overrides` só nos
// arquivos que casam com os caminhos. `off` descarta o diagnóstico.

import { matchesGlob, relative, resolve } from "node:path";
import type { Config } from "./config.ts";
import type { Diagnostic, Severity } from "./diagnostics.ts";

export function applySeverity(diagnostics: Diagnostic[], config: Config, cwd: string): Diagnostic[] {
  const { codes, overrides } = config.diagnostics;
  if (Object.keys(codes).length === 0 && overrides.length === 0) return diagnostics;
  return diagnostics.flatMap((d) => {
    const path = relative(config.projectRoot, resolve(cwd, d.loc.file));
    let severity = codes[d.code];
    for (const o of overrides) {
      if (o.codes[d.code] && o.paths.some((p) => matchesGlob(path, p) || path === p)) severity = o.codes[d.code];
    }
    if (severity === undefined) return [d];
    return severity === "off" ? [] : [{ ...d, severity: severity as Severity }];
  });
}
