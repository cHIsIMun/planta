// Utilitários de texto compartilhados pela saída do CLI e pelo diff arquitetural.

/**
 * Diff de linhas por maior subsequência comum. Com `context`, mostra só as
 * linhas alteradas e essa quantidade de linhas em volta (requisitos são longos).
 */
export function lineDiff(before: string, after: string, context?: number): string[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const lcs = a.map(() => b.map(() => 0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? (lcs[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(lcs[i + 1]?.[j] ?? 0, lcs[i]![j + 1] ?? 0);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push(`    ${a[i++]}`);
      j++;
    } else if (i < a.length && (j >= b.length || (lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0))) {
      out.push(`  - ${a[i++]}`);
    } else {
      out.push(`  + ${b[j++]}`);
    }
  }
  if (context === undefined) return out;
  const changed = out.map((l, i) => (l.startsWith("  +") || l.startsWith("  -") ? i : -1)).filter((i) => i >= 0);
  const keep = (i: number) => changed.some((c) => Math.abs(c - i) <= context);
  return out.flatMap((l, i) => (keep(i) ? [l] : keep(i - 1) ? ["    …"] : []));
}

