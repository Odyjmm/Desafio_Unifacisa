import { NextResponse } from 'next/server';
import { clienteDaSessao, mesmaOrigem } from '@/lib/supabase/sessao';

export async function POST(req: Request) {
  if (!mesmaOrigem(req)) return NextResponse.json({ codigo: 'origem_invalida' }, { status: 403 });
  try {
    const db = await clienteDaSessao();
    await db.auth.signOut();
  } catch (e) {
    console.error('Erro em POST /api/moderacao/sair:', e);
  }
  return NextResponse.json({ codigo: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}