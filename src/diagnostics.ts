import type { Loc } from "./ast.ts";

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  /** Código estável do catálogo da seção 11.2 (`PL100`, `PL102`...). */
  code: string;
  severity: Severity;
  message: string;
  /** Linha e coluna começam em 1. */
  loc: Loc;
  /** Outras posições envolvidas, como a primeira declaração de um duplicado. */
  related?: Loc[];
  /** Dados para correções automáticas (ações rápidas do LSP): elemento, âncora nova... */
  data?: Record<string, string>;
}

export function error(code: string, message: string, loc: Loc, related?: Loc[]): Diagnostic {
  return related ? { code, severity: "error", message, loc, related } : { code, severity: "error", message, loc };
}

/** Catálogo da seção 11.2: código → descrição curta. */
export const CATALOG: Record<string, string> = {
  PL100: "Erro de sintaxe",
  PL101: "Comentário de documentação sem elemento",
  PL102: "Identificador canônico duplicado",
  PL103: "Modificador ou anotação desconhecido",
  PL104: "Nome implícito de endpoint em conflito",
  PL105: "Contexto declarado em vários arquivos com root divergente",
  PL110: "Referência não resolvida",
  PL111: "Referência para elemento de tipo incompatível",
  PL120: "system ausente ou declarado mais de uma vez",
  PL130: "Regra mal formada",
  PL150: "Tipo de recurso de nuvem desconhecido no catálogo",
  PL201: "Âncora não resolve; símbolo removido",
  PL202: "Arquivo da âncora não existe",
  PL203: "Símbolo movido ou renomeado",
  PL204: "Âncora ambígua",
  PL205: "Elemento planejado ainda sem implementação",
  PL206: "Inferência por convenção encontrou mais de uma candidata",
  PL209: "Âncora aponta para símbolo de tipo incompatível",
  PL210: "Âncora inferida por convenção",
  PL230: "Âncora fora do root do app que declara conter o elemento",
  PL240: "Chamada HTTP no frontend não corresponde a nenhum endpoint declarado",
  PL241: "Chamada, renderização ou store usada no código e não declarada",
  PL242: "calls, renders ou store declarado sem correspondente no código",
  PL301: "Fato obrigatório sem elemento correspondente",
  PL302: "Fato recomendado sem elemento correspondente",
  PL310: "Campo no código não declarado na entidade",
  PL320: "Rota de frontend registrada no código sem route correspondente",
  PL321: "route declarada ausente do código, ou com outro componente ou guard",
  PL332: "Evento declarado nunca é publicado no código",
  PL333: "Evento publicado no código não está declarado",
  PL340: "Recurso de IaC não descrito em nenhum deployment",
  PL401: "Assinatura mudou desde a última revisão",
  PL402: "Corpo mudou desde a última revisão",
  PL403: "Elemento ancorado nunca revisado",
  PL404: "Entrada no lock para elemento que não existe mais",
  PL405: "planta.lock alterado por identidade de agente",
  PL410: "Campo declarado não existe no código",
  PL411: "Tipo de campo divergente",
  PL412: "Modificador divergente",
  PL414: "Valores de enum divergentes",
  PL415: "Método ou rota de endpoint divergente",
  PL416: "Corpo, parâmetros ou respostas de endpoint divergentes",
  PL417: "Parâmetros ou retorno de operação divergentes",
  PL418: "Propriedade de recurso IaC divergente",
  PL420: "Dependência real não declarada em uses",
  PL421: "uses declarado sem dependência real correspondente",
  PL501: "Violação de regra de dependência",
  PL502: "Violação de regra have",
  PL503: "Violação de regra match",
  PL504: "Violação de regra be in layer",
  PL510: "Dependência de elemento deprecated",
  PL601: "Requisito ou decisão referenciado não existe",
  PL602: "ID de requisito duplicado",
  PL610: "Requisito sem nenhum elemento que o justifique",
  PL611: "Texto do requisito mudou desde a última revisão",
  PL612: "Decisão referenciada está substituída",
  PL701: "trigger sem handler para verify calls/order",
  PL702: "Passo não alcançável a partir do handler do gatilho",
  PL703: "Ordem dos passos diverge do código",
  PL704: "Evento do processo não é publicado no caminho de código",
  PL705: "Verificação de processo indeterminada",
};
