// Só aceita chamadas feitas pelo próprio site (navegador abrindo uma página do mesmo domínio).
// Obs.: cabeçalhos podem ser forjados por programas fora do navegador; isto barra o uso casual
// (outro site, curl, a chave pública do Supabase) e, junto com o limite por IP, encarece a raspagem.
export function veioDoSite(req: Request, aceitarNavegacaoDireta = false): boolean {
  const s = req.headers.get('sec-fetch-site');
  if (s === 'same-origin') return true;
  if (aceitarNavegacaoDireta && s === 'none') return true;
  return false;
}
