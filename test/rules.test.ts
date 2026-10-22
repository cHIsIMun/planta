// Fase 7: motor de regras, verificação de processos e plugins, sobre
// test/fixtures/fullstack (que traz as regras da seção 22.8). Critério do
// roadmap: regras de camadas e de contextos aplicadas na CI.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";

const FIXTURE = new URL("./fixtures/fullstack", import.meta.url).pathname;
const ROOT = new URL("..", import.meta.url).pathname;
const VENDAS = "planta/vendas.planta";
const RULES = "planta/regras.planta";
const API = "apps/api/src";

function copy(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "planta-regras-")));
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

async function run(root: string, ...argv: string[]): Promise<{ code: number; out: string }> {
  let out = "";
  const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (out += t), env: { PLANTA_REVIEWER: "maria@acme.com" } });
  return { code, out };
}

interface Diag { code: string; severity: string; message: string; loc: { file: string; line: number }; related?: { file: string; line: number }[] }

async function diagnostics(root: string, ...codes: string[]): Promise<Diag[]> {
  const r = await run(root, "check", "--format", "json");
  return (JSON.parse(r.out).diagnostics as Diag[]).filter((d) => codes.includes(d.code));
}

const messages = async (root: string, ...codes: string[]) => (await diagnostics(root, ...codes)).map((d) => `${d.code} ${d.message}`);

function assertSome(list: string[], pattern: RegExp): void {
  assert.ok(list.some((m) => pattern.test(m)), `${pattern} em\n${list.join("\n")}`);
}

/** Catalogo passa a injetar (e importar) um serviço de Vendas. */
function catalogoUsaVendas(root: string): void {
  edit(root, `${API}/catalogo/produtos.controller.ts`, (t) => t
    .replace("import { Produto } from './produto.entity';", "import { Produto } from './produto.entity';\nimport { ClientesService } from '../vendas/clientes/clientes.service';")
    .replace("export class ProdutosController {", "export class ProdutosController {\n  constructor(private readonly clientes: ClientesService) {}\n"));
}

describe("regras de dependência (PL501)", () => {
  it("as regras da seção 22.8 passam no projeto como está", async () => {
    assert.deepEqual(await messages(copy(), "PL130", "PL501", "PL502", "PL503", "PL504", "PL510"), []);
  });

  it("contexto que depende de outro: uma violação por par, apontando o código", async () => {
    const root = copy();
    catalogoUsaVendas(root);
    const found = (await diagnostics(root, "PL501")).filter((d) => d.message.includes("ContextosIsolados"));
    assert.equal(found.length, 1, JSON.stringify(found));
    assert.match(found[0]!.message, /`Catalogo\.ProdutosController` → `Vendas\.ClientesService` viola ContextosIsolados: context Catalogo must not depend on context Vendas \((import|injeção no construtor)\)/);
    assert.equal(found[0]!.loc.file, `${API}/catalogo/produtos.controller.ts`);
    assert.equal(found[0]!.related![0]!.file, RULES, "e a linha da regra violada");
  });

  it("except via event: consumir evento de outro contexto é permitido; sem exceção, não", async () => {
    const root = copy();
    edit(root, "planta/catalogo.planta", (t) => t.replace("  api RestCatalogo", "  event ProdutoEsgotado\n\n  api RestCatalogo"));
    edit(root, VENDAS, (t) => t.replace("  on ClienteCadastrado", "  on Catalogo.ProdutoEsgotado => EmailListener.enviarBoasVindas\n  on ClienteCadastrado"));
    assert.deepEqual(await messages(root, "PL501"), [], "Vendas → Catalogo via evento");

    edit(root, "planta/catalogo.planta", (t) => t.replace("  api RestCatalogo", "  on Vendas.ClienteCadastrado => ProdutosController.destaques\n\n  api RestCatalogo"));
    assertSome(await messages(root, "PL501"), /`Catalogo\.ProdutosController` → `Vendas\.ClienteCadastrado` viola ContextosIsolados: context Catalogo must not depend on context Vendas \(consumo de evento\)/);
  });

  it("camadas: must not (domínio → infra) e lista de permissões do may (infra → aplicação)", async () => {
    const root = copy();
    edit(root, `${API}/vendas/clientes/cliente.entity.ts`, (t) => `import { ClienteRepository } from './cliente.repository';\n${t}`);
    edit(root, `${API}/vendas/clientes/cliente.repository.ts`, (t) => `import { ClientesService } from './clientes.service';\n${t}`);
    const found = await messages(root, "PL501");
    assertSome(found, /`Vendas\.Cliente` → `Vendas\.ClienteRepository` viola CamadasLimpas: layer dominio must not depend on layer infra \(import\)/);
    assertSome(found, /`Vendas\.ClienteRepository` → `Vendas\.ClientesService` viola CamadasLimpas: layer infra só pode depender de layer dominio \(import\)/);
  });

  it("frontend que importa código do backend em vez de chamar a API", async () => {
    const root = copy();
    edit(root, "apps/web/src/pages/Cadastro.tsx", (t) => `import type { Cliente } from '../../../api/src/vendas/clientes/cliente.entity';\n${t}`);
    const found = await diagnostics(root, "PL501");
    assert.equal(found.length, 1, JSON.stringify(found));
    assert.match(found[0]!.message, /`Web\.Cadastro` → `Vendas\.Cliente` viola FrontendSoPelaApi: app Web must not depend on context Vendas except via endpoint \(import\)/);
  });

  it("every controller must not depend on every repository", async () => {
    const root = copy();
    edit(root, `${API}/vendas/clientes/clientes.controller.ts`, (t) => t
      .replace("import { ClientesService } from './clientes.service';", "import { ClientesService } from './clientes.service';\nimport { ClienteRepository } from './cliente.repository';")
      .replace("constructor(private readonly service: ClientesService) {}", "constructor(private readonly service: ClientesService, private readonly repo: ClienteRepository) {}"));
    assertSome(await messages(root, "PL501"), /`Vendas\.ClientesController` → `Vendas\.ClienteRepository` viola Convencoes: every controller must not depend on every repository/);
  });
});

