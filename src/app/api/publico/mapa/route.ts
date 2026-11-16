import { NextResponse } from 'next/server';
import { barrar, db, erro, lerCorpo } from '@/lib/publico/rota';
import { paraRpc } from '@/lib/publico/filtros';

export async function POST(req: Request) {
  const negado = barrar(req, 'mapa', 60);
  if (negado) return negado;
  try {
    const { data, error } = await db().rpc('marcadores_mapa', paraRpc(await lerCorpo(req)));
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error('publico/mapa', e);
    return erro('erro_interno', 'Não foi possível carregar o mapa agora.', 500);
  }
}
