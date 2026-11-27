
const FUSO = 'America/Fortaleza';
const ABAS = { contas: 'Contas', cartao: 'Cartão', anuais: 'Anuais', porquinhos: 'Porquinhos', besteiras: 'Besteiras', meses: 'Meses', quitadas: 'Quitadas', config: 'Config' };
const CATEGORIAS = { casa: 'Casa e contas', transporte: 'Transporte', alimentacao: 'Alimentação', saude: 'Saúde', educacao: 'Educação', assinaturas: 'Assinaturas', cuidados: 'Cuidados pessoais', emprestimos: 'Empréstimos', outros: 'Outros' };
const CAT_BESTEIRA = { delivery: 'Delivery', lanche: 'Lanche e café', online: 'Compras online', lazer: 'Lazer', outros: 'Outros' };
const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const TEXTO = '@', DINHEIRO = 'R$ #,##0.00', INTEIRO = '0', PORCENTO = '0.0', TAXA = '0.0000';

const COLUNAS = {
  contas: [['ID', TEXTO, 90], ['Conta', TEXTO, 200], ['Categoria', TEXTO, 150], ['Valor por mês', DINHEIRO, 120], ['Parcelas restantes', INTEIRO, 140]],
  cartao: [['ID', TEXTO, 90], ['Descrição', TEXTO, 220], ['Valor da parcela', DINHEIRO, 130], ['Parcela atual', INTEIRO, 110], ['Total de parcelas', INTEIRO, 130], ['Parcelas restantes', INTEIRO, 140]],
  anuais: [['ID', TEXTO, 90], ['Gasto', TEXTO, 200], ['Valor no ano', DINHEIRO, 120], ['Mês de vencimento ou da 1ª parcela (1 a 12)', INTEIRO, 290], ['Parcelas', INTEIRO, 90], ['Já separado (só à vista)', DINHEIRO, 180]],
  porquinhos: [['ID', TEXTO, 90], ['Porquinho', TEXTO, 200], ['Meta', DINHEIRO, 120], ['Guardado', DINHEIRO, 120], ['Até (AAAA-MM)', TEXTO, 120], ['Guardo por mês', DINHEIRO, 140], ['Exemplo', TEXTO, 80]],
  besteiras: [['ID', TEXTO, 90], ['Data', TEXTO, 100], ['Mês', TEXTO, 90], ['O que foi', TEXTO, 220], ['Tipo', TEXTO, 140], ['Valor', DINHEIRO, 100], ['Exemplo', TEXTO, 80]],
  meses: [['Mês', TEXTO, 90], ['Ano', INTEIRO, 70], ['Nome do mês', TEXTO, 110], ['Salário', DINHEIRO, 120], ['Contas, cartão e anuais', DINHEIRO, 180], ['Cartão', DINHEIRO, 110], ['Anuais', DINHEIRO, 110], ['Porquinhos', DINHEIRO, 120], ['Teto de besteira', DINHEIRO, 130], ['Besteira gasta', DINHEIRO, 120], ['Livre', DINHEIRO, 110]],
  quitadas: [['Item', TEXTO, 220], ['Mês da última parcela', TEXTO, 170], ['Onde', TEXTO, 100]]
};
const CONFIG = [
  ['versao', 'Versão dos dados. Sobe sozinha a cada salvamento ou edição na planilha.', INTEIRO],
  ['atualizadoEm', 'Última vez que os dados mudaram.', TEXTO],
  ['mesRef', 'Mês de referência da página (AAAA-MM).', TEXTO],
  ['salario', 'Salário líquido.', DINHEIRO],
  ['margem', 'Margem para imprevistos, em % do salário.', PORCENTO],
  ['tetoBesteira', 'Teto de besteira por mês.', DINHEIRO],
  ['limiteCartao', 'Limite do cartão (opcional).', DINHEIRO],
  ['dados', 'Versão do pacote de dados da página.', INTEIRO],
  ['nome', 'Seu nome, como a página te chama.', TEXTO],
  ['criadoEm', 'Quando você começou a usar (AAAA-MM-DD).', TEXTO],
  ['fgtsAtivo', 'Acompanha o FGTS (sim ou não).', TEXTO],
  ['fgtsSaldo', 'Saldo do FGTS, atualizado a cada mês fechado.', DINHEIRO],
  ['fgtsBruto', 'Salário bruto, base do depósito do FGTS.', DINHEIRO],
  ['fgtsDeposito', 'Depósito do FGTS, em % do salário bruto.', PORCENTO],
  ['fgtsTR', 'TR usada no rendimento do FGTS, em % ao mês.', TAXA],
  ['fgts13', 'Recebe 13º salário (sim ou não).', TEXTO],
  ['fgtsFerias', 'Mês das férias (1 a 12), para o adicional de 1/3.', INTEIRO]
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Bolso em Dia')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function carregarDados() {
  const ss = planilha_(), cfg = lerConfig_(ss);
  const conta = Session.getEffectiveUser().getEmail();
  if (!num_(cfg.versao)) return { vazio: true, planilhaUrl: ss.getUrl(), conta };
  return { estado: montarEstado_(ss, cfg), versao: num_(cfg.versao), atualizadoEm: txt_(cfg.atualizadoEm), planilhaUrl: ss.getUrl(), conta };
}

