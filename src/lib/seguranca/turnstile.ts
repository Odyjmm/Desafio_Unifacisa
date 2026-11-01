export async function verificarTurnstile(
  token: string | undefined,
  ip: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const segredo = process.env.TURNSTILE_SECRET_KEY;
  if (!segredo) return process.env.NODE_ENV !== 'production';
  if (!token) return false;
  try {
    const corpo = new URLSearchParams({ secret: segredo, response: token });
    if (ip && ip !== 'desconhecido') corpo.set('remoteip', ip);
    const resp = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: corpo,
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return false;
    const json = (await resp.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}