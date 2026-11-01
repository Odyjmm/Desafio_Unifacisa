export type CategoriaProjeto =
  | 'Organizações da Sociedade Civil (OSC)'
  | 'Organizações Sociais (OS)'
  | 'Fundações privadas';

export type ResultadoNatureza =
  | { situacao: 'mapeada'; categoria: CategoriaProjeto }
  | { situacao: 'revisao'; motivo: string }
  | { situacao: 'nao_aceita'; motivo: string };

const MAPA: Record<string, CategoriaProjeto> = {
  '3999': 'Organizações da Sociedade Civil (OSC)',
  '3220': 'Organizações da Sociedade Civil (OSC)',
  '3301': 'Organizações Sociais (OS)',
  '3069': 'Fundações privadas',
};

const REVISAO: Record<string, string> = {
  '2143': 'Cooperativa',
  '3077': 'Serviço Social Autônomo',
  '3131': 'Entidade Sindical',
  '3204': 'Estabelecimento, no Brasil, de Fundação ou Associação Estrangeiras',
  '3212': 'Fundação ou Associação Domiciliada no Exterior',
  '3239': 'Comunidade Indígena',
  '3247': 'Fundo Privado',
};

export function normalizarCodigoNatureza(codigo: number | string | null | undefined): string {
  return String(codigo ?? '').replace(/\D/g, '').padStart(4, '0').slice(0, 4);
}

export function classificarNatureza(
  codigo: number | string | null | undefined,
  descricao?: string | null,
): ResultadoNatureza {
  const c = normalizarCodigoNatureza(codigo);
  const nome = descricao ? ` (${descricao})` : '';

  if (MAPA[c]) return { situacao: 'mapeada', categoria: MAPA[c] };
  if (REVISAO[c]) {
    return { situacao: 'revisao', motivo: `${REVISAO[c]}${nome}: a equipe confere se entra na base.` };
  }

  const grupo = c[0];
  if (['1', '2', '4', '5'].includes(grupo)) {
    return {
      situacao: 'nao_aceita',
      motivo: `Natureza jurídica${nome} fora do escopo: a base reúne organizações do terceiro setor.`,
    };
  }

  return { situacao: 'revisao', motivo: `Natureza jurídica${nome} não prevista: a equipe confere.` };
}
