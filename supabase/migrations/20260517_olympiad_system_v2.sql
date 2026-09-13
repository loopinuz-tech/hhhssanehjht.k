
-- ============================================================
-- OLYMPIAD SYSTEM UPDATES
-- ============================================================

-- 1. Add points and question_type to olympiad_questions
ALTER TABLE public.olympiad_questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;
ALTER TABLE public.olympiad_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'test' CHECK (question_type IN ('test', 'written'));

-- 2. Update registration constraints
ALTER TABLE public.olympiad_registrations DROP CONSTRAINT IF EXISTS olympiad_registrations_payment_method_check;
ALTER TABLE public.olympiad_registrations ADD CONSTRAINT olympiad_registrations_payment_method_check 
  CHECK (payment_method IN ('uzs', 'educoin', 'educoins', 'none'));

-- 3. Ensure score column exists in registrations for leaderboard
ALTER TABLE public.olympiad_registrations ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.olympiad_registrations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 4. Storage for Olympiad Images
-- Run this if you need public access to olympiad-images bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('olympiad-images', 'olympiad-images', true);
