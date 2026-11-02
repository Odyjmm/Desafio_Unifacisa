import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function clienteDaSessao(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
  }
  const jar = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) {
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            });
          }
        } catch {}
      },
    },
  });
}

export type AcessoModerador =
  | { ok: true; db: SupabaseClient }
  | { ok: false; status: 401 | 403; mensagem: string };

export async function exigirModerador(): Promise<AcessoModerador> {
  const db = await clienteDaSessao();
  const { data, error } = await db.rpc('e_moderador');
  if (error) return { ok: false, status: 401, mensagem: 'Faça login para continuar.' };
  if (data !== true) return { ok: false, status: 403, mensagem: 'Seu usuário não tem permissão de moderador.' };
  return { ok: true, db };
}

export function mesmaOrigem(req: Request): boolean {
  const origem = req.headers.get('origin');
  if (!origem) return true;
  try {
    return new URL(origem).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}