import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const validSupabaseUrl = (() => {
  if (!supabaseUrl) return false;
  try {
    return new URL(supabaseUrl).protocol === 'https:';
  } catch {
    return false;
  }
})();

export const supabaseConfigured = Boolean(validSupabaseUrl && supabaseAnonKey);
export const supabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : null;

export const supabaseConfigurationMessage = validSupabaseUrl
  ? 'O login ainda não foi configurado. Adicione VITE_SUPABASE_ANON_KEY ao ambiente de publicação.'
  : 'O login ainda não foi configurado. Adicione uma URL HTTPS válida em VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao ambiente de publicação.';
