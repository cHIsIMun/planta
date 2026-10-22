// Extrator Angular e o projeto de teste Feira (test/fixtures/feira): API
// NestJS, web Angular e worker em Docker, num monorepo.

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { main } from "../src/cli.ts";
import { CodeParser } from "../src/code/index.ts";
import { angular } from "../src/extractors/angular.ts";
import type { Fact } from "../src/facts.ts";

const FIXTURE = new URL("./fixtures/feira", import.meta.url).pathname;

async function extract(files: Record<string, string>, texts: Record<string, string> = {}): Promise<Fact[]> {
  const parser = await CodeParser.create();
  const sources = Object.entries(files).map(([path, text]) => parser.parse(path, text));
  return angular.extract(sources, { use: "angular", root: "" }, Object.entries(texts).map(([path, text]) => ({ path, text })));
}

const of = (facts: Fact[], kind: string) => facts.filter((f) => f.kind === kind).map((f) => f.data);

describe("extrator angular", () => {
  it("rotas: Routes, forRoot, filhas, lazy e guards herdados", async () => {
    const facts = await extract({
      "app.routes.ts": `
        export const routes: Routes = [
          { path: '', component: Home },
          { path: 'conta', canActivate: [logado], children: [
            { path: 'pedidos', component: Pedidos },
            { path: 'dados/:id', loadComponent: () => import('./dados').then((m) => m.Dados), canMatch: [dono()] },
          ] },
          { path: 'admin', loadChildren: () => import('./admin.routes').then((m) => m.ADMIN_ROUTES) },
          { path: 'velha', redirectTo: '' },
          { path: '**', component: NaoEncontrada },
        ];`,
      "admin.routes.ts": `export const ADMIN_ROUTES: Route[] = [{ path: 'usuarios', component: Usuarios, canActivate: [AdminGuard] }];`,
      "legado.module.ts": `@NgModule({ imports: [RouterModule.forChild([{ path: 'legado', component: Legado }])] }) export class LegadoModule {}`,
    });
    const routes = of(facts, "ui.route").map((r) => `${r.path} ${r.component} [${(r.guards as string[]).join(",")}]`).sort();
    assert.deepEqual(routes, [
      "/ Home []",
      "/* NaoEncontrada []",
      "/admin/usuarios Usuarios [AdminGuard]",
      "/conta/dados/:id Dados [logado,dono]",
      "/conta/pedidos Pedidos [logado]",
      "/legado Legado []",
    ]);
  });

  it("HTTP pelo HttpClient injetado, com base em campo, concatenação e base desconhecida", async () => {
    const facts = await extract({
      "api.service.ts": `
        @Injectable({ providedIn: 'root' })
        export class Api {
          private readonly base = '/api/v1';
          private http = inject(HttpClient);
          listar() { return this.http.get<X[]>(\`\${this.base}/itens\`); }
          criar(x: X) { return this.http.post(this.base + '/itens', x); }
          apagar(id: string) { return this.http.delete(\`\${environment.api}/itens/\${id}\`); }
          generico() { return this.http.request('PATCH', '/api/v1/itens'); }
          externo() { return this.http.get('https://viacep.com.br/ws/01001000/json'); }
        }`,
      "outro.ts": `export class NaoInjetado { constructor(private http: Algo) {} f() { return this.http.get('/x'); } }`,
    });
    assert.deepEqual(of(facts, "http.client").map((h) => `${h.method} ${h.path} ${h.in}`).sort(), [
      "DELETE /itens/:id Api.apagar",
      "GET /api/v1/itens Api.listar",
      "PATCH /api/v1/itens Api.generico",
      "POST /api/v1/itens Api.criar",
    ]);
  });

  it("componentes: render pelo seletor (inline e templateUrl) e chamadas a métodos de serviços", async () => {
    const facts = await extract({
      "pages/lista.component.ts": `
        @Component({ selector: 'app-lista', templateUrl: './lista.component.html' })
        export class ListaComponent {
          constructor(private readonly api: Api) {}
          itens = this.api.listar();
          novo() { this.api.criar({}); }
        }`,
      "components/item.component.ts": `@Component({ selector: 'app-item', template: '<li><app-selo /></li>' }) export class ItemComponent {}`,
      "components/selo.component.ts": `@Component({ selector: 'app-selo, [appSelo]', template: '' }) export class SeloComponent {}`,
      "api.service.ts": `@Injectable() export class Api { private http = inject(HttpClient); listar() { return this.http.get('/x'); } criar(x: unknown) { return this.http.post('/x', x); } }`,
    }, { "pages/lista.component.html": `<ul>@for (i of itens | async; track i) { <app-item [item]="i" /> }</ul>` });
    assert.deepEqual(of(facts, "ui.component").map((c) => c.name).sort(), ["ItemComponent", "ListaComponent", "SeloComponent"]);
    assert.deepEqual(of(facts, "ui.render").map((r) => `${r.parent}>${r.child}`).sort(), ["ItemComponent>SeloComponent", "ListaComponent>ItemComponent"]);
    const calls = of(facts, "call").filter((c) => c.caller === "ListaComponent").map((c) => c.callee).sort();
    assert.deepEqual(calls, ["Api.criar", "Api.listar"]);
  });

  it("stores do NgRx", async () => {
    const facts = await extract({ "store.ts": `export const CestaStore = signalStore(withState({ itens: [] }));\nexport const cesta = createFeature({ name: 'cesta', reducer });` });
    assert.deepEqual(of(facts, "ui.store").map((s) => s.name).sort(), ["CestaStore", "cesta"]);
  });
});

