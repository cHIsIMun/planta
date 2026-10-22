// Fase 2: diagramas gerados do modelo, sem edição manual.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { IrModel } from "../src/ir.ts";
import { buildModel } from "../src/model.ts";
import { allViews, inject, renderViews } from "../src/render/index.ts";
import { renderMermaid } from "../src/render/mermaid.ts";
import { select, type View } from "../src/render/views.ts";
import { mermaidError } from "./support/mermaid.ts";

const LOJA: IrModel = JSON.parse(readFileSync(new URL("./golden/loja.model.json", import.meta.url), "utf8"));

function view(kind: string, of?: string, extra: Partial<View> = {}): View {
  return { name: "v", kind, ...(of && { of }), include: [], exclude: [], ...extra };
}

function ir(text: string): IrModel {
  const m = buildModel([{ path: "s.planta", text: `system S {}\n${text}` }]);
  assert.deepEqual(m.diagnostics.filter((d) => d.severity === "error"), []);
  return m.ir;
}

describe("toda view da seção 22 gera Mermaid válido", () => {
  for (const r of renderViews(allViews(LOJA), LOJA)) {
    it(`${r.view.name} (${r.view.kind})`, async () => {
      assert.equal(r.error, undefined);
      assert.equal(await mermaidError(r.text!), undefined, r.text ?? "");
    });
  }

  it("view declarada substitui a automática de mesmo tipo e alvo", () => {
    const names = allViews(LOJA).map((v) => v.name);
    assert.ok(names.includes("FluxoCompra"));
    assert.ok(!names.includes("sequencia-Vendas.FinalizarCompra"));
    assert.ok(names.includes("classes-Catalogo"));
  });
});

describe("seleção de elementos", () => {
  it("include, exclude e `of`", () => {
    const kinds = (ids: string[]) => [...new Set(ids.map((id) => LOJA.elements[id]!.kind))].sort();
    const vendas = select(LOJA, view("class", undefined, { include: [{ element: "Vendas", children: true }], exclude: [{ every: "dto" }] }), ["entity", "value", "dto", "enum"]);
    assert.deepEqual(kinds(vendas), ["entity", "enum", "value"]);
    assert.ok(vendas.every((id) => id.startsWith("Vendas.")));
    assert.deepEqual(select(LOJA, view("class", "Catalogo"), ["entity"]), ["Catalogo.Categoria", "Catalogo.Produto"]);
  });
});

