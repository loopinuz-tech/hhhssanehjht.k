
DROP VIEW IF EXISTS public.leaderboard;
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.full_name,
  p.avatar_url,
  COUNT(ts.id) AS total_attempts,
  COALESCE(SUM(ts.correct_answers), 0) AS total_correct,
  COALESCE(SUM(ts.total_questions), 0) AS total_questions,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ts.correct_answers), 0) DESC) AS rank
FROM public.profiles p
LEFT JOIN public.test_sessions ts ON ts.user_id = p.user_id AND ts.finished_at IS NOT NULL
GROUP BY p.id, p.full_name, p.avatar_url
HAVING COUNT(ts.id) > 0
ORDER BY total_correct DESC
LIMIT 25;
