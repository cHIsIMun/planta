// Casos que a gramática resolve por lookahead e erros que ela precisa rejeitar.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse } from "../src/parse.ts";

function accepts(text: string) {
  assert.deepEqual(parse(text).diagnostics, []);
}

function rejects(text: string) {
  assert.notEqual(parse(text).diagnostics.length, 0, "deveria gerar PL100");
}

describe("palavras-chave contextuais", () => {
  it("modificador de campo seguido do próximo campo", () => {
    accepts(`context C { entity E { a: string unique max(10)\n b: int } }`);
  });

  it("palavras-chave como nomes de campo", () => {
    accepts(`context C { event E { version: string\n event: string\n kind: int } }`);
  });

  it("returns sem tipo seguido de auth", () => {
    accepts(`context C { api A http {
      endpoint GET "/x" => S.x {
        returns 404
        auth bearer roles [admin]
      }
    } }`);
  });

  it("returns sem tipo seguido de body", () => {
    accepts(`context C { api A http {
      endpoint POST "/x" => S.x {
        returns 404
        body Dto
      }
    } }`);
  });

  it("nó e conexão no deployment", () => {
    accepts(`deployment d {
      api: aws.ecs.service runs Api
      db: aws.rds.postgres
      api -> db "TCP 5432"
      api -> db
    }`);
  });

  it("seletor com curinga em view", () => {
    accepts(`view V kind class { include Vendas.*, every entity\n exclude Vendas.Dto }`);
  });
});

describe("erros de sintaxe", () => {
  it("comentário de documentação sem elemento (PL101)", () => {
    rejects(`/// solto no fim do arquivo\n`);
  });

  it("método HTTP não pode ser nome", () => {
    rejects(`actor GET`);
  });

  it("booleano não pode ser nome", () => {
    rejects(`actor true`);
  });

  it("membro de contexto fora de contexto", () => {
    rejects(`entity Cliente`);
  });

  it("reporta linha e coluna", () => {
    const [d] = parse(`system S {\n  owner 42\n}`).diagnostics;
    assert.equal(d?.code, "PL100");
    assert.equal(d?.loc.line, 2);
    assert.equal(d?.loc.column, 9);
  });
});
