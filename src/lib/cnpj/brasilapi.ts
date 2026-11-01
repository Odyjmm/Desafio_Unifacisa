import { classificarNatureza, type ResultadoNatureza } from './naturezaJuridica';
import { cnpjValido, ehMatriz, limparCnpj, raizCnpj } from './validar';

export type SituacaoCadastral = 'ativa' | 'suspensa' | 'inapta' | 'baixada' | 'nula';

export interface DadosCnpj {
  cnpj: string;
  cnpjRaiz: string;
  ehMatriz: boolean;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: SituacaoCadastral | null;
  natureza: { codigo: string; descricao: string; classificacao: ResultadoNatureza };
  cnae: { codigo: string; descricao: string };
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
  };
  telefone: string;
  email: string;
  anoInicioAtividade: number | null;
}

export type ResultadoConsulta =
  | { ok: true; dados: DadosCnpj }
  | { ok: false; erro: 'cnpj_invalido' | 'nao_encontrado' | 'limite' | 'indisponivel'; detalhe?: string };

const URL_BASE = process.env.BRASILAPI_URL || 'https://brasilapi.com.br/api/cnpj/v1';

const USER_AGENT = 'DesafioUnifacisa/1.0 (projeto academico UNIFACISA/NUPEX)';

const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

export function situacaoDe(bruto: Record<string, unknown>): SituacaoCadastral | null {
  const desc = texto(bruto.descricao_situacao_cadastral).toUpperCase();
  const mapa: Record<string, SituacaoCadastral> = {
    ATIVA: 'ativa', SUSPENSA: 'suspensa', INAPTA: 'inapta', BAIXADA: 'baixada', NULA: 'nula',
  };
  if (mapa[desc]) return mapa[desc];
  const porCodigo: Record<string, SituacaoCadastral> = { '1': 'nula', '2': 'ativa', '3': 'suspensa', '4': 'inapta', '8': 'baixada' };
  return porCodigo[texto(bruto.codigo_situacao_cadastral)] ?? null;
}

export function normalizarResposta(bruto: Record<string, unknown>, cnpjConsultado: string): DadosCnpj {
  const cnpj = limparCnpj(texto(bruto.cnpj) || cnpjConsultado);
  const codigoNat = texto(bruto.codigo_natureza_juridica);
  const descNat = texto(bruto.natureza_juridica);
  return {
    cnpj,
    cnpjRaiz: raizCnpj(cnpj),
    ehMatriz: ehMatriz(cnpj),
    razaoSocial: texto(bruto.razao_social),
    nomeFantasia: texto(bruto.nome_fantasia),
    situacaoCadastral: situacaoDe(bruto),
    natureza: { codigo: codigoNat, descricao: descNat, classificacao: classificarNatureza(codigoNat, descNat) },
    cnae: { codigo: texto(bruto.cnae_fiscal).replace(/\D/g, ''), descricao: texto(bruto.cnae_fiscal_descricao) },
    endereco: {
      cep: texto(bruto.cep).replace(/\D/g, '').padStart(8, '0').slice(0, 8),
      logradouro: texto(bruto.logradouro),
      numero: texto(bruto.numero),
      complemento: texto(bruto.complemento),
      bairro: texto(bruto.bairro),
      municipio: texto(bruto.municipio),
      uf: texto(bruto.uf).toUpperCase(),
    },
    telefone: texto(bruto.ddd_telefone_1).replace(/\D/g, ''),
    email: texto(bruto.email).toLowerCase(),
    anoInicioAtividade: Number(texto(bruto.data_inicio_atividade).slice(0, 4)) || null,
  };
}

export async function consultarCnpj(
  entrada: string,
  opcoes: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<ResultadoConsulta> {
  const cnpj = limparCnpj(entrada);
  if (!cnpjValido(cnpj)) return { ok: false, erro: 'cnpj_invalido' };

  const f = opcoes.fetchImpl ?? fetch;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), opcoes.timeoutMs ?? 8000);
  try {
    const resp = await f(`${URL_BASE}/${cnpj}`, {
      signal: controle.signal,
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });
    if (resp.status === 404 || resp.status === 400) return { ok: false, erro: 'nao_encontrado' };
    if (resp.status === 429) return { ok: false, erro: 'limite' };
    if (!resp.ok) return { ok: false, erro: 'indisponivel', detalhe: `HTTP ${resp.status}` };
    const bruto = (await resp.json()) as Record<string, unknown>;
    return { ok: true, dados: normalizarResposta(bruto, cnpj) };
  } catch (e) {
    const causa = (e as { cause?: { code?: string; message?: string } })?.cause;
    const detalhe = [(e as Error)?.name, (e as Error)?.message, causa?.code ?? causa?.message].filter(Boolean).join(' | ');
    return { ok: false, erro: 'indisponivel', detalhe };
  } finally {
    clearTimeout(timer);
  }
}