// Valida a sintaxe Mermaid com o parser oficial, sem navegador.

import { JSDOM } from "jsdom";

let ready: Promise<{ parse(text: string): Promise<unknown> }> | undefined;

async function load() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser, Element: dom.window.Element });
  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({ startOnLoad: false });
  return mermaid;
}

/** Devolve a mensagem de erro do parser, ou `undefined` se o texto é Mermaid válido. */
export async function mermaidError(text: string): Promise<string | undefined> {
  const mermaid = await (ready ??= load());
  try {
    await mermaid.parse(text);
    return undefined;
  } catch (e) {
    return (e as Error).message;
  }
}
