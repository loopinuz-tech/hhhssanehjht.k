-- ═══════════════════════════════════════════════════════════════
-- EduContest Dashboard SQL — Barcha kerakli jadvalar va view'lar
-- Supabase SQL Editor'da BU FAYLNI ISHGA TUSHIRING
-- ═══════════════════════════════════════════════════════════════

-- ── 1. LEADERBOARD VIEW ────────────────────────────────────────
-- Mavjud view ni CASCADE bilan drop qilib, yangi kolonkalar bilan qayta yaratish
DROP VIEW IF EXISTS user_ranking CASCADE;
DROP VIEW IF EXISTS leaderboard   CASCADE;

CREATE VIEW leaderboard AS
SELECT
    p.user_id,
    p.full_name,
    p.avatar_url,
    COUNT(ts.id)                                                AS total_attempts,
    COALESCE(SUM(ts.correct_answers), 0)                        AS total_correct,
    COALESCE(SUM(ts.total_questions), 0)                        AS total_questions,
    ROUND(
        COALESCE(
            SUM(ts.correct_answers)::numeric
            / NULLIF(SUM(ts.total_questions), 0) * 100,
            0
        ), 1
    )                                                            AS avg_score,
    RANK() OVER (
        ORDER BY
            COALESCE(
                SUM(ts.correct_answers)::numeric
                / NULLIF(SUM(ts.total_questions), 0),
                0
            ) DESC,
            COUNT(ts.id) DESC
    )                                                            AS rank
FROM profiles p
JOIN test_sessions ts ON p.user_id = ts.user_id
WHERE ts.finished_at IS NOT NULL
  AND p.is_blocked IS NOT TRUE
GROUP BY p.user_id, p.full_name, p.avatar_url;

GRANT SELECT ON leaderboard TO authenticated, anon;


-- ── 2. USER_RANKING VIEW ───────────────────────────────────────
CREATE VIEW user_ranking AS
SELECT
    user_id,
    full_name,
    avg_score,
    total_attempts,
    rank
FROM leaderboard;

GRANT SELECT ON user_ranking TO authenticated;


-- ── 3. SCHEDULED_EXAMS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_exams (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    title        text        NOT NULL,
    subject      text        NOT NULL,
    folder_id    uuid        REFERENCES test_folders(id) ON DELETE SET NULL,
    scheduled_at timestamptz NOT NULL,
    is_active    boolean     DEFAULT true,
    created_by   uuid        REFERENCES profiles(user_id),
    created_at   timestamptz DEFAULT now()
);

ALTER TABLE scheduled_exams ENABLE ROW LEVEL SECURITY;

-- Policy'lar faqat mavjud bo'lmasa qo'shilsin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'scheduled_exams'
          AND policyname = 'scheduled_exams_read_all'
    ) THEN
        CREATE POLICY "scheduled_exams_read_all"
            ON scheduled_exams FOR SELECT
            TO authenticated
            USING (is_active = true AND scheduled_at > now());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'scheduled_exams'
          AND policyname = 'scheduled_exams_admin_all'
    ) THEN
        CREATE POLICY "scheduled_exams_admin_all"
            ON scheduled_exams FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid()
                      AND role IN ('admin', 'sub_admin')
                )
            );
    END IF;
END $$;

-- Boshlang'ich ma'lumotlar (faqat bo'sh bo'lsagina)
INSERT INTO scheduled_exams (title, subject, scheduled_at, is_active)
SELECT * FROM (VALUES
    ('Algebraik ifodalar',  'Matematika',  NOW() + INTERVAL '3 days',  true),
    ('SQL asoslari',        'Informatika', NOW() + INTERVAL '5 days',  true),
    ('Kinematika asoslari', 'Fizika',      NOW() + INTERVAL '7 days',  true),
    ('Biologiya: Hujayra',  'Biologiya',   NOW() + INTERVAL '10 days', true),
    ('Tarix: XX asr',       'Tarix',       NOW() + INTERVAL '14 days', true)
) AS v(title, subject, scheduled_at, is_active)
WHERE NOT EXISTS (SELECT 1 FROM scheduled_exams LIMIT 1);


-- ── 4. STREAK RPC FUNCTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id uuid)
RETURNS TABLE(current_streak int, best_streak int)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    session_dates date[];
    current_s     int := 0;
    best_s        int := 0;
    temp_s        int := 1;
    i             int;
BEGIN
    -- Unikal sanalarni DESC tartibda olish
    SELECT ARRAY(
        SELECT DISTINCT finished_at::date
        FROM test_sessions
        WHERE user_id = p_user_id
          AND finished_at IS NOT NULL
        ORDER BY 1 DESC
    ) INTO session_dates;

    IF array_length(session_dates, 1) IS NULL THEN
        RETURN QUERY SELECT 0::int, 0::int;
        RETURN;
    END IF;

    -- Joriy streak: bugun yoki kechadan boshlanishi kerak
    IF session_dates[1] >= CURRENT_DATE - 1 THEN
        current_s := 1;
        FOR i IN 2..array_length(session_dates, 1) LOOP
            IF session_dates[i] = session_dates[i-1] - 1 THEN
                current_s := current_s + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;
    END IF;

    -- Best streak: butun tarix bo'yicha
    best_s := 1; temp_s := 1;
    FOR i IN 2..array_length(session_dates, 1) LOOP
        IF session_dates[i] = session_dates[i-1] - 1 THEN
            temp_s := temp_s + 1;
            best_s := GREATEST(best_s, temp_s);
        ELSE
            temp_s := 1;
        END IF;
    END LOOP;
    best_s := GREATEST(best_s, current_s);

    RETURN QUERY SELECT current_s::int, best_s::int;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_streak(uuid) TO authenticated;


-- ── 5. Tekshirish ──────────────────────────────────────────────
-- SELECT * FROM leaderboard         ORDER BY rank   LIMIT 5;
-- SELECT * FROM scheduled_exams     ORDER BY scheduled_at;
-- SELECT * FROM get_user_streak('YOUR-USER-UUID-HERE');
