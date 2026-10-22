import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discover, normalizeText, parseMarkdown, sectionFor, slugify } from "../src/docs/markdown.ts";

const CLIENTES = `# Clientes

## REQ-001 Cadastro de cliente

O visitante deve poder se cadastrar informando **e-mail** e nome.
O e-mail deve ser único no sistema.

### Critérios de aceite
- E-mail duplicado retorna erro de conflito.

<!-- planta:trace -->
- conteúdo injetado
<!-- /planta:trace -->

## REQ-002: Busca de cliente

Texto da busca.

\`\`\`md
## REQ-999 dentro de bloco de código não conta
\`\`\`

## Notas soltas
`;

const REQ = /REQ-\d{3}/;

describe("markdown", () => {
  it("títulos com ID viram requisitos; o texto vai até o próximo título de mesmo nível", () => {
    const items = discover(parseMarkdown("docs/clientes.md", CLIENTES), REQ, "requirement");
    assert.deepEqual(items.map((i) => [i.id, i.title, i.line, i.slug]), [
      ["REQ-001", "Cadastro de cliente", 3, "req-001-cadastro-de-cliente"],
      ["REQ-002", "Busca de cliente", 15, "req-002-busca-de-cliente"],
    ]);
    assert.match(items[0]!.text, /Critérios de aceite E-mail duplicado/);
    // O bloco de código faz parte do texto da seção, mas o título dentro dele não vira requisito.
    assert.match(items[1]!.text, /REQ-999/);
  });

  it("a impressão ignora formatação e blocos injetados, mas não o conteúdo", () => {
    const base = discover(parseMarkdown("a.md", CLIENTES), REQ, "requirement")[0]!.fingerprint;
    const fp = (text: string) => discover(parseMarkdown("a.md", text), REQ, "requirement")[0]!.fingerprint;
    assert.equal(fp(CLIENTES.replace("**e-mail**", "e-mail").replace("único no", "único  no")), base);
    assert.equal(fp(CLIENTES.replace("- conteúdo injetado", "- outro conteúdo injetado\n- e mais")), base);
    assert.notEqual(fp(CLIENTES.replace("único no sistema", "único por empresa")), base);
  });

  it("front matter: um requisito por arquivo, com atributos", () => {
    const doc = parseMarkdown("r.md", "---\nid: REQ-010\ntitle: Finalizar compra\nstatus: approved\npriority: high\n---\nO cliente pode finalizar.\n");
    const [item] = discover(doc, REQ, "requirement");
    assert.deepEqual([item?.id, item?.title, item?.attributes.status, item?.attributes.priority], ["REQ-010", "Finalizar compra", "approved", "high"]);
    assert.equal(item?.text, "O cliente pode finalizar.");
  });

  it("decisão com status no corpo", () => {
    const [adr] = discover(parseMarkdown("adr.md", "# ADR-0007 Filas para e-mail\n\nStatus: Superseded\n\nUsamos filas."), /ADR-\d{4}/, "decision");
    assert.equal(adr?.attributes.status, "superseded");
  });

  it("seção sem ID, por slug, e arquivo inteiro sem slug", () => {
    const doc = parseMarkdown("c.md", CLIENTES);
    assert.equal(sectionFor(doc, "critérios-de-aceite", "Criterios", "requirement")?.text, "E-mail duplicado retorna erro de conflito.");
    assert.equal(sectionFor(doc, "nao-existe", "X", "requirement"), undefined);
    assert.equal(sectionFor(doc, undefined, "Tudo", "decision")?.title, "Clientes");
  });

  it("slug e normalização", () => {
    assert.equal(slugify("Cadastro de Cliente!"), "cadastro-de-cliente");
    assert.equal(slugify("REQ-001 Critérios: fase 2"), "req-001-critérios-fase-2");
    assert.equal(normalizeText("Veja [o guia](x.md) e `código`.\n\n- item"), "Veja o guia e código. item");
  });
});
