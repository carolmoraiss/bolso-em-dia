(function(){
'use strict';

const CHAVE = 'bolso-em-dia:v1', CHAVE_TEMA = 'bolso-em-dia:tema', CHAVE_ABA = 'bolso-em-dia:aba', CHAVE_PREFS = 'bolso-em-dia:prefs';
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESES_LONGOS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const CATEGORIAS = { casa:'Casa e contas', transporte:'Transporte', alimentacao:'Alimentação', saude:'Saúde', educacao:'Educação', assinaturas:'Assinaturas', cuidados:'Cuidados pessoais', emprestimos:'Empréstimos', outros:'Outros' };
const CAT_BESTEIRA = { delivery:'Delivery', lanche:'Lanche e café', online:'Compras online', lazer:'Lazer', outros:'Outros' };
const SECOES = [['resumo','Resumo'],['destino','Para onde vai'],['contas','Contas'],['cartao','Cartão'],['anuais','Anuais'],['porquinhos','Porquinhos'],['besteiras','Besteiras'],['fgts','FGTS'],['projecao','Próximos 12 meses'],['dividas','Dívidas'],['historico','Histórico']];
const SUG_ASSIN = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Globoplay', 'YouTube Premium', 'iCloud'];
const SUGESTOES = ['IPTU','Revisão do carro','Troca de pneus','Material escolar','Presentes de fim de ano','Anuidade do cartão'];

const $ = function(s, el){ return (el || document).querySelector(s); };
const $$ = function(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
const r2 = function(v){ return Math.round((+v || 0) * 100) / 100; };
const ceil2 = function(v){ return Math.ceil((+v || 0) * 100 - 1e-6) / 100; };
const soma = function(a){ return r2(a.reduce((t, v) => { return t + (+v || 0); }, 0)); };
const uid = function(){ return Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8); };
const esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
const cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
const pad2 = function(n){ return String(n).padStart(2, '0'); };

const fBRL = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
const fNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
const fInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits:0 });
const fUm = new Intl.NumberFormat('pt-BR', { maximumFractionDigits:1 });
const fTaxa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits:4 });
const fPct = new Intl.NumberFormat('pt-BR', { style:'percent', maximumFractionDigits:0 });
let fComp;
try { fComp = new Intl.NumberFormat('pt-BR', { notation:'compact', maximumFractionDigits:1 }); } catch { fComp = fInt; }
const brl = function(v){ return fBRL.format(r2(v) || 0); };
const num = function(v){ return fNum.format(r2(v) || 0); };
const numCampo = function(v){ return v ? num(v) : ''; };
const pct = function(v){ return fPct.format(isFinite(v) ? v : 0); };
const curto = function(v){ return Math.abs(v) >= 10000 ? fComp.format(v) : fInt.format(Math.round(v) || 0); };

const local = {
  ler(chave){ try { return localStorage.getItem(chave); } catch { return null; } },
  gravar(chave, valor){ try { localStorage.setItem(chave, valor); return true; } catch { return false; } },
  apagar(chave){ try { localStorage.removeItem(chave); } catch {} }
};

function lerDinheiro(txt, casas){
  let s = String(txt == null ? '' : txt).replace(/[R$\s]/g, '');
  if (!s) return null;
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else { const p = s.split('.'); if (p.length > 2 || (p.length === 2 && p[1].length === 3)) s = p.join(''); }
  const n = Number(s);
  return isFinite(n) ? Math.max(0, casas ? Math.round(n * 10 ** casas) / 10 ** casas : r2(n)) : null;
}
function lerInteiro(txt){ const n = parseInt(String(txt == null ? '' : txt).replace(/\D/g, ''), 10); return n > 0 ? n : null; }

