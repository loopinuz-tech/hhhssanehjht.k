-- ============================================================================
-- EDUCONTEST PERFORMANCE OPTIMIZATION & INDEXES MIGRATION
-- Migration Date: 2026-08-28
-- Summary: Adds high-performance indexes for heavy query patterns and 
--          implements RPC functions for fast aggregate metrics across all modules.
-- ============================================================================

-- 1. Payment Requests & Finance Tables
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS note TEXT;

-- Enable RLS and grant full permissive policies for payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert payment requests" ON public.payment_requests;
CREATE POLICY "Anyone can insert payment requests" 
  ON public.payment_requests FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view payment requests" ON public.payment_requests;
CREATE POLICY "Anyone can view payment requests" 
  ON public.payment_requests FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Anyone can update payment requests" ON public.payment_requests;
CREATE POLICY "Anyone can update payment requests" 
  ON public.payment_requests FOR ALL 
  USING (true) WITH CHECK (true);

GRANT ALL ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO anon;
GRANT ALL ON public.payment_requests TO service_role;

CREATE INDEX IF NOT EXISTS idx_payment_requests_status_created 
  ON public.payment_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user 
  ON public.payment_requests(user_id);

-- 2. Test Sessions & Folders Indexes
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_finished 
  ON public.test_sessions(user_id, finished_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_sessions_folder_id 
  ON public.test_sessions(folder_id);

CREATE INDEX IF NOT EXISTS idx_questions_folder_active 
  ON public.questions(folder_id, is_active);

CREATE INDEX IF NOT EXISTS idx_questions_level 
  ON public.questions(level) WHERE level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_test_folders_category_active 
  ON public.test_folders(category, is_active);

CREATE INDEX IF NOT EXISTS idx_test_folders_subject_active 
  ON public.test_folders(subject, is_active);

CREATE INDEX IF NOT EXISTS idx_test_folders_active_created 
  ON public.test_folders(is_active, created_at DESC);

-- 3. Mock Tests & Submissions Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mock_tests_slug_unique 
  ON public.mock_tests(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mock_tests_active_created 
  ON public.mock_tests(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_tests_type_active 
  ON public.mock_tests(type, is_active);

CREATE INDEX IF NOT EXISTS idx_mock_submissions_test_created 
  ON public.mock_test_submissions(test_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_submissions_user_test 
  ON public.mock_test_submissions(user_id, test_id);

CREATE INDEX IF NOT EXISTS idx_mock_questions_test_number 
  ON public.mock_test_questions(test_id, question_number);

-- 4. Course System Indexes (Courses, Enrollments, Modules, Lessons, Tests)
CREATE INDEX IF NOT EXISTS idx_courses_status_created 
  ON public.courses(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id 
  ON public.courses(teacher_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id 
  ON public.course_enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id 
  ON public.course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_purchased 
  ON public.course_enrollments(purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_sort 
  ON public.course_modules(course_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id 
  ON public.course_lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_course_tests_module_id 
  ON public.course_tests(module_id);

-- 5. SAT Question Bank & Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_sat_questions_section_cat 
  ON public.sat_questions(section, category);

CREATE INDEX IF NOT EXISTS idx_sat_submissions_user_correct 
  ON public.sat_submissions(user_id, is_correct);

CREATE INDEX IF NOT EXISTS idx_materials_created 
  ON public.materials(created_at DESC);

-- 6. User Profiles, Roles & Auth Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat 
  ON public.profiles(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_phone 
  ON public.profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_code_ver 
  ON public.telegram_auth_codes(code, verified);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_codes_chat 
  ON public.telegram_auth_codes(chat_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
  ON public.user_roles(user_id, role);

-- 7. Transactions, Wallet & EduCoin Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type_status_created 
  ON public.wallet_transactions(type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created 
  ON public.wallet_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref 
  ON public.wallet_transactions(reference_id) WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_educoin_tx_user_created 
  ON public.educoin_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_educoin_tx_amount 
  ON public.educoin_transactions(amount);

CREATE INDEX IF NOT EXISTS idx_educoin_tx_ref 
  ON public.educoin_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- 8. Leaderboard, Announcements & Support Indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank 
  ON public.leaderboard(rank ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id 
  ON public.leaderboard(user_id);

CREATE INDEX IF NOT EXISTS idx_announcements_active_created 
  ON public.announcements(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_exams_active_time 
  ON public.scheduled_exams(is_active, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_test_purchases_user_folder 
  ON public.test_purchases(user_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_test_purchases_user_mock 
  ON public.test_purchases(user_id, mock_test_id);

CREATE INDEX IF NOT EXISTS idx_complaints_status_created 
  ON public.complaints(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_created 
  ON public.platform_feedback(created_at DESC);

-- 9. High-Performance Dashboard Aggregate RPC
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sessions BIGINT;
  v_total_correct BIGINT;
  v_total_questions BIGINT;
  v_today_count BIGINT;
  v_today_date DATE := CURRENT_DATE;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(correct_answers), 0),
    COALESCE(SUM(total_questions), 0)
  INTO 
    v_total_sessions,
    v_total_correct,
    v_total_questions
  FROM public.test_sessions
  WHERE user_id = p_user_id 
    AND finished_at IS NOT NULL;

  SELECT COUNT(*)
  INTO v_today_count
  FROM public.test_sessions
  WHERE user_id = p_user_id 
    AND finished_at >= v_today_date::TIMESTAMP AT TIME ZONE 'UTC';

  RETURN jsonb_build_object(
    'totalSessionsCount', v_total_sessions,
    'totalCorrectAnswers', v_total_correct,
    'totalQuestionsCount', v_total_questions,
    'todayTests', v_today_count
  );
END;
$$;

-- 10. High-Performance Admin Finance Stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_finance_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_deposit NUMERIC;
  v_today_deposit NUMERIC;
  v_educoin_spend NUMERIC;
  v_today_date TIMESTAMP WITH TIME ZONE := DATE_TRUNC('day', NOW());
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_deposit
  FROM public.wallet_transactions
  WHERE type = 'deposit' 
    AND status IN ('completed', 'success');

  SELECT COALESCE(SUM(amount), 0)
  INTO v_today_deposit
  FROM public.wallet_transactions
  WHERE type = 'deposit' 
    AND status IN ('completed', 'success')
    AND created_at >= v_today_date;

  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO v_educoin_spend
  FROM public.educoin_transactions
  WHERE amount < 0;

  RETURN jsonb_build_object(
    'totalDeposit', v_total_deposit,
    'todayDeposit', v_today_deposit,
    'educoinSpend', v_educoin_spend
  );
END;
$$;
