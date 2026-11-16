import { NextResponse } from 'next/server';
import { barrar, db, erro, lerCorpo } from '@/lib/publico/rota';
import { paraRpc } from '@/lib/publico/filtros';

export async function POST(req: Request) {
  const negado = barrar(req, 'resumo', 60);
  if (negado) return negado;
  try {
    const { data, error } = await db().rpc('resumo_mapa_municipios', paraRpc(await lerCorpo(req)));
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error('publico/resumo', e);
    return erro('erro_interno', 'Não foi possível carregar o mapa agora.', 500);
  }
}
