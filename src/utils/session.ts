import {
  questions,
  CATEGORIES,
  type Question,
  type Category,
} from "./data/questions";
import type { ExamConfig } from "./config";

// v5: cookie o'rniga localStorage.
// Sabab: to'liq sessiya (75 savol javoblari + variant tartiblari) JSON'da
// ~4.6KB, encodeURIComponent'dan keyin ~8.2KB bo'ladi. Cookie limiti ~4KB —
// brauzer uni jimgina tashlab yuborardi va talabaning javoblari yo'qolardi.
const STORAGE_KEY = "exam_session_v5";
const LEGACY_COOKIE = "exam_session_v4";

export type SessionAnswer =
  | { type: "mcq"; selected: number | null }
  | { type: "truefalse"; selected: boolean | null }
  | { type: "code"; value: string }
  | { type: "fix"; value: string }
  | { type: "dragdrop"; order: number[]; touched: boolean };

export type ExamSession = {
  studentName: string;
  startTime: number;
  durationMinutes: number;
  violationCount: number;
  pausedAt: number | null;
  pausedDuration: number;
  /** Har bo'lim uchun: aralashtirilgan savol ID lari (indeks emas) */
  categoryOrder: Record<Category, number[]>;
  optionOrders: Record<number, number[]>;
  dragOrders: Record<number, number[]>;
  /** savol ID si bo'yicha javoblar */
  answers: Record<number, SessionAnswer>;
  submitted: boolean;
  groupCode?: string;
};

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  // Eski cookie qolib ketmasin
  document.cookie = `${LEGACY_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Saqlangan sessiyani o'qiydi va TO'LIQ tekshiradi.
 * Buzilgan yoki eski formatdagi ma'lumot oq ekranga olib kelmasligi kerak —
 * shuning uchun har bir maydon alohida validatsiya qilinadi.
 */
export function loadSession(questionsList: Question[] = questions): ExamSession | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (typeof parsed.studentName !== "string" || !parsed.studentName) return null;
    if (typeof parsed.startTime !== "number" || !Number.isFinite(parsed.startTime)) return null;
    if (!isRecord(parsed.answers)) return null;
    if (!isRecord(parsed.categoryOrder)) return null;

    const knownIds = questionsList.length > 0 ? new Set(questionsList.map((q) => q.id)) : null;
    const categoryOrder = {} as Record<Category, number[]>;
    for (const cat of CATEGORIES) {
      const ids = parsed.categoryOrder[cat];
      categoryOrder[cat] = Array.isArray(ids)
        ? ids.filter((id): id is number => typeof id === "number" && (!knownIds || knownIds.has(id)))
        : [];
    }

    const answers: Record<number, SessionAnswer> = {};
    for (const [key, value] of Object.entries(parsed.answers)) {
      const id = Number(key);
      if (isNaN(id) || (knownIds && !knownIds.has(id)) || !isRecord(value)) continue;
      answers[id] = value as unknown as SessionAnswer;
    }

    return {
      studentName: parsed.studentName,
      startTime: parsed.startTime,
      durationMinutes:
        typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0
          ? parsed.durationMinutes
          : 60,
      violationCount: typeof parsed.violationCount === "number" ? parsed.violationCount : 0,
      pausedAt: typeof parsed.pausedAt === "number" ? parsed.pausedAt : null,
      pausedDuration: typeof parsed.pausedDuration === "number" ? parsed.pausedDuration : 0,
      categoryOrder,
      optionOrders: isRecord(parsed.optionOrders)
        ? (parsed.optionOrders as Record<number, number[]>)
        : {},
      dragOrders: isRecord(parsed.dragOrders)
        ? (parsed.dragOrders as Record<number, number[]>)
        : {},
      answers,
      submitted: parsed.submitted === true,
      groupCode: typeof parsed.groupCode === "string" ? parsed.groupCode : undefined,
    };
  } catch {
    return null;
  }
}

/** Saqlash muvaffaqiyatli bo'lsa true qaytaradi (kvota to'lishi mumkin). */
export function saveSession(session: ExamSession): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Boshlang'ich tartib tasodifan to'g'ri javob bo'lib qolmasligi uchun. */
function shuffleAwayFrom(indices: number[], forbidden: number[]): number[] {
  if (indices.length < 2) return [...indices];
  const target = JSON.stringify(forbidden);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = shuffleArray(indices);
    if (JSON.stringify(candidate) !== target) return candidate;
  }
  // Deyarli imkonsiz — baribir ikki elementni almashtirib qo'yamiz
  const fallback = [...indices];
  [fallback[0], fallback[1]] = [fallback[1], fallback[0]];
  return fallback;
}

export function createSession(
  studentName: string,
  config: ExamConfig,
  questionsList: Question[] = questions,
  groupCode?: string,
): ExamSession {
  const categoryOrder = {} as Record<Category, number[]>;
  const optionOrders: Record<number, number[]> = {};
  const dragOrders: Record<number, number[]> = {};
  const answers: Record<number, SessionAnswer> = {};

  for (const cat of CATEGORIES) {
    const pool = questionsList.filter((q) => q.category === cat);
    const count = Math.max(0, Math.min(pool.length, Math.floor(config.counts[cat] ?? 0)));
    categoryOrder[cat] = shuffleArray(pool.map((q) => q.id)).slice(0, count);
  }

  // FAQAT tanlangan savollar uchun holat yaratiladi.
  const selectedIds = new Set(CATEGORIES.flatMap((cat) => categoryOrder[cat]));

  for (const q of questionsList) {
    if (!selectedIds.has(q.id)) continue;

    if (q.type === "mcq") {
      optionOrders[q.id] = shuffleArray(q.options.map((_, i) => i));
      answers[q.id] = { type: "mcq", selected: null };
    } else if (q.type === "truefalse") {
      answers[q.id] = { type: "truefalse", selected: null };
    } else if (q.type === "code" || q.type === "fix") {
      answers[q.id] = { type: q.type, value: "" };
    } else if (q.type === "drag") {
      const correct = q.correctOrder.map((token) => q.tokens.indexOf(token));
      const order = shuffleAwayFrom(q.tokens.map((_, i) => i), correct);
      dragOrders[q.id] = order;
      answers[q.id] = { type: "dragdrop", order, touched: false };
    }
  }

  return {
    studentName,
    startTime: Date.now(),
    durationMinutes: config.durationMinutes,
    violationCount: 0,
    pausedAt: null,
    pausedDuration: 0,
    categoryOrder,
    optionOrders,
    dragOrders,
    answers,
    submitted: false,
    groupCode,
  };
}

export function getQuestionById(id: number, questionsList: Question[] = questions): Question | undefined {
  return questionsList.find((q) => q.id === id);
}

/** Savolga javob berilgan deb hisoblanadimi. */
export function isAnswered(answer: SessionAnswer | undefined): boolean {
  if (!answer) return false;
  switch (answer.type) {
    case "mcq":
    case "truefalse":
      return answer.selected !== null;
    case "code":
    case "fix":
      return answer.value.trim().length > 0;
    case "dragdrop":
      // Aralashtirilgan boshlang'ich tartib "javob" emas — talaba
      // hech bo'lmaganda bir marta ko'chirgan bo'lishi kerak.
      return answer.touched === true;
  }
}
