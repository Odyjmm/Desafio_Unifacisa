export function semAcento(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatarTelefone(entrada: string): string | null {
  let d = (entrada ?? '').replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2); // código do país
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return null;
}

export function limparCep(entrada: string): string | null {
  const d = (entrada ?? '').replace(/\D/g, '');
  return d.length === 8 ? d : null;
}

export interface LinksClassificados {
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  invalidos: string[];
}

function comoUrl(txt: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(txt) ? txt : `https://${txt}`);
    if (!u.hostname.includes('.') || /\s/.test(txt)) return null;
    return u;
  } catch {
    return null;
  }
}

export function classificarLinks(entradas: string[]): LinksClassificados {
  const r: LinksClassificados = { site: null, instagram: null, facebook: null, invalidos: [] };
  for (const bruto of entradas) {
    const txt = (bruto ?? '').trim();
    if (!txt) continue;

    if (/^@[A-Za-z0-9._]{2,30}$/.test(txt)) {
      r.instagram ??= `https://www.instagram.com/${txt.slice(1)}`;
      continue;
    }
    const u = comoUrl(txt);
    if (!u) {
      r.invalidos.push(txt);
      continue;
    }
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const link = u.href.replace(/\/$/, '');
    if (host === 'instagram.com') r.instagram ??= link;
    else if (host === 'facebook.com' || host === 'fb.com' || host.endsWith('.facebook.com')) r.facebook ??= link;
    else r.site ??= link;
  }
  return r;
}

export function montarEndereco(logradouro: string, numero?: string, complemento?: string): string {
  const rua = logradouro.trim();
  const n = (numero ?? '').trim() || 'S/N';
  const comp = (complemento ?? '').trim();
  return comp ? `${rua}, ${n} - ${comp}` : `${rua}, ${n}`;
}