// Fase 1 de ponta a ponta sobre o projeto-fixture NestJS (test/fixtures/loja).
// Critério do roadmap: num projeto NestJS, `check` detecta endpoint novo não
// declarado e mudança de assinatura.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";

const FIXTURE = new URL("./fixtures/loja", import.meta.url).pathname;
const REVIEWER = "maria@acme.com";

interface Project {
  root: string;
  edit(path: string, change: (text: string) => string): void;
  run(...argv: string[]): Promise<{ code: number; out: string; err: string }>;
  codes(...argv: string[]): Promise<string[]>;
  commit(message: string): void;
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-c", `user.email=${REVIEWER}`, "-c", "user.name=Maria", ...args], { cwd: root }).toString();
}

/** Cópia do fixture com a linha de base revisada (`accept --all`) e commitada. */
async function project(options: { baseline?: boolean } = {}): Promise<Project> {
  const root = mkdtempSync(join(tmpdir(), "planta-fase1-"));
  cpSync(FIXTURE, root, { recursive: true });
  const p: Project = {
    root,
    edit(path, change) {
      const file = join(root, path);
      const before = readFileSync(file, "utf8");
      const after = change(before);
      assert.notEqual(after, before, `a edição de ${path} não mudou nada`);
      writeFileSync(file, after);
    },
    async run(...argv) {
      let out = "";
      let err = "";
      const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (err += t), env: { PLANTA_REVIEWER: REVIEWER } });
      return { code, out, err };
    },
    async codes(...argv) {
      const r = await p.run("check", "--format", "json", ...argv);
      return (JSON.parse(r.out).diagnostics as { code: string }[]).map((d) => d.code);
    },
    commit(message) {
      git(root, "add", "-A");
      git(root, "commit", "-qm", message);
    },
  };
  git(root, "init", "-q");
  p.commit("base");
  if (options.baseline !== false) {
    assert.equal((await p.run("accept", "--all")).code, 0);
    p.commit("linha de base");
  }
  return p;
}

const CONTROLLER = "apps/api/src/vendas/clientes/clientes.controller.ts";
const SERVICE = "apps/api/src/vendas/clientes/clientes.service.ts";
const ENTITY = "apps/api/src/vendas/clientes/cliente.entity.ts";
const PLANTA = "planta/vendas.planta";

describe("linha de base", () => {
  it("sem lock, tudo que é revisável gera PL403 e nada mais", async () => {
    const p = await project({ baseline: false });
    const codes = await p.codes();
    assert.ok(codes.length > 0);
    assert.deepEqual([...new Set(codes)], ["PL403"]);
  });

  it("depois de accept --all o projeto está limpo e o lock é estável", async () => {
    const p = await project();
    const r = await p.run("check");
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /0 erros · 0 avisos/);
    const lock = readFileSync(join(p.root, "planta/planta.lock"), "utf8");
    assert.match(lock, /^schema: planta\.lock\/1\n/);
    assert.match(lock, /Vendas\.RestPublica\.criar:\n    natural: POST \/api\/v1\/clientes\n/);
    assert.match(lock, new RegExp(`reviewed: \\{ by: "${REVIEWER}"`));
    await p.run("accept", "--all");
    assert.equal(readFileSync(join(p.root, "planta/planta.lock"), "utf8"), lock, "aceitar sem mudanças não reescreve o lock");
  });

  it("o IR ganha âncoras resolvidas e correspondências", async () => {
    const p = await project();
    await p.run("check");
    const ir = JSON.parse(readFileSync(join(p.root, "planta/.gerado/modelo.json"), "utf8"));
    assert.equal(ir.elements["Vendas.Cliente"].anchor.resolved.symbolKind, "class");
    assert.deepEqual(ir.matches["Vendas.RestPublica.criar"], ["http.endpoint:POST:/api/v1/clientes"]);
    // 13 fatos de estrutura, 3 chamadas entre métodos, 1 evento publicado e
    // 3 seções de documento (REQ-001, REQ-002, ADR-0001).
    assert.equal(ir.facts.count, 20);
  });
});

