// Cliente LSP mínimo para testes: `planta lsp` de verdade, sobre stdio, com o
// enquadramento `Content-Length` do protocolo.

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;

interface Message {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message: string };
}

export class LspClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = Buffer.alloc(0);
  private nextId = 1;
  private readonly waiting = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  readonly notifications: Message[] = [];
  private listeners: (() => void)[] = [];
  stderr = "";

  constructor(cwd: string) {
    this.child = spawn(join(ROOT, "node_modules/.bin/tsx"), [join(ROOT, "src/cli.ts"), "lsp", "--stdio"], { cwd });
    this.child.stderr.on("data", (d: Buffer) => (this.stderr += d.toString()));
    this.child.stdout.on("data", (d: Buffer) => this.receive(d));
  }

  private receive(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      const header = this.buffer.indexOf("\r\n\r\n");
      if (header < 0) return;
      const length = Number(/Content-Length: (\d+)/i.exec(this.buffer.subarray(0, header).toString())![1]);
      if (this.buffer.length < header + 4 + length) return;
      const msg = JSON.parse(this.buffer.subarray(header + 4, header + 4 + length).toString()) as Message;
      this.buffer = this.buffer.subarray(header + 4 + length);
      if (msg.id !== undefined && msg.method) {
        // Pedido do servidor (registro de capacidade, configuração): responde vazio.
        this.send({ id: msg.id, result: null });
      } else if (msg.id !== undefined) {
        const w = this.waiting.get(msg.id);
        this.waiting.delete(msg.id);
        if (msg.error) w?.reject(new Error(msg.error.message));
        else w?.resolve(msg.result);
      } else {
        this.notifications.push(msg);
        for (const l of this.listeners) l();
      }
    }
  }

  private send(msg: object): void {
    const body = JSON.stringify({ jsonrpc: "2.0", ...msg });
    this.child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  }

  request<T = unknown>(method: string, params: unknown): Promise<T> {
    const id = this.nextId++;
    this.send({ id, method, params });
    return new Promise((resolve, reject) => this.waiting.set(id, { resolve: resolve as (v: unknown) => void, reject }));
  }

  notify(method: string, params: unknown): void {
    this.send({ method, params });
  }

  /** Espera uma notificação que satisfaça `test`, entre as já recebidas e as próximas. */
  waitFor<T>(method: string, test: (params: T) => boolean, timeout = 20000): Promise<T> {
    return new Promise((resolve, reject) => {
      const check = () => {
        const found = this.notifications.find((n) => n.method === method && test(n.params as T));
        if (!found) return false;
        this.listeners = this.listeners.filter((l) => l !== listener);
        clearTimeout(timer);
        resolve(found.params as T);
        return true;
      };
      const listener = () => void check();
      const timer = setTimeout(() => reject(new Error(`sem ${method} em ${timeout}ms\n${this.stderr}`)), timeout);
      if (!check()) this.listeners.push(listener);
    });
  }

  async close(): Promise<void> {
    await this.request("shutdown", null);
    this.notify("exit", null);
    await new Promise((r) => this.child.once("exit", r));
  }
}
