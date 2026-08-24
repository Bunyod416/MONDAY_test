-- ==============================================================================
-- MONDAY EXAM & ADMIN - YAGONA TO'LIQ (ALL-IN-ONE) MASTER SQL SKRIPTI
-- ==============================================================================

-- 1. Barcha eski test natijalarini tozalash (0 ta qilish)
TRUNCATE TABLE public.results;

-- 2. questions (Savollar) jadvali
CREATE TABLE IF NOT EXISTS public.questions (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  topic TEXT,
  question TEXT NOT NULL,
  options JSONB,
  answer TEXT,
  hint TEXT,
  points INTEGER DEFAULT 1,
  placeholder TEXT,
  accepted JSONB,
  tokens JSONB,
  correct_order JSONB,
  broken_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. exam_groups (Guruhlar) jadvali
CREATE TABLE IF NOT EXISTS public.exam_groups (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  group_code TEXT UNIQUE NOT NULL,
  counts JSONB NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_students INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. results (Natijalar) jadvali
CREATE TABLE IF NOT EXISTS public.results (
  id BIGSERIAL PRIMARY KEY,
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  violation_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  answers JSONB NOT NULL,
  category_order JSONB,
  option_orders JSONB,
  drag_orders JSONB,
  group_code TEXT,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.results ADD COLUMN IF NOT EXISTS group_code TEXT;

-- 5. exam_settings (Imtihon Umumiy Sozlamalari) jadvali
CREATE TABLE IF NOT EXISTS public.exam_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  counts JSONB NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_violations INTEGER DEFAULT 5,
  penalty_per_violation INTEGER DEFAULT 1,
  enforce_fullscreen BOOLEAN DEFAULT true,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Barcha jadvallar uchun RLS (O'qish, Yozish, Yangilash, O'chirish) ruxsatlarini to'liq ochish
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_settings ENABLE ROW LEVEL SECURITY;

-- Questions ruxsatlari
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public modify questions" ON public.questions;
CREATE POLICY "Public modify questions" ON public.questions FOR ALL USING (true);

-- Exam Groups ruxsatlari
DROP POLICY IF EXISTS "Public select exam_groups" ON public.exam_groups;
CREATE POLICY "Public select exam_groups" ON public.exam_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert exam_groups" ON public.exam_groups;
CREATE POLICY "Public insert exam_groups" ON public.exam_groups FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update exam_groups" ON public.exam_groups;
CREATE POLICY "Public update exam_groups" ON public.exam_groups FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete exam_groups" ON public.exam_groups;
CREATE POLICY "Public delete exam_groups" ON public.exam_groups FOR DELETE USING (true);

-- Results ruxsatlari
DROP POLICY IF EXISTS "Public select results" ON public.results;
CREATE POLICY "Public select results" ON public.results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert results" ON public.results;
CREATE POLICY "Public insert results" ON public.results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update results" ON public.results;
CREATE POLICY "Public update results" ON public.results FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete results" ON public.results;
CREATE POLICY "Public delete results" ON public.results FOR DELETE USING (true);

-- Exam Settings ruxsatlari
DROP POLICY IF EXISTS "Public exam_settings" ON public.exam_settings;
CREATE POLICY "Public exam_settings" ON public.exam_settings FOR ALL USING (true);

-- 7. Realtime (Jonli sinxronizatsiya) sozlamalari
ALTER TABLE public.results REPLICA IDENTITY FULL;
ALTER TABLE public.exam_groups REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'exam_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_groups;
  END IF;
END $$;
