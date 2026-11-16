import { NextResponse } from 'next/server';
import { barrar, db, erro, lerCorpo } from '@/lib/publico/rota';
import { paraRpc } from '@/lib/publico/filtros';

export async function POST(req: Request) {
  const negado = barrar(req, 'indicadores', 30);
  if (negado) return negado;
  try {
    const p = paraRpc(await lerCorpo(req));
    const { data, error } = await db().rpc('indicadores', { p_municipio_ids: p.p_municipio_ids, p_area_ids: p.p_area_ids });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('publico/indicadores', e);
    return erro('erro_interno', 'Não foi possível carregar os indicadores agora.', 500);
  }
}
