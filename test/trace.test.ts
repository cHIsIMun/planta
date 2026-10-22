// Fase 3 de ponta a ponta: requisitos em Markdown, PL6xx, trace e impact.
// Critério do roadmap: alterar um requisito sinaliza todos os elementos ligados.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";
import { mermaidError } from "./support/mermaid.ts";

const FIXTURE = new URL("./fixtures/loja", import.meta.url).pathname;
const REQS = "docs/requisitos/clientes.md";
const ADR = "docs/adr/0001-eventos-para-email.md";
const PLANTA = "planta/vendas.planta";
const CONFIG = "planta/planta.config.yaml";

interface Diag {
  code: string;
  severity: string;
  message: string;
  loc: { file: string; line: number };
}

async function project(baseline = true) {
  const root = mkdtempSync(join(tmpdir(), "planta-fase3-"));
  cpSync(FIXTURE, root, { recursive: true });
  const git = (...args: string[]) => execFileSync("git", ["-c", "user.email=m@a", "-c", "user.name=M", ...args], { cwd: root }).toString();
  const run = async (...argv: string[]) => {
    let out = "";
    let err = "";
    const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (err += t), env: { PLANTA_REVIEWER: "maria@acme.com" } });
    return { code, out, err };
  };
  const p = {
    root,
    run,
    commit: (m: string) => {
      git("add", "-A");
      git("commit", "-qm", m);
    },
    edit(path: string, change: (t: string) => string) {
      const file = join(root, path);
      const before = readFileSync(file, "utf8");
      const after = change(before);
      assert.notEqual(after, before, `a edição de ${path} não mudou nada`);
      writeFileSync(file, after);
    },
    async diagnostics(): Promise<Diag[]> {
      return JSON.parse((await run("check", "--format", "json")).out).diagnostics;
    },
    async codes() {
      return (await p.diagnostics()).map((d) => d.code);
    },
  };
  git("init", "-q");
  p.commit("base");
  if (baseline) {
    assert.equal((await run("accept", "--all")).code, 0);
    p.commit("linha de base");
  }
  return p;
}

describe("critério da fase 3", () => {
  it("alterar o texto de REQ-001 sinaliza todos os elementos ligados, com diff no review", async () => {
    const p = await project();
    assert.deepEqual(await p.codes(), []);
    p.edit(REQS, (t) => t.replace("O e-mail deve ser único no sistema.", "O e-mail deve ser único no sistema e confirmado por link."));

    const [d, ...rest] = await p.diagnostics();
    assert.equal(rest.length, 0);
    assert.equal(d?.code, "PL611");
    assert.equal(d?.severity, "warning");
    assert.deepEqual(d?.loc, { file: REQS, line: 3, column: 1 });
    assert.match(d!.message, /^REQ-001 \(Cadastro de cliente\) mudou desde a última revisão de 3 elementos: `Vendas\.CadastrarCliente`, `Vendas\.ClientesService\.criar`, `Vendas\.RestPublica\.criar`$/);

    const review = await p.run("review");
    assert.match(review.out, /Vendas\.CadastrarCliente +requisito alterado\n {2}REQ-001 Cadastro de cliente: texto alterado desde a revisão\n/);
    assert.match(review.out, / {4}- O e-mail deve ser único no sistema\.\n {4}\+ O e-mail deve ser único no sistema e confirmado por link\./);

    assert.equal((await p.run("accept", "--all")).code, 0);
    assert.deepEqual(await p.codes(), []);
  });

  it("reformatar o requisito não é mudança", async () => {
    const p = await project();
    p.edit(REQS, (t) => t.replace("informando e-mail e nome.", "informando **e-mail**   e nome."));
    assert.deepEqual(await p.codes(), []);
  });

  it("drift.requirementChange controla a severidade", async () => {
    const p = await project();
    p.edit(CONFIG, (t) => t.replace("requirementChange: warning", "requirementChange: error"));
    p.edit(REQS, (t) => t.replace("pelo seu identificador", "pelo identificador ou pelo e-mail"));
    const [d] = await p.diagnostics();
    assert.deepEqual([d?.code, d?.severity], ["PL611", "error"]);
    assert.match(d!.message, /REQ-002 .* de 1 elemento: `Vendas\.RestPublica\.buscar`/);
  });
});

