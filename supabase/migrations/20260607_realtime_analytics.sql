-- ═══════════════════════════════════════════════════════════════════════════
-- EduContest — Real-time & Advanced Analytics SQL
-- Supabase SQL Editor'da ishga tushiring
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  1. PAGE VIEWS TRACKING (sahifalar kuzatuvi)                ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS page_views (
    id           bigserial    PRIMARY KEY,
    session_id   text         NOT NULL,             -- anonymous browser session id
    user_id      uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path    text         NOT NULL,             -- e.g. '/dashboard', '/tests'
    page_title   text,
    referrer     text,
    user_agent   text,
    country      text,
    device_type  text,                              -- 'desktop' | 'mobile' | 'tablet'
    viewed_at    timestamptz  DEFAULT now(),
    duration_ms  int                                -- time on page in ms (updated on leave)
);

CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at  ON page_views (viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path  ON page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id    ON page_views (user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views (session_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Admins can read all; users can insert their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='page_views_admin_read') THEN
    CREATE POLICY "page_views_admin_read" ON page_views FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','sub_admin')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='page_views_insert') THEN
    CREATE POLICY "page_views_insert" ON page_views FOR INSERT TO authenticated, anon
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='page_views_update_own') THEN
    CREATE POLICY "page_views_update_own" ON page_views FOR UPDATE TO authenticated, anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  2. ACTIVE SESSIONS (real-time kim onlayn)                  ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id   text         PRIMARY KEY,
    user_id      uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name    text,
    current_page text         NOT NULL DEFAULT '/',
    page_title   text,
    last_seen    timestamptz  DEFAULT now(),
    started_at   timestamptz  DEFAULT now(),
    device_type  text,
    country      text
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions (last_seen DESC);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='active_sessions' AND policyname='active_sessions_admin_read') THEN
    CREATE POLICY "active_sessions_admin_read" ON active_sessions FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','sub_admin')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='active_sessions' AND policyname='active_sessions_upsert') THEN
    CREATE POLICY "active_sessions_upsert" ON active_sessions FOR ALL TO authenticated, anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  3. DAILY USER STATS (kunlik statistika)                    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW daily_user_stats AS