function salvarDados(json, versaoBase) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ss = planilha_(), cfg = lerConfig_(ss), atual = num_(cfg.versao) || 0;
    if (atual > 0 && Number(versaoBase) !== atual) {
      return { conflito: true, versao: atual, atualizadoEm: txt_(cfg.atualizadoEm), estado: montarEstado_(ss, cfg), planilhaUrl: ss.getUrl() };
    }
    if (typeof json !== 'string' || json.length > LIMITE_JSON) throw new Error('Os dados enviados são grandes demais.');
    const s = JSON.parse(json), quando = agora_();
    if (!s || typeof s !== 'object' || !Array.isArray(s.contas)) throw new Error('Formato de dados inválido.');
    const fg = s.fgts && typeof s.fgts === 'object' ? s.fgts : {};
    escreverTudo_(ss, s);
    escreverConfig_(ss, {
      versao: atual + 1, atualizadoEm: quando, mesRef: mesTxt_(s.mesRef), salario: numero_(s.salario), margem: numero_(s.margem),
      tetoBesteira: numero_((s.besteira || {}).teto), limiteCartao: numero_((s.cartao || {}).limite), dados: numero_(s.dados),
      nome: texto_((s.perfil || {}).nome, 60), criadoEm: dataTxt_((s.perfil || {}).criadoEm),
      fgtsAtivo: fg.ativo === true ? 'sim' : 'não', fgtsSaldo: numero_(fg.saldo), fgtsBruto: numero_(fg.bruto), fgtsDeposito: numero_(fg.aliquota),
      fgtsTR: numero_(fg.tr), fgts13: fg.decimo === false ? 'não' : 'sim', fgtsFerias: numero_(fg.ferias)
    });
    limparAbaPadrao_(ss);
    return { ok: true, versao: atual + 1, atualizadoEm: quando, planilhaUrl: ss.getUrl() };
  } finally {
    lock.releaseLock();
  }
}

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const ss = e.source, sh = e.range.getSheet();
    if (sh.getName() === ABAS.config && e.range.getColumn() === 2 && e.range.getRow() <= 3) return;
    const v = num_(lerConfig_(ss).versao);
    if (!v) return;
    definirConfig_(ss, 'versao', v + 1);
    definirConfig_(ss, 'atualizadoEm', agora_() + ' (planilha)');
  } catch {}
}

