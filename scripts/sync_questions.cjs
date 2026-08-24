const fs = require('fs');
const path = require('path');

const questionsJsonPath = path.join(__dirname, '..', 'questions.json');
const questionsTsPath = path.join(__dirname, '..', 'src', 'utils', 'data', 'questions.ts');

const questions = JSON.parse(fs.readFileSync(questionsJsonPath, 'utf8'));

const tsContent = `export type Category = "HTML" | "CSS" | "JavaScript" | "Python";
export type QuestionType =
  | "mcq"
  | "truefalse"
  | "code"
  | "drag"
  | "fix";

// ─── Base types ──────────────────────────────────────────────────────────────

export type MCQQuestion = {
  id: number;
  type: "mcq";
  category: Category;
  topic: string;
  question: string;
  options: string[];
  answer: string; // "A" | "B" | "C" | "D"
  hint: string;
  points: number;
};

export type TrueFalseQuestion = {
  id: number;
  type: "truefalse";
  category: Category;
  topic: string;
  question: string;
  answer: boolean; // true yoki false
  hint: string;
  points: number;
};

export type CodeQuestion = {
  id: number;
  type: "code";
  category: Category;
  topic: string;
  question: string;
  placeholder: string;
  accepted: string[]; // to'g'ri javoblar ro'yxati
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
  correctOrder: string[]; // to'g'ri tartibdagi tokenlar ro'yxati
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
  accepted: string[]; // to'g'ri javoblar ro'yxati
  hint: string;
  points: number;
};

export type Question =
  | MCQQuestion
  | TrueFalseQuestion
  | CodeQuestion
  | DragQuestion
  | FixQuestion;

// ─── Savollar bazasi (Boshlang'ich 120 ta savol + Supabase bilan sinxron) ───────
export const questions: Question[] = ${JSON.stringify(questions, null, 2)} as Question[];

// ─── Helper functions ────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = ["HTML", "CSS", "JavaScript", "Python"];

export function getByCategory(cat: Category): Question[] {
  return questions.filter((q) => q.category === cat);
}

export function getQuestionById(id: number): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function totalPoints(): number {
  return questions.reduce((s, q) => s + q.points, 0);
}
`;

fs.writeFileSync(questionsTsPath, tsContent, 'utf8');
console.log('Successfully wrote 120 questions into src/utils/data/questions.ts');
