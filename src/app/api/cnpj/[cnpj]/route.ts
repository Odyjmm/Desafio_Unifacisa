import { NextResponse } from 'next/server';
import { consultarCnpj } from '@/lib/cnpj/brasilapi';
import { cnpjDaMatriz, cnpjValido, formatarCnpj, limparCnpj, raizCnpj } from '@/lib/cnpj/validar';
import { semAcento } from '@/lib/cadastro/texto';
import { clientePublico } from '@/lib/supabase/publico';
import { ipDe } from '@/lib/seguranca/ip';
import { dentroDoLimite } from '@/lib/seguranca/limiteMemoria';

const SEM_CACHE = { 'Cache-Control': 'no-store' };
const resposta = (corpo: Record<string, unknown>, status = 200) =>
  NextResponse.json(corpo, { status, headers: SEM_CACHE });

const COLUNAS_FICHA =
  'id,cnpj,razao_social,nome_fantasia,natureza_juridica_id,municipio_id,bairro,endereco_completo,cep,' +
  'latitude,longitude,telefone_1,telefone_2,email,site_url,instagram,facebook,demandas,' +
  'area_ids,publico_ids,tipo_parceria_ids,status_verificacao,atualizado_em';

export async function GET(req: Request, ctx: { params: Promise<{ cnpj: string }> }) {
  try {
    if (!dentroDoLimite(`cnpj:${ipDe(req)}`, 20, 60_000)) {
      return resposta({ codigo: 'limite', mensagem: 'Muitas consultas seguidas. Aguarde um minuto.' }, 429);
    }

    const { cnpj: entrada } = await ctx.params;
    const cnpj = limparCnpj(entrada);
    if (!cnpjValido(cnpj)) {
      return resposta({ codigo: 'cnpj_invalido', mensagem: 'CNPJ inválido. Confira os números digitados.' }, 400);
    }

    const db = clientePublico();

    const { data: existente, error: e1 } = await db
      .from('v_organizacoes_publicas')
      .select(COLUNAS_FICHA)
      .eq('cnpj', cnpj)
      .maybeSingle();
    if (e1) throw e1;
    if (existente) {
      return resposta({
        codigo: 'edicao',
        mensagem: 'Esta instituição já consta na base. Confira e atualize os dados; a equipe valida a alteração.',
        dados: existente,
      });
    }

    const { data: mesmaRaiz, error: e2 } = await db
      .from('v_organizacoes_publicas')
      .select('cnpj')
      .like('cnpj', `${raizCnpj(cnpj)}%`)
      .limit(1);
    if (e2) throw e2;
    if (mesmaRaiz && mesmaRaiz.length > 0) {
      const cnpjMatriz = mesmaRaiz[0].cnpj as string;
      return resposta({
        codigo: 'raiz_cadastrada',
        mensagem: 'Matriz e filiais são reunidas em um único registro, e a entidade já consta na base. Para atualizar, use o CNPJ já cadastrado.',
        cnpjMatriz,
        cnpjMatrizFormatado: formatarCnpj(cnpjMatriz),
      });
    }

    const consulta = await consultarCnpj(cnpj);
    if (!consulta.ok) {
      if (consulta.erro === 'nao_encontrado') {
        return resposta({ codigo: 'nao_encontrado', mensagem: 'Este CNPJ não foi localizado na base da Receita Federal.' }, 404);
      }
      if (consulta.erro === 'cnpj_invalido') {
        return resposta({ codigo: 'cnpj_invalido', mensagem: 'CNPJ inválido.' }, 400);
      }
      console.error('Consulta de CNPJ indisponível:', consulta.erro, 'detalhe' in consulta ? consulta.detalhe : '');
      return resposta({
        codigo: 'consulta_indisponivel',
        mensagem: 'Não foi possível consultar a Receita agora. Você pode preencher os dados manualmente; a equipe confere o CNPJ.',
        dados: { cnpj },
      });
    }
    const r = consulta.dados;

    if (r.situacaoCadastral !== 'ativa') {
      return resposta({
        codigo: 'inativo',
        mensagem: 'Só são aceitos CNPJs com situação cadastral ativa.',
        situacaoCadastral: r.situacaoCadastral,
      });
    }
    if (r.natureza.classificacao.situacao === 'nao_aceita') {
      return resposta({ codigo: 'natureza_nao_aceita', mensagem: r.natureza.classificacao.motivo });
    }
    if (!r.ehMatriz) {
      const matriz = cnpjDaMatriz(cnpj);
      return resposta({
        codigo: 'filial',
        mensagem: 'Este CNPJ é de uma filial. Cadastre a matriz: matriz e filiais ficam em um único registro.',
        cnpjMatriz: matriz,
        cnpjMatrizFormatado: matriz ? formatarCnpj(matriz) : null,
      });
    }

    const { data: municipios, error: e3 } = await db.from('municipios').select('id,nome').eq('na_rmcg', true);
    if (e3) throw e3;
    const alvo = semAcento(r.endereco.municipio);
    const municipio = (municipios ?? []).find((m) => semAcento(m.nome as string) === alvo);

    let naturezaJuridicaId: number | null = null;
    if (r.natureza.classificacao.situacao === 'mapeada') {
      const { data: nat, error: e4 } = await db
        .from('naturezas_juridicas')
        .select('id')
        .eq('descricao', r.natureza.classificacao.categoria)
        .maybeSingle();
      if (e4) throw e4;
      naturezaJuridicaId = (nat?.id as number | undefined) ?? null;
    }

    const avisos: string[] = [];
    if (!municipio) avisos.push('O endereço do CNPJ não está em um município da região. Selecione o município onde a instituição atua.');
    if (r.natureza.classificacao.situacao === 'revisao') avisos.push(r.natureza.classificacao.motivo);

    return resposta({
      codigo: 'criacao',
      mensagem: 'CNPJ ativo encontrado. Confira os dados e continue.',
      avisos,
      dados: {
        cnpj,
        razaoSocial: r.razaoSocial,
        nomeFantasia: r.nomeFantasia,
        naturezaJuridicaId,
        naturezaReceita: r.natureza.descricao,
        situacaoCadastral: r.situacaoCadastral,
        municipioId: municipio ? (municipio.id as number) : null,
        cep: r.endereco.cep,
        logradouro: r.endereco.logradouro,
        numero: r.endereco.numero,
        complemento: r.endereco.complemento,
        bairroSugerido: r.endereco.bairro,
        telefone: r.telefone,
        email: r.email,
      },
    });
  } catch (e) {
    console.error('Erro em GET /api/cnpj:', e);
    return resposta({ codigo: 'erro_interno', mensagem: 'Erro inesperado. Tente novamente em instantes.' }, 500);
  }
}