describe("referências a requisitos e decisões", () => {
  it("PL601: ID inexistente, só quando há extrator para o tipo", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace('justifiedBy "REQ-002"', 'justifiedBy "REQ-999"'));
    const codes = await p.codes();
    assert.ok(codes.includes("PL601"), String(codes));
    assert.ok(codes.includes("PL610"), "REQ-002 ficou sem elemento");

    p.edit(CONFIG, (t) => t.replace(/ {2}- use: markdown-requirements\n.*\n.*\n/, ""));
    assert.ok(!(await p.codes()).includes("PL601"));
  });

  it("PL602: ID repetido em outro arquivo", async () => {
    const p = await project();
    writeFileSync(join(p.root, "docs/requisitos/outro.md"), "## REQ-001 Repetido\n\nTexto.\n");
    const d = (await p.diagnostics()).find((x) => x.code === "PL602");
    assert.equal(d?.loc.file, "docs/requisitos/outro.md");
  });

  it("PL610: requisito sem elemento", async () => {
    const p = await project();
    p.edit(REQS, (t) => `${t}\n## REQ-003 Exclusão de cliente\n\nUm cliente pode pedir exclusão.\n`);
    const d = (await p.diagnostics()).find((x) => x.code === "PL610");
    assert.match(d!.message, /REQ-003 \(Exclusão de cliente\) não é justificado por nenhum elemento/);
  });

  it("PL612: decisão substituída", async () => {
    const p = await project();
    p.edit(ADR, (t) => t.replace("status: accepted", "status: superseded"));
    assert.ok((await p.codes()).includes("PL612"));
  });

  it("requisito declarado na planta por âncora md: (seção sem ID)", async () => {
    const p = await project(false);
    p.edit(PLANTA, (t) => t.replace("  process CadastrarCliente {\n    justifiedBy \"REQ-001\"", "  process CadastrarCliente {\n    justifiedBy \"REQ-001\", CriteriosCadastro"));
    writeFileSync(join(p.root, "planta/requisitos.planta"), 'requirement CriteriosCadastro @"md:/docs/requisitos/clientes.md#critérios-de-aceite" "Critérios do cadastro"\n');
    await p.run("accept", "--all");
    p.commit("com requisito declarado");
    p.edit(REQS, (t) => t.replace("retorna erro de conflito", "retorna 409"));
    const ds = (await p.diagnostics()).filter((x) => x.code === "PL611");
    assert.deepEqual(ds.map((d) => d.message.split(" ")[0]).sort(), ["CriteriosCadastro", "REQ-001"], "a subseção também faz parte de REQ-001");

    p.edit("planta/requisitos.planta", (t) => t.replace("#critérios-de-aceite", "#nao-existe"));
    assert.ok((await p.codes()).includes("PL201"));
    rmSync(join(p.root, REQS));
    assert.ok((await p.codes()).includes("PL202"));
  });

  it("vínculo novo com requisito deixa o elemento pendente, sem PL611", async () => {
    const p = await project();
    p.edit(PLANTA, (t) => t.replace("    op buscar(id: uuid) -> Cliente?\n    uses ClienteRepository", '    op buscar(id: uuid) -> Cliente? justifiedBy "REQ-002"\n    uses ClienteRepository'));
    assert.deepEqual(await p.codes(), []);
    assert.match((await p.run("review")).out, /Vendas\.ClientesService\.buscar +vínculo novo com requisito\n {2}justifiedBy REQ-002 \(vínculo novo desde a revisão\)/);
    await p.run("accept", "--all");
    p.edit(REQS, (t) => t.replace("pelo seu identificador", "pelo identificador"));
    assert.match((await p.diagnostics())[0]!.message, /`Vendas\.ClientesService\.buscar`/);
  });

  it("o lock guarda a impressão de cada requisito, também para processos", async () => {
    const p = await project();
    const lock = readFileSync(join(p.root, "planta/planta.lock"), "utf8");
    assert.match(lock, /  Vendas\.CadastrarCliente:\n {4}requirements:\n {6}REQ-001: sha256:[0-9a-f]{16}\n {4}reviewed:/);
    assert.match(lock, /  Vendas\.EmailListener:\n[\s\S]*?requirements:\n {6}ADR-0001: sha256:/);
  });
});

