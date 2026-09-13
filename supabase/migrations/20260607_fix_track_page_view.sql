-- ═══════════════════════════════════════════════════════════════════════════
-- PATCH: track_page_view — RETURNS uuid → RETURNS bigint tuzatish
-- Supabase SQL Editor'da ishga tushiring
-- ═══════════════════════════════════════════════════════════════════════════

-- Avvalgi versiyani o'chirish (return type o'zgarsa DROP kerak)
DROP FUNCTION IF EXISTS track_page_view(text, uuid, text, text, text, text);

-- To'g'ri versiya — RETURNS bigint
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

-- Tekshirish: funksiya to'g'ri ishlaydimi
-- SELECT track_page_view('test-session', NULL, '/test', 'Test sahifa', NULL, 'desktop');
-- SELECT * FROM page_views ORDER BY viewed_at DESC LIMIT 5;