function montarEstado_(ss, cfg) {
  const ler = function (chave) { return lerAba_(ss, chave); };
  return {
    v: 1,
    dados: num_(cfg.dados) || 1,
    perfil: { nome: txt_(cfg.nome), criadoEm: txt_(cfg.criadoEm, 'yyyy-MM-dd') },
    mesRef: txt_(cfg.mesRef, 'yyyy-MM'),
    salario: num_(cfg.salario) || 0,
    margem: num_(cfg.margem) == null ? 10 : num_(cfg.margem),
    fgts: {
      ativo: txt_(cfg.fgtsAtivo).toLowerCase() === 'sim', saldo: num_(cfg.fgtsSaldo) || 0, bruto: num_(cfg.fgtsBruto) || 0, aliquota: num_(cfg.fgtsDeposito),
      tr: num_(cfg.fgtsTR), decimo: txt_(cfg.fgts13).toLowerCase() !== 'não', ferias: num_(cfg.fgtsFerias)
    },
    contas: ler('contas').map((r) => {
      return { id: txt_(r[0]), nome: txt_(r[1]), categoria: chave_(r[2], CATEGORIAS), valor: num_(r[3]) || 0, parcelas: num_(r[4]) };
    }),
    cartao: {
      limite: num_(cfg.limiteCartao),
      itens: ler('cartao').map((r) => {
        const atual = num_(r[3]), total = num_(r[4]);
        return { id: txt_(r[0]), nome: txt_(r[1]), valor: num_(r[2]) || 0, total,
          parcelas: total ? total - Math.min(atual || 1, total) + 1 : num_(r[5]) };
      })
    },
    anuais: ler('anuais').map((r) => {
      return { id: txt_(r[0]), nome: txt_(r[1]), valor: num_(r[2]), mes: num_(r[3]), parcelas: num_(r[4]) || 1, reservado: num_(r[5]) || 0 };
    }),
    porquinhos: ler('porquinhos').map((r) => {
      return { id: txt_(r[0]), nome: txt_(r[1]), meta: num_(r[2]) || 0, guardado: num_(r[3]) || 0,
        ate: txt_(r[4], 'yyyy-MM') || null, mensal: num_(r[5]), exemplo: txt_(r[6]).toLowerCase() === 'sim' };
    }),
    besteira: {
      teto: num_(cfg.tetoBesteira) || 0,
      gastos: ler('besteiras').map((r) => {
        return { id: txt_(r[0]), data: txt_(r[1], 'yyyy-MM-dd'), mes: txt_(r[2], 'yyyy-MM'), desc: txt_(r[3]),
          cat: chave_(r[4], CAT_BESTEIRA), valor: num_(r[5]) || 0, exemplo: txt_(r[6]).toLowerCase() === 'sim' };
      })
    },
    historico: ler('meses').map((r) => {
      return { mes: txt_(r[0], 'yyyy-MM'), salario: num_(r[3]) || 0, obrigatorio: num_(r[4]) || 0, cartao: num_(r[5]) || 0,
        anuais: num_(r[6]) || 0, porquinhos: num_(r[7]) || 0, teto: num_(r[8]) || 0, besteira: num_(r[9]) || 0, livre: num_(r[10]) || 0 };
    }),
    quitadas: ler('quitadas').map((r) => {
      return { nome: txt_(r[0]), mes: txt_(r[1], 'yyyy-MM'), onde: txt_(r[2]) };
    })
  };
}

function lerAba_(ss, chave) {
  const sh = ss.getSheetByName(ABAS[chave]), n = COLUNAS[chave].length;
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, n).getValues()
    .filter((r) => { return r.some((c) => { return c !== '' && c !== null; }); });
}

function lerConfig_(ss) {
  const sh = ss.getSheetByName(ABAS.config), o = {};
  if (!sh || sh.getLastRow() < 2) return o;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach((r) => { if (r[0]) o[String(r[0]).trim()] = r[1]; });
  return o;
}

function escreverTudo_(ss, s) {
  const lista = function (v, max) { return Array.isArray(v) ? v.filter((x) => { return x && typeof x === 'object'; }).slice(0, max) : []; };
  const cartao = (s.cartao && typeof s.cartao === 'object') ? s.cartao : {};
  const besteira = (s.besteira && typeof s.besteira === 'object') ? s.besteira : {};
  escreverAba_(ss, 'contas', lista(s.contas, 500).map((c) => {
    return [id_(c.id), texto_(c.nome), rotulo_(CATEGORIAS, c.categoria), numero_(c.valor), numero_(c.parcelas)];
  }));
  escreverAba_(ss, 'cartao', lista(cartao.itens, 500).map((i) => {
    const total = numero_(i.total), rest = numero_(i.parcelas);
    return [id_(i.id), texto_(i.nome), numero_(i.valor), total && rest ? total - rest + 1 : '', total, rest];
  }));
  escreverAba_(ss, 'anuais', lista(s.anuais, 200).map((a) => {
    return [id_(a.id), texto_(a.nome), numero_(a.valor), numero_(a.mes), numero_(a.parcelas) || 1, numero_(a.reservado) || 0];
  }));
  escreverAba_(ss, 'porquinhos', lista(s.porquinhos, 200).map((p) => {
    return [id_(p.id), texto_(p.nome), numero_(p.meta) || '', numero_(p.guardado) || 0, mesTxt_(p.ate), numero_(p.mensal), p.exemplo ? 'sim' : ''];
  }));
  escreverAba_(ss, 'besteiras', lista(besteira.gastos, 5000)
    .map((g) => { return [id_(g.id), dataTxt_(g.data), mesTxt_(g.mes), texto_(g.desc, 200), rotulo_(CAT_BESTEIRA, g.cat), numero_(g.valor), g.exemplo ? 'sim' : '']; })
    .sort((a, b) => { return (a[2] + a[1]).localeCompare(b[2] + b[1]); }));
  escreverAba_(ss, 'meses', lista(s.historico, 600).filter((h) => { return mesTxt_(h.mes); })
    .sort((a, b) => { return a.mes.localeCompare(b.mes); })
    .map((h) => {
      return [h.mes, Number(h.mes.slice(0, 4)), NOMES_MESES[Number(h.mes.slice(5, 7)) - 1], numero_(h.salario), numero_(h.obrigatorio), numero_(h.cartao),
        numero_(h.anuais), numero_(h.porquinhos), numero_(h.teto), numero_(h.besteira), numero_(h.livre)];
    }));
  escreverAba_(ss, 'quitadas', lista(s.quitadas, 600).map((q) => { return [texto_(q.nome), mesTxt_(q.mes), q.onde === 'Cartão' ? 'Cartão' : 'Conta']; }));
}

