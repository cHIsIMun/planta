import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildModel, type Model, type Source } from "../src/model.ts";
import { extractExamples } from "./spec-examples.ts";

const SYSTEM: Source = { path: "sistema.planta", text: `system S { description "d" }` };

function model(...texts: string[]): Model {
  return buildModel([SYSTEM, ...texts.map((text, i) => ({ path: `f${i}.planta`, text }))]);
}

function el(m: Model, id: string) {
  const found = m.ir.elements[id];
  assert.ok(found, `elemento ${id} ausente no IR`);
  return found;
}

describe("IR", () => {
  it("cabeçalho e ordem estável dos elementos", () => {
    const m = buildModel([SYSTEM, { path: "a", text: "actor Zeta\nactor Alfa" }], {
      generatedAt: "2026-10-21T00:00:00Z",
      gitCommit: "abc123",
    });
    assert.equal(m.ir.schema, "planta.model/1");
    assert.deepEqual(m.ir.system, { id: "S", description: "d" });
    assert.equal(m.ir.generatedAt, "2026-10-21T00:00:00Z");
    assert.equal(m.ir.gitCommit, "abc123");
    assert.deepEqual(Object.keys(m.ir.elements), ["Alfa", "Zeta"]);
  });

  it("endpoint: caminho completo, nome implícito e handledBy", () => {
    const m = model(`context V {
      controller C { op criar() }
      api R http base "/api/v1/" { endpoint POST "/clientes" => C.criar { returns 201 } }
      api G graphql { endpoint query "relatorio" => C.criar }
    }`);
    const rest = el(m, "V.R.criar");
    assert.equal(rest.path, "/api/v1/clientes");
    assert.deepEqual(rest.relations, [{ type: "handledBy", target: "V.C.criar" }]);
    assert.deepEqual(el(m, "V.G.criar").operation, "relatorio");
  });

  it("`on` vira consumes na operação, mesmo declarada depois e em outro arquivo", () => {
    const m = model(`context V { event E\n on E => S.tratar }`, `context V { service S { op tratar() } }`);
    assert.deepEqual(el(m, "V.S.tratar").relations, [{ type: "consumes", target: "V.E" }]);
  });

  it("conexões encadeadas, inclusive antes da declaração do nó", () => {
    const m = model(`deployment d {
      a -> b -> c "rótulo"
      a: generic.y
      zone z { b: generic.y }
      c: generic.y
    }`);
    assert.deepEqual(m.diagnostics, []);
    assert.deepEqual(el(m, "d.a").relations, [{ type: "connectsTo", target: "d.b", label: "rótulo" }]);
    assert.deepEqual(el(m, "d.b").relations, [{ type: "connectsTo", target: "d.c", label: "rótulo" }]);
    assert.equal(el(m, "d.b").parent, "d.z");
  });

  it("deployment guarda a origem IaC sem apagar a posição na planta", () => {
    const m = model(`deployment prod provider aws source terraform "/infra" {}`);
    const d = el(m, "prod");
    assert.deepEqual(d.iac, { kind: "terraform", path: "/infra" });
    assert.deepEqual(d.source, { file: "f0.planta", line: 1, column: 1 });
  });

  it("rastreabilidade por ID e por nome", () => {
    const m = model(`decision D @"md:/adr.md"\n context V { service S { justifiedBy "REQ-001"\n decidedBy D, "ADR-0002" } }`);
    assert.deepEqual(el(m, "V.S").relations, [
      { type: "justifiedBy", target: "req:REQ-001" },
      { type: "decidedBy", target: "D" },
      { type: "decidedBy", target: "adr:ADR-0002" },
    ]);
  });

  it("referência não resolvida é marcada, não descartada", () => {
    const m = model(`context V { service S { uses Fantasma } }`);
    assert.deepEqual(el(m, "V.S").relations, [{ type: "uses", target: "Fantasma", unresolved: true }]);
  });

  it("segunda declaração de um ID duplicado fica fora do IR", () => {
    const m = model(`actor A "primeiro"\nactor A "segundo"`);
    assert.equal(el(m, "A").description, "primeiro");
  });

  it("tipos compostos", () => {
    const m = model(`context V { dto D { m: Map<string, int[]>?\n e: D[]? } }`);
    assert.deepEqual(el(m, "V.D").fields, [
      { id: "V.D.m", name: "m", type: { map: { key: { ref: "string" }, value: { ref: "int", list: true } }, optional: true }, modifiers: {} },
      { id: "V.D.e", name: "e", type: { ref: "V.D", list: true, optional: true }, modifiers: {} },
    ]);
  });
});

describe("golden: exemplo completo da seção 22", () => {
  const GOLDEN = new URL("./golden/loja.model.json", import.meta.url);
  const spec = readFileSync(new URL("../planta-especificacao.md", import.meta.url), "utf8");
  const sources = extractExamples(spec)
    .filter((e) => e.section.startsWith("22."))
    .map((e) => ({ path: `planta/${e.section.replace(/^22\.\d+ `|`$/g, "")}`, text: e.code }));

  it("o IR gerado é igual ao golden (PLANTA_UPDATE_GOLDEN=1 regrava)", () => {
    const m = buildModel(sources);
    assert.deepEqual(m.diagnostics, []);
    const actual = JSON.stringify(m.ir, null, 2) + "\n";
    if (process.env.PLANTA_UPDATE_GOLDEN) writeFileSync(GOLDEN, actual);
    assert.ok(existsSync(GOLDEN), "golden ausente: rode com PLANTA_UPDATE_GOLDEN=1");
    assert.equal(actual, readFileSync(GOLDEN, "utf8"));
  });
});
