import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildModel, type Model, type Source } from "../src/model.ts";
import { extractExamples } from "./spec-examples.ts";

const SYSTEM: Source = { path: "sistema.planta", text: `system S {}` };

function model(...texts: string[]): Model {
  return buildModel([SYSTEM, ...texts.map((text, i) => ({ path: `f${i}.planta`, text }))]);
}

function codes(m: Model) {
  return m.diagnostics.map((d) => d.code);
}

/** Resolução da referência cujo texto é `name`, onde quer que ela esteja. */
function target(m: Model, name: string): string | undefined {
  const found = [...m.links].filter(([ref]) => ref.name === name);
  assert.ok(found.length > 0, `nenhuma referência \`${name}\` resolvida`);
  const [, resolution] = found[0]!;
  return resolution.kind === "element" ? resolution.id : `primitive:${resolution.name}`;
}

describe("ordem de resolução (seção 6.2)", () => {
  it("bloco, pai, use, nível superior", () => {
    const m = model(
      `context Catalogo { entity Produto }`,
      `use Catalogo.Produto
       context Vendas {
         entity Item { produto: Produto }
         service S { op a() -> Item }
       }`,
    );
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "Produto"), "Catalogo.Produto");
    assert.equal(target(m, "Item"), "Vendas.Item");
  });

  it("use com alias e nome qualificado depois do alias", () => {
    const m = model(
      `context Vendas { service S { op criar() }\n api Rest http { endpoint POST "/x" => S.criar } }`,
      `use Vendas.Rest as Api
       app Web kind spa { page P { calls Api.criar } }`,
    );
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "Api.criar"), "Vendas.Rest.criar");
  });

  it("use vale só no arquivo onde foi escrito", () => {
    const m = model(
      `context Catalogo { entity Produto }`,
      `use Catalogo.Produto\ncontext Vendas { entity A { p: Produto } }`,
      `context Vendas { entity B { p: Produto } }`,
    );
    assert.deepEqual(codes(m), ["PL110"]);
    assert.equal(m.diagnostics[0]?.loc.file, "f2.planta");
  });

  it("o escopo mais interno vence", () => {
    const m = model(`
      context Vendas {}
      app Web kind spa { contains Vendas\n page Vendas {} }
    `);
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "Vendas"), "Web.Vendas");
  });

  it("elemento de outro tipo não sombreia o de tipo aceito", () => {
    const m = model(`
      actor Cliente
      context Vendas {
        entity Cliente
        process P { actor Cliente\n return Cliente }
      }
    `);
    assert.deepEqual(m.diagnostics, []);
    const proc = m.symbols.symbols.get("Vendas.P")?.decl;
    assert.ok(proc?.kind === "process");
    const [actorStmt, returnStmt] = proc.body;
    assert.ok(actorStmt?.kind === "actor" && returnStmt?.kind === "return" && returnStmt.type?.kind === "named");
    assert.deepEqual(m.links.get(actorStmt.actor), { kind: "element", id: "Cliente" });
    assert.deepEqual(m.links.get(returnStmt.type.ref), { kind: "element", id: "Vendas.Cliente" });
  });

  it("primitivos não precisam de declaração", () => {
    const m = model(`context C { entity E { a: uuid\n b: Map<string, json[]>? } }`);
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "uuid"), "primitive:uuid");
  });

  it("conexões resolvem nós de qualquer grupo do deployment", () => {
    const m = model(`
      app Api kind backend
      deployment prod {
        zone a { lb: aws.alb }
        zone b { cluster c { api: aws.ecs.service runs Api } }
        lb -> api
      }
    `);
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "lb"), "prod.lb");
    assert.equal(target(m, "Api"), "Api");
  });
});

