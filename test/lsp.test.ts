// Fase 5: servidor de linguagem. Os recursos são testados direto sobre o
// `Workspace` (rápido e determinístico) e o servidor inteiro, uma vez, sobre
// stdio como um editor o usaria.

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import type { CodeAction, CompletionItem, Position, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { main } from "../src/cli.ts";
import { codeActions, codeLenses, plantaActions } from "../src/lsp/actions.ts";
import { complete } from "../src/lsp/completion.ts";
import { definition, documentSymbols, hover, prepareRename, references, rename, semanticTokens } from "../src/lsp/features.ts";
import { Workspace } from "../src/lsp/workspace.ts";
import { LspClient } from "./support/lsp-client.ts";

const FIXTURE = new URL("./fixtures/loja", import.meta.url).pathname;
const PLANTA = "planta/vendas.planta";
const SERVICE = "apps/api/src/vendas/clientes/clientes.service.ts";
const CONTROLLER = "apps/api/src/vendas/clientes/clientes.controller.ts";

function copy(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "planta-lsp-")));
  cpSync(FIXTURE, root, { recursive: true });
  return root;
}

function edit(root: string, path: string, change: (t: string) => string): void {
  const file = join(root, path);
  const before = readFileSync(file, "utf8");
  const after = change(before);
  assert.notEqual(after, before, `a edição de ${path} não mudou nada`);
  writeFileSync(file, after);
}

async function workspace(root: string, options: { check?: boolean } = {}): Promise<Workspace> {
  const ws = new Workspace(root, join(root, "planta"));
  if (options.check !== false) await ws.check();
  return ws;
}

/** Posição (base 0) do fim de `needle` no arquivo, ou do início (mais `shift`) com `start`. */
function pos(text: string, needle: string, start = false, shift = 0): Position {
  const i = text.indexOf(needle);
  assert.ok(i >= 0, `${needle} não encontrado`);
  const offset = start ? i + shift : i + needle.length;
  const before = text.slice(0, offset).split("\n");
  return { line: before.length - 1, character: before.at(-1)!.length };
}

/** Completa com `insertion` digitado logo depois de `after`, dentro do arquivo da planta. */
async function completeAt(ws: Workspace, root: string, after: string, insertion: string): Promise<CompletionItem[]> {
  const abs = join(root, PLANTA);
  const original = readFileSync(abs, "utf8");
  const at = original.indexOf(after) + after.length;
  const text = original.slice(0, at) + insertion + original.slice(at);
  ws.open(abs, text);
  return complete(ws, abs, text, at + insertion.length);
}

const labels = (items: CompletionItem[]) => items.map((i) => i.label);

function applyEdit(root: string, edit: WorkspaceEdit): void {
  for (const [target, edits] of Object.entries(edit.changes ?? {})) {
    const file = fileURLToPath(target);
    writeFileSync(file, applyText(readFileSync(file, "utf8"), edits));
  }
}

function applyText(text: string, edits: TextEdit[]): string {
  const lines = text.split("\n");
  const offset = (p: Position) => lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + p.character;
  let out = text;
  for (const e of [...edits].sort((a, b) => offset(b.range.start) - offset(a.range.start))) {
    out = out.slice(0, offset(e.range.start)) + e.newText + out.slice(offset(e.range.end));
  }
  return out;
}

function lspDiagnostics(ws: Workspace, code: string) {
  return (ws.checked?.result.diagnostics ?? []).filter((d) => d.code === code).map((d) => ({
    range: { start: { line: d.loc.line - 1, character: d.loc.column - 1 }, end: { line: d.loc.line - 1, character: d.loc.column } },
    message: d.message,
    code: d.code,
    ...(d.data && { data: d.data }),
  }));
}

/** Códigos da verificação completa, sem PL403: o fixture não tem lock, nada foi revisado. */
async function codesAfter(root: string): Promise<string[]> {
  return ((await workspace(root)).checked!.result.diagnostics).map((d) => d.code).filter((c) => c !== "PL403");
}

