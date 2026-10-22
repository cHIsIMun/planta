// Fase 6 de ponta a ponta. Critério do roadmap: um projeto full stack com
// infraestrutura (API NestJS, SPA React e Terraform na AWS, em
// test/fixtures/fullstack) descrito e verificado.

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";
import { CodeParser } from "../src/code/index.ts";
import { react } from "../src/extractors/react.ts";
import { terraform } from "../src/extractors/terraform.ts";
import { typeorm } from "../src/extractors/typeorm.ts";
import { codeLenses } from "../src/lsp/actions.ts";
import { complete } from "../src/lsp/completion.ts";
import { definition } from "../src/lsp/features.ts";
import { Workspace } from "../src/lsp/workspace.ts";
import { compileD2 } from "./support/d2.ts";

const FIXTURE = new URL("./fixtures/fullstack", import.meta.url).pathname;
const APPS = "planta/apps.planta";
const INFRA = "planta/producao.planta";
const MAIN_TF = "infra/terraform/envs/prod/main.tf";

function copy(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "planta-fullstack-")));
  cpSync(FIXTURE, root, { recursive: true });
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

interface Diag { code: string; message: string; loc: { file: string; line: number } }

/** Diagnósticos da verificação, sem PL403 (o fixture não traz lock). */
async function diagnostics(root: string): Promise<Diag[]> {
  const r = await run(root, "check", "--format", "json");
  return (JSON.parse(r.out).diagnostics as Diag[]).filter((d) => d.code !== "PL403");
}

const codes = async (root: string) => (await diagnostics(root)).map((d) => d.code);

async function parsed(files: Record<string, string>) {
  const parser = await CodeParser.create();
  return Object.entries(files).map(([path, text]) => parser.parse(path, text));
}

describe("extrator react", () => {
  it("rotas em objetos, rota de layout como guard e rotas aninhadas", async () => {
    const files = await parsed({
      "router.tsx": `
        const router = createBrowserRouter([
          { path: "/", element: <Home /> },
          { element: <RequireAuth />, children: [
            { path: "/conta", element: <Conta />, children: [{ path: "pedidos", element: <Pedidos /> }] },
          ] },
        ]);`,
      "rotas.tsx": `export function Rotas() { return <Routes><Route path="/admin" element={<RequireAdmin />}><Route path="usuarios" element={<Usuarios />} /></Route></Routes>; }`,
    });
    const routes = react.extract(files, { use: "react", root: "" }).filter((f) => f.kind === "ui.route").map((f) => `${f.data.path} ${f.data.component} [${(f.data.guards as string[]).join(",")}]`);
    assert.deepEqual(routes.sort(), [
      "/ Home []",
      "/admin RequireAdmin []",
      "/admin/usuarios Usuarios []",
      "/conta Conta [RequireAuth]",
      "/conta/pedidos Pedidos [RequireAuth]",
    ]);
  });

  it("HTTP: fetch com método, axios com baseURL e template com parâmetro", async () => {
    const files = await parsed({
      "client.ts": `export const api = axios.create({ baseURL: "/api/v2" });`,
      "uso.ts": `
        export async function a() { await fetch("/api/v1/x", { method: "DELETE" }); }
        export async function b(id: string) { await api.patch(\`/itens/\${id}\`); }
        export async function c() { await fetch("https://externo.com/y"); await mapa.get("/z"); }`,
    });
    const http = react.extract(files, { use: "react", root: "" }).filter((f) => f.kind === "http.client").map((f) => `${f.data.method} ${f.data.path} ${f.data.in}`);
    assert.deepEqual(http.sort(), ["DELETE /api/v1/x a", "PATCH /api/v2/itens/:id b"], "URL externa e .get de outro objeto não contam");
  });
});

describe("extrator typeorm", () => {
  it("coluna JSON é um valor só, mesmo com tipo TS de array", async () => {
    const files = await parsed({
      "cesta.entity.ts": `@Entity() export class Cesta {
        @Column('jsonb') itens: { produtoId: string }[];
        @Column({ type: 'simple-json' }) tags: string[];
        @Column('text', { array: true }) notas: string[];
      }`,
    });
    const entity = typeorm.extract(files, { use: "typeorm", root: "" }).find((f) => f.kind === "entity")!;
    const fields = entity.data.fields as { name: string; type: string; list: boolean }[];
    assert.deepEqual(fields.map((f) => [f.name, f.type, f.list]), [["itens", "json", false], ["tags", "json", false], ["notas", "text", true]]);
  });
});

