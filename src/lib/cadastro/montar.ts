import type { DadosCnpj } from '../cnpj/brasilapi';
import type { EntradaCadastro } from './esquema';
import { distanciaKm, LIMITE_KM_DA_SEDE } from './geo';
import { classificarLinks, formatarTelefone, limparCep, montarEndereco } from './texto';

export interface MunicipioRef {
  id: number;
  nome: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ContextoMontagem {
  tipo: 'criacao' | 'edicao';
  cnpj: string;
  receita: DadosCnpj | null;
  naturezaJuridicaId: number | null;
  municipio: MunicipioRef;
  agora: Date;
}

export type ResultadoMontagem =
  | { ok: true; cnpj: string; tipo: 'criacao' | 'edicao'; dados: Record<string, unknown>; contatoRemetente: string }
  | { ok: false; campo: string; mensagem: string };

const erro = (campo: string, mensagem: string): ResultadoMontagem => ({ ok: false, campo, mensagem });

export function montarAlteracao(e: EntradaCadastro, ctx: ContextoMontagem): ResultadoMontagem {
  const telefone = formatarTelefone(e.telefone);
  if (!telefone) return erro('telefone', 'Informe o telefone com DDD.');

  const cep = limparCep(e.cep);
  if (!cep) return erro('cep', 'CEP inválido: informe os 8 dígitos.');

  if (e.latitude !== undefined && e.longitude !== undefined) {
    const { latitude: sedeLat, longitude: sedeLon } = ctx.municipio;
    if (sedeLat != null && sedeLon != null) {
      const km = distanciaKm(e.latitude, e.longitude, sedeLat, sedeLon);
      if (km > LIMITE_KM_DA_SEDE) {
        return erro('latitude', `O ponto marcado no mapa está longe de ${ctx.municipio.nome}. Arraste o marcador até o endereço da instituição.`);
      }
    }
  }

  const links = e.links ? classificarLinks(e.links) : null;
  if (links && links.invalidos.length > 0) {
    return erro('links', `Link inválido: ${links.invalidos[0]}`);
  }

  const dados: Record<string, unknown> = {
    municipio_id: ctx.municipio.id,
    bairro_nome: e.bairro,
    endereco_completo: montarEndereco(e.logradouro, e.numero, e.complemento),
    cep,
    responsavel: e.responsavel,
    cargo_responsavel: e.cargoResponsavel,
    telefone_1: telefone,
    email: e.email,
    area_atuacao_ids: [...new Set(e.areaIds)],
    publicos_alvo_ids: [...new Set(e.publicoIds)],
    aceite_declaracao_em: ctx.agora.toISOString(),
  };

  if (e.latitude !== undefined && e.longitude !== undefined) {
    dados.latitude = Number(e.latitude.toFixed(6));
    dados.longitude = Number(e.longitude.toFixed(6));
  }
  if (e.nomeFantasia !== undefined) dados.nome_fantasia = e.nomeFantasia || null;
  if (e.demandas !== undefined) dados.demandas = e.demandas || null;
  if (e.tiposParceriaIds !== undefined) dados.tipos_parceria_ids = [...new Set(e.tiposParceriaIds)];
  if (links) {
    dados.site_url = links.site;
    dados.instagram = links.instagram;
    dados.facebook = links.facebook;
  }

  if (ctx.tipo === 'criacao') {
    const razao = ctx.receita?.razaoSocial || e.razaoSocial?.trim();
    if (!razao) return erro('razaoSocial', 'Informe a razão social.');
    dados.razao_social = razao;
    if (ctx.naturezaJuridicaId != null) dados.natureza_juridica_id = ctx.naturezaJuridicaId;

    if (ctx.receita) {
      dados._fonte_cnpj = 'brasilapi';
      dados._natureza_receita = `${ctx.receita.natureza.codigo} ${ctx.receita.natureza.descricao}`.trim();
      if (ctx.receita.situacaoCadastral) {
        dados.situacao_cadastral = ctx.receita.situacaoCadastral;
        dados.situacao_verificada_em = ctx.agora.toISOString();
      }
      if (ctx.naturezaJuridicaId == null || ctx.receita.natureza.classificacao.situacao !== 'mapeada') {
        dados._natureza_revisar = true;
      }
    } else {
      dados._fonte_cnpj = 'manual (consulta indisponível): conferir CNPJ, razão social e natureza';
      dados._natureza_revisar = true;
    }
  }

  return {
    ok: true,
    cnpj: ctx.cnpj,
    tipo: ctx.tipo,
    dados,
    contatoRemetente: `${e.responsavel} (${e.cargoResponsavel}) — ${e.email} — ${telefone}`,
  };
}