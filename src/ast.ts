// AST tipada da Planta (fase 2). Uma árvore por arquivo, sem nomes resolvidos:
// toda referência é um `Ref` com o texto como foi escrito.

export interface Loc {
  file: string;
  line: number;
  column: number;
}

export interface Node {
  loc: Loc;
}

export interface Ref extends Node {
  /** Nome como escrito, possivelmente qualificado: `Vendas.RestPublica.criar`. */
  name: string;
}

export interface Ident extends Node {
  name: string;
}

export type Literal =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "name"; value: string };

export interface Annotation extends Node {
  name: string;
  args: Literal[];
}

export interface Meta {
  /** Texto dos `///`, sem o prefixo, uma linha por comentário. */
  docs?: string;
  annotations: Annotation[];
}

export interface Anchor extends Node {
  raw: string;
}

export type TypeRef =
  | { kind: "map"; key: TypeRef; value: TypeRef; optional: boolean; loc: Loc }
  | { kind: "named"; ref: Ref; list: boolean; optional: boolean; loc: Loc };

export type TraceRef = { kind: "id"; id: string; loc: Loc } | { kind: "ref"; ref: Ref; loc: Loc };

export interface TraceClause extends Node {
  relation: "justifiedBy" | "decidedBy";
  refs: TraceRef[];
}

// ---------------------------------------------------------------------
//  Arquivo
// ---------------------------------------------------------------------

export interface FileAst {
  path: string;
  uses: UseDecl[];
  decls: TopDecl[];
}

export interface UseDecl extends Node {
  target: Ref;
  alias?: Ident;
}

interface Decl extends Node {
  name: Ident;
  meta: Meta;
}

export type TopDecl =
  | SystemDecl
  | LayerDecl
  | ActorDecl
  | ExternalDecl
  | ContextDecl
  | AppDecl
  | RequirementDecl
  | DecisionDecl
  | DeploymentDecl
  | RuleDecl
  | ViewDecl;

export interface SystemDecl extends Decl {
  kind: "system";
  description?: string;
  owner?: string;
  version?: string;
}

export interface LayerDecl extends Decl {
  kind: "layer";
  match: string[];
}

export interface ActorDecl extends Decl {
  kind: "actor";
  description?: string;
}

export interface ExternalDecl extends Decl {
  kind: "external";
  description?: string;
  ops: OpDecl[];
}

export interface RequirementDecl extends Decl {
  kind: "requirement";
  anchor: Anchor;
  title?: string;
}

export interface DecisionDecl extends Decl {
  kind: "decision";
  anchor: Anchor;
  title?: string;
}

// ---------------------------------------------------------------------
//  Contextos
// ---------------------------------------------------------------------

export interface ContextDecl extends Decl {
  kind: "context";
  root?: string;
  members: ContextMember[];
}

export type ContextMember =
  | DataDecl
  | EnumDecl
  | AggregateDecl
  | ComponentDecl
  | ApiDecl
  | ChannelDecl
  | EventDecl
  | HandlerDecl
  | JobDecl
  | ProcessDecl;

export interface FieldDecl extends Decl {
  kind: "field";
  type: TypeRef;
  modifiers: Annotation[];
  anchor?: Anchor;
}

export interface DataDecl extends Decl {
  kind: "entity" | "value" | "dto";
  anchor?: Anchor;
  /** `undefined` quando não há bloco: os campos vêm só da extração. */
  fields?: FieldDecl[];
  trace: TraceClause[];
}

export interface EnumDecl extends Decl {
  kind: "enum";
  anchor?: Anchor;
  values: Ident[];
}

export interface AggregateDecl extends Decl {
  kind: "aggregate";
  root: Ref;
  contains: Ref[];
}

export const COMPONENT_KINDS = [
  "service", "controller", "repository", "gateway", "middleware",
  "guard", "component", "page", "store",
] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

export interface ComponentDecl extends Decl {
  kind: ComponentKind;
  anchor?: Anchor;
  layer?: Ref;
  ops: OpDecl[];
  uses: Ref[];
  calls: Ref[];
  renders: Ref[];
  implements: Ref[];
  trace: TraceClause[];
}

export interface Param extends Node {
  name: Ident;
  type: TypeRef;
}

export interface OpDecl extends Decl {
  kind: "op";
  params: Param[];
  returns?: TypeRef;
  anchor?: Anchor;
  trace: TraceClause[];
}

export interface ApiDecl extends Decl {
  kind: "api";
  protocol: "http" | "graphql" | "grpc" | "websocket";
  base?: string;
  endpoints: EndpointDecl[];
}

export interface EndpointParam extends Node {
  name: Ident;
  type: TypeRef;
  in?: string;
}

export interface EndpointResponse extends Node {
  status: number;
  type?: TypeRef;
}

