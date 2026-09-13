-- Fix RLS policies for questions table to allow admin approve/reject

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;
DROP POLICY IF EXISTS "Everyone can view active questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Users can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update own pending questions" ON public.questions;
DROP POLICY IF EXISTS "Users can delete own draft questions" ON public.questions;

-- Everyone can view active questions
CREATE POLICY "view_active_questions" ON public.questions
  FOR SELECT USING (status = 'active');

-- Admins can view ALL questions (including pending)
CREATE POLICY "admin_view_all_questions" ON public.questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can UPDATE all questions (approve/reject)
CREATE POLICY "admin_update_all_questions" ON public.questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (true);

-- Admins can DELETE all questions
CREATE POLICY "admin_delete_all_questions" ON public.questions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone logged in can INSERT questions
CREATE POLICY "authenticated_insert_questions" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own pending/rejected questions
CREATE POLICY "user_update_own_questions" ON public.questions
  FOR UPDATE USING (
    submitted_by = auth.uid()
    AND status IN ('draft', 'rejected')
  )
  WITH CHECK (true);

-- Users can delete their own draft/rejected questions
CREATE POLICY "user_delete_own_questions" ON public.questions
  FOR DELETE USING (
    submitted_by = auth.uid()
    AND status IN ('draft', 'rejected')
  );

-- Also allow sub_admins to manage questions
CREATE POLICY "sub_admin_update_questions" ON public.questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'sub_admin')
  )
  WITH CHECK (true);