describe("diagnósticos enquanto se digita", () => {
  it("referência quebrada vira PL110 sem salvar", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const abs = join(root, PLANTA);
    ws.open(abs, readFileSync(abs, "utf8").replace("uses ClienteRepository", "uses ClienteRepositori"));
    const d = ws.analyze().diagnostics.filter((x) => x.code === "PL110");
    assert.equal(d.length, 1);
    assert.equal(d[0]!.loc.file, PLANTA);
  });

  it("arquivo com erro de sintaxe usa a última versão válida: sem cascata de PL110", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    ws.analyze();
    const abs = join(root, PLANTA);
    ws.open(abs, readFileSync(abs, "utf8").replace("entity Pedido @", "entity Pedido { @"));
    const codes = ws.analyze().diagnostics.map((d) => d.code);
    assert.ok(codes.includes("PL100"));
    assert.ok(!codes.includes("PL110"), String(codes));
    assert.ok(ws.analyze().model.ir.elements["Vendas.Pedido"], "o elemento continua no modelo");
  });
});

describe("verificação completa", () => {
  it("vale mesmo se um documento muda enquanto ela roda", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const running = ws.check();
    const abs = join(root, PLANTA);
    ws.open(abs, readFileSync(abs, "utf8") + "\n");
    await running;
    assert.ok(ws.checked, "o resultado não pode ser descartado: o próximo só viria ao salvar");
  });
});

describe("autocompletar", () => {
  it("âncora: pastas e arquivos sob o root do contexto", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const dirs = labels(await completeAt(ws, root, "  dto CriarClienteDto", '\n  service Novo @"'));
    assert.ok(dirs.includes("clientes/") && dirs.includes("pedidos/"), String(dirs));
    const files = labels(await completeAt(ws, root, "  dto CriarClienteDto", '\n  service Novo @"clientes/'));
    assert.ok(files.includes("clientes.service.ts") && files.includes("dto/"), String(files));
    const absolute = labels(await completeAt(ws, root, "  dto CriarClienteDto", '\n  service Novo @"/apps/api/src/'));
    assert.ok(absolute.includes("main.ts") && absolute.includes("vendas/"), String(absolute));
  });

  it("âncora: depois de #, os símbolos do arquivo", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const items = labels(await completeAt(ws, root, "  dto CriarClienteDto", '\n  service Novo @"clientes/clientes.service.ts#'));
    assert.ok(items.includes("ClientesService") && items.includes("ClientesService.criar"), String(items));
  });

  it("âncora só com #: o arquivo da âncora do componente", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const items = labels(await completeAt(ws, root, "    op buscar(id: uuid) -> Cliente?\n    uses ClienteRepository", '\n    op contar() @"#'));
    assert.ok(items.includes("ClientesService.buscar"), String(items));
  });

  it("nomes pelo tipo aceito na posição", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const uses = labels(await completeAt(ws, root, "    uses ClientesService", ", "));
    assert.ok(uses.includes("ClienteRepository") && uses.includes("EmailListener"), String(uses));
    assert.ok(!uses.includes("Cliente") && !uses.includes("RestPublica"), String(uses));

    const types = labels(await completeAt(ws, root, "    observacao: text?", "\n    vendedor: "));
    assert.ok(types.includes("Cliente") && types.includes("uuid"), String(types));
    assert.ok(!types.includes("ClientesService"), String(types));

    const ops = labels(await completeAt(ws, root, "    step notificar: emit ClienteCadastrado", "\n    step outro: ClientesService."));
    assert.deepEqual(ops.sort(), ["buscar", "criar"]);

    const events = labels(await completeAt(ws, root, "  on ClienteCadastrado => EmailListener.enviarBoasVindas", "\n  on "));
    assert.deepEqual(events, ["ClienteCadastrado"]);
  });

  it("palavras-chave do bloco no início da linha", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const inContext = labels(await completeAt(ws, root, "  dto CriarClienteDto", "\n  se"));
    assert.ok(inContext.includes("service") && inContext.includes("entity") && !inContext.includes("endpoint"), String(inContext));
    const inApi = labels(await completeAt(ws, root, '  api RestPublica http base "/api/v1" {', "\n    "));
    assert.deepEqual(inApi, ["endpoint"]);
  });

  it("IDs de requisito em justifiedBy", async () => {
    const root = copy();
    const ws = await workspace(root);
    const items = await completeAt(ws, root, "    op salvar(cliente: Cliente) -> Cliente", ' justifiedBy "');
    assert.deepEqual(labels(items).sort(), ["REQ-001", "REQ-002"]);
    assert.ok(items[0]!.detail);
  });
});