SELECT
    DATE_TRUNC('day', viewed_at)::date          AS day,
    COUNT(DISTINCT session_id)                   AS total_sessions,
    COUNT(DISTINCT user_id)                      AS unique_users,
    COUNT(*)                                     AS total_pageviews,
    ROUND(AVG(duration_ms) / 1000.0, 1)         AS avg_duration_sec,
    COUNT(*) FILTER (WHERE user_id IS NULL)      AS anonymous_visits
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON daily_user_stats TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  4. HOURLY TRAFFIC (soatbay qaysi vaqtda kim ko'p kirati)  ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW hourly_traffic AS
SELECT
    EXTRACT(HOUR FROM viewed_at)::int            AS hour,
    DATE_TRUNC('day', viewed_at)::date           AS day,
    COUNT(DISTINCT session_id)                   AS sessions,
    COUNT(*)                                     AS pageviews
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 2 DESC, 1;

GRANT SELECT ON hourly_traffic TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5. TOP PAGES (qaysi sahifalar ko'p ko'rildi)              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW top_pages AS
SELECT
    page_path,
    page_title,
    COUNT(*)                                     AS views,
    COUNT(DISTINCT session_id)                   AS unique_visitors,
    ROUND(AVG(duration_ms) / 1000.0, 1)         AS avg_time_sec,
    MAX(viewed_at)                               AS last_visit
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY page_path, page_title
ORDER BY views DESC
LIMIT 20;

GRANT SELECT ON top_pages TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  6. MINUTE-BY-MINUTE TODAY (bugun minutma-minut)            ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW minutely_traffic_today AS
SELECT
    DATE_TRUNC('minute', viewed_at)              AS minute,
    COUNT(DISTINCT session_id)                   AS active_sessions,
    COUNT(*)                                     AS pageviews
FROM page_views
WHERE viewed_at >= CURRENT_DATE
GROUP BY 1
ORDER BY 1 DESC
LIMIT 120;  -- last 120 minutes

GRANT SELECT ON minutely_traffic_today TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  7. USER LOGIN STATS (kunlik login statistikasi)            ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Note: auth.audit_log_entries is already tracked by Supabase
-- We create a helper view from page_views (first hit of session = login proxy)
CREATE OR REPLACE VIEW daily_login_stats AS
SELECT
    DATE_TRUNC('day', first_seen)::date          AS day,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS logged_in_users,
    COUNT(DISTINCT session_id)                   AS total_sessions,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::float
        / NULLIF(COUNT(DISTINCT session_id), 0) * 100  AS login_rate_pct
FROM (
    SELECT session_id, user_id, MIN(viewed_at) AS first_seen
    FROM page_views
    GROUP BY session_id, user_id
) s
WHERE first_seen >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON daily_login_stats TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  8. DEVICE & LOCATION BREAKDOWN                             ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW device_stats AS
SELECT
    COALESCE(device_type, 'unknown')             AS device_type,
    COUNT(DISTINCT session_id)                   AS sessions,
    COUNT(*)                                     AS pageviews
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY sessions DESC;

GRANT SELECT ON device_stats TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  9. CURRENT ONLINE — Real-time kim onlayn (< 5 daqiqa)     ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW current_online_users AS
SELECT
    s.session_id,
    s.user_id,
    COALESCE(s.full_name, p.full_name, 'Mehmon') AS display_name,
    s.current_page,
    s.page_title,
    s.last_seen,
    s.device_type,
    EXTRACT(EPOCH FROM (now() - s.started_at))::int AS session_duration_sec
FROM active_sessions s
LEFT JOIN profiles p ON s.user_id = p.user_id
WHERE s.last_seen >= now() - INTERVAL '5 minutes'
ORDER BY s.last_seen DESC;

GRANT SELECT ON current_online_users TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  10. UPSERT ACTIVE SESSION RPC                              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION upsert_active_session(
    p_session_id  text,
    p_user_id     uuid,
    p_full_name   text,
    p_page        text,
    p_page_title  text,
    p_device_type text DEFAULT 'desktop'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO active_sessions (session_id, user_id, full_name, current_page, page_title, last_seen, device_type)
    VALUES (p_session_id, p_user_id, p_full_name, p_page, p_page_title, now(), p_device_type)
    ON CONFLICT (session_id) DO UPDATE
        SET current_page = EXCLUDED.current_page,
            page_title   = EXCLUDED.page_title,
            last_seen    = now(),
            user_id      = COALESCE(EXCLUDED.user_id, active_sessions.user_id),
            full_name    = COALESCE(EXCLUDED.full_name, active_sessions.full_name);
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_active_session TO authenticated, anon;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  11. TRACK PAGE VIEW RPC                                    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION track_page_view(
    p_session_id  text,
    p_user_id     uuid,
    p_page_path   text,
    p_page_title  text,
    p_referrer    text DEFAULT NULL,
    p_device_type text DEFAULT 'desktop'
)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_id bigint;
BEGIN
    INSERT INTO page_views (session_id, user_id, page_path, page_title, referrer, device_type, viewed_at)
    VALUES (p_session_id, p_user_id, p_page_path, p_page_title, p_referrer, p_device_type, now())
    RETURNING id INTO v_id;

    -- Also update active session
    PERFORM upsert_active_session(p_session_id, p_user_id, NULL, p_page_path, p_page_title, p_device_type);

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION track_page_view TO authenticated, anon;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  12. DAILY REGISTRATIONS VIEW (yangi ro'yxatga olinganlar)  ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE VIEW daily_registrations AS
SELECT
    DATE_TRUNC('day', created_at)::date AS day,
    COUNT(*)                             AS new_users,
    COUNT(*) FILTER (WHERE role = 'student') AS students,
    COUNT(*) FILTER (WHERE role = 'teacher') AS teachers
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON daily_registrations TO authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TEKSHIRISH MISOLLARI                                       ║
-- ╚══════════════════════════════════════════════════════════════╝
-- SELECT * FROM current_online_users;
-- SELECT * FROM minutely_traffic_today;
-- SELECT * FROM daily_user_stats LIMIT 10;
-- SELECT * FROM top_pages;
-- SELECT * FROM hourly_traffic WHERE day = CURRENT_DATE;
-- SELECT * FROM daily_registrations;
-- SELECT * FROM daily_login_stats;
-- SELECT * FROM device_stats;
