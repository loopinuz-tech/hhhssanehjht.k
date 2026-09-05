-- ============================================================================
-- EduContest Exit-Intent Feedback Survey Table
-- Migration Date: 2026-08-30
-- ============================================================================

-- 1. Create feedback_exit_survey table
CREATE TABLE IF NOT EXISTS public.feedback_exit_survey (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason_category  TEXT        NOT NULL CHECK (reason_category IN (
    'price_too_high',
    'question_quality',
    'ui_confusing',
    'subject_missing',
    'no_time',
    'other',
    'skipped'
  )),
  free_text        TEXT,
  page_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_exit_survey_user_id
  ON public.feedback_exit_survey(user_id);

CREATE INDEX IF NOT EXISTS idx_exit_survey_reason_category
  ON public.feedback_exit_survey(reason_category);

CREATE INDEX IF NOT EXISTS idx_exit_survey_created_at
  ON public.feedback_exit_survey(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.feedback_exit_survey ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback_exit_survey'
      AND policyname = 'Users can insert own exit survey'
  ) THEN
    CREATE POLICY "Users can insert own exit survey"
      ON public.feedback_exit_survey
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback_exit_survey'
      AND policyname = 'Users can read own exit survey'
  ) THEN
    CREATE POLICY "Users can read own exit survey"
      ON public.feedback_exit_survey
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback_exit_survey'
      AND policyname = 'Admins can read all exit surveys'
  ) THEN
    CREATE POLICY "Admins can read all exit surveys"
      ON public.feedback_exit_survey
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'sub_admin')
        )
      );
  END IF;
END $$;

-- 4. Admin analytics view
CREATE OR REPLACE VIEW public.exit_survey_summary AS
SELECT
  reason_category,
  COUNT(*)                                                              AS total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')      AS last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')     AS last_30_days
FROM public.feedback_exit_survey
GROUP BY reason_category
ORDER BY total_count DESC;

GRANT SELECT ON public.exit_survey_summary TO authenticated;

COMMENT ON TABLE public.feedback_exit_survey IS
  'Stores exit-intent survey responses. reason_category is constrained TEXT for easy aggregation.';