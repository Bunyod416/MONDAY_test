import { CATEGORIES, type Category, type Question } from "./data/questions";
import { supabase } from "./supabase";

const CONFIG_KEY = "exam_config_v2";

export type ExamConfig = {
  /** Har bo'limdan nechta savol beriladi */
  counts: Record<Category, number>;
  /** Imtihon davomiyligi (daqiqa) */
  durationMinutes: number;
  /** Qoidabuzarliklar limiti */
  maxViolations: number;
  /** Har bir qoidabuzarlik uchun jarima bali */
  penaltyPerViolation: number;
  /** To'liq ekranni majburlash */
  enforceFullscreen: boolean;
  /** Savollarni aralashtirish */
  shuffleQuestions: boolean;
  /** Variantlarni aralashtirish */
  shuffleOptions: boolean;
};

export const MAX_DURATION_MINUTES = 300;

export function maxCount(
  category: Category,
  questionsList?: Question[],
): number {
  if (questionsList && questionsList.length > 0) {
    const matching = questionsList.filter((q) => q.category === category);
    return matching.length > 0 ? matching.length : 30;
  }
  return 30;
}

export function defaultConfig(questionsList?: Question[]): ExamConfig {
  const counts = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    counts[cat] = maxCount(cat, questionsList);
  }
  return {
    counts,
    durationMinutes: 60,
    maxViolations: 3,
    penaltyPerViolation: 1,
    enforceFullscreen: true,
    shuffleQuestions: true,
    shuffleOptions: true,
  };
}

export function clampConfig(
  raw: Partial<ExamConfig> | null,
  questionsList?: Question[],
): ExamConfig {
  const base = defaultConfig(questionsList);
  if (!raw || typeof raw !== "object") return base;

  const counts = {} as Record<Category, number>;
  let total = 0;
  for (const cat of CATEGORIES) {
    const max = maxCount(cat, questionsList);
    const value = Number(raw.counts?.[cat]);
    const safeCount = Number.isFinite(value)
      ? Math.max(0, Math.min(max, Math.floor(value)))
      : max > 0
        ? max
        : base.counts[cat];
    counts[cat] = safeCount;
    total += safeCount;
  }

  // Agar barcha bo'limlar 0 bo'lib qolsa (eski noto'g'ri storage), bazadagi mavjud barcha savollarni oladi
  if (total === 0) {
    for (const cat of CATEGORIES) {
      counts[cat] = maxCount(cat, questionsList);
    }
  }

  const minutes = Number(raw.durationMinutes);
  return {
    counts,
    durationMinutes: Number.isFinite(minutes)
      ? Math.max(1, Math.min(MAX_DURATION_MINUTES, Math.floor(minutes)))
      : base.durationMinutes,
    maxViolations:
      typeof raw.maxViolations === "number"
        ? Math.max(1, Math.min(10, raw.maxViolations))
        : base.maxViolations,
    penaltyPerViolation:
      typeof raw.penaltyPerViolation === "number"
        ? Math.max(0, Math.min(10, raw.penaltyPerViolation))
        : base.penaltyPerViolation,
    enforceFullscreen:
      raw.enforceFullscreen !== undefined
        ? Boolean(raw.enforceFullscreen)
        : base.enforceFullscreen,
    shuffleQuestions:
      raw.shuffleQuestions !== undefined
        ? Boolean(raw.shuffleQuestions)
        : base.shuffleQuestions,
    shuffleOptions:
      raw.shuffleOptions !== undefined
        ? Boolean(raw.shuffleOptions)
        : base.shuffleOptions,
  };
}

export function loadConfig(questionsList?: Question[]): ExamConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return clampConfig(raw ? JSON.parse(raw) : null, questionsList);
  } catch {
    return defaultConfig(questionsList);
  }
}

export function saveConfig(
  config: ExamConfig,
  questionsList?: Question[],
): ExamConfig {
  const safe = clampConfig(config, questionsList);
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safe));
  } catch {
    /* ignore */
  }
  return safe;
}

export async function fetchRemoteExamSettings(): Promise<Partial<ExamConfig> | null> {
  try {
    const { data, error } = await supabase
      .from("exam_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      counts:
        typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts,
      durationMinutes: Number(data.duration_minutes) || 60,
      maxViolations: Number(data.max_violations) || 3,
      penaltyPerViolation:
        data.penalty_per_violation != null
          ? Number(data.penalty_per_violation)
          : 1,
      enforceFullscreen: data.enforce_fullscreen !== false,
      shuffleQuestions: data.shuffle_questions !== false,
      shuffleOptions: data.shuffle_options !== false,
    };
  } catch {
    return null;
  }
}

export async function saveRemoteExamSettings(config: ExamConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from("exam_settings").upsert({
      id: 1,
      counts: config.counts,
      duration_minutes: config.durationMinutes,
      max_violations: config.maxViolations,
      penalty_per_violation: config.penaltyPerViolation,
      enforce_fullscreen: config.enforceFullscreen,
      shuffle_questions: config.shuffleQuestions,
      shuffle_options: config.shuffleOptions,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export function totalSelectedQuestions(config: ExamConfig): number {
  if (!config || !config.counts) return 0;
  return CATEGORIES.reduce((sum, cat) => sum + (config.counts[cat] || 0), 0);
}
