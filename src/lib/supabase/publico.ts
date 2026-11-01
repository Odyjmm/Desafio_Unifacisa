import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function clientePublico(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
  }
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}