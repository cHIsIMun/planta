import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { main } from "../src/cli.ts";
import { buildModel } from "../src/model.ts";
import { buildSite, type SiteData, VIEWER_SCRIPT } from "../src/viewer/site.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const FIXTURE = join(ROOT, "test/fixtures/loja");

function data(text: string): SiteData {
  const m = buildModel([{ path: "s.planta", text }]);
  return { ir: m.ir, projectRoot: "/projeto", diagrams: {}, diagnostics: m.diagnostics, review: {} };
}

/** Executa o script do visualizador no jsdom, sem o Mermaid (o import falha e cai no texto). */
function open(site: SiteData, hash = "") {
  const html = buildSite(site).replace(/<script type="module">[\s\S]*?<\/script>/, "");
  const dom = new JSDOM(html, { url: `http://localhost/${hash}`, runScripts: "outside-only" });
  dom.window.eval(`const MERMAID_URL = "http://localhost/sem-mermaid.mjs";\n${VIEWER_SCRIPT}`);
  return dom.window;
}

describe("visualizador", () => {
  const site = data(`system Loja { description "Loja de teste" }
    /// Doc com <img src=x onerror="window.pwned=1"> e </script>.
    context Vendas {
      entity Cliente { email: string unique }
      service S { op criar() -> Cliente\n uses R }
      repository R
    }`);

  it("dados embutidos não fecham a tag de script", () => {
    const html = buildSite(site);
    const json = /<script type="application\/json" id="data">([\s\S]*?)<\/script>/.exec(html)?.[1];
    assert.ok(json);
    assert.ok(!json.includes("</script>"));
    assert.equal(JSON.parse(json).ir.elements.Vendas.docs, 'Doc com <img src=x onerror="window.pwned=1"> e </script>.');
  });

  it("árvore de elementos e visão geral", () => {
    const w = open(site);
    const tree = [...w.document.querySelectorAll(".tree a")].map((a) => a.textContent);
    assert.deepEqual(tree, ["contextVendas", "entityCliente", "repositoryR", "serviceS", "opcriar"]);
    assert.match(w.document.getElementById("main")!.textContent!, /Loja de teste/);
  });

  it("página de elemento: campos, relações e quem usa", () => {
    const w = open(site, "#/e/Vendas.S");
    const main = w.document.getElementById("main")!.textContent!;
    assert.match(main, /Relações/);
    assert.match(w.document.getElementById("main")!.innerHTML, /href="#\/e\/Vendas\.R"/);
    const cliente = open(site, "#/e/Vendas.Cliente").document.getElementById("main")!.textContent!;
    assert.match(cliente, /email/);
    assert.match(cliente, /unique/);
  });

  it("conteúdo do modelo vira texto, nunca HTML", () => {
    const w = open(site, "#/e/Vendas");
    assert.equal(w.document.querySelector("main img"), null);
    assert.equal((w as unknown as { pwned?: number }).pwned, undefined);
    assert.match(w.document.getElementById("main")!.textContent!, /<img src=x/);
  });

  it("requisitos dos documentos: grupo na árvore, página e links nas relações", () => {
    const withReqs: SiteData = {
      ...site,
      ir: {
        ...site.ir,
        requirements: {
          "req:REQ-001": {
            kind: "requirement", id: "REQ-001", title: "Cadastro", text: "O cliente se cadastra.",
            anchor: { scheme: "md", path: "docs/r.md", line: 3 }, fingerprint: "sha256:x", justifiedBy: ["Vendas.S"],
          },
        },
        elements: {
          ...site.ir.elements,
          "Vendas.S": { ...site.ir.elements["Vendas.S"]!, relations: [...site.ir.elements["Vendas.S"]!.relations, { type: "justifiedBy", target: "req:REQ-001" }] },
        },
      },
      review: { "Vendas.S": "changed" },
    };
    const w = open(withReqs, "#/r/req%3AREQ-001");
    const main = w.document.getElementById("main")!;
    assert.match(main.textContent!, /REQ-001 Cadastro/);
    assert.match(main.textContent!, /O cliente se cadastra\./);
    assert.match(main.textContent!, /alterado/);
    assert.ok([...w.document.querySelectorAll(".tree a")].some((a) => a.textContent === "REQ-001Cadastro"));
    const el = open(withReqs, "#/e/Vendas.S").document.getElementById("main")!;
    assert.ok(el.querySelector('a[href="#/r/req%3AREQ-001"]'));
  });

  it("filtro da árvore", () => {
    const w = open(site);
    const input = w.document.getElementById("search") as HTMLInputElement;
    input.value = "cliente";
    input.dispatchEvent(new w.Event("input"));
    assert.deepEqual([...w.document.querySelectorAll(".tree a")].map((a) => a.textContent), ["contextVendas", "entityCliente"]);
  });
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "planta-fase2-"));
  cpSync(FIXTURE, root, { recursive: true });
  return root;
}

async function run(cwd: string, ...argv: string[]) {
  let out = "";
  let err = "";
  const code = await main(argv, { cwd, out: (t) => (out += t), err: (t) => (err += t), env: {} });
  return { code, out, err };
}

