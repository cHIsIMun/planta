import {
  BaseErrorListener,
  CharStream,
  CommonTokenStream,
  type ATNSimulator,
  type RecognitionException,
  type Recognizer,
  type Token,
} from "antlr4ng";
import { error, type Diagnostic } from "./diagnostics.ts";
import { PlantaLexer } from "./generated/PlantaLexer.js";
import { PlantaParser, type FileContext } from "./generated/PlantaParser.js";

export interface ParseResult {
  tree: FileContext;
  /** Todos os tokens, inclusive comentários do canal oculto, terminando em EOF. */
  tokens: Token[];
  diagnostics: Diagnostic[];
}

class CollectingErrorListener extends BaseErrorListener {
  readonly diagnostics: Diagnostic[] = [];

  constructor(private readonly file: string) {
    super();
  }

  override syntaxError<S extends Token, T extends ATNSimulator>(
    _recognizer: Recognizer<T>,
    _offendingSymbol: S | null,
    line: number,
    column: number,
    message: string,
    _e: RecognitionException | null,
  ): void {
    // ANTLR conta colunas a partir de 0.
    this.diagnostics.push(error("PL100", message, { file: this.file, line, column: column + 1 }));
  }
}

export function parse(text: string, file = "<entrada>"): ParseResult {
  const listener = new CollectingErrorListener(file);

  const lexer = new PlantaLexer(CharStream.fromString(text));
  lexer.removeErrorListeners();
  lexer.addErrorListener(listener);

  const stream = new CommonTokenStream(lexer);
  const parser = new PlantaParser(stream);
  parser.removeErrorListeners();
  parser.addErrorListener(listener);

  const tree = parser.file();
  stream.fill();
  return { tree, tokens: stream.getTokens(), diagnostics: listener.diagnostics };
}
