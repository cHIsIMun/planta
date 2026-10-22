// Valida D2 com o compilador oficial (WASM): erro de sintaxe ou de referência vira exceção.

import { D2 } from "@terrastruct/d2";

type Worker = { ref(): void; unref(): void };
let d2: D2 | undefined;

export async function compileD2(source: string): Promise<{ shapes: string[]; connections: number }> {
  d2 ??= new D2();
  const internals = d2 as unknown as { ready: Promise<void>; worker?: Worker };
  await internals.ready;
  // O D2.js nunca libera a worker thread: ela segura o processo só enquanto compila.
  // Sem o `unref`, o arquivo de teste só termina no timeout.
  internals.worker!.ref();
  try {
    const r = await d2.compile(source);
    return { shapes: r.diagram.shapes.map((s: { id: string }) => s.id), connections: r.diagram.connections.length };
  } finally {
    internals.worker!.unref();
  }
}