describe("navegação", () => {
  it("hover: tipo, código ancorado, revisão e requisitos com texto", async () => {
    const root = copy();
    const ws = await workspace(root);
    const abs = join(root, PLANTA);
    const text = readFileSync(abs, "utf8");
    const h = hover(ws, abs, pos(text, "uses ClientesService", false))!;
    const value = (h.contents as { value: string }).value;
    assert.match(value, /\*\*service\*\* `Vendas\.ClientesService`/);
    assert.match(value, /código: \[apps\/api\/src\/vendas\/clientes\/clientes\.service\.ts#ClientesService\]\(file:.*#L\d+\)/);
    assert.match(value, /nunca revisado/);

    const op = hover(ws, abs, pos(text, "op criar(dto: CriarClienteDto) -> Cliente justifiedBy", true, 3))!;
    assert.match((op.contents as { value: string }).value, /\*\*REQ-001\*\*/);

    const req = hover(ws, abs, pos(text, 'justifiedBy "REQ-002', false))!;
    assert.match((req.contents as { value: string }).value, /\*\*REQ-002\*\*[\s\S]*docs\/requisitos\/clientes\.md:\d+/);
  });

  it("ir para definição: referência, âncora e requisito", async () => {
    const root = copy();
    const ws = await workspace(root);
    const abs = join(root, PLANTA);
    const text = readFileSync(abs, "utf8");

    const [decl] = await definition(ws, abs, pos(text, "uses ClientesService", false));
    assert.equal(decl!.uri, pathToFileURL(abs).href);
    assert.deepEqual(decl!.range.start, pos(text, "ClientesService @", true));

    const [code] = await definition(ws, abs, pos(text, '@"clientes/clientes.service.ts', false));
    assert.equal(code!.uri, pathToFileURL(join(root, SERVICE)).href);
    const service = readFileSync(join(root, SERVICE), "utf8");
    assert.equal(code!.range.start.line, pos(service, "export class ClientesService", true).line);

    const [req] = await definition(ws, abs, pos(text, 'justifiedBy "REQ-002', false));
    assert.match(req!.uri, /docs\/requisitos\/clientes\.md$/);
  });

  it("referências e contorno", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const abs = join(root, PLANTA);
    const text = readFileSync(abs, "utf8");
    const refs = references(ws, abs, pos(text, "entity Cliente", false), false);
    assert.ok(refs.length >= 6, `${refs.length} referências`);
    assert.equal(references(ws, abs, pos(text, "entity Cliente", false), true).length, refs.length + 1);

    const [vendas] = documentSymbols(ws, abs);
    assert.equal(vendas!.name, "Vendas");
    const names = vendas!.children!.map((c) => c.name);
    assert.ok(names.includes("Cliente") && names.includes("RestPublica") && names.includes("CadastrarCliente"), String(names));
    const api = vendas!.children!.find((c) => c.name === "RestPublica")!;
    assert.deepEqual(api.children!.map((c) => c.name), ["criar", "buscar"], "endpoints com nome implícito");
    const cliente = vendas!.children!.find((c) => c.name === "Cliente")!;
    assert.ok(cliente.range.end.line > cliente.range.start.line, "a extensão cobre o bloco");
  });

  it("realce semântico só nos nomes, sem sobreposição", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const data = semanticTokens(ws, join(root, PLANTA));
    assert.ok(data.length > 50 && data.length % 5 === 0);
  });
});

