// Fase 4: atribui o identificador canônico de cada elemento (seção 8.3) e
// detecta duplicatas (PL102), nomes implícitos de endpoint em conflito (PL104)
// e `system` ausente ou repetido (PL120).

import type * as A from "./ast.ts";
import { error, type Diagnostic } from "./diagnostics.ts";
import type { MergedModel } from "./merge.ts";

export type ElementDecl =
  | A.TopDecl
  | Exclude<A.ContextMember, A.HandlerDecl>
  | A.FieldDecl
  | A.OpDecl
  | A.EndpointDecl
  | A.GroupDecl
  | A.NodeDecl
  | StepDecl;

export type StepDecl = Extract<A.ProcessStmt, { kind: "step" }>;

export interface ElementSymbol {
  /** Identificador canônico: `Vendas.RestPublica.criar`. */
  id: string;
  kind: ElementDecl["kind"];
  name: string;
  parent?: string;
  decl: ElementDecl;
}

export interface SymbolTable {
  symbols: Map<string, ElementSymbol>;
  /** IDs dos filhos diretos de cada elemento, na ordem de declaração. */
  children: Map<string, string[]>;
}

export function buildSymbols(model: MergedModel): { table: SymbolTable; diagnostics: Diagnostic[] } {
  const builder = new SymbolBuilder();
  for (const decl of model.decls) builder.topDecl(decl);
  builder.checkSystem(model.decls);
  return { table: builder.table, diagnostics: builder.diagnostics };
}

class SymbolBuilder {
  readonly table: SymbolTable = { symbols: new Map(), children: new Map() };
  readonly diagnostics: Diagnostic[] = [];

  private add(decl: ElementDecl, name: A.Ident, parent?: string): string {
    const id = parent ? `${parent}.${name.name}` : name.name;
    const existing = this.table.symbols.get(id);
    if (existing) {
      this.diagnostics.push(error("PL102", `identificador \`${id}\` declarado mais de uma vez`, name.loc, [existing.decl.name.loc]));
      return id;
    }
    this.table.symbols.set(id, { id, kind: decl.kind, name: name.name, ...(parent && { parent }), decl });
    if (parent) {
      const siblings = this.table.children.get(parent);
      if (siblings) siblings.push(id);
      else this.table.children.set(parent, [id]);
    }
    return id;
  }

  topDecl(decl: A.TopDecl): void {
    const id = this.add(decl, decl.name);
    switch (decl.kind) {
      case "external":
        for (const op of decl.ops) this.add(op, op.name, id);
        break;
      case "context":
        for (const member of decl.members) this.contextMember(member, id);
        break;
      case "app":
        for (const comp of decl.components) this.component(comp, id);
        break;
      case "deployment":
        this.deployItems(decl.items, id);
        break;
    }
  }

  private contextMember(member: A.ContextMember, parent: string): void {
    // `on X => Y` não tem nome: é uma relação, não um elemento.
    if (member.kind === "handler") return;

    switch (member.kind) {
      case "entity":
      case "value":
      case "dto":
      case "event": {
        const id = this.add(member, member.name, parent);
        for (const field of member.fields ?? []) this.add(field, field.name, id);
        return;
      }
      case "api": {
        const id = this.add(member, member.name, parent);
        const seen = new Map<string, A.EndpointDecl>();
        for (const endpoint of member.endpoints) {
          const previous = seen.get(endpoint.name.name);
          if (previous && (previous.implicitName || endpoint.implicitName)) {
            this.diagnostics.push(error(
              "PL104",
              `dois endpoints de \`${id}\` resultam no nome \`${endpoint.name.name}\`; nomeie-os explicitamente`,
              endpoint.loc,
              [previous.loc],
            ));
            continue;
          }
          seen.set(endpoint.name.name, endpoint);
          this.add(endpoint, endpoint.name, id);
        }
        return;
      }
      case "process": {
        const id = this.add(member, member.name, parent);
        this.steps(member.body, id);
        return;
      }
      case "enum":
      case "aggregate":
      case "channel":
      case "job":
        this.add(member, member.name, parent);
        return;
      default:
        this.component(member, parent);
    }
  }

  private component(comp: A.ComponentDecl, parent: string): void {
    const id = this.add(comp, comp.name, parent);
    for (const op of comp.ops) this.add(op, op.name, id);
  }

  /** Passos são filhos do processo, mesmo dentro de `if`, `parallel` e `foreach`. */
  private steps(body: A.ProcessStmt[], process: string): void {
    for (const stmt of body) {
      switch (stmt.kind) {
        case "step":
          this.add(stmt, stmt.name, process);
          break;
        case "if":
          this.steps(stmt.then, process);
          this.steps(stmt.else ?? [], process);
          break;
        case "parallel":
        case "foreach":
          this.steps(stmt.body, process);
          break;
      }
    }
  }

  /**
   * Nós e agrupadores ficam no escopo do deployment, sem o caminho dos grupos:
   * conexões os referenciam pelo nome curto (`lb -> api`), e mover um nó de
   * zona não deve mudar seu ID no lock.
   */
  private deployItems(items: A.DeployItem[], deployment: string): void {
    for (const item of items) {
      if (item.kind === "connection") continue;
      this.add(item, item.name, deployment);
      if (item.kind === "group") this.deployItems(item.items, deployment);
    }
  }

  checkSystem(decls: A.TopDecl[]): void {
    const systems = decls.filter((d) => d.kind === "system");
    if (systems.length === 0) {
      const at = decls[0]?.loc ?? { file: "<modelo>", line: 1, column: 1 };
      this.diagnostics.push(error("PL120", "o modelo não declara `system`", at));
    }
    for (const extra of systems.slice(1)) {
      this.diagnostics.push(error("PL120", "`system` declarado mais de uma vez", extra.loc, [systems[0]!.loc]));
    }
  }
}
