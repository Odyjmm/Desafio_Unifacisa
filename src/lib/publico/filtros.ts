// Valida o corpo JSON das rotas públicas e converte nos parâmetros das funções do banco.
const inteiros = (v: unknown, max = 30): number[] | null => {
  if (!Array.isArray(v)) return null;
  const l = v.map(Number).filter((n) => Number.isInteger(n) && n > 0 && n < 1_000_000).slice(0, max);
  return l.length ? l : null;
};

export type CorpoFiltros = { texto?: unknown; municipios?: unknown; areas?: unknown; publicos?: unknown; tiposParceria?: unknown; limite?: unknown; deslocamento?: unknown };

export function paraRpc(c: CorpoFiltros) {
  const texto = typeof c.texto === 'string' ? c.texto.trim().slice(0, 100) : '';
  return {
    p_texto: texto || null,
    p_municipio_ids: inteiros(c.municipios),
    p_area_ids: inteiros(c.areas),
    p_publico_ids: inteiros(c.publicos),
    p_tipo_parceria_ids: inteiros(c.tiposParceria),
  };
}

export const inteiroEntre = (v: unknown, min: number, max: number, padrao: number) => {
  const n = Number(v);
  return Number.isInteger(n) ? Math.min(Math.max(n, min), max) : padrao;
};
