import { NextResponse } from 'next/server';
import { consultarCnpj, type DadosCnpj } from '@/lib/cnpj/brasilapi';
import { cnpjValido, limparCnpj, raizCnpj, ehMatriz } from '@/lib/cnpj/validar';
import { esquemaCadastro, errosDoEsquema } from '@/lib/cadastro/esquema';
import { montarAlteracao, type MunicipioRef } from '@/lib/cadastro/montar';
import { clienteAdmin } from '@/lib/supabase/admin';
import { hashDoIp, ipDe } from '@/lib/seguranca/ip';
import { verificarTurnstile } from '@/lib/seguranca/turnstile';

const MAX_ENVIOS_POR_HORA = 5;
const resposta = (corpo: Record<string, unknown>, status = 200) =>
  NextResponse.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  try {
    let corpo: unknown;
    try {
      corpo = await req.json();
    } catch {
      return resposta({ codigo: 'corpo_invalido', mensagem: 'Requisição inválida.' }, 400);
    }
    const analise = esquemaCadastro.safeParse(corpo);
    if (!analise.success) {
      return resposta({ codigo: 'dados_invalidos', erros: errosDoEsquema(analise.error) }, 422);
    }
    const e = analise.data;
    const cnpj = limparCnpj(e.cnpj);
    if (!cnpjValido(cnpj)) {
      return resposta({ codigo: 'dados_invalidos', erros: [{ campo: 'cnpj', mensagem: 'CNPJ inválido.' }] }, 422);
    }

    const ip = ipDe(req);
    if (!(await verificarTurnstile(e.turnstileToken, ip))) {
      return resposta({ codigo: 'captcha', mensagem: 'Não foi possível confirmar que você não é um robô. Tente novamente.' }, 403);
    }
    const ipHash = hashDoIp(ip);
    const db = clienteAdmin();

    const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString();
    const { count: recentes, error: eLim } = await db
      .from('alteracoes_pendentes')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('enviado_em', umaHoraAtras);
    if (eLim) throw eLim;
    if ((recentes ?? 0) >= MAX_ENVIOS_POR_HORA) {
      return resposta({ codigo: 'limite', mensagem: 'Muitos envios em pouco tempo. Tente novamente mais tarde.' }, 429);
    }

    const { data: mun, error: eMun } = await db
      .from('municipios')
      .select('id,nome,latitude,longitude,na_rmcg')
      .eq('id', e.municipioId)
      .maybeSingle();
    if (eMun) throw eMun;
    if (!mun || !mun.na_rmcg) {
      return resposta({ codigo: 'dados_invalidos', erros: [{ campo: 'municipioId', mensagem: 'Selecione um município da região.' }] }, 422);
    }
    const municipio: MunicipioRef = {
      id: mun.id as number,
      nome: mun.nome as string,
      latitude: mun.latitude == null ? null : Number(mun.latitude),
      longitude: mun.longitude == null ? null : Number(mun.longitude),
    };

    const { data: existente, error: eEx } = await db
      .from('organizacoes')
      .select('id')
      .eq('cnpj', cnpj)
      .maybeSingle();
    if (eEx) throw eEx;
    const tipo = existente ? 'edicao' : 'criacao';

    let receita: DadosCnpj | null = null;
    let naturezaJuridicaId: number | null = null;

    if (tipo === 'criacao') {
      const { data: mesmaRaiz, error: eRaiz } = await db
        .from('organizacoes')
        .select('id')
        .like('cnpj', `${raizCnpj(cnpj)}%`)
        .limit(1);
      if (eRaiz) throw eRaiz;
      if (mesmaRaiz && mesmaRaiz.length > 0) {
        return resposta({ codigo: 'raiz_cadastrada', mensagem: 'Esta entidade já consta na base por outra unidade (matriz/filial). Use o CNPJ já cadastrado.' }, 409);
      }

      const consulta = await consultarCnpj(cnpj);
      if (consulta.ok) {
        receita = consulta.dados;
        if (receita.situacaoCadastral !== 'ativa') {
          return resposta({ codigo: 'inativo', mensagem: 'Só são aceitos CNPJs com situação cadastral ativa.' }, 422);
        }
        if (receita.natureza.classificacao.situacao === 'nao_aceita') {
          return resposta({ codigo: 'natureza_nao_aceita', mensagem: receita.natureza.classificacao.motivo }, 422);
        }
        if (!ehMatriz(cnpj)) {
          return resposta({ codigo: 'filial', mensagem: 'Este CNPJ é de uma filial. Cadastre a matriz.' }, 422);
        }
      } else if (consulta.erro === 'nao_encontrado') {
        return resposta({ codigo: 'nao_encontrado', mensagem: 'Este CNPJ não foi localizado na Receita Federal.' }, 422);
      } else if (!e.razaoSocial) {
        // Receita fora do ar: só segue se a pessoa informou a razão social à mão
        return resposta({ codigo: 'consulta_indisponivel', mensagem: 'A consulta à Receita está indisponível. Informe a razão social e tente de novo.' }, 503);
      }

      if (receita?.natureza.classificacao.situacao === 'mapeada') {
        const { data: nat, error: eNat } = await db
          .from('naturezas_juridicas')
          .select('id')
          .eq('descricao', receita.natureza.classificacao.categoria)
          .maybeSingle();
        if (eNat) throw eNat;
        naturezaJuridicaId = (nat?.id as number | undefined) ?? null;
      } else if (e.naturezaJuridicaId) {
        const { data: nat, error: eNat } = await db
          .from('naturezas_juridicas')
          .select('id')
          .eq('id', e.naturezaJuridicaId)
          .maybeSingle();
        if (eNat) throw eNat;
        naturezaJuridicaId = (nat?.id as number | undefined) ?? null;
      }
    }

    const montagem = montarAlteracao(e, { tipo, cnpj, receita, naturezaJuridicaId, municipio, agora: new Date() });
    if (!montagem.ok) {
      return resposta({ codigo: 'dados_invalidos', erros: [{ campo: montagem.campo, mensagem: montagem.mensagem }] }, 422);
    }

    const { error: eIns } = await db.from('alteracoes_pendentes').insert({
      tipo: montagem.tipo,
      cnpj,
      organizacao_id: existente ? (existente.id as string) : null,
      dados: montagem.dados,
      contato_remetente: montagem.contatoRemetente,
      ip_hash: ipHash,
    });
    if (eIns) {
      if ((eIns as { code?: string }).code === '23505') {
        return resposta({ codigo: 'ja_em_analise', mensagem: 'Já existe um envio deste CNPJ aguardando validação da equipe.' }, 409);
      }
      throw eIns;
    }

    return resposta(
      {
        codigo: 'enviado',
        tipo: montagem.tipo,
        mensagem: 'Recebemos o seu envio. A equipe vai validar os dados antes de publicar na base.',
      },
      201,
    );
  } catch (err) {
    console.error('Erro em POST /api/cadastro:', err);
    return resposta({ codigo: 'erro_interno', mensagem: 'Erro inesperado. Tente novamente em instantes.' }, 500);
  }
}