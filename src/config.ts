// `planta.config.yaml` (seção 4.3). Tudo tem padrão: um projeto sem arquivo
// de configuração funciona, só sem extratores.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Severity } from "./diagnostics.ts";

export interface ExtractorConfig {
  use: string;
  /** Relativo à raiz do projeto. */
  root: string;
  [option: string]: unknown;
}

export type SeverityOrOff = Severity | "off";

export interface Config {
  /** Caminho absoluto da raiz do projeto. */
  projectRoot: string;
  /** Caminho absoluto da pasta `planta/` (onde está este arquivo). */
  plantaDir: string;
  extractors: ExtractorConfig[];
  coverage: {
    /** Tipos de fato que precisam de elemento (PL301). */
    require: string[];
    /** Tipos de fato que geram aviso quando não cobertos (PL302). */
    warn: string[];
    /** Globs, relativos à raiz do projeto, fora da extração. */
    ignore: string[];
  };
  drift: {
    signatureChange: SeverityOrOff;
    bodyChange: SeverityOrOff;
    requirementChange: SeverityOrOff;
  };
  anchors: {
    inferByConvention: boolean;
  };
  /** Severidade por código (seção 11.3), e por caminho nas `overrides`; `off` descarta. */
  diagnostics: {
    codes: Record<string, SeverityOrOff>;
    overrides: { paths: string[]; codes: Record<string, SeverityOrOff> }[];
  };
  /** Módulos de plugin (seção 19.5): caminhos relativos à pasta `planta/` ou pacotes npm. */
  plugins: string[];
  review: {
    forbidAgentAccept: boolean;
    /** E-mails (aceitam `*`) de agentes de IA: não podem fechar o ciclo de revisão. */
    agentIdentities: string[];
  };
}

const SEVERITIES = new Set(["error", "warning", "info", "off"]);

export class ConfigError extends Error {}

/** Lê `<plantaDir>/planta.config.yaml`, se existir. */
export function loadConfig(plantaDir: string): Config {
  const file = join(plantaDir, "planta.config.yaml");
  const raw = existsSync(file) ? parseYaml(readFileSync(file, "utf8")) ?? {} : {};
  if (typeof raw !== "object" || Array.isArray(raw)) throw new ConfigError(`${file}: esperava um objeto`);
  return normalize(raw as Record<string, unknown>, plantaDir, file);
}

export function normalize(raw: Record<string, unknown>, plantaDir: string, file = "planta.config.yaml"): Config {
  const fail = (message: string): never => {
    throw new ConfigError(`${file}: ${message}`);
  };
  const section = (name: string): Record<string, unknown> => {
    const value = raw[name] ?? {};
    return typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : fail(`\`${name}\` deve ser um objeto`);
  };
  const strings = (value: unknown, name: string): string[] =>
    value === undefined ? [] : Array.isArray(value) && value.every((v) => typeof v === "string") ? value : fail(`\`${name}\` deve ser uma lista de textos`);
  const severity = (value: unknown, fallback: SeverityOrOff, name: string): SeverityOrOff =>
    value === undefined ? fallback : SEVERITIES.has(String(value)) ? (value as SeverityOrOff) : fail(`\`${name}\` aceita error, warning, info ou off`);
  const bool = (value: unknown, fallback: boolean, name: string): boolean =>
    value === undefined ? fallback : typeof value === "boolean" ? value : fail(`\`${name}\` deve ser true ou false`);

  const extractors = raw.extractors ?? [];
  if (!Array.isArray(extractors)) fail("`extractors` deve ser uma lista");

  const coverage = section("coverage");
  const drift = section("drift");
  const anchors = section("anchors");
  const review = section("review");
  const diagnostics = section("diagnostics");
  const codes = (obj: Record<string, unknown>, where: string): Record<string, SeverityOrOff> => Object.fromEntries(
    Object.entries(obj).filter(([k]) => /^PL\d{3}$|\//.test(k)).map(([k, v]) => [k, severity(v, "error", `${where}.${k}`)]),
  );
  const overrides = diagnostics.overrides ?? [];
  if (!Array.isArray(overrides)) fail("`diagnostics.overrides` deve ser uma lista");

  return {
    projectRoot: resolve(plantaDir, typeof raw.projectRoot === "string" ? raw.projectRoot : ".."),
    plantaDir: resolve(plantaDir),
    extractors: (extractors as unknown[]).map((e, i) => {
      if (typeof e !== "object" || e === null || typeof (e as { use?: unknown }).use !== "string") {
        return fail(`extractors[${i}] precisa de \`use\``);
      }
      const { root, ...rest } = e as Record<string, unknown>;
      return { ...rest, use: rest.use as string, root: typeof root === "string" ? root.replace(/^\/+|\/+$/g, "") : "" };
    }),
    coverage: {
      require: strings(coverage.require, "coverage.require"),
      warn: strings(coverage.warn, "coverage.warn"),
      ignore: strings(coverage.ignore, "coverage.ignore"),
    },
    drift: {
      signatureChange: severity(drift.signatureChange, "error", "drift.signatureChange"),
      bodyChange: severity(drift.bodyChange, "info", "drift.bodyChange"),
      requirementChange: severity(drift.requirementChange, "warning", "drift.requirementChange"),
    },
    anchors: { inferByConvention: bool(anchors.inferByConvention, true, "anchors.inferByConvention") },
    diagnostics: {
      codes: codes(diagnostics, "diagnostics"),
      overrides: (overrides as Record<string, unknown>[]).map((o, i) => ({
        paths: strings(o.paths, `diagnostics.overrides[${i}].paths`),
        codes: codes(o, `diagnostics.overrides[${i}]`),
      })),
    },
    plugins: strings(raw.plugins, "plugins"),
    review: {
      forbidAgentAccept: bool(review.forbidAgentAccept, true, "review.forbidAgentAccept"),
      agentIdentities: strings(review.agentIdentities, "review.agentIdentities"),
    },
  };
}