describe("extrator terraform", () => {
  it("módulo local entra com prefixo; referências e literais", async () => {
    const files = await parsed({
      "envs/prod/main.tf": `module "rede" {\n  source = "../../modules/rede"\n}\nresource "aws_sqs_queue" "q" {\n  name = "fila-\${var.env}"\n  delay_seconds = 5\n}\n`,
      "modules/rede/main.tf": `resource "aws_vpc" "this" {\n  cidr_block = "10.0.0.0/16"\n}\nresource "aws_subnet" "a" {\n  vpc_id = aws_vpc.this.id\n}\n`,
    });
    const facts = terraform.extract(files, { use: "terraform", root: "" });
    const resources = facts.filter((f) => f.kind === "iac.resource").map((f) => f.id);
    assert.deepEqual(resources, [
      "iac.resource:envs/prod:module.rede",
      "iac.resource:envs/prod:module.rede.aws_vpc.this",
      "iac.resource:envs/prod:module.rede.aws_subnet.a",
      "iac.resource:envs/prod:aws_sqs_queue.q",
    ], "o módulo não é raiz própria");
    const q = facts.find((f) => f.id === "iac.resource:envs/prod:aws_sqs_queue.q")!;
    assert.deepEqual(q.data.attributes, { name: '"fila-${var.env}"', delay_seconds: 5 }, "expressão fica como texto");
    assert.deepEqual(q.data.expressions, ["name"], "string com interpolação não é literal");
    assert.ok(facts.some((f) => f.id === "iac.reference:envs/prod:module.rede.aws_subnet.a->module.rede.aws_vpc.this"));
  });
});

describe("projeto full stack", () => {
  it("planta, API, SPA e infraestrutura conferem", async () => {
    const root = copy();
    assert.deepEqual(await diagnostics(root), []);
    assert.equal((await run(root, "accept", "--all")).code, 0);
    const r = await run(root, "check");
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /6 arquivos · \d+ elementos · \d+ fatos\n\n0 erros · 0 avisos/);
  });

  it("deployment com ícones AWS em D2, aceito pelo compilador oficial", async () => {
    const root = copy();
    const r = await run(root, "render", "--format", "d2", "--fast");
    assert.equal(r.code, 0, r.out);
    const d2 = readFileSync(join(root, "planta/.gerado/diagramas/deployment-producao.d2"), "utf8");
    assert.match(d2, /icon: https:\/\/icons\.terrastruct\.com\/aws%2FDatabase%2FAmazon-RDS\.svg/);
    assert.match(d2, /vpc\.publica\.lb -> vpc\.privada\.ecs\.api: "HTTP 3000"/);
    const compiled = await compileD2(d2);
    assert.ok(compiled.shapes.includes("vpc.privada.db") && compiled.connections === 9, JSON.stringify(compiled));
    assert.equal((await run(root, "render", "c4-contexto", "--format", "d2", "--fast")).code, 1, "D2 só cobre deployment");
  });
});

