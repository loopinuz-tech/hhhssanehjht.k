-- ============ TEACHER MODULE EXTENSIONS (Lex.uz -5641270) ============

-- 1. ENUMS for Teacher Qualifications and Certification Types
DO $$ BEGIN
    CREATE TYPE public.teacher_qualification AS ENUM (
        'mutaxassis', 
        'ikkinchi_toifa', 
        'birinchi_toifa', 
        'oliy_toifa'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.certification_type AS ENUM (
        'majburiy', 
        'navbatdan_tashqari'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.certification_status AS ENUM (
        'qoralama',
        'yuborilgan',
        'tekshirilmoqda',
        'tasdiqlangan',
        'rad_etilgan',
        'yakunlangan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. EXTEND PROFILES WITH TEACHER SPECIFIC FIELDS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS qualification_category public.teacher_qualification DEFAULT 'mutaxassis',
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS pinfl TEXT; -- JSHSHIR for official documents

-- 3. TEACHER PORTFOLIO (Achievements according to Lex.uz criteria)
CREATE TABLE IF NOT EXISTS public.teacher_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL, -- 'ochiq_dars', 'maqola', 'tanlov', 'ikt_foydalanish', 'student_achievements'
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    file_url TEXT, -- Proof of achievement (PDF/Image)
    points_earned NUMERIC(4,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CERTIFICATION APPLICATIONS (So'rovnoma)
CREATE TABLE IF NOT EXISTS public.certification_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type public.certification_type NOT NULL,
    current_qualification public.teacher_qualification NOT NULL,
    target_qualification public.teacher_qualification NOT NULL,
    status public.certification_status DEFAULT 'qoralama',
    
    -- Scores according to the regulation
    pedagogical_score NUMERIC(4,2) DEFAULT 0, -- Max 15
    psychological_score NUMERIC(4,2) DEFAULT 0, -- Max 5
    exam_score NUMERIC(5,2) DEFAULT 0, -- Max 80
    total_score NUMERIC(5,2) DEFAULT 0, -- Max 100
    
    admin_notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CERTIFICATION APPEALS
CREATE TABLE IF NOT EXISTS public.certification_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.certification_applications(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status public.complaint_status DEFAULT 'pending',
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TEACHER CERTIFICATES (Digital/Official generation)
CREATE TABLE IF NOT EXISTS public.teacher_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.certification_applications(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    series TEXT NOT NULL,
    number TEXT NOT NULL,
    qualification_awarded public.teacher_qualification NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RLS POLICIES

-- Portfolio
ALTER TABLE public.teacher_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own portfolio" ON public.teacher_portfolio
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all portfolios" ON public.teacher_portfolio
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Applications
ALTER TABLE public.certification_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view/create own applications" ON public.certification_applications
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications" ON public.certification_applications
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Appeals
ALTER TABLE public.certification_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own appeals" ON public.certification_appeals
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all appeals" ON public.certification_appeals
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Certificates
ALTER TABLE public.teacher_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view own certificates" ON public.teacher_certificates
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can verify certificates via series/number" ON public.teacher_certificates
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage certificates" ON public.teacher_certificates
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. TRIGGERS for updated_at
DO $$ BEGIN
    CREATE TRIGGER update_teacher_portfolio_updated_at BEFORE UPDATE ON public.teacher_portfolio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_certification_applications_updated_at BEFORE UPDATE ON public.certification_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_certification_appeals_updated_at BEFORE UPDATE ON public.certification_appeals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
