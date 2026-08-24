import fs from 'fs';
import path from 'path';

const adminRoot = path.resolve(process.cwd(), '../MONDAY_admin');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(relativePath: string, content: string) {
  const fullPath = path.join(adminRoot, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  console.log(`Generated: ${relativePath}`);
}

// 1. types/index.ts
writeFile('src/types/index.ts', `
export type Category = "HTML" | "CSS" | "JavaScript" | "Python";

export type QuestionType = "mcq" | "truefalse" | "code" | "drag" | "fix";

export type MCQQuestion = {
  id: number;
  type: "mcq";
  category: Category;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  hint: string;
  points: number;
};

export type TrueFalseQuestion = {
  id: number;
  type: "truefalse";
  category: Category;
  topic: string;
  question: string;
  answer: boolean;
  hint: string;
  points: number;
};

export type CodeQuestion = {
  id: number;
  type: "code";
  category: Category;
  topic: string;
  question: string;
  placeholder?: string;
  accepted: string[];
  hint: string;
  points: number;
};

export type DragQuestion = {
  id: number;
  type: "drag";
  category: Category;
  topic: string;
  question: string;
  tokens: string[];
  correctOrder: string[];
  hint: string;
  points: number;
};

export type FixQuestion = {
  id: number;
  type: "fix";
  category: Category;
  topic: string;
  question: string;
  brokenCode: string;
  accepted: string[];
  hint: string;
  points: number;
};

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | CodeQuestion
  | DragQuestion
  | FixQuestion;

export type SessionAnswer =
  | { type: "mcq"; selected: number | null }
  | { type: "truefalse"; selected: boolean | null }
  | { type: "code"; value: string }
  | { type: "fix"; value: string }
  | { type: "dragdrop"; order: number[]; touched: boolean };

export type ExamResult = {
  id: number;
  student_name: string;
  score: number;
  total_points: number;
  violation_count: number;
  duration_minutes: number;
  answers: Record<string, SessionAnswer>;
  category_order: Record<Category, number[]>;
  option_orders: Record<string, number[]>;
  drag_orders: Record<string, number[]>;
  group_code?: string;
  start_time: string;
  submitted_at: string;
  created_at: string;
};

export type ExamGroup = {
  id?: number | string;
  group_name: string;
  group_code: string;
  counts: Record<Category, number>;
  duration_minutes: number;
  max_students: number; // min 1, max 30
  is_active: boolean;
  created_at?: string;
};

export type ExamSettings = {
  counts: Record<Category, number>;
  durationMinutes: number;
  maxViolations?: number;
  penaltyPerViolation?: number;
  enforceFullscreen?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
};

export type TabType = "dashboard" | "groups" | "results" | "questions" | "settings";
`);

// 2. utils/diff.ts
writeFile('src/utils/diff.ts', `
export type DiffChunk =
  | { type: "same"; text: string }
  | { type: "added"; text: string }
  | { type: "removed"; text: string };

export function diffChars(actual: string, expected: string): DiffChunk[] {
  if (actual === expected) return [{ type: "same", text: actual }];
  if (!actual) return [{ type: "added", text: expected }];
  if (!expected) return [{ type: "removed", text: actual }];

  const n = actual.length;
  const m = expected.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (actual[i] === expected[j]) dp[i + 1][j + 1] = dp[i][j] + 1;
      else dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const chunks: DiffChunk[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && actual[i - 1] === expected[j - 1]) {
      chunks.unshift({ type: "same", text: actual[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      chunks.unshift({ type: "added", text: expected[j - 1] });
      j--;
    } else {
      chunks.unshift({ type: "removed", text: actual[i - 1] });
      i--;
    }
  }

  const merged: DiffChunk[] = [];
  for (const c of chunks) {
    const last = merged[merged.length - 1];
    if (last && last.type === c.type) last.text += c.text;
    else merged.push({ ...c });
  }
  return merged;
}

export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const cleanA = a.replace(/\\s+/g, "");
  const cleanB = b.replace(/\\s+/g, "");
  if (!cleanA && !cleanB) return 1;
  if (!cleanA || !cleanB) return 0;

  const n = cleanA.length;
  const m = cleanB.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (cleanA[i] === cleanB[j]) dp[i + 1][j + 1] = dp[i][j] + 1;
      else dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return (2 * dp[n][m]) / (n + m);
}
`);

// 3. utils/answerMatch.ts
writeFile('src/utils/answerMatch.ts', `
import { similarity } from "./diff";
import type { Category } from "../types";

export type CodeLang = "html" | "css" | "js" | "python";

export function langForCategory(category: Category): CodeLang {
  if (category === "HTML") return "html";
  if (category === "CSS") return "css";
  if (category === "JavaScript") return "js";
  return "python";
}

export function canonicalize(source: string, lang: CodeLang): string {
  const src = source.replace(/\\r\\n?/g, "\\n").trim();
  if (!src) return "";
  if (lang === "html") return src.replace(/\\s+/g, " ");
  if (lang === "css") return src.replace(/\\s+/g, " ").replace(/\\s*([{}:;,])\\s*/g, "$1");
  return src.replace(/\\s+/g, " ");
}

export type MatchStatus = "correct" | "near" | "wrong";

export type MatchResult = {
  status: MatchStatus;
  similarity: number;
  closest?: string;
};

export function matchWithNearMiss(
  studentAnswer: string,
  accepted: string[],
  lang: CodeLang
): MatchResult {
  const student = studentAnswer.trim();
  if (!student) return { status: "wrong", similarity: 0 };

  if (accepted.some((e) => e.trim() === student)) {
    return { status: "correct", similarity: 1, closest: student };
  }

  const canonStudent = canonicalize(student, lang);
  for (const exp of accepted) {
    if (canonicalize(exp, lang) === canonStudent) {
      return { status: "correct", similarity: 1, closest: exp };
    }
  }

  let bestSim = 0;
  let closest = accepted[0];

  for (const exp of accepted) {
    const sim = similarity(student, exp);
    if (sim > bestSim) {
      bestSim = sim;
      closest = exp;
    }
  }

  if (bestSim >= 0.82) {
    return { status: "near", similarity: bestSim, closest };
  }
  return { status: "wrong", similarity: bestSim, closest };
}
`);

console.log('Types and utils updated with ExamGroup support.');
