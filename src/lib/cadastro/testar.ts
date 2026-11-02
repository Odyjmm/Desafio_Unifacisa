import assert from 'node:assert/strict';
import { classificarLinks, formatarTelefone, limparCep, montarEndereco, semAcento } from './texto';
import { distanciaKm } from './geo';
import { esquemaCadastro } from './esquema';
import { montarAlteracao, type ContextoMontagem } from './montar';
import { dentroDoLimite } from '../seguranca/limiteMemoria';
import { verificarTurnstile } from '../seguranca/turnstile';
import { cnpjDaMatriz, cnpjValido } from '../cnpj/validar';
import { normalizarResposta } from '../cnpj/brasilapi';

assert.equal(semAcento('  São   José  '), 'sao jose');
assert.equal(formatarTelefone('83981380876'), '(83) 98138-0876');
assert.equal(formatarTelefone('(83) 3391-2216'), '(83) 3391-2216');
assert.equal(formatarTelefone('+55 83 98138-0876'), '(83) 98138-0876');
assert.equal(formatarTelefone('123'), null);
assert.equal(limparCep('58400-328'), '58400328');
assert.equal(limparCep('5840'), null);
assert.equal(montarEndereco('Rua Jose Maia', '123'), 'Rua Jose Maia, 123');
assert.equal(montarEndereco('Sitio Estreito', ''), 'Sitio Estreito, S/N');
assert.equal(montarEndereco('Rua A', '10', 'Sala 2'), 'Rua A, 10 - Sala 2');

const l = classificarLinks(['@cacadores_clube', 'instagram.com/outra', 'meninosdealcantil.ong.br', 'https://www.facebook.com/pagina/']);
assert.equal(l.instagram, 'https://www.instagram.com/cacadores_clube');
assert.equal(l.site, 'https://meninosdealcantil.ong.br');
assert.equal(l.facebook, 'https://www.facebook.com/pagina');
assert.deepEqual(classificarLinks(['isto nao e link']).invalidos, ['isto nao e link']);
assert.deepEqual(classificarLinks(['']), { site: null, instagram: null, facebook: null, invalidos: [] });
assert.equal(classificarLinks(['x@y']).invalidos.length, 1);

const km = distanciaKm(-7.2220, -35.8731, -7.2300, -35.8800);
assert(km > 0.5 && km < 1.5, `distância curta: ${km}`);
assert(distanciaKm(-7.2220, -35.8731, -7.1195, -34.8450) > 100);

assert.equal(cnpjDaMatriz('11222333000262'), '11222333000181');
assert(cnpjValido(cnpjDaMatriz('65479262000207')!));

const base = {
  cnpj: '65.479.262/0001-26', responsavel: 'Maria da Silva', cargoResponsavel: 'Presidente',
  email: ' CONTATO@Org.ORG ', telefone: '83981470961', cep: '58120-000', municipioId: 12,
  bairro: 'Zona Rural', logradouro: 'Sitio Doze', areaIds: [1, 3], publicoIds: [2], aceiteDeclaracao: true as const,
};
const ok = esquemaCadastro.safeParse(base);
assert(ok.success);
if (ok.success) assert.equal(ok.data.email, 'contato@org.org');
assert(!esquemaCadastro.safeParse({ ...base, aceiteDeclaracao: false }).success, 'sem aceite');
assert(!esquemaCadastro.safeParse({ ...base, areaIds: [] }).success, 'sem área');
assert(!esquemaCadastro.safeParse({ ...base, publicoIds: [] }).success, 'sem público');
assert(!esquemaCadastro.safeParse({ ...base, email: 'nao-e-email' }).success);
assert(!esquemaCadastro.safeParse({ ...base, latitude: -7.2 }).success, 'lat sem lon');
assert(!esquemaCadastro.safeParse({ ...base, areaIds: [1.5] }).success);
assert(!esquemaCadastro.safeParse({ ...base, demandas: 'x'.repeat(2001) }).success);

const receita = normalizarResposta({
  cnpj: '65479262000126', razao_social: 'ASSOCIACAO COMUNITARIA DO SITIO DOZE', nome_fantasia: '', descricao_situacao_cadastral: 'ATIVA',
  codigo_natureza_juridica: 3301, natureza_juridica: 'Organização Social (OS)', municipio: 'MASSARANDUBA', uf: 'PB', cep: '58120000',
}, '65479262000126');
const municipio = { id: 12, nome: 'Massaranduba', latitude: -7.1899, longitude: -35.7848 };
const ctx = (extra: Partial<ContextoMontagem> = {}): ContextoMontagem => ({
  tipo: 'criacao', cnpj: '65479262000126', receita, naturezaJuridicaId: 2, municipio, agora: new Date('2026-11-01T15:00:00Z'), ...extra,
});
const entrada = (extra: object = {}) => esquemaCadastro.parse({ ...base, ...extra });

