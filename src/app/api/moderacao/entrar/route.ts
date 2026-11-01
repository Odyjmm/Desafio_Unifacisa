import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clienteDaSessao, mesmaOrigem } from '@/lib/supabase/sessao';
import { ipDe } from '@/lib/seguranca/ip';
import { dentroDoLimite } from '@/lib/seguranca/limiteMemoria';

const SEM_CACHE = { 'Cache-Control': 'no-store' };
const resposta = (corpo: Record<string, unknown>, status = 200) =>
  NextResponse.json(corpo, { status, headers: SEM_CACHE });

const esquema = z.object({ email: z.string().trim().toLowerCase().email().max(160), senha: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    if (!mesmaOrigem(req)) return resposta({ codigo: 'origem_invalida' }, 403);
    if (!dentroDoLimite(`login:${ipDe(req)}`, 10, 60_000)) {
      return resposta({ codigo: 'limite', mensagem: 'Muitas tentativas. Aguarde um minuto.' }, 429);
    }
    const corpo = esquema.safeParse(await req.json().catch(() => null));
    if (!corpo.success) return resposta({ codigo: 'dados_invalidos', mensagem: 'Informe e-mail e senha.' }, 422);

    const db = await clienteDaSessao();
    const { error } = await db.auth.signInWithPassword({ email: corpo.data.email, password: corpo.data.senha });
    if (error) return resposta({ codigo: 'credenciais_invalidas', mensagem: 'E-mail ou senha incorretos.' }, 401);

    const { data: moderador } = await db.rpc('e_moderador');
    if (moderador !== true) {
      await db.auth.signOut();
      return resposta({ codigo: 'sem_permissao', mensagem: 'Este usuário não tem permissão de moderador.' }, 403);
    }
    return resposta({ codigo: 'ok', moderador: true });
  } catch (e) {
    console.error('Erro em POST /api/moderacao/entrar:', e);
    return resposta({ codigo: 'erro_interno', mensagem: 'Erro inesperado.' }, 500);
  }
}