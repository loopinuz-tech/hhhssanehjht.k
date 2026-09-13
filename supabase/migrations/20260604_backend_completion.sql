-- Backend completion layer for Educontest.
-- This migration is intentionally additive: it fills the tables, views, RPCs,
-- policies, and buckets referenced by the current frontend without deleting data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND COALESCE(p.role, 'user') IN ('admin', 'sub_admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text = 'admin'
  );
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS sat_exam_date DATE,
  ADD COLUMN IF NOT EXISTS educoin_balance INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_reward_date DATE,
  ADD COLUMN IF NOT EXISTS target_score INTEGER DEFAULT 1400,
  ADD COLUMN IF NOT EXISTS target_university TEXT,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_live_chat BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_next_sat_time BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

UPDATE public.profiles
SET display_name = COALESCE(display_name, full_name, split_part(phone, '@', 1))
WHERE display_name IS NULL;

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_number INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  content TEXT,
  text_content TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  part_of_speech TEXT,
  uzbek_translation TEXT,
  definition TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  synonyms JSONB DEFAULT '[]'::jsonb,
  antonyms JSONB DEFAULT '[]'::jsonb,
  memory_trick TEXT,
  memory_level INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT now(),
  correct_streak INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  learned BOOLEAN DEFAULT false,
  last_reviewed TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  correct_solution TEXT,
  tags TEXT[] DEFAULT '{}',
  reason TEXT DEFAULT 'concept',
  image_url TEXT,
  reviewed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  math_correct INTEGER DEFAULT 0,
  math_total INTEGER DEFAULT 0,
  english_correct INTEGER DEFAULT 0,
  english_total INTEGER DEFAULT 0,
  time_spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'easy',
  biggest_mistakes TEXT,
  mistake_reason TEXT DEFAULT 'concept',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.shared_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  task_description TEXT NOT NULL,
  time_start TIME NOT NULL DEFAULT '09:00',
  time_end TIME NOT NULL DEFAULT '10:00',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.daily_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT DEFAULT 'Reading',
  domain TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  sub_category TEXT,
  difficulty TEXT DEFAULT 'medium',
  passage TEXT,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_bank_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.question_bank(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'answered',
  is_correct BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.forest_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tree_type TEXT DEFAULT 'focus',
  duration_minutes INTEGER DEFAULT 25,
  earned_coins INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT DEFAULT 'cosmetic',
  item_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.saved_musics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.test_folders(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bookmarks_target_check CHECK (folder_id IS NOT NULL OR question_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_folder_unique
  ON public.bookmarks(user_id, folder_id)
  WHERE folder_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ranks_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_words INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT,
  event_name TEXT DEFAULT 'page_view',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_number TEXT NOT NULL,
  card_holder TEXT,
  expiry TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mock_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID,
  total_score NUMERIC DEFAULT 0,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE VIEW public.mock_tests_list AS
SELECT
  id,
  title,
  description,
  subject,
  row_number() OVER (ORDER BY created_at, id)::integer AS test_number,
  duration_minutes,
  questions_count,
  is_active,
  created_at
FROM public.mock_tests
WHERE is_active = true;

CREATE OR REPLACE VIEW public.admin_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.questions) AS total_questions,
  (SELECT COUNT(*) FROM public.resources) AS total_resources,
  (SELECT COUNT(*) FROM public.test_folders) AS total_tests,
  (SELECT COUNT(*) FROM public.mock_tests) AS total_mock_tests,
  (SELECT COUNT(*) FROM public.complaints WHERE status::text = 'pending') AS pending_complaints,
  (SELECT COUNT(*) FROM public.test_sessions WHERE finished_at IS NOT NULL) AS total_sessions_completed,
  COALESCE((SELECT SUM(amount) FROM public.wallet_transactions WHERE status IN ('success', 'completed') AND type::text = 'deposit'), 0) AS total_revenue;

DROP VIEW IF EXISTS public.daily_revenue_stats CASCADE;
CREATE OR REPLACE VIEW public.daily_revenue_stats AS
SELECT
  date_trunc('day', created_at)::date AS day,
  COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) AS revenue,
  COUNT(*) AS transactions_count
FROM public.wallet_transactions
WHERE status IN ('success', 'completed') AND type::text = 'deposit'
GROUP BY 1
ORDER BY 1;

DROP VIEW IF EXISTS public.admin_top_tests CASCADE;
CREATE OR REPLACE VIEW public.admin_top_tests AS
SELECT
  tf.id,
  tf.name,
  tf.category::text AS category,
  COUNT(ts.id) AS attempts,
  COALESCE(AVG(ts.score), 0) AS avg_score
FROM public.test_folders tf
LEFT JOIN public.test_sessions ts ON ts.folder_id = tf.id
GROUP BY tf.id, tf.name, tf.category
ORDER BY attempts DESC, tf.created_at DESC;

DROP FUNCTION IF EXISTS public.get_vocab_leaderboard();
CREATE OR REPLACE FUNCTION public.get_vocab_leaderboard()
RETURNS TABLE(u_id UUID, d_name TEXT, learned_count BIGINT, total_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.user_id AS u_id,
    COALESCE(p.display_name, p.full_name, 'Student') AS d_name,
    COUNT(*) FILTER (WHERE v.learned = true) AS learned_count,
    COUNT(*) AS total_count
  FROM public.vocabulary v
  LEFT JOIN public.profiles p ON p.user_id = v.user_id
  GROUP BY v.user_id, p.display_name, p.full_name
  HAVING COUNT(*) > 0
  ORDER BY learned_count DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.get_vocab_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocab_leaderboard() TO anon;

INSERT INTO public.subjects (name, slug, order_number, is_active)
VALUES
  ('Matematika', 'matematika', 1, true),
  ('Ona tili', 'ona-tili', 2, true),
  ('Ingliz tili', 'ingliz-tili', 3, true),
  ('Tarix', 'tarix', 4, true),
  ('Biologiya', 'biologiya', 5, true),
  ('Fizika', 'fizika', 6, true),
  ('Informatika', 'informatika', 7, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.ranks_config (name, min_words, color, icon)
VALUES
  ('Starter', 0, '#64748b', 'seedling'),
  ('Learner', 25, '#10b981', 'book'),
  ('Scholar', 100, '#3b82f6', 'award'),
  ('Master', 300, '#8b5cf6', 'crown')
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('materials', 'materials', true),
  ('mistake-images', 'mistake-images', true),
  ('feedback_images', 'feedback_images', true),
  ('subject_resources', 'subject_resources', true),
  ('chat-media', 'chat-media', true),
  ('course_files', 'course_files', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'subjects','announcements','materials','vocabulary','mistakes','daily_reports',
    'shared_tasks','daily_plans','plan_tasks','question_bank','question_bank_progress',
    'forest_trees','user_inventory','saved_musics','bookmarks','ranks_config',
    'site_analytics','chat_messages','user_cards','mock_test_results'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "subjects_public_read" ON public.subjects;
CREATE POLICY "subjects_public_read" ON public.subjects FOR SELECT USING (is_active = true OR public.is_platform_admin());
DROP POLICY IF EXISTS "subjects_admin_all" ON public.subjects;
CREATE POLICY "subjects_admin_all" ON public.subjects FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
CREATE POLICY "announcements_public_read" ON public.announcements FOR SELECT USING (is_active = true OR public.is_platform_admin());
DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;
CREATE POLICY "announcements_admin_all" ON public.announcements FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "materials_owner_or_public_read" ON public.materials;
CREATE POLICY "materials_owner_or_public_read" ON public.materials FOR SELECT USING (is_public OR auth.uid() = user_id OR public.is_platform_admin());
DROP POLICY IF EXISTS "materials_owner_insert" ON public.materials;
CREATE POLICY "materials_owner_insert" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());
DROP POLICY IF EXISTS "materials_owner_update" ON public.materials;
CREATE POLICY "materials_owner_update" ON public.materials FOR UPDATE USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());
DROP POLICY IF EXISTS "materials_owner_delete" ON public.materials;
CREATE POLICY "materials_owner_delete" ON public.materials FOR DELETE USING (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "vocabulary_owner_all" ON public.vocabulary;
CREATE POLICY "vocabulary_owner_all" ON public.vocabulary FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "mistakes_owner_all" ON public.mistakes;
CREATE POLICY "mistakes_owner_all" ON public.mistakes FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "daily_reports_owner_all" ON public.daily_reports;
CREATE POLICY "daily_reports_owner_all" ON public.daily_reports FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "shared_tasks_authenticated_read" ON public.shared_tasks;
CREATE POLICY "shared_tasks_authenticated_read" ON public.shared_tasks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "shared_tasks_owner_write" ON public.shared_tasks;
CREATE POLICY "shared_tasks_owner_write" ON public.shared_tasks FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "daily_plans_owner_all" ON public.daily_plans;
CREATE POLICY "daily_plans_owner_all" ON public.daily_plans FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "plan_tasks_owner_all" ON public.plan_tasks;
CREATE POLICY "plan_tasks_owner_all" ON public.plan_tasks FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "question_bank_public_read" ON public.question_bank;
CREATE POLICY "question_bank_public_read" ON public.question_bank FOR SELECT USING (is_active = true OR public.is_platform_admin());
DROP POLICY IF EXISTS "question_bank_admin_all" ON public.question_bank;
CREATE POLICY "question_bank_admin_all" ON public.question_bank FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "question_bank_progress_owner_all" ON public.question_bank_progress;
CREATE POLICY "question_bank_progress_owner_all" ON public.question_bank_progress FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "forest_trees_owner_all" ON public.forest_trees;
CREATE POLICY "forest_trees_owner_all" ON public.forest_trees FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "user_inventory_owner_all" ON public.user_inventory;
CREATE POLICY "user_inventory_owner_all" ON public.user_inventory FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "saved_musics_owner_all" ON public.saved_musics;
CREATE POLICY "saved_musics_owner_all" ON public.saved_musics FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "bookmarks_owner_all" ON public.bookmarks;
CREATE POLICY "bookmarks_owner_all" ON public.bookmarks FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "ranks_public_read" ON public.ranks_config;
CREATE POLICY "ranks_public_read" ON public.ranks_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "ranks_admin_all" ON public.ranks_config;
CREATE POLICY "ranks_admin_all" ON public.ranks_config FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "site_analytics_insert_auth" ON public.site_analytics;
CREATE POLICY "site_analytics_insert_auth" ON public.site_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "site_analytics_admin_read" ON public.site_analytics;
CREATE POLICY "site_analytics_admin_read" ON public.site_analytics FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS "chat_messages_auth_read" ON public.chat_messages;
CREATE POLICY "chat_messages_auth_read" ON public.chat_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "chat_messages_auth_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_auth_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "user_cards_owner_all" ON public.user_cards;
CREATE POLICY "user_cards_owner_all" ON public.user_cards FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "mock_test_results_owner_all" ON public.mock_test_results;
CREATE POLICY "mock_test_results_owner_all" ON public.mock_test_results FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin()) WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "storage_public_read_completion" ON storage.objects;
CREATE POLICY "storage_public_read_completion" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars','materials','mistake-images','feedback_images','subject_resources','chat-media','course_files'));

DROP POLICY IF EXISTS "storage_authenticated_upload_completion" ON storage.objects;
CREATE POLICY "storage_authenticated_upload_completion" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','materials','mistake-images','feedback_images','subject_resources','chat-media','course_files'));

DROP POLICY IF EXISTS "storage_owner_update_completion" ON storage.objects;
CREATE POLICY "storage_owner_update_completion" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','materials','mistake-images','feedback_images','subject_resources','chat-media','course_files'));

DROP POLICY IF EXISTS "storage_owner_delete_completion" ON storage.objects;
CREATE POLICY "storage_owner_delete_completion" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','materials','mistake-images','feedback_images','subject_resources','chat-media','course_files'));

CREATE INDEX IF NOT EXISTS vocabulary_user_id_idx ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS mistakes_user_id_idx ON public.mistakes(user_id);
CREATE INDEX IF NOT EXISTS daily_reports_user_date_idx ON public.daily_reports(user_id, date);
CREATE INDEX IF NOT EXISTS shared_tasks_date_idx ON public.shared_tasks(date);
CREATE INDEX IF NOT EXISTS plan_tasks_plan_id_idx ON public.plan_tasks(plan_id);
CREATE INDEX IF NOT EXISTS question_bank_category_idx ON public.question_bank(category);
CREATE INDEX IF NOT EXISTS materials_user_id_idx ON public.materials(user_id);
