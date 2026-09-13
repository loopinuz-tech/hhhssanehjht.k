-- Vocab leaderboard funksiyasini tuzatish
-- muammo: get_vocab_leaderboard() total_count qaytarmaydi, GRANT yo'q

-- 1. Funksiyani qayta yaratish (total_count qo'shish, HAVING qo'shish)
DROP FUNCTION IF EXISTS public.get_vocab_leaderboard();
CREATE FUNCTION public.get_vocab_leaderboard()
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

-- 2. Ruxsat berish (authenticated va anon rollari)
GRANT EXECUTE ON FUNCTION public.get_vocab_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vocab_leaderboard() TO anon;

-- 3. Vocabulary RLS — leaderboard/cheat-code uchun boshqalarning so'zlarini ko'rish
-- mavjud bo'lmasa, qo'shamiz
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'vocabulary_select_leaderboard'
    AND tablename = 'vocabulary'
  ) THEN
    CREATE POLICY "vocabulary_select_leaderboard" ON public.vocabulary
      FOR SELECT USING (true);
  END IF;
END $$;
