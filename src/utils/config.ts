import { CATEGORIES, type Category, type Question } from "./data/questions";
import { supabase } from "./supabase";

const CONFIG_KEY = "exam_config_v1";

export type ExamConfig = {
  /** Har bo'limdan nechta savol beriladi */
  counts: Record<Category, number>;
  /** Imtihon davomiyligi (daqiqa) */
  durationMinutes: number;
};

export const MAX_DURATION_MINUTES = 300;

export function maxCount(category: Category, questionsList?: Question[]): number {
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
  return { counts, durationMinutes: 60 };
}

export function clampConfig(raw: Partial<ExamConfig> | null, questionsList?: Question[]): ExamConfig {
  const base = defaultConfig(questionsList);
  if (!raw || typeof raw !== "object") return base;

  const counts = {} as Record<Category, number>;
  let total = 0;
  for (const cat of CATEGORIES) {
    const max = maxCount(cat, questionsList);
    const value = Number(raw.counts?.[cat]);
    const safeCount = Number.isFinite(value)
      ? Math.max(0, Math.min(max, Math.floor(value)))
      : (max > 0 ? max : base.counts[cat]);
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

export function saveConfig(config: ExamConfig, questionsList?: Question[]): ExamConfig {
  const safe = clampConfig(config, questionsList);
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safe));
  } catch {
    /* kvota to'lgan bo'lsa ham sozlama joriy sessiyada ishlayveradi */
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
      counts: typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts,
      durationMinutes: Number(data.duration_minutes) || 60,
    };
  } catch {
    return null;
  }
}

export function totalSelectedQuestions(config: ExamConfig): number {
  if (!config || !config.counts) return 0;
  return CATEGORIES.reduce((sum, cat) => sum + (config.counts[cat] || 0), 0);
}