function mesHoje(){ const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
function hojeISO(){ const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function somarMes(ref, n){ const a = +ref.slice(0, 4), m = +ref.slice(5, 7); const t = a * 12 + (m - 1) + n; return Math.floor(t / 12) + '-' + pad2(t % 12 + 1); }
function mesNum(ref){ return +ref.slice(5, 7); }
function rotuloMes(ref){ return MESES[mesNum(ref) - 1] + '/' + ref.slice(2, 4); }
function rotuloMesLongo(ref){ return MESES_LONGOS[mesNum(ref) - 1] + ' de ' + ref.slice(0, 4); }
function dataCurta(iso){ return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : ''; }

function svg(p, vb){ return '<svg viewBox="' + (vb || '0 0 24 24') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
const ICON = {
  porco: svg('<path d="M25.5 11.6C23.8 8.9 20.4 7 16 7 10.2 7 6 10.6 6 15.4c0 2.7 1.3 5.1 3.4 6.7V26h3.8v-2.2c.9.2 1.8.3 2.8.3s1.9-.1 2.8-.3V26h3.8v-3.9c1-.8 1.8-1.7 2.4-2.8H28v-5.5h-1.6c-.2-.8-.5-1.5-.9-2.2Z"/><path d="M21 8.4l2.1-3.4 1.7 4.6"/><path d="M13 10.6h5"/><path d="M6 15.4c-1.7 0-3-1.1-3-2.7"/><circle cx="22.4" cy="14" r="1.1" fill="currentColor" stroke="none"/>', '0 0 32 32'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  alerta: svg('<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.2M12 17v.01"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>'),
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  lua: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'),
  auto: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none"/>'),
  mais: svg('<path d="M12 5v14M5 12h14"/>'),
  pontos: svg('<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),
  baixar: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  subir: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
  impressora: svg('<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7Z"/>'),
  reset: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
  banco: svg('<path d="M3.5 9.5 12 4l8.5 5.5Z"/><path d="M5.5 10v7M9.8 10v7M14.2 10v7M18.5 10v7M3.5 20h17"/>'),
  calendario: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>'),
  lixo: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  externo: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  planilha: svg('<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 9v11.5"/>'),
  casa: svg('<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>'),
  lista: svg('<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.5" cy="7" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="17" r="1" fill="currentColor"/>'),
  cartao: svg('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
  cafe: svg('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 3.5v2M12.5 3.5v2"/>'),
  usuario: svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.8 4.2-5.8 7.5-5.8s6.3 2 7.5 5.8"/>'),
  cadeado: svg('<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')
};
const STATUS = { ok:{ rotulo:'Cabe no bolso', icone:ICON.check }, warn:{ rotulo:'Apertado', icone:ICON.alerta }, bad:{ rotulo:'Não fecha', icone:ICON.x }, neutro:{ rotulo:'', icone:'' } };
function pill(st, txt){ return '<span class="pill ' + st + '">' + ((STATUS[st] && STATUS[st].icone) || '') + txt + '</span>'; }

const DADOS_ATUAL = 5;
const FGTS_JUROS_MES = Math.pow(1.03, 1 / 12) - 1, FGTS_TR_PADRAO = 0.15;
function migrar(s){
  if (!s.perfil.criadoEm) s.perfil.criadoEm = hojeISO();
  s.dados = DADOS_ATUAL;
  return s;
}
function chaveDe(v, mapa){
  const proprio = function(k){ return Object.prototype.hasOwnProperty.call(mapa, k); };
  if (typeof v === 'string' && proprio(v)) return v;
  const t = String(v == null ? '' : v).trim().toLowerCase();
  for (const k in mapa) if (proprio(k) && mapa[k].toLowerCase() === t) return k;
  return 'outros';
}
function estadoInicial(){
  return {
    v:1, dados:DADOS_ATUAL, mesRef:mesHoje(), salario:0, margem:10,
    perfil:{ nome:'', criadoEm:hojeISO() },
    contas:[], cartao:{ limite:null, itens:[] }, anuais:[], porquinhos:[],
    besteira:{ teto:0, gastos:[] }, historico:[], quitadas:[],
    fgts:{ ativo:false, saldo:0, bruto:0, aliquota:8, tr:FGTS_TR_PADRAO, decimo:true, ferias:null }
  };
}

function normalizar(o){
  if (!o || typeof o !== 'object') return estadoInicial();
  const objeto = function(x){ return x && typeof x === 'object'; };
  const arr = function(x, max){ return Array.isArray(x) ? x.filter(objeto).slice(0, max || 500) : []; };
  const n = function(v){ return (typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e10) ? v : null; };
  const parc = function(v){ return n(v) > 0 && v <= 1200 ? Math.round(v) : null; };
  const okMes = function(m){ return typeof m === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(m); };
  const okId = function(v){ return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : uid(); };
  const okData = function(v){ return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''; };
  const txt = function(v, max){ return String(v == null ? '' : v).replace(/\p{Cc}/gu, ' ').slice(0, max || 120); };
  const ref = okMes(o.mesRef) ? o.mesRef : mesHoje();
  const c = objeto(o.cartao) ? o.cartao : {}, b = objeto(o.besteira) ? o.besteira : {}, f = objeto(o.fgts) ? o.fgts : {};
  return {
    v:1, dados:n(o.dados) || 1, mesRef:ref,
    perfil:{ nome:txt((objeto(o.perfil) ? o.perfil : {}).nome, 60).trim(), criadoEm:okData((objeto(o.perfil) ? o.perfil : {}).criadoEm) },
    salario:n(o.salario) || 0,
    margem:n(o.margem) == null ? 10 : Math.min(50, Math.max(0, o.margem)),
    contas:arr(o.contas).map((x) => { return { id:okId(x.id), nome:txt(x.nome), categoria:chaveDe(x.categoria, CATEGORIAS), valor:n(x.valor) || 0, parcelas:parc(x.parcelas) }; }),
    cartao:{ limite:n(c.limite), itens:arr(c.itens).map((x) => { const p = parc(x.parcelas); return { id:okId(x.id), nome:txt(x.nome), valor:n(x.valor) || 0, parcelas:p, total:p ? Math.max(parc(x.total) || 0, p) : null }; }) },
    anuais:arr(o.anuais, 200).map((x) => { return { id:okId(x.id), nome:txt(x.nome), valor:n(x.valor), mes:(n(x.mes) >= 1 && x.mes <= 12) ? Math.round(x.mes) : null, reservado:n(x.reservado) || 0, parcelas:(parc(x.parcelas) && x.parcelas <= 12) ? parc(x.parcelas) : 1 }; }),
    porquinhos:arr(o.porquinhos, 200).map((x) => {
      const antigoPrazo = x.modo === 'prazo' && !okMes(x.ate);
      const ate = okMes(x.ate) ? x.ate : (antigoPrazo && parc(x.meses) ? somarMes(ref, parc(x.meses) - 1) : null);
      return { id:okId(x.id), nome:txt(x.nome), meta:n(x.meta) || 0, guardado:n(x.guardado) || 0, ate, mensal:antigoPrazo ? null : n(x.mensal), exemplo:!!x.exemplo };
    }),
    besteira:{ teto:n(b.teto) || 0, gastos:arr(b.gastos, 5000).map((x) => { return { id:okId(x.id), data:okData(x.data), desc:txt(x.desc, 200), cat:chaveDe(x.cat, CAT_BESTEIRA), valor:n(x.valor) || 0, mes:okMes(x.mes) ? x.mes : ref, exemplo:!!x.exemplo }; }) },
    historico:arr(o.historico, 600).filter((h) => { return okMes(h.mes); }).map((h) => {
      return { mes:h.mes, salario:n(h.salario) || 0, obrigatorio:n(h.obrigatorio) || 0, cartao:n(h.cartao) || 0, anuais:n(h.anuais) || 0, porquinhos:n(h.porquinhos) || 0, teto:n(h.teto) || 0, besteira:n(h.besteira) || 0, livre:n(h.livre) || 0 };
    }),
    quitadas:arr(o.quitadas, 600).filter((q) => { return q.nome != null && okMes(q.mes); }).map((q) => { return { nome:txt(q.nome), mes:q.mes, onde:q.onde === 'Cartão' ? 'Cartão' : 'Conta' }; }),
    fgts:{ ativo:f.ativo === true, saldo:Math.max(0, n(f.saldo) || 0), bruto:Math.max(0, n(f.bruto) || 0), aliquota:n(f.aliquota) > 0 && f.aliquota <= 20 ? f.aliquota : 8,
      tr:n(f.tr) != null && f.tr >= 0 && f.tr <= 5 ? f.tr : FGTS_TR_PADRAO, decimo:f.decimo !== false, ferias:n(f.ferias) >= 1 && f.ferias <= 12 ? Math.round(f.ferias) : null }
  };
}

let primeiroAcesso = false;
function carregar(){
  try {
    const raw = local.ler(CHAVE);
    if (raw) { const o = JSON.parse(raw), s = normalizar(o); return (o.dados || 1) < DADOS_ATUAL ? migrar(s) : s; }
  } catch {}
  primeiroAcesso = true;
  return estadoInicial();
}
let timerSalvar = null, semGravar = false;
function gravar(){ if (!semGravar) local.gravar(CHAVE, JSON.stringify(S)); }
function salvar(){ clearTimeout(timerSalvar); timerSalvar = setTimeout(gravar, 250); marcarParaNuvem(); }
function carregarPrefs(){
  try { const p = JSON.parse(local.ler(CHAVE_PREFS) || '{}'); return { secoes:(p && p.secoes) || {}, passosOcultos:Boolean(p && p.passosOcultos), ultimoBackup:(p && p.ultimoBackup) || '' }; } catch { return { secoes:{}, passosOcultos:false, ultimoBackup:'' }; }
}
function salvarPrefs(){ local.gravar(CHAVE_PREFS, JSON.stringify(PREFS)); }

function mesesAteVencer(mesVenc, ref){ return ((mesVenc - mesNum(ref) + 12) % 12) + 1; }
function indiceParcelaAnual(a, ref){ return (mesNum(ref) - a.mes + 12) % 12; }
function aporteAnual(a, ref){
  if (!a.valor || !a.mes) return 0;
  if ((a.parcelas || 1) > 1) return indiceParcelaAnual(a, ref) < a.parcelas ? r2(a.valor / a.parcelas) : 0;
  const falta = Math.max(0, a.valor - (a.reservado || 0));
  return Math.min(falta, ceil2(falta / mesesAteVencer(a.mes, ref)));
}
function faltaPorquinho(p){ return Math.max(0, r2((p.meta || 0) - (p.guardado || 0))); }
function mesesAte(ate, ref){ const d = (+ate.slice(0, 4) - +ref.slice(0, 4)) * 12 + (+ate.slice(5, 7) - +ref.slice(5, 7)) + 1; return Math.max(1, d); }
function necessarioPorquinho(p, ref){ const f = faltaPorquinho(p); if (!p.meta || !f || !p.ate) return null; return Math.min(f, ceil2(f / mesesAte(p.ate, ref))); }
function aportePorquinho(p, ref){
  if (!p.meta) return r2(p.mensal || 0);
  const f = faltaPorquinho(p); if (!f) return 0;
  if (p.mensal > 0) return r2(Math.min(f, p.mensal));
  return necessarioPorquinho(p, ref) || 0;
}
function mesesPorquinho(p, ref){
  if (!p.meta) return Infinity;
  const f = faltaPorquinho(p); if (!f) return 0;
  const ap = aportePorquinho(p, ref); return ap > 0 ? Math.ceil(f / ap - 1e-9) : Infinity;
}

function fgtsBase(s){ return s.fgts.bruto > 0 ? s.fgts.bruto : s.salario; }
function fgtsMes(s, ref){
  const f = s.fgts, base = fgtsBase(s), aliq = (f.aliquota || 0) / 100, m = mesNum(ref);
  const taxa = (1 + (f.tr || 0) / 100) * (1 + FGTS_JUROS_MES) - 1;
  const rendimento = r2(f.saldo * taxa), mensal = r2(base * aliq);
  const decimo = f.decimo && (m === 11 || m === 12) ? r2(base * aliq / 2) : 0;
  const ferias = f.ferias === m ? r2(base * aliq / 3) : 0;
  const deposito = r2(mensal + decimo + ferias);
  return { rendimento, mensal, decimo, ferias, deposito, taxa, saldoFinal:r2(f.saldo + rendimento + deposito) };
}
function projetarFgts(s, meses){
  const out = [];
  let ref = s.mesRef, saldo = s.fgts.saldo;
  for (let i = 0; i < meses; i++) {
    const m = fgtsMes({ salario:s.salario, fgts:{ ...s.fgts, saldo } }, ref);
    out.push({ mes:ref, ...m });
    saldo = m.saldoFinal; ref = somarMes(ref, 1);
  }
  return out;
}
function fgtsPorAno(proj){
  return [0, 1, 2].map((k) => proj.slice(k * 12, k * 12 + 12)).filter((f) => f.length).map((f) => {
    return { ate:f[f.length - 1].mes, deposito:soma(f.map((p) => p.deposito)), rendimento:soma(f.map((p) => p.rendimento)), saldo:f[f.length - 1].saldoFinal };
  });
}
function tabelaFgtsHTML(proj){
  const anos = fgtsPorAno(proj), fim = proj[proj.length - 1];
  return tabela([{ t:'Período' }, { t:'Depósitos', n:1 }, { t:'Rendimento', n:1 }, { t:'Saldo no fim', n:1 }],
    anos.map((x, k) => [`${k + 1}º ano <small class="muted">até ${rotuloMes(x.ate)}</small>`, brl(x.deposito), brl(x.rendimento), brl(x.saldo)]),
    ['Total em ' + anos.length + (anos.length > 1 ? ' anos' : ' ano'), brl(soma(anos.map((x) => x.deposito))), brl(soma(anos.map((x) => x.rendimento))), brl(fim.saldoFinal)]);
}

function resumo(s){
  const fixas = soma(s.contas.filter((c) => { return !c.parcelas && c.categoria !== 'assinaturas'; }).map((c) => { return c.valor; }));
  const assinaturas = soma(s.contas.filter((c) => { return !c.parcelas && c.categoria === 'assinaturas'; }).map((c) => { return c.valor; }));
  const parcelas = soma(s.contas.filter((c) => { return c.parcelas; }).map((c) => { return c.valor; }));
  const cartao = soma(s.cartao.itens.map((i) => { return i.valor; }));
  const anuais = soma(s.anuais.map((a) => { return aporteAnual(a, s.mesRef); }));
  const porquinhos = soma(s.porquinhos.map((p) => { return aportePorquinho(p, s.mesRef); }));
  const besteira = r2(s.besteira.teto || 0);
  const salario = r2(s.salario || 0);
  const contas = r2(fixas + assinaturas + parcelas);
  const obrigatorio = r2(contas + cartao + anuais);
  const antesPorq = r2(salario - obrigatorio - besteira);
  const margem = r2(salario * (s.margem || 0) / 100);
  const guardavel = Math.max(0, r2(antesPorq - margem));
  const livre = r2(antesPorq - porquinhos);
  const status = livre < 0 ? 'bad' : (livre < margem ? 'warn' : 'ok');
  const parcelados = s.contas.map((c) => { return Object.assign({}, c, { onde:'Conta' }); })
    .concat(s.cartao.itens.map((i) => { return Object.assign({}, i, { onde:'Cartão' }); }))
    .filter((x) => { return x.parcelas; });
  const devo = soma(parcelados.map((x) => { return x.valor * x.parcelas; }));
  const gastoBesteira = soma(s.besteira.gastos.filter((g) => { return g.mes === s.mesRef; }).map((g) => { return g.valor; }));
  return { fixas, assinaturas, contas, parcelas, cartao, anuais, porquinhos, besteira, salario,
    obrigatorio, antesPorq, margem, guardavel, livre, status,
    parcelados, devo, gastoBesteira, totalSaidas:r2(obrigatorio + besteira + porquinhos) };
}

function avancarMes(s, somarPorquinhos){
  const r = resumo(s);
  const n = JSON.parse(JSON.stringify(s));
  const eventos = [];
  const passar = function(lista, onde){
    const out = [];
    lista.forEach((x) => {
      if (!x.parcelas) { out.push(x); return; }
      if (x.parcelas <= 1) { eventos.push({ tipo:'quitou', nome:x.nome, valor:x.valor, onde }); return; }
      x.parcelas -= 1; out.push(x);
    });
    return out;
  };
  n.contas = passar(n.contas, 'Conta');
  n.cartao.itens = passar(n.cartao.itens, 'Cartão');
  const m = mesNum(s.mesRef);
  n.anuais.forEach((a) => {
    if (!a.valor || !a.mes) return;
    if ((a.parcelas || 1) > 1) { if (indiceParcelaAnual(a, s.mesRef) === a.parcelas - 1) eventos.push({ tipo:'anual', nome:a.nome, valor:a.valor, parcelado:true }); return; }
    if (a.mes === m) { eventos.push({ tipo:'anual', nome:a.nome, valor:a.valor }); a.reservado = 0; }
    else a.reservado = r2((a.reservado || 0) + aporteAnual(a, s.mesRef));
  });
  n.porquinhos.forEach((p) => {
    const ap = aportePorquinho(p, s.mesRef);
    if (somarPorquinhos && ap > 0) {
      p.guardado = r2((p.guardado || 0) + ap);
      if (p.meta > 0 && faltaPorquinho(p) === 0) eventos.push({ tipo:'meta', nome:p.nome, valor:p.meta });
    }
  });
  n.historico.push({ mes:s.mesRef, salario:r.salario, obrigatorio:r.obrigatorio, cartao:r.cartao, anuais:r.anuais,
    porquinhos:somarPorquinhos ? r.porquinhos : 0, teto:r.besteira, besteira:r.gastoBesteira, livre:r.livre });
  eventos.forEach((e) => { if (e.tipo === 'quitou') n.quitadas.push({ nome:e.nome, mes:s.mesRef, onde:e.onde }); });
  const fgts = n.fgts.ativo ? fgtsMes(s, s.mesRef) : null;
  if (fgts) n.fgts.saldo = fgts.saldoFinal;
  n.mesRef = somarMes(s.mesRef, 1);
  return { estado:n, eventos, resumo:r, fgts };
}

function projetar(s, meses){
  const out = [];
  let cur = s;
  for (let i = 0; i < meses; i++) {
    const passo = avancarMes(cur, true);
    out.push({ mes:cur.mesRef, r:passo.resumo, eventos:passo.eventos });
    cur = passo.estado;
  }
  return out;
}

function ritmoAnualBesteira(){
  const hist = S.historico.filter((h) => { return h.besteira != null; }).slice(-6);
  const base = hist.length ? soma(hist.map((h) => { return h.besteira; })) / hist.length : R.gastoBesteira;
  return { valor:r2(base * 12), media:hist.length > 0 };
}

function partesDestino(r){
  return [
    { k:'fixas', nome:'Contas fixas', v:r.fixas, cls:'c1' },
    { k:'parcelas', nome:'Parcelas e empréstimos', v:r.parcelas, cls:'c2' },
    { k:'cartao', nome:'Cartão de crédito', v:r.cartao, cls:'c3' },
    { k:'anuais', nome:'Reserva p/ gastos anuais', v:r.anuais, cls:'c4' },
    { k:'porq', nome:'Porquinhos', v:r.porquinhos, cls:'c5' },
    { k:'best', nome:'Teto de besteira', v:r.besteira, cls:'c6' },
    { k:'assin', nome:'Assinaturas e serviços', v:r.assinaturas, cls:'c7' },
    { k:'livre', nome:'Livre', v:Math.max(0, r.livre), cls:'c-livre' }
  ];
}

function textoStatus(r){
  if (r.status === 'bad') return 'Faltam ' + brl(-r.livre) + ' para fechar o mês. Corte algo ou dê mais prazo a um porquinho.';
  if (r.status === 'warn') return 'Sobra menos que a margem para imprevistos (' + brl(r.margem) + '). Vale reduzir a besteira ou um porquinho.';
  if (!r.porquinhos) return 'Tudo pago e nada separado ainda. Dá para guardar até ' + brl(r.guardavel) + ' por mês sem apertar.';
  return 'Contas pagas, porquinhos abastecidos e a margem para imprevistos (' + brl(r.margem) + ') preservada.';
}

let S = carregar();
const PREFS = carregarPrefs();
let R = resumo(S);
let PROJ = projetar(S, 12);
function recalcular(){ R = resumo(S); PROJ = projetar(S, 12); }

const BOCAS = {
  feliz:'<path class="t-traco" d="M53 87q7 6 14 0"/>', acenando:'<path class="t-traco" d="M53 87q7 6 14 0"/>',
  festa:'<path class="t-boca" d="M50 85q10 14 20 0z"/>', preocupado:'<path class="t-traco" d="M52 89q4-3 8 0t8 0"/>',
  triste:'<path class="t-traco" d="M53 91q7-7 14 0"/>', dormindo:'<ellipse class="t-boca" cx="60" cy="88" rx="2.6" ry="2.1"/>'
};
function tostao(humor = 'feliz', classe = ''){
  const abertos = '<g class="t-olhos"><circle cx="46" cy="55" r="4.6"/><circle cx="74" cy="55" r="4.6"/><circle class="t-brilho" cx="47.6" cy="53.4" r="1.5"/><circle class="t-brilho" cx="75.6" cy="53.4" r="1.5"/></g>';
  const olhos = humor === 'festa' ? '<g class="t-traco"><path d="M41 57q5-6 10 0"/><path d="M69 57q5-6 10 0"/></g>'
    : humor === 'dormindo' ? '<g class="t-traco"><path d="M41 55q5 4 10 0"/><path d="M69 55q5 4 10 0"/></g>' : abertos;
  const sobrancelhas = humor === 'preocupado' ? '<g class="t-traco"><path d="M40 47l10-3.5"/><path d="M80 47l-10-3.5"/></g>'
    : humor === 'triste' ? '<g class="t-traco"><path d="M40 46l10-5"/><path d="M80 46l-10-5"/></g>' : '';
  const extra = humor === 'acenando' ? '<g class="t-braco"><ellipse cx="101" cy="58" rx="7" ry="12" transform="rotate(-25 101 58)"/></g>'
    : humor === 'festa' ? '<circle class="t-moeda" cx="60" cy="18" r="7"/><g class="t-festa"><circle class="c1" cx="16" cy="34" r="3"/><circle class="c2" cx="104" cy="30" r="3"/><circle class="c4" cx="22" cy="80" r="2.5"/><circle class="c3" cx="100" cy="84" r="2.5"/></g>'
    : humor === 'dormindo' ? '<path class="t-traco t-z" d="M92 22h8l-8 9h8M104 10h6l-6 7h6"/>' : '';
  return `<svg class="tostao ${classe} humor-${humor}" viewBox="0 0 120 112" role="img" aria-label="Tostão, o porquinho (${humor})">` +
    '<ellipse class="t-sombra" cx="60" cy="106" rx="30" ry="3.5"/>' +
    '<path class="t-orelha" d="M30 38 27 16l23 13Z"/><path class="t-orelha" d="M90 38 93 16 70 29Z"/>' +
    '<path class="t-orelha-dentro" d="M33 33 31 21l13 8Z"/><path class="t-orelha-dentro" d="M87 33 89 21l-13 8Z"/>' +
    '<rect class="t-pe" x="38" y="92" width="14" height="13" rx="5"/><rect class="t-pe" x="68" y="92" width="14" height="13" rx="5"/>' +
    `${extra}<ellipse class="t-corpo" cx="60" cy="63" rx="42" ry="37"/>` +
    '<rect class="t-fenda" x="51" y="30" width="18" height="4" rx="2"/>' +
    '<circle class="t-bochecha" cx="34" cy="70" r="6"/><circle class="t-bochecha" cx="86" cy="70" r="6"/>' +
    `${sobrancelhas}${olhos}` +
    '<ellipse class="t-focinho" cx="60" cy="73" rx="15" ry="10.5"/><ellipse class="t-narina" cx="55" cy="73" rx="2.2" ry="3.4"/><ellipse class="t-narina" cx="65" cy="73" rx="2.2" ry="3.4"/>' +
    `${BOCAS[humor] || BOCAS.feliz}</svg>`;
}
function vazioTostao(texto, humor = 'feliz', tag = 'div'){ return `<${tag} class="vazio-tostao">${tostao(humor, 'mini')}<p>${texto}</p></${tag}>`; }

let momento = { ate:0, humor:'festa', texto:'' };
function primeiroNome(){ return esc(String(S.perfil.nome || '').trim().split(/\s+/)[0] || ''); }
const variar = (falas) => falas[(new Date().getDate() + mesNum(S.mesRef)) % falas.length];
function besteiraPorDia(){
  const teto = S.besteira.teto || 0, gasto = R.gastoBesteira;
  if (!teto || gasto >= teto || S.mesRef !== mesHoje()) return 0;
  const d = new Date(), dias = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1;
  return r2((teto - gasto) / dias);
}
function diasDesde(iso){ return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? Math.floor((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / 86400000) : Infinity; }
function recadosTostao(){
  const r = R, nome = primeiroNome(), voce = nome ? `Você, ${nome},` : 'Você', vocativo = nome ? `, ${nome}` : '', ref = S.mesRef, prox = somarMes(ref, 1);
  const lista = [], diga = (peso, humor, texto, acao = null) => { lista.push({ peso, humor, texto, acao }); };
  if (!S.salario) return [{ peso:100, humor:'acenando', texto:'Oi! Eu sou o Tostão. Comece me contando quanto você recebe por mês, no topo da página.', acao:null }];
  if (Date.now() < momento.ate) diga(100, momento.humor, momento.texto);
  if (mesesPendentes()) diga(95, 'dormindo', `Psiu${vocativo}… o mês virou e ${rotuloMesLongo(ref)} ainda não foi fechado.`, ['Fechar o mês', 'fechar']);
  const teto = S.besteira.teto || 0;
  if (r.status === 'bad') diga(90, 'triste', `${voce} está se passando esse mês: faltam ${brl(-r.livre)} para fechar a conta. Poupe money, bicha! Corta uma besteira ou dá mais prazo a um porquinho.`, ['Ver porquinhos', '#porquinhos']);
  if (teto && r.gastoBesteira > teto) diga(85, 'preocupado', `${voce} está se passando um pouco esse mês, poupe money, bicha! As besteiras já passaram ${brl(r.gastoBesteira - teto)} do teto.`, ['Ver besteiras', '#besteiras']);
  else if (teto && r.gastoBesteira >= teto * .8) diga(65, 'preocupado', `Olho nas besteiras${vocativo}: já foi ${pct(r.gastoBesteira / teto)} do teto de ${brl(teto)}.`, ['Ver besteiras', '#besteiras']);
  if (r.status === 'warn') diga(75, 'preocupado', `Tá apertadinho${vocativo}: sobra menos que a margem para imprevistos (${brl(r.margem)}). Segura a onda nas besteiras.`);
  S.porquinhos.forEach((p) => {
    const nomeP = esc(p.nome || 'sem nome'), falta = faltaPorquinho(p), nec = necessarioPorquinho(p, ref);
    if (!p.meta || !falta) return;
    if (p.ate && p.mensal > 0 && nec && p.mensal + .005 < nec) diga(80, 'preocupado', `O porquinho ${nomeP} não chega a tempo com ${brl(p.mensal)} por mês: precisa de ${brl(nec)}.`, ['Ajustar', '#porquinhos']);
    else if (p.ate && p.ate <= prox) diga(70, 'preocupado', `O prazo do porquinho ${nomeP} é ${p.ate === ref ? 'este mês' : `em ${rotuloMesLongo(p.ate)}`}: ainda faltam ${brl(falta)}.`, ['Ver porquinhos', '#porquinhos']);
    else if (p.guardado / p.meta >= .9) diga(28, 'feliz', `Falta pouco! O porquinho ${nomeP} já está em ${pct(p.guardado / p.meta)}.`);
    else if (!(p.mensal > 0) && !p.ate) diga(26, 'preocupado', `O porquinho ${nomeP} está parado: diga quanto guardar por mês ou até quando.`, ['Ajustar', '#porquinhos']);
  });
  S.anuais.forEach((x) => {
    const nomeA = esc(x.nome || 'um gasto anual');
    if (!x.valor || !x.mes) { diga(60, 'preocupado', `Você esqueceu de informar ${!x.valor && !x.mes ? 'o valor e o mês' : !x.valor ? 'o valor' : 'o mês de vencimento'} de ${nomeA}.`, ['Preencher', '#anuais']); return; }
    const parc = (x.parcelas || 1) > 1, i = parc ? indiceParcelaAnual(x, ref) : -1;
    if (parc && i === x.parcelas - 1) diga(45, 'feliz', `Última parcela de ${nomeA} este mês. Depois, só no ano que vem!`);
    else if (parc && indiceParcelaAnual(x, prox) === 0) diga(50, 'preocupado', `Em ${rotuloMesLongo(prox)} começam as ${x.parcelas} parcelas de ${nomeA}: ${brl(r2(x.valor / x.parcelas))} cada.`, ['Ver gastos do ano', '#anuais']);
    else if (!parc && x.mes === mesNum(ref)) diga(58, 'preocupado', `${nomeA} vence este mês: separe ${brl(aporteAnual(x, ref))}.`, ['Ver gastos do ano', '#anuais']);
  });
  const ultimas = S.contas.concat(S.cartao.itens).filter((x) => x.parcelas === 1);
  if (ultimas.length) diga(40, 'festa', `Última parcela de ${ultimas.map((x) => esc(x.nome || 'sem nome')).join(', ')} este mês! A partir de ${rotuloMes(prox)}, sobram mais ${brl(soma(ultimas.map((x) => x.valor)))} por mês.`);
  const quaseNoFim = S.cartao.itens.filter((x) => x.parcelas === 2);
  if (quaseNoFim.length) diga(32, 'feliz', `Faltam só 2 parcelas de ${quaseNoFim.map((x) => esc(x.nome || 'sem nome')).join(', ')} no cartão.`);
  if (PROJ[1] && PROJ[1].r.cartao < r.cartao - .01) diga(35, 'feliz', `Em ${rotuloMesLongo(prox)}, sua fatura cai para ${brl(PROJ[1].r.cartao)} (${brl(r.cartao - PROJ[1].r.cartao)} a menos).`, ['Ver cartão', '#cartao']);
  if (teto && ref === mesHoje()) {
    const datas = S.besteira.gastos.filter((g) => g.mes === ref && g.data).map((g) => g.data).sort();
    const dias = datas.length ? diasDesde(datas[datas.length - 1]) : new Date().getDate() - 1;
    if (dias >= 7) diga(30, 'dormindo', `Faz ${dias} dias que você não anota uma besteira${vocativo}. Esqueceu de alguma?`, ['Anotar', 'anotar']);
  }
  if (!NUVEM && diasDesde(PREFS.ultimoBackup) > 30) diga(20, 'preocupado', 'Seus dados estão só neste navegador e faz tempo que você não guarda um backup. Bora fazer uma cópia?', ['Exportar backup', 'exportar']);
  if (!S.porquinhos.length && r.guardavel > 0) diga(15, 'feliz', `Sobram ${brl(r.guardavel)} por mês sem apertar${vocativo}. Que tal dar um destino com um porquinho?`, ['Criar porquinho', '#porquinhos']);
  if (S.fgts.ativo) {
    const fg = fgtsMes(S, ref);
    if (!S.fgts.bruto) diga(24, 'preocupado', `Para o FGTS ficar exato, me conte o seu salário bruto${vocativo}. Por enquanto, calculo em cima do líquido.`, ['Informar', '#fgts']);
    else diga(18, 'feliz', `Este mês, seu FGTS recebe ${brl(fg.deposito)}${fg.rendimento ? ` e rende ${brl(fg.rendimento)}` : ''}. Ao fechar o mês, o saldo vai para ${brl(fg.saldoFinal)}.`, ['Ver FGTS', '#fgts']);
  }
  const porDia = besteiraPorDia();
  diga(37, 'feliz', variar([
    `${voce} está economizando bastante esse mês, parabéns!${porDia ? ` Hoje ainda dá pra gastar ${brl(porDia)} em besteira.` : ''}`,
    `Arrasou${vocativo}! Contas em dia e ${brl(r.porquinhos)} indo para os porquinhos este mês.`,
    `Tudo em dia${vocativo}! Dá pra guardar até ${brl(r.guardavel)} por mês sem apertar.`
  ]));
  const alerta = lista.some((x) => x.peso >= 60 && x.humor !== 'festa');
  return lista.filter((x) => !(alerta && x.peso === 37)).sort((x, y) => y.peso - x.peso);
}
function botaoRecado(acao){
  if (!acao) return '';
  const [rotulo, alvo] = acao;
  if (alvo === 'fechar') return `<button type="button" class="btn btn-sm" data-dica-fechar>${rotulo}</button>`;
  if (alvo === 'anotar') return `<button type="button" class="btn btn-sm" data-anotar>${rotulo}</button>`;
  if (alvo === 'exportar') return `<button type="button" class="btn btn-sm" data-acao="exportar">${rotulo}</button>`;
  return `<a class="btn btn-sm" href="${alvo}">${rotulo}</a>`;
}
function renderDica(){
  const recados = recadosTostao(), [topo, ...outros] = recados, el = $('#dicaTostao');
  const lista = outros.length ? `<details class="recados"${el.querySelector('.recados[open]') ? ' open' : ''}><summary>Mais ${outros.length} ${outros.length > 1 ? 'recados' : 'recado'}</summary><ul>` +
    outros.map((x) => `<li><span class="recado-ponto humor-${x.humor}"></span><span class="recado-texto">${x.texto}</span>${botaoRecado(x.acao)}</li>`).join('') + '</ul></details>' : '';
  if (el.dataset.humor === topo.humor && el.firstElementChild) {
    $('.dica-texto', el).innerHTML = topo.texto; $('.dica-acao', el).innerHTML = botaoRecado(topo.acao); $('.dica-recados', el).innerHTML = lista;
    return;
  }
  const mudou = Boolean(el.dataset.humor);
  el.dataset.humor = topo.humor;
  el.innerHTML = `<article class="dica">${tostao(topo.humor)}<div class="dica-balao"><span class="eyebrow">Tostão diz</span><p class="dica-texto">${topo.texto}</p>` +
    `<div class="dica-acao">${botaoRecado(topo.acao)}</div><div class="dica-recados">${lista}</div></div></article>`;
  if (mudou) mov.saltar($('.tostao', el));
}

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)');
const SUAVE = 'cubic-bezier(.2, .8, .2, 1)';
const valoresTela = new WeakMap(), quadrosTela = new WeakMap(), finaisTela = new WeakMap(), remocoes = new WeakMap(), medidas = new Map();
const token = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

const mov = {
  pode(el){ return !semMovimento.matches && Boolean(el && el.animate); },
  animar(el, quadros, opcoes){ return mov.pode(el) ? el.animate(quadros, { duration:280, easing:SUAVE, ...opcoes }) : null; },
  fim(animacao, limite = 700){
    if (!animacao) return Promise.resolve();
    return Promise.race([animacao.finished.catch(() => null), new Promise((ok) => { setTimeout(ok, limite); })]);
  },
  entrar(el, atraso = 0){
    mov.animar(el, [{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'none' }], { duration:380, delay:atraso, fill:'backwards' });
  },
  emSequencia(elementos, passo = 60){ elementos.filter(Boolean).forEach((el, i) => mov.entrar(el, i * passo)); },
  sair(el){
    return mov.fim(mov.animar(el, [{ opacity:1, transform:'none' }, { opacity:0, transform:'translateX(-16px)' }], { duration:220, fill:'forwards' }));
  },
  destacar(el){
    if (!el) return;
    const cor = token('--accent-soft');
    mov.animar(el, [{ boxShadow:`0 0 0 4px ${cor}` }, { boxShadow:`0 0 0 4px ${cor}`, offset:.45 }, { boxShadow:'0 0 0 0 transparent' }], { duration:1500, easing:'ease-out' });
  },
  saltar(el){
    mov.animar(el, [{ transform:'scale(.86)', opacity:.5 }, { transform:'scale(1.06)', opacity:1, offset:.6 }, { transform:'scale(1)' }], { duration:420 });
  },
  numero(el, valor, desenhar){
    if (!el) return;
    const primeiro = !valoresTela.has(el), contarDoZero = primeiro && el.dataset.contar === 'zero';
    const antes = primeiro ? (contarDoZero ? 0 : valor) : valoresTela.get(el);
    valoresTela.set(el, valor);
    cancelAnimationFrame(quadrosTela.get(el)); clearTimeout(finaisTela.get(el));
    if (semMovimento.matches || antes === valor) { desenhar(el, valor); return; }
    const inicio = performance.now(), duracao = contarDoZero ? 1100 : 520;
    const passo = () => {
      const t = Math.min(1, (performance.now() - inicio) / duracao), suave = 1 - (1 - t) ** 3;
      desenhar(el, t < 1 ? antes + (valor - antes) * suave : valor);
      if (t < 1) quadrosTela.set(el, requestAnimationFrame(passo));
    };
    quadrosTela.set(el, requestAnimationFrame(passo));
    finaisTela.set(el, setTimeout(() => { cancelAnimationFrame(quadrosTela.get(el)); desenhar(el, valor); }, duracao + 120));
  },
  onda(evento){
    const alvo = evento.target.closest && evento.target.closest('.btn, .aba, .menu-item, .sug');
    if (!alvo || evento.button > 0 || !mov.pode(alvo)) return;
    const caixa = alvo.getBoundingClientRect(), tamanho = Math.max(caixa.width, caixa.height) * 2.2;
    const onda = document.createElement('span');
    onda.className = 'onda';
    onda.style.cssText = `width:${tamanho}px;height:${tamanho}px;left:${evento.clientX - caixa.left - tamanho / 2}px;top:${evento.clientY - caixa.top - tamanho / 2}px`;
    alvo.appendChild(onda);
    mov.fim(mov.animar(onda, [{ transform:'scale(0)', opacity:.3 }, { transform:'scale(1)', opacity:0 }], { duration:560, easing:'ease-out' })).then(() => onda.remove());
  },
  confete(origem){
    if (semMovimento.matches || !origem) return;
    const tela = document.createElement('canvas'), ctx = tela.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    if (!ctx) return;
    tela.className = 'confete';
    tela.setAttribute('aria-hidden', 'true');
    tela.width = innerWidth * dpr; tela.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    document.body.appendChild(tela);
    const caixa = origem.getBoundingClientRect(), cores = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6'].map(token);
    const pecas = Array.from({ length:90 }, () => ({
      x:caixa.left + caixa.width / 2, y:caixa.top + caixa.height / 3, vx:(Math.random() - .5) * 13, vy:-Math.random() * 13 - 4,
      giro:Math.random() * 6, vg:(Math.random() - .5) * .4, w:6 + Math.random() * 6, h:3 + Math.random() * 4, cor:cores[Math.floor(Math.random() * cores.length)]
    }));
    const inicio = performance.now();
    const quadro = () => {
      const t = (performance.now() - inicio) / 1700;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      pecas.forEach((p) => {
        p.vy += .35; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.giro += p.vg;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t); ctx.translate(p.x, p.y); ctx.rotate(p.giro);
        ctx.fillStyle = p.cor; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (t < 1) requestAnimationFrame(quadro); else tela.remove();
    };
    requestAnimationFrame(quadro);
    setTimeout(() => tela.remove(), 2600);
  },
  trocarTema(botao, aplicar){
    if (semMovimento.matches || !document.startViewTransition) {
      const raiz = document.documentElement;
      if (!semMovimento.matches) { raiz.classList.add('tema-mudando'); setTimeout(() => raiz.classList.remove('tema-mudando'), 450); }
      aplicar();
      return;
    }
    const c = botao.getBoundingClientRect(), x = c.left + c.width / 2, y = c.top + c.height / 2;
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    let feito = false;
    const executar = () => { if (!feito) { feito = true; aplicar(); } };
    setTimeout(executar, 400);
    document.startViewTransition(executar).ready.then(() => {
      document.documentElement.animate({ clipPath:[`circle(0 at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
        { duration:560, easing:'ease-in-out', pseudoElement:'::view-transition-new(root)' });
    }).catch(() => null);
  },
  medida(chave, porcento){
    const alvo = Math.max(0, Math.min(100, porcento)), antes = medidas.has(chave) ? medidas.get(chave) : 0;
    medidas.set(chave, alvo);
    return { antes, alvo };
  },
  aplicarMedidas(raiz){
    const els = $$('[data-largura], [data-altura]', raiz);
    if (!els.length) return;
    void raiz.offsetWidth;
    els.forEach((el) => {
      if (el.dataset.largura) el.style.width = `${el.dataset.largura}%`;
      if (el.dataset.altura) el.style.height = `${el.dataset.altura}%`;
    });
  },
  crescer(raiz){
    if (semMovimento.matches) return;
    $$('[data-largura]', raiz).forEach((el) => { el.style.width = '0%'; });
    $$('[data-altura]', raiz).forEach((el) => { el.style.height = '0%'; });
    mov.aplicarMedidas(raiz);
  }
};
const contar = (seletor, valor) => mov.numero($(seletor), valor, (el, v) => { el.textContent = brl(v); });
function medidorHTML(chave, porcento, classe){
  const m = mov.medida(chave, porcento);
  return `<div class="${`meter ${classe || ''}`.trim()}"><span data-largura="${m.alvo}" style="width:${m.antes}%"></span></div>`;
}
function realcarNovo(id, rolar){
  requestAnimationFrame(() => {
    const el = $(`[data-id="${id}"]`);
    if (!el) return;
    mov.entrar(el); mov.destacar(el);
    if (rolar) el.scrollIntoView({ behavior:semMovimento.matches ? 'auto' : 'smooth', block:'center' });
  });
}

function segBarHTML(r, interativo){
  const partes = partesDestino(r).filter((p) => { return p.v > 0; });
  const total = Math.max(r.salario, soma(partes.map((p) => { return p.v; }))) || 1;
  const base = r.salario || total;
  let h = partes.map((p) => {
    const share = p.v / base;
    const esconde = !interativo && p.v / total < 0.07;
    return '<div class="parte ' + p.cls + '" style="flex-grow:' + p.v + '"' + (interativo ? ' tabindex="0" data-k="' + p.k + '"' : '') +
      ' aria-label="' + p.nome + ': ' + brl(p.v) + ', ' + pct(share) + ' do salário"><span' + (esconde ? ' hidden' : '') + '>' + pct(share) + '</span></div>';
  }).join('');
  if (r.totalSaidas > r.salario && r.salario > 0) h += '<span class="seg-marco" style="left:' + (r.salario / total * 100) + '%" title="Até aqui vai o salário"></span>';
  return h;
}
let timerRotulos = null;
function atualizarSegBar(bar, r){
  const partes = partesDestino(r).filter((p) => p.v > 0), base = r.salario || 1;
  const total = Math.max(r.salario, soma(partes.map((p) => p.v))) || 1;
  const atuais = new Map($$('.parte', bar).map((el) => [el.dataset.k, el]));
  let anterior = null;
  partes.forEach((p) => {
    let el = atuais.get(p.k);
    if (el) { atuais.delete(p.k); clearTimeout(remocoes.get(el)); el.tabIndex = 0; }
    else {
      el = document.createElement('div');
      el.className = `parte ${p.cls}`; el.dataset.k = p.k; el.tabIndex = 0; el.style.flexGrow = '0';
      el.appendChild(document.createElement('span'));
      bar.insertBefore(el, anterior ? anterior.nextSibling : bar.firstChild);
    }
    anterior = el;
    el.setAttribute('aria-label', `${p.nome}: ${brl(p.v)}, ${pct(p.v / base)} do salário`);
    el.firstElementChild.textContent = pct(p.v / base);
  });
  void bar.offsetWidth;
  partes.forEach((p) => { $(`.parte[data-k="${p.k}"]`, bar).style.flexGrow = String(p.v); });
  atuais.forEach((el) => { el.style.flexGrow = '0'; el.removeAttribute('tabindex'); remocoes.set(el, setTimeout(() => el.remove(), 520)); });
  let marco = $('.seg-marco', bar);
  if (r.totalSaidas > r.salario && r.salario > 0) {
    if (!marco) { marco = document.createElement('span'); marco.className = 'seg-marco'; marco.title = 'Até aqui vai o salário'; bar.appendChild(marco); }
    marco.style.left = `${r.salario / total * 100}%`;
  } else if (marco) marco.remove();
  ajustarRotulosSeg(bar);
  clearTimeout(timerRotulos); timerRotulos = setTimeout(() => ajustarRotulosSeg(bar), 560);
}
function ajustarRotulosSeg(bar){
  $$('.parte', bar).forEach((p) => { const s = p.firstElementChild; if (!s) return; s.hidden = false; s.hidden = s.offsetWidth + 12 > p.clientWidth; });
}

function escala(min, max, alvo){
  const bruto = (max - min) / alvo;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = [1, 2, 2.5, 5, 10].map((f) => { return f * mag; }).filter((p) => { return p >= bruto; })[0];
  const tmin = Math.floor(min / passo) * passo, tmax = Math.ceil(max / passo) * passo, ticks = [];
  for (let v = tmin; v <= tmax + passo / 2; v += passo) ticks.push(r2(v));
  return { min:tmin, max:tmax, ticks };
}
function barra(x, y0, y1, w, r){
  const h = Math.abs(y1 - y0); if (h < 0.5) return '';
  r = Math.min(r, h, w / 2);
  if (y1 < y0) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
  return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
}
function svgProjecao(proj, W, interativo, H){
  const pad = { t:28, r:8, b:30, l:52 };
  const vals = proj.map((p) => { return p.r.livre; });
  let mx = Math.max(0, ...vals);
  const mn = Math.min(0, ...vals);
  if (mx - mn < 1) mx = mn + 100;
  const tk = escala(mn, mx, H < 230 ? 3 : 4);
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const y = function(v){ return pad.t + (tk.max - v) / (tk.max - tk.min) * ih; };
  const n = proj.length, banda = iw / n, bw = Math.max(6, Math.min(24, banda * 0.56)), y0 = y(0);
  const compacto = tk.max >= 10000 || tk.min <= -10000;
  let g = '';
  tk.ticks.forEach((t) => {
    const yy = Math.round(y(t)) + 0.5;
    g += '<line class="' + (t === 0 ? 'g-base' : 'g-grid') + '" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + yy + '" y2="' + yy + '"/>' +
      '<text class="g-tick" x="' + (pad.l - 8) + '" y="' + yy + '" dy=".32em" text-anchor="end">' + (compacto ? fComp.format(t) : fInt.format(t)) + '</text>';
  });
  g += '<text class="g-tick" x="' + (pad.l - 8) + '" y="12" text-anchor="end">R$</text>';
  const passoRot = banda < 34 ? 2 : 1;
  proj.forEach((p, i) => {
    const v = vals[i], x = pad.l + banda * i + (banda - bw) / 2;
    const cls = v < 0 ? 'neg' : (i === 0 ? 'atual' : '');
    g += '<path class="g-bar ' + cls + '" data-i="' + i + '" style="--i:' + i + '" d="' + barra(x, y0, y(v), bw, 4) + '"/>';
    if (i % passoRot === 0) {
      const m = p.mes.slice(5, 7);
      const rot = (i === 0 || m === '01') ? rotuloMes(p.mes) : MESES[+m - 1];
      g += '<text class="g-tick" x="' + (pad.l + banda * i + banda / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + rot + '</text>';
    }
  });
  [0, n - 1].forEach((i) => {
    const v = vals[i], x0 = pad.l + banda * i + (banda - bw) / 2;
    const yy = v >= 0 ? y(v) - 7 : y(v) + 15;
    g += i === 0
      ? '<text class="g-label" x="' + x0 + '" y="' + yy + '" text-anchor="start">' + brl(v).replace(/,\d\d$/, '') + '</text>'
      : '<text class="g-label" x="' + (x0 + bw) + '" y="' + yy + '" text-anchor="end">' + brl(v).replace(/,\d\d$/, '') + '</text>';
  });
  if (interativo) proj.forEach((p, i) => {
    g += '<rect class="g-hit" data-i="' + i + '" x="' + (pad.l + banda * i) + '" y="' + pad.t + '" width="' + banda + '" height="' + ih + '" tabindex="0" aria-label="' + cap(rotuloMesLongo(p.mes)) + ': livre ' + brl(p.r.livre) + '"/>';
  });
  return '<svg class="g" viewBox="0 0 ' + W + ' ' + H + '" role="' + (interativo ? 'group' : 'img') + '" aria-label="Quanto fica livre em cada um dos próximos 12 meses">' + g + '</svg>';
}
function tipProjecao(i){
  const p = PROJ[i], r = p.r;
  const l = function(k, v, forte){ return '<span class="tip-l"><span>' + k + '</span>' + (forte ? '<b>' + v + '</b>' : '<span>' + v + '</span>') + '</span>'; };
  return '<strong>' + cap(rotuloMesLongo(p.mes)) + '</strong>' + l('Livre', brl(r.livre), true) + l('Contas', brl(r.contas)) + l('Cartão', brl(r.cartao)) +
    (r.anuais ? l('Anuais', brl(r.anuais)) : '') + l('Porquinhos', brl(r.porquinhos)) + l('Besteira', brl(r.besteira));
}
function eventosHTML(){
  const ev = [];
  PROJ.forEach((p) => { p.eventos.forEach((e) => {
    if (e.tipo === 'quitou') ev.push([p.mes, 'var(--good)', 'Última parcela de <b>' + esc(e.nome) + '</b>. A partir de ' + rotuloMes(somarMes(p.mes, 1)) + ', sobram mais ' + brl(e.valor) + ' por mês.']);
    else if (e.tipo === 'meta') ev.push([p.mes, 'var(--s5)', 'Porquinho <b>' + esc(e.nome) + '</b> completo.']);
    else if (e.tipo === 'anual') ev.push([p.mes, 'var(--s4)', e.parcelado ? 'Última parcela de <b>' + esc(e.nome) + '</b> no ano (' + brl(e.valor) + ' no total).' : 'Vence <b>' + esc(e.nome) + '</b> (' + brl(e.valor) + '), pago com o que foi separado.']);
  }); });
  if (!ev.length) return '<li class="vazio">Nos próximos 12 meses nenhuma parcela termina e nenhum porquinho enche.</li>';
  return ev.map((e) => { return '<li><span class="ev-dot" style="background:' + e[1] + '"></span><span class="ev-mes">' + rotuloMes(e[0]) + '</span><span>' + e[2] + '</span></li>'; }).join('');
}
function tabelaProjecaoHTML(){
  return '<thead><tr><th>Mês</th><th class="n">Contas</th><th class="n">Cartão</th><th class="n">Anuais</th><th class="n">Porquinhos</th><th class="n">Besteira</th><th class="n">Livre</th></tr></thead><tbody>' +
    PROJ.map((p) => { const r = p.r; return '<tr><td>' + rotuloMes(p.mes) + '</td><td class="n">' + brl(r.contas) + '</td><td class="n">' + brl(r.cartao) + '</td><td class="n">' + brl(r.anuais) +
      '</td><td class="n">' + brl(r.porquinhos) + '</td><td class="n">' + brl(r.besteira) + '</td><td class="n"><b>' + brl(r.livre) + '</b></td></tr>'; }).join('') + '</tbody>';
}
function hbarsHTML(itens, total, cls){
  const max = Math.max(1, ...itens.map((i) => i.v));
  return itens.map((i) => {
    const m = mov.medida(`${cls}:${i.nome}`, i.v / max * 100);
    return `<li><span class="hb-nome">${esc(i.nome)}<small>${pct(i.v / (total || 1))}</small></span><span class="hb-val">${brl(i.v)}</span>` +
      `<span class="trilho"><span class="${cls}" data-largura="${m.alvo}" style="width:${m.antes}%"></span></span></li>`;
  }).join('');
}
function miniColsHTML(itens, cls){
  const max = Math.max(1, ...itens.map((i) => i.v));
  return `<div class="mini-cols">${itens.map((i) => {
    const m = mov.medida(`${cls}:${i.mes}`, Math.max(1.5, i.v / max * 100));
    return `<div class="mini-col" title="${rotuloMes(i.mes)}: ${brl(i.v)}"><span class="v">${curto(i.v)}</span>` +
      `<span class="bw"><span class="b ${cls}${i.forte ? ' forte' : ''}" data-altura="${m.alvo}" style="height:${m.antes}%"></span></span><span class="m">${rotuloMes(i.mes)}</span></div>`;
  }).join('')}</div>`;
}
const valorHTML = function(v){ return '<span class="moeda">R$</span>' + (v < 0 ? '−' : '') + num(Math.abs(v)); };

function valorGlobal(g){
  return { nome:S.perfil.nome, salario:S.salario, margem:S.margem, teto:S.besteira.teto, limite:S.cartao.limite,
    fgAtivo:S.fgts.ativo, fgSaldo:S.fgts.saldo, fgBruto:S.fgts.bruto, fgAliq:S.fgts.aliquota, fgTR:S.fgts.tr, fg13:S.fgts.decimo, fgFerias:S.fgts.ferias }[g];
}
function textoGlobal(el){
  const v = valorGlobal(el.dataset.g), t = el.dataset.t;
  if (t === 'pct') return fUm.format(v || 0);
  if (t === 'taxa') return fTaxa.format(v || 0);
  if (t === 'money') return numCampo(v);
  return v == null ? '' : String(v);
}
function sincronizarGlobais(){
  $$('[data-g]').forEach((el) => {
    if (el === document.activeElement) return;
    if (el.type === 'checkbox') el.checked = Boolean(valorGlobal(el.dataset.g));
    else el.value = textoGlobal(el);
  });
}

function iniciais(nome){
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}
function dataLonga(iso){ return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? `${+iso.slice(8, 10)} de ${MESES_LONGOS[+iso.slice(5, 7) - 1]} de ${iso.slice(0, 4)}` : ''; }
function mostrarIniciais(el, nome){ const ini = iniciais(nome); if (ini === '?') el.innerHTML = ICON.usuario; else el.textContent = ini; }
function renderTopo(){
  const rotulo = $('#mesRefLabel'), novo = cap(rotuloMesLongo(S.mesRef));
  if (rotulo.textContent !== novo) {
    const tinha = rotulo.textContent;
    rotulo.textContent = novo;
    if (tinha) mov.animar(rotulo, [{ opacity:0, transform:'translateY(10px)' }, { opacity:1, transform:'none' }], { duration:420 });
  }
  $('#mesAtraso').hidden = !(S.mesRef < mesHoje());
  $('.sub').textContent = S.perfil.nome ? `Olá, ${S.perfil.nome}` : 'Salário, contas, cartão e porquinhos no mesmo lugar';
  mostrarIniciais($('#avatarLetra'), S.perfil.nome);
  const hoje = new Date(), fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const devido = S.mesRef < mesHoje() || (S.mesRef === mesHoje() && hoje.getDate() >= fimDoMes - 2);
  const fechar = $('#btnFecharMes');
  fechar.classList.toggle('btn-primary', devido); fechar.classList.toggle('devido', devido);
  fechar.title = devido ? 'Hora de fechar o mês' : 'Use no fim do mês, depois de pagar as contas';
}

function renderResumo(){
  const r = R, base = r.salario || 1;
  sincronizarGlobais();
  mov.numero($('#heroLivre'), r.livre, (el, v) => { el.innerHTML = valorHTML(v); });
  const estado = $('#heroStatus');
  if (estado.dataset.estado !== r.status) {
    estado.innerHTML = pill(r.status, STATUS[r.status].rotulo);
    if (estado.dataset.estado) mov.saltar(estado.firstElementChild);
    estado.dataset.estado = r.status;
  }
  $('#heroHint').textContent = textoStatus(r);
  mov.numero($('#guardavel'), r.guardavel, (el, v) => { el.innerHTML = valorHTML(v); });
  const fr = r.guardavel ? r.porquinhos / r.guardavel : (r.porquinhos ? 2 : 0);
  const m = $('#guardMeter'); m.className = 'meter m-porq' + (fr > 1.0001 ? ' bad' : ''); m.firstElementChild.style.width = Math.min(100, fr * 100) + '%';
  $('#margemLinha').innerHTML = `Com margem de <b>${fUm.format(S.margem || 0)}%</b> do salário para imprevistos. <a href="#perfil">Ajustar</a>`;
  $('#guardHint').innerHTML = !r.porquinhos ? 'Nenhum porquinho ainda. Crie um na aba Porquinhos.'
    : r.porquinhos <= r.guardavel ? 'Seus porquinhos usam ' + brl(r.porquinhos) + '. Ainda cabem <b>' + brl(r.guardavel - r.porquinhos) + '</b> por mês.'
    : 'Seus porquinhos pedem ' + brl(r.porquinhos) + ': <b>' + brl(r.porquinhos - r.guardavel) + '</b> além do confortável.';
  $('#salarioDl').innerHTML = '<div><dt>Contas, cartão e anuais</dt><dd>' + brl(r.obrigatorio) + '<small>' + pct(r.obrigatorio / base) + '</small></dd></div>' +
    '<div><dt>Porquinhos e besteira</dt><dd>' + brl(r.porquinhos + r.besteira) + '<small>' + pct((r.porquinhos + r.besteira) / base) + '</small></dd></div>';
}

function renderAviso(){
  const tem = S.porquinhos.some((p) => { return p.exemplo; }) || S.besteira.gastos.some((g) => { return g.exemplo; });
  const el = $('#avisoExemplos');
  if (!tem) { el.innerHTML = ''; return; }
  if (el.firstElementChild) return;
  el.innerHTML = '<div class="aviso">' + ICON.info + '<p>Os itens marcados como <span class="tag-ex">exemplo</span> só mostram como funciona. Edite para virarem seus ou apague todos de uma vez.</p><button type="button" class="btn btn-sm" id="btnApagarEx">Apagar exemplos</button></div>';
}

function renderContadores(){
  const c = { contas:S.contas.length, cartao:S.cartao.itens.length, anuais:S.anuais.length, porquinhos:S.porquinhos.length,
    besteiras:S.besteira.gastos.filter((g) => { return g.mes === S.mesRef; }).length };
  $$('[data-cont]').forEach((el) => { el.textContent = c[el.dataset.cont] || ''; });
  const pend = S.anuais.some((a) => { return !a.valor || !a.mes; });
  const aba = $('#aba-anuais'); aba.classList.toggle('pendente', pend); aba.title = pend ? 'Falta preencher valor ou mês de algum gasto anual' : '';
}

function renderPassos(){
  const el = $('#primeirosPassos');
  const passos = [
    ['Salário', S.salario > 0, 'salario'], ['Contas do mês', S.contas.length > 0, 'contas'], ['Cartão de crédito', S.cartao.itens.length > 0, 'cartao'],
    ['Gastos do ano (IPVA, IPTU…)', S.anuais.length > 0, 'anuais'], ['Um porquinho', S.porquinhos.length > 0, 'porquinhos'], ['Teto de besteira', S.besteira.teto > 0, 'besteiras']
  ];
  const feitos = passos.filter((p) => p[1]).length;
  if (PREFS.passosOcultos || feitos === passos.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<article class="card passos"><header class="passos-topo"><div><h2>Primeiros passos</h2><p class="hint">Preencha no seu ritmo. Cada item leva ao lugar certo.</p></div>` +
    `<button type="button" class="btn btn-sm" data-passos-ocultar>Ocultar</button></header>` +
    `<div class="passos-progresso">${medidorHTML('passos', feitos / passos.length * 100, 'm-porq')}<span>${feitos} de ${passos.length}</span></div>` +
    `<ol class="passos-lista">${passos.map(([nome, ok, ir]) => `<li class="${ok ? 'feito' : ''}"><button type="button" data-ir="${ir}">${ok ? ICON.check : '<span class="passo-bola"></span>'}<span>${nome}</span></button></li>`).join('')}</ol></article>`;
  mov.aplicarMedidas(el);
}
function renderPerfil(){
  const nome = S.perfil.nome;
  mostrarIniciais($('#perfilAvatar'), nome);
  $('#perfilNomeTxt').textContent = nome || 'Sem nome ainda';
  $('#perfilDesde').textContent = S.perfil.criadoEm ? `Usando desde ${dataLonga(S.perfil.criadoEm)}` : '';
  const linhas = [
    ['Conta Google', sync.conta ? esc(sync.conta) : NUVEM ? 'Conectando…' : 'Nenhuma: aberto como arquivo'],
    ['Onde os dados ficam', NUVEM ? 'Na sua planilha do Google, com uma cópia neste aparelho' : 'Só neste navegador, neste aparelho'],
    ['Planilha', sync.url ? `<a href="${esc(sync.url)}" target="_blank" rel="noopener noreferrer">Abrir no Google Sheets</a>` : '—'],
    ['Mês de referência', cap(rotuloMesLongo(S.mesRef))]
  ];
  $('#perfilConta').innerHTML = linhas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

let verTodasDividas = false;
function renderVisao(){
  const r = R;
  const pend = S.anuais.filter((a) => { return !a.valor || !a.mes; }).map((a) => { return esc(a.nome || 'sem nome'); });
  $('#avisoAnuais').innerHTML = pend.length ? '<div class="aviso warn">' + ICON.alerta + '<p>Complete valor e mês de vencimento de ' +
    (pend.length > 1 ? pend.slice(0, -1).join(', ') + ' e ' + pend[pend.length - 1] : pend[0]) + '. Sem isso, nada é separado todo mês para ' + (pend.length > 1 ? 'eles' : 'ele') + '.</p><a class="btn btn-sm" href="#anuais">Preencher</a></div>' : '';
  $('#destinoSub').textContent = 'Cada bloco é uma parte dos ' + brl(r.salario) + ' de ' + rotuloMesLongo(S.mesRef) + '.';
  const bar = $('#segBar'); atualizarSegBar(bar, r);
  bar.setAttribute('aria-label', 'Divisão do salário');
  let leg = partesDestino(r).filter((p) => { return p.v > 0; }).map((p) => { return '<li><span class="sw ' + p.cls + '"></span><span class="nome">' + p.nome + '</span><span class="val">' + brl(p.v) + '</span></li>'; }).join('');
  if (r.totalSaidas > r.salario) leg += '<li class="excesso">' + ICON.alerta + 'Passa ' + brl(r.totalSaidas - r.salario) + ' do salário (a linha escura marca onde ele acaba)</li>';
  $('#segLegenda').innerHTML = leg;
  contar('#devoTotal', r.devo);
  $('#devoResumo').textContent = r.devo ? brl(r.devo) : 'nenhuma';
  const lista = r.parcelados.slice().sort((a, b) => { return a.parcelas - b.parcelas; });
  let html = lista.length ? (verTodasDividas ? lista : lista.slice(0, 5)).map((x) => { return '<li><span class="ld-txt"><strong>' + esc(x.nome || 'Sem nome') + '</strong><small>' + x.onde + ' · ' +
    (parcelaAtual(x) ? 'parcela ' + parcelaAtual(x) + ' de ' + x.total : x.parcelas + ' restantes') + ' · ' + brl(x.valor) +
    ' · última em ' + rotuloMes(somarMes(S.mesRef, x.parcelas - 1)) + '</small></span><span class="ld-val">' + brl(x.valor * x.parcelas) + '</span></li>'; }).join('')
    : vazioTostao('Nenhuma parcela em aberto. Que alívio!', 'feliz', 'li');
  if (lista.length > 5) html += `<li class="ld-mais"><button type="button" class="btn btn-sm" data-ver-dividas>${verTodasDividas ? 'Mostrar menos' : `Ver todas (${lista.length})`}</button></li>`;
  if (S.quitadas.length) html += '<li class="quitadas">Já quitou: ' + S.quitadas.slice(-4).map((q) => { return esc(q.nome) + ' (' + rotuloMes(q.mes) + ')'; }).join(', ') + '</li>';
  $('#listaDividas').innerHTML = html;
  desenharGrafico();
  $('#eventosProj').innerHTML = eventosHTML();
  $('#tabProj').innerHTML = tabelaProjecaoHTML();
  const ultimo = PROJ[PROJ.length - 1];
  $('#projResumo').textContent = `${rotuloMes(ultimo.mes)}: ${brl(ultimo.r.livre)}`;
}
let larguraGrafico = 0;
let graficoMostrado = false;
function desenharGrafico(){
  const box = $('#grafProj'); const W = Math.round(box.clientWidth);
  if (!W) { graficoMostrado = false; return; }
  larguraGrafico = W;
  box.innerHTML = svgProjecao(PROJ, W, true, W < 480 ? 210 : 250);
  if (!graficoMostrado && !semMovimento.matches) box.firstElementChild.classList.add('g-crescer');
  graficoMostrado = true;
}

function optsCat(sel){ return Object.keys(CATEGORIAS).map((k) => { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + CATEGORIAS[k] + '</option>'; }).join(''); }
function optsMes(sel){ return '<option value=""' + (!sel ? ' selected' : '') + '>Escolha</option>' + MESES_LONGOS.map((m, i) => { return '<option value="' + (i + 1) + '"' + (sel === i + 1 ? ' selected' : '') + '>' + cap(m) + '</option>'; }).join(''); }
const botaoApagar = function(nome){ return '<button type="button" class="del" data-del aria-label="Apagar ' + esc(nome || 'item') + '" title="Apagar">' + ICON.lixo + '</button>'; };

function linhaContaHTML(c){
  return '<div class="linha l-contas" data-lista="contas" data-id="' + c.id + '">' +
    '<div class="cel c-nome"><span class="cx"><input type="text" data-f="nome" value="' + esc(c.nome) + '" placeholder="Nome da conta" aria-label="Nome da conta"></span></div>' +
    '<div class="cel c-full" data-label="Categoria"><span class="cx"><select data-f="categoria" aria-label="Categoria">' + optsCat(c.categoria) + '</select></span></div>' +
    '<div class="cel" data-label="Valor por mês"><span class="cx num"><span>R$</span><input type="text" data-f="valor" data-t="money" inputmode="decimal" value="' + numCampo(c.valor) + '" placeholder="0,00" aria-label="Valor por mês"></span></div>' +
    '<div class="cel" data-label="Parcelas restantes"><span class="cx num"><input type="text" data-f="parcelas" data-t="int" inputmode="numeric" value="' + (c.parcelas || '') + '" placeholder="todo mês" aria-label="Parcelas restantes"></span><small class="info" data-info></small></div>' +
    botaoApagar(c.nome) + '</div>';
}
function parcelaAtual(i){ return i.total && i.parcelas ? i.total - i.parcelas + 1 : null; }
function linhaCartaoHTML(i){
  return '<div class="linha l-cartao" data-lista="cartao" data-id="' + i.id + '">' +
    '<div class="cel c-nome"><span class="cx"><input type="text" data-f="nome" value="' + esc(i.nome) + '" placeholder="Descrição" aria-label="Descrição"></span></div>' +
    '<div class="cel" data-label="Valor da parcela"><span class="cx num"><span>R$</span><input type="text" data-f="valor" data-t="money" inputmode="decimal" value="' + numCampo(i.valor) + '" placeholder="0,00" aria-label="Valor da parcela"></span></div>' +
    '<div class="cel" data-label="Parcela atual"><span class="parc-de"><span class="cx num"><input type="text" data-f="atual" data-t="int" inputmode="numeric" value="' + (parcelaAtual(i) || '') + '" placeholder="–" aria-label="Número da parcela deste mês"></span>' +
      '<span class="de">de</span><span class="cx num"><input type="text" data-f="total" data-t="int" inputmode="numeric" value="' + (i.total || '') + '" placeholder="–" aria-label="Total de parcelas, vazio para cobrança de todo mês"></span></span><small class="info" data-info></small></div>' +
    botaoApagar(i.nome) + '</div>';
}
function linhaAnualHTML(a){
  const parc = (a.parcelas || 1) > 1;
  return '<div class="linha l-anuais" data-lista="anuais" data-id="' + a.id + '">' +
    '<div class="cel c-nome"><span class="cx"><input type="text" data-f="nome" value="' + esc(a.nome) + '" placeholder="Nome" aria-label="Nome do gasto anual"></span></div>' +
    '<div class="cel" data-label="Valor no ano"><span class="cx num"><span>R$</span><input type="text" data-f="valor" data-t="money" inputmode="decimal" value="' + numCampo(a.valor) + '" placeholder="0,00" aria-label="Valor no ano"></span></div>' +
    '<div class="cel" data-label="' + (parc ? '1ª parcela em' : 'Vence em') + '"><span class="cx"><select data-f="mes" data-t="mes" aria-label="Mês de vencimento">' + optsMes(a.mes) + '</select></span></div>' +
    '<div class="cel" data-label="Parcelas"><span class="cx num"><input type="text" data-f="parcelas" data-t="int" inputmode="numeric" value="' + (parc ? a.parcelas : '') + '" placeholder="à vista" aria-label="Em quantas parcelas"></span></div>' +
    '<div class="cel" data-label="Já separei">' + (parc ? '<span class="cel-vazia" title="Parcelado: cada parcela sai do mês em que vence">—</span>'
      : '<span class="cx num"><span>R$</span><input type="text" data-f="reservado" data-t="money" inputmode="decimal" value="' + numCampo(a.reservado) + '" placeholder="0,00" aria-label="Quanto já separou"></span>') + '</div>' +
    '<div class="cel c-full cel-info" data-label="Neste mês" data-info></div>' +
    botaoApagar(a.nome) + '</div>';
}
function optsAte(sel){
  let h = '<option value=""' + (!sel ? ' selected' : '') + '>Sem data</option>', achou = !sel;
  for (let i = 0; i < 72; i++) { const m = somarMes(S.mesRef, i); if (m === sel) achou = true; h += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + cap(rotuloMesLongo(m)) + '</option>'; }
  if (!achou) h += '<option value="' + sel + '" selected>' + cap(rotuloMesLongo(sel)) + (sel < S.mesRef ? ' (já passou)' : '') + '</option>';
  return h;
}
function porqHTML(p){
  return '<article class="porq" data-lista="porquinhos" data-id="' + p.id + '">' +
    '<div class="porq-topo"><span class="cx"><input type="text" data-f="nome" value="' + esc(p.nome) + '" placeholder="Para quê?" aria-label="Nome do porquinho"></span>' +
      (p.exemplo ? '<span class="tag-ex">exemplo</span>' : '') + botaoApagar(p.nome) + '</div>' +
    '<div class="porq-campos">' +
      '<label class="campo-rot"><span class="lbl">Quanto preciso</span><span class="cx boxed num"><span>R$</span><input type="text" data-f="meta" data-t="money" inputmode="decimal" value="' + numCampo(p.meta) + '" placeholder="sem meta"></span></label>' +
      '<label class="campo-rot"><span class="lbl">Já guardei</span><span class="cx boxed num"><span>R$</span><input type="text" data-f="guardado" data-t="money" inputmode="decimal" value="' + numCampo(p.guardado) + '" placeholder="0,00"></span></label>' +
      '<label class="campo-rot"><span class="lbl">Até quando</span><span class="cx boxed"><select data-f="ate" data-t="ate">' + optsAte(p.ate) + '</select></span></label>' +
      '<label class="campo-rot"><span class="lbl">Guardo por mês</span><span class="cx boxed num"><span>R$</span><input type="text" data-f="mensal" data-t="money" inputmode="decimal" value="' + numCampo(p.mensal) + '" placeholder="' + (p.ate && p.meta ? 'automático' : '0,00') + '"></span></label>' +
    '</div><div class="porq-res" data-info></div></article>';
}

function infoParcela(x){ return x.parcelas ? 'última em ' + rotuloMes(somarMes(S.mesRef, x.parcelas - 1)) + ' · falta ' + brl(x.valor * x.parcelas) : ''; }
function infoAnual(a){
  if (!a.valor && !a.mes) return pill('warn', 'Informe valor e mês');
  if (!a.valor) return pill('warn', 'Informe o valor');
  if (!a.mes) return pill('warn', 'Escolha o mês');
  if ((a.parcelas || 1) > 1) {
    const i = indiceParcelaAnual(a, S.mesRef), vp = r2(a.valor / a.parcelas);
    const faixa = MESES[a.mes - 1] + ' a ' + MESES[(a.mes + a.parcelas - 2) % 12];
    if (i < a.parcelas) return '<strong>' + brl(vp) + '</strong><small> parcela ' + (i + 1) + ' de ' + a.parcelas + ' · ' + faixa + '</small>';
    return '<strong>' + brl(0) + '</strong><small> ' + a.parcelas + '× de ' + brl(vp) + ' · começa em ' + rotuloMes(somarMes(S.mesRef, (a.mes - mesNum(S.mesRef) + 12) % 12)) + '</small>';
  }
  const n = mesesAteVencer(a.mes, S.mesRef), ap = aporteAnual(a, S.mesRef);
  if (!ap) return pill('ok', 'Já separado');
  if (n === 1) return '<strong>' + brl(ap) + '</strong> <small>vence este mês</small>';
  return '<strong>' + brl(ap) + '</strong><small> por mês até ' + rotuloMes(somarMes(S.mesRef, n - 1)) + ' · ' + n + ' meses</small>';
}
function infoPorquinho(p){
  const ref = S.mesRef, f = faltaPorquinho(p), prog = p.meta > 0 ? Math.min(1, (p.guardado || 0) / p.meta) : 0;
  const progresso = medidorHTML('porq-' + p.id, prog * 100) + '<div class="porq-prog"><span>' + brl(p.guardado) + ' de ' + brl(p.meta) + '</span><span>' + pct(prog) + '</span></div>';
  const numero = function(v, txt){ return '<div class="porq-num"><strong>' + brl(v) + '</strong><span>' + txt + '</span></div>'; };
  if (!p.meta) {
    if (!(p.mensal > 0)) return pill('neutro', 'Diga quanto precisa ou quanto guardar por mês');
    return numero(p.mensal, 'por mês · sem meta') + '<p class="hint">O valor vai se acumulando. Preencha "Quanto preciso" para ver quando chega lá.</p><div class="porq-prog"><span>Guardado até agora</span><span>' + brl(p.guardado) + '</span></div>';
  }
  if (!f) return pill('ok', 'Meta batida') + progresso;
  if (p.ate) {
    const n = mesesAte(p.ate, ref), nec = necessarioPorquinho(p, ref), prazo = rotuloMes(p.ate) + ' · ' + n + (n === 1 ? ' mês' : ' meses');
    if (!(p.mensal > 0)) return numero(nec, 'por mês até ' + prazo) + pill('ok', 'Calculado para chegar a tempo') + progresso;
    if (p.mensal + 0.005 >= nec) return numero(p.mensal, 'por mês') + pill('ok', 'Chega a tempo, em ' + rotuloMes(somarMes(ref, mesesPorquinho(p, ref) - 1))) +
      '<p class="hint">O mínimo seria ' + brl(nec) + ' por mês até ' + prazo + '.</p>' + progresso;
    const junta = r2(Math.min(p.meta, (p.guardado || 0) + p.mensal * n));
    return numero(p.mensal, 'por mês') + pill('warn', p.ate < ref ? 'O prazo já passou' : 'Não chega a tempo') +
      '<p class="hint">Guardando ' + brl(p.mensal) + ' por mês, até ' + rotuloMes(p.ate) + ' você junta ' + brl(junta) + ' e faltam ' + brl(p.meta - junta) + '. Para chegar a tempo: <b>' + brl(nec) + ' por mês</b>.</p>' +
      '<button type="button" class="btn btn-sm" data-usar="' + nec + '">Usar ' + brl(nec) + ' por mês</button>' + progresso;
  }
  const cenarios = [12, 24, 36].map((m) => { return '<li><span>Em ' + m + ' meses <small>(' + rotuloMes(somarMes(ref, m - 1)) + ')</small></span><b>' + brl(ceil2(f / m)) + ' por mês</b></li>'; }).join('');
  const mp = mesesPorquinho(p, ref);
  const topo = p.mensal > 0 ? numero(p.mensal, 'por mês') + '<p class="hint">Sem data. Nesse ritmo chega lá em <b>' + rotuloMesLongo(somarMes(ref, mp - 1)) + '</b> · ' + mp + (mp === 1 ? ' mês' : ' meses') + '.</p>'
    : pill('neutro', 'Sem data e sem valor por mês');
  return topo + '<div class="cenarios"><span class="lbl">Estimativa para chegar antes</span><ul>' + cenarios + '</ul></div>' + progresso;
}
const INFO = { contas(c){ return c.parcelas ? infoParcela(c) : (c.categoria === 'assinaturas' && c.valor ? brl(c.valor * 12) + ' por ano' : ''); }, cartao(i){ return i.parcelas ? infoParcela(i) : 'cobrança todo mês'; }, anuais:infoAnual, porquinhos:infoPorquinho };
function getLista(nome){ return nome === 'contas' ? S.contas : nome === 'cartao' ? S.cartao.itens : nome === 'anuais' ? S.anuais : nome === 'porquinhos' ? S.porquinhos : nome === 'besteira' ? S.besteira.gastos : []; }
function acharItem(linha){ return getLista(linha.dataset.lista).filter((x) => { return x.id === linha.dataset.id; })[0]; }
function atualizarInfos(raiz){
  $$('[data-lista]', raiz).forEach((linha) => {
    const fn = INFO[linha.dataset.lista], alvo = linha.querySelector('[data-info]'), item = acharItem(linha);
    if (fn && alvo && item) { alvo.innerHTML = fn(item); mov.aplicarMedidas(alvo); }
  });
}

function renderContas(rebuild){
  const el = $('#listaContas'), elA = $('#listaAssin');
  const assin = S.contas.filter((c) => { return c.categoria === 'assinaturas'; }), outras = S.contas.filter((c) => { return c.categoria !== 'assinaturas'; });
  const cab = function(nome){ return '<div class="linha linha-cab l-contas" aria-hidden="true"><span>' + nome + '</span><span>Categoria</span><span class="n">Valor por mês</span><span class="n">Parcelas restantes</span><span></span></div>'; };
  if (rebuild) {
    el.innerHTML = cab('Conta') + (outras.length ? outras.map(linhaContaHTML).join('') : vazioTostao('Nenhuma conta por aqui ainda. Comece pelas fixas: aluguel, luz, internet.', 'acenando'));
    elA.innerHTML = cab('Assinatura') + (assin.length ? assin.map(linhaContaHTML).join('') : '<p class="vazio">Nenhuma assinatura. Use as sugestões abaixo.</p>');
  }
  atualizarInfos(el); atualizarInfos(elA);
  const total = soma(S.contas.map((c) => { return c.valor; })), tA = soma(assin.map((c) => { return c.valor; }));
  contar('#contasTotal', total);
  contar('#outrasTotal', total - tA);
  $('#assinTotal').innerHTML = brl(tA) + ' <small>por mês · ' + brl(tA * 12) + ' por ano</small>';
  const porCat = {};
  S.contas.forEach((c) => { porCat[c.categoria] = (porCat[c.categoria] || 0) + (c.valor || 0); });
  const itens = Object.keys(porCat).filter((k) => { return porCat[k] > 0; }).sort((a, b) => { return porCat[b] - porCat[a]; }).map((k) => { return { nome:CATEGORIAS[k], v:r2(porCat[k]) }; });
  $('#contasCat').innerHTML = itens.length ? hbarsHTML(itens, total, 'c1') : '<li class="vazio">Sem valores ainda.</li>';
  mov.aplicarMedidas($('#contasCat'));
}

function renderCartao(rebuild){
  const el = $('#listaCartao');
  $('#ctFaturaRot').textContent = 'Fatura de ' + MESES_LONGOS[mesNum(S.mesRef) - 1];
  if (rebuild) el.innerHTML = '<div class="linha linha-cab l-cartao" aria-hidden="true"><span>Descrição</span><span class="n">Valor da parcela</span><span>Parcela atual</span><span></span></div>' +
    (S.cartao.itens.length ? S.cartao.itens.map(linhaCartaoHTML).join('') : vazioTostao('Nada no cartão. Lance a primeira compra no formulário abaixo ou no botão +.', 'feliz'));
  atualizarInfos(el);
  contar('#ctFatura', R.cartao);
  $('#ctMini').innerHTML = miniColsHTML(PROJ.slice(0, 6).map((p, k) => { return { mes:p.mes, v:p.r.cartao, forte:k === 0 }; }), 'c3');
  mov.aplicarMedidas($('#ctMini'));
  $('#ctMiniResumo').textContent = `próxima: ${brl(PROJ[1] ? PROJ[1].r.cartao : 0)}`;
  const futuro = soma(S.cartao.itens.filter((i) => { return i.parcelas; }).map((i) => { return i.valor * i.parcelas; }));
  const recorrente = soma(S.cartao.itens.filter((i) => { return !i.parcelas; }).map((i) => { return i.valor; }));
  const usado = r2(futuro + recorrente), lim = S.cartao.limite;
  $('#ctLimiteResumo').textContent = lim ? `livre: ${brl(lim - usado)}` : 'opcional';
  if (lim) {
    const fr = usado / lim, st = fr > 0.8 ? 'bad' : fr > 0.5 ? 'warn' : 'ok';
    $('#ctLimite').innerHTML = medidorHTML('ct-limite', fr * 100, st) + '<p class="hint">' + brl(usado) + ' do limite está preso em parcelas e cobranças do mês (' + pct(fr) + '). Livre no cartão: <b>' + brl(lim - usado) + '</b>.</p>';
    mov.aplicarMedidas($('#ctLimite'));
  } else {
    $('#ctLimite').innerHTML = '<p class="hint">Informe o limite para ver quanto dele está preso em parcelas. Parcelas que ainda vêm: <b>' + brl(futuro) + '</b>.</p>';
  }
}

function renderAnuais(rebuild){
  const el = $('#listaAnuais');
  if (rebuild) el.innerHTML = '<div class="linha linha-cab l-anuais" aria-hidden="true"><span>Gasto</span><span class="n">Valor no ano</span><span>Vence em</span><span class="n">Parcelas</span><span class="n">Já separei</span><span class="n">Neste mês</span><span></span></div>' +
    (S.anuais.length ? S.anuais.map(linhaAnualHTML).join('') : '<p class="vazio">Nenhum gasto anual. Use as sugestões abaixo.</p>');
  atualizarInfos(el);
  contar('#anTotal', R.anuais);
}

function capacidadeHTML(r){
  const linha = function(k, v){ return '<div><dt>' + k + '</dt><dd>' + (v < 0 ? '− ' : '') + brl(Math.abs(v)) + '</dd></div>'; };
  const sobra = r2(r.guardavel - r.porquinhos);
  return linha('Salário', r.salario) + linha('Contas do mês', -(r.fixas + r.parcelas)) + linha('Assinaturas e serviços', -r.assinaturas) + linha('Cartão de crédito', -r.cartao) +
    linha('Reserva para gastos anuais', -r.anuais) + linha('Teto de besteira', -r.besteira) + linha('Margem para imprevistos (' + fUm.format(S.margem || 0) + '%)', -r.margem) +
    '<div class="total"><dt>Dá pra guardar sem apertar</dt><dd>' + brl(r.guardavel) + '</dd></div>' + linha('Porquinhos de hoje', -r.porquinhos) +
    '<div class="total ' + (sobra >= 0 ? 'ok' : 'bad') + '"><dt>' + (sobra >= 0 ? 'Ainda cabe por mês' : 'Passou do confortável') + '</dt><dd>' + brl(Math.abs(sobra)) + '</dd></div>';
}
function renderPorquinhos(rebuild){
  const el = $('#listaPorq');
  if (rebuild) el.innerHTML = S.porquinhos.length ? S.porquinhos.map(porqHTML).join('') : vazioTostao('Nenhum porquinho ainda. Diga quanto quer juntar e até quando, que eu calculo o resto.', 'acenando');
  atualizarInfos(el);
  contar('#pqTotal', R.porquinhos);
  $('#capacidade').innerHTML = capacidadeHTML(R);
  $('#capResumo').textContent = brl(R.guardavel);
}
let fgProj = [];
function graficoFgtsHTML(saldoHoje, proj){
  const pontos = [saldoHoje].concat(proj.map((p) => p.saldoFinal)), n = pontos.length - 1, max = Math.max(1, ...pontos);
  const x = (i) => (i / n * 100).toFixed(3), y = (v) => (100 - v / max * 92).toFixed(3);
  const linha = pontos.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const anos = [12, 24].filter((i) => i < n).map((i) => `<line class="fg-ano" x1="${x(i)}" x2="${x(i)}" y1="0" y2="100"/>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Saldo do FGTS nos próximos ${n} meses, de ${brl(saldoHoje)} para ${brl(pontos[n])}">` +
    `${anos}<path class="fg-area" d="${linha} L100 100 L0 100 Z"/><path class="fg-linha" d="${linha}"/></svg><span class="fg-guia" hidden></span><span class="fg-ponto" hidden></span>`;
}
function renderFgts(){
  const f = S.fgts;
  $('#fgDados').hidden = !f.ativo; $('#fgResultado').hidden = !f.ativo; $('#fgVazio').hidden = f.ativo;
  contar('#fgSaldoTopo', f.ativo ? f.saldo : 0);
  if (!f.ativo) return;
  const m = fgtsMes(S, S.mesRef);
  const linha = (k, v, cls) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`;
  $('#fgBaseAviso').hidden = f.bruto > 0;
  $('#fgMes').innerHTML = linha('Saldo hoje', brl(f.saldo)) +
    linha(`Depósito do mês (${fUm.format(f.aliquota)}% de ${brl(fgtsBase(S))})`, `+ ${brl(m.mensal)}`) +
    (m.decimo ? linha('Parte do 13º salário', `+ ${brl(m.decimo)}`) : '') +
    (m.ferias ? linha('Adicional de férias (1/3)', `+ ${brl(m.ferias)}`) : '') +
    linha(`Rendimento (${fTaxa.format(m.taxa * 100)}% no mês)`, `+ ${brl(m.rendimento)}`) +
    linha(`Saldo ao fechar ${MESES_LONGOS[mesNum(S.mesRef) - 1]}`, brl(m.saldoFinal), 'total ok');
  fgProj = projetarFgts(S, 36);
  const anos = fgtsPorAno(fgProj);
  $('#fgProjResumo').textContent = brl(fgProj[fgProj.length - 1].saldoFinal);
  $('#fgGraf').innerHTML = graficoFgtsHTML(f.saldo, fgProj);
  $('#fgMarcos').innerHTML = `<span>Hoje<b>${brl(f.saldo)}</b></span>` + anos.map((x, k) => `<span>Em ${k + 1} ${k ? 'anos' : 'ano'}<b>${brl(x.saldo)}</b></span>`).join('');
  $('#fgAnos').innerHTML = tabelaFgtsHTML(fgProj);
}
function renderSim(){
  const v = lerDinheiro($('#simValor').value), m = lerInteiro($('#simMeses').value), out = $('#simRes');
  if (!v || !m) { out.innerHTML = '<p class="hint">Preencha quanto e em quantos meses para ver a conta.</p>'; return; }
  const mensal = ceil2(v / m), livre = r2(R.guardavel - R.porquinhos);
  let msg;
  if (mensal <= livre) msg = pill('ok', 'Cabe no bolso') + '<p class="hint">Depois disso ainda sobram ' + brl(livre - mensal) + ' por mês para guardar sem apertar.</p>';
  else if (livre > 0) { const mm = Math.ceil(v / livre - 1e-9); msg = pill('warn', 'Aperta') + '<p class="hint">Passa ' + brl(mensal - livre) + ' do que sobra com folga. Usando só os ' + brl(livre) + ' livres por mês, você chega lá em ' + mm + (mm === 1 ? ' mês' : ' meses') + ' (' + rotuloMes(somarMes(S.mesRef, mm - 1)) + ').</p>'; }
  else msg = pill('bad', 'Não cabe hoje') + '<p class="hint">Os porquinhos atuais já usam todo o espaço confortável. Diminua o teto de besteira ou dê mais prazo a outro porquinho.</p>';
  out.innerHTML = '<div class="sim-num"><strong>' + brl(mensal) + '</strong><span>por mês, ' + m + (m === 1 ? ' vez' : ' vezes') + ' · até ' + rotuloMes(somarMes(S.mesRef, m - 1)) + '</span></div>' + msg;
}

function renderBesteiras(rebuild){
  const doMes = S.besteira.gastos.filter((g) => { return g.mes === S.mesRef; });
  const gasto = R.gastoBesteira, teto = S.besteira.teto || 0;
  contar('#bsTotal', gasto);
  const fr = teto ? gasto / teto : (gasto > 0 ? 1 : 0);
  const st = !teto ? 'neutro' : fr > 1 ? 'bad' : fr > 0.8 ? 'warn' : 'ok';
  const m = $('#bsMeter'); m.className = 'meter grosso ' + st; m.firstElementChild.style.width = Math.min(100, fr * 100) + '%'; m.firstElementChild.dataset.largura = Math.min(100, fr * 100);
  $('#bsStatus').innerHTML = teto ? pill(st, fr > 1 ? 'Estourou ' + brl(gasto - teto) : pct(fr) + ' do teto') : '';
  let dica;
  if (!teto) dica = 'Defina um teto para acompanhar.';
  else if (gasto >= teto) dica = 'O teto de ' + brl(teto) + ' já foi. O que passar sai do que estava livre.';
  else if (S.mesRef === mesHoje()) {
    const d = new Date(), ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), dias = ult - d.getDate() + 1;
    dica = 'Ainda dá ' + brl(teto - gasto) + ' até o fim do mês: ' + brl((teto - gasto) / dias) + ' por dia nos próximos ' + dias + (dias === 1 ? ' dia.' : ' dias.');
  } else dica = 'Ainda dá ' + brl(teto - gasto) + ' até fechar o mês.';
  $('#bsHint').textContent = dica;
  const ano = ritmoAnualBesteira();
  $('#bsAno').innerHTML = ano.valor > 0 ? (ano.media ? 'Na média dos últimos meses' : 'Se todo mês for como este') + ', são <strong>' + brl(ano.valor) + '</strong> por ano em besteira.' : '';
  $('#bsListaTit').textContent = 'Anotadas em ' + rotuloMesLongo(S.mesRef);
  if (rebuild) $('#listaBest').innerHTML = doMes.length ? doMes.map((g) => {
    return '<li data-lista="besteira" data-id="' + g.id + '"><span class="g-data">' + dataCurta(g.data) + '</span><span class="g-txt"><strong>' + esc(g.desc) + '</strong><small>' + CAT_BESTEIRA[g.cat] +
      (g.exemplo ? ' · <span class="tag-ex">exemplo</span>' : '') + '</small></span><span class="g-val">' + brl(g.valor) + '</span>' + botaoApagar(g.desc) + '</li>'; }).join('')
    : vazioTostao('Nada anotado em ' + rotuloMesLongo(S.mesRef) + '. Use o formulário ou o botão +.', 'feliz', 'li');
  const porCat = {};
  doMes.forEach((g) => { porCat[g.cat] = (porCat[g.cat] || 0) + g.valor; });
  const itens = Object.keys(porCat).sort((a, b) => { return porCat[b] - porCat[a]; }).map((k) => { return { nome:CAT_BESTEIRA[k], v:r2(porCat[k]) }; });
  $('#bsCat').innerHTML = itens.length ? hbarsHTML(itens, gasto, 'c6') : '<li class="vazio">Sem anotações neste mês.</li>';
  mov.aplicarMedidas($('#bsCat'));
  const hist = S.historico.slice(-5).map((h) => { return { mes:h.mes, v:h.besteira || 0 }; });
  $('#bsHist').innerHTML = hist.length ? miniColsHTML(hist.concat([{ mes:S.mesRef, v:gasto, forte:true }]), 'c6')
    : '<p class="hint">Quando você fechar o mês, o total de besteiras fica guardado aqui para comparar.</p>';
  mov.aplicarMedidas($('#bsHist'));
}

function tabela(cab, linhas, rodape){
  const td = function(v, i){ return '<td' + (cab[i].n ? ' class="n"' : '') + '>' + v + '</td>'; };
  return '<div class="tbl-scroll"><table class="rel"><thead><tr>' + cab.map((c) => { return '<th' + (c.n ? ' class="n"' : '') + '>' + c.t + '</th>'; }).join('') + '</tr></thead><tbody>' +
    linhas.map((l) => { return '<tr>' + l.map(td).join('') + '</tr>'; }).join('') + '</tbody>' +
    (rodape ? '<tfoot><tr>' + rodape.map(td).join('') + '</tr></tfoot>' : '') + '</table></div>';
}
function kpi(rot, val, sub){ return '<div class="rel-kpi"><span class="eyebrow">' + rot + '</span><strong>' + val + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>'; }

function relatorioHTML(){
  const r = R, ref = S.mesRef, agora = new Date(), base = r.salario || 1;
  const sec = function(id, titulo, corpo, lado){ return '<section class="rel-sec" data-sec="' + id + '"' + (PREFS.secoes[id] === false ? ' hidden' : '') + '><h3><span>' + titulo + '</span>' + (lado ? '<span class="rel-lado">' + lado + '</span>' : '') + '</h3>' + corpo + '</section>'; };
  const vazio = function(t){ return '<p class="hint">' + t + '</p>'; };
  const ultima = function(x){ return x.parcelas ? rotuloMes(somarMes(ref, x.parcelas - 1)) : '—'; };
  const nome = function(x){ return esc(x.nome || 'Sem nome'); };

  let h = '<header class="rel-capa"><div class="rel-marca"><span class="selo">' + ICON.porco + '</span><div><span class="eyebrow">Bolso em Dia · relatório ' + (S.perfil.nome ? 'de ' + esc(S.perfil.nome) : 'do mês') + '</span><h2>' + cap(rotuloMesLongo(ref)) + '</h2></div></div>' +
    '<div class="rel-meta"><span>Gerado em ' + agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) + '</span>' + pill(r.status, STATUS[r.status].rotulo) + '</div></header>';

  h += sec('resumo', 'Resumo', '<div class="rel-kpis">' + kpi('Salário', brl(r.salario)) +
    kpi('Contas, cartão e anuais', brl(r.obrigatorio), pct(r.obrigatorio / base) + ' do salário') +
    kpi('Porquinhos', brl(r.porquinhos), pct(r.porquinhos / base) + ' do salário') +
    kpi('Livre depois de tudo', brl(r.livre), 'margem para imprevistos: ' + brl(r.margem)) + '</div><p class="rel-nota">' + textoStatus(r) + '</p>');

  const partes = partesDestino(r).filter((p) => { return p.v > 0; }), totPartes = soma(partes.map((p) => { return p.v; }));
  h += sec('destino', 'Para onde vai o salário', '<div class="seg-bar">' + segBarHTML(r, false) + '</div>' +
    tabela([{ t:'Parte' }, { t:'Valor', n:1 }, { t:'% do salário', n:1 }], partes.map((p) => { return ['<span class="sw ' + p.cls + '"></span>' + p.nome, brl(p.v), pct(p.v / base)]; }), ['Total', brl(totPartes), pct(totPartes / base)]));

  h += sec('contas', 'Contas do mês', S.contas.length ? tabela([{ t:'Conta' }, { t:'Categoria' }, { t:'Valor', n:1 }, { t:'Parcelas', n:1 }, { t:'Última', n:1 }],
    S.contas.map((c) => { return [nome(c), CATEGORIAS[c.categoria], brl(c.valor), c.parcelas ? c.parcelas + ' restantes' : 'todo mês', ultima(c)]; }),
    ['Total', '', brl(r.contas), '', '']) + (r.assinaturas ? '<p class="rel-nota">Assinaturas e serviços: <b>' + brl(r.assinaturas) + '</b> por mês, <b>' + brl(r.assinaturas * 12) + '</b> por ano.</p>' : '') : vazio('Nenhuma conta lançada.'), brl(r.contas));

  const prox = PROJ.slice(0, 6);
  h += sec('cartao', 'Cartão de crédito', (S.cartao.itens.length ? tabela([{ t:'Descrição' }, { t:'Valor', n:1 }, { t:'Parcela', n:1 }, { t:'Última', n:1 }, { t:'Falta pagar', n:1 }],
    S.cartao.itens.map((i) => { return [nome(i), brl(i.valor), parcelaAtual(i) ? parcelaAtual(i) + ' de ' + i.total : 'todo mês', ultima(i), i.parcelas ? brl(i.valor * i.parcelas) : '—']; }),
    ['Fatura de ' + MESES_LONGOS[mesNum(ref) - 1], brl(r.cartao), '', '', brl(soma(S.cartao.itens.map((i) => { return i.parcelas ? i.valor * i.parcelas : 0; })))]) : vazio('Nada no cartão.')) +
    '<h4>Próximas faturas</h4>' + tabela(prox.map((p) => { return { t:rotuloMes(p.mes), n:1 }; }), [prox.map((p) => { return brl(p.r.cartao); })]), brl(r.cartao));

  h += sec('anuais', 'Gastos anuais', S.anuais.length ? tabela([{ t:'Gasto' }, { t:'Valor no ano', n:1 }, { t:'Vence', n:1 }, { t:'Parcelas', n:1 }, { t:'Já separado', n:1 }, { t:'Este mês', n:1 }],
    S.anuais.map((a) => { const parc = (a.parcelas || 1) > 1; return [nome(a), a.valor ? brl(a.valor) : 'a definir', a.mes ? cap(MESES_LONGOS[a.mes - 1]) : 'a definir',
      parc ? a.parcelas + '× de ' + brl(r2((a.valor || 0) / a.parcelas)) : 'à vista', parc ? '—' : brl(a.reservado), a.valor && a.mes ? brl(aporteAnual(a, ref)) : '—']; }),
    ['Total', '', '', '', '', brl(r.anuais)]) : vazio('Nenhum gasto anual.'), brl(r.anuais) + ' este mês');

  h += sec('porquinhos', 'Porquinhos', S.porquinhos.length ? tabela([{ t:'Objetivo' }, { t:'Meta', n:1 }, { t:'Guardado', n:1 }, { t:'Progresso', n:1 }, { t:'Por mês', n:1 }, { t:'Até', n:1 }, { t:'Situação' }],
    S.porquinhos.map((p) => {
      const prog = p.meta ? Math.min(1, (p.guardado || 0) / p.meta) : 0, nec = necessarioPorquinho(p, ref), m = mesesPorquinho(p, ref);
      let sit;
      if (!p.meta) sit = 'sem meta';
      else if (!faltaPorquinho(p)) sit = 'meta batida';
      else if (nec && p.mensal > 0 && p.mensal + 0.005 < nec) sit = 'não chega a tempo: precisa de ' + brl(nec) + ' por mês';
      else if (isFinite(m)) sit = 'chega em ' + rotuloMes(somarMes(ref, m - 1));
      else sit = '—';
      return [nome(p) + (p.exemplo ? ' <span class="tag-ex">exemplo</span>' : ''), p.meta ? brl(p.meta) : 'sem meta', brl(p.guardado),
        p.meta ? '<span class="rel-prog"><span style="width:' + (prog * 100) + '%"></span></span>' + pct(prog) : '—', brl(aportePorquinho(p, ref)), p.ate ? rotuloMes(p.ate) : 'sem data', sit];
    }), ['Total', soma(S.porquinhos.map((p) => { return p.meta; })) ? brl(soma(S.porquinhos.map((p) => { return p.meta; }))) : '—', brl(soma(S.porquinhos.map((p) => { return p.guardado; }))), '', brl(r.porquinhos), '', '']) : vazio('Nenhum porquinho.'), brl(r.porquinhos) + ' por mês');

  const doMes = S.besteira.gastos.filter((g) => { return g.mes === ref; }), porCat = {};
  doMes.forEach((g) => { porCat[g.cat] = (porCat[g.cat] || 0) + g.valor; });
  const ano = ritmoAnualBesteira(), teto = S.besteira.teto || 0;
  h += sec('besteiras', 'Besteiras', '<div class="rel-kpis k3">' + kpi('Teto do mês', brl(teto)) + kpi('Gasto', brl(r.gastoBesteira), teto ? pct(r.gastoBesteira / teto) + ' do teto' : '') +
    kpi(ano.media ? 'Por ano, na média' : 'Por ano, nesse ritmo', brl(ano.valor)) + '</div>' +
    (doMes.length ? tabela([{ t:'Tipo' }, { t:'Valor', n:1 }, { t:'% do gasto', n:1 }], Object.keys(porCat).sort((a, b) => { return porCat[b] - porCat[a]; }).map((k) => { return [CAT_BESTEIRA[k], brl(porCat[k]), pct(porCat[k] / (r.gastoBesteira || 1))]; })) +
      '<h4>Anotações</h4>' + tabela([{ t:'Dia' }, { t:'O que foi' }, { t:'Tipo' }, { t:'Valor', n:1 }], doMes.map((g) => { return [dataCurta(g.data), esc(g.desc), CAT_BESTEIRA[g.cat], brl(g.valor)]; }))
      : vazio('Nenhuma besteira anotada neste mês.')), brl(r.gastoBesteira));

  if (S.fgts.ativo) {
    const fg = fgtsMes(S, ref), fp = projetarFgts(S, 36), fim = fp[fp.length - 1];
    h += sec('fgts', 'FGTS', '<div class="rel-kpis">' + kpi('Saldo hoje', brl(S.fgts.saldo)) +
      kpi('Depósito do mês', brl(fg.deposito), fUm.format(S.fgts.aliquota) + '% de ' + brl(fgtsBase(S))) +
      kpi('Rendimento do mês', brl(fg.rendimento), '3% ao ano + TR de ' + fTaxa.format(S.fgts.tr) + '% ao mês') +
      kpi('Em 3 anos', brl(fim.saldoFinal), 'ao fechar ' + rotuloMes(fim.mes)) + '</div>' +
      '<h4>Próximos 3 anos</h4>' + tabelaFgtsHTML(fp) +
      '<p class="rel-nota">Estimativa com o salário de hoje, sem aumentos, saques nem a distribuição anual de lucros do fundo.</p>', brl(S.fgts.saldo));
  }

  h += sec('projecao', 'Próximos 12 meses', '<div class="rel-graf">' + svgProjecao(PROJ, 760, false, 240) + '</div><ul class="eventos">' + eventosHTML() + '</ul><h4>Mês a mês</h4><div class="tbl-scroll"><table class="rel">' + tabelaProjecaoHTML() + '</table></div>');

  h += sec('dividas', 'Dívidas e parcelas', r.parcelados.length ? tabela([{ t:'Item' }, { t:'Onde' }, { t:'Parcela', n:1 }, { t:'Restantes', n:1 }, { t:'Última', n:1 }, { t:'Falta pagar', n:1 }],
    r.parcelados.slice().sort((a, b) => { return a.parcelas - b.parcelas; }).map((x) => { return [nome(x), x.onde, brl(x.valor), x.parcelas, ultima(x), brl(x.valor * x.parcelas)]; }),
    ['Total', '', '', '', '', brl(r.devo)]) : vazio('Nenhuma parcela em aberto.'), brl(r.devo));

  h += sec('historico', 'Histórico de meses fechados', S.historico.length ? tabela([{ t:'Mês' }, { t:'Salário', n:1 }, { t:'Contas, cartão e anuais', n:1 }, { t:'Porquinhos', n:1 }, { t:'Besteira', n:1 }, { t:'Livre', n:1 }],
    S.historico.slice(-12).reverse().map((x) => { return [cap(rotuloMesLongo(x.mes)), brl(x.salario), brl(x.obrigatorio), brl(x.porquinhos), brl(x.besteira) + (x.teto ? ' <small class="muted">/ ' + brl(x.teto) + '</small>' : ''), brl(x.livre)]; }))
    : vazio('Nenhum mês fechado ainda. Use "Fechar o mês" no fim de cada mês para montar o histórico.'));

  h += '<footer class="rel-rodape">Parcelas restantes contam a do mês do relatório. Valores calculados com o que foi preenchido no Bolso em Dia.</footer>';
  return h;
}
function renderRelatorio(){ $('#relDoc').innerHTML = relatorioHTML(); }
function documentoRelatorio(){
  renderRelatorio();
  return '<!DOCTYPE html>\n<html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Relatório de ' + rotuloMesLongo(S.mesRef) + ' · Bolso em Dia</title><link rel="stylesheet" href="' + $('#fontes').href + '"><style>' + $('#estilo').textContent + '</style></head>' +
    '<body class="so-relatorio"><main class="wrap"><div class="rel-topo-doc no-print"><button type="button" class="btn btn-primary" onclick="window.print()">Imprimir ou salvar PDF</button></div>' +
    '<article class="folha">' + $('#relDoc').innerHTML + '</article></main></body></html>';
}
function baixarRelatorio(){
  baixar('relatorio-bolso-em-dia-' + S.mesRef + '.html', documentoRelatorio(), 'text/html');
  toast('Relatório baixado.');
}
function abrirRelatorio(){
  const url = URL.createObjectURL(new Blob([documentoRelatorio()], { type:'text/html;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => { URL.revokeObjectURL(url); }, 60000);
}
function baixar(nome, texto, tipo){
  const url = URL.createObjectURL(new Blob([texto], { type:tipo + ';charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => { URL.revokeObjectURL(url); }, 2000);
}

function abaAtiva(){ const b = $('.aba[aria-selected="true"]'); return b ? b.dataset.aba : 'visao'; }
function render(rebuild){
  recalcular();
  renderTopo(); renderResumo(); renderAviso(); renderAvisoMes(); renderContadores(); renderVisao(); renderPassos(); renderPerfil(); renderDica();
  renderContas(rebuild); renderCartao(rebuild); renderAnuais(rebuild); renderPorquinhos(rebuild); renderBesteiras(rebuild); renderFgts(); renderSim();
  if (abaAtiva() === 'relatorio') renderRelatorio();
  previewCompra();
  salvar();
}

const tip = $('#tip');
function mostrarTip(html, x, y){
  tip.innerHTML = html;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = x + 14, top = y - h - 12;
  if (left + w > innerWidth - 8) left = x - w - 14;
  if (left < 8) left = 8;
  if (top < 8) top = y + 18;
  tip.style.left = `${left}px`; tip.style.top = `${top}px`;
  tip.classList.add('visivel'); tip.setAttribute('aria-hidden', 'false');
}
function esconderTip(){
  tip.classList.remove('visivel'); tip.setAttribute('aria-hidden', 'true');
  $$('.g-bar.ativo').forEach((b) => { b.classList.remove('ativo'); });
}
function ativarBarra(i){ $$('.g-bar.ativo').forEach((b) => { b.classList.remove('ativo'); }); const b = $('#grafProj .g-bar[data-i="' + i + '"]'); if (b) b.classList.add('ativo'); }

let timerToast = null, seqToast = 0;
function toast(msg, acao, onAcao){
  const t = $('#toast'), duracao = acao ? 7000 : 2800, id = ++seqToast, jaVisivel = !t.hidden;
  t.getAnimations().forEach((a) => a.cancel());
  t.innerHTML = `<span>${esc(msg)}</span>${acao ? `<button type="button">${esc(acao)}</button>` : ''}<span class="toast-tempo" style="animation-duration:${duracao}ms"></span>`;
  t.hidden = false;
  if (jaVisivel) mov.animar(t, [{ transform:'translate(-50%, 0) scale(.96)' }, { transform:'translate(-50%, 0) scale(1)' }], { duration:220 });
  if (acao) t.querySelector('button').addEventListener('click', () => { fecharToast(id); onAcao(); });
  clearTimeout(timerToast); timerToast = setTimeout(() => fecharToast(id), duracao);
}
function fecharToast(id){
  const t = $('#toast');
  if (t.hidden || id !== seqToast) return;
  mov.fim(mov.animar(t, [{ opacity:1, transform:'translate(-50%, 0)' }, { opacity:0, transform:'translate(-50%, 14px)' }], { duration:200, fill:'forwards' })).then(() => {
    if (id !== seqToast) return;
    t.hidden = true;
    t.getAnimations().forEach((a) => a.cancel());
  });
}
function comDesfazer(msg, fn){
  const foto = JSON.stringify(S);
  fn(); render(true);
  toast(msg, 'Desfazer', () => { S = normalizar(JSON.parse(foto)); render(true); toast('Desfeito.'); });
}
function esperarResposta(dialogo){
  return new Promise((ok) => {
    const form = dialogo.querySelector('form');
    const fim = (valor) => {
      form.removeEventListener('submit', aoEnviar); dialogo.removeEventListener('cancel', aoCancelar); dialogo.removeEventListener('close', aoFechar);
      setTimeout(() => ok(valor), 0);
    };
    const aoEnviar = (e) => { if (e.defaultPrevented) return; const b = e.submitter || document.activeElement; fim(b && b.value ? b.value : ''); };
    const aoCancelar = () => fim('');
    const aoFechar = () => fim(dialogo.returnValue || '');
    form.addEventListener('submit', aoEnviar); dialogo.addEventListener('cancel', aoCancelar); dialogo.addEventListener('close', aoFechar);
  });
}
function confirmar(titulo, texto, rotuloOk, rotuloNao){
  return new Promise((res) => {
    const d = $('#dlgConfirma');
    if (typeof d.showModal !== 'function') { res(window.confirm(titulo + '\n\n' + texto)); return; }
    if (d.open) { esperarResposta(d).then(() => confirmar(titulo, texto, rotuloOk, rotuloNao).then(res)); return; }
    $('#dcTit').textContent = titulo; $('#dcTxt').textContent = texto; $('#dcOk').textContent = rotuloOk; $('#dcNao').textContent = rotuloNao || 'Cancelar';
    d.returnValue = ''; d.showModal();
    esperarResposta(d).then((v) => res(v === 'ok'));
  });
}

function abrirFechar(){
  const prox = somarMes(S.mesRef, 1), sim = avancarMes(S, true), itens = [];
  const parc = S.contas.concat(S.cartao.itens).filter((x) => { return x.parcelas; });
  if (parc.length) itens.push('Desconta uma parcela de ' + parc.length + (parc.length === 1 ? ' item parcelado.' : ' itens parcelados.'));
  sim.eventos.forEach((e) => {
    if (e.tipo === 'quitou') itens.push('<b>' + esc(e.nome) + '</b> chega na última parcela e sai da lista.');
    if (e.tipo === 'anual') itens.push(e.parcelado ? '<b>' + esc(e.nome) + '</b> paga a última parcela do ano.' : '<b>' + esc(e.nome) + '</b> vence agora: o separado volta a zero para o próximo ano.');
    if (e.tipo === 'meta') itens.push('O porquinho <b>' + esc(e.nome) + '</b> bate a meta.');
  });
  if (R.anuais > 0) itens.push('Soma ' + brl(R.anuais) + ' ao que está separado para os gastos anuais.');
  if (sim.fgts) itens.push('Atualiza o FGTS: ' + brl(sim.fgts.deposito) + ' de depósito e ' + brl(sim.fgts.rendimento) + ' de rendimento, chegando a <b>' + brl(sim.fgts.saldoFinal) + '</b>.');
  itens.push('Guarda no histórico as besteiras de ' + MESES_LONGOS[mesNum(S.mesRef) - 1] + ' (' + brl(R.gastoBesteira) + ') e começa ' + MESES_LONGOS[mesNum(prox) - 1] + ' do zero.');
  itens.push('Passa o mês de referência para <b>' + rotuloMesLongo(prox) + '</b>.');
  $('#dfTit').textContent = 'Fechar ' + rotuloMesLongo(S.mesRef);
  $('#dfLista').innerHTML = itens.map((i) => { return '<li>' + i + '</li>'; }).join('');
  $('#dfOk').textContent = 'Fechar e ir para ' + MESES_LONGOS[mesNum(prox) - 1];
  $('#dfPorqRot').hidden = R.porquinhos <= 0;
  $('#dfPorqRot span').textContent = 'Guardei ' + brl(R.porquinhos) + ' nos porquinhos este mês (somar em cada um)';
  $('#dfPorq').checked = true;
  const d = $('#dlgFechar');
  if (typeof d.showModal !== 'function') { if (window.confirm('Fechar ' + rotuloMesLongo(S.mesRef) + '?')) aplicarFechamento(true); return; }
  d.returnValue = ''; d.showModal();
  esperarResposta(d).then((v) => { if (v === 'ok') aplicarFechamento($('#dfPorq').checked); });
}
function aplicarFechamento(somar){
  const foto = JSON.stringify(S), passo = avancarMes(S, somar);
  S = passo.estado;
  render(true);
  const vitorias = passo.eventos.filter((e) => e.tipo === 'quitou' || e.tipo === 'meta').map((e) => e.nome);
  const fechado = passo.resumo, nome = primeiroNome(), voce = nome ? `Você, ${nome},` : 'Você', mesFechado = MESES_LONGOS[mesNum(somarMes(S.mesRef, -1)) - 1];
  const foiBem = fechado.status === 'ok' && (!fechado.besteira || fechado.gastoBesteira <= fechado.besteira), quitou = vitorias.map(esc).join(', ');
  momento = foiBem
    ? { ate:Date.now() + 10000, humor:'festa', texto:`${voce} economizou bastante em ${mesFechado}, parabéns!${quitou ? ` E ainda concluiu: ${quitou}.` : ''}` }
    : { ate:Date.now() + 10000, humor:'triste', texto:`${voce} se passou um pouco em ${mesFechado}, poupe money, bicha!${quitou ? ` Pelo menos ${quitou} ${vitorias.length > 1 ? 'ficaram' : 'ficou'} para trás.` : ''}` };
  if (foiBem || vitorias.length) mov.confete($('.hero-card'));
  renderDica(); setTimeout(renderDica, 10100);
  toast(`Pronto. Agora é ${rotuloMesLongo(S.mesRef)}.${vitorias.length ? ` Concluído: ${vitorias.join(', ')}.` : ''}`, 'Desfazer', () => { S = normalizar(JSON.parse(foto)); render(true); toast('Mês reaberto.'); });
}

const NUVEM = !!(window.google && google.script && google.script.run);
const sync = { pronto:false, iniciando:true, aplicando:false, versao:0, pendente:false, emVoo:false, timer:null, retry:null, url:'' };
const CHAVE_VERSAO = CHAVE + ':versao', CHAVE_PENDENTE = CHAVE + ':pendente';

function horaAgora(){ const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function statusNuvem(tipo, texto){ const el = $('#syncStatus'); if (!el) return; el.className = 'sync ' + tipo; el.textContent = texto; el.title = texto; }
function mostrarLinkPlanilha(){ const a = $('#linkPlanilha'); if (a && sync.url) { a.href = sync.url; a.hidden = false; } }
function guardarVersao(){ local.gravar(CHAVE_VERSAO, String(sync.versao)); }
function guardarPendente(v){ local.gravar(CHAVE_PENDENTE, v ? '1' : ''); }

function iniciarNuvem(){
  sync.iniciando = false;
  if (!NUVEM) { statusNuvem('local', 'Salvo só neste navegador'); return; }
  sync.versao = +local.ler(CHAVE_VERSAO) || 0;
  sync.pendente = local.ler(CHAVE_PENDENTE) === '1';
  statusNuvem('salvando', 'Conectando ao Google…');
  buscarNuvem(true);
}
function buscarNuvem(inicial){
  google.script.run
    .withSuccessHandler((res) => { receberNuvem(res, inicial); })
    .withFailureHandler(() => {
      statusNuvem('erro', 'Sem conexão com o Google. Usando o que está neste aparelho.');
      clearTimeout(sync.retry); sync.retry = setTimeout(() => { buscarNuvem(inicial); }, 20000);
    })
    .carregarDados();
}
function receberNuvem(res, inicial){
  sync.url = res.planilhaUrl || sync.url; mostrarLinkPlanilha();
  if (res.conta) { sync.conta = res.conta; const c = $('#menuConta'); c.textContent = `Conectado como ${res.conta}`; c.hidden = false; renderPerfil(); }
  sync.pronto = true;
  if (res.vazio) {
    sync.versao = 0;
    if (primeiroAcesso) { abrirBoasVindas(); return; }
    sync.pendente = true; enviar(); return;
  }
  if (sync.pendente) {
    if (res.versao === sync.versao) { enviar(); return; }
    resolverConflito(res); return;
  }
  if (inicial || res.versao !== sync.versao) adotarNuvem(res, !inicial);
  else statusNuvem('ok', 'Salvo no Google');
}
function adotarNuvem(res, avisar){
  let s = normalizar(res.estado);
  const migrado = (s.dados || 1) < DADOS_ATUAL;
  if (migrado) s = migrar(s);
  S = s; primeiroAcesso = false; sync.versao = res.versao; guardarVersao();
  sync.aplicando = true; render(true); sync.aplicando = false;
  if (migrado) { sync.pendente = true; guardarPendente(true); enviar(); }
  else { sync.pendente = false; guardarPendente(false); statusNuvem('ok', 'Salvo no Google'); }
  if (avisar) toast('Atualizado com o que mudou em outro aparelho.');
}
function marcarParaNuvem(){
  if (!NUVEM || sync.iniciando || sync.aplicando) return;
  sync.pendente = true; guardarPendente(true);
  if (!sync.pronto) return;
  statusNuvem('salvando', 'Alterações para salvar…');
  clearTimeout(sync.timer); sync.timer = setTimeout(enviar, 1200);
}
function enviar(){
  if (!NUVEM || !sync.pronto || sync.emVoo || !sync.pendente) return;
  clearTimeout(sync.timer); clearTimeout(sync.retry);
  sync.emVoo = true; sync.pendente = false;
  statusNuvem('salvando', 'Salvando no Google…');
  google.script.run
    .withSuccessHandler((res) => {
      sync.emVoo = false;
      if (res && res.conflito) { sync.pendente = true; resolverConflito(res); return; }
      sync.versao = res.versao; guardarVersao(); sync.url = res.planilhaUrl || sync.url; mostrarLinkPlanilha();
      if (sync.pendente) enviar();
      else { guardarPendente(false); statusNuvem('ok', 'Salvo no Google às ' + horaAgora()); }
    })
    .withFailureHandler(() => {
      sync.emVoo = false; sync.pendente = true; guardarPendente(true);
      statusNuvem('erro', 'Sem conexão. Salvo neste aparelho, tento de novo.');
      sync.retry = setTimeout(enviar, 20000);
    })
    .salvarDados(JSON.stringify(S), sync.versao);
}
function resolverConflito(res){
  statusNuvem('erro', 'Mudou em outro aparelho');
  confirmar('Os dados mudaram em outro lugar', 'A planilha foi alterada em outro aparelho ou direto no Google Sheets depois da última vez que esta tela salvou. Qual versão você quer manter?', 'Usar a da planilha', 'Manter a desta tela').then((usarPlanilha) => {
    if (usarPlanilha) adotarNuvem(res, false);
    else { sync.versao = res.versao; guardarVersao(); sync.pendente = true; guardarPendente(true); enviar(); }
  });
}
document.addEventListener('visibilitychange', () => {
  if (!NUVEM || !sync.pronto) return;
  if (document.hidden) { if (sync.pendente) enviar(); }
  else if (!sync.pendente && !sync.emVoo) buscarNuvem(false);
});
$('#syncStatus').addEventListener('click', () => {
  if (!NUVEM) { toast('Este arquivo salva só neste navegador. Para salvar no Google e abrir no celular, use o link do Apps Script.'); return; }
  if (sync.pendente) enviar();
  else if (!sync.emVoo) { statusNuvem('salvando', 'Buscando no Google…'); buscarNuvem(false); }
});

function mesesPendentes(){ const hoje = mesHoje(); let n = 0, m = S.mesRef; while (m < hoje && n < 120) { m = somarMes(m, 1); n++; } return n; }
function renderAvisoMes(){
  const n = mesesPendentes(), el = $('#avisoMes'), marca = n + '|' + S.mesRef;
  if (!n) { el.innerHTML = ''; el.removeAttribute('data-marca'); return; }
  if (el.getAttribute('data-marca') === marca) return;
  el.setAttribute('data-marca', marca);
  el.innerHTML = '<div class="aviso warn">' + ICON.calendario + '<p>Hoje é ' + rotuloMesLongo(mesHoje()) + ' e o Bolso ainda está em ' + rotuloMesLongo(S.mesRef) + '. Feche ' +
    (n === 1 ? 'o mês que passou' : 'os ' + n + ' meses que passaram') + ' para atualizar parcelas, porquinhos e histórico.</p><button type="button" class="btn btn-sm" id="btnAtualizarMeses">Fechar ' + (n === 1 ? '1 mês' : n + ' meses') + '</button></div>';
}
document.addEventListener('click', (e) => {
  if (!e.target.closest || !e.target.closest('#btnAtualizarMeses')) return;
  const n = mesesPendentes(); if (!n) return;
  const rot = n === 1 ? '1 mês' : n + ' meses';
  confirmar('Fechar ' + rot + '?', 'Vou fechar de ' + rotuloMesLongo(S.mesRef) + ' até ' + rotuloMesLongo(somarMes(S.mesRef, n - 1)) +
    ', como se você tivesse clicado em "Fechar o mês" em cada um: as parcelas avançam, o que terminou sai da lista, cada porquinho recebe o valor do mês e as besteiras vão para o histórico.', 'Fechar ' + rot).then((ok) => {
    if (!ok) return;
    let vitorias = 0;
    comDesfazer('Pronto. Agora é ' + rotuloMesLongo(somarMes(S.mesRef, n)) + '.', () => {
      for (let i = 0; i < n; i++) { const passo = avancarMes(S, true); vitorias += passo.eventos.filter((ev) => ev.tipo === 'quitou' || ev.tipo === 'meta').length; S = passo.estado; }
    });
    if (vitorias) { mov.confete($('.hero-card')); momento = { ate:Date.now() + 10000, humor:'festa', texto:'Uhul! Teve dívida quitada ou meta batida nesses meses.' }; renderDica(); setTimeout(renderDica, 10100); }
  });
});

const CRIPTO_OK = !!(window.crypto && window.crypto.subtle && window.TextEncoder && window.isSecureContext !== false);
const FORMATO_CIFRADO = 'bolso-em-dia-cifrado';
const ITER_PADRAO = 310000;
function paraB64(buf){ const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function deB64(t){ const s = atob(t), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
function chaveDaSenha(senha, sal, iter){
  return crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']).then((base) => {
    return crypto.subtle.deriveKey({ name:'PBKDF2', salt:sal, iterations:iter, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt', 'decrypt']);
  });
}
function cifrar(texto, senha){
  const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  return chaveDaSenha(senha, sal, ITER_PADRAO)
    .then((k) => { return crypto.subtle.encrypt({ name:'AES-GCM', iv }, k, new TextEncoder().encode(texto)); })
    .then((c) => { return JSON.stringify({ formato:FORMATO_CIFRADO, v:1, kdf:'PBKDF2-SHA256', iter:ITER_PADRAO, cifra:'AES-256-GCM', sal:paraB64(sal), iv:paraB64(iv), dados:paraB64(c) }); });
}
function decifrar(o, senha){
  if (!(o.iter >= 100000 && o.iter <= 2000000) || typeof o.sal !== 'string' || typeof o.iv !== 'string' || typeof o.dados !== 'string') return Promise.reject(new Error('formato'));
  return chaveDaSenha(senha, deB64(o.sal), o.iter)
    .then((k) => { return crypto.subtle.decrypt({ name:'AES-GCM', iv:deB64(o.iv) }, k, deB64(o.dados)); })
    .then((p) => { return new TextDecoder().decode(p); });
}

let botaoSenha = '';
function pedirSenha(o){
  return new Promise((res) => {
    const d = $('#dlgSenha');
    if (typeof d.showModal !== 'function') { const s = window.prompt(o.titulo + '\n\n' + o.texto); res(s ? { acao:'ok', senha:s } : (o.alt ? { acao:'alt' } : null)); return; }
    $('#dsTit').textContent = o.titulo; $('#dsTxt').textContent = o.texto; $('#dsOk').textContent = o.ok;
    $('#dsAlt').hidden = !o.alt; $('#dsAlt').textContent = o.alt || '';
    $('#dsConfRot').hidden = !o.confirmar; $('#dsErro').textContent = '';
    $('#dsSenha').value = ''; $('#dsConf').value = '';
    $('#dsSenha').setAttribute('autocomplete', o.confirmar ? 'new-password' : 'current-password');
    d.returnValue = ''; d.showModal(); $('#dsSenha').focus();
    esperarResposta(d).then((v) => {
      const s = $('#dsSenha').value;
      $('#dsSenha').value = ''; $('#dsConf').value = '';
      res(v === 'ok' ? { acao:'ok', senha:s } : v === 'alt' ? { acao:'alt' } : null);
    });
  });
}
$('#formSenha').addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button'); if (b) botaoSenha = b.value; });
['#dsSenha', '#dsConf'].forEach((sel) => { $(sel).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#dsOk').click(); } }); });
$('#formSenha').addEventListener('submit', (e) => {
  const qual = (e.submitter && e.submitter.value) || botaoSenha; botaoSenha = '';
  if (qual !== 'ok' || $('#dsConfRot').hidden) return;
  const s = $('#dsSenha').value;
  let erro = '';
  if (s.length < 8) erro = 'Use pelo menos 8 caracteres.';
  else if (s !== $('#dsConf').value) erro = 'As duas senhas não são iguais.';
  if (erro) { e.preventDefault(); $('#dsErro').textContent = erro; $('#dsSenha').focus(); }
});

function marcarBackup(){ PREFS.ultimoBackup = hojeISO(); salvarPrefs(); renderDica(); }
function exportarBackup(){
  const json = JSON.stringify(S, null, 2), nome = 'bolso-em-dia-backup-' + hojeISO();
  if (!CRIPTO_OK) { baixar(nome + '.json', json, 'application/json'); marcarBackup(); toast('Backup baixado sem senha (este navegador não oferece criptografia). Guarde em lugar seguro.'); return; }
  pedirSenha({ titulo:'Proteger o backup com senha', texto:'O arquivo tem seu salário, suas dívidas e seus gastos. Com senha, ele só abre para quem souber a senha. Anote a senha: sem ela, não dá para recuperar o backup.',
    confirmar:true, ok:'Baixar protegido', alt:'Baixar sem senha' }).then((r) => {
    if (!r) return;
    if (r.acao === 'alt') { baixar(nome + '.json', json, 'application/json'); marcarBackup(); toast('Backup baixado sem senha. Guarde em lugar seguro.'); return; }
    cifrar(json, r.senha)
      .then((c) => { baixar(nome + '-protegido.json', c, 'application/json'); marcarBackup(); toast('Backup protegido baixado.'); })
      .catch(() => { toast('Não consegui proteger o backup neste navegador.'); });
  });
}
function importarArquivo(f){
  if (f.size > 5 * 1024 * 1024) { toast('Esse arquivo é grande demais para ser um backup do Bolso em Dia.'); return; }
  const rd = new FileReader();
  rd.onload = function(){
    let o;
    try { o = JSON.parse(rd.result); } catch { toast('Esse arquivo não é um backup do Bolso em Dia.'); return; }
    if (o && o.formato === FORMATO_CIFRADO) {
      if (!CRIPTO_OK) { toast('Este navegador não consegue abrir backups protegidos.'); return; }
      pedirSenha({ titulo:'Backup protegido', texto:'Digite a senha usada quando o backup foi exportado.', confirmar:false, ok:'Abrir backup' }).then((r) => {
        if (!r || r.acao !== 'ok') return;
        decifrar(o, r.senha)
          .then((txt) => { aplicarImport(JSON.parse(txt)); })
          .catch(() => { toast('Senha errada ou arquivo danificado.'); });
      });
      return;
    }
    aplicarImport(o);
  };
  rd.readAsText(f);
}
function aplicarImport(o){
  if (!o || typeof o.salario !== 'number' || !Array.isArray(o.contas)) { toast('Esse arquivo não é um backup do Bolso em Dia.'); return; }
  const foto = JSON.stringify(S);
  let s = normalizar(o);
  if ((s.dados || 1) < DADOS_ATUAL) s = migrar(s);
  S = s; render(true);
  toast('Backup carregado.', 'Desfazer', () => { S = normalizar(JSON.parse(foto)); render(true); });
}
function pedirLimpeza(){
  if (NUVEM && (sync.pendente || sync.emVoo)) { toast('Espere aparecer "Salvo no Google" antes de apagar os dados deste aparelho.'); return; }
  confirmar('Apagar os dados deste aparelho?', NUVEM
      ? 'Apaga a cópia guardada neste navegador, útil em computador emprestado. Seus dados continuam na planilha do Google e voltam quando você abrir o link de novo.'
      : 'Apaga tudo o que foi salvo neste navegador e a página volta aos dados iniciais do arquivo. Se quiser guardar o que mudou, exporte um backup antes.',
    'Apagar deste aparelho').then((ok) => {
    if (!ok) return;
    semGravar = true; clearTimeout(timerSalvar);
    [CHAVE, CHAVE_VERSAO, CHAVE_PENDENTE, CHAVE_PREFS, CHAVE_ABA, CHAVE_TEMA].forEach(local.apagar);
    location.reload();
  });
}

function ler(el){
  const t = el.dataset.t;
  if (el.type === 'checkbox') return el.checked;
  if (t === 'taxa') return lerDinheiro(el.value, 4);
  if (t === 'money' || t === 'pct') return lerDinheiro(el.value);
  if (t === 'int') return lerInteiro(el.value);
  if (t === 'mes') return el.value ? +el.value : null;
  if (t === 'ate') return el.value || null;
  return el.value;
}
function setGlobal(g, v){
  if (g === 'nome') S.perfil.nome = String(v || '').slice(0, 60);
  else if (g === 'salario') S.salario = v || 0;
  else if (g === 'margem') S.margem = Math.min(50, Math.max(0, v || 0));
  else if (g === 'teto') S.besteira.teto = v || 0;
  else if (g === 'limite') S.cartao.limite = v;
  else if (g === 'fgAtivo') S.fgts.ativo = Boolean(v);
  else if (g === 'fgSaldo') S.fgts.saldo = v || 0;
  else if (g === 'fgBruto') S.fgts.bruto = v || 0;
  else if (g === 'fgAliq') S.fgts.aliquota = v > 0 ? Math.min(20, v) : 8;
  else if (g === 'fgTR') S.fgts.tr = Math.min(5, v || 0);
  else if (g === 'fg13') S.fgts.decimo = Boolean(v);
  else if (g === 'fgFerias') S.fgts.ferias = v;
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset) return;
  if (el.dataset.g) { setGlobal(el.dataset.g, ler(el)); render(false); return; }
  if (!el.dataset.f) return;
  const linha = el.closest('[data-lista]'); if (!linha) return;
  const item = acharItem(linha); if (!item) return;
  if (el.dataset.f === 'atual' || el.dataset.f === 'total') {
    const tot = lerInteiro(linha.querySelector('[data-f="total"]').value), at = lerInteiro(linha.querySelector('[data-f="atual"]').value) || 1;
    item.total = tot || null;
    item.parcelas = tot ? tot - Math.min(at, tot) + 1 : null;
  } else item[el.dataset.f] = ler(el);
  if (item.exemplo) { item.exemplo = false; $$('.tag-ex', linha).forEach((t) => { t.remove(); }); }
  render(false);
});
document.addEventListener('change', (e) => {
  const el = e.target, t = el.dataset && el.dataset.t;
  if (t === 'money') { const v = lerDinheiro(el.value); el.value = v ? num(v) : ''; }
  else if (t === 'int') { el.value = lerInteiro(el.value) || ''; }
  else if ((t === 'pct' || t === 'taxa') && el.dataset.g) { el.value = textoGlobal(el); }
  if (el.dataset && el.dataset.f === 'categoria') { render(true); return; }
  if (el.dataset && (el.dataset.f === 'ate' || (el.dataset.f === 'parcelas' && el.closest('[data-lista="anuais"]')))) { render(true); return; }
  if (el.dataset && (el.dataset.f === 'atual' || el.dataset.f === 'total')) {
    const ln = el.closest('[data-lista]'), it = ln && acharItem(ln);
    if (it) { ln.querySelector('[data-f="atual"]').value = parcelaAtual(it) || ''; ln.querySelector('[data-f="total"]').value = it.total || ''; }
  }
  if (el.dataset && el.dataset.f === 'nome') { const b = el.closest('[data-lista]'); const d = b && b.querySelector('[data-del]'); if (d) d.setAttribute('aria-label', 'Apagar ' + (el.value || 'item')); }
});

function adicionar(tipo){
  if (tipo === 'contas') S.contas.push({ id:uid(), nome:'', categoria:'outros', valor:0, parcelas:null });
  if (tipo === 'assinaturas') S.contas.push({ id:uid(), nome:'', categoria:'assinaturas', valor:0, parcelas:null });
  if (tipo === 'anuais') S.anuais.push({ id:uid(), nome:'', valor:null, mes:null, reservado:0 });
  if (tipo === 'porquinhos') S.porquinhos.push({ id:uid(), nome:'', meta:0, guardado:0, ate:null, mensal:null, exemplo:false });
  render(true);
  const lista = { contas:S.contas, assinaturas:S.contas, anuais:S.anuais, porquinhos:S.porquinhos }[tipo];
  realcarNovo(lista[lista.length - 1].id);
  const alvo = { contas:'#listaContas', assinaturas:'#listaAssin', anuais:'#listaAnuais', porquinhos:'#listaPorq' }[tipo];
  const campos = $$(alvo + ' [data-f="nome"]'); if (campos.length) campos[campos.length - 1].focus();
}

document.addEventListener('click', (e) => {
  const alvo = e.target;
  const menu = $('#menu');
  if (menu.open && !menu.contains(alvo)) menu.open = false;

  const passo = alvo.closest('[data-ir]');
  if (passo) {
    if (passo.dataset.ir === 'salario') { const s = $('#inSalario'); s.scrollIntoView({ block:'center', behavior:semMovimento.matches ? 'auto' : 'smooth' }); s.focus(); }
    else location.hash = passo.dataset.ir;
    return;
  }
  if (alvo.closest('[data-passos-ocultar]')) { PREFS.passosOcultos = true; salvarPrefs(); renderPassos(); toast('Guia oculto. Para ver de novo, use Recomeçar do zero no Perfil.'); return; }
  const del = alvo.closest('[data-del]');
  if (del) {
    const linha = del.closest('[data-lista]'), nomeLista = linha.dataset.lista, item = acharItem(linha);
    if (!item || linha.dataset.saindo) return;
    linha.dataset.saindo = '1';
    mov.sair(linha).then(() => {
      comDesfazer((item.nome || item.desc || 'Item') + ' apagado.', () => { const lista = getLista(nomeLista), i = lista.indexOf(item); if (i >= 0) lista.splice(i, 1); });
    });
    return;
  }
  const add = alvo.closest('[data-add]'); if (add) { adicionar(add.dataset.add); return; }
  const usar = alvo.closest('[data-usar]');
  if (usar) {
    const cardP = usar.closest('[data-lista]'), pq = cardP && acharItem(cardP);
    if (pq) { pq.mensal = +usar.dataset.usar; pq.exemplo = false; render(true); mov.destacar($(`[data-id="${pq.id}"]`)); toast((pq.nome || 'Porquinho') + ': ' + brl(pq.mensal) + ' por mês.'); }
    return;
  }
  const sug = alvo.closest('[data-sug]');
  if (sug) {
    S.anuais.push({ id:uid(), nome:sug.dataset.sug, valor:null, mes:null, reservado:0 });
    render(true); realcarNovo(S.anuais[S.anuais.length - 1].id);
    const vs = $$('#listaAnuais [data-f="valor"]'); if (vs.length) vs[vs.length - 1].focus();
    return;
  }
  const sa = alvo.closest('[data-sug-assin]');
  if (sa) {
    S.contas.push({ id:uid(), nome:sa.dataset.sugAssin, categoria:'assinaturas', valor:0, parcelas:null });
    render(true); realcarNovo(S.contas[S.contas.length - 1].id);
    const va = $$('#listaAssin [data-f="valor"]'); if (va.length) va[va.length - 1].focus();
    return;
  }
  if (alvo.closest('#btnApagarEx')) {
    comDesfazer('Exemplos apagados.', () => {
      S.porquinhos = S.porquinhos.filter((p) => { return !p.exemplo; });
      S.besteira.gastos = S.besteira.gastos.filter((g) => { return !g.exemplo; });
    });
    return;
  }
  const acao = alvo.closest('[data-acao]');
  if (acao) {
    menu.open = false;
    const a = acao.dataset.acao;
    if (a === 'relatorio') location.hash = 'relatorio';
    else if (a === 'exportar') exportarBackup();
    else if (a === 'limpar') pedirLimpeza();
    else if (a === 'importar') $('#arquivoBackup').click();
    else if (a === 'recomecar') confirmar('Recomeçar do zero?', NUVEM ? 'Apaga tudo o que você preencheu, inclusive na planilha do Google, e começa vazio pela tela de boas-vindas. Se quiser guardar, exporte um backup antes.' : 'Apaga tudo o que você preencheu neste navegador e começa vazio pela tela de boas-vindas. Se quiser guardar, exporte um backup antes.', 'Apagar e recomeçar').then((ok) => {
      if (ok) { comDesfazer('Tudo recomeçado.', () => { S = estadoInicial(); }); PREFS.passosOcultos = false; salvarPrefs(); abrirBoasVindas(); }
    });
  }
});

$('#btnFecharMes').addEventListener('click', abrirFechar);
$('#arquivoBackup').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) importarArquivo(f);
});

function previewCompra(){
  const valor = lerDinheiro($('#fcValor').value), tot = lerInteiro($('#fcTotal').value), p = $('#fcPreview');
  let at = lerInteiro($('#fcAtual').value) || 1;
  const fatura = 'fatura de ' + MESES_LONGOS[mesNum(S.mesRef) - 1];
  if (!valor) { p.textContent = '"Parcela atual" é o número da parcela que cai na ' + fatura + '. Deixe "De quantas" vazio para cobranças de todo mês, como o seguro.'; return; }
  if (!tot) { p.innerHTML = 'Cobrança de <b>' + brl(valor) + '</b> todo mês, a partir da ' + fatura + '.'; return; }
  at = Math.min(at, tot);
  const rest = tot - at + 1;
  p.innerHTML = 'Parcela ' + at + ' de ' + tot + ' na ' + fatura + ' · última em ' + rotuloMes(somarMes(S.mesRef, rest - 1)) + ' · falta <b>' + brl(valor * rest) + '</b>';
}
$('#formCartao').addEventListener('input', previewCompra);
$('#formCartao').addEventListener('submit', function(e){
  e.preventDefault();
  const nome = $('#fcNome').value.trim(), valor = lerDinheiro($('#fcValor').value), tot = lerInteiro($('#fcTotal').value), at = lerInteiro($('#fcAtual').value) || 1;
  if (!nome || !valor) { toast('Preencha a descrição e o valor da parcela.'); return; }
  S.cartao.itens.push({ id:uid(), nome, valor, total:tot || null, parcelas:tot ? tot - Math.min(at, tot) + 1 : null });
  this.reset(); previewCompra(); render(true); realcarNovo(S.cartao.itens[S.cartao.itens.length - 1].id);
  toast(nome + ' lançado no cartão.'); $('#fcNome').focus();
});
$('#formSim').addEventListener('input', renderSim);
$('#formSim').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = lerDinheiro($('#simValor').value), m = lerInteiro($('#simMeses').value), nome = $('#simNome').value.trim() || 'Novo porquinho';
  if (!v || !m) { toast('Preencha quanto e em quantos meses.'); return; }
  S.porquinhos.push({ id:uid(), nome, meta:v, guardado:0, ate:somarMes(S.mesRef, m - 1), mensal:null, exemplo:false });
  render(true); realcarNovo(S.porquinhos[S.porquinhos.length - 1].id, true); toast('Porquinho "' + nome + '" criado.');
});
$('#formBest').addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = $('#fbDesc').value.trim(), valor = lerDinheiro($('#fbValor').value);
  const marcado = $('#fbCats input:checked'), cat = marcado ? marcado.value : 'outros';
  if (!desc || !valor) { toast('Diga o que foi e quanto custou.'); return; }
  S.besteira.gastos.unshift({ id:uid(), data:hojeISO(), desc, cat, valor, mes:S.mesRef, exemplo:false });
  $('#fbDesc').value = ''; $('#fbValor').value = '';
  render(true); realcarNovo(S.besteira.gastos[0].id); toast('Anotado: ' + desc + ', ' + brl(valor) + '.'); $('#fbDesc').focus();
});

$('#relSecoes').addEventListener('change', (e) => {
  const c = e.target.closest('[data-sec]'); if (!c) return;
  PREFS.secoes[c.dataset.sec] = c.checked; salvarPrefs();
  $$('#relDoc [data-sec="' + c.dataset.sec + '"]').forEach((s) => { s.hidden = !c.checked; });
});
$('#btnImprimir').addEventListener('click', () => { window.print(); });
$('#btnBaixarRel').addEventListener('click', baixarRelatorio);
$('#btnAbrirRel').addEventListener('click', abrirRelatorio);
let temaAntes = null;
window.addEventListener('beforeprint', () => { renderRelatorio(); temaAntes = document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme', 'light'); });
window.addEventListener('afterprint', () => { if (temaAntes) document.documentElement.setAttribute('data-theme', temaAntes); else document.documentElement.removeAttribute('data-theme'); desenharRoseta(); });

const graf = $('#grafProj');
function dicaGraf(e){ const h = e.target.closest && e.target.closest('.g-hit'); if (!h) { esconderTip(); return; } ativarBarra(+h.dataset.i); mostrarTip(tipProjecao(+h.dataset.i), e.clientX, e.clientY); }
graf.addEventListener('pointermove', dicaGraf);
graf.addEventListener('pointerdown', dicaGraf);
graf.addEventListener('pointerleave', esconderTip);
graf.addEventListener('focusin', (e) => { const h = e.target.closest('.g-hit'); if (!h) return; const b = h.getBoundingClientRect(); ativarBarra(+h.dataset.i); mostrarTip(tipProjecao(+h.dataset.i), b.left + b.width / 2, b.top + 40); });
graf.addEventListener('focusout', esconderTip);
const seg = $('#segBar');
function dicaSeg(el){ const p = partesDestino(R).filter((x) => { return x.k === el.dataset.k; })[0]; if (!p) return '';
  return '<strong>' + p.nome + '</strong><span class="tip-l"><span>Valor</span><span>' + brl(p.v) + '</span></span><span class="tip-l"><span>Do salário</span><span>' + pct(p.v / (R.salario || 1)) + '</span></span>'; }
seg.addEventListener('pointermove', (e) => { const el = e.target.closest('.parte'); if (!el) { esconderTip(); return; } mostrarTip(dicaSeg(el), e.clientX, e.clientY); });
seg.addEventListener('pointerleave', esconderTip);
seg.addEventListener('focusin', (e) => { const el = e.target.closest('.parte'); if (!el) return; const b = el.getBoundingClientRect(); mostrarTip(dicaSeg(el), b.left + b.width / 2, b.top); });
seg.addEventListener('focusout', esconderTip);
window.addEventListener('scroll', esconderTip, { passive:true });

const ABAS = ['visao', 'contas', 'cartao', 'anuais', 'porquinhos', 'besteiras', 'fgts', 'relatorio', 'perfil'];
let abaAtual = null;
function moverIndicador(){
  const ativa = $('.aba[aria-selected="true"]'), ind = $('.abas-indicador');
  if (!ativa || !ind || !ativa.offsetWidth) return;
  ind.style.width = `${ativa.offsetWidth}px`;
  ind.style.transform = `translateX(${ativa.offsetLeft}px)`;
  if (!ind.classList.contains('pronto')) requestAnimationFrame(() => ind.classList.add('pronto'));
}
function mostrarAba(id, animar = true){
  if (ABAS.indexOf(id) < 0) id = 'visao';
  const de = ABAS.indexOf(abaAtual), para = ABAS.indexOf(id), mudou = abaAtual !== id;
  abaAtual = id;
  $$('.aba').forEach((b) => { const on = b.dataset.aba === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  $$('.painel').forEach((p) => { p.hidden = p.id !== 'painel-' + id; });
  moverIndicador();
  $$('[data-nav]').forEach((n) => {
    const ativo = n.dataset.nav === id || (n.dataset.nav === 'mais' && ['cartao', 'anuais', 'besteiras', 'fgts', 'relatorio', 'perfil'].includes(id));
    if (ativo) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
  });
  const painel = $(`#painel-${id}`);
  if (id === 'visao') { if (!graficoMostrado) desenharGrafico(); ajustarRotulosSeg($('#segBar')); } else graficoMostrado = false;
  if (id === 'relatorio') renderRelatorio();
  if (mudou && animar && de >= 0) {
    mov.animar(painel, [{ opacity:0, transform:`translateX(${(para > de ? 1 : -1) * 18}px)` }, { opacity:1, transform:'none' }], { duration:320 });
    mov.crescer(painel);
  }
  local.gravar(CHAVE_ABA, id);
  const nav = $('.abas-nav'); if (nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block:'start', behavior:semMovimento.matches ? 'auto' : 'smooth' });
  if (mudou && animar && matchMedia('(max-width: 600px)').matches) { const topo = painel.getBoundingClientRect().top; if (topo < 0 || topo > innerHeight * .55) painel.scrollIntoView({ block:'start', behavior:semMovimento.matches ? 'auto' : 'smooth' }); }
}
$$('.aba').forEach((b) => { b.addEventListener('click', () => { if (location.hash.slice(1) === b.dataset.aba) mostrarAba(b.dataset.aba); else location.hash = b.dataset.aba; }); });
window.addEventListener('hashchange', () => { mostrarAba(location.hash.slice(1)); });
$('.abas').addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return;
  const abas = $$('.aba'), i = abas.indexOf(document.activeElement); if (i < 0) return;
  e.preventDefault();
  const j = e.key === 'ArrowRight' ? (i + 1) % abas.length : e.key === 'ArrowLeft' ? (i - 1 + abas.length) % abas.length : e.key === 'Home' ? 0 : abas.length - 1;
  abas[j].focus(); abas[j].click();
});

let tema = local.ler(CHAVE_TEMA) || 'auto';
function desenharRoseta(){
  const c = $('#roseta'); if (!c || !c.getContext) return;
  const L = 300, dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = L * dpr; c.height = L * dpr;
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, L, L);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--guilloche').trim() || 'rgba(255,255,255,.2)';
  ctx.lineWidth = 0.7;
  const gcd = function(a, b){ return b ? gcd(b, a % b) : a; };
  [[100, 38, 58], [82, 30, 44], [60, 22, 30], [40, 15, 18]].forEach((cfg) => {
    const R0 = cfg[0], r = cfg[1], d = cfg[2], voltas = r / gcd(R0, r), passos = 360 * voltas, k = (R0 - r) / r;
    ctx.beginPath();
    for (let i = 0; i <= passos; i++) {
      const t = i / passos * 2 * Math.PI * voltas;
      const x = L / 2 + (R0 - r) * Math.cos(t) + d * Math.cos(k * t), y = L / 2 + (R0 - r) * Math.sin(t) - d * Math.sin(k * t);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
}
function aplicarTema(t){
  const html = document.documentElement;
  if (t === 'light' || t === 'dark') html.setAttribute('data-theme', t); else html.removeAttribute('data-theme');
  const nomes = { auto:'automático', light:'claro', dark:'escuro' }, prox = { auto:'light', light:'dark', dark:'auto' }[t] || 'light';
  const b = $('#btnTema');
  b.innerHTML = t === 'light' ? ICON.sol : t === 'dark' ? ICON.lua : ICON.auto;
  b.setAttribute('aria-label', 'Tema ' + nomes[t] + '. Mudar para ' + nomes[prox]); b.title = b.getAttribute('aria-label');
  const seletor = $('#inTema'); if (seletor) seletor.value = t;
  desenharRoseta();
}
$('#btnTema').addEventListener('click', () => {
  tema = { auto:'light', light:'dark', dark:'auto' }[tema] || 'auto';
  local.gravar(CHAVE_TEMA, tema);
  mov.trocarTema($('#btnTema'), () => aplicarTema(tema));
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', desenharRoseta);

function abrirBoasVindas(){
  const d = $('#dlgBoasVindas');
  if (typeof d.showModal !== 'function' || d.open) return;
  $('#bvNome').value = S.perfil.nome || ''; $('#bvSalario').value = numCampo(S.salario); $('#bvErro').textContent = '';
  d.returnValue = ''; d.showModal(); $('#bvNome').focus();
  esperarResposta(d).then(concluirBoasVindas);
}
$('#formBoasVindas').addEventListener('submit', (e) => {
  const nome = $('#bvNome').value.trim(), salario = lerDinheiro($('#bvSalario').value);
  if (!nome || !salario) {
    e.preventDefault();
    $('#bvErro').textContent = !nome ? 'Diga como quer ser chamado.' : 'Informe quanto recebe por mês.';
    (nome ? $('#bvSalario') : $('#bvNome')).focus();
    return;
  }
  S.perfil.nome = nome.slice(0, 60); S.salario = salario;
});
function concluirBoasVindas(resposta){
  primeiroAcesso = false;
  if (!S.perfil.criadoEm) S.perfil.criadoEm = hojeISO();
  render(true);
  if (resposta === 'ok') { toast(`Tudo pronto, ${S.perfil.nome}. Agora é só ir preenchendo.`); mov.destacar($('.passos')); }
}
$('#bvImportar').addEventListener('click', () => { $('#dlgBoasVindas').close(); $('#arquivoBackup').click(); });
$('#inTema').addEventListener('change', (e) => {
  tema = ['auto', 'light', 'dark'].includes(e.target.value) ? e.target.value : 'auto';
  local.gravar(CHAVE_TEMA, tema);
  mov.trocarTema(e.target, () => aplicarTema(tema));
});

let tipoAnotar = 'besteira';
const TEXTOS_ANOTAR = {
  besteira:['Quanto foi', 'O que foi', 'Ex.: açaí, lanche, delivery', 'Anotar besteira'],
  cartao:['Valor da parcela', 'Descrição', 'Ex.: geladeira, curso, farmácia', 'Lançar no cartão'],
  conta:['Valor por mês', 'Conta', 'Ex.: aluguel, luz, internet', 'Adicionar conta']
};
function trocarTipoAnotar(tipo){
  tipoAnotar = tipo;
  $$('[data-tipo-anotar]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.tipoAnotar === tipo)); });
  $$('#formAnotar [data-so]').forEach((el) => { el.hidden = el.dataset.so !== tipo; });
  const [rotValor, rotNome, exemplo, botao] = TEXTOS_ANOTAR[tipo];
  $('#anValorRot').textContent = rotValor; $('#anNomeRot').textContent = rotNome; $('#anNome').placeholder = exemplo; $('#anOk').textContent = botao;
  $('#anErro').textContent = '';
}
function abrirAnotar(tipo = 'besteira'){
  const d = $('#dlgAnotar');
  if (typeof d.showModal !== 'function' || d.open) return;
  $('#formAnotar').reset(); trocarTipoAnotar(tipo);
  d.showModal(); $('#anValor').focus();
}
$('#formAnotar').addEventListener('submit', (e) => {
  e.preventDefault();
  const valor = lerDinheiro($('#anValor').value), nome = $('#anNome').value.trim().slice(0, 120), id = uid();
  if (!valor || !nome) { $('#anErro').textContent = !valor ? 'Informe o valor.' : 'Diga o que foi.'; (valor ? $('#anNome') : $('#anValor')).focus(); return; }
  if (tipoAnotar === 'besteira') {
    const marcado = $('#anCats input:checked'), cat = marcado ? marcado.value : 'outros';
    comDesfazer(`Anotado: ${nome}, ${brl(valor)}.`, () => { S.besteira.gastos.unshift({ id, data:hojeISO(), desc:nome, cat, valor, mes:S.mesRef, exemplo:false }); });
  } else if (tipoAnotar === 'cartao') {
    const tot = lerInteiro($('#anParcTotal').value), at = Math.min(lerInteiro($('#anParcAtual').value) || 1, tot || 1);
    comDesfazer(`${nome} lançado no cartão.`, () => { S.cartao.itens.push({ id, nome, valor, total:tot || null, parcelas:tot ? tot - at + 1 : null }); });
  } else {
    const categoria = chaveDe($('#anCategoria').value, CATEGORIAS);
    comDesfazer(`${nome} adicionada às contas.`, () => { S.contas.push({ id, nome, categoria, valor, parcelas:null }); });
  }
  $('#dlgAnotar').close();
  realcarNovo(id);
});
$('#btnMais').addEventListener('click', () => { const d = $('#dlgMais'); if (typeof d.showModal === 'function' && !d.open) d.showModal(); });
$('#dlgMais').addEventListener('click', (e) => { if (e.target.closest('a')) $('#dlgMais').close(); });
document.addEventListener('click', (e) => {
  const alvo = e.target;
  if (!alvo.closest) return;
  if (alvo.closest('[data-anotar]')) { abrirAnotar(); return; }
  const tipo = alvo.closest('[data-tipo-anotar]'); if (tipo) { trocarTipoAnotar(tipo.dataset.tipoAnotar); return; }
  if (alvo.closest('[data-fechar-folha]')) { alvo.closest('dialog').close(); return; }
  if (alvo.matches('dialog.folha-baixo')) { alvo.close(); return; }
  if (alvo.closest('[data-dica-fechar]')) { $('#btnFecharMes').click(); return; }
  if (alvo.closest('[data-ver-dividas]')) { verTodasDividas = !verTodasDividas; renderVisao(); }
});
document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.matches || !d.matches('[data-dobra]') || !d.open) return;
  if (d.contains($('#grafProj'))) { graficoMostrado = false; desenharGrafico(); }
  mov.crescer(d);
}, true);

const grafFgts = $('#fgGraf');
grafFgts.addEventListener('pointermove', (e) => {
  if (!fgProj.length) return;
  const caixa = grafFgts.getBoundingClientRect(), n = fgProj.length;
  const i = Math.max(0, Math.min(n, Math.round((e.clientX - caixa.left) / caixa.width * n)));
  const v = i ? fgProj[i - 1].saldoFinal : S.fgts.saldo, max = Math.max(1, S.fgts.saldo, ...fgProj.map((p) => p.saldoFinal));
  const guia = $('.fg-guia', grafFgts), ponto = $('.fg-ponto', grafFgts);
  guia.style.left = ponto.style.left = `${i / n * 100}%`;
  ponto.style.top = `${100 - v / max * 92}%`;
  guia.hidden = ponto.hidden = false;
  const p = fgProj[i - 1], l = (k, x) => `<span class="tip-l"><span>${k}</span><span>${x}</span></span>`;
  mostrarTip(i ? `<strong>Ao fechar ${rotuloMesLongo(p.mes)}</strong>${l('Saldo', brl(p.saldoFinal))}${l('Depósito', brl(p.deposito))}${l('Rendimento', brl(p.rendimento))}`
    : `<strong>Hoje</strong>${l('Saldo', brl(v))}`, e.clientX, e.clientY);
});
grafFgts.addEventListener('pointerleave', () => { esconderTip(); $$('.fg-guia, .fg-ponto', grafFgts).forEach((el) => { el.hidden = true; }); });

$$('[data-icon]').forEach((el) => { el.innerHTML = ICON[el.dataset.icon] || ''; });
$('#fbCats').innerHTML = Object.keys(CAT_BESTEIRA).map((k, i) => { return '<label class="chip"><input type="radio" name="fbCat" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + CAT_BESTEIRA[k] + '</span></label>'; }).join('');
$('#relSecoes').innerHTML = SECOES.map((s) => { return '<label class="chip"><input type="checkbox" data-sec="' + s[0] + '"' + (PREFS.secoes[s[0]] === false ? '' : ' checked') + '><span>' + s[1] + '</span></label>'; }).join('');
$('#sugAssin').innerHTML = '<span class="hint">Sugestões:</span>' + SUG_ASSIN.map((s) => { return '<button type="button" class="sug" data-sug-assin="' + esc(s) + '">+ ' + esc(s) + '</button>'; }).join('');
$('#sugestoes').innerHTML = '<span class="hint">Sugestões:</span>' + SUGESTOES.map((s) => { return '<button type="button" class="sug" data-sug="' + esc(s) + '">+ ' + esc(s) + '</button>'; }).join('');
const telaLarga = matchMedia('(min-width: 601px)').matches;
$$('[data-dobra]').forEach((d) => { d.open = telaLarga; });
$('#bvMascote').innerHTML = tostao('acenando', 'grande');
$('#anCats').innerHTML = Object.keys(CAT_BESTEIRA).map((k, i) => `<label class="chip"><input type="radio" name="anCat" value="${k}"${i === 0 ? ' checked' : ''}><span>${CAT_BESTEIRA[k]}</span></label>`).join('');
$('#anCategoria').innerHTML = optsCat('outros');
$('#inFgFerias').innerHTML = '<option value="">Sem data</option>' + MESES_LONGOS.map((m, i) => `<option value="${i + 1}">${cap(m)}</option>`).join('');
aplicarTema(tema);
render(true);
previewCompra();
let abaInicial = location.hash.slice(1);
if (!abaInicial) abaInicial = local.ler(CHAVE_ABA) || 'visao';
mostrarAba(abaInicial, false);
window.scrollTo(0, 0);
mov.emSequencia([$('.topo-in'), ...$$('.resumo > .card'), $('.abas-nav'), ...$$(`#painel-${abaAtual} > *`)], 70);
document.addEventListener('pointerdown', mov.onda);
if (document.fonts) document.fonts.ready.then(moverIndicador);

if (window.ResizeObserver) {
  new ResizeObserver(() => { const w = Math.round(graf.clientWidth); if (w && w !== larguraGrafico) desenharGrafico(); ajustarRotulosSeg(seg); }).observe(graf);
  new ResizeObserver(moverIndicador).observe($('.abas'));
} else window.addEventListener('resize', () => { desenharGrafico(); ajustarRotulosSeg(seg); });
iniciarNuvem();
if (!NUVEM && primeiroAcesso) setTimeout(abrirBoasVindas, 450);
window.addEventListener('pagehide', () => { gravar(); if (NUVEM && sync.pendente) enviar(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) gravar(); });
})();
