import assert from 'node:assert/strict';
import { cnpjValido, formatarCnpj, limparCnpj, ehMatriz, raizCnpj } from './validar';
import { classificarNatureza } from './naturezaJuridica';
import { consultarCnpj } from './brasilapi';

assert(cnpjValido('12.ABC.345/01DE-35'), 'alfanumérico oficial (exemplo da Receita)');
assert(cnpjValido('12abc34501de35'), 'minúsculas são aceitas');
assert(cnpjValido('00.000.000/0001-91'));
assert(cnpjValido('11.222.333/0001-81'));
assert(cnpjValido('65479262000126'), 'CNPJ real consultado na BrasilAPI');
assert(!cnpjValido('11.222.333/0001-82'), 'dígito errado');
assert(!cnpjValido('12.ABC.345/01DE-36'));
assert(!cnpjValido('11111111111111'));
assert(!cnpjValido('123'));
assert(!cnpjValido(''));
assert(!cnpjValido('12ABC34501DE3A'), 'letra no dígito verificador');
assert.equal(formatarCnpj('12ABC34501DE35'), '12.ABC.345/01DE-35');
assert.equal(limparCnpj(' 11.222.333/0001-81 '), '11222333000181');
assert(ehMatriz('11222333000181') && !ehMatriz('11222333000262'));
assert.equal(raizCnpj('11.222.333/0001-81'), '11222333');

const c = (x: number | string | null, d?: string) => classificarNatureza(x, d);
const OSC = 'Organizações da Sociedade Civil (OSC)';
assert.deepEqual(c(3999), { situacao: 'mapeada', categoria: OSC });
assert.deepEqual(c('399-9'), { situacao: 'mapeada', categoria: OSC });
assert.deepEqual(c(3220), { situacao: 'mapeada', categoria: OSC });
assert.deepEqual(c(3301), { situacao: 'mapeada', categoria: 'Organizações Sociais (OS)' });
assert.deepEqual(c(3069), { situacao: 'mapeada', categoria: 'Fundações privadas' });
assert.equal(c(2062, 'Sociedade Empresária Limitada').situacao, 'nao_aceita');
assert.equal(c(1015).situacao, 'nao_aceita');
assert.equal(c(2143).situacao, 'revisao');
assert.equal(c(3077).situacao, 'revisao');
assert.equal(c(null).situacao, 'revisao');

const real = {
  uf: 'PB', cep: '58120000', cnpj: '65479262000126', email: null, bairro: 'ZONA RRUAL', numero: 'SN',
  municipio: 'MASSARANDUBA', logradouro: 'SITIO DOZE', cnae_fiscal: 9430800, complemento: '',
  razao_social: 'ASSOCIACAO COMUNITARIA DOS PRODUTORES RURAIS DO SITIO DOZE', nome_fantasia: '',
  ddd_telefone_1: '8381470961', natureza_juridica: 'Organização Social (OS)', situacao_cadastral: 2,
  cnae_fiscal_descricao: 'Atividades de associações de defesa de direitos sociais',
  data_inicio_atividade: '2026-02-20', codigo_natureza_juridica: 3301, identificador_matriz_filial: 1,
  descricao_situacao_cadastral: 'ATIVA', descricao_identificador_matriz_filial: 'MATRIZ',
};
const resp = (status: number, body?: unknown) =>
  (async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })) as unknown as typeof fetch;

(async () => {
  const r = await consultarCnpj('65.479.262/0001-26', { fetchImpl: resp(200, real) });
  assert(r.ok);
  if (r.ok) {
    const d = r.dados;
    assert.equal(d.cnpj, '65479262000126');
    assert.equal(d.situacaoCadastral, 'ativa');
    assert.equal(d.razaoSocial, 'ASSOCIACAO COMUNITARIA DOS PRODUTORES RURAIS DO SITIO DOZE');
    assert.equal(d.nomeFantasia, '');
    assert.equal(d.email, '');
    assert.equal(d.telefone, '8381470961');
    assert.equal(d.cnae.codigo, '9430800');
    assert.equal(d.endereco.cep, '58120000');
    assert.equal(d.endereco.municipio, 'MASSARANDUBA');
    assert.equal(d.anoInicioAtividade, 2026);
    assert.equal(d.ehMatriz, true);
    assert.deepEqual(d.natureza.classificacao, { situacao: 'mapeada', categoria: 'Organizações Sociais (OS)' });
    assert(!('qsa' in d), 'dados dos sócios nunca saem da biblioteca');
  }

  const baixada = await consultarCnpj('11222333000181', {
    fetchImpl: resp(200, { ...real, descricao_situacao_cadastral: undefined, situacao_cadastral: undefined, codigo_situacao_cadastral: 8 }),
  });
  assert(baixada.ok && baixada.dados.situacaoCadastral === 'baixada');

  const vazio = await consultarCnpj('11222333000181', { fetchImpl: resp(200, {}) });
  assert(vazio.ok && vazio.dados.cnpj === '11222333000181' && vazio.dados.razaoSocial === '');

  assert.deepEqual(await consultarCnpj('123'), { ok: false, erro: 'cnpj_invalido' });
  assert.deepEqual(await consultarCnpj('11222333000181', { fetchImpl: resp(404) }), { ok: false, erro: 'nao_encontrado' });
  assert.deepEqual(await consultarCnpj('11222333000181', { fetchImpl: resp(429) }), { ok: false, erro: 'limite' });

  const e503: any = await consultarCnpj('11222333000181', { fetchImpl: resp(503) });
  assert.equal(e503.erro, 'indisponivel');
  assert.equal(e503.detalhe, 'HTTP 503');

  const eRede: any = await consultarCnpj('11222333000181', { fetchImpl: (async () => { throw new Error('rede'); }) as unknown as typeof fetch });
  assert.equal(eRede.erro, 'indisponivel');
  assert(eRede.detalhe.includes('rede'));

  const lento = (async (_u: unknown, o: { signal: AbortSignal }) =>
    new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(new Error('abort'))))) as unknown as typeof fetch;
  const eLento: any = await consultarCnpj('11222333000181', { fetchImpl: lento, timeoutMs: 50 });
  assert.equal(eLento.erro, 'indisponivel');

  let cabecalhos: Record<string, string> = {};
  await consultarCnpj('11222333000181', {
    fetchImpl: (async (_u: unknown, o: { headers: Record<string, string> }) => { cabecalhos = o.headers; return { status: 404, ok: false, json: async () => ({}) }; }) as unknown as typeof fetch,
  });
  assert(cabecalhos['User-Agent']?.includes('DesafioUnifacisa'));

  console.log('TODOS OS TESTES PASSARAM');
})().catch((e) => { console.error('FALHOU', e); process.exit(1); });