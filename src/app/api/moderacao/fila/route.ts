import { NextResponse } from 'next/server';
import { exigirModerador } from '@/lib/supabase/sessao';

const SEM_CACHE = { 'Cache-Control': 'no-store' };

export async function GET(req: Request) {
  try {
    const acesso = await exigirModerador();
    if (!acesso.ok) return NextResponse.json({ codigo: 'acesso_negado', mensagem: acesso.mensagem }, { status: acesso.status, headers: SEM_CACHE });
    const { db } = acesso;

    const p = new URL(req.url).searchParams;
    const status = ['pendente', 'aprovada', 'rejeitada'].includes(p.get('status') ?? '') ? (p.get('status') as string) : 'pendente';
    const porPagina = Math.min(Math.max(Number(p.get('porPagina')) || 20, 1), 50);
    const pagina = Math.max(Number(p.get('pagina')) || 1, 1);
    const de = (pagina - 1) * porPagina;

    const { data, count, error } = await db
      .from('alteracoes_pendentes')
      .select('id,tipo,cnpj,organizacao_id,dados,contato_remetente,status,enviado_em,revisado_em,motivo_rejeicao', { count: 'exact' })
      .eq('status', status)
      .order('enviado_em', { ascending: status === 'pendente' })
      .range(de, de + porPagina - 1);
    if (error) throw error;

    const itens = await Promise.all(
      (data ?? []).map(async (item) => {
        if (item.tipo !== 'edicao' || !item.organizacao_id) return { ...item, atual: null };
        const { data: atual } = await db.rpc('moderacao_obter_organizacao', { p_id: item.organizacao_id });
        return { ...item, atual: atual ?? null };
      }),
    );

    return NextResponse.json({ total: count ?? 0, pagina, porPagina, itens }, { headers: SEM_CACHE });
  } catch (e) {
    console.error('Erro em GET /api/moderacao/fila:', e);
    return NextResponse.json({ codigo: 'erro_interno', mensagem: 'Erro inesperado.' }, { status: 500, headers: SEM_CACHE });
  }
}