export interface EndpointDecl extends Node {
  kind: "endpoint";
  /**
   * Nome do endpoint. Quando omitido na planta, é o último segmento do
   * handler (`ClientesController.criar` → `criar`) e `implicitName` é true.
   */
  name: Ident;
  implicitName: boolean;
  meta: Meta;
  /** Método HTTP ou tipo de operação (`query`, `mutation`, `rpc`...). */
  method: string;
  path: string;
  handler: Ref;
  body?: TypeRef;
  params: EndpointParam[];
  responses: EndpointResponse[];
  auth?: { scheme: string; roles: string[]; loc: Loc };
  rateLimit?: string;
  trace: TraceClause[];
}

export interface ChannelDecl extends Decl {
  kind: "channel";
  channelKind: string;
  anchor?: Anchor;
}

export interface EventDecl extends Decl {
  kind: "event";
  via?: Ref;
  anchor?: Anchor;
  fields?: FieldDecl[];
  trace: TraceClause[];
}

/** `on Evento => Alvo`. Não tem nome, logo não é símbolo: é uma relação. */
export interface HandlerDecl extends Node {
  kind: "handler";
  meta: Meta;
  event: Ref;
  target: Ref;
  trace: TraceClause[];
}

export interface JobDecl extends Decl {
  kind: "job";
  cron: string;
  target: Ref;
  trace: TraceClause[];
}

// ---------------------------------------------------------------------
//  Processos
// ---------------------------------------------------------------------

export interface ProcessDecl extends Decl {
  kind: "process";
  body: ProcessStmt[];
}

export type StepTarget =
  | { kind: "op"; ref: Ref }
  | { kind: "emit"; event: Ref }
  | { kind: "manual"; description: string };

interface Stmt extends Node {
  meta: Meta;
}

export type ProcessStmt =
  | (Stmt & { kind: "trace"; trace: TraceClause })
  | (Stmt & { kind: "trigger"; target: Ref })
  | (Stmt & { kind: "actor"; actor: Ref })
  | (Stmt & { kind: "verify"; level: string })
  | (Stmt & { kind: "step"; name: Ident; target: StepTarget })
  | (Stmt & { kind: "emit"; event: Ref })
  | (Stmt & { kind: "if"; condition: string; then: ProcessStmt[]; else?: ProcessStmt[] })
  | (Stmt & { kind: "parallel"; body: ProcessStmt[] })
  | (Stmt & { kind: "foreach"; description: string; body: ProcessStmt[] })
  | (Stmt & { kind: "wait"; event: Ref; timeout?: string })
  | (Stmt & { kind: "fail"; status?: number; message?: string })
  | (Stmt & { kind: "return"; type?: TypeRef });

// ---------------------------------------------------------------------
//  Apps
// ---------------------------------------------------------------------

export interface RouteDecl extends Node {
  meta: Meta;
  path: string;
  target: Ref;
  guard?: Ref;
}

export interface AppDecl extends Decl {
  kind: "app";
  appKind: string;
  framework?: string;
  root?: string;
  contains: Ref[];
  routes: RouteDecl[];
  components: ComponentDecl[];
}

// ---------------------------------------------------------------------
//  Deployment
// ---------------------------------------------------------------------

export interface DeploymentDecl extends Decl {
  kind: "deployment";
  provider?: string;
  region?: string;
  source?: { kind: string; path: string };
  items: DeployItem[];
}

export type DeployItem = GroupDecl | NodeDecl | Connection;

export interface GroupDecl extends Decl {
  kind: "group";
  groupKind: "network" | "zone" | "cluster" | "group" | "region";
  resourceType?: string;
  anchor?: Anchor;
  items: DeployItem[];
}

export interface NodeDecl extends Decl {
  kind: "node";
  resourceType: string;
  runs?: Ref;
  stores: Ref[];
  carries: Ref[];
  replicas?: number;
  anchor?: Anchor;
  props: { name: string; value: Literal; loc: Loc }[];
}

export interface Connection extends Node {
  kind: "connection";
  meta: Meta;
  path: Ref[];
  label?: string;
}

// ---------------------------------------------------------------------
//  Regras e views
// ---------------------------------------------------------------------

export type Subject =
  | { kind: "every"; elementKind: string; where?: { attribute: string; value: Literal } }
  | { kind: "element"; elementKind: string; ref: Ref };

export type Predicate =
  | { kind: "depend"; on: Subject }
  | { kind: "have"; property: string }
  | { kind: "match"; pattern: string }
  | { kind: "inLayer"; layer: Ref };

export interface RuleStmt extends Node {
  subject: Subject;
  modality: "must" | "mustNot" | "may";
  predicate: Predicate;
  exceptVia?: string;
}

export interface RuleDecl extends Decl {
  kind: "rule";
  severity?: string;
  statements: RuleStmt[];
}

export type ViewSelector =
  | { kind: "all" }
  | { kind: "every"; elementKind: string }
  | { kind: "ref"; ref: Ref; children: boolean };

export interface ViewDecl extends Decl {
  kind: "view";
  viewKind: string;
  of?: Ref;
  style?: string;
  title?: string;
  include: ViewSelector[];
  exclude: ViewSelector[];
  layout?: string;
}
