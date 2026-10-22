// `planta lsp` (seção 18): servidor de linguagem sobre stdio.
//
// A cada tecla, fases 1–7 sobre os documentos abertos; ao salvar (ou quando o
// código muda no disco), a verificação completa. Os diagnósticos publicados
// são a união dos dois.

import { fileURLToPath } from "node:url";
import { basename } from "node:path";
import {
  CodeActionKind, createConnection, type Connection, type Diagnostic as LspDiagnostic, DiagnosticSeverity,
  DidChangeWatchedFilesNotification, type InitializeParams, ProposedFeatures, TextDocuments, TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { Diagnostic } from "../diagnostics.ts";
import { format } from "../format.ts";
import { applySeverity } from "../severity.ts";
import { allViews, extractedFields, renderViews } from "../render/index.ts";
import { codeActions, codeLenses, plantaActions } from "./actions.ts";
import { complete } from "./completion.ts";
import {
  definition, documentSymbols, hover, prepareRename, references, rename, RenameError, SEMANTIC_LEGEND,
  semanticTokens, uri, workspaceSymbols,
} from "./features.ts";
import { findPlantaDir, plantaDirOf, Workspace } from "./workspace.ts";

export interface LspOptions {
  dir?: string;
  version: string;
}

export function serveLsp(options: LspOptions, connection: Connection = createConnection(ProposedFeatures.all)): void {
  const documents = new TextDocuments(TextDocument);
  let root = process.cwd();
  let ws: Workspace | undefined;
  let dir = options.dir;
  let watchFiles = false;

  // Caminhos como o cliente os manda, sem resolver links: os diagnósticos
  // voltam para as mesmas URIs (no macOS, /var é link para /private/var).
  const absOf = (docUri: string) => fileURLToPath(docUri);

  /** O projeto do workspace; sem um, o do primeiro `.planta` aberto. */
  const workspace = (forFile?: string): Workspace | undefined => {
    if (ws) return ws;
    const found = findPlantaDir(root, dir) ?? (forFile?.endsWith(".planta") ? plantaDirOf(forFile) : undefined);
    if (!found) return undefined;
    try {
      ws = new Workspace(root, found);
    } catch (e) {
      connection.window.showErrorMessage(`planta: ${(e as Error).message}`);
      return undefined;
    }
    for (const doc of documents.all()) ws.open(absOf(doc.uri), doc.getText());
    return ws;
  };

  connection.onInitialize((params: InitializeParams) => {
    const folder = params.workspaceFolders?.[0]?.uri ?? params.rootUri;
    if (folder) root = fileURLToPath(folder);
    const init = params.initializationOptions as { dir?: string } | undefined;
    dir = init?.dir ?? dir;
    watchFiles = params.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration === true;
    return {
      capabilities: {
        textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental, save: { includeText: false } },
        completionProvider: { triggerCharacters: ['"', "/", "#", "."] },
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        renameProvider: { prepareProvider: true },
        documentSymbolProvider: true,
        workspaceSymbolProvider: true,
        documentFormattingProvider: true,
        codeActionProvider: { codeActionKinds: [CodeActionKind.QuickFix] },
        codeLensProvider: { resolveProvider: false },
        semanticTokensProvider: { legend: SEMANTIC_LEGEND, full: true },
      },
      serverInfo: { name: "planta", version: options.version },
    };
  });

  connection.onInitialized(() => {
    if (watchFiles) {
      void connection.client.register(DidChangeWatchedFilesNotification.type, {
        watchers: [{ globPattern: "**/*.{planta,ts,tsx,js,jsx,md,yaml,lock}" }],
      });
    }
    if (workspace()) scheduleCheck(0);
  });

  // -------------------------------------------------------------------
  //  Diagnósticos
  // -------------------------------------------------------------------

  let published = new Set<string>();
  let publishTimer: NodeJS.Timeout | undefined;
  let checkTimer: NodeJS.Timeout | undefined;
  let checking: Promise<void> | undefined;
  let pending = false;

  const publish = () => {
    const w = ws;
    if (!w) return;
    const a = w.analyze();
    const all = applySeverity([...a.diagnostics, ...(w.checked?.result.diagnostics ?? [])], w.config, w.root);
    const byUri = new Map<string, LspDiagnostic[]>();
    for (const d of all) {
      const abs = w.abs(d.loc.file);
      const target = uri(abs);
      byUri.set(target, [...(byUri.get(target) ?? []), toLsp(w, d)]);
    }
    for (const old of published) if (!byUri.has(old)) void connection.sendDiagnostics({ uri: old, diagnostics: [] });
    for (const [target, diagnostics] of byUri) void connection.sendDiagnostics({ uri: target, diagnostics });
    published = new Set(byUri.keys());
  };

  const schedulePublish = () => {
    clearTimeout(publishTimer);
    publishTimer = setTimeout(publish, 120);
  };

  const runCheck = async () => {
    const w = workspace();
    if (!w) return;
    do {
      pending = false;
      try {
        await w.check();
      } catch (e) {
        connection.console.error(`planta: verificação falhou: ${(e as Error).stack ?? e}`);
      }
    } while (pending);
    publish();
    void connection.sendNotification("planta/checked", {});
  };

  function scheduleCheck(delay = 300) {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => {
      if (checking) {
        pending = true;
        return;
      }
      checking = runCheck().finally(() => (checking = undefined));
    }, delay);
  }

  documents.onDidChangeContent(({ document }) => {
    const abs = absOf(document.uri);
    const w = workspace(abs);
    if (!w) return;
    w.open(abs, document.getText());
    if (abs.endsWith(".planta")) schedulePublish();
  });

  documents.onDidSave(() => scheduleCheck());

  documents.onDidClose(({ document }) => {
    const abs = absOf(document.uri);
    ws?.close(abs);
    if (abs.endsWith(".planta")) schedulePublish();
  });

  connection.onDidChangeWatchedFiles(({ changes }) => {
    const w = ws;
    if (!w) return;
    for (const c of changes) {
      const name = basename(fileURLToPath(c.uri));
      if (name === "planta.config.yaml" || name === "planta.lock") {
        try {
          w.reloadSettings();
        } catch (e) {
          connection.window.showErrorMessage(`planta: ${(e as Error).message}`);
        }
      }
      if (name.endsWith(".planta")) w.invalidate();
    }
    scheduleCheck();
  });

  // -------------------------------------------------------------------
  //  Recursos
  // -------------------------------------------------------------------

  const withWs = <T>(docUri: string, empty: T, run: (w: Workspace, abs: string) => T): T => {
    const abs = absOf(docUri);
    const w = workspace(abs);
    return w ? run(w, abs) : empty;
  };
  const planta = (docUri: string) => docUri.endsWith(".planta");

  connection.onCompletion(async ({ textDocument, position }) => {
    const doc = documents.get(textDocument.uri);
    if (!doc || !planta(textDocument.uri)) return [];
    return withWs(textDocument.uri, Promise.resolve([]), (w, abs) => complete(w, abs, doc.getText(), doc.offsetAt(position)));
  });

  connection.onHover(({ textDocument, position }) => (planta(textDocument.uri) ? withWs(textDocument.uri, null, (w, abs) => hover(w, abs, position)) : null));

  connection.onDefinition(({ textDocument, position }) =>
    planta(textDocument.uri) ? withWs(textDocument.uri, Promise.resolve([]), (w, abs) => definition(w, abs, position)) : []);

  connection.onReferences(({ textDocument, position, context }) =>
    planta(textDocument.uri) ? withWs(textDocument.uri, [], (w, abs) => references(w, abs, position, context.includeDeclaration)) : []);

  connection.onPrepareRename(({ textDocument, position }) =>
    planta(textDocument.uri) ? withWs(textDocument.uri, null, (w, abs) => prepareRename(w, abs, position)) : null);

  connection.onRenameRequest(({ textDocument, position, newName }) => {
    if (!planta(textDocument.uri)) return null;
    try {
      return withWs(textDocument.uri, null, (w, abs) => rename(w, abs, position, newName));
    } catch (e) {
      if (e instanceof RenameError) throw new Error(e.message);
      throw e;
    }
  });

  connection.onDocumentSymbol(({ textDocument }) => (planta(textDocument.uri) ? withWs(textDocument.uri, [], documentSymbols) : []));

  connection.onWorkspaceSymbol(({ query }) => (ws ? workspaceSymbols(ws, query) : []));

  connection.onDocumentFormatting(({ textDocument }) => {
    const doc = documents.get(textDocument.uri);
    if (!doc || !planta(textDocument.uri)) return [];
    const result = format(doc.getText(), textDocument.uri);
    if (!result.ok || result.text === doc.getText()) return [];
    return [{ range: { start: { line: 0, character: 0 }, end: doc.positionAt(doc.getText().length) }, newText: result.text }];
  });

  connection.onCodeAction(({ textDocument, range, context }) => {
    if (planta(textDocument.uri)) return withWs(textDocument.uri, [], (w, abs) => plantaActions(w, abs, context.diagnostics));
    return withWs(textDocument.uri, Promise.resolve([]), (w, abs) => codeActions(w, abs, range));
  });

  connection.onCodeLens(({ textDocument }) =>
    planta(textDocument.uri) ? [] : withWs(textDocument.uri, Promise.resolve([]), (w, abs) => codeLenses(w, abs)));

  connection.languages.semanticTokens.on(({ textDocument }) => ({
    data: planta(textDocument.uri) ? withWs(textDocument.uri, [], semanticTokens) : [],
  }));

  // Pré-visualização de views (painel lateral do cliente).
  connection.onRequest("planta/views", () => {
    const w = workspace();
    return w ? allViews(w.analyze().model.ir).map((v) => ({ name: v.name, kind: v.kind, title: v.title })) : [];
  });

  connection.onRequest("planta/renderView", ({ name }: { name: string }): { text?: string; error?: string } => {
    const w = workspace();
    if (!w) return { error: "nenhum projeto Planta aberto" };
    const ir = w.checked?.model.ir ?? w.analyze().model.ir;
    const view = allViews(ir).find((v) => v.name === name);
    if (!view) return { error: `view desconhecida: ${name}` };
    const [r] = renderViews([view], ir, extractedFields(ir, w.checked?.result));
    return r?.error ? { error: r.error } : { text: r!.text };
  });

  documents.listen(connection);
  connection.listen();
}

