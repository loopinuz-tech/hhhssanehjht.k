-- ==============================================================================
-- Migration: 20260912_education_centers_system.sql
-- Description: Core schema for Education Centers (B2B) System on EduContest
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Centers Table
CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    legal_name VARCHAR(255),
    owner_id UUID NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    telegram_username VARCHAR(100),
    region VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    logo_url TEXT,
    description TEXT,
    subjects TEXT[] DEFAULT '{}',
    student_count_range VARCHAR(50),
    branch_count INT DEFAULT 1,
    social_links JSONB DEFAULT '{}'::jsonb,
    branding JSONB DEFAULT '{"primary_color": "#E8192C", "accent_color": "#3B82F6"}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    telegram_chat_id BIGINT,
    telegram_linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_centers_username ON public.centers(username);
CREATE INDEX IF NOT EXISTS idx_centers_owner_id ON public.centers(owner_id);
CREATE INDEX IF NOT EXISTS idx_centers_status ON public.centers(status);

-- 2. Center Applications Table
CREATE TABLE IF NOT EXISTS public.center_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    plan_name VARCHAR(100) DEFAULT 'EduCenter Pro',
    plan_price NUMERIC DEFAULT 490000,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_order_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_applications_center_id ON public.center_applications(center_id);
CREATE INDEX IF NOT EXISTS idx_center_applications_status ON public.center_applications(status);

-- 3. Center Subscriptions Table
CREATE TABLE IF NOT EXISTS public.center_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'EduCenter Pro',
    price NUMERIC DEFAULT 490000,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    start_date TIMESTAMPTZ DEFAULT now(),
    next_billing_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    limits JSONB DEFAULT '{"max_students": 500, "max_classes": 30, "max_staff": 10, "max_mocks": 100}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_subscriptions_center_id ON public.center_subscriptions(center_id);

-- 4. Center Members Table
CREATE TABLE IF NOT EXISTS public.center_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    custom_username VARCHAR(100),
    force_password_change BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_center_members_center_user UNIQUE (center_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_center_members_center_id ON public.center_members(center_id);
CREATE INDEX IF NOT EXISTS idx_center_members_user_id ON public.center_members(user_id);
CREATE INDEX IF NOT EXISTS idx_center_members_role ON public.center_members(role);

-- 5. Center Staff Permissions Table
CREATE TABLE IF NOT EXISTS public.center_staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    assigned_classes UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_center_staff_center_user UNIQUE (center_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_center_staff_permissions_center_id ON public.center_staff_permissions(center_id);

-- 6. Center Classes Table
CREATE TABLE IF NOT EXISTS public.center_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher_name VARCHAR(255),
    teacher_id UUID,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_classes_center_id ON public.center_classes(center_id);
CREATE INDEX IF NOT EXISTS idx_center_classes_code ON public.center_classes(class_code);

-- 7. Class Members Table
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.center_classes(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_class_members_class_user UNIQUE (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_center_id ON public.class_members(center_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user_id ON public.class_members(user_id);

-- 8. Class Join Requests Table
CREATE TABLE IF NOT EXISTS public.class_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.center_classes(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ DEFAULT now(),
    decided_at TIMESTAMPTZ,
    decided_by UUID
);

CREATE INDEX IF NOT EXISTS idx_class_join_requests_class_id ON public.class_join_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_center_id ON public.class_join_requests(center_id);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_status ON public.class_join_requests(status);

-- 9. Center Tests Table
CREATE TABLE IF NOT EXISTS public.center_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    source_test_id UUID REFERENCES public.mock_tests(id) ON DELETE SET NULL,
    created_by UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    mode VARCHAR(50) NOT NULL DEFAULT 'simple',
    duration_minutes INT NOT NULL DEFAULT 120,
    attempt_limit INT DEFAULT 1,
    result_policy VARCHAR(50) DEFAULT 'best',
    result_release_policy VARCHAR(50) DEFAULT 'immediate',
    exam_start_at TIMESTAMPTZ,
    exam_end_at TIMESTAMPTZ,
    auto_submit_at_exam_end BOOLEAN DEFAULT true,
    assign_all_classes BOOLEAN DEFAULT false,
    custom_questions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_tests_center_id ON public.center_tests(center_id);
CREATE INDEX IF NOT EXISTS idx_center_tests_source_id ON public.center_tests(source_test_id);
CREATE INDEX IF NOT EXISTS idx_center_tests_status ON public.center_tests(status);

-- 10. Center Test Classes Table
CREATE TABLE IF NOT EXISTS public.center_test_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_test_id UUID NOT NULL REFERENCES public.center_tests(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.center_classes(id) ON DELETE CASCADE,
    CONSTRAINT uq_center_test_classes UNIQUE (center_test_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_center_test_classes_test_id ON public.center_test_classes(center_test_id);
CREATE INDEX IF NOT EXISTS idx_center_test_classes_class_id ON public.center_test_classes(class_id);

-- 11. Center Test Attempts Table
CREATE TABLE IF NOT EXISTS public.center_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_test_id UUID NOT NULL REFERENCES public.center_tests(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.center_classes(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    answers JSONB DEFAULT '{}'::jsonb,
    score NUMERIC DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    rasch_score NUMERIC,
    relative_rasch_percentage NUMERIC,
    rasch_grade VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_test_attempts_test_id ON public.center_test_attempts(center_test_id);
CREATE INDEX IF NOT EXISTS idx_center_test_attempts_user_id ON public.center_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_center_test_attempts_center_id ON public.center_test_attempts(center_id);

-- 12. Center Audit Logs Table
CREATE TABLE IF NOT EXISTS public.center_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_audit_logs_center_id ON public.center_audit_logs(center_id);

-- 13. Center Notifications Table
CREATE TABLE IF NOT EXISTS public.center_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_notifications_center_id ON public.center_notifications(center_id);
CREATE INDEX IF NOT EXISTS idx_center_notifications_user_id ON public.center_notifications(user_id);
