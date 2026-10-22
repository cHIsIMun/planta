// Fase 8: extratores Spring, FastAPI, Next.js, AWS CDK, Kubernetes e Compose,
// e exportação (Structurizr, OpenAPI, JSON). Um fixture por ecossistema em
// test/fixtures/{spring,fastapi,nextjs,infra}.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Validator } from "@seriousme/openapi-schema-validator";
import { main } from "../src/cli.ts";
import { CodeParser, findSymbol, fingerprint } from "../src/code/index.ts";
import { complete } from "../src/lsp/completion.ts";
import { Workspace } from "../src/lsp/workspace.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const SPRING = "backend/src/main/java/com/loja/vendas";

function copy(name: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `planta-${name}-`)));
  cpSync(join(FIXTURES, name), root, { recursive: true });
  return root;
}

function edit(root: string, path: string, change: (t: string) => string): void {
  const file = join(root, path);
  const before = readFileSync(file, "utf8");
  const after = change(before);
  assert.notEqual(after, before, `a edição de ${path} não mudou nada`);
  writeFileSync(file, after);
}

async function run(root: string, ...argv: string[]): Promise<{ code: number; out: string }> {
  let out = "";
  const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (out += t), env: { PLANTA_REVIEWER: "maria@acme.com" } });
  return { code, out };
}

interface Diag { code: string; message: string; loc: { file: string } }

async function diagnostics(root: string): Promise<Diag[]> {
  const r = await run(root, "check", "--format", "json");
  return (JSON.parse(r.out).diagnostics as Diag[]).filter((d) => d.code !== "PL403");
}

const messages = async (root: string, code: string) => (await diagnostics(root)).filter((d) => d.code === code).map((d) => d.message);

function assertSome(list: string[], pattern: RegExp): void {
  assert.ok(list.some((m) => pattern.test(m)), `${pattern} em\n${list.join("\n")}`);
}

/** O projeto confere com a planta, e depois da revisão inicial não sobra nada. */
async function assertClean(root: string): Promise<void> {
  assert.deepEqual(await diagnostics(root), []);
  assert.equal((await run(root, "accept", "--all")).code, 0);
  const r = await run(root, "check");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0 erros · 0 avisos/);
}


// ---------------------------------------------------------------------

describe("resolvedor Java", () => {
  it("classes, métodos, campos, records e sobrecarga com tipos", async () => {
    const parser = await CodeParser.create();
    const file = parser.parse("ClienteService.java", readFileSync(join(FIXTURES, "spring", SPRING, "ClienteService.java"), "utf8"));
    assert.equal(findSymbol(file, "ClienteService.buscar").length, 2, "sobrecarga sem tipos é ambígua");
    assert.equal(findSymbol(file, "ClienteService.buscar(Long)").length, 1);
    assert.equal(findSymbol(file, "ClienteService.repositorio")[0]!.kind, "property");
    const record = parser.parse("R.java", "public record ClienteCadastrado(Long clienteId) {}");
    assert.deepEqual(findSymbol(record, "ClienteCadastrado.clienteId").map((s) => s.kind), ["property"]);
  });

  it("impressão: corpo ignora comentários e nomes locais; assinatura muda com parâmetro", async () => {
    const parser = await CodeParser.create();
    const print = (body: string, params = "int a") => fingerprint(findSymbol(parser.parse("A.java", `class A { public int f(${params}) { ${body} } }`), "A.f")[0]!);
    const base = print("int x = a + 1; return x;");
    assert.equal(print("// soma\n int y = a + 1; return y;").body, base.body);
    assert.notEqual(print("int x = a + 2; return x;").body, base.body);
    assert.notEqual(print("int x = a + 1; return x;", "int a, int b").signature, base.signature);
  });
});

