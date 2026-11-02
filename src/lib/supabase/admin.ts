import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function clienteAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  }
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}