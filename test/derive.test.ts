import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAnchor } from "../src/derive.ts";
import { buildModel, type Model, type Source } from "../src/model.ts";

const SYSTEM: Source = { path: "sistema.planta", text: `system S {}` };

function model(...texts: string[]): Model {
  return buildModel([SYSTEM, ...texts.map((text, i) => ({ path: `f${i}.planta`, text }))]);
}

describe("âncoras", () => {
  it("caminho relativo ao root do contexto; `/` é a raiz do projeto", () => {
    const m = model(`context V root "/apps/api/src/vendas" {
      entity A @"a/a.entity.ts#A"
      entity B @"/shared/b.ts#B"
      entity C @"../comum/c.ts#C"
    }`);
    assert.deepEqual(m.diagnostics, []);
    assert.equal(m.derived.anchors.get("V.A")?.path, "apps/api/src/vendas/a/a.entity.ts");
    assert.equal(m.derived.anchors.get("V.B")?.path, "shared/b.ts");
    assert.equal(m.derived.anchors.get("V.C")?.path, "apps/api/src/comum/c.ts");
  });

  it("componentes de app usam o root do app", () => {
    const m = model(`app Web kind spa root "/apps/web/src" { page Home @"pages/Home.tsx#Home" }`);
    assert.equal(m.derived.anchors.get("Web.Home")?.path, "apps/web/src/pages/Home.tsx");
  });

  it("operação sem âncora herda a do componente", () => {
    const m = model(`context V root "/v" { service S @"s.ts#Servico" { op criar() } }`);
    assert.deepEqual(m.derived.anchors.get("V.S.criar"), {
      raw: "v/s.ts#Servico.criar", scheme: "code", path: "v/s.ts", symbol: "Servico.criar", inherited: true,
    });
  });

  it("`#Simbolo` usa o arquivo do pai", () => {
    const m = model(`context V root "/v" { service S @"s.ts#S" { op criar() @"#S.create" } }`);
    const anchor = m.derived.anchors.get("V.S.criar");
    assert.deepEqual([anchor?.path, anchor?.symbol, anchor?.inherited], ["v/s.ts", "S.create", undefined]);
  });

  it("operação de componente sem âncora não recebe âncora", () => {
    assert.equal(model(`context V { service S { op a() } }`).derived.anchors.get("V.S.a"), undefined);
  });

  it("esquemas com caminho e com endereço", () => {
    assert.deepEqual(parseAnchor("md:/docs/adr/0007.md#contexto", "x"), {
      raw: "md:/docs/adr/0007.md#contexto", scheme: "md", path: "docs/adr/0007.md", symbol: "contexto",
    });
    assert.deepEqual(parseAnchor("tf:module.vpc.aws_subnet.privada[0]", "x"), {
      raw: "tf:module.vpc.aws_subnet.privada[0]", scheme: "tf", address: "module.vpc.aws_subnet.privada[0]",
    });
    assert.deepEqual(parseAnchor("code:a.ts#A", "r").path, "r/a.ts");
  });
});

describe("camadas", () => {
  const layers = `
    layer apresentacao match "**/*.controller.ts"
    layer infra match "**/infra/**", "**/*.repository.ts"
  `;

  it("por match, na ordem de declaração das camadas", () => {
    const m = model(layers, `context V root "/src" {
      controller C @"infra/x.controller.ts#C"
      repository R @"r.repository.ts#R"
      service S @"s.service.ts#S"
    }`);
    assert.equal(m.derived.layers.get("V.C"), "apresentacao");
    assert.equal(m.derived.layers.get("V.R"), "infra");
    assert.equal(m.derived.layers.get("V.S"), undefined);
  });

  it("`in layer` vence o match", () => {
    const m = model(layers, `context V { controller C @"a.controller.ts#C" in layer infra }`);
    assert.equal(m.derived.layers.get("V.C"), "infra");
  });

  it("operação herdada cai na camada do arquivo do componente", () => {
    const m = model(layers, `context V { controller C @"a.controller.ts#C" { op x() } }`);
    assert.equal(m.derived.layers.get("V.C.x"), "apresentacao");
  });
});

describe("metadados", () => {
  it("owner é herdado pelos filhos e pode ser sobrescrito", () => {
    const m = model(`#[owner("vendas")]
      context V {
        service S { op a() }
        #[owner("checkout")]
        process P { step s: S.a }
      }`);
    assert.equal(m.derived.meta.get("V.S.a")?.owner, "vendas");
    assert.equal(m.derived.meta.get("V.P")?.owner, "checkout");
    assert.equal(m.derived.meta.get("V.P.s")?.owner, "checkout");
  });

  it("vocabulário padrão", () => {
    const m = model(`context V {
      #[status(planned), tag(pii, lgpd), since("2026-03"), stereotype("raiz"), ignore(drift, "gerado")]
      entity E { email: string sensitive }
    }`);
    assert.deepEqual(m.diagnostics, []);
    assert.deepEqual(m.derived.meta.get("V.E"), {
      status: "planned", tags: ["pii", "lgpd"], since: "2026-03", stereotype: "raiz",
      ignore: [{ category: "drift", reason: "gerado" }],
    });
    assert.deepEqual(m.derived.meta.get("V.E.email")?.tags, ["pii"]);
  });

  it("anotação desconhecida gera PL103 e é preservada", () => {
    const m = model(`#[criticidade(alta)]\nactor A`);
    assert.deepEqual(m.diagnostics.map((d) => [d.code, d.severity]), [["PL103", "warning"]]);
    assert.deepEqual(m.derived.meta.get("A")?.annotations, [{ name: "criticidade", args: [{ kind: "name", value: "alta" }] }]);
  });

  it("PL103: modificador, status, ignore sem justificativa, status repetido", () => {
    const m = model(`context V {
      entity A { x: int obrigatorio }
      #[status(pronto)] entity B
      #[ignore(coverage)] entity C
      #[status(planned), status(active)] entity D
    }`);
    assert.deepEqual(m.diagnostics.map((d) => d.code), ["PL103", "PL103", "PL103", "PL103"]);
    assert.equal(m.derived.meta.get("V.D")?.status, "planned");
  });
});