describe("frontend contra o código", () => {
  it("sem extrator que leia o app (Angular, por exemplo), rotas e chamadas não são acusadas", async () => {
    const root = copy();
    edit(root, "planta/planta.config.yaml", (t) => t.replace(/  - use: react\n    root: apps\/web\/src\n/, ""));
    const found = (await codes(root)).filter((c) => ["PL320", "PL321", "PL240", "PL241", "PL242"].includes(c));
    assert.deepEqual(found, []);
  });

  it("PL320: rota registrada no código sem route", async () => {
    const root = copy();
    edit(root, "apps/web/src/App.tsx", (t) => t.replace('<Route path="/cadastro"', '<Route path="/promocoes" element={<Home />} />\n        <Route path="/cadastro"'));
    const d = (await diagnostics(root)).find((x) => x.code === "PL320")!;
    assert.match(d.message, /rota "\/promocoes" \(Home\) registrada no código sem `route` em `Web`/);
    assert.equal(d.loc.file, "apps/web/src/App.tsx");
  });

  it("PL321: o código deixou de proteger a rota que a planta exige protegida", async () => {
    const root = copy();
    edit(root, "apps/web/src/App.tsx", (t) => t.replace(/<RequireAuth>\s*<Checkout \/>\s*<\/RequireAuth>/, "<Checkout />"));
    const d = (await diagnostics(root)).filter((x) => x.code === "PL321");
    assert.equal(d.length, 1);
    assert.match(d[0]!.message, /exige o guard `Web\.Autenticado` \(RequireAuth\), mas o código não o aplica/);
  });

  it("PL321: rota da planta sem rota no código, ou levando a outra página", async () => {
    const root = copy();
    edit(root, APPS, (t) => t.replace('route "/cadastro" => Cadastro', 'route "/cadastro" => Home\n  route "/sobre" => Home'));
    const messages = (await diagnostics(root)).filter((x) => x.code === "PL321").map((x) => x.message);
    assert.ok(messages.some((m) => /rota "\/sobre" de `Web` não está registrada no código/.test(m)), String(messages));
    assert.ok(messages.some((m) => /rota "\/cadastro": a planta leva a `Web\.Home` \(Home\), o código renderiza Cadastro/.test(m)), String(messages));
  });

  it("PL240: o frontend chama um endpoint que a API não declara", async () => {
    const root = copy();
    edit(root, "apps/web/src/api/vendas.ts", (t) => `${t}\nexport async function aplicarCupom(codigo: string) {\n  return api.post(\`/cupons/\${codigo}\`);\n}\n`);
    const d = (await diagnostics(root)).find((x) => x.code === "PL240")!;
    assert.match(d.message, /POST \/api\/v1\/cupons\/:codigo \(em aplicarCupom\) não corresponde a nenhum endpoint declarado/);
  });

  it("PL241/PL242: calls, renders e stores contra o código, inclusive através de hooks", async () => {
    const root = copy();
    edit(root, APPS, (t) => t
      .replace("    renders VitrineProdutos\n    calls Catalogo.RestCatalogo.destaques\n", "    renders VitrineProdutos\n")
      .replace("    renders FormCliente\n", "    renders FormCliente\n    calls Vendas.RestPublica.buscar\n"));
    edit(root, "apps/web/src/pages/Checkout.tsx", (t) => t.replace("      <FormPagamento />\n", ""));
    edit(root, "apps/web/src/pages/DetalheProduto.tsx", (t) => t.replace("  const adicionar = useCarrinho((s) => s.adicionar);", "  const adicionar = useCarrinho((s) => s.adicionar);\n  const sessao = useSessao();").replace("import { useCarrinho }", "import { useSessao } from '../stores/sessao';\nimport { useCarrinho }"));
    const messages = (await diagnostics(root)).map((x) => `${x.code} ${x.message}`);
    for (const expected of [
      /PL241 `Web\.Home` chama `Catalogo\.RestCatalogo\.destaques` no código, mas não declara `calls Catalogo\.RestCatalogo\.destaques`/,
      /PL242 `Web\.Cadastro` declara `calls Vendas\.RestPublica\.buscar`, mas o código não faz essa chamada/,
      /PL242 `Web\.Checkout` declara `renders FormPagamento`, mas o código não renderiza esse componente/,
      /PL241 `Web\.DetalheProduto` usa `Web\.sessao` no código, mas não declara `uses sessao`/,
    ]) assert.ok(messages.some((m) => expected.test(m)), `${expected} em\n${messages.join("\n")}`);
  });

  it("PL230: elemento do app ancorado fora do root dele", async () => {
    const root = copy();
    edit(root, APPS, (t) => t.replace('  store sessao', '  component Bootstrap @"/apps/api/src/main.ts#bootstrap"\n  store sessao'));
    const d = (await diagnostics(root)).find((x) => x.code === "PL230")!;
    assert.match(d.message, /`Web\.Bootstrap` está em `Web`, mas a âncora \(apps\/api\/src\/main\.ts\) fica fora do root apps\/web\/src/);
  });
});

