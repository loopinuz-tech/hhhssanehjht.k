// Re-export the main supabase client to avoid multiple GoTrueClient instances.
// Both main app and student section now use the same Supabase project.
export { supabase } from '@/integrations/supabase/client';