describe("regras de propriedade (PL502–PL504), mal formadas (PL130) e deprecated (PL510)", () => {
  it("have, match e be in layer", async () => {
    const root = copy();
    edit(root, VENDAS, (t) => t
      .replace('  process CadastrarCliente {\n    justifiedBy "REQ-001"\n', "  process CadastrarCliente {\n")
      .replace("  repository ClienteRepository @\"clientes/cliente.repository.ts#ClienteRepository\"", "  repository ClienteRepository @\"clientes/cliente.repository.ts#ClienteRepository\" in layer aplicacao")
      .replace("  component EmailListener", "  #[status(planned)]\n  service Notificador\n\n  component EmailListener"));
    edit(root, "planta/catalogo.planta", (t) => t.replace("  entity Produto", "  #[tag(pii)]\n  entity Produto"));
    const found = await messages(root, "PL502", "PL503", "PL504");
    assertSome(found, /PL502 `Vendas\.CadastrarCliente` viola Rastreabilidade: every process must have justifiedBy/);
    assertSome(found, /PL502 `Catalogo\.Produto` viola Rastreabilidade: every entity where tag = pii must have owner/);
    assertSome(found, /PL503 `Vendas\.Notificador` viola Convencoes: every service must match "\.\*Service\$"/);
    assertSome(found, /PL504 `Vendas\.ClienteRepository` viola Convencoes: every repository must be in layer infra/);
    assert.ok((await diagnostics(root, "PL502")).every((d) => d.severity === "warning"), "severidade da regra");
  });

  it("PL130: may sem depend on e regra que permite e proíbe o mesmo", async () => {
    const root = copy();
    edit(root, RULES, (t) => t
      .replace("  layer dominio must not depend on layer infra", "  layer dominio must not depend on layer infra\n  layer dominio may depend on layer infra")
      .replace('  every service must match ".*Service$"', '  every service must match ".*Service$"\n  every service may have owner'));
    const found = await messages(root, "PL130");
    assertSome(found, /`CamadasLimpas`: layer dominio → layer infra é permitido e proibido ao mesmo tempo/);
    assertSome(found, /`Convencoes`: `may` só vale com `depend on`/);
  });

  it("PL510: dependência de elemento deprecated", async () => {
    const root = copy();
    edit(root, VENDAS, (t) => t.replace("  repository ClienteRepository", "  #[status(deprecated)]\n  repository ClienteRepository"));
    assertSome(await messages(root, "PL510"), /`Vendas\.ClientesService` depende de `Vendas\.ClienteRepository`, que está deprecated/);
  });
});

