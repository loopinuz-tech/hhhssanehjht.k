-- Update buy_course to support both UZS and EduCoin
CREATE OR REPLACE FUNCTION public.buy_course(p_course_id UUID, p_payment_method TEXT DEFAULT 'uzs')
RETURNS JSON AS $$
DECLARE
    v_course_price DECIMAL(12,2);
    v_edu_price INTEGER;
    v_course_title TEXT;
    v_user_balance_uzs BIGINT;
    v_user_balance_edu INTEGER;
    v_teacher_id UUID;
    v_buyer_name TEXT;
BEGIN
    -- 1. Kurs ma'lumotlarini olish
    SELECT title, price, educoin_price, teacher_id 
    INTO v_course_title, v_course_price, v_edu_price, v_teacher_id
    FROM public.courses
    WHERE id = p_course_id;

    -- 2. Foydalanuvchi ma'lumotlarini olish
    SELECT balance, educoin_balance, full_name 
    INTO v_user_balance_uzs, v_user_balance_edu, v_buyer_name
    FROM public.profiles
    WHERE user_id = auth.uid();

    -- 3. Tekshiruvlar
    IF EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = p_course_id AND user_id = auth.uid()) THEN
        RETURN json_build_object('success', false, 'message', 'Siz allaqachon a''zo bo''lgansiz');
    END IF;

    IF p_payment_method = 'educoin' THEN
        IF v_edu_price IS NULL OR v_edu_price <= 0 THEN
             -- Fallback: if educoin_price not set, use conversion (10 EduCoin = 1000 UZS)
             -- 1000 UZS -> 10 EduCoin. If v_course_price is 50,000 UZS -> 500 EduCoin
             v_edu_price := CEIL(v_course_price / 100);
        END IF;

        IF v_user_balance_edu < v_edu_price THEN
            RETURN json_build_object('success', false, 'message', 'EduCoin balansingiz yetarli emas');
        END IF;

        -- EduCoin bilan sotib olish
        PERFORM add_educoins(auth.uid(), -v_edu_price, 'course_purchase', 'Kurs sotib olindi: ' || v_course_title, p_course_id);
        
    ELSE
        -- UZS bilan sotib olish
        IF v_course_price > v_user_balance_uzs THEN
            RETURN json_build_object('success', false, 'message', 'Balans yetarli emas');
        END IF;

        -- Balansdan ayirish (Sotib oluvchi)
        UPDATE public.profiles
        SET balance = balance - v_course_price
        WHERE user_id = auth.uid();

        -- Balansga qo'shish (O'qituvchi)
        UPDATE public.profiles
        SET balance = balance + v_course_price
        WHERE user_id = v_teacher_id;
    END IF;

    -- A'zo qilish
    INSERT INTO public.course_enrollments (course_id, user_id, price_paid)
    VALUES (p_course_id, auth.uid(), CASE WHEN p_payment_method = 'educoin' THEN 0 ELSE v_course_price END);

    -- 5. Bildirishnomalar yuborish
    -- O'qituvchiga xabar
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (v_teacher_id, 'Yangi sotuv!', v_buyer_name || ' sizning "' || v_course_title || '" kursingizni sotib oldi.');

    -- O'quvchiga xabar
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (auth.uid(), 'Tabriklaymiz!', '"' || v_course_title || '" kursiga muvaffaqiyatli a''zo bo''ldingiz.');

    RETURN json_build_object('success', true, 'message', 'Kurs muvaffaqiyatli sotib olindi');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
