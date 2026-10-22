import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type * as A from "../src/ast.ts";
import { buildAst } from "../src/build-ast.ts";
import { parse } from "../src/parse.ts";

function ast(text: string): A.FileAst {
  const { tree, diagnostics } = parse(text, "t.planta");
  assert.deepEqual(diagnostics, []);
  return buildAst(tree, "t.planta");
}

function member<K extends A.ContextMember["kind"]>(text: string, kind: K): A.ContextMember & { kind: K } {
  const ctx = ast(`context C {\n${text}\n}`).decls[0] as A.ContextDecl;
  const found = ctx.members.find((m) => m.kind === kind);
  assert.ok(found, `nenhum membro ${kind}`);
  return found as A.ContextMember & { kind: K };
}

describe("AST", () => {
  it("documentação, anotações e posição", () => {
    const [decl] = ast(`/// Linha um.\n///   Linha dois.\n#[owner("time"), tag(pii)]\nactor Cliente "Quem compra"`).decls;
    assert.equal(decl?.kind, "actor");
    assert.equal(decl.meta.docs, "Linha um.\n  Linha dois.");
    assert.deepEqual(decl.meta.annotations.map((a) => [a.name, a.args]), [
      ["owner", [{ kind: "string", value: "time" }]],
      ["tag", [{ kind: "name", value: "pii" }]],
    ]);
    assert.deepEqual(decl.name.loc, { file: "t.planta", line: 4, column: 7 });
  });

  it("strings com escape", () => {
    const [decl] = ast(`actor A "com \\"aspas\\" e \\\\ barra"`).decls as A.ActorDecl[];
    assert.equal(decl?.description, `com "aspas" e \\ barra`);
  });

  it("tipos: lista, opcional e mapa", () => {
    const dto = member(`dto D { a: Item[]?\n b: Map<string, int[]>?\n c: Vendas.Cliente }`, "dto");
    const [a, b, c] = dto.fields!.map((f) => f.type);
    assert.deepEqual([a?.kind, a?.kind === "named" && a.list, a?.optional], ["named", true, true]);
    assert.equal(b?.kind, "map");
    assert.equal(b?.optional, true);
    assert.ok(b?.kind === "map" && b.value.kind === "named" && b.value.list);
    assert.ok(c?.kind === "named" && c.ref.name === "Vendas.Cliente");
  });

  it("entidade sem bloco não tem campos; com bloco vazio tem lista vazia", () => {
    assert.equal(member(`entity E @"e.ts#E"`, "entity").fields, undefined);
    assert.deepEqual(member(`entity E {}`, "entity").fields, []);
  });

  it("nome implícito de endpoint vem do handler", () => {
    const api = member(`api R http base "/v1" {
      endpoint POST "/x" => Ctrl.criar
      endpoint buscar GET "/x/:id" => Ctrl.obter { param id: uuid in path }
    }`, "api");
    assert.equal(api.base, "/v1");
    assert.deepEqual(api.endpoints.map((e) => [e.name.name, e.implicitName, e.method]), [
      ["criar", true, "POST"],
      ["buscar", false, "GET"],
    ]);
    assert.equal(api.endpoints[1]?.params[0]?.in, "path");
  });

  it("else if vira if aninhado no else", () => {
    const proc = member(`process P {
      if "a" { fail 400 } else if "b" { step s: X.y } else { return }
    }`, "process");
    const top = proc.body[0];
    assert.ok(top?.kind === "if");
    const nested = top.else?.[0];
    assert.ok(nested?.kind === "if" && nested.condition === "b");
    assert.equal(nested.then[0]?.kind, "step");
    assert.equal(nested.else?.[0]?.kind, "return");
  });

  it("alvos de passo", () => {
    const proc = member(`process P { step a: S.op\n step b: emit Ev\n step c: "manual" }`, "process");
    const targets = proc.body.map((s) => s.kind === "step" && s.target.kind);
    assert.deepEqual(targets, ["op", "emit", "manual"]);
  });

  it("cabeçalho de deployment com partes opcionais", () => {
    const [full, bare] = ast(`
      deployment p provider aws region "sa-east-1" source terraform "/infra" {}
      deployment l source compose "/dc.yml" { a: docker.container\n a -> b -> c "x" }
    `).decls as A.DeploymentDecl[];
    assert.deepEqual([full?.provider, full?.region, full?.source], ["aws", "sa-east-1", { kind: "terraform", path: "/infra" }]);
    assert.deepEqual([bare?.provider, bare?.region, bare?.source?.kind], [undefined, undefined, "compose"]);
    const conn = bare?.items[1];
    assert.ok(conn?.kind === "connection");
    assert.deepEqual(conn.path.map((r) => r.name), ["a", "b", "c"]);
    assert.equal(conn.label, "x");
  });

  it("regras", () => {
    const [rule] = ast(`rule R severity error {
      layer dominio must not depend on layer infra
      every entity where tag = pii must have owner
      context Web may depend on context Vendas except via endpoint
    }`).decls as A.RuleDecl[];
    assert.equal(rule?.severity, "error");
    assert.deepEqual(rule?.statements.map((s) => s.modality), ["mustNot", "must", "may"]);
    assert.deepEqual(rule?.statements[1]?.subject, {
      kind: "every", elementKind: "entity", where: { attribute: "tag", value: { kind: "name", value: "pii" } },
    });
    assert.equal(rule?.statements[2]?.exceptVia, "endpoint");
  });

  it("views", () => {
    const [view] = ast(`view V kind c4.container of Vendas style aws {
      include *, every app, Vendas.*
      exclude Vendas.Dto
      layout lr
    }`).decls as A.ViewDecl[];
    assert.equal(view?.viewKind, "c4.container");
    assert.equal(view?.style, "aws");
    assert.deepEqual(view?.include.map((s) => s.kind === "ref" ? [s.ref.name, s.children] : s.kind), [
      "all", "every", ["Vendas", true],
    ]);
    assert.equal(view?.layout, "lr");
  });
});