describe("verificação de processos (PL70x) e eventos (PL332, PL333)", () => {
  const steps = (root: string, body: string) => edit(root, VENDAS, (t) => t.replace(
    "    step persistir: ClientesService.criar\n    step notificar: emit ClienteCadastrado\n", body));

  it("verify order passa no projeto como está e acusa passos trocados", async () => {
    const root = copy();
    steps(root, "    step persistir: ClientesService.criar\n    step salvar: ClienteRepository.salvar\n    step notificar: emit ClienteCadastrado\n");
    assert.deepEqual(await messages(root, "PL701", "PL702", "PL703", "PL704", "PL705"), []);

    edit(root, VENDAS, (t) => t.replace("    step salvar: ClienteRepository.salvar\n    step notificar: emit ClienteCadastrado\n", "    step notificar: emit ClienteCadastrado\n    step salvar: ClienteRepository.salvar\n"));
    const found = await diagnostics(root, "PL703");
    assert.equal(found.length, 1);
    assert.match(found[0]!.message, /a planta põe notificar antes de salvar, mas ClientesService\.criar faz o contrário/);
  });

  it("PL702: passo que o gatilho não alcança; PL705: passo sem código", async () => {
    const root = copy();
    steps(root, "    step persistir: ClientesService.criar\n    step reenviar: EmailListener.reenviarPendentes\n    step auditar: Auditoria.registrar\n    step notificar: emit ClienteCadastrado\n");
    edit(root, VENDAS, (t) => t.replace("  component EmailListener", "  component Auditoria {\n    op registrar()\n  }\n\n  component EmailListener"));
    assertSome(await messages(root, "PL702"), /o passo reenviar \(`Vendas\.EmailListener\.reenviarPendentes`\) não é alcançável a partir do gatilho \(ClientesController\.criar\)/);
    assertSome(await messages(root, "PL705"), /o passo auditar chama `Vendas\.Auditoria\.registrar`, que não tem código ancorado/);
  });

  it("PL704 e PL332: o código deixou de publicar o evento", async () => {
    const root = copy();
    edit(root, `${API}/vendas/clientes/clientes.service.ts`, (t) => t.replace("    this.eventos.emit('cliente.cadastrado', { clienteId: salvo.id });\n", ""));
    assertSome(await messages(root, "PL704"), /o passo publica `Vendas\.ClienteCadastrado`, mas o caminho de código a partir do gatilho não publica esse evento/);
    assertSome(await messages(root, "PL332"), /evento `Vendas\.ClienteCadastrado` está declarado, mas nenhum código o publica/);
  });

  it("PL701: verify sem handler no gatilho", async () => {
    const root = copy();
    edit(root, VENDAS, (t) => t.replace("    trigger RestPublica.criar\n", "    trigger Visitante\n"));
    assertSome(await messages(root, "PL701"), /`Vendas\.CadastrarCliente`: com verify order, o gatilho precisa ter handler/);
  });

  it("PL333: evento publicado no código sem declaração", async () => {
    const root = copy();
    edit(root, `${API}/vendas/pedidos/pedidos.controller.ts`, (t) => t
      .replace("import { Pedido } from './pedido.entity';", "import { EventEmitter2 } from '@nestjs/event-emitter';\nimport { Pedido } from './pedido.entity';")
      .replace("export class PedidosController {", "export class PedidosController {\n  constructor(private readonly eventos: EventEmitter2) {}\n")
      .replace("    return Promise.resolve(dados as Pedido);", "    this.eventos.emit('pedido.criado', dados);\n    return Promise.resolve(dados as Pedido);"));
    const found = await diagnostics(root, "PL333");
    assert.equal(found.length, 1);
    assert.match(found[0]!.message, /evento "pedido\.criado" é publicado no código \(PedidosController\.finalizarCompra\) mas não está declarado/);
    assert.equal(found[0]!.loc.file, `${API}/vendas/pedidos/pedidos.controller.ts`);
  });
});

describe("severidade configurada (seção 11.3)", () => {
  it("por código e por caminho; off descarta", async () => {
    const root = copy();
    catalogoUsaVendas(root);
    edit(root, "planta/planta.config.yaml", (t) => `${t}\ndiagnostics:\n  PL420: off\n  overrides:\n    - paths: ["apps/api/src/catalogo/**"]\n      PL501: warning\n`);
    const r = await run(root, "check", "--format", "json");
    const found = JSON.parse(r.out).diagnostics as Diag[];
    assert.ok(!found.some((d) => d.code === "PL420"));
    const violation = found.find((d) => d.code === "PL501")!;
    assert.equal(violation.severity, "warning");
    assert.equal(r.code, 0, "sem erros, a CI passa enquanto a regra é introduzida");
  });
});

