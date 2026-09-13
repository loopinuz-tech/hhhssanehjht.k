-- Vocabulary / Lug'at tizimi uchun jadvallar
-- run: psql -f supabase/migrations/20260612_vocabulary_system.sql

-- 1. ranks_config: ranking tizimi konfiguratsiyasi
CREATE TABLE IF NOT EXISTS public.ranks_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_words integer NOT NULL DEFAULT 0,
  max_words integer NOT NULL DEFAULT 9999,
  created_at timestamptz DEFAULT now()
);

-- Agar ranks_config allaqachon mavjud bo'lsa, icon ustunini qo'shish
ALTER TABLE public.ranks_config ADD COLUMN IF NOT EXISTS icon text DEFAULT '📖';

-- Ranglarni to'ldirish (seed)
INSERT INTO public.ranks_config (name, min_words, max_words, icon) VALUES
  ('Beginner', 0, 9, '🌱'),
  ('Novice', 10, 24, '🌿'),
  ('Apprentice', 25, 49, '📖'),
  ('Intermediate', 50, 99, '📚'),
  ('Advanced', 100, 199, '🎯'),
  ('Expert', 200, 349, '💎'),
  ('Master', 350, 549, '👑'),
  ('Grandmaster', 550, 999, '🏆'),
  ('Legend', 1000, 9999, '🌟')
ON CONFLICT DO NOTHING;

-- 2. vocabulary: so'zlar jadvali
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  meaning text NOT NULL,
  learned boolean DEFAULT false,
  memory_trick text,
  last_reviewed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Avvalgi jadvaldan qolgan ustunlarni qo'shish
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS memory_level integer DEFAULT 0;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS date_added date DEFAULT CURRENT_DATE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_learned ON public.vocabulary(learned);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON public.vocabulary(word);

-- RLS
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks_config ENABLE ROW LEVEL SECURITY;

-- vocabulary RLS policies
CREATE POLICY "vocabulary_select_own" ON public.vocabulary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vocabulary_insert_own" ON public.vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vocabulary_update_own" ON public.vocabulary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "vocabulary_delete_own" ON public.vocabulary
  FOR DELETE USING (auth.uid() = user_id);

-- ranks_config: hamma ko'ra oladi
CREATE POLICY "ranks_config_select_all" ON public.ranks_config
  FOR SELECT USING (true);

-- Leaderboard/cheat-code uchun boshqa foydalanuvchilarning vocabulary ma'lumotlarini ko'rish
CREATE POLICY "vocabulary_select_leaderboard" ON public.vocabulary
  FOR SELECT USING (true);
