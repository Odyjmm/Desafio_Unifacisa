import assert from 'node:assert/strict';
import { montarCsv } from './csv';

const cols = [
  { titulo: 'Nome', valor: (l: Record<string, unknown>) => l.nome },
  { titulo: 'Áreas', valor: (l: Record<string, unknown>) => l.areas },
  { titulo: 'Obs', valor: (l: Record<string, unknown>) => l.obs },
];
const csv = montarCsv(
  [
    { nome: 'Associação "Boa Vista"; Centro', areas: ['Educação', 'Saúde'], obs: null },
    { nome: '=HYPERLINK("http://x")', areas: [], obs: 'linha1\nlinha2' },
    { nome: '+55 83', areas: undefined, obs: '@usuario' },
  ],
  cols,
);
const [cab, l1, l2, l3, fim] = csv.replace('﻿', '').split('\r\n');
assert(csv.startsWith('﻿'), 'BOM UTF-8 para o Excel');
assert.equal(cab, 'Nome;Áreas;Obs');
assert.equal(l1, '"Associação ""Boa Vista""; Centro";Educação | Saúde;');
assert(l2.startsWith('"\'=HYPERLINK(""http://x"")"'), 'fórmula neutralizada: ' + l2);
assert(l2.endsWith(';;linha1 linha2'), 'quebra de linha vira espaço: ' + l2);
assert.equal(l3, "'+55 83;;'@usuario");
assert.equal(fim, '', 'termina com quebra de linha');
console.log('TODOS OS TESTES PASSARAM');
