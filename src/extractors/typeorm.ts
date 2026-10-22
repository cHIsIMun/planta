// Extrator TypeORM (seção 10.3): entidades e seus campos, já mapeados para
// tipos Planta (seção 6.8).

import type { Node } from "web-tree-sitter";
import { decoratorCall, describeType, hash, listSymbols, lineOf, stringValue, type SourceFile } from "../code/typescript.ts";
import type { Extractor, Fact, FieldFact } from "../facts.ts";

/** Tipo de coluna do banco → tipo Planta. */
const COLUMN_TYPES: Record<string, string> = {
  uuid: "uuid", text: "text", varchar: "string", char: "string", "character varying": "string",
  int: "int", integer: "int", smallint: "int", bigint: "long", decimal: "decimal", numeric: "decimal",
  float: "float", double: "float", real: "float", boolean: "bool", bool: "bool",
  date: "date", time: "time", timestamp: "datetime", timestamptz: "datetime", datetime: "datetime",
  json: "json", jsonb: "json", "simple-json": "json", bytea: "bytes", blob: "bytes",
};

/** Tipo TypeScript → tipo Planta, quando a coluna não diz nada mais preciso. */
const TS_TYPES: Record<string, string> = {
  string: "string", boolean: "bool", Date: "datetime", Buffer: "bytes",
  // `number` pode ser int, long, decimal ou float: a comparação trata como desconhecido.
  number: "unknown",
};

const RELATIONS: Record<string, boolean> = { OneToMany: true, ManyToMany: true, ManyToOne: false, OneToOne: false };

export const typeorm: Extractor = {
  name: "typeorm",
  extract(files) {
    return files.filter((f) => f.language === "typescript").flatMap(extractFile);
  },
};

function extractFile(file: SourceFile): Fact[] {
  const symbols = listSymbols(file);
  return symbols
    .filter((s) => s.kind === "class" && s.decorators.some((d) => decoratorCall(d)?.name === "Entity"))
    .map((cls): Fact => {
      const entity = cls.decorators.map(decoratorCall).find((c) => c?.name === "Entity");
      const fields = symbols
        .filter((s) => s.kind === "property" && s.name.startsWith(`${cls.name}.`))
        .flatMap((p) => field(p.node, p.decorators, p.name.slice(cls.name.length + 1)));
      const signatureText = fields
        .map((f) => `${f.name}: ${f.type}${f.list ? "[]" : ""}${f.optional ? "?" : ""} ${Object.keys(f.modifiers).sort().join(" ")}`.trim())
        .join("\n");
      return {
        id: `entity:${cls.name}`,
        kind: "entity",
        extractor: "typeorm",
        location: { file: file.path, symbol: cls.name, line: lineOf(cls.node) },
        data: { table: stringValue(entity?.args[0]) ?? cls.name, fields },
        fingerprint: { signature: hash(signatureText), signatureText },
      };
    });
}

function field(node: Node, decorators: Node[], name: string): FieldFact[] {
  const calls = decorators.flatMap((d) => decoratorCall(d) ?? []);
  const column = calls.find((c) => /Column$/.test(c.name) || c.name in RELATIONS);
  if (!column) return [];

  const declared = node.childForFieldName("type")?.namedChildren[0];
  const { base, list: tsList, nullable } = describeType(declared);
  const options = objectArg(column.args);
  const modifiers: Record<string, unknown[]> = {};
  let type = TS_TYPES[base] ?? base;
  let list = tsList;

  if (column.name === "PrimaryGeneratedColumn" || column.name === "PrimaryColumn") {
    modifiers.key = [];
    const strategy = stringValue(column.args[0]);
    if (strategy === "uuid") type = "uuid";
    else if (column.name === "PrimaryGeneratedColumn") type = type === "unknown" ? "int" : type;
  }
  if (column.name === "CreateDateColumn" || column.name === "UpdateDateColumn") type = "datetime";

  // `@Column('decimal', {...})` ou `@Column({ type: 'decimal' })`.
  const dbType = stringValue(column.args[0]) ?? stringValue(options.get("type"));
  if (dbType && COLUMN_TYPES[dbType] && !modifiers.key) type = COLUMN_TYPES[dbType];
  // Uma coluna JSON é um valor só, mesmo quando o tipo TS é um array.
  if (type === "json") list = false;
  // `@Column(() => Endereco)`: objeto de valor embutido.
  const embedded = column.args[0]?.type === "arrow_function" ? column.args[0].childForFieldName("body")?.text : undefined;
  if (embedded) type = embedded;

  if (column.name in RELATIONS) {
    const target = column.args[0]?.type === "arrow_function" ? column.args[0].childForFieldName("body")?.text : undefined;
    if (target) type = target;
    list = RELATIONS[column.name]!;
  }

  if (options.get("unique")?.text === "true") modifiers.unique = [];
  const length = options.get("length")?.text;
  if (length) modifiers.max = [Number(length)];
  const precision = options.get("precision")?.text;
  if (precision) modifiers.precision = [Number(precision), Number(options.get("scale")?.text ?? 0)];
  const optional = nullable || node.children.some((c) => c?.type === "?") || options.get("nullable")?.text === "true";

  return [{ name, type, list, optional, modifiers, line: lineOf(node) }];
}

/** Propriedades do primeiro argumento objeto do decorator. */
function objectArg(args: Node[]): Map<string, Node> {
  const obj = args.find((a) => a.type === "object");
  const props = new Map<string, Node>();
  for (const pair of obj?.namedChildren ?? []) {
    const key = pair?.type === "pair" ? pair.childForFieldName("key")?.text : undefined;
    const value = pair?.childForFieldName("value");
    if (key && value) props.set(key, value);
  }
  return props;
}