describe("deployment contra o Terraform", () => {
  it("PL201/PL202: endereço inexistente e pasta do IaC errada", async () => {
    const root = copy();
    edit(root, INFRA, (t) => t.replace("tf:aws_sqs_queue.eventos", "tf:aws_sqs_queue.pedidos"));
    assert.match((await diagnostics(root)).find((d) => d.code === "PL201")!.message, /recurso `aws_sqs_queue\.pedidos` não existe no Terraform de infra\/terraform\/envs\/prod/);

    const other = copy();
    edit(other, INFRA, (t) => t.replace('source terraform "/infra/terraform/envs/prod"', 'source terraform "/infra/terraform/envs/producao"'));
    const found = await diagnostics(other);
    assert.deepEqual(found.filter((d) => d.code === "PL202").length, 1, "um aviso por deployment, não por nó");
  });

  it("PL209: o recurso é de outro tipo", async () => {
    const root = copy();
    edit(root, INFRA, (t) => t.replace("tf:aws_lb.api", "tf:aws_s3_bucket.web"));
    assert.match((await diagnostics(root)).find((d) => d.code === "PL209")!.message, /`producao\.lb` é aws\.alb, mas `aws_s3_bucket\.web` é aws_s3_bucket \(esperado: aws_lb ou aws_alb\)/);
  });

  it("PL418: réplicas, propriedade via task definition e engine do banco", async () => {
    const root = copy();
    edit(root, MAIN_TF, (t) => t
      .replace("desired_count   = 3", "desired_count   = 5")
      .replace(/family             = "api"\n  cpu                = 1024\n  memory             = 2048/, 'family             = "api"\n  cpu                = 1024\n  memory             = 4096')
      .replace('engine         = "postgres"', 'engine         = "mysql"'));
    const messages = (await diagnostics(root)).filter((d) => d.code === "PL418").map((d) => d.message);
    for (const expected of [
      /`producao\.api`: replicas é 3 na planta e desired_count = 5 em `aws_ecs_service\.api`/,
      /`producao\.api`: memory é 2048 na planta e memory = 4096 em `aws_ecs_task_definition\.api`/,
      /`producao\.db` é aws\.rds\.postgres, mas `aws_db_instance\.main` tem engine = "mysql"/,
    ]) assert.ok(messages.some((m) => expected.test(m)), `${expected} em ${messages}`);
  });

  it("PL340: recurso descritível fora do deployment; recursos auxiliares não contam", async () => {
    const root = copy();
    writeFileSync(join(root, "infra/terraform/envs/prod/cache.tf"), 'resource "aws_elasticache_cluster" "sessoes" {\n  engine = "redis"\n}\n\nresource "aws_security_group" "cache" {\n  name = "cache"\n}\n');
    const d = (await diagnostics(root)).filter((x) => x.code === "PL340");
    assert.equal(d.length, 1);
    assert.match(d[0]!.message, /aws_elasticache_cluster\.sessoes/);
  });

  it("PL401: infraestrutura alterada depois da revisão", async () => {
    const root = copy();
    await run(root, "accept", "--all");
    edit(root, MAIN_TF, (t) => t.replace('instance_class = "db.r6g.large"', 'instance_class = "db.r6g.xlarge"'));
    const found = await diagnostics(root);
    assert.ok(found.some((d) => d.code === "PL401" && /producao\.db/.test(d.message)), JSON.stringify(found));
    assert.ok(found.some((d) => d.code === "PL418"), "a planta também diverge do IaC");
    const review = await run(root, "review");
    assert.match(review.out, /producao\.db/);
  });

  it("PL150: tipo de recurso fora do catálogo", async () => {
    const root = copy();
    edit(root, INFRA, (t) => t.replace("email: aws.ses", "email: aws.sesv3"));
    const r = await run(root, "check", "--fast");
    assert.match(r.out, /⚠ PL150 planta\/producao\.planta:\d+:\d+\n {8}tipo de recurso `aws\.sesv3` não está no catálogo/);
  });
});

