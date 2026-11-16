import { NextResponse } from 'next/server';
import { barrar, db, erro } from '@/lib/publico/rota';

// Ficha de UMA organização, com contatos. Limite menor que o da busca, para dificultar a coleta em massa.
const COLUNAS = [
  'id', 'nome', 'nome_secundario', 'razao_social', 'nome_fantasia', 'cnpj', 'situacao_cadastral', 'municipio', 'bairro',
  'endereco_completo', 'latitude', 'longitude', 'natureza_juridica', 'areas', 'publicos', 'tipos_parceria', 'demandas',
  'telefone_1', 'telefone_2', 'email', 'site_url', 'instagram', 'facebook', 'atualizado_em',
].join(',');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const negado = barrar(req, 'ficha', 15);
  if (negado) return negado;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return erro('id_invalido', 'Identificador inválido.', 400);
  try {
    const { data, error } = await db().from('v_organizacoes_publicas').select(COLUNAS).eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return erro('nao_encontrada', 'Organização não encontrada.', 404);
    return NextResponse.json(data);
  } catch (e) {
    console.error('publico/ficha', e);
    return erro('erro_interno', 'Não foi possível carregar a ficha agora.', 500);
  }
}