describe("Spring", () => {
  it("projeto Spring Boot confere com a planta (rotas, JPA, enum, eventos, job, verify order)", async () => {
    await assertClean(copy("spring"));
  });

  it("rota nova (PL301), campo trocado (PL410/PL411) e parâmetro com outro tipo (PL417)", async () => {
    const root = copy("spring");
    edit(root, `${SPRING}/ClienteController.java`, (t) => t
      .replace("    @GetMapping(\"/{id}\")\n    public Cliente buscar(@PathVariable Long id) {", "    @DeleteMapping(\"/{id}\")\n    public void remover(@PathVariable Long id) {\n    }\n\n    @GetMapping(\"/{id}\")\n    public Cliente buscar(@PathVariable String id) {")
      .replace("return servico.buscar(id);", "return servico.buscar(Long.valueOf(id));"));
    edit(root, `${SPRING}/Cliente.java`, (t) => t.replace("private String nome;", "private Integer apelido;"));
    const found = await diagnostics(root);
    const by = (code: string) => found.filter((d) => d.code === code).map((d) => d.message);
    assertSome(found.filter((d) => d.code === "PL301").map((d) => d.message), /DELETE \/api\/clientes\/:id \(ClienteController\.remover\)/);
    assertSome(by("PL410"), /`Vendas\.Cliente\.nome` não existe no código/);
    assertSome(by("PL417"), /`Vendas\.ClienteController\.buscar`: parâmetro id é long na planta e String no código/);
  });

  it("âncora sem tipos para método sobrecarregado: PL204", async () => {
    const root = copy("spring");
    edit(root, "planta/vendas.planta", (t) => t.replace('@"#ClienteService.buscar(Long)"', '@"#ClienteService.buscar"'));
    assertSome(await messages(root, "PL204"), /2 símbolos `ClienteService\.buscar`/);
  });

  it("verify order e eventos com publishEvent", async () => {
    const root = copy("spring");
    edit(root, `${SPRING}/ClienteService.java`, (t) => t.replace("        eventos.publishEvent(new ClienteCadastrado(1L));\n", ""));
    assertSome(await messages(root, "PL704"), /o passo publica `Vendas\.ClienteCadastrado`/);
    assertSome(await messages(root, "PL332"), /`Vendas\.ClienteCadastrado` está declarado, mas nenhum código o publica/);
  });
});

describe("FastAPI", () => {
  it("projeto FastAPI confere com a planta (prefixos de router, Pydantic, Depends)", async () => {
    await assertClean(copy("fastapi"));
  });

  it("rota nova (PL301) e campo do modelo Pydantic divergente (PL410/PL310)", async () => {
    const root = copy("fastapi");
    edit(root, "backend/app/routers/clientes.py", (t) => `${t}\n\n@router.delete("/{cliente_id}", status_code=204)\ndef remover(cliente_id: int):\n    return None\n`);
    edit(root, "backend/app/schemas.py", (t) => t.replace("    criado_em: datetime\n", "    criado: datetime\n"));
    const found = await diagnostics(root);
    assertSome(found.filter((d) => d.code === "PL301").map((d) => d.message), /DELETE \/api\/v1\/clientes\/:cliente_id \(remover\)/);
    assertSome(found.filter((d) => d.code === "PL410").map((d) => d.message), /`Vendas\.Cliente\.criado_em` não existe no código/);
    assertSome(found.filter((d) => d.code === "PL310").map((d) => d.message), /campo `criado` existe em Cliente/);
  });
});

describe("Next.js", () => {
  it("app router, route handlers e pages router conferem com a planta", async () => {
    await assertClean(copy("nextjs"));
  });

  it("página nova sem route (PL320) e route sem página (PL321); pasta privada não é rota", async () => {
    const root = copy("nextjs");
    writeFileSync(join(root, "site/src/app/(loja)/ofertas.tsx"), "export default function X() { return null; }\n");
    cpSync(join(root, "site/src/app/conta"), join(root, "site/src/app/(loja)/ofertas"), { recursive: true });
    rmSync(join(root, "site/src/pages/sobre.tsx"));
    const found = await diagnostics(root);
    assertSome(found.filter((d) => d.code === "PL320").map((d) => d.message), /rota "\/ofertas\/\*" \(Conta\)/);
    assertSome(found.filter((d) => d.code === "PL321").map((d) => d.message), /rota "\/sobre" de `Site` não está registrada no código/);
    assert.ok(!found.some((d) => /NaoERota/.test(d.message)), "app/_privado não vira rota");
  });

  it("route handler novo: PL301", async () => {
    const root = copy("nextjs");
    edit(root, "site/src/app/api/produtos/route.ts", (t) => `${t}\nexport async function DELETE() {\n  return new Response(null, { status: 204 });\n}\n`);
    assertSome((await diagnostics(root)).filter((d) => d.code === "PL301").map((d) => d.message), /rota DELETE \/api\/produtos \(DELETE\)/);
  });
});

