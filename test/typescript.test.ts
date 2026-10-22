import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { findSymbol, fingerprint, listSymbols, type SourceFile, TypeScriptParser } from "../src/code/typescript.ts";

let ts: TypeScriptParser;
before(async () => {
  ts = await TypeScriptParser.create();
});

function file(text: string, path = "a.ts"): SourceFile {
  return ts.parse(path, text);
}

function fp(text: string, symbol: string) {
  const [sym, ...rest] = findSymbol(file(text), symbol);
  assert.ok(sym, `símbolo ${symbol} não encontrado`);
  assert.equal(rest.length, 0);
  return fingerprint(sym);
}

describe("símbolos", () => {
  const source = `
    @Entity()
    export class Cliente extends Base {
      @Column() email: string;
      private segredo = 1;
      criar(a: string): void;
      criar(a: any): void {}
    }
    export default function Home() {}
    export enum Status { A }
    export const useCarrinho = () => 1, outro = 2;
    interface I {}
    type T = string;
  `;

  it("declarações de nível superior e membros de classe", () => {
    const names = listSymbols(file(source)).map((s) => `${s.name}:${s.kind}`);
    assert.deepEqual(names, [
      "Cliente:class", "Cliente.email:property", "Cliente.segredo:property", "Cliente.criar:method",
      "Home:function", "default:function", "Status:enum", "useCarrinho:variable", "outro:variable",
      "I:interface", "T:type",
    ]);
  });

  it("decorators de classe exportada e de membros", () => {
    const [cls] = findSymbol(file(source), "Cliente");
    assert.deepEqual(cls?.decorators.map((d) => d.text), ["@Entity()"]);
    const [email] = findSymbol(file(source), "Cliente.email");
    assert.deepEqual(email?.decorators.map((d) => d.text), ["@Column()"]);
    const [method] = findSymbol(file(`class A {\n @Post() @UseGuards(G)\n criar() {}\n}`), "A.criar");
    assert.deepEqual(method?.decorators.map((d) => d.text), ["@Post()", "@UseGuards(G)"]);
  });

  it("sobrecarga resolve para a implementação, sem ambiguidade", () => {
    const found = findSymbol(file(source), "Cliente.criar");
    assert.equal(found.length, 1);
    assert.equal(found[0]?.node.type, "method_definition");
  });

  it("tsx", () => {
    const [page] = findSymbol(file(`export function Home() { return <div /> }`, "Home.tsx"), "Home");
    assert.equal(page?.kind, "function");
  });
});

describe("impressões digitais (seção 19.6)", () => {
  const base = `class S {
    // comentário
    @Post()
    criar(dto: Dto): Promise<Cliente> {
      const resultado = this.repo.salvar(dto);
      return resultado;
    }
  }`;

  it("reformatar e mudar comentários não altera nada", () => {
    const formatted = `class S { /* outro */ @Post() criar( dto : Dto ) : Promise< Cliente > { const resultado = this.repo.salvar( dto ) ; return resultado } }`;
    const a = fp(base, "S.criar");
    const b = fp(formatted.replace("return resultado }", "return resultado; }"), "S.criar");
    assert.equal(a.signature, b.signature);
    assert.equal(a.body, b.body);
  });

  it("renomear variável local não altera o corpo", () => {
    const renamed = base.replaceAll("resultado", "r");
    assert.equal(fp(base, "S.criar").body, fp(renamed, "S.criar").body);
  });

  it("renomear propriedade acessada altera o corpo", () => {
    assert.notEqual(fp(base, "S.criar").body, fp(base.replace("salvar", "gravar"), "S.criar").body);
  });

  it("adicionar parâmetro altera a assinatura, não o corpo", () => {
    const a = fp(base, "S.criar");
    const b = fp(base.replace("dto: Dto)", "dto: Dto, origem?: string)"), "S.criar");
    assert.notEqual(a.signature, b.signature);
    assert.equal(a.body, b.body);
  });

  it("mudar decorator altera a assinatura", () => {
    assert.notEqual(fp(base, "S.criar").signature, fp(base.replace("@Post()", "@Put()"), "S.criar").signature);
  });

  it("assinatura de classe: membros públicos, sem privados nem construtor", () => {
    const cls = `@Entity() class C {
      constructor(private readonly r: R) {}
      @Column() email: string;
      private interno = 1;
      metodo(): void { x(); }
    }`;
    const sig = fp(cls, "C");
    assert.equal(sig.signatureText, "@Entity()\nclass C\n  @Column() email: string\n  metodo(): void");
    assert.equal(fp(cls.replace("private interno = 1;", "private outro = 2;"), "C").signature, sig.signature);
    assert.equal(fp(cls.replace("r: R", "r: R, s: S"), "C").signature, sig.signature);
    assert.notEqual(fp(cls.replace("email: string", "email?: string"), "C").signature, sig.signature);
    assert.notEqual(fp(cls.replace("x();", "y();"), "C").body, sig.body);
  });

  it("texto legível da assinatura de método", () => {
    assert.equal(fp(base, "S.criar").signatureText, "@Post()\ncriar(dto: Dto): Promise<Cliente>");
  });
});
