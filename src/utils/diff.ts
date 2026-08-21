/**
 * Belgi darajasidagi farq (diff) — admin panel talaba javobi bilan to'g'ri
 * javob orasidagi ayni farqni ko'rsatishi uchun.
 *
 * Sabab: o'qituvchi "0/4" ni ko'rib, ikki blok matnni ko'zi bilan taqqoslashga
 * majbur edi. `<img src="/logo.png">` va `<img src="logo.png">` orasidagi
 * bitta `/` ni topish qiyin — endi u ajratib ko'rsatiladi.
 */

export type DiffPart = {
  text: string;
  kind: "same" | "added" | "removed";
};

/**
 * Eng uzun umumiy ketma-ketlik (LCS) asosida farq.
 * Uzun matnlarda sekinlashmasligi uchun avval umumiy bosh va oxir kesiladi.
 */
export function diffChars(expected: string, actual: string): DiffPart[] {
  // Juda uzun javoblar admin panelini muzlatib qo'ymasin
  const LIMIT = 4000;
  if (expected.length > LIMIT || actual.length > LIMIT) {
    return [
      { text: expected, kind: "removed" },
      { text: actual, kind: "added" },
    ];
  }

  let head = 0;
  while (head < expected.length && head < actual.length && expected[head] === actual[head]) {
    head++;
  }

  let tail = 0;
  while (
    tail < expected.length - head &&
    tail < actual.length - head &&
    expected[expected.length - 1 - tail] === actual[actual.length - 1 - tail]
  ) {
    tail++;
  }

  const prefix = expected.slice(0, head);
  const suffix = expected.slice(expected.length - tail);
  const midExpected = expected.slice(head, expected.length - tail);
  const midActual = actual.slice(head, actual.length - tail);

  const parts: DiffPart[] = [];
  if (prefix) parts.push({ text: prefix, kind: "same" });
  parts.push(...lcsDiff(midExpected, midActual));
  if (suffix) parts.push({ text: suffix, kind: "same" });

  return mergeParts(parts);
}

function lcsDiff(a: string, b: string): DiffPart[] {
  if (!a && !b) return [];
  if (!a) return [{ text: b, kind: "added" }];
  if (!b) return [{ text: a, kind: "removed" }];

  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        a[i] === b[j]
          ? table[(i + 1) * cols + j + 1] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      parts.push({ text: a[i], kind: "same" });
      i++;
      j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      parts.push({ text: a[i], kind: "removed" });
      i++;
    } else {
      parts.push({ text: b[j], kind: "added" });
      j++;
    }
  }
  while (i < a.length) parts.push({ text: a[i++], kind: "removed" });
  while (j < b.length) parts.push({ text: b[j++], kind: "added" });

  return parts;
}

function mergeParts(parts: DiffPart[]): DiffPart[] {
  const merged: DiffPart[] = [];
  for (const part of parts) {
    if (!part.text) continue;
    const last = merged[merged.length - 1];
    if (last && last.kind === part.kind) last.text += part.text;
    else merged.push({ ...part });
  }
  return merged;
}

/** 0..1 — ikki matn qanchalik o'xshash (belgilar bo'yicha). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const parts = diffChars(a, b);
  const same = parts
    .filter((p) => p.kind === "same")
    .reduce((sum, p) => sum + p.text.length, 0);

  return (2 * same) / (a.length + b.length);
}