describe("infraestrutura: AWS CDK, Kubernetes e Compose", () => {
  it("três deployments conferem com os três IaC", async () => {
    await assertClean(copy("infra"));
  });

  it("CDK: réplicas, propriedade via TaskDefinition, tipo e recurso fora da planta", async () => {
    const root = copy("infra");
    edit(root, "infra/cdk/cdk.out/LojaStack.template.json", (t) => t
      .replace('"DesiredCount": 2', '"DesiredCount": 4')
      .replace('"Cpu": "512"', '"Cpu": "1024"')
      .replace('"FilaE6C7B5A2": {\n      "Type": "AWS::SQS::Queue"', '"FilaE6C7B5A2": {\n      "Type": "AWS::SNS::Topic"')
      .replace('    "CDKMetadata": {', '    "CacheF00": {\n      "Type": "AWS::ElastiCache::CacheCluster",\n      "Metadata": { "aws:cdk:path": "LojaStack/Cache/Resource" }\n    },\n    "CDKMetadata": {'));
    const found = await diagnostics(root);
    const by = (code: string) => found.filter((d) => d.code === code).map((d) => d.message);
    assertSome(by("PL418"), /`aws\.api`: replicas é 2 na planta e DesiredCount = 4 em `LojaStack\/Api\/Service`/);
    assertSome(by("PL418"), /`aws\.api`: cpu é 512 na planta e Cpu = "1024" em `LojaStack\/Api\/TaskDef`/);
    assertSome(by("PL209"), /`aws\.fila` é aws\.sqs, mas `LojaStack\/Fila` é AWS::SNS::Topic/);
    assertSome(by("PL340"), /recurso LojaStack\/Cache \(AWS::ElastiCache::CacheCluster\) não aparece em nenhum deployment/);
    assert.ok(!by("PL340").some((m) => /IAM|Subnet/.test(m)), "auxiliares e recursos dentro de construct descrito não contam");
  });

  it("Kubernetes: imagem divergente, recurso inexistente; revisão congela o manifesto", async () => {
    const root = copy("infra");
    await run(root, "accept", "--all");
    edit(root, "infra/k8s/api.yaml", (t) => t.replace("image: loja/api:1.4", "image: loja/api:1.5").replace("replicas: 3", "replicas: 5"));
    edit(root, "planta/infra.planta", (t) => t.replace('@"k8s:Service/loja/api"', '@"k8s:Service/loja/api-publica"'));
    const found = await diagnostics(root);
    const by = (code: string) => found.filter((d) => d.code === code).map((d) => d.message);
    assertSome(by("PL418"), /`cluster\.api`: image é "loja\/api:1\.4" na planta e image = "loja\/api:1\.5"/);
    assertSome(by("PL418"), /`cluster\.api`: replicas é 3 na planta e replicas = 5/);
    assertSome(by("PL201"), /recurso `Service\/loja\/api-publica` não existe no Kubernetes de infra\/k8s/);
    assertSome(by("PL401"), /`cluster\.api`: assinatura alterada desde a revisão/);
  });

  it("Compose: serviço inexistente; suggest gera nós com o esquema certo", async () => {
    const root = copy("infra");
    edit(root, "docker-compose.yml", (t) => `${t}  redis:\n    image: redis:7\n`);
    edit(root, "planta/infra.planta", (t) => t.replace('@"compose:postgres"', '@"compose:banco"'));
    assertSome(await messages(root, "PL201"), /recurso `banco` não existe no Compose de docker-compose\.yml/);
    const s = await run(root, "suggest", "--uncovered");
    assert.match(s.out, /redis: docker\.container @"compose:redis"/);
  });
});

