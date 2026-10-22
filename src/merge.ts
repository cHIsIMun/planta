// Fase 3: une as ASTs de todos os arquivos. Contextos com o mesmo nome são
// mesclados (seção 6.2); as demais declarações seguem como estão e duplicatas
// ficam para a tabela de símbolos.

import type { ContextDecl, FileAst, TopDecl } from "./ast.ts";
import { error, type Diagnostic } from "./diagnostics.ts";

export interface MergedModel {
  /** Mantidas porque `use` vale só no arquivo onde foi escrito. */
  files: FileAst[];
  decls: TopDecl[];
}

export function merge(files: FileAst[]): { model: MergedModel; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const contexts = new Map<string, ContextDecl>();
  const decls: TopDecl[] = [];

  for (const decl of files.flatMap((f) => f.decls)) {
    if (decl.kind !== "context") {
      decls.push(decl);
      continue;
    }

    const first = contexts.get(decl.name.name);
    if (!first) {
      // Cópia rasa: a mesclagem não pode alterar a AST do arquivo de origem.
      const copy = { ...decl, meta: { ...decl.meta, annotations: [...decl.meta.annotations] }, members: [...decl.members] };
      contexts.set(decl.name.name, copy);
      decls.push(copy);
      continue;
    }

    if (decl.root !== undefined) {
      if (first.root === undefined) first.root = decl.root;
      else if (first.root !== decl.root) {
        diagnostics.push(error(
          "PL105",
          `contexto \`${decl.name.name}\` declarado com root "${decl.root}", mas já tem root "${first.root}"`,
          decl.loc,
          [first.loc],
        ));
      }
    }
    if (decl.meta.docs) {
      first.meta.docs = first.meta.docs ? `${first.meta.docs}\n${decl.meta.docs}` : decl.meta.docs;
    }
    first.meta.annotations.push(...decl.meta.annotations);
    first.members.push(...decl.members);
  }

  return { model: { files, decls }, diagnostics };
}
