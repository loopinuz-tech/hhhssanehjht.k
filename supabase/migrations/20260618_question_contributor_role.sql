-- Add question_contributor role for users who can add questions to folders
-- Admin can approve/reject their submissions

-- 1. Add 'question_contributor' to app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'question_contributor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create function to check if user is contributor or admin
CREATE OR REPLACE FUNCTION public.can_add_folder_questions(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'question_contributor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to grant question_contributor role
CREATE OR REPLACE FUNCTION public.grant_question_contributor(_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'question_contributor')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to revoke question_contributor role
CREATE OR REPLACE FUNCTION public.revoke_question_contributor(_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = 'question_contributor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create view for question contributors (admin management)
CREATE OR REPLACE VIEW public.question_contributors AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.created_at AS granted_at
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'question_contributor';

-- 6. Update submit_question_for_moderation to allow contributors
CREATE OR REPLACE FUNCTION public.submit_question_for_moderation(question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.questions
  SET status = 'pending',
      submitted_by = auth.uid()
  WHERE id = question_id
    AND (
      submitted_by = auth.uid()
      OR public.can_add_folder_questions(auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
