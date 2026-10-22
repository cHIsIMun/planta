import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "planta-cli-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

async function run(cwd: string, ...argv: string[]) {
  let out = "";
  let err = "";
  const code = await main(argv, { cwd, out: (t) => (out += t), err: (t) => (err += t) });
  return { code, out, err };
}

const OK = {
  "planta/sistema.planta": `system Loja {}\n`,
  "planta/contextos/vendas.planta": `context Vendas {\n  entity Cliente\n}\n`,
};

describe("planta check --fast", () => {
  it("sem erros: código 0, resumo e modelo.json gravado", async () => {
    const root = project(OK);
    const r = await run(root, "check", "--fast");
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /sistema Loja · 2 arquivos · 2 elementos/);
    assert.match(r.out, /0 erros · 0 avisos/);
    const ir = JSON.parse(readFileSync(join(root, "planta/.gerado/modelo.json"), "utf8"));
    assert.equal(ir.schema, "planta.model/1");
    assert.ok(ir.elements["Vendas.Cliente"]);
    assert.equal(readFileSync(join(root, "planta/.gerado/.gitignore"), "utf8"), "*\n");
  });

  it("com erros: código 1 e diagnósticos ordenados por arquivo e linha", async () => {
    const root = project({
      ...OK,
      "planta/b.planta": `context Vendas {\n  service S { uses Nada }\n}\n`,
      "planta/a.planta": `#[desconhecida]\nactor A\n`,
    });
    const r = await run(root, "check", "--fast");
    assert.equal(r.code, 1);
    const codes = [...r.out.matchAll(/^[✖⚠] (PL\d+) (\S+)/gm)].map((m) => `${m[1]} ${m[2]}`);
    assert.deepEqual(codes, ["PL103 planta/a.planta:1:3", "PL110 planta/b.planta:2:20"]);
    assert.match(r.out, /1 erro · 1 aviso/);
  });

  it("--format json", async () => {
    const root = project({ ...OK, "planta/x.planta": `actor A\nactor A\n` });
    const r = await run(root, "check", "--fast", "--format", "json");
    assert.equal(r.code, 1);
    assert.deepEqual(JSON.parse(r.out).diagnostics.map((d: { code: string }) => d.code), ["PL102"]);
  });

  it("--dir e arquivos dentro de .gerado/ são ignorados", async () => {
    const root = project({ "arq/s.planta": `system S {}`, "arq/.gerado/lixo.planta": `isto não é planta` });
    const r = await run(root, "check", "--fast", "--dir", "arq");
    assert.equal(r.code, 0, r.out);
  });

  it("sem --fast e sem extratores, roda todas as fases sem fatos", async () => {
    const r = await run(project(OK), "check");
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /0 fatos/);
  });

  it("pasta inexistente e opção desconhecida: código 2", async () => {
    assert.equal((await run(project({}), "check", "--fast")).code, 2);
    assert.equal((await run(project(OK), "check", "--fast", "--rapido")).code, 2);
  });
});

describe("planta fmt", () => {
  const MESSY = { "planta/a.planta": `context C{\nentity  E\n}` };

  it("--check lista os arquivos fora do padrão sem alterá-los", async () => {
    const root = project(MESSY);
    const r = await run(root, "fmt", "--check");
    assert.equal(r.code, 1);
    assert.equal(r.out, "planta/a.planta\n");
    assert.equal(readFileSync(join(root, "planta/a.planta"), "utf8"), MESSY["planta/a.planta"]);
  });

  it("reescreve no lugar e depois passa no --check", async () => {
    const root = project(MESSY);
    assert.equal((await run(root, "fmt")).code, 0);
    assert.equal(readFileSync(join(root, "planta/a.planta"), "utf8"), "context C {\n  entity E\n}\n");
    assert.equal((await run(root, "fmt", "--check")).code, 0);
  });

  it("arquivo com erro de sintaxe: código 1 e arquivo intacto", async () => {
    const root = project({ "x.planta": "context {" });
    const r = await run(root, "fmt", "x.planta");
    assert.equal(r.code, 1);
    assert.match(r.err, /PL100/);
    assert.equal(readFileSync(join(root, "x.planta"), "utf8"), "context {");
  });
});

describe("comandos gerais", () => {
  it("ajuda, versão e comando desconhecido", async () => {
    const root = project({});
    assert.match((await run(root)).out, /Uso:/);
    assert.match((await run(root, "--version")).out, /^\d+\.\d+\.\d+\n$/);
    assert.equal((await run(root, "voar")).code, 2);
    assert.ok(!existsSync(join(root, "planta")));
  });
});
