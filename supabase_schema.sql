-- ==============================================================================
-- MONDAY EXAM SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. Create questions table
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

-- 2. Create exam_groups table
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

-- 3. Create results table
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

-- 4. Enable Row Level Security (RLS) & Public Policies for Exam Portal
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read on questions
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

-- Allow anonymous read and write on exam_groups
DROP POLICY IF EXISTS "Public read exam_groups" ON public.exam_groups;
CREATE POLICY "Public read exam_groups" ON public.exam_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert exam_groups" ON public.exam_groups;
CREATE POLICY "Public insert exam_groups" ON public.exam_groups FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update exam_groups" ON public.exam_groups;
CREATE POLICY "Public update exam_groups" ON public.exam_groups FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete exam_groups" ON public.exam_groups;
CREATE POLICY "Public delete exam_groups" ON public.exam_groups FOR DELETE USING (true);

-- Allow anonymous insert and read on results
DROP POLICY IF EXISTS "Public read results" ON public.results;
CREATE POLICY "Public read results" ON public.results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert results" ON public.results;
CREATE POLICY "Public insert results" ON public.results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete results" ON public.results;
CREATE POLICY "Public delete results" ON public.results FOR DELETE USING (true);

-- 5. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_groups;
