import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { format } from "../src/format.ts";
import { parse } from "../src/parse.ts";
import { asFile, extractExamples } from "./spec-examples.ts";

function fmt(text: string): string {
  const result = format(text);
  assert.ok(result.ok, result.ok ? "" : JSON.stringify(result.diagnostics));
  return result.text;
}

/** Sequência de todos os tokens, inclusive comentários: o formatador não pode mudá-la. */
function tokens(text: string): string[] {
  return parse(text).tokens.map((t) => t.text ?? "");
}

describe("formatador: garantias", () => {
  const examples = extractExamples(readFileSync(new URL("../planta-especificacao.md", import.meta.url), "utf8"));

  for (const ex of examples) {
    it(`preserva tokens e é idempotente: linha ${ex.line}`, () => {
      const source = asFile(ex.code);
      const once = fmt(source);
      assert.deepEqual(tokens(once), tokens(source));
      assert.equal(fmt(once), once);
    });
  }

  it("arquivos completos da spec já estão na forma canônica", () => {
    for (const ex of examples.filter((e) => asFile(e.code) === e.code)) {
      assert.equal(fmt(ex.code), ex.code, `exemplo da linha ${ex.line}`);
    }
  });
});

describe("formatador: regras", () => {
  it("espaçamento entre tokens", () => {
    assert.equal(
      fmt(`context C{service S @ "s.ts#S"{op a ( x : Map < string , int [ ] > ? , y:T[]? )->R justifiedBy "R1" ,"R2"}}`),
      `context C { service S @"s.ts#S" { op a(x: Map<string, int[]>?, y: T[]?) -> R justifiedBy "R1", "R2" } }\n`,
    );
    assert.equal(fmt(`#[ owner ( "t" ) , tag(pii) ]\nactor A`), `#[owner("t"), tag(pii)]\nactor A\n`);
    assert.equal(
      fmt(`context C { api R http { endpoint GET "/x"=>S.x { auth bearer roles[a,b] } } }`),
      `context C { api R http { endpoint GET "/x" => S.x { auth bearer roles [a, b] } } }\n`,
    );
    assert.equal(fmt(`view V kind class { include Vendas . * , every app }`), `view V kind class { include Vendas.*, every app }\n`);
    assert.equal(fmt(`deployment d { a:x.y { cpu=1 }\n a->b "x" }`), `deployment d { a: x.y { cpu = 1 }\n  a -> b "x" }\n`);
    assert.equal(fmt(`system S { }`), `system S {}\n`);
  });

  it("indentação por bloco e de continuação", () => {
    assert.equal(
      fmt(`context C {\nservice S {\nuses A,\nB\n}\n}\nrequirement R @"md:/r.md"\n"Título"\n`),
      `context C {\n  service S {\n    uses A,\n      B\n  }\n}\nrequirement R @"md:/r.md"\n  "Título"\n`,
    );
  });

  it("processo com if/else e parallel", () => {
    assert.equal(
      fmt(`process P {\nif "a" {\nfail 400\n} else if "b" {\nparallel {\nemit E\n}\n}\n}`.replace(/^/, "context C {\n") + "\n}"),
      [
        "context C {",
        "  process P {",
        '    if "a" {',
        "      fail 400",
        '    } else if "b" {',
        "      parallel {",
        "        emit E",
        "      }",
        "    }",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("valores de enum e documentação não são continuação", () => {
    assert.equal(
      fmt(`context C {\n/// Doc.\n#[tag(x)]\nenum E {\nA,\nB\n}\n}`),
      `context C {\n  /// Doc.\n  #[tag(x)]\n  enum E {\n    A,\n    B\n  }\n}\n`,
    );
  });

  it("linhas em branco: no máximo uma, nenhuma no início ou fim", () => {
    assert.equal(fmt(`\n\nactor A\n\n\n\nactor B\n\n`), `actor A\n\nactor B\n`);
  });

  it("CRLF e espaços no fim da linha", () => {
    assert.equal(fmt("actor A   \r\nactor B\r\n"), "actor A\nactor B\n");
  });

  it("comentários são preservados e reindentados", () => {
    assert.equal(
      fmt(`context C {\n// linha\n      /* bloco\n   interno */\nentity E // fim\n}`),
      `context C {\n  // linha\n  /* bloco\n   interno */\n  entity E // fim\n}\n`,
    );
  });

  it("alinha layer e actor vizinhos no nível superior", () => {
    assert.equal(
      fmt(`layer ui match "a"\nlayer dominio match "b"\n\nactor Cliente "c"\nactor Backoffice "d"\nlayer x`),
      `layer ui      match "a"\nlayer dominio match "b"\n\nactor Cliente    "c"\nactor Backoffice "d"\nlayer x\n`,
    );
  });

  it("não alinha sujeitos de regra nem outras declarações", () => {
    const text = `rule R {\n  layer ui may depend on layer dominio\n  layer dominio must not depend on layer ui\n}\nview Abc kind class\nview Abcdef kind er\n`;
    assert.equal(fmt(text), text);
  });

  it("alinha comentários de fim de linha vizinhos", () => {
    assert.equal(
      fmt(`context C {\nentity A // um\nentity Bcd // dois\n\nentity E // só\n}`),
      `context C {\n  entity A   // um\n  entity Bcd // dois\n\n  entity E // só\n}\n`,
    );
  });

  it("recusa arquivo com erro de sintaxe", () => {
    const result = format(`context C { entity }`, "x.planta");
    assert.ok(!result.ok);
    assert.equal(result.diagnostics[0]?.code, "PL100");
  });

  it("arquivo vazio continua vazio", () => {
    assert.equal(fmt(""), "");
    assert.equal(fmt("\n\n"), "");
  });
});