describe("plugins (seção 19.5)", () => {
  it("regra e extrator de plugin, com tsQuery", async () => {
    const root = copy();
    mkdirSync(join(root, "planta/plugins"));
    writeFileSync(join(root, "planta/plugins/acme.ts"), `
import { defineExtractor, definePlugin, defineRule, tsQuery } from ${JSON.stringify(join(ROOT, "src/sdk.ts"))};

const TODO = tsQuery("typescript", "(comment) @c");

export default definePlugin({
  extractors: [defineExtractor({
    name: "todos",
    extractFile(file) {
      if (file.language !== "typescript") return [];
      return TODO.matches(file.tree).filter((m) => m.text("c").includes("TODO")).map((m) => ({
        id: \`todo:\${file.path}:\${m.range.start[0] + 1}\`, kind: "todo", extractor: "todos",
        location: { file: file.path, line: m.range.start[0] + 1 }, data: { text: m.text("c") },
      }));
    },
  })],
  rules: [
    defineRule({
      id: "acme/sem-todo",
      description: "Nada de TODO no código entregue",
      severity: "error",
      check({ facts, report }) {
        for (const f of facts.filter((x) => x.kind === "todo")) report({ file: f.location.file, line: f.location.line }, \`TODO no código: \${f.data.text}\`);
      },
    }),
    defineRule({
      id: "acme/controller-com-dono",
      check({ model, report, dependencies }) {
        for (const c of model.elements({ kind: "controller" })) {
          if (!c.meta.owner) report(c, \`controller sem owner (\${dependencies.filter((d) => d.from === c.id && d.real).length} dependências reais)\`);
        }
      },
    }),
  ],
});
`);
    edit(root, "planta/planta.config.yaml", (t) => t.replace("extractors:\n", "plugins:\n  - ./plugins/acme.ts\n\nextractors:\n  - use: todos\n    root: apps/api/src\n"));
    edit(root, `${API}/catalogo/produtos.controller.ts`, (t) => t.replace("  @Get('destaques')", "  // TODO: paginar\n  @Get('destaques')"));
    const r = await run(root, "check", "--format", "json");
    const found = JSON.parse(r.out).diagnostics as Diag[];
    const todo = found.find((d) => d.code === "acme/sem-todo")!;
    assert.equal(todo.severity, "error");
    assert.equal(todo.loc.file, `${API}/catalogo/produtos.controller.ts`);
    assert.match(todo.message, /TODO no código: \/\/ TODO: paginar/);
    const owners = found.filter((d) => d.code === "acme/controller-com-dono").map((d) => d.message);
    assert.equal(owners.length, 3);
    assert.ok(owners.some((m) => /controller sem owner \(1 dependências reais\)/.test(m)), String(owners));
    assert.equal(r.code, 1);

    const sarif = JSON.parse((await run(root, "check", "--format", "sarif")).out);
    const rule = sarif.runs[0].tool.driver.rules.find((x: { id: string }) => x.id === "acme/sem-todo");
    assert.equal(rule.shortDescription.text, "Nada de TODO no código entregue");
  });

  it("plugin que não carrega é falha de execução (código 2), não diagnóstico", async () => {
    const root = copy();
    edit(root, "planta/planta.config.yaml", (t) => t.replace("extractors:\n", "plugins:\n  - ./plugins/nao-existe.ts\n\nextractors:\n"));
    const r = await run(root, "check");
    assert.equal(r.code, 2);
    assert.match(r.out, /planta: plugin \.\/plugins\/nao-existe\.ts:/);
  });
});

describe("critério da fase 7: regras de camadas e de contextos na CI", () => {
  it("PR que viola ContextosIsolados e CamadasLimpas: CI falha, SARIF anota a linha e o diff marca a violação", async () => {
    const root = copy();
    const git = (...args: string[]) => execFileSync("git", ["-c", "user.email=maria@acme.com", "-c", "user.name=Maria", ...args], { cwd: root }).toString();
    git("init", "-q", "-b", "main");
    await run(root, "accept", "--all");
    git("add", "-A");
    git("commit", "-qm", "base");
    assert.equal((await run(root, "check")).code, 0, "a base passa na CI");

    git("checkout", "-qb", "agente");
    catalogoUsaVendas(root);
    edit(root, `${API}/vendas/clientes/cliente.entity.ts`, (t) => `import { ClienteRepository } from './cliente.repository';\n${t}`);
    git("add", "-A");
    git("commit", "-qm", "atalho");

    const check = await run(root, "check");
    assert.equal(check.code, 1);
    const sarif = JSON.parse((await run(root, "check", "--format", "sarif")).out);
    const results = (sarif.runs[0].results as { ruleId: string; message: { text: string }; locations: { physicalLocation: { artifactLocation: { uri: string }; region: { startLine: number } } }[] }[])
      .filter((x) => x.ruleId === "PL501");
    const where = results.map((x) => `${x.locations[0]!.physicalLocation.artifactLocation.uri}:${x.locations[0]!.physicalLocation.region.startLine} ${x.message.text}`);
    assertSome(where, /^apps\/api\/src\/catalogo\/produtos\.controller\.ts:\d+ .*viola ContextosIsolados/);
    assertSome(where, /^apps\/api\/src\/vendas\/clientes\/cliente\.entity\.ts:1 .*viola CamadasLimpas/);

    const diff = await run(root, "diff", "main", "--format", "markdown");
    assert.match(diff.out, /➕ `Catalogo\.ProdutosController` → `Vendas\.ClientesService` ❌ viola \*\*ContextosIsolados\*\*/);
    assert.match(diff.out, /➕ `Vendas\.Cliente` → `Vendas\.ClienteRepository` ❌ viola \*\*CamadasLimpas\*\*/);
  });
});
