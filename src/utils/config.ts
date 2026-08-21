import { CATEGORIES, getByCategory, type Category } from "./data/questions";

const CONFIG_KEY = "exam_config_v1";

export type ExamConfig = {
  /** Har bo'limdan nechta savol beriladi */
  counts: Record<Category, number>;
  /** Imtihon davomiyligi (daqiqa) */
  durationMinutes: number;
};

export const MAX_DURATION_MINUTES = 300;

export function maxCount(category: Category): number {
  return getByCategory(category).length;
}

export function defaultConfig(): ExamConfig {
  const counts = {} as Record<Category, number>;
  for (const cat of CATEGORIES) counts[cat] = maxCount(cat);
  return { counts, durationMinutes: 60 };
}

function clampConfig(raw: Partial<ExamConfig> | null): ExamConfig {
  const base = defaultConfig();
  if (!raw || typeof raw !== "object") return base;

  const counts = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    const value = Number(raw.counts?.[cat]);
    counts[cat] = Number.isFinite(value)
      ? Math.max(0, Math.min(maxCount(cat), Math.floor(value)))
      : base.counts[cat];
  }

  const minutes = Number(raw.durationMinutes);
  return {
    counts,
    durationMinutes: Number.isFinite(minutes)
      ? Math.max(1, Math.min(MAX_DURATION_MINUTES, Math.floor(minutes)))
      : base.durationMinutes,
  };
}

/** Imtihon sozlamalari — faqat admin panelda o'zgartiriladi. */
export function loadConfig(): ExamConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return clampConfig(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(config: ExamConfig): ExamConfig {
  const safe = clampConfig(config);
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safe));
  } catch {
    /* kvota to'lgan bo'lsa ham sozlama joriy sessiyada ishlayveradi */
  }
  return safe;
}

export function totalSelectedQuestions(config: ExamConfig): number {
  return CATEGORIES.reduce((sum, cat) => sum + config.counts[cat], 0);
}
