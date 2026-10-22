// Fase 4: diff arquitetural, política de aceite, formatos para CI, suggest e MCP.
// Critério do roadmap: um PR feito por agente recebe comentário de diff arquitetural.

import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";
import { handle } from "../src/mcp.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const FIXTURE = join(ROOT, "test/fixtures/loja");
const HUMAN = "maria@acme.com";
const AGENT = "agente@bots.acme.com";

function repo() {
  const root = mkdtempSync(join(tmpdir(), "planta-fase4-"));
  cpSync(FIXTURE, root, { recursive: true });
  const git = (email: string, ...args: string[]) => execFileSync("git", ["-c", `user.email=${email}`, "-c", "user.name=X", ...args], { cwd: root }).toString();
  const run = async (env: Record<string, string>, ...argv: string[]) => {
    let out = "";
    let err = "";
    const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (err += t), env });
    return { code, out, err };
  };
  const p = {
    root,
    git,
    run: (...argv: string[]) => run({ PLANTA_REVIEWER: HUMAN }, ...argv),
    runAs: run,
    commit(email: string, message: string, ...body: string[]) {
      git(email, "add", "-A");
      git(email, "commit", "-qm", message, ...body.flatMap((b) => ["-m", b]));
    },
    edit(path: string, change: (t: string) => string) {
      const file = join(root, path);
      const after = change(readFileSync(file, "utf8"));
      writeFileSync(file, after);
    },
  };
  return p;
}

/** Repositório com linha de base revisada em `main` e um branch `agente` com o PR. */
async function prRepo() {
  const p = repo();
  p.edit("planta/planta.config.yaml", (t) => `${t}\nreview:\n  forbidAgentAccept: true\n  agentIdentities: ["*@bots.acme.com", "noreply@anthropic.com"]\n`);
  p.git(HUMAN, "init", "-q", "-b", "main");
  p.commit(HUMAN, "base");
  await p.run("accept", "--all");
  p.commit(HUMAN, "linha de base");
  p.git(HUMAN, "checkout", "-qb", "agente");

  p.edit("apps/api/src/vendas/clientes/clientes.controller.ts", (t) => t
    .replace("import { Body, Controller, Get, Param, Post }", "import { Body, Controller, Delete, Get, Param, Post }")
    .replace("  @Get(':id')", "  @Delete(':id')\n  remover(@Param('id') id: string): Promise<void> {\n    return this.service.remover(id);\n  }\n\n  @Get(':id')"));
  p.edit("apps/api/src/vendas/clientes/clientes.service.ts", (t) => t
    .replace("import { CriarClienteDto } from './dto/criar-cliente.dto';", "import { CriarClienteDto } from './dto/criar-cliente.dto';\nimport { EmailListener } from '../notificacoes/email.listener';")
    .replace("    private readonly eventos: EventEmitter2,", "    private readonly eventos: EventEmitter2,\n    private readonly emails: EmailListener,")
    .replace("  async buscar(id: string): Promise<Cliente | null> {", "  async remover(id: string): Promise<void> {}\n\n  async buscar(id: string, incluirPedidos?: boolean): Promise<Cliente | null> {"));
  writeFileSync(join(p.root, "apps/api/src/vendas/clientes/exclusao.entity.ts"), "@Entity()\nexport class Exclusao {\n  @PrimaryGeneratedColumn('uuid') id: string;\n  @Column() motivo: string;\n}\n");
  p.edit("planta/vendas.planta", (t) => t
    .replace("    op buscar(id: uuid) -> Cliente?\n    uses ClientesService", "    op buscar(id: uuid) -> Cliente?\n    op remover(id: uuid)\n    uses ClientesService")
    .replace("    op buscar(id: uuid) -> Cliente?\n    uses ClienteRepository", '    op buscar(id: uuid, incluirPedidos: bool?) -> Cliente?\n    op remover(id: uuid) justifiedBy "REQ-003"\n    uses ClienteRepository, EmailListener')
    .replace("  event ClienteCadastrado {", '  entity Exclusao @"clientes/exclusao.entity.ts#Exclusao" {\n    id: uuid key\n    motivo: string sensitive\n  }\n\n  event ClienteCadastrado {')
    .replace('      justifiedBy "REQ-002"\n    }', '      justifiedBy "REQ-002"\n    }\n    endpoint DELETE "/clientes/:id" => ClientesController.remover {\n      param id: uuid in path\n      returns 200\n      auth bearer roles [admin]\n      justifiedBy "REQ-003"\n    }')
    .replace("    step persistir: ClientesService.criar\n", '    step persistir: ClientesService.criar\n    step auditar: "registro manual"\n')
    .replace("  job ReenviarEmails cron \"0 3 * * *\" => EmailListener.reenviarPendentes\n", ""));
  p.edit("docs/requisitos/clientes.md", (t) => `${t}\n## REQ-003 Exclusão de cliente\n\nUm administrador pode excluir um cliente.\n`);
  p.commit(AGENT, "feat: exclusão de cliente");
  return p;
}

