-- Analytics Views for EduContest Admin Panel

-- Drop existing views to avoid type mismatch errors
DROP VIEW IF EXISTS daily_revenue_stats CASCADE;
DROP VIEW IF EXISTS admin_top_tests CASCADE;
DROP VIEW IF EXISTS admin_course_revenue_stats CASCADE;

-- 1. Daily Revenue and Transaction Stats
CREATE OR REPLACE VIEW daily_revenue_stats AS
SELECT 
    DATE_TRUNC('day', purchased_at)::date as day,
    SUM(COALESCE(price_paid, 0)) as revenue,
    COUNT(id) as transaction_count
FROM course_enrollments
WHERE purchased_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

ALTER TABLE test_folders ADD COLUMN IF NOT EXISTS subject TEXT;

-- 2. Top Performing Test Folders
CREATE OR REPLACE VIEW admin_top_tests AS
SELECT 
    tf.id as folder_id,
    tf.name as test_name,
    tf.category,
    tf.subject,
    COUNT(ts.id) as total_attempts,
    AVG(COALESCE(ts.correct_answers::float / NULLIF(ts.total_questions, 0), 0) * 100) as average_score
FROM test_folders tf
LEFT JOIN test_sessions ts ON tf.id = ts.folder_id
WHERE ts.finished_at IS NOT NULL
GROUP BY tf.id, tf.name, tf.category, tf.subject
ORDER BY total_attempts DESC
LIMIT 8;

-- 3. Course Revenue and Student Performance
CREATE OR REPLACE VIEW admin_course_revenue_stats AS
SELECT 
    c.title,
    c.price,
    c.student_count,
    COALESCE(SUM(ce.price_paid), 0) as potential_revenue
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
GROUP BY c.id, c.title, c.price, c.student_count
ORDER BY potential_revenue DESC;