describe("diagrama de classes (seção 13.3)", () => {
  const text = renderMermaid(view("class", "Vendas", { exclude: [{ every: "dto" }, { every: "event" }] }), { ir: LOJA });

  it("associação com inverso desenhada uma vez, do lado da lista", () => {
    assert.match(text, /^ {2}Cliente "1" --> "\*" Pedido : pedidos$/m);
    assert.doesNotMatch(text, /Pedido .* Cliente : cliente/);
  });

  it("composição para cascade e para objeto de valor; enum sem cardinalidade", () => {
    assert.match(text, /^ {2}Pedido "1" \*-- "\*" ItemPedido : itens$/m);
    assert.match(text, /^ {2}Pedido \*-- Endereco : endereco$/m);
    assert.match(text, /^ {2}Pedido --> StatusPedido$/m);
  });

  it("estereótipos, valores de enum e relações fora dos atributos", () => {
    assert.match(text, /class StatusPedido \{\n {4}<<enumeration>>\n {4}PENDENTE\n/);
    assert.match(text, /class Endereco \{\n {4}<<value>>/);
    assert.doesNotMatch(text, /Pedido\[\] pedidos/);
  });

  it("campos extraídos do código aparecem em itálico", async () => {
    const model = ir(`context C { entity E @"e.ts#E" }`);
    const out = renderMermaid(view("class", "C"), {
      ir: model,
      extractedFields: new Map([["C.E", [{ name: "id", type: "uuid", list: false, optional: false, modifiers: { key: [] }, line: 1 }]]]),
    });
    assert.match(out, / {4}uuid id\*\n/);
    assert.equal(await mermaidError(out), undefined);
  });

  it("nomes repetidos entre contextos ganham o ID", async () => {
    const model = ir(`context A { entity X }\ncontext B { entity X }`);
    const out = renderMermaid(view("class"), { ir: model });
    assert.match(out, /class A_X/);
    assert.match(out, /class B_X/);
    assert.equal(await mermaidError(out), undefined);
  });
});

describe("ER", () => {
  const text = renderMermaid(view("er", "Vendas"), { ir: LOJA });

  it("chaves, únicos e cardinalidades", () => {
    assert.match(text, /Cliente \{\n {4}uuid id PK\n {4}string email UK\n/);
    assert.match(text, /^ {2}Cliente \|\|--o\{ Pedido : pedidos$/m);
    assert.match(text, /^ {2}Pedido \|\|--o\{ ItemPedido : itens$/m);
  });

  it("muitos-para-um sem inverso", () => {
    assert.match(renderMermaid(view("er", "Catalogo"), { ir: LOJA }), /^ {2}Produto \}o--\|\| Categoria : categoria$/m);
  });
});

describe("sequência (seção 13.2)", () => {
  const text = renderMermaid(view("sequence", "Vendas.FinalizarCompra"), { ir: LOJA });

  it("gatilho, passos, alt/else, par e resposta", () => {
    const lines = text.trim().split("\n").map((l) => l.trim());
    const expect = [
      "Cliente->>Vendas_RestPublica: POST /api/v1/checkout",
      "Vendas_RestPublica->>Vendas_CarrinhoService: validar()",
      "alt estoque insuficiente",
      "Vendas_RestPublica-->>Cliente: 422 Itens indisponíveis",
      "Vendas_RestPublica->>Vendas_PagamentoGateway: cobrar()",
      "Vendas_PagamentoGateway->>Stripe: chamada",
      "par",
      "Vendas_RestPublica-)Vendas_eventos: PedidoCriado",
      "and",
      "Vendas_RestPublica-->>Cliente: 201 Pedido",
    ];
    let at = -1;
    for (const e of expect) {
      const next = lines.indexOf(e, at + 1);
      assert.ok(next > at, `faltou, ou fora de ordem: ${e}`);
      at = next;
    }
    assert.match(text, /participant Stripe as Stripe \(externo\)/);
  });

  it("só declara participantes usados", () => {
    assert.doesNotMatch(text, /as FinalizarCompra/);
  });

  it("else if, foreach, wait, passo manual e gatilho por evento", async () => {
    const model = ir(`context C {
      channel fila kind queue
      event Pago via fila
      event Entregue
      component L { op tratar() }
      service S { op a()\n op b() }
      on Pago => L.tratar
      process P {
        trigger Pago
        if "x" { step a: S.a } else if "y" { step b: S.b } else { fail "z" }
        foreach "item" { step manual: "conferir à mão" }
        wait Entregue timeout "7d"
      }
    }`);
    const out = renderMermaid(view("sequence", "C.P"), { ir: model });
    assert.match(out, /C_fila-\)C_L: Pago/);
    assert.match(out, /alt x[\s\S]*else y[\s\S]*else\n[\s\S]*Note over C_L: falha: z[\s\S]*end/);
    assert.match(out, /loop item\n\s+Note over C_L: conferir à mão\n\s+end/);
    assert.match(out, /C_Entregue--\)C_L: Entregue \(timeout 7d\)/);
    assert.equal(await mermaidError(out), undefined, out);
  });

  it("view de sequência exige processo", () => {
    assert.throws(() => renderMermaid(view("sequence", "Vendas.Cliente"), { ir: LOJA }), /esperava process/);
    assert.throws(() => renderMermaid(view("sequence"), { ir: LOJA }), /precisa de `of`/);
  });
});

describe("C4", () => {
  it("contexto: atores e externos ligados ao sistema", () => {
    const text = renderMermaid(view("c4.context"), { ir: LOJA });
    assert.match(text, /^C4Context$/m);
    assert.match(text, /Rel\(Cliente, Loja, "usa"\)/);
    assert.match(text, /Rel\(Loja, Stripe, "usa"\)/);
    assert.match(text, /System_Ext\(SES, "SES", "Amazon Simple Email Service"\)/);
  });

  it("contêineres: chamadas entre apps e hospedagem explícita", () => {
    const text = renderMermaid(view("c4.container"), { ir: LOJA });
    assert.match(text, /Rel\(Web, Api, "HTTP"\)/);
    assert.match(text, /Rel\(Worker, SES, "usa"\)/);
    assert.doesNotMatch(text, /Rel\(Api, SES/, "EmailListener está listado só no Worker");
    assert.match(text, /Container\(Api, "Api", "nestjs, backend", "Vendas, Catalogo"\)/);
  });

  it("componentes de um contexto", async () => {
    const text = renderMermaid(view("c4.component", "Vendas"), { ir: LOJA });
    assert.match(text, /Component\(Vendas_ClientesService, "ClientesService", "service"/);
    assert.match(text, /Rel\(Vendas_ClientesService, Vendas_ClienteRepository, "usa"\)/);
    assert.match(text, /System_Ext\(Stripe, "Stripe"\)/);
    assert.equal(await mermaidError(text), undefined);
  });
});

describe("deployment e sitemap", () => {
  it("grupos aninhados, formas por tipo e conexões rotuladas", () => {
    const text = renderMermaid(view("deployment", "producao"), { ir: LOJA });
    assert.match(text, /subgraph producao_vpc\["network vpc · aws\.vpc"\]\n {4}subgraph producao_publica/);
    assert.match(text, /producao_db\[\("db<br\/>aws\.rds\.postgres<br\/>stores Vendas<br\/>stores Catalogo"\)\]/);
    assert.match(text, /producao_lb -->\|"HTTP 3000"\| producao_api/);
  });

  it("rotas, guards e o que cada página renderiza", () => {
    const text = renderMermaid(view("sitemap", "Web"), { ir: LOJA });
    assert.match(text, /Web_r3 -->\|"guard Autenticado"\| Web_Checkout\["Checkout"\]/);
    assert.match(text, /Web_Checkout -.-> Web_FormPagamento/);
  });
});

describe("injeção em Markdown (seção 13.6)", () => {
  const render = (name: string) => renderViews(allViews(LOJA).filter((v) => v.name === name), LOJA)[0];

  it("preenche o bloco e é idempotente", () => {
    const md = "# A\n\n<!-- planta:view FluxoCompra -->\nvelho\n<!-- /planta:view -->\n\nfim\n";
    const once = inject(md, render);
    assert.deepEqual(once.problems, []);
    assert.match(once.text, /<!-- planta:view FluxoCompra -->\n```mermaid\nsequenceDiagram\n[\s\S]*```\n<!-- \/planta:view -->\n\nfim\n$/);
    assert.equal(inject(once.text, render).text, once.text);
  });

  it("view inexistente vira problema com a linha, e o bloco fica intacto", () => {
    const md = "a\n\n<!-- planta:view Nada -->\nx\n<!-- /planta:view -->\n";
    const r = inject(md, render);
    assert.deepEqual(r.problems, [{ line: 3, message: "view `Nada` não existe" }]);
    assert.equal(r.text, md);
  });
});
