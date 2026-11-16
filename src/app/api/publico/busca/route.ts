import { NextResponse } from 'next/server';
import { barrar, db, erro, lerCorpo } from '@/lib/publico/rota';
import { inteiroEntre, paraRpc } from '@/lib/publico/filtros';

// Lista paginada. O site mostra WhatsApp e e-mail no cartão, então os contatos seguem na lista;
// a proteção é: só chamadas do próprio site, limite por IP e no máximo 20 itens por consulta.

export async function POST(req: Request) {
  const negado = barrar(req, 'busca', 60);
  if (negado) return negado;
  try {
    const c = await lerCorpo(req);
    const { data, error } = await db().rpc('buscar_organizacoes', {
      ...paraRpc(c),
      p_limite: inteiroEntre(c.limite, 1, 20, 20),
      p_deslocamento: inteiroEntre(c.deslocamento, 0, 100_000, 0),
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error('publico/busca', e);
    return erro('erro_interno', 'Não foi possível buscar agora.', 500);
  }
}