describe("renomear", () => {
  it("renomeia declaração e referências, e leva a revisão do lock junto", async () => {
    const root = copy();
    await main(["accept", "--all"], { cwd: root, out: () => {}, err: () => {}, env: { PLANTA_REVIEWER: "maria@acme.com" } });
    const ws = await workspace(root);
    const abs = join(root, PLANTA);
    const text = readFileSync(abs, "utf8");
    const at = pos(text, "uses ClientesService", false);
    assert.equal(prepareRename(ws, abs, at)!.placeholder, "ClientesService");

    const result = rename(ws, abs, at, "ServicoClientes")!;
    applyEdit(root, result);
    const after = readFileSync(abs, "utf8");
    assert.equal(after.match(/ServicoClientes/g)!.length, 3, "declaração, uses e passo do processo");
    assert.ok(!after.includes("ClientesService "), "nenhuma referência ficou para trás");
    assert.match(readFileSync(join(root, "planta/planta.lock"), "utf8"), /Vendas\.ServicoClientes\.criar:/);
    const codes = await codesAfter(root);
    assert.deepEqual(codes, [], "o nome mudou na planta, o código e a revisão continuam valendo");
  });

  it("endpoint com nome implícito acompanha a operação", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const abs = join(root, PLANTA);
    const text = readFileSync(abs, "utf8");
    applyEdit(root, rename(ws, abs, pos(text, "op criar(dto: CriarClienteDto) -> Cliente\n", true, 3), "cadastrar")!);
    const after = readFileSync(abs, "utf8");
    assert.match(after, /=> ClientesController\.cadastrar/);
    assert.match(after, /trigger RestPublica\.cadastrar/);
    const fresh = await workspace(root, { check: false });
    assert.deepEqual(fresh.analyze().diagnostics, []);
  });

  it("recusa nome que já existe", async () => {
    const root = copy();
    const ws = await workspace(root, { check: false });
    const abs = join(root, PLANTA);
    assert.throws(() => rename(ws, abs, pos(readFileSync(abs, "utf8"), "entity Pedido", false), "Cliente"), /já existe/);
  });
});