function escreverAba_(ss, chave, linhas) {
  const cols = COLUNAS[chave], sh = prepararAba_(ss, ABAS[chave], cols);
  const ultima = sh.getLastRow();
  if (ultima > 1) sh.getRange(2, 1, ultima - 1, cols.length).clearContent();
  if (!linhas.length) return;
  const rg = sh.getRange(2, 1, linhas.length, cols.length);
  rg.setNumberFormats(linhas.map(() => { return cols.map((c) => { return c[1]; }); }));
  rg.setValues(linhas.map((l) => { return l.map((v) => { return v == null ? '' : v; }); }));
}

function escreverConfig_(ss, o) {
  const sh = prepararAba_(ss, ABAS.config, [['Chave', TEXTO, 140], ['Valor', TEXTO, 170], ['O que é', TEXTO, 420]]);
  const linhas = CONFIG.map((c) => { return [c[0], o[c[0]] == null ? '' : o[c[0]], c[1]]; });
  const rg = sh.getRange(2, 1, linhas.length, 3);
  rg.setNumberFormats(CONFIG.map((c) => { return [TEXTO, c[2], TEXTO]; }));
  rg.setValues(linhas);
}

function definirConfig_(ss, chave, valor) {
  const sh = ss.getSheetByName(ABAS.config);
  const i = CONFIG.map((c) => { return c[0]; }).indexOf(chave);
  if (sh && i >= 0) sh.getRange(i + 2, 2).setValue(valor);
}

function prepararAba_(ss, nome, cols) {
  let sh = ss.getSheetByName(nome);
  if (!sh) sh = ss.insertSheet(nome);
  if (!sh.getRange(1, 1).getValue()) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols.map((c) => { return c[0]; })])
      .setFontWeight('bold').setBackground('#0b5a50').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    cols.forEach((c, i) => { sh.setColumnWidth(i + 1, c[2]); });
  }
  return sh;
}

function limparAbaPadrao_(ss) {
  ['Página1', 'Planilha1', 'Sheet1'].forEach((n) => {
    const sh = ss.getSheetByName(n);
    if (sh && ss.getSheets().length > 1 && sh.getLastRow() === 0) ss.deleteSheet(sh);
  });
}

function planilha_() {
  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa) return ativa;
  const props = PropertiesService.getScriptProperties(), id = props.getProperty('PLANILHA_ID');
  if (id) return SpreadsheetApp.openById(id);
  const nova = SpreadsheetApp.create('Bolso em Dia · dados');
  props.setProperty('PLANILHA_ID', nova.getId());
  return nova;
}

function num_(v) {
  if (v === '' || v === null || v === undefined || v instanceof Date) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return s && isFinite(n) ? n : null;
}

function txt_(v, formato) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, FUSO, formato || 'yyyy-MM-dd');
  return String(v).trim().replace(/^'(?=[=+\-@])/, '');
}

function chave_(rotulo, mapa) {
  const t = txt_(rotulo).toLowerCase();
  for (const k in mapa) if (k === t || mapa[k].toLowerCase() === t) return k;
  return 'outros';
}

function agora_() {
  return Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm:ss');
}

const LIMITE_JSON = 2000000;

function texto_(v, max) {
  const s = String(v == null ? '' : v).replace(/\p{Cc}/gu, ' ').slice(0, max || 120);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function numero_(v) { return (typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e10) ? v : ''; }
function id_(v) { return (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v)) ? v : ''; }
function mesTxt_(v) { return (typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) ? v : ''; }
function dataTxt_(v) { return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : ''; }
function rotulo_(mapa, k) { return Object.prototype.hasOwnProperty.call(mapa, k) ? mapa[k] : 'Outros'; }
