// Teste de ponta a ponta num VS Code de verdade (baixado em .vscode-test/).
// O servidor roda a partir do código-fonte da Planta neste repositório.
//
//   pnpm run test:e2e

import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runTests } from "@vscode/test-electron";

// Compilado em out/test/.
const extension = resolve(__dirname, "../..");
const repo = resolve(extension, "../..");

async function main(): Promise<void> {
  const workspace = mkdtempSync(join(tmpdir(), "planta-vscode-"));
  cpSync(join(repo, "test/fixtures/loja"), workspace, { recursive: true });
  mkdirSync(join(workspace, ".vscode"));
  writeFileSync(join(workspace, ".vscode/settings.json"), JSON.stringify({
    "planta.server.command": [join(repo, "node_modules/.bin/tsx"), join(repo, "src/cli.ts")],
  }, null, 2));

  await runTests({
    version: process.env.VSCODE_VERSION ?? "stable",
    extensionDevelopmentPath: extension,
    extensionTestsPath: join(extension, "out/test/suite.js"),
    launchArgs: [workspace, "--disable-extensions", "--disable-workspace-trust", "--user-data-dir", mkdtempSync(join(tmpdir(), "planta-vscode-user-"))],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
