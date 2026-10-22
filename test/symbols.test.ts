import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildModel, type Source } from "../src/model.ts";
import { extractExamples } from "./spec-examples.ts";

const SYSTEM: Source = { path: "sistema.planta", text: `system S {}` };

function model(...texts: string[]) {
  return buildModel([SYSTEM, ...texts.map((text, i) => ({ path: `f${i}.planta`, text }))]);
}

/** Códigos das fases 1–4; as referências fictícias destes testes geram PL110 na ligação. */
function codes(m: ReturnType<typeof model>) {
  return m.diagnostics.map((d) => d.code).filter((c) => !c.startsWith("PL11"));
}

describe("identificadores canônicos", () => {
  it("seguem o caminho de nomes (seção 8.3)", () => {
    const m = model(`
      context Vendas {
        entity Cliente { email: string }
        service ClientesService { op criar() }
        api RestPublica http { endpoint POST "/c" => ClientesService.criar }
        process FinalizarCompra {
          step validar: X.y
          if "falhou" { step desfazer: X.z } else { parallel { step publicar: emit E } }
        }
      }
      external Stripe { op cobrar() }
      app Web kind spa { page Checkout { } }
    `);
    assert.deepEqual(codes(m), []);
    for (const id of [
      "Vendas", "Vendas.Cliente", "Vendas.Cliente.email", "Vendas.ClientesService.criar",
      "Vendas.RestPublica.criar", "Vendas.FinalizarCompra.validar", "Vendas.FinalizarCompra.desfazer",
      "Vendas.FinalizarCompra.publicar", "Stripe.cobrar", "Web.Checkout",
    ]) {
      assert.ok(m.symbols.symbols.has(id), `falta ${id}`);
    }
    assert.equal(m.symbols.symbols.get("Vendas.RestPublica.criar")?.kind, "endpoint");
    assert.deepEqual(m.symbols.children.get("Vendas.Cliente"), ["Vendas.Cliente.email"]);
  });

  it("handlers `on` não viram símbolo", () => {
    const m = model(`context C { event E\n on E => S.op }`);
    assert.deepEqual([...m.symbols.symbols.keys()], ["S", "C", "C.E"]);
  });

  it("nós de deployment ficam no escopo do deployment", () => {
    const m = model(`deployment prod {
      network vpc { zone privada { cluster ecs { api: aws.ecs.service } } }
      api -> vpc
    }`);
    assert.deepEqual(m.diagnostics, []);
    assert.deepEqual(m.symbols.children.get("prod"), ["prod.vpc", "prod.privada", "prod.ecs", "prod.api"]);
  });
});

describe("mesclagem de contextos", () => {
  it("une membros declarados em arquivos diferentes", () => {
    const m = model(`context Vendas root "/v" { entity A }`, `/// Doc.\ncontext Vendas { entity B }`);
    assert.deepEqual(m.diagnostics, []);
    assert.deepEqual(m.symbols.children.get("Vendas"), ["Vendas.A", "Vendas.B"]);
    const merged = m.symbols.symbols.get("Vendas")?.decl;
    assert.ok(merged?.kind === "context");
    assert.equal(merged.root, "/v");
    assert.equal(merged.meta.docs, "Doc.");
  });

  it("não altera as ASTs dos arquivos", () => {
    const m = model(`context V { entity A }`, `context V { entity B }`);
    const first = m.files[1]?.decls[0];
    assert.ok(first?.kind === "context");
    assert.equal(first.members.length, 1);
  });

  it("PL105: root divergente", () => {
    const m = model(`context V root "/a" {}`, `context V root "/b" {}`);
    assert.deepEqual(codes(m), ["PL105"]);
    assert.equal(m.diagnostics[0]?.loc.file, "f1.planta");
    assert.equal(m.diagnostics[0]?.related?.[0]?.file, "f0.planta");
  });
});

describe("diagnósticos", () => {
  it("PL102: elemento duplicado aponta as duas declarações", () => {
    const m = model(`context C { entity A }`, `context C {\n  service A }`);
    assert.deepEqual(codes(m), ["PL102"]);
    assert.deepEqual(m.diagnostics[0]?.loc, { file: "f1.planta", line: 2, column: 11 });
    assert.deepEqual(m.diagnostics[0]?.related, [{ file: "f0.planta", line: 1, column: 20 }]);
  });

  it("PL102: nomes de nível superior compartilham escopo", () => {
    assert.deepEqual(codes(model(`actor Web`, `app Web kind spa`)), ["PL102"]);
  });

  it("PL102: campo, operação e passo repetidos", () => {
    assert.deepEqual(codes(model(`context C {
      entity E { a: int\n a: string }
      service S { op x()\n op x() }
      process P { step s: A.b\n if "c" { step s: A.c } }
    }`)), ["PL102", "PL102", "PL102"]);
  });

  it("PL104: endpoints com o mesmo nome implícito", () => {
    const m = model(`context C { api R http {
      endpoint GET "/a" => Ctrl.listar
      endpoint GET "/b" => Outro.listar
    } }`);
    assert.deepEqual(codes(m), ["PL104"]);
  });

  it("PL102, não PL104, quando os dois nomes são explícitos", () => {
    assert.deepEqual(codes(model(`context C { api R http {
      endpoint x GET "/a" => Ctrl.a
      endpoint x GET "/b" => Ctrl.b
    } }`)), ["PL102"]);
  });

  it("PL120: system ausente ou repetido", () => {
    assert.deepEqual(buildModel([{ path: "a.planta", text: "actor A" }]).diagnostics.map((d) => d.code), ["PL120"]);
    assert.deepEqual(codes(model(`system Outro {}`)), ["PL120"]);
  });

  it("arquivo com erro de sintaxe fica fora do modelo", () => {
    const m = model(`context C { entity }`, `context D {}`);
    assert.deepEqual(codes(m), ["PL100"]);
    assert.ok(m.symbols.symbols.has("D"));
    assert.ok(!m.symbols.symbols.has("C"));
  });
});

describe("exemplo completo da seção 22", () => {
  const spec = readFileSync(new URL("../planta-especificacao.md", import.meta.url), "utf8");
  const sources = extractExamples(spec)
    .filter((e) => e.section.startsWith("22."))
    .map((e) => ({ path: `spec:${e.line}`, text: e.code }));

  it("os sete arquivos formam um modelo sem diagnósticos", () => {
    assert.equal(sources.length, 7);
    const m = buildModel(sources);
    assert.deepEqual(m.diagnostics, []);
    for (const id of [
      "Loja", "apresentacao", "Stripe.estornar", "UsarFilaParaEmails",
      "Catalogo.RestCatalogo.destaques", "Vendas.RestPublica.finalizarCompra",
      "Vendas.Cliente.email", "Vendas.FinalizarCompra.registrarAuditoria",
      "Vendas.ExpirarCarrinhos", "Vendas.eventos", "Vendas.PedidoAgg",
      "Web.Checkout", "Web.Autenticado", "producao.api", "producao.vpc",
      "CamadasLimpas", "FluxoCompra",
    ]) {
      assert.ok(m.symbols.symbols.has(id), `falta ${id}`);
    }
  });
});