describe("critério da fase 4: diff arquitetural do PR do agente", () => {
  it("Markdown para o comentário do PR", async () => {
    const p = await prRepo();
    const r = await p.run("diff", "main", "--format", "markdown");
    assert.equal(r.code, 0, r.err);
    const md = r.out;
    assert.match(md, /^## 🏗️ Mudanças arquiteturais\n\n\*\*Contexto Vendas\*\*\n/);
    assert.match(md, /- ➕ \*\*endpoint\*\* `DELETE \/api\/v1\/clientes\/:id` → `ClientesController\.remover`\n {2}- justifiedBy REQ-003 · auth bearer \[admin\]/);
    assert.match(md, /- ➕ \*\*entity\*\* `Exclusao` \(2 campos\) · 🔒 contém `tag\(pii\)`: `motivo`/);
    assert.match(md, /- ✏️ \*\*process\*\* `CadastrarCliente`\n {2}- ➕ passo `auditar`/);
    assert.match(md, /- ✏️ \*\*service\*\* `ClientesService`\n {2}- ➕ uses `EmailListener`/);
    assert.match(md, /```diff\n {2}- async buscar\(id: string\): Promise<Cliente \| null>\n {2}\+ async buscar\(id: string, incluirPedidos\?: boolean\): Promise<Cliente \| null>\n {2}```/);
    assert.match(md, /- ➖ \*\*job\*\* `ReenviarEmails`/);
    assert.match(md, /\*\*Dependências reais\*\*\n\n- ➕ `Vendas\.ClientesService` → `Vendas\.EmailListener`/);
    assert.match(md, /- REQ-003 Exclusão de cliente: 0 → 2 elementos/);
    assert.match(md, /\*\*Pendente de revisão humana:\*\* \d+ elementos/);
    assert.doesNotMatch(md, /\*\*controller\*\* `ClientesController` · assinatura alterada/, "membro novo já aparece como op");
  });

  it("texto, JSON e comparação entre duas referências", async () => {
    const p = await prRepo();
    const text = (await p.run("diff", "main")).out;
    assert.match(text, /^Mudanças arquiteturais\n\nContexto Vendas\n/);
    assert.doesNotMatch(text, /\*\*|`/);
    const json = JSON.parse((await p.run("diff", "main", "--format", "json")).out);
    assert.ok(json.groups[0].changes.some((c: { id: string; change: string }) => c.id === "Vendas.Exclusao" && c.change === "added"));
    assert.match((await p.run("diff", "main", "agente")).out, /DELETE \/api\/v1\/clientes\/:id/);
    assert.match((await p.run("diff", "agente", "agente", "--format", "markdown")).out, /Nenhuma mudança arquitetural/);
  });

  it("base sem planta: tudo é novo; referência inválida é falha de execução", async () => {
    const p = repo();
    p.git(HUMAN, "init", "-q", "-b", "main");
    writeFileSync(join(p.root, "LEIAME.md"), "x");
    p.git(HUMAN, "add", "LEIAME.md");
    p.git(HUMAN, "commit", "-qm", "antes da planta");
    p.commit(HUMAN, "planta");
    const r = await p.run("diff", "HEAD~1", "--format", "markdown");
    assert.match(r.out, /- ➕ \*\*context\*\* `Vendas`/);
    assert.equal((await p.run("diff", "nao-existe")).code, 2);
  });
});

describe("política de aceite (PL405)", () => {
  it("lock alterado por autor agente, por coautor agente e aceito em nome de agente", async () => {
    const p = await prRepo();
    assert.ok(!(await codes(p, "--base", "main")).includes("PL405"), "o agente mudou código e planta, não o lock");

    await p.runAs({ PLANTA_REVIEWER: AGENT }, "accept", "--all");
    p.commit(HUMAN, "aceita", "Co-authored-by: Claude <noreply@anthropic.com>");
    const diags = await diagnostics(p, "--base", "main");
    const pl405 = diags.filter((d) => d.code === "PL405").map((d) => d.message);
    assert.equal(pl405.length, 2);
    assert.match(pl405.join("\n"), /alterado no commit [0-9a-f]{7} por agente \(noreply@anthropic\.com\)/);
    assert.match(pl405.join("\n"), /elemento\(s\) aceito\(s\) por agente@bots\.acme\.com/);
  });

  it("humano aceitando no PR passa; sem identidades configuradas, nada é verificado", async () => {
    const p = await prRepo();
    await p.run("accept", "--all");
    p.commit(HUMAN, "revisão humana");
    assert.ok(!(await codes(p, "--base", "main")).includes("PL405"));
    p.edit("apps/api/src/vendas/clientes/clientes.service.ts", (t) => t.replace("async remover(id: string)", "async remover(id: string, motivo?: string)"));
    await p.runAs({ PLANTA_REVIEWER: AGENT }, "accept", "--all");
    p.commit(AGENT, "aceite do agente");
    p.edit("planta/planta.config.yaml", (t) => t.replace(/review:[\s\S]*$/, ""));
    assert.ok(!(await codes(p, "--base", "main")).includes("PL405"));
  });

  it("accept sob PLANTA_AGENT=1 é recusado sem imprimir a ajuda", async () => {
    const p = await prRepo();
    const r = await p.runAs({ PLANTA_AGENT: "1", PLANTA_REVIEWER: HUMAN }, "accept", "--all");
    assert.equal(r.code, 2);
    assert.match(r.err, /^planta: aceite recusado/);
    assert.doesNotMatch(r.err, /Uso:/);
  });
});

async function diagnostics(p: ReturnType<typeof repo>, ...argv: string[]) {
  return JSON.parse((await p.run("check", "--format", "json", ...argv)).out).diagnostics as { code: string; message: string }[];
}
async function codes(p: ReturnType<typeof repo>, ...argv: string[]) {
  return (await diagnostics(p, ...argv)).map((d) => d.code);
}

describe("formatos para CI", () => {
  it("SARIF 2.1.0 com caminho relativo ao repositório e descrição da regra", async () => {
    const p = await prRepo();
    p.edit("planta/vendas.planta", (t) => t.replace("uses ClienteRepository, EmailListener", "uses ClienteRepository, EmailListener, Fantasma"));
    const r = await p.run("check", "--format", "sarif");
    assert.equal(r.code, 1);
    const sarif = JSON.parse(r.out);
    assert.equal(sarif.version, "2.1.0");
    const run = sarif.runs[0];
    assert.equal(run.tool.driver.name, "planta");
    const result = run.results.find((x: { ruleId: string }) => x.ruleId === "PL110");
    assert.equal(result.level, "error");
    assert.equal(result.locations[0].physicalLocation.artifactLocation.uri, "planta/vendas.planta");
    assert.ok(result.locations[0].physicalLocation.region.startLine > 0);
    assert.equal(run.tool.driver.rules.find((x: { id: string }) => x.id === "PL110").shortDescription.text, "Referência não resolvida");
    assert.ok(run.results.some((x: { level: string }) => x.level === "warning"));
  });

  it("Markdown para comentário", async () => {
    const p = await prRepo();
    const md = (await p.run("check", "--format", "markdown")).out;
    assert.match(md, /^## Planta\n\n\d+ erro\(s\) · \d+ aviso\(s\)/);
    assert.match(md, /\| ✖ \| PL401 \| `planta\/vendas\.planta:\d+` \|/);
    assert.match(md, /\| ⚠ \| PL403 \| `planta\/vendas\.planta:\d+` \|/);
  });

  it("workflow do GitHub Actions", async () => {
    const p = repo();
    const yaml = (await p.run("ci", "github")).out;
    assert.match(yaml, /npx planta check --base origin\/\$\{\{ github\.base_ref \}\} --format sarif > planta\.sarif/);
    assert.match(yaml, /npx planta diff origin\/\$\{\{ github\.base_ref \}\} --format markdown > diff\.md/);
    assert.match(yaml, /marocchino\/sticky-pull-request-comment@v2/);
    assert.match(yaml, /fetch-depth: 0/);
    assert.equal((await p.run("ci", "github", "--write")).code, 0);
    assert.ok(existsSync(join(p.root, ".github/workflows/planta.yml")));
    assert.equal((await p.run("ci", "github", "--write")).code, 2, "não sobrescreve");
    assert.equal((await p.run("ci", "gitlab")).code, 2);
  });
});

describe("planta suggest", () => {
  it("sugere endpoint e entidade; colar a entidade fecha a lacuna", async () => {
    const p = repo();
    p.edit("apps/api/src/vendas/clientes/clientes.controller.ts", (t) => t
      .replace("import { Body, Controller, Get, Param, Post }", "import { Body, Controller, Delete, Get, Param, Post }")
      .replace("  @Get(':id')", "  @Delete(':id')\n  remover(@Param('id') id: string) {}\n\n  @Get(':id')"));
    writeFileSync(join(p.root, "apps/api/src/vendas/clientes/exclusao.entity.ts"), "@Entity()\nexport class Exclusao {\n  @PrimaryGeneratedColumn('uuid') id: string;\n  @Column({ length: 200 }) motivo: string;\n}\n");
    const out = (await p.run("suggest", "--uncovered")).out;
    assert.match(out, /\/\/ dentro de `api RestPublica`\nendpoint DELETE "\/clientes\/:id" => ClientesController\.remover \{\n {2}param id: string in path\n {2}returns 200\n\}/);
    const entity = /entity Exclusao @"clientes\/exclusao\.entity\.ts#Exclusao" \{\n {2}id: uuid key\n {2}motivo: string max\(200\)\n\}/.exec(out)?.[0];
    assert.ok(entity, out);

    p.edit("planta/vendas.planta", (t) => t.replace("  event ClienteCadastrado {", `  ${entity!.replace(/\n/g, "\n  ")}\n\n  event ClienteCadastrado {`));
    const after = (await p.run("check", "--format", "json")).out;
    const left = JSON.parse(after).diagnostics.filter((d: { code: string; message: string }) => d.code !== "PL403");
    assert.deepEqual(left.map((d: { code: string; message: string }) => `${d.code} ${d.message}`), [
      "PL301 cobertura: rota DELETE /api/v1/clientes/:id (ClientesController.remover) não aparece na planta",
    ]);
    assert.equal((await p.run("suggest", "--fact", "nao:existe")).code, 2);
  });
});

describe("query e context", () => {
  it("seletores", async () => {
    const p = repo();
    assert.match((await p.run("query", "Vendas.RestPublica.*")).out, /^Vendas\.RestPublica\.buscar \(endpoint\) → apps\/api\/src\/vendas\/clientes\/clientes\.controller\.ts\nVendas\.RestPublica\.criar/);
    assert.match((await p.run("query", "every service where layer = aplicacao")).out, /^Vendas\.ClientesService \(service\)/);
    assert.equal((await p.run("query", "qualquer coisa")).code, 2);
  });

  it("contexto compacto de processo e busca por tarefa", async () => {
    const p = repo();
    const ctx = (await p.run("context", "Vendas.CadastrarCliente")).out;
    assert.match(ctx, /^PROCESS Vendas\.CadastrarCliente\nrequisitos: REQ-001 \| gatilho: POST \/api\/v1\/clientes\npassos:\n {2}1 persistir → ClientesService\.criar {4}apps\/api\/src\/vendas\/clientes\/clientes\.service\.ts\n/);
    assert.match(ctx, /estado: nunca revisado/);
    const task = (await p.run("context", "consultar", "um", "cliente", "pelo", "identificador")).out;
    assert.match(task.split("\n")[0]!, /^ENDPOINT Vendas\.RestPublica\.buscar$/);
  });
});

describe("servidor MCP", () => {
  const options = () => ({ dir: "planta", cwd: repo().root, version: "0.1.0" });

  it("initialize, lista de ferramentas e versão de protocolo", async () => {
    const o = options();
    const init = await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } }, o) as Record<string, unknown>;
    assert.equal(init.protocolVersion, "2024-11-05");
    assert.match(String(init.instructions), /Não existe ferramenta de aceite/);
    const old = await handle({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } }, o) as Record<string, unknown>;
    assert.equal(old.protocolVersion, "2025-06-18");
    const { tools } = await handle({ jsonrpc: "2.0", id: 3, method: "tools/list" }, o) as { tools: { name: string; inputSchema: { type: string } }[] };
    assert.deepEqual(tools.map((t) => t.name), [
      "planta_overview", "planta_query", "planta_element", "planta_where", "planta_impact", "planta_context",
      "planta_rules", "planta_check", "planta_suggest", "planta_trace", "planta_diff",
    ]);
    assert.ok(tools.every((t) => t.inputSchema.type === "object"));
    assert.ok(!tools.some((t) => /accept|aceit/.test(t.name)));
  });

  it("cada ferramenta responde; erro de uso volta como isError", async () => {
    const o = options();
    const call = async (name: string, args: Record<string, unknown> = {}) =>
      (await handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, o)) as { content: { text: string }[]; isError?: boolean };
    assert.match((await call("planta_overview")).content[0]!.text, /^SISTEMA Loja/);
    assert.match((await call("planta_query", { selector: "every endpoint" })).content[0]!.text, /Vendas\.RestPublica\.criar \(endpoint\)/);
    assert.match((await call("planta_element", { id: "Vendas.Cliente" })).content[0]!.text, /"kind": "entity"/);
    assert.match((await call("planta_where", { file: "apps/api/src/vendas/clientes/cliente.entity.ts" })).content[0]!.text, /^ENTITY Vendas\.Cliente/);
    assert.match((await call("planta_impact", { id: "REQ-001" })).content[0]!.text, /Justificado por \(3\)/);
    assert.match((await call("planta_context", { target: "REQ-002" })).content[0]!.text, /^REQUISITO REQ-002 — Consulta de cliente/);
    assert.match((await call("planta_check")).content[0]!.text, /WARNING PL403/);
    assert.match((await call("planta_suggest")).content[0]!.text, /Nenhum fato sem descrição/);
    assert.match((await call("planta_trace", { requirement: "REQ-001" })).content[0]!.text, /Vendas\.CadastrarCliente \(process\)/);
    const bad = await call("planta_element", { id: "Nada" });
    assert.equal(bad.isError, true);
    assert.equal((await call("planta_query", {})).isError, true);
  });

  it("recursos: modelo, view e requisito", async () => {
    const o = options();
    const { resources } = await handle({ jsonrpc: "2.0", id: 1, method: "resources/list" }, o) as { resources: { uri: string }[] };
    assert.ok(resources.some((r) => r.uri === "planta://model"));
    assert.ok(resources.some((r) => r.uri === "planta://view/er-Vendas"));
    const read = async (uri: string) => (await handle({ jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri } }, o) as { contents: { text: string }[] }).contents[0]!.text;
    assert.equal(JSON.parse(await read("planta://model")).schema, "planta.model/1");
    assert.match(await read("planta://view/er-Vendas"), /^erDiagram/);
    assert.match(await read("planta://requirement/REQ-001"), /^## REQ-001 Cadastro de cliente/);
    assert.match(JSON.parse(await read("planta://element/Vendas.Pedido")).kind, /entity/);
    await assert.rejects(handle({ jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri: "planta://nada" } }, o));
  });

  it("stdio: uma resposta por linha, notificações sem resposta, JSON inválido", { timeout: 30_000 }, async () => {
    const o = options();
    const child = spawn(join(ROOT, "node_modules/.bin/tsx"), [join(ROOT, "src/cli.ts"), "mcp"], { cwd: o.cwd });
    const lines: string[] = [];
    const done = new Promise<void>((resolve) => {
      let buffer = "";
      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const parts = buffer.split("\n");
        buffer = parts.pop()!;
        lines.push(...parts.filter(Boolean));
        if (lines.length >= 3) resolve();
      });
    });
    const send = (msg: unknown) => child.stdin.write(`${JSON.stringify(msg)}\n`);
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    child.stdin.write("isto não é json\n");
    send({ jsonrpc: "2.0", id: 2, method: "ping" });
    await done;
    child.stdin.end();
    const msgs = lines.map((l) => JSON.parse(l));
    assert.equal(msgs[0].id, 1);
    assert.equal(msgs[1].error.code, -32700);
    assert.deepEqual(msgs[2], { jsonrpc: "2.0", id: 2, result: {} });
    await new Promise((r) => child.on("exit", r));
  });
});