describe("ações rápidas", () => {
  it("PL420: adiciona a dependência real em uses", async () => {
    const root = copy();
    edit(root, SERVICE, (t) => t
      .replace("private readonly repo: ClienteRepository,", "private readonly repo: ClienteRepository,\n    private readonly emails: EmailListener,")
      .replace("import { Cliente }", "import { EmailListener } from '../notificacoes/email.listener';\nimport { Cliente }"));
    const ws = await workspace(root);
    const [action] = plantaActions(ws, join(root, PLANTA), lspDiagnostics(ws, "PL420"));
    assert.equal(action!.title, "Adicionar `uses EmailListener`");
    applyEdit(root, action!.edit!);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /uses ClienteRepository, EmailListener/);
    assert.ok(!(await codesAfter(root)).includes("PL420"));
  });

  it("PL210: fixa a âncora inferida", async () => {
    const root = copy();
    edit(root, PLANTA, (t) => t.replace(' @"clientes/cliente.repository.ts#ClienteRepository"', ""));
    const ws = await workspace(root);
    const [action] = plantaActions(ws, join(root, PLANTA), lspDiagnostics(ws, "PL210"));
    applyEdit(root, action!.edit!);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /repository ClienteRepository @"clientes\/cliente\.repository\.ts#ClienteRepository" \{/);
    assert.deepEqual(await codesAfter(root), []);
  });

  it("PL203: atualiza a âncora de um símbolo movido", async () => {
    const root = copy();
    const from = join(root, "apps/api/src/vendas/clientes/cliente.repository.ts");
    writeFileSync(join(root, "apps/api/src/vendas/clientes/repositorio.ts"), readFileSync(from, "utf8"));
    rmSync(from);
    const ws = await workspace(root);
    const actions = plantaActions(ws, join(root, PLANTA), lspDiagnostics(ws, "PL203"));
    assert.equal(actions.length, 1, "a operação herda a âncora: só a do componente se corrige");
    applyEdit(root, actions[0]!.edit!);
    assert.deepEqual(await codesAfter(root), []);
  });

  it("PL110: cria o elemento que falta, no contexto", async () => {
    const root = copy();
    edit(root, PLANTA, (t) => t.replace("    uses ClienteRepository", "    uses ClienteRepository, Notificador"));
    const ws = await workspace(root, { check: false });
    const d = ws.analyze().diagnostics.find((x) => x.code === "PL110")!;
    const actions = plantaActions(ws, join(root, PLANTA), [{ range: { start: { line: d.loc.line - 1, character: d.loc.column - 1 }, end: { line: d.loc.line - 1, character: d.loc.column } }, message: d.message, code: d.code, data: d.data }]);
    const titles = actions.map((a) => a.title);
    assert.ok(titles.includes("Criar `service Notificador`") && titles.includes("Criar `external Notificador`"), String(titles));
    applyEdit(root, actions.find((a) => a.title === "Criar `service Notificador`")!.edit!);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /\n  service Notificador\n\}\n$/);
    assert.ok(!(await workspace(root, { check: false })).analyze().diagnostics.some((x) => x.code === "PL110"));
  });

  it("PL110 em passo de processo: cria a operação no componente", async () => {
    const root = copy();
    edit(root, PLANTA, (t) => t.replace("    step persistir: ClientesService.criar", "    step validar: ClientesService.validar\n    step persistir: ClientesService.criar"));
    const ws = await workspace(root, { check: false });
    const d = ws.analyze().diagnostics.find((x) => x.code === "PL110")!;
    const [action] = plantaActions(ws, join(root, PLANTA), [{ range: { start: { line: d.loc.line - 1, character: d.loc.column - 1 }, end: { line: d.loc.line - 1, character: d.loc.column } }, message: d.message, code: d.code, data: d.data }]);
    assert.equal(action!.title, "Criar `op validar()` em `Vendas.ClientesService`");
    applyEdit(root, action!.edit!);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /    uses ClienteRepository\n    op validar\(\)\n  \}/);
  });
});

describe("no código", () => {
  it("CodeLens sobre cada símbolo ancorado, com requisitos e revisão", async () => {
    const root = copy();
    const ws = await workspace(root);
    const lenses = await codeLenses(ws, join(root, SERVICE));
    const titles = lenses.map((l) => l.command!.title);
    assert.ok(titles.includes("Vendas.ClientesService · nunca revisado"), String(titles));
    assert.ok(titles.includes("Vendas.ClientesService.criar · REQ-001 · nunca revisado"), String(titles));
    const lens = lenses.find((l) => l.command!.title.startsWith("Vendas.ClientesService.criar"))!;
    assert.equal(lens.command!.command, "planta.revealLocation");
    assert.equal(lens.command!.arguments![0], pathToFileURL(join(root, PLANTA)).href);
  });

  it("ir para a planta a partir do símbolo sob o cursor", async () => {
    const root = copy();
    const ws = await workspace(root);
    const text = readFileSync(join(root, SERVICE), "utf8");
    const actions = await codeActions(ws, join(root, SERVICE), { start: pos(text, "async criar"), end: pos(text, "async criar") });
    assert.equal(actions[0]!.title, "Ir para a planta: Vendas.ClientesService.criar");
  });

  it("adicionar à planta: endpoint novo entra na API certa e fecha a cobertura", async () => {
    const root = copy();
    edit(root, CONTROLLER, (t) => t.replace("  @Get(':id')", "  @Delete(':id')\n  remover(@Param('id') id: string) {}\n\n  @Get(':id')"));
    const ws = await workspace(root);
    assert.ok(ws.checked!.result.diagnostics.some((d) => d.code === "PL301"));
    const text = readFileSync(join(root, CONTROLLER), "utf8");
    const actions = await codeActions(ws, join(root, CONTROLLER), { start: pos(text, "remover("), end: pos(text, "remover(") });
    const add = actions.find((a): a is CodeAction & { edit: WorkspaceEdit } => a.title.startsWith("Adicionar à planta") && !!a.edit)!;
    assert.ok(add, String(actions.map((a) => a.title)));
    applyEdit(root, add.edit);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /      justifiedBy "REQ-002"\n    \}\n    endpoint DELETE "\/clientes\/:id" => ClientesController\.remover \{/);
    assert.ok(!(await codesAfter(root)).includes("PL301"));
  });
});