describe("planta render", () => {
  it("sem views declaradas, gera o conjunto automático", async () => {
    const root = fixture();
    const r = await run(root, "render");
    assert.equal(r.code, 0, r.err);
    assert.deepEqual(r.out.trim().split("\n"), [
      "→ planta/.gerado/diagramas/c4-contexto.mmd",
      "→ planta/.gerado/diagramas/c4-containers.mmd",
      "→ planta/.gerado/diagramas/classes-Vendas.mmd",
      "→ planta/.gerado/diagramas/er-Vendas.mmd",
      "→ planta/.gerado/diagramas/sequencia-Vendas.CadastrarCliente.mmd",
    ]);
    assert.match(readFileSync(join(root, "planta/.gerado/diagramas/er-Vendas.mmd"), "utf8"), /^erDiagram\n/);
  });

  it("view por nome, view inexistente e tipo sem renderizador", async () => {
    const root = fixture();
    writeFileSync(join(root, "planta/views.planta"), "view Fluxo kind flow of Vendas.CadastrarCliente\nview Classes kind class of Vendas\n");
    assert.equal((await run(root, "render", "Classes")).code, 0);
    assert.equal((await run(root, "render", "Nenhuma")).code, 2);
    const r = await run(root, "render");
    assert.equal(r.code, 1);
    assert.match(r.err, /`flow` ainda não tem renderizador/);
    assert.match(r.out, /Classes\.mmd/);
  });

  it("entidade sem campos na planta usa os campos do código; --fast não", async () => {
    const root = fixture();
    const planta = join(root, "planta/vendas.planta");
    writeFileSync(planta, readFileSync(planta, "utf8").replace(/entity Pedido @"pedidos\/pedido\.entity\.ts#Pedido" \{[\s\S]*?\n  \}/, 'entity Pedido @"pedidos/pedido.entity.ts#Pedido"'));
    await run(root, "render", "classes-Vendas");
    assert.match(readFileSync(join(root, "planta/.gerado/diagramas/classes-Vendas.mmd"), "utf8"), /decimal total\*/);
    await run(root, "render", "classes-Vendas", "--fast");
    assert.doesNotMatch(readFileSync(join(root, "planta/.gerado/diagramas/classes-Vendas.mmd"), "utf8"), /total/);
  });

  it("--inject e --inject --check", async () => {
    const root = fixture();
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs/a.md"), "# A\n\n<!-- planta:view er-Vendas -->\n<!-- /planta:view -->\n");
    assert.equal((await run(root, "render", "--inject", "docs/**/*.md", "--check")).code, 1, "desatualizado antes");
    const r = await run(root, "render", "--inject", "docs/**/*.md");
    assert.equal(r.code, 0, r.err);
    assert.match(readFileSync(join(root, "docs/a.md"), "utf8"), /```mermaid\nerDiagram/);
    assert.equal((await run(root, "render", "--inject", "docs/**/*.md", "--check")).code, 0, "atualizado depois");
    assert.equal((await run(root, "render", "--inject", "nada/*.md")).code, 2);
  });
});

describe("planta export-site e serve", () => {
  it("export-site grava index.html com o modelo e os diagramas", async () => {
    const root = fixture();
    const r = await run(root, "export-site");
    assert.equal(r.code, 0, r.err);
    const html = readFileSync(join(root, "planta/.gerado/site/index.html"), "utf8");
    const embedded = JSON.parse(/id="data">([\s\S]*?)<\/script>/.exec(html)![1]!);
    assert.ok(embedded.ir.elements["Vendas.Cliente"]);
    assert.match(embedded.diagrams["er-Vendas"].text, /^erDiagram/);
    assert.equal(embedded.review["Vendas.Cliente"], "new");
    assert.equal(embedded.ir.elements["Vendas.Cliente"].anchor.resolved.symbolKind, "class");
  });

  it("serve responde com o visualizador e recalcula a cada requisição", { timeout: 30_000 }, async () => {
    const root = fixture();
    const child = spawn(join(ROOT, "node_modules/.bin/tsx"), [join(ROOT, "src/cli.ts"), "serve", "--port", "0", "--fast"], { cwd: root });
    try {
      const url = await new Promise<string>((done, fail) => {
        let out = "";
        child.stdout.on("data", (chunk: Buffer) => {
          out += chunk.toString();
          const m = /http:\/\/localhost:(\d+)/.exec(out);
          if (m) done(m[0]);
        });
        child.on("exit", (code) => fail(new Error(`serve saiu com ${code}`)));
      });
      const first = await (await fetch(url)).text();
      assert.match(first, /<title>Loja · Planta<\/title>/);
      writeFileSync(join(root, "planta/extra.planta"), "actor Novo");
      assert.match(await (await fetch(url)).text(), /"Novo"/);
      assert.equal((await fetch(`${url}/outra`)).status, 404);
    } finally {
      child.kill();
    }
  });

  it("fixture continua sem arquivos gerados fora de .gerado/", () => {
    assert.ok(!existsSync(join(FIXTURE, "planta/.gerado")), "os testes não podem escrever no fixture versionado");
  });
});
