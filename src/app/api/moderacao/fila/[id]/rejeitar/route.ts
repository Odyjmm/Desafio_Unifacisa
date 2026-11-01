import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exigirModerador, mesmaOrigem } from '@/lib/supabase/sessao';

const SEM_CACHE = { 'Cache-Control': 'no-store' };
const esquema = z.object({ motivo: z.string().trim().min(5, 'Explique o motivo (mín. 5 caracteres).').max(500) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!mesmaOrigem(req)) return NextResponse.json({ codigo: 'origem_invalida' }, { status: 403, headers: SEM_CACHE });
    const { id: idTexto } = await ctx.params;
    const id = Number(idTexto);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ codigo: 'id_invalido' }, { status: 400, headers: SEM_CACHE });

    const corpo = esquema.safeParse(await req.json().catch(() => null));
    if (!corpo.success) {
      return NextResponse.json({ codigo: 'dados_invalidos', mensagem: corpo.error.issues[0]?.message ?? 'Informe o motivo.' }, { status: 422, headers: SEM_CACHE });
    }

    const acesso = await exigirModerador();
    if (!acesso.ok) return NextResponse.json({ codigo: 'acesso_negado', mensagem: acesso.mensagem }, { status: acesso.status, headers: SEM_CACHE });

    const { error } = await acesso.db.rpc('rejeitar_alteracao', { p_id: id, p_motivo: corpo.data.motivo });
    if (error) {
      const status = error.code === '42501' ? 403 : /não encontrada|já revisada/.test(error.message) ? 409 : 422;
      return NextResponse.json({ codigo: 'nao_rejeitada', mensagem: error.message }, { status, headers: SEM_CACHE });
    }
    return NextResponse.json({ codigo: 'rejeitada' }, { headers: SEM_CACHE });
  } catch (e) {
    console.error('Erro ao rejeitar:', e);
    return NextResponse.json({ codigo: 'erro_interno', mensagem: 'Erro inesperado.' }, { status: 500, headers: SEM_CACHE });
  }
}