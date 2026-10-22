// Roda dentro do VS Code (extensionTestsPath): a extensão de verdade, com o
// servidor de verdade, sobre uma cópia do fixture `loja`. Usa os mesmos
// comandos que o editor chama ao digitar, passar o mouse e clicar.

import assert from "node:assert/strict";
import * as vscode from "vscode";

const root = () => vscode.workspace.workspaceFolders![0]!.uri;
const file = (path: string) => vscode.Uri.joinPath(root(), path);

async function until<T>(what: string, probe: () => Promise<T | undefined> | T | undefined, timeout = 60000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await probe();
    if (value !== undefined && value !== false) return value;
    if (Date.now() - start > timeout) throw new Error(`tempo esgotado: ${what}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

function positionOf(doc: vscode.TextDocument, needle: string, end = true): vscode.Position {
  const i = doc.getText().indexOf(needle);
  assert.ok(i >= 0, `${needle} não encontrado`);
  return doc.positionAt(end ? i + needle.length : i);
}

const results: string[] = [];
async function step(name: string, run: () => Promise<void>): Promise<void> {
  await run();
  results.push(`ok - ${name}`);
  console.log(`ok - ${name}`);
}

export async function run(): Promise<void> {
  const planta = await vscode.workspace.openTextDocument(file("planta/vendas.planta"));
  const editor = await vscode.window.showTextDocument(planta);

  await step("a linguagem planta é reconhecida e a extensão ativa", async () => {
    assert.equal(planta.languageId, "planta");
    const ext = vscode.extensions.all.find((e) => e.packageJSON.name === "planta-vscode");
    await until("ativação", () => ext?.isActive);
  });

  await step("diagnósticos ao digitar (sem salvar)", async () => {
    await editor.edit((b) => {
      const at = positionOf(planta, "uses ClienteRepository");
      b.insert(at, "x");
    });
    const d = await until("PL110", () => vscode.languages.getDiagnostics(planta.uri).find((x) => String(typeof x.code === "object" ? x.code.value : x.code) === "PL110"));
    assert.match(d.message, /ClienteRepositoryx/);
    await editor.edit((b) => {
      const at = positionOf(planta, "uses ClienteRepositoryx");
      b.delete(new vscode.Range(at.translate(0, -1), at));
    });
    await until("PL110 some", () => !vscode.languages.getDiagnostics(planta.uri).some((x) => String(typeof x.code === "object" ? x.code.value : x.code) === "PL110"));
  });

  await step("completar âncora: arquivos sob o root, depois símbolos", async () => {
    const at = positionOf(planta, "  dto CriarClienteDto");
    await editor.edit((b) => b.insert(at, '\n  service Novo @"clientes/'));
    const end = positionOf(planta, 'service Novo @"clientes/');
    const files = await vscode.commands.executeCommand<vscode.CompletionList>("vscode.executeCompletionItemProvider", planta.uri, end, "/");
    const labels = files.items.map((i) => (typeof i.label === "string" ? i.label : i.label.label));
    assert.ok(labels.includes("clientes.service.ts"), String(labels));

    await editor.edit((b) => b.insert(end, "clientes.service.ts#"));
    const symbols = await vscode.commands.executeCommand<vscode.CompletionList>("vscode.executeCompletionItemProvider", planta.uri, positionOf(planta, "clientes.service.ts#"), "#");
    const names = symbols.items.map((i) => (typeof i.label === "string" ? i.label : i.label.label));
    assert.ok(names.includes("ClientesService.criar"), String(names));
    await vscode.commands.executeCommand("undo");
    await vscode.commands.executeCommand("undo");
  });

  await step("hover com código ancorado e requisito", async () => {
    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>("vscode.executeHoverProvider", planta.uri, positionOf(planta, "uses ClientesService"));
    const text = hovers.flatMap((h) => h.contents.map((c) => (typeof c === "string" ? c : c.value))).join("\n");
    assert.match(text, /\*\*service\*\* `Vendas\.ClientesService`/);
  });

  await step("ir para definição: da âncora para o código", async () => {
    const defs = await vscode.commands.executeCommand<(vscode.Location | vscode.LocationLink)[]>("vscode.executeDefinitionProvider", planta.uri, positionOf(planta, '@"clientes/clientes.service.ts'));
    const target = "targetUri" in defs[0]! ? defs[0].targetUri : defs[0]!.uri;
    assert.match(target.fsPath, /clientes\.service\.ts$/);
  });

  await step("renomear em todos os arquivos", async () => {
    const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>("vscode.executeDocumentRenameProvider", planta.uri, positionOf(planta, "uses ClientesService"), "ServicoClientes");
    assert.equal(edit.get(planta.uri).length, 3);
  });

  await step("contorno e formatação", async () => {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>("vscode.executeDocumentSymbolProvider", planta.uri);
    assert.equal(symbols[0]!.name, "Vendas");
    const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>("vscode.executeFormatDocumentProvider", planta.uri, { tabSize: 2, insertSpaces: true });
    assert.equal((edits ?? []).length, 0, "o fixture já está formatado");
  });

  await step("CodeLens no código", async () => {
    const service = await vscode.workspace.openTextDocument(file("apps/api/src/vendas/clientes/clientes.service.ts"));
    await vscode.window.showTextDocument(service);
    const lenses = await until("CodeLens", async () => {
      const found = await vscode.commands.executeCommand<vscode.CodeLens[]>("vscode.executeCodeLensProvider", service.uri);
      return found.some((l) => l.command?.title.includes("REQ-001")) ? found : undefined;
    });
    const lens = lenses.find((l) => l.command?.title.startsWith("Vendas.ClientesService.criar"))!;
    assert.equal(lens.command!.title, "Vendas.ClientesService.criar · REQ-001 · nunca revisado");
    await vscode.commands.executeCommand(lens.command!.command, ...lens.command!.arguments!);
    assert.match(vscode.window.activeTextEditor!.document.uri.fsPath, /vendas\.planta$/, "o clique leva à planta");
  });

  await step("pré-visualização de views", async () => {
    await vscode.commands.executeCommand("planta.previewView", "classes-Vendas");
    const tab = await until("aba do painel", () => vscode.window.tabGroups.all.flatMap((g) => g.tabs).find((t) => t.label === "Planta: classes-Vendas"), 15000);
    assert.ok(tab.input instanceof vscode.TabInputWebview);
  });
}
