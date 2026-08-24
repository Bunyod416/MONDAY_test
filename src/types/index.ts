import type { Category } from "../utils/data/questions";
import type { SessionAnswer } from "../utils/session";

export type ViewType = "exam" | "admin";

export type TabType = "dashboard" | "results" | "groups" | "questions" | "decoder";

export type ExamGroup = {
  id?: number | string;
  group_name: string;
  group_code: string;
  counts: Record<Category, number>;
  duration_minutes: number;
  max_students: number;
  is_active: boolean;
  created_at?: string;
};

export type ExamResult = {
  id: number | string;
  student_name: string;
  score: number;
  total_points: number;
  violation_count: number;
  duration_minutes: number;
  answers: Record<number, SessionAnswer> & { _meta?: { group_code?: string } };
  category_order?: Record<Category, number[]>;
  option_orders?: Record<number, number[]>;
  drag_orders?: Record<number, number[]>;
  start_time?: string;
  submitted_at?: string;
  created_at?: string;
  group_code?: string;
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
