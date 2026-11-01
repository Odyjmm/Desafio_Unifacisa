import { NextResponse } from 'next/server';
import { exigirModerador, mesmaOrigem } from '@/lib/supabase/sessao';

const SEM_CACHE = { 'Cache-Control': 'no-store' };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!mesmaOrigem(req)) return NextResponse.json({ codigo: 'origem_invalida' }, { status: 403, headers: SEM_CACHE });
    const { id: idTexto } = await ctx.params;
    const id = Number(idTexto);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ codigo: 'id_invalido' }, { status: 400, headers: SEM_CACHE });

    const acesso = await exigirModerador();
    if (!acesso.ok) return NextResponse.json({ codigo: 'acesso_negado', mensagem: acesso.mensagem }, { status: acesso.status, headers: SEM_CACHE });

    const { data, error } = await acesso.db.rpc('aprovar_alteracao', { p_id: id });
    if (error) {
      const status = error.code === '42501' ? 403 : /já foi|já está cadastrado|não encontrada/.test(error.message) ? 409 : 422;
      return NextResponse.json({ codigo: 'nao_aprovada', mensagem: error.message }, { status, headers: SEM_CACHE });
    }
    return NextResponse.json({ codigo: 'aprovada', organizacaoId: data }, { headers: SEM_CACHE });
  } catch (e) {
    console.error('Erro ao aprovar:', e);
    return NextResponse.json({ codigo: 'erro_interno', mensagem: 'Erro inesperado.' }, { status: 500, headers: SEM_CACHE });
  }
}