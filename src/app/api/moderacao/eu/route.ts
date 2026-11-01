import { NextResponse } from 'next/server';
import { clienteDaSessao } from '@/lib/supabase/sessao';

export async function GET() {
  try {
    const db = await clienteDaSessao();
    const { data, error } = await db.rpc('e_moderador');
    return NextResponse.json({ moderador: !error && data === true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ moderador: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
}