import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const FALLBACK_SUPABASE_URL = "https://rlawsubbcfphsmqbteby.supabase.co";
const FALLBACK_SUPABASE_KEY = "sb_publishable_UksjV0hDGabu-6G_87-qyg_xGJVf9rW";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const cleanedUrl = rawUrl.trim().replace(/\/\.?$/, '').replace(/\.$/, '');
const SUPABASE_URL = (cleanedUrl.startsWith('http') && !cleanedUrl.includes('localhost') ? cleanedUrl : FALLBACK_SUPABASE_URL);

const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
const SUPABASE_PUBLISHABLE_KEY = rawKey.trim() || FALLBACK_SUPABASE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
});
