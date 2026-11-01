import { createHash } from 'node:crypto';

export function ipDe(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  if (encaminhado) return encaminhado.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'desconhecido';
}

export function hashDoIp(ip: string): string {
  const sal = process.env.RATE_LIMIT_SALT;
  if (!sal && process.env.NODE_ENV === 'production') {
    throw new Error('Configure RATE_LIMIT_SALT nas variáveis de ambiente');
  }
  return createHash('sha256').update(`${sal ?? 'dev'}|${ip}`).digest('hex');
}