describe("critério da fase 1", () => {
  it("PL301: endpoint novo no código sem declaração na planta", async () => {
    const p = await project();
    p.edit(CONTROLLER, (t) => t.replace("  @Get(':id')", "  @Delete(':id')\n  remover(@Param('id') id: string) {}\n\n  @Get(':id')"));
    const r = await p.run("check");
    assert.equal(r.code, 1);
    assert.match(r.out, /✖ PL301 apps\/api\/src\/vendas\/clientes\/clientes\.controller\.ts:\d+:1\n {8}cobertura: rota DELETE \/api\/v1\/clientes\/:id \(ClientesController\.remover\)/);
  });

  it("PL401: assinatura alterada, com diff em planta review", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replace("criar(dto: CriarClienteDto)", "criar(dto: CriarClienteDto, origem?: string)"));
    const codes = await p.codes();
    assert.deepEqual(codes.sort(), ["PL401", "PL417"]);

    const review = await p.run("review");
    assert.match(review.out, /Vendas\.ClientesService\.criar +assinatura alterada\n {2}- async criar\(dto: CriarClienteDto\): Promise<Cliente>\n {2}\+ async criar\(dto: CriarClienteDto, origem\?: string\): Promise<Cliente>/);
    assert.doesNotMatch(review.out, /^Vendas\.ClientesService +assinatura/m, "a classe não repete a mudança da operação");

    assert.equal((await p.run("accept", "Vendas.ClientesService.criar")).code, 0);
    assert.deepEqual(await p.codes(), ["PL417"], "depois do aceite resta só a divergência com a planta");
  });
});

describe("âncoras (PL2xx)", () => {
  it("PL201: método ancorado removido", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replace(/  async buscar[\s\S]*?\n  }\n/, ""));
    assert.ok((await p.codes()).includes("PL201"));
  });

  it("PL202: arquivo da âncora removido", async () => {
    const p = await project();
    rmSync(join(p.root, "apps/api/src/vendas/clientes/dto/criar-cliente.dto.ts"));
    assert.ok((await p.codes()).includes("PL202"));
  });

  it("PL203: classe movida para outro arquivo", async () => {
    const p = await project();
    const from = join(p.root, "apps/api/src/vendas/clientes/cliente.repository.ts");
    writeFileSync(join(p.root, "apps/api/src/vendas/clientes/repositorio.ts"), readFileSync(from, "utf8"));
    rmSync(from);
    const r = await p.run("check");
    assert.match(r.out, /PL203[\s\S]*atualize a âncora para @"clientes\/repositorio\.ts#ClienteRepository"/);
  });

  it("PL209: tipo de símbolo incompatível", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace('dto CriarClienteDto @"clientes/dto/criar-cliente.dto.ts#CriarClienteDto"', 'dto CriarClienteDto @"../main.ts#bootstrap"'));
    assert.ok((await p.codes()).includes("PL209"));
  });

  it("PL205 em vez de erro para elemento planejado", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace("  event ClienteCadastrado {", '  #[status(planned)]\n  service DevolucoesService @"devolucoes/devolucoes.service.ts#DevolucoesService"\n\n  event ClienteCadastrado {'));
    const r = await p.run("check");
    assert.equal(r.code, 0);
    assert.match(r.out, /ℹ PL205/);
  });
});

describe("cobertura e comparação estrutural", () => {
  it("PL310/PL410/PL411/PL412: campos da entidade", async () => {
    const p = await project();
    p.edit(ENTITY, (t) => t
      .replace("  @Column()\n  nome: string;", "  @Column()\n  apelido: string;")
      .replace("@Column({ unique: true, length: 255 })", "@Column({ length: 255 })")
      .replace("  @CreateDateColumn()\n  criadoEm: Date;", "  @Column()\n  criadoEm: boolean;"));
    const codes = await p.codes();
    for (const code of ["PL310", "PL410", "PL411", "PL412"]) assert.ok(codes.includes(code), `${code} em ${codes}`);
  });

  it("PL415: rota do handler mudou no código", async () => {
    const p = await project();
    p.edit(CONTROLLER, (t) => t.replace("@Get(':id')", "@Get('detalhe/:id')"));
    const codes = await p.codes();
    assert.ok(codes.includes("PL415"), String(codes));
    assert.ok(!codes.includes("PL301"), "o endpoint continua casado pelo handler");
  });

  it("PL420/PL421: dependências reais contra uses", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t
      .replace("private readonly repo: ClienteRepository,", "private readonly emails: EmailListener,")
      .replace("import { Cliente }", "import { EmailListener } from '../notificacoes/email.listener';\nimport { Cliente }"));
    const codes = await p.codes();
    assert.ok(codes.includes("PL420"), String(codes));
    assert.ok(codes.includes("PL421"), String(codes));
  });

  it("PL302: serviço injetável sem elemento (coverage.warn)", async () => {
    const p = await project();
    writeFileSync(join(p.root, "apps/api/src/vendas/auditoria.service.ts"), "@Injectable()\nexport class AuditoriaService {}\n");
    const r = await p.run("check");
    assert.equal(r.code, 0);
    assert.match(r.out, /⚠ PL302 apps\/api\/src\/vendas\/auditoria\.service\.ts:2:1\n {8}cobertura: service AuditoriaService/);
  });

  it("PL210: âncora inferida por convenção", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace(' @"clientes/cliente.repository.ts#ClienteRepository"', ""));
    const r = await p.run("check");
    assert.match(r.out, /ℹ PL210[\s\S]*âncora de `Vendas\.ClienteRepository` inferida/);
  });
});

describe("drift e lock", () => {
  it("PL402: só a implementação mudou (informação, código 0)", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replace("return null;", "return this.repo ? null : null;"));
    const r = await p.run("check");
    assert.equal(r.code, 0);
    assert.match(r.out, /ℹ PL402[\s\S]*Vendas\.ClientesService\.buscar/);
  });

  it("reformatar o código não gera drift", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replaceAll("  ", "    ").replace("const cliente =", "// comentário novo\n    const cliente ="));
    assert.deepEqual(await p.codes(), []);
  });

  it("drift.signatureChange e ignore(drift) mudam a severidade", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replace("buscar(id: string)", "buscar(id: string, incluirPedidos = false)"));
    p.edit("planta/planta.config.yaml", (t) => t.replace("signatureChange: error", "signatureChange: warning"));
    let r = await p.run("check", "--format", "json");
    const d = JSON.parse(r.out).diagnostics.find((x: { code: string }) => x.code === "PL401");
    assert.equal(d.severity, "warning");

    p.edit(PLANTA, (t) => t.replace("    op buscar(id: uuid) -> Cliente?\n    uses ClienteRepository", '    #[ignore(drift, "parâmetro opcional")]\n    op buscar(id: uuid) -> Cliente?\n    uses ClienteRepository'));
    r = await p.run("check", "--format", "json");
    assert.ok(!JSON.parse(r.out).diagnostics.some((x: { code: string }) => x.code === "PL401"));
  });

  it("PL404 e lock --prune", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace("  job ReenviarEmails cron \"0 3 * * *\" => EmailListener.reenviarPendentes\n", "").replace("    op reenviarPendentes()\n", ""));
    assert.ok((await p.codes()).includes("PL404"));
    const r = await p.run("lock", "--prune");
    assert.match(r.out, /removido: Vendas\.EmailListener\.reenviarPendentes/);
    assert.ok(!(await p.codes()).includes("PL404"));
  });

  it("accept --changed-since pega só o que mudou desde a referência", async () => {
    const p = await project();
    p.edit(SERVICE, (t) => t.replace("buscar(id: string)", "buscar(id: string, x?: number)"));
    p.edit(ENTITY, (t) => t.replace("  @Column()\n  nome: string;", "  @Column()\n  nome: string;\n\n  @Column()\n  extra: string;"));
    p.commit("mudanças");
    const ref = git(p.root, "rev-parse", "HEAD~1").trim();
    const r = await p.run("accept", "--changed-since", ref);
    assert.match(r.out, /aceito: Vendas\.ClientesService\.buscar/);
    assert.match(r.out, /aceito: Vendas\.Cliente\n/);
  });

  it("accept recusa agente, ID desconhecido e falta de seletor", async () => {
    const p = await project();
    let err = "";
    const agent = await main(["accept", "--all"], { cwd: p.root, out: () => {}, err: (t) => (err += t), env: { PLANTA_AGENT: "1", PLANTA_REVIEWER: REVIEWER } });
    assert.equal(agent, 2);
    assert.match(err, /PLANTA_AGENT=1/);
    assert.equal((await p.run("accept", "Vendas.NaoExiste")).code, 2);
    assert.equal((await p.run("accept")).code, 2);
  });
});
