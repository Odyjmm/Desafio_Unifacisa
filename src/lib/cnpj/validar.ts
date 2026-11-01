const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function limparCnpj(entrada: string): string {
  return (entrada ?? '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

function digito(base: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) {
    soma += (base.charCodeAt(i) - 48) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(entrada: string): boolean {
  const c = limparCnpj(entrada);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(.)\1{13}$/.test(c)) return false; // 00000000000000, 11111111111111...
  const d1 = digito(c.slice(0, 12), PESOS_DV1);
  const d2 = digito(c.slice(0, 12) + d1, PESOS_DV2);
  return c.endsWith(`${d1}${d2}`);
}

export function formatarCnpj(entrada: string): string {
  const c = limparCnpj(entrada);
  if (c.length !== 14) return entrada;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

export function raizCnpj(entrada: string): string {
  return limparCnpj(entrada).slice(0, 8);
}

export function ehMatriz(entrada: string): boolean {
  return limparCnpj(entrada).slice(8, 12) === '0001';
}

export function cnpjDaMatriz(entrada: string): string | null {
  const c = limparCnpj(entrada);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return null;
  const base = c.slice(0, 8) + '0001';
  const d1 = digito(base, PESOS_DV1);
  const d2 = digito(base + d1, PESOS_DV2);
  return `${base}${d1}${d2}`;
}