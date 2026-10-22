// Critério de pronto da fase 0: todos os exemplos da especificação são aceitos.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildAst } from "../src/build-ast.ts";
import { parse } from "../src/parse.ts";
import { asFile, extractExamples } from "./spec-examples.ts";

const SPEC = new URL("../planta-especificacao.md", import.meta.url);
const examples = extractExamples(readFileSync(SPEC, "utf8"));

describe("gramática", () => {
  it("a seção 7 da spec e grammar/Planta.g4 são idênticas", () => {
    const spec = readFileSync(SPEC, "utf8");
    const fromSpec = /```antlr\n([\s\S]*?)```/.exec(spec)?.[1];
    const file = readFileSync(new URL("../grammar/Planta.g4", import.meta.url), "utf8");
    assert.equal(fromSpec, file);
  });
});

describe("exemplos da especificação", () => {
  it("encontra os blocos planta", () => {
    assert.ok(examples.length >= 30, `só ${examples.length} blocos encontrados`);
  });

  for (const ex of examples) {
    it(`${ex.section} (linha ${ex.line})`, () => {
      const { tree, diagnostics } = parse(asFile(ex.code));
      assert.deepEqual(diagnostics, []);
      buildAst(tree, `spec:${ex.line}`);
    });
  }
});