// ---------------------------------------------------------------------
//  Projeto Feira
// ---------------------------------------------------------------------

function copy(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "planta-feira-")));
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

async function diagnostics(root: string): Promise<{ code: string; message: string }[]> {
  let out = "";
  await main(["check", "--format", "json"], { cwd: root, out: (t) => (out += t), err: (t) => (out += t), env: {} });
  return (JSON.parse(out).diagnostics as { code: string; message: string }[]).filter((d) => d.code !== "PL403");
}

describe("projeto Feira (NestJS + Angular + worker)", () => {
  it("a planta confere com o código", async () => {
    assert.deepEqual(await diagnostics(copy()), []);
  });

  it("o que muda no Angular aparece: rota nova, guard removido, chamada sem endpoint e chamada não declarada", async () => {
    const root = copy();
    edit(root, "apps/web/src/app/app.routes.ts", (t) => t.replace(", canActivate: [autenticado] }", " }").replace("  { path: '**'", "  { path: 'ofertas', component: VitrineComponent },\n  { path: '**'"));
    edit(root, "apps/web/src/app/pages/cesta.component.ts", (t) => t.replace("  fechar() {", "  montar() {\n    this.api.montarCesta([], 'eu@feira.dev').subscribe();\n  }\n\n  fechar() {"));
    edit(root, "apps/web/src/app/services/feira-api.service.ts", (t) => t.replace("  fecharCesta(id: string) {", "  avaliar(id: string) {\n    return this.http.put(`${this.base}/cestas/${id}/avaliacao`, {});\n  }\n\n  fecharCesta(id: string) {"));
    const d = await diagnostics(root);
    const line = (code: string) => d.find((x) => x.code === code)?.message ?? `(sem ${code})`;
    assert.match(line("PL320"), /rota "\/ofertas" \(VitrineComponent\)/);
    assert.match(line("PL321"), /rota "\/cesta": a planta exige o guard `Web.Autenticado`/);
    assert.match(line("PL240"), /PUT \/api\/cestas\/:id\/avaliacao \(em FeiraApi.avaliar\)/);
    assert.match(line("PL241"), /`Web.PaginaCesta` chama `Mercado.Rest.montar`/);
  });

  it("o que muda na API e no compose aparece", async () => {
    const root = copy();
    edit(root, "apps/api/src/cestas/cestas.controller.ts", (t) => t.replace("  @Post(':id/fechar')", "  @Delete(':id')\n  cancelar(@Param('id') id: string) {}\n\n  @Post(':id/fechar')").replace("Body, Controller,", "Body, Controller, Delete,"));
    edit(root, "docker-compose.yml", (t) => t.replace("feira/worker:0.1", "feira/worker:0.2"));
    const codes = (await diagnostics(root)).map((x) => x.code).sort();
    assert.deepEqual(codes, ["PL301", "PL418"]);
  });
});
