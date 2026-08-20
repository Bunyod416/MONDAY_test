import { questions, CATEGORIES, getByCategory, type Question, type Category } from "./data/questions";

const COOKIE_NAME = "exam_session_v3";
const COOKIE_DAYS = 1;

export type SessionAnswer =
  | { type: "mcq"; selected: number | null }
  | { type: "dragdrop"; order: number[] };

export type ExamSession = {
  studentName: string;
  startTime: number;
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
    return JSON.parse(raw) as ExamSession;
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

export function createSession(studentName: string): ExamSession {
  const categoryOrder: Record<string, number[]> = {};
  const optionOrders: Record<number, number[]> = {};
  const answers: Record<number, SessionAnswer> = {};

  for (const cat of CATEGORIES) {
    // Faqat mcq savollarni olish
    const qs = getByCategory(cat).filter((q) => q.type === "mcq");
    categoryOrder[cat] = shuffleArray(qs.map((q) => q.id));
  }

  for (const q of questions) {
    if (q.type === "mcq") {
      optionOrders[q.id] = shuffleArray(q.options.map((_, i) => i));
      answers[q.id] = { type: "mcq", selected: null };
    }
    // Boshqa turdagi savollar (truefalse, code, drag, fix) o'tkazib yuboriladi
  }

  return {
    studentName,
    startTime: Date.now(),
    categoryOrder: categoryOrder as Record<Category, number[]>,
    optionOrders,
    dragOrders: {},
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

  const results = questions.map((q) => {
    const answer = session.answers[q.id];
    totalPoints += q.points;
    let correct = false;

    if (q.type === "mcq" && answer?.type === "mcq") {
      correct = answer.selected === q.answer;
    } else if (q.type === "dragdrop" && answer?.type === "dragdrop") {
      correct = JSON.stringify(answer.order) === JSON.stringify(q.correctOrder);
    }

    const pts = correct ? q.points : 0;
    earned += pts;
    return { question: q, answer, correct, points: q.points, earned: pts };
  });

  return { totalPoints, earned, results };
}