function toLsp(ws: Workspace, d: Diagnostic): LspDiagnostic {
  const line = Math.max(0, d.loc.line - 1);
  const start = Math.max(0, d.loc.column - 1);
  const text = ws.read(ws.abs(d.loc.file))?.split("\n")[line] ?? "";
  // A posição é o início do elemento; o trecho marcado vai até o fim da palavra (ou da linha, no código).
  const word = /^(@?"(?:[^"\\]|\\.)*"|[\w.]+)/.exec(text.slice(start))?.[0];
  const end = d.loc.column === 1 && !d.loc.file.endsWith(".planta") ? text.length : start + (word?.length ?? 1);
  const severity = d.severity === "error" ? DiagnosticSeverity.Error : d.severity === "warning" ? DiagnosticSeverity.Warning : DiagnosticSeverity.Information;
  return {
    range: { start: { line, character: start }, end: { line, character: Math.max(end, start + 1) } },
    severity,
    code: d.code,
    source: "planta",
    message: d.message,
    ...(d.related && {
      relatedInformation: d.related.map((r) => ({
        location: { uri: uri(ws.abs(r.file)), range: { start: { line: r.line - 1, character: r.column - 1 }, end: { line: r.line - 1, character: r.column - 1 } } },
        message: "relacionado",
      })),
    }),
    ...(d.data && { data: d.data }),
  };
}