describe("PL110: referência não resolvida", () => {
  it("aponta a posição da referência", () => {
    const m = model(`context C {\n  service S { uses Fantasma } }`);
    assert.deepEqual(codes(m), ["PL110"]);
    assert.deepEqual(m.diagnostics[0]?.loc, { file: "f0.planta", line: 2, column: 20 });
  });

  it("use de elemento inexistente", () => {
    assert.deepEqual(codes(model(`use Nada.Aqui`)), ["PL110"]);
  });

  it("segmento final inexistente em nome qualificado", () => {
    assert.deepEqual(codes(model(`context C { service S {}\n job J cron "* * * * *" => S.naoExiste }`)), ["PL110"]);
  });

  it("requisito por nome precisa existir; por ID fica para a validação", () => {
    const m = model(`context C { service S { justifiedBy "REQ-999", ReqInexistente } }`);
    assert.deepEqual(codes(m), ["PL110"]);
  });
});

describe("PL111: tipo incompatível (tabela 8.2)", () => {
  const cases: [string, string][] = [
    ["emit de serviço", `context C { service S {}\n process P { emit S } }`],
    ["trigger de entidade", `context C { entity E\n process P { trigger E } }`],
    ["handler de endpoint que não é operação", `context C { service S {}\n api R http { endpoint GET "/" => S } }`],
    ["uses de entidade", `context C { entity E\n service S { uses E } }`],
    ["calls de operação", `context C { service S { op a() }\n page P { calls S.a } }`],
    ["tipo de campo que é serviço", `context C { service S {}\n entity E { s: S } }`],
    ["via que não é canal", `context C { entity E\n event Ev via E }`],
    ["runs que não é app", `context C {}\n deployment d { n: x.y runs C }`],
    ["decidedBy que é requisito", `requirement R @"md:/r.md"\n context C { service S { decidedBy R } }`],
    ["sujeito de regra com tipo errado", `context C {}\n rule R { layer C must not depend on layer C }`],
  ];

  for (const [name, text] of cases) {
    it(name, () => assert.ok(codes(model(text)).includes("PL111"), JSON.stringify(model(text).diagnostics)));
  }

  it("mensagem diz o que foi encontrado e o que se esperava", () => {
    const [d] = model(`context C { service S {}\n process P { emit S } }`).diagnostics;
    assert.equal(d?.message, "`S` é service (`C.S`), mas aqui se espera event");
    assert.equal(d?.related?.[0]?.line, 1);
  });
});

describe("exemplos da especificação", () => {
  const spec = readFileSync(new URL("../planta-especificacao.md", import.meta.url), "utf8");
  const examples = extractExamples(spec);
  const loja = examples
    .filter((e) => e.section.startsWith("22."))
    .map((e) => ({ path: `spec:${e.line}`, text: e.code }));

  it("seção 22 liga sem diagnósticos e com as resoluções esperadas", () => {
    const m = buildModel(loja);
    assert.deepEqual(m.diagnostics, []);
    assert.equal(target(m, "Produto"), "Catalogo.Produto");
    assert.equal(target(m, "RestPublica.finalizarCompra"), "Vendas.RestPublica.finalizarCompra");
    assert.equal(target(m, "Catalogo.RestCatalogo.destaques"), "Catalogo.RestCatalogo.destaques");
    assert.equal(target(m, "UsarFilaParaEmails"), "UsarFilaParaEmails");
    assert.equal(target(m, "Vendas.eventos"), "Vendas.eventos");
    assert.equal(target(m, "Autenticado"), "Web.Autenticado");
  });

  it("seção 15.5: processo planejado acusa o que ainda não existe", () => {
    const planned = examples.find((e) => e.section.startsWith("15.5"))!;
    const m = buildModel([...loja, { path: "devolucao.planta", text: `context Vendas {\n${planned.code}}` }]);
    const unresolved = m.diagnostics.filter((d) => d.code === "PL110").map((d) => d.message);
    assert.deepEqual(unresolved, [
      "referência `RestPublica.solicitarDevolucao` não resolvida",
      "referência `DevolucoesService.validarPrazo` não resolvida",
      "referência `DevolucoesService.registrar` não resolvida",
      "referência `PagamentoGateway.estornar` não resolvida",
      "referência `DevolucaoRegistrada` não resolvida",
      "referência `Devolucao` não resolvida",
    ]);
    assert.deepEqual(codes(m).filter((c) => c !== "PL110"), []);
  });
});