describe("planta suggest para frontend e IaC", () => {
  it("rota e recurso sem descrição: a sugestão colada no lugar certo fecha a lacuna", async () => {
    const root = copy();
    edit(root, "apps/web/src/App.tsx", (t) => t.replace('<Route path="/cadastro"', '<Route path="/promocoes" element={<RequireAuth><Home /></RequireAuth>} />\n        <Route path="/cadastro"'));
    writeFileSync(join(root, "infra/terraform/envs/prod/cache.tf"), 'resource "aws_elasticache_cluster" "sessoes" {\n  engine = "redis"\n}\n');
    const r = await run(root, "suggest", "--uncovered");
    assert.match(r.out, /route "\/promocoes" => Home guard Autenticado/);
    assert.match(r.out, /sessoes: aws\.elasticache\.redis @"tf:aws_elasticache_cluster\.sessoes"/);
    assert.doesNotMatch(r.out, /aws_iam_role|task_definition|"\/checkout"/, "nada além das lacunas");
    edit(root, APPS, (t) => t.replace('  route "/checkout"', '  route "/promocoes" => Home guard Autenticado\n  route "/checkout"'));
    edit(root, INFRA, (t) => t.replace("  email: aws.ses", '  email: aws.ses\n  sessoes: aws.elasticache.redis @"tf:aws_elasticache_cluster.sessoes"'));
    assert.deepEqual(await codes(root), []);
  });
});

describe("critério da fase 6: o que um agente muda aparece", () => {
  it("página nova chamando endpoint inexistente, rota sem route e banco redimensionado no Terraform", async () => {
    const root = copy();
    await run(root, "accept", "--all");
    writeFileSync(join(root, "apps/web/src/pages/Ofertas.tsx"), "export function Ofertas() {\n  fetch('/api/v1/ofertas');\n  return <main />;\n}\n");
    edit(root, "apps/web/src/App.tsx", (t) => t
      .replace("import { Checkout } from './pages/Checkout';", "import { Checkout } from './pages/Checkout';\nimport { Ofertas } from './pages/Ofertas';")
      .replace('<Route path="/cadastro"', '<Route path="/ofertas" element={<Ofertas />} />\n        <Route path="/cadastro"'));
    edit(root, MAIN_TF, (t) => t.replace("desired_count   = 2", "desired_count   = 4"));
    const r = await run(root, "check");
    assert.equal(r.code, 1);
    for (const code of ["PL240", "PL320", "PL401", "PL418"]) assert.match(r.out, new RegExp(code), `${code} em\n${r.out}`);
  });
});

describe("editor com Terraform", () => {
  it("completa endereços tf: do ambiente do deployment, inclusive de módulos", async () => {
    const root = copy();
    const ws = new Workspace(root, join(root, "planta"));
    const abs = join(root, INFRA);
    const original = readFileSync(abs, "utf8");
    const at = original.indexOf("  email: aws.ses") + "  email: aws.ses".length;
    const text = `${original.slice(0, at)}\n  fila2: aws.sqs @"tf:${original.slice(at)}`;
    ws.open(abs, text);
    const items = (await complete(ws, abs, text, at + '\n  fila2: aws.sqs @"tf:'.length)).map((i) => i.label);
    assert.ok(items.includes("aws_sqs_queue.eventos") && items.includes("module.vpc.aws_vpc.this"), String(items));
  });

  it("CodeLens sobre os blocos de recurso descritos na planta", async () => {
    const root = copy();
    const ws = new Workspace(root, join(root, "planta"));
    await ws.check();
    const titles = (await codeLenses(ws, join(root, MAIN_TF))).map((l) => l.command!.title);
    assert.ok(titles.includes("producao.db · aws.rds.postgres · nunca revisado"), String(titles));
    assert.ok(!titles.some((t) => t.includes("tarefas")), "recurso auxiliar sem nó não ganha CodeLens");
  });

  it("ir para definição de uma âncora tf: abre o bloco no .tf", async () => {
    const root = copy();
    const ws = new Workspace(root, join(root, "planta"));
    await ws.check();
    const abs = join(root, INFRA);
    const text = readFileSync(abs, "utf8");
    const i = text.indexOf('@"tf:aws_db_instance.main"') + 3;
    const before = text.slice(0, i).split("\n");
    const [loc] = await definition(ws, abs, { line: before.length - 1, character: before.at(-1)!.length });
    assert.match(loc!.uri, /envs\/prod\/main\.tf$/);
    const tf = readFileSync(join(root, MAIN_TF), "utf8").split("\n");
    assert.equal(tf[loc!.range.start.line], 'resource "aws_db_instance" "main" {');
  });
});
