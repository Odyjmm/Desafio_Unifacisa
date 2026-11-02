export interface Coluna<T> {
  titulo: string;
  valor: (linha: T) => unknown;
}

function celula(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = Array.isArray(v) ? v.join(' | ') : String(v);
  s = s.replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  if (/[";]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function montarCsv<T>(linhas: T[], colunas: Coluna<T>[]): string {
  const cab = colunas.map((c) => celula(c.titulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => celula(c.valor(l))).join(';'));
  return '﻿' + [cab, ...corpo].join('\r\n') + '\r\n';
}
