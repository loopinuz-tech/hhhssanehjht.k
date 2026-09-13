-- Courses tizimi uchun qo'shimcha professional ustunlar va avtomatlashtirish
-- 1. Ustunlarni qo'shish
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS student_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lesson_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.00;

ALTER TABLE public.course_lessons
ADD COLUMN IF NOT EXISTS duration TEXT;

-- 2. Lesson count-ni yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.update_course_lesson_count()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        SELECT course_id INTO v_course_id FROM public.course_modules WHERE id = NEW.module_id;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT course_id INTO v_course_id FROM public.course_modules WHERE id = OLD.module_id;
    END IF;

    IF v_course_id IS NOT NULL THEN
        UPDATE public.courses 
        SET lesson_count = (
            SELECT COUNT(*) 
            FROM public.course_lessons cl
            JOIN public.course_modules cm ON cl.module_id = cm.id
            WHERE cm.course_id = v_course_id
        )
        WHERE id = v_course_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Lesson count triggerini yaratish
DROP TRIGGER IF EXISTS tr_update_course_lesson_count ON public.course_lessons;
CREATE TRIGGER tr_update_course_lesson_count
    AFTER INSERT OR DELETE OR UPDATE ON public.course_lessons
    FOR EACH ROW EXECUTE FUNCTION public.update_course_lesson_count();

-- 4. Average rating-ni yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.courses 
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.course_reviews
            WHERE course_id = NEW.course_id
        )
        WHERE id = NEW.course_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.courses 
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.course_reviews
            WHERE course_id = OLD.course_id
        )
        WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Rating triggerini yaratish
DROP TRIGGER IF EXISTS tr_update_course_rating ON public.course_reviews;
CREATE TRIGGER tr_update_course_rating
    AFTER INSERT OR DELETE OR UPDATE ON public.course_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_course_rating();

-- 6. Mavjud ma'lumotlarni hisoblash (Initial update)
UPDATE public.courses c
SET 
  lesson_count = (
    SELECT COUNT(*) 
    FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    WHERE cm.course_id = c.id
  ),
  average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.course_reviews
    WHERE course_id = c.id
  );
