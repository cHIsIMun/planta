// O que os validadores fora do `check.ts` (frontend, IaC) recebem do verificador.

import type { Loc } from "../ast.ts";
import type { ResolvedCode } from "../check.ts";
import type { Config, SeverityOrOff } from "../config.ts";
import type { Fact } from "../facts.ts";
import type { IrElement } from "../ir.ts";
import type { Model } from "../model.ts";

export interface ValidationContext {
  model: Model;
  config: Config;
  elements: Record<string, IrElement>;
  facts: Fact[];
  resolved: Map<string, ResolvedCode>;
  /** Fatos casados com cada elemento (alimenta o IR, a cobertura e a revisão). */
  matches: Map<string, string[]>;
  report(code: string, severity: SeverityOrOff, message: string, loc: Loc, related?: Loc[], data?: Record<string, string>): void;
  codeLoc(file: string, line?: number): Loc;
  link(id: string, fact: Fact): void;
  /** O fato tem dono, ou está fora do que a planta descreve: não é lacuna. */
  cover(factId: string): void;
  /** A lacuna já foi reportada com código próprio (PL320, PL340): a cobertura genérica não repete. */
  reported(factId: string): void;
}