describe("planta trace", () => {
  it("matriz em Markdown e CSV, com estado de revisão", async () => {
    const p = await project();
    p.edit(REQS, (t) => `${t.replace("pelo seu identificador", "pelo identificador")}\n## REQ-003 Exclusão\n\nTexto.\n`);
    const md = (await p.run("trace")).out;
    assert.match(md, /^\| Requisito \| Status \| Processos \| Endpoints \| Operações \| Páginas \| Revisado \|$/m);
    assert.match(md, /^\| REQ-001 Cadastro de cliente \| – \| CadastrarCliente \| POST \/api\/v1\/clientes \| ClientesService\.criar \| – \| ✓ \|$/m);
    assert.match(md, /^\| REQ-002 Consulta de cliente \| .* \| ⚠ alterado \|$/m);
    assert.match(md, /^\| REQ-003 Exclusão \| .* \| ✗ sem implementação \|$/m);
    const csv = (await p.run("trace", "--format", "csv")).out;
    assert.match(csv, /^Requisito,Status,Processos,Endpoints,Operações,Páginas,Revisado\n/);
    assert.equal((await p.run("trace", "--format", "pdf")).code, 2);
  });

  it("--inject preenche os blocos e não altera o hash do requisito", async () => {
    const p = await project();
    p.edit(REQS, (t) => t.replace("\n## REQ-002", "\n<!-- planta:trace -->\n<!-- /planta:trace -->\n\n## REQ-002"));
    assert.equal((await p.run("trace", "--inject", "docs/**/*.md", "--check")).code, 1);
    assert.equal((await p.run("trace", "--inject", "docs/**/*.md")).code, 0);
    const text = readFileSync(join(p.root, REQS), "utf8");
    assert.match(text, /- process \[Vendas\.CadastrarCliente\]\(\.\.\/\.\.\/planta\/vendas\.planta#L\d+\)\n/);
    assert.match(text, /- endpoint \[Vendas\.RestPublica\.criar\]\(\.\.\/\.\.\/planta\/vendas\.planta#L\d+\) → \[apps\/api\/src\/vendas\/clientes\/clientes\.controller\.ts\]\(\.\.\/\.\.\/apps\/api\/src\/vendas\/clientes\/clientes\.controller\.ts\)/);
    assert.equal((await p.run("trace", "--inject", "docs/**/*.md", "--check")).code, 0);
    assert.deepEqual(await p.codes(), [], "o bloco injetado não conta como mudança do requisito");
  });
});

describe("planta impact", () => {
  it("de um requisito: quem justifica, dependentes e processos", async () => {
    const p = await project();
    const r = await p.run("impact", "REQ-001");
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /^Impacto de REQ-001 \(Cadastro de cliente\)\n\nJustificado por \(3\):\n/);
    assert.match(r.out, /Vendas\.RestPublica\.criar endpoint {2}→ apps\/api\/src\/vendas\/clientes\/clientes\.controller\.ts/);
    assert.match(r.out, /Vendas\.ClientesController controller · uses/);
    assert.match(r.out, /Processos afetados: Vendas\.CadastrarCliente\nOutros requisitos afetados: nenhum\n/);
  });

  it("de um elemento: dependentes transitivos e requisitos envolvidos", async () => {
    const p = await project();
    const r = await p.run("impact", "Vendas.ClienteRepository");
    assert.match(r.out, /Vendas\.ClientesService service · uses[\s\S]*\n {4}Vendas\.ClientesController controller · uses/);
    const op = await p.run("impact", "Vendas.ClientesService.criar");
    assert.match(op.out, /Vendas\.CadastrarCliente process · passo persistir/);
    assert.match(op.out, /Requisitos afetados: REQ-001\n/);
    const entity = await p.run("impact", "Vendas.Cliente");
    assert.match(entity.out, /Requisitos afetados: REQ-001, REQ-002\n/);
  });

  it("ID desconhecido é falha de execução", async () => {
    const p = await project(false);
    assert.equal((await p.run("impact", "Nada")).code, 2);
    assert.equal((await p.run("impact")).code, 2);
  });
});

describe("view traceability", () => {
  it("requisitos → elementos, com requisito sem implementação tracejado", async () => {
    const p = await project();
    p.edit(REQS, (t) => `${t}\n## REQ-003 Exclusão\n\nTexto.\n`);
    writeFileSync(join(p.root, "planta/views.planta"), "view Rastro kind traceability {\n  include every requirement, every process, every endpoint\n}\n");
    assert.equal((await p.run("render", "Rastro")).code, 0);
    const text = readFileSync(join(p.root, "planta/.gerado/diagramas/Rastro.mmd"), "utf8");
    assert.match(text, /req_REQ_001\(\["REQ-001<br\/>Cadastro de cliente"\]\)/);
    assert.match(text, /req_REQ_001 --> Vendas_CadastrarCliente/);
    assert.match(text, /req_REQ_002 --> Vendas_RestPublica_buscar/);
    assert.match(text, /class req_REQ_003 semImplementacao/);
    assert.doesNotMatch(text, /Vendas_ClientesService_criar/, "op não está no include");
    assert.equal(await mermaidError(text), undefined, text);
  });
});
