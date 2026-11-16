import 'server-only';
import { NextResponse } from 'next/server';
import { clienteAdmin } from '@/lib/supabase/admin';
import { ipDe } from '@/lib/seguranca/ip';
import { dentroDoLimite } from '@/lib/seguranca/limiteMemoria';
import { veioDoSite } from '@/lib/seguranca/mesmoSite';
import type { CorpoFiltros } from './filtros';

export const erro = (codigo: string, mensagem: string, status: number) => NextResponse.json({ codigo, mensagem }, { status });

/** Confere origem e limite de uso. Devolve uma resposta de erro, ou null se pode seguir. */
export function barrar(req: Request, nome: string, maxPorMinuto: number) {
  if (!veioDoSite(req)) return erro('acesso_negado', 'Acesso permitido apenas pelo site.', 403);
  if (!dentroDoLimite(`${nome}:${ipDe(req)}`, maxPorMinuto, 60_000)) {
    return erro('limite', 'Muitas consultas em pouco tempo. Aguarde um minuto.', 429);
  }
  return null;
}

export async function lerCorpo(req: Request): Promise<CorpoFiltros> {
  try { const c = await req.json(); return c && typeof c === 'object' ? c : {}; } catch { return {}; }
}

export const db = () => clienteAdmin();