describe("planta fmt --pin-anchors", () => {
  it("torna explícitas as âncoras inferidas", async () => {
    const root = copy();
    edit(root, PLANTA, (t) => t.replace(' @"clientes/cliente.repository.ts#ClienteRepository"', ""));
    let out = "";
    const code = await main(["fmt", "--pin-anchors"], { cwd: root, out: (t) => (out += t), err: (t) => (out += t) });
    assert.equal(code, 0, out);
    assert.match(out, /1 âncora fixada/);
    assert.match(readFileSync(join(root, PLANTA), "utf8"), /repository ClienteRepository @"clientes\/cliente\.repository\.ts#ClienteRepository" \{/);
  });
});

describe("servidor sobre stdio", () => {
  it("inicializa, publica diagnósticos, completa e encerra", async () => {
    // Caminho como o editor manda, sem resolver links: no macOS, /var é link para /private/var.
    const root = mkdtempSync(join(tmpdir(), "planta-lsp-"));
    cpSync(FIXTURE, root, { recursive: true });
    const client = new LspClient(root);
    try {
      const init = await client.request<{ capabilities: Record<string, unknown> }>("initialize", {
        processId: process.pid, rootUri: pathToFileURL(root).href, capabilities: {}, workspaceFolders: null,
      });
      for (const c of ["completionProvider", "hoverProvider", "definitionProvider", "renameProvider", "codeActionProvider", "codeLensProvider", "semanticTokensProvider"]) {
        assert.ok(init.capabilities[c], c);
      }
      client.notify("initialized", {});

      const abs = join(root, PLANTA);
      const docUri = pathToFileURL(abs).href;
      const text = readFileSync(abs, "utf8").replace("uses ClienteRepository", "uses ClienteRepositori");
      client.notify("textDocument/didOpen", { textDocument: { uri: docUri, languageId: "planta", version: 1, text } });
      const published = await client.waitFor<{ uri: string; diagnostics: { code: string }[] }>(
        "textDocument/publishDiagnostics", (p) => p.uri === docUri && p.diagnostics.some((d) => d.code === "PL110"));
      assert.ok(published.diagnostics.length > 0);

      const items = await client.request<{ label: string }[]>("textDocument/completion", {
        textDocument: { uri: docUri }, position: pos(text, "uses ClienteRepositori"),
      });
      assert.ok(Array.isArray(items));

      const lenses = await client.request<{ command: { title: string } }[]>("textDocument/codeLens", { textDocument: { uri: pathToFileURL(join(root, SERVICE)).href } });
      assert.ok(lenses.some((l) => l.command.title.startsWith("Vendas.ClientesService")), JSON.stringify(lenses));

      const views = await client.request<{ name: string }[]>("planta/views", {});
      assert.ok(views.length > 0);
      const rendered = await client.request<{ text?: string }>("planta/renderView", { name: views[0]!.name });
      assert.ok(rendered.text);
    } finally {
      await client.close();
    }
  });
});
