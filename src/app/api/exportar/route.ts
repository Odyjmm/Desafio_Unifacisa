import { NextResponse } from 'next/server';
import { montarCsv, type Coluna } from '@/lib/exportacao/csv';
import { clientePublico } from '@/lib/supabase/publico';
import { ipDe } from '@/lib/seguranca/ip';
import { dentroDoLimite } from '@/lib/seguranca/limiteMemoria';

type Linha = Record<string, unknown>;

const COLUNAS: Coluna<Linha>[] = [
  { titulo: 'Nome', valor: (l) => l.nome },
  { titulo: 'Razão social', valor: (l) => l.razao_social },
  { titulo: 'CNPJ', valor: (l) => l.cnpj },
  { titulo: 'Natureza jurídica', valor: (l) => l.natureza_juridica },
  { titulo: 'Áreas de atuação', valor: (l) => l.areas },
  { titulo: 'Públicos atendidos', valor: (l) => l.publicos },
  { titulo: 'Município', valor: (l) => l.municipio },
  { titulo: 'Bairro', valor: (l) => l.bairro },
  { titulo: 'Endereço', valor: (l) => l.endereco_completo },
  { titulo: 'CEP', valor: (l) => l.cep },
  { titulo: 'Latitude', valor: (l) => l.latitude },
  { titulo: 'Longitude', valor: (l) => l.longitude },
  { titulo: 'Site', valor: (l) => l.site_url },
  { titulo: 'Demandas', valor: (l) => l.demandas },
  { titulo: 'Situação do CNPJ', valor: (l) => l.situacao_cadastral },
  { titulo: 'Status de verificação', valor: (l) => l.status_verificacao },
  { titulo: 'Atualizado em', valor: (l) => l.atualizado_em },
];

const SELECT = [
  'nome', 'razao_social', 'cnpj', 'natureza_juridica', 'areas', 'publicos', 'municipio', 'bairro',
  'endereco_completo', 'cep', 'latitude', 'longitude', 'site_url', 'demandas', 'situacao_cadastral',
  'status_verificacao', 'atualizado_em',
].join(',');

const ids = (v: string | null) =>
  (v ?? '').split(',').map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 30);

export async function GET(req: Request) {
  try {
    if (!dentroDoLimite(`exportar:${ipDe(req)}`, 6, 60_000)) {
      return NextResponse.json({ codigo: 'limite', mensagem: 'Muitos downloads seguidos. Aguarde um minuto.' }, { status: 429 });
    }
    const p = new URL(req.url).searchParams;
    const municipios = ids(p.get('municipios'));
    const areas = ids(p.get('areas'));

    const db = clientePublico();
    const linhas: Linha[] = [];
    const TAMANHO = 500;
    for (let de = 0; ; de += TAMANHO) {
      let q = db.from('v_organizacoes_publicas').select(SELECT).order('municipio').order('nome').order('cnpj');
      if (municipios.length) q = q.in('municipio_id', municipios);
      if (areas.length) q = q.overlaps('area_ids', areas);
      const { data, error } = await q.range(de, de + TAMANHO - 1);
      if (error) throw error;
      linhas.push(...((data as unknown as Linha[]) ?? []));
      if (!data || data.length < TAMANHO) break;
    }

    const hoje = new Date().toISOString().slice(0, 10);
    return new NextResponse(montarCsv(linhas, COLUNAS), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="organizacoes-${hoje}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('Erro em GET /api/exportar:', e);
    return NextResponse.json({ codigo: 'erro_interno', mensagem: 'Erro inesperado.' }, { status: 500 });
  }
}