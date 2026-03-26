import { createClient } from '@supabase/supabase-js';

// In a real app, these would come from .env
// For this standalone assignment, we'll setup a mocked setup if credentials are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const IS_MOCK_MODE = supabaseUrl === 'https://placeholder-project.supabase.co';
