import {
  questions,
  CATEGORIES,
  getByCategory,
  type Question,
  type Category,
} from "./data/questions";

const COOKIE_NAME = "exam_session_v4";
const COOKIE_DAYS = 1;

export type SessionAnswer =
  | { type: "mcq"; selected: number | null }
  | { type: "truefalse"; selected: boolean | null }
  | { type: "code"; value: string }
  | { type: "fix"; value: string }
  | { type: "dragdrop"; order: number[] };

export type ExamSession = {
  studentName: string;
  startTime: number;
  violationCount: number;
  pausedAt: number | null;
  pausedDuration: number;
  // Per-category: shuffled list of question IDs (not array indices)
  categoryOrder: Record<Category, number[]>;
  optionOrders: Record<number, number[]>;
  dragOrders: Record<number, number[]>;
  // answers keyed by question id
  answers: Record<number, SessionAnswer>;
  submitted: boolean;
};

function setCookie(value: string) {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(): string | null {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
}

export function clearSession() {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function loadSession(): ExamSession | null {
  const raw = getCookie();
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Partial<ExamSession>;
    return {
      ...session,
      violationCount: session.violationCount ?? 0,
      pausedAt: session.pausedAt ?? null,
      pausedDuration: session.pausedDuration ?? 0,
    } as ExamSession;
  } catch {
    return null;
  }
}

export function saveSession(session: ExamSession) {
  setCookie(JSON.stringify(session));
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSession(
  studentName: string,
  questionCounts: Record<Category, number>,
): ExamSession {
  const categoryOrder: Record<string, number[]> = {};
  const optionOrders: Record<number, number[]> = {};
  const dragOrders: Record<number, number[]> = {};
  const answers: Record<number, SessionAnswer> = {};

  for (const cat of CATEGORIES) {
    const qs = getByCategory(cat);
    const count = Math.max(
      0,
      Math.min(qs.length, Math.floor(questionCounts[cat] ?? qs.length)),
    );
    categoryOrder[cat] = shuffleArray(qs.map((q) => q.id)).slice(0, count);
  }

  for (const q of questions) {
    if (q.type === "mcq") {
      optionOrders[q.id] = shuffleArray(q.options.map((_, i) => i));
      answers[q.id] = { type: "mcq", selected: null };
    } else if (q.type === "truefalse") {
      answers[q.id] = { type: "truefalse", selected: null };
    } else if (q.type === "code" || q.type === "fix") {
      answers[q.id] = { type: q.type, value: "" };
    } else if (q.type === "drag") {
      const order = q.tokens.map((_, i) => i);
      answers[q.id] = { type: "dragdrop", order };
      dragOrders[q.id] = order;
    }
  }

  return {
    studentName,
    startTime: Date.now(),
    violationCount: 0,
    pausedAt: null,
    pausedDuration: 0,
    categoryOrder: categoryOrder as Record<Category, number[]>,
    optionOrders,
    dragOrders,
    answers,
    submitted: false,
  };
}

export function getQuestionById(id: number): Question {
  return questions.find((q) => q.id === id)!;
}

export function gradeSession(session: ExamSession): {
  totalPoints: number;
  earned: number;
  results: Array<{
    question: Question;
    answer: SessionAnswer;
    correct: boolean;
    points: number;
    earned: number;
  }>;
} {
  let totalPoints = 0;
  let earned = 0;
  const selectedIds = new Set(
    CATEGORIES.flatMap((category) => session.categoryOrder[category] ?? []),
  );

  const results = questions
    .filter((q) => selectedIds.has(q.id))
    .map((q) => {
      const answer = session.answers[q.id];
      totalPoints += q.points;
      let correct = false;

      if (q.type === "mcq" && answer?.type === "mcq") {
        correct = answer.selected === q.answer.charCodeAt(0) - 65;
      } else if (q.type === "truefalse" && answer?.type === "truefalse") {
        correct = answer.selected === q.answer;
      } else if (
        (q.type === "code" || q.type === "fix") &&
        answer?.type === q.type
      ) {
        correct = q.accepted.some(
          (expected) => expected.trim() === answer.value.trim(),
        );
      } else if (q.type === "drag" && answer?.type === "dragdrop") {
        const correctOrder = q.correctOrder.map((token) =>
          q.tokens.indexOf(token),
        );
        correct = JSON.stringify(answer.order) === JSON.stringify(correctOrder);
      }

      const pts = correct ? q.points : 0;
      earned += pts;
      return { question: q, answer, correct, points: q.points, earned: pts };
    });

  return { totalPoints, earned, results };
}
