import type { Res } from "../common/types/types";

function formatValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function parseInputMsg(msg: string): unknown {
  const s = (msg ?? "").trim();
  if (s === "") return "";
  // number-like string -> number
  if (/^[+-]?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return msg;
}

function extractLastExpression(code: string): string {
  const lines = (code ?? "").split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    let line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("//")) continue;
    // very simple block comment guard
    if (line.startsWith("/*") || line.startsWith("*") || line.startsWith("*/")) continue;
    line = line.replace(/;+\s*$/, "");
    return line;
  }
  return "";
}

class JavaScriptService {
  /**
   * Execute user JS in browser.
   * - Injects `input` and `a` (derived from input.msg).
   * - Captures console.log/info/warn/error.
   * - Outputs `output` or `result` if set; otherwise evaluates last expression line.
   *
   * NOTE: This is NOT a secure sandbox. User code can access global scope.
   */
  async executeJavaScript(code: string, input: Res): Promise<string> {
    const logs: string[] = [];
    const consoleProxy = {
      log: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      info: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      warn: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      error: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
    };

    const a = parseInputMsg(input?.msg ?? "");
    const lastExpr = extractLastExpression(code);

    try {
      // Wrap in an async IIFE so user code can use `await`.
      // We intentionally do NOT isolate globals: this is for local power-user workflows.
      const fn = new Function(
        "__input",
        "__a",
        "__console",
        `return (async () => {
          "use strict";
          const input = __input;
          let a = __a;
          const console = __console;
          let output;
          let result;

          ${code ?? ""}

          let __lastValue;
          try {
            const __expr = ${JSON.stringify(lastExpr)};
            if (__expr) __lastValue = eval(__expr);
          } catch (_) {}

          return { output, result, __lastValue };
        })();`
      ) as (i: Res, a: unknown, c: typeof consoleProxy) => Promise<{
        output?: unknown;
        result?: unknown;
        __lastValue?: unknown;
      }>;

      const { output, result, __lastValue } = await fn(input, a, consoleProxy);
      const finalValue = output ?? result ?? __lastValue;

      const out: string[] = [];
      if (logs.length) out.push(...logs);
      if (finalValue !== undefined) out.push(formatValue(finalValue));
      return out.length ? out.join("\n") : "执行完成，无输出";
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      return `JavaScript执行失败: ${msg}`;
    }
  }
}

export const javascriptService = new JavaScriptService();

