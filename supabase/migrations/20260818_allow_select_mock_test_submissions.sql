-- Migration to allow select access on mock_test_submissions so real participant counts can be rendered
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.mock_test_submissions;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.mock_test_submissions;
    
    CREATE POLICY "Enable read access for all users" ON public.mock_test_submissions FOR SELECT USING (true);
END $$;
