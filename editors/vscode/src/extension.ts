// Extensão de VS Code da Planta: inicia `planta lsp` e acrescenta o que o
// protocolo não cobre — abrir a posição de um CodeLens e a pré-visualização
// de views num painel lateral, atualizada a cada verificação.

import { existsSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";
import { LanguageClient, type LanguageClientOptions, type ServerOptions } from "vscode-languageclient/node";

let client: LanguageClient | undefined;
let preview: { panel: vscode.WebviewPanel; view: string } | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(
    vscode.commands.registerCommand("planta.revealLocation", reveal),
    vscode.commands.registerCommand("planta.previewView", previewView),
    vscode.commands.registerCommand("planta.restartServer", async () => {
      await client?.stop();
      await start(context);
    }),
  );
  await start(context);
}

export async function deactivate(): Promise<void> {
  await client?.stop();
}

/** Comando configurado; senão, o binário do projeto; senão, `npx`. */
function serverCommand(): { command: string; args: string[] } {
  const configured = vscode.workspace.getConfiguration("planta").get<string[]>("server.command") ?? [];
  if (configured.length > 0) return { command: configured[0]!, args: [...configured.slice(1), "lsp", "--stdio"] };
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const local = folder && join(folder, "node_modules", ".bin", process.platform === "win32" ? "planta.cmd" : "planta");
  if (local && existsSync(local)) return { command: local, args: ["lsp", "--stdio"] };
  return { command: "npx", args: ["--no-install", "planta", "lsp", "--stdio"] };
}

async function start(context: vscode.ExtensionContext): Promise<void> {
  const { command, args } = serverCommand();
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const serverOptions: ServerOptions = { command, args, options: { ...(cwd && { cwd }), shell: process.platform === "win32" } };
  const clientOptions: LanguageClientOptions = {
    // Os arquivos de código entram para o CodeLens e as ações "Ir para a planta"/"Adicionar à planta".
    documentSelector: [
      { scheme: "file", language: "planta" },
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "typescriptreact" },
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "python" },
      { scheme: "file", language: "java" },
      { scheme: "file", pattern: "**/*.tf" },
    ],
    initializationOptions: { dir: vscode.workspace.getConfiguration("planta").get<string>("dir") },
  };
  client = new LanguageClient("planta", "Planta", serverOptions, clientOptions);
  await client.start();
  context.subscriptions.push(client.onNotification("planta/checked", () => void refreshPreview()));
}

async function reveal(target: string, range: { start: { line: number; character: number }; end: { line: number; character: number } }): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(target));
  const selection = new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
  await vscode.window.showTextDocument(doc, { selection });
}

// ---------------------------------------------------------------------
//  Pré-visualização de views
// ---------------------------------------------------------------------

interface ViewInfo {
  name: string;
  kind: string;
  title?: string;
}

async function previewView(name?: string): Promise<void> {
  if (!client) return;
  let view = name;
  if (!view) {
    const views = await client.sendRequest<ViewInfo[]>("planta/views", {});
    const picked = await vscode.window.showQuickPick(
      views.map((v) => ({ label: v.name, description: v.kind, detail: v.title })),
      { placeHolder: "View a pré-visualizar" },
    );
    view = picked?.label;
  }
  if (!view) return;
  if (!preview) {
    const panel = vscode.window.createWebviewPanel("plantaView", `Planta: ${view}`, vscode.ViewColumn.Beside, { enableScripts: true });
    panel.onDidDispose(() => (preview = undefined));
    preview = { panel, view };
  }
  preview.view = view;
  preview.panel.title = `Planta: ${view}`;
  await refreshPreview();
}

async function refreshPreview(): Promise<void> {
  if (!preview || !client) return;
  const result = await client.sendRequest<{ text?: string; error?: string }>("planta/renderView", { name: preview.view });
  preview.panel.webview.html = html(preview.view, result);
}

function html(view: string, result: { text?: string; error?: string }): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = result.error
    ? `<p class="error">${escape(result.error)}</p>`
    : `<pre class="mermaid">${escape(result.text ?? "")}</pre>`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;">
<title>${escape(view)}</title>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
  .error { color: var(--vscode-errorForeground); }
</style>
</head>
<body>
${body}
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs";
  const dark = document.body.classList.contains("vscode-dark") || document.body.classList.contains("vscode-high-contrast");
  mermaid.initialize({ startOnLoad: true, theme: dark ? "dark" : "default", securityLevel: "strict" });
</script>
</body>
</html>`;
}
