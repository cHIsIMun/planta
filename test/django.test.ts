// Fase 6: extrator Django e resolvedor Python, sobre test/fixtures/django.

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";
import { CodeParser, findSymbol, fingerprint, listSymbols } from "../src/code/index.ts";
import { django } from "../src/extractors/django.ts";
import { complete } from "../src/lsp/completion.ts";
import { Workspace } from "../src/lsp/workspace.ts";

const FIXTURE = new URL("./fixtures/django", import.meta.url).pathname;
const VIEWS = "backend/vendas/views.py";
const MODELS = "backend/vendas/models.py";

function copy(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "planta-django-")));
  cpSync(FIXTURE, root, { recursive: true });
  return root;
}

function edit(root: string, path: string, change: (t: string) => string): void {
  const file = join(root, path);
  const after = change(readFileSync(file, "utf8"));
  assert.notEqual(after, readFileSync(file, "utf8"), `a edição de ${path} não mudou nada`);
  writeFileSync(file, after);
}

async function run(root: string, ...argv: string[]): Promise<{ code: number; out: string }> {
  let out = "";
  const code = await main(argv, { cwd: root, out: (t) => (out += t), err: (t) => (out += t), env: { PLANTA_REVIEWER: "maria@acme.com" } });
  return { code, out };
}

async function codes(root: string): Promise<string[]> {
  const r = await run(root, "check", "--format", "json");
  return (JSON.parse(r.out).diagnostics as { code: string }[]).map((d) => d.code);
}

async function facts() {
  const parser = await CodeParser.create();
  const files = ["loja/settings.py", "loja/urls.py", "vendas/models.py", "vendas/views.py", "vendas/urls.py", "vendas/signals.py", "vendas/tasks.py"]
    .map((p) => parser.parse(p, readFileSync(join(FIXTURE, "backend", p), "utf8")));
  return django.extract(files, { use: "django", root: "" });
}

describe("resolvedor Python", () => {
  it("classes, métodos, atributos de classe e funções", async () => {
    const parser = await CodeParser.create();
    const file = parser.parse(VIEWS, readFileSync(join(FIXTURE, VIEWS), "utf8"));
    const names = listSymbols(file).map((s) => `${s.kind} ${s.name}`);
    assert.deepEqual(names, ["class ClienteViewSet", "property ClienteViewSet.queryset", "method ClienteViewSet.desativar", "function resumo"]);
  });

  it("assinatura ignora corpo e comentários; corpo ignora nomes de variáveis locais", async () => {
    const parser = await CodeParser.create();
    const print = (src: string) => fingerprint(findSymbol(parser.parse("a.py", src), "f")[0]!);
    const base = print("def f(a, b=1):\n    x = a + b\n    return x\n");
    assert.equal(print("def f(a, b=1):\n    # comentário\n    \"\"\"doc\"\"\"\n    y = a + b\n    return y\n").body, base.body);
    assert.equal(print("def f(a, b=1):\n    return a - b\n").signature, base.signature);
    assert.notEqual(print("def f(a, b=1):\n    return a - b\n").body, base.body);
    assert.notEqual(print("def f(a, b=2):\n    x = a + b\n    return x\n").signature, base.signature);
  });
});

describe("extrator django", () => {
  it("rotas: path, include, router do DRF, ações herdadas e @action", async () => {
    const endpoints = (await facts()).filter((f) => f.kind === "http.endpoint").map((f) => `${f.data.method} ${f.data.path} ${f.data.handler}${f.data.inherited ? " (herdada)" : ""}`);
    assert.deepEqual(endpoints.sort(), [
      "DELETE /api/v1/clientes/:pk ClienteViewSet.destroy (herdada)",
      "GET /api/v1/clientes ClienteViewSet.list (herdada)",
      "GET /api/v1/clientes/:pk ClienteViewSet.retrieve (herdada)",
      "GET /api/v1/resumo resumo",
      "PATCH /api/v1/clientes/:pk ClienteViewSet.partial_update (herdada)",
      "POST /api/v1/clientes ClienteViewSet.create (herdada)",
      "POST /api/v1/clientes/:pk/desativar ClienteViewSet.desativar",
      "PUT /api/v1/clientes/:pk ClienteViewSet.update (herdada)",
    ]);
  });

  it("models: campos herdados do abstrato, id implícito, relação reversa e choices", async () => {
    const all = await facts();
    const cliente = all.find((f) => f.id === "entity:Cliente")!;
    const fields = (cliente.data.fields as { name: string; type: string; list: boolean; modifiers: object }[]).map((f) => `${f.name}: ${f.type}${f.list ? "[]" : ""} ${Object.keys(f.modifiers).join(" ")}`.trim());
    assert.deepEqual(fields, ["id: long key", "criado_em: datetime", "email: email unique max", "nome: string max", "pedidos: Pedido[]"]);
    const pedido = all.find((f) => f.id === "entity:Pedido")!;
    const status = (pedido.data.fields as { name: string; type: string }[]).find((f) => f.name === "status")!;
    assert.equal(status.type, "StatusPedido");
    assert.ok(!all.some((f) => f.id === "entity:Registro"), "model abstrato não é entidade");
    assert.deepEqual(all.find((f) => f.id === "enum:StatusPedido")!.data.values, ["ABERTO", "PAGO", "CANCELADO"]);
  });

  it("signals e Celery beat", async () => {
    const all = await facts();
    assert.deepEqual(all.find((f) => f.kind === "event.handler")!.data, { event: "post_save:Cliente", handler: "enviar_boas_vindas" });
    assert.deepEqual(all.find((f) => f.kind === "job")!.data, { cron: "0 3 * * *", handler: "reenviar_pendentes" });
  });
});