const m1 = montarAlteracao(entrada({ links: ['@sitiodoze', 'sitiodoze.org'], demandas: 'Precisamos de reforço escolar', latitude: -7.19, longitude: -35.79, tiposParceriaIds: [1, 1, 2] }), ctx());
assert(m1.ok);
if (m1.ok) {
  const d = m1.dados;
  assert.equal(d.razao_social, 'ASSOCIACAO COMUNITARIA DO SITIO DOZE');
  assert.equal(d.natureza_juridica_id, 2);
  assert.equal(d.situacao_cadastral, 'ativa');
  assert.equal(d.cep, '58120000');
  assert.equal(d.telefone_1, '(83) 98147-0961');
  assert.equal(d.endereco_completo, 'Sitio Doze, S/N');
  assert.equal(d.bairro_nome, 'Zona Rural');
  assert.equal(d.instagram, 'https://www.instagram.com/sitiodoze');
  assert.equal(d.site_url, 'https://sitiodoze.org');
  assert.equal(d.facebook, null);
  assert.deepEqual(d.tipos_parceria_ids, [1, 2]);
  assert.equal(d.aceite_declaracao_em, '2026-11-01T15:00:00.000Z');
  assert.equal(d._fonte_cnpj, 'brasilapi');
  assert(!('_natureza_revisar' in d));
  assert(!('qsa' in d));
}

const m2 = montarAlteracao(entrada({ razaoSocial: 'NOME FALSO DO NAVEGADOR' }), ctx());
assert(m2.ok && m2.dados.razao_social === 'ASSOCIACAO COMUNITARIA DO SITIO DOZE', 'razão social do navegador é ignorada quando a Receita respondeu');

const m3 = montarAlteracao(entrada({ razaoSocial: 'ORG MANUAL' }), ctx({ receita: null, naturezaJuridicaId: null }));
assert(m3.ok && m3.dados.razao_social === 'ORG MANUAL' && m3.dados._natureza_revisar === true && !('situacao_cadastral' in m3.dados));
assert(!montarAlteracao(entrada(), ctx({ receita: null, naturezaJuridicaId: null })).ok, 'manual sem razão social');

const coop = normalizarResposta({ cnpj: '65479262000126', razao_social: 'COOP', descricao_situacao_cadastral: 'ATIVA', codigo_natureza_juridica: 2143, natureza_juridica: 'Cooperativa' }, '65479262000126');
const mc = montarAlteracao(entrada(), ctx({ receita: coop, naturezaJuridicaId: 2 }));
assert(mc.ok && mc.dados._natureza_revisar === true && mc.dados.natureza_juridica_id === 2, 'cooperativa vai marcada para revisão mesmo com categoria escolhida');

const m4 = montarAlteracao(entrada(), ctx({ tipo: 'edicao' }));
assert(m4.ok && !('razao_social' in m4.dados) && !('natureza_juridica_id' in m4.dados) && !('situacao_cadastral' in m4.dados), 'edição não mexe em razão social, natureza nem situação');
assert(m4.ok && !('site_url' in m4.dados) && !('demandas' in m4.dados), 'campo ausente = não mexe');

const m5 = montarAlteracao(entrada({ links: [], demandas: '' }), ctx({ tipo: 'edicao' }));
assert(m5.ok && m5.dados.site_url === null && m5.dados.demandas === null, 'enviado vazio = apaga');

const longe = montarAlteracao(entrada({ latitude: -7.1195, longitude: -34.845 }), ctx());
assert(!longe.ok && longe.campo === 'latitude');
assert(!montarAlteracao(entrada({ telefone: '123' }), ctx()).ok);
assert(!montarAlteracao(entrada({ cep: '123' }), ctx()).ok);
assert(!montarAlteracao(entrada({ links: ['isto nao e link'] }), ctx()).ok);

const t0 = 1_000_000;
for (let i = 0; i < 3; i++) assert(dentroDoLimite('k', 3, 60_000, t0 + i));
assert(!dentroDoLimite('k', 3, 60_000, t0 + 10), '4ª chamada bloqueada');
assert(dentroDoLimite('k', 3, 60_000, t0 + 61_000), 'libera depois da janela');

const fakeFetch = (success: boolean, ok = true) =>
  (async () => ({ ok, json: async () => ({ success }) })) as unknown as typeof fetch;

(async () => {
  const antes = { s: process.env.TURNSTILE_SECRET_KEY, n: process.env.NODE_ENV };
  const env = process.env as Record<string, string | undefined>;
  delete env.TURNSTILE_SECRET_KEY;
  env.NODE_ENV = 'development';
  assert.equal(await verificarTurnstile(undefined, 'x'), true, 'dev sem chave: dispensa');
  env.NODE_ENV = 'production';
  assert.equal(await verificarTurnstile('tok', 'x'), false, 'produção sem chave: bloqueia');
  env.TURNSTILE_SECRET_KEY = 'segredo';
  assert.equal(await verificarTurnstile(undefined, 'x'), false, 'sem token');
  assert.equal(await verificarTurnstile('tok', '1.2.3.4', fakeFetch(true)), true);
  assert.equal(await verificarTurnstile('tok', '1.2.3.4', fakeFetch(false)), false);
  assert.equal(await verificarTurnstile('tok', '1.2.3.4', fakeFetch(true, false)), false);
  assert.equal(await verificarTurnstile('tok', '1.2.3.4', (async () => { throw new Error('rede'); }) as unknown as typeof fetch), false);
  env.TURNSTILE_SECRET_KEY = antes.s; env.NODE_ENV = antes.n;
  if (antes.s === undefined) delete env.TURNSTILE_SECRET_KEY;

  console.log('TODOS OS TESTES PASSARAM');
})().catch((e) => { console.error('FALHOU', e); process.exit(1); });