describe("planta export", () => {
  it("Structurizr DSL: sistema, containers, componentes, relações e deployment", async () => {
    const root = copy("fullstack");
    const dsl = (await run(root, "export", "--format", "structurizr")).out;
    assert.match(dsl, /^workspace "Loja"/);
    assert.match(dsl, /web = container "Web" "spa" "react" \{/);
    assert.match(dsl, /web_formcliente -> vendas_clientescontroller "chama POST \/api\/v1\/clientes"/);
    assert.match(dsl, /deploymentEnvironment "producao" \{[\s\S]*producao_api = deploymentNode "api" "" "aws\.ecs\.service" 3 \{\n\s+containerInstance api/);
    assert.match(dsl, /deployment \* "producao" "deployment-producao" \{/);
    // Chaves balanceadas e todo identificador usado em relação foi declarado.
    assert.equal((dsl.match(/\{/g) ?? []).length, (dsl.match(/\}/g) ?? []).length);
    const declared = new Set([...dsl.matchAll(/^\s*(\w+) = /gm)].map((m) => m[1]));
    for (const [, a, b] of dsl.matchAll(/^\s*(\w+) -> (\w+)/gm)) assert.ok(declared.has(a) && declared.has(b), `${a} -> ${b}`);
  });

  it("Structurizr DSL aceito pelo Structurizr CLI oficial", { skip: !process.env.PLANTA_STRUCTURIZR_CLI && "defina PLANTA_STRUCTURIZR_CLI com o caminho do structurizr.sh" }, async () => {
    for (const name of ["fullstack", "spring", "infra", "nextjs"]) {
      const root = copy(name);
      await run(root, "export", "--format", "structurizr", "--out", "workspace.dsl");
      execFileSync(process.env.PLANTA_STRUCTURIZR_CLI!, ["validate", "-workspace", join(root, "workspace.dsl")], { stdio: "pipe" });
    }
  });

  it("OpenAPI 3.1 válido, com esquemas, parâmetros, corpo e segurança", async () => {
    const validator = new Validator();
    for (const name of ["fullstack", "spring", "fastapi"]) {
      const root = copy(name);
      const doc = JSON.parse((await run(root, "export", "--format", "openapi")).out);
      const result = await validator.validate(doc);
      assert.ok(result.valid, `${name}: ${JSON.stringify(result.errors)}`);
    }
    const doc = JSON.parse((await run(copy("fullstack"), "export", "--format", "openapi")).out);
    const criar = doc.paths["/api/v1/clientes"].post;
    assert.equal(criar.requestBody.content["application/json"].schema.$ref, "#/components/schemas/CriarClienteDto");
    assert.equal(criar.responses["201"].content["application/json"].schema.$ref, "#/components/schemas/Cliente");
    assert.deepEqual(doc.paths["/api/v1/produtos/{slug}"].get.parameters[0], { name: "slug", in: "path", required: true, schema: { type: "string" } });
    assert.deepEqual(doc.components.schemas.Pedido.properties.total, { type: "number" });
    assert.ok(doc.components.schemas.Cliente.required.includes("email"));
  });

  it("JSON é o IR, com o que a verificação acrescenta; --out grava o arquivo", async () => {
    const root = copy("fullstack");
    const r = await run(root, "export", "--format", "json", "--out", "modelo.json");
    assert.match(r.out, /→ modelo\.json/);
    const ir = JSON.parse(readFileSync(join(root, "modelo.json"), "utf8"));
    assert.equal(ir.schema, "planta.model/1");
    assert.equal(ir.elements["Vendas.Cliente"].anchor.resolved.symbolKind, "class");
    assert.equal((await run(root, "export", "--format", "pdf")).code, 2);
  });
});

describe("editor com os ecossistemas novos", () => {
  async function completeAfter(root: string, file: string, after: string, insertion: string) {
    const ws = new Workspace(root, join(root, "planta"));
    const abs = join(root, file);
    const original = readFileSync(abs, "utf8");
    const at = original.indexOf(after) + after.length;
    const text = original.slice(0, at) + insertion + original.slice(at);
    ws.open(abs, text);
    return (await complete(ws, abs, text, at + insertion.length)).map((i) => i.label);
  }

  it("endereços k8s: e cdk: do deployment em volta", async () => {
    const root = copy("infra");
    const k8s = await completeAfter(root, "planta/infra.planta", "  svc -> api", '\n  outro: k8s.cronjob @"k8s:');
    assert.deepEqual(k8s.sort(), ["ConfigMap/loja/config", "CronJob/loja/reenvio", "Deployment/loja/api", "Service/loja/api"]);
    const cdk = await completeAfter(root, "planta/infra.planta", '  fila: aws.sqs @"cdk:LojaStack/Fila"', '\n  outra: aws.sqs @"cdk:');
    assert.ok(cdk.includes("LojaStack/Api/Service") && cdk.includes("LojaStack/Api") && !cdk.includes("Deployment/loja/api"), String(cdk));
  });

  it("símbolos Java, com a forma com tipos das sobrecargas", async () => {
    const root = copy("spring");
    const items = await completeAfter(root, "planta/vendas.planta", "    uses ClienteRepository", '\n    op outro() @"#');
    assert.ok(items.includes("ClienteService.buscar(Long)") && items.includes("ClienteService.buscar(String)"), String(items));
  });
});