describe("check num projeto Django", () => {
  it("planta e código conferem (depois da revisão inicial)", async () => {
    const root = copy();
    assert.deepEqual((await codes(root)).filter((c) => c !== "PL403"), []);
    assert.equal((await run(root, "accept", "--all")).code, 0);
    assert.deepEqual(await codes(root), []);
  });

  it("ação nova no ViewSet sem declaração: PL301", async () => {
    const root = copy();
    edit(root, VIEWS, (t) => t.replace("\n\n@api_view", '\n\n    @action(detail=False, methods=["get"])\n    def inativos(self, request):\n        return Response([])\n\n\n@api_view'));
    const r = await run(root, "check");
    assert.match(r.out, /PL301 backend\/vendas\/views\.py:\d+:1\n {8}cobertura: rota GET \/api\/v1\/clientes\/inativos \(ClienteViewSet\.inativos\)/);
  });

  it("campo renomeado no model: PL410 e PL310; valor novo no choices: PL414", async () => {
    const root = copy();
    edit(root, MODELS, (t) => t.replace("nome = models.CharField", "nome_completo = models.CharField").replace('CANCELADO = "cancelado"', 'CANCELADO = "cancelado"\n    ESTORNADO = "estornado"'));
    const found = await codes(root);
    for (const c of ["PL410", "PL310", "PL414"]) assert.ok(found.includes(c), `${c} em ${found}`);
  });

  it("drift em Python: assinatura (PL401) e corpo (PL402)", async () => {
    const root = copy();
    await run(root, "accept", "--all");
    edit(root, VIEWS, (t) => t.replace("def resumo(request):", "def resumo(request, detalhado=False):"));
    assert.ok((await codes(root)).includes("PL401"));

    const other = copy();
    await run(other, "accept", "--all");
    edit(other, VIEWS, (t) => t.replace('{"pedidos": Pedido.objects.count()}', '{"total": Pedido.objects.count()}'));
    const r = await run(other, "check");
    assert.match(r.out, /ℹ PL402[\s\S]*Vendas\.Relatorios\.resumo/);
  });

  it("ação herdada deixa de existir quando a classe não herda mais do ModelViewSet: PL201", async () => {
    const root = copy();
    edit(root, VIEWS, (t) => t.replace("class ClienteViewSet(viewsets.ModelViewSet):", "class ClienteViewSet(viewsets.ViewSet):"));
    const found = await codes(root);
    assert.ok(found.includes("PL201"), String(found));
  });
});

describe("editor com Python", () => {
  it("completa símbolos de arquivos .py nas âncoras", async () => {
    const root = copy();
    const ws = new Workspace(root, join(root, "planta"));
    const abs = join(root, "planta/vendas.planta");
    const original = readFileSync(abs, "utf8");
    const after = "  component Tarefas {";
    const at = original.indexOf(after) + after.length;
    const text = `${original.slice(0, at)}\n    op novo() @"views.py#${original.slice(at)}`;
    ws.open(abs, text);
    const items = (await complete(ws, abs, text, at + '\n    op novo() @"views.py#'.length)).map((i) => i.label);
    assert.ok(items.includes("ClienteViewSet.desativar") && items.includes("resumo"), String(items));
  });
});
