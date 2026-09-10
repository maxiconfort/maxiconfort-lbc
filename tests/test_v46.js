// Test vm des nouvelles fonctions v4.6 (renderAlertes / renderPhotos / renderDepts / renderDash partiel)
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('C:/Users/moind/maxiconfort-lbc-analyse/index.html', 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');

// ── DOM factice ──
const elements = {};
function mkEl(id) {
  return {
    id, innerHTML: '', textContent: '', value: '', style: {}, className: '', checked: false,
    options: [], dataset: {},
    appendChild(){}, focus(){}, click(){},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    querySelectorAll(){ return []; }, querySelector(){ return null; },
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){}
  };
}
const documentStub = {
  getElementById(id){ return elements[id] || (elements[id] = mkEl(id)); },
  querySelectorAll(){ return []; }, querySelector(){ return null; },
  createElement(){ return mkEl('_tmp'); },
  addEventListener(){},
  documentElement: mkEl('_root'),
  body: mkEl('_body')
};
const sandbox = {
  console, document: documentStub,
  window: { location: { reload(){} }, addEventListener(){} },
  navigator: { userAgent: 'test' },
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  fetch: async () => { throw new Error('no-net'); },
  atob: s => Buffer.from(s, 'base64').toString('binary'),
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  confirm: () => true, alert(){}, prompt(){ return null; },
  setTimeout(fn){ return 0; }, clearTimeout(){}, setInterval(){ return 0; }, clearInterval(){},
  URL: { createObjectURL(){ return ''; }, revokeObjectURL(){} },
  Blob: function(){}, Audio: function(){ return { play(){} }; },
  AudioContext: undefined, webkitAudioContext: undefined,
};
// ── HORLOGE FIGÉE (même durcissement que test_v47.js) ────────────────────────
// Un test dont le résultat dépend du jour où on le lance n'est pas un garde-fou.
// Date de référence surchargeable :  node tests/test_v46.js 2026-10-01
const REF_DATE = process.argv[2] || '2026-09-15';
if (!/^\d{4}-\d{2}-\d{2}$/.test(REF_DATE)) { console.error('Date de référence invalide : ' + REF_DATE); process.exit(2); }
const FIXED_MS = new Date(REF_DATE + 'T12:00:00Z').getTime();
class FakeDate extends Date {
  constructor(...a) { if (a.length === 0) { super(FIXED_MS); } else { super(...a); } }
  static now() { return FIXED_MS; }
}
sandbox.Date = FakeDate;

sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(script, ctx, { filename: 'app.js' });

// ── Données de test (injectées via runInContext : les bindings let/const du script) ──
const today = new Date(FIXED_MS);
const f = d => d.toISOString().slice(0, 10);
const dAgo = n => f(new Date(FIXED_MS - n * 86400000));
console.log('Date de référence figée : ' + REF_DATE + '  (déterminisme garanti)');
const data = {
  prods: [
    { id: 'P1', nom: 'Lit coffre premium Blanc avec matelas', dim: '140x190', prix: 299, marge: null, cat: 'Lit coffre premium', priorite: 'Très haute', poids_idf: 90, zone_pub: 'both', actif: true },
    { id: 'P2', nom: 'Sommier test', dim: '90x190', prix: 99, marge: null, cat: 'Sommier tapissier seul', priorite: 'Moyenne', poids: 25, zone_pub: 'idf', actif: true },
    { id: 'P3', nom: 'Produit jamais publié', dim: '160x200', prix: 199, marge: null, cat: 'Lit Nico', priorite: 'Moyenne', poids: 25, zone_pub: 'both', actif: true },
  ],
  recs: [],
  perf_agg: [
    // forte baisse : 30j 20💬/100, 7j 0
    { produit: 'Lit coffre premium Blanc avec matelas', dim: '140x190', prov: false, n7: 8, c7: 0, v7: 0, vu7: 10, ca7: 0, n30: 40, c30: 8, v30: 1, vu30: 100, ca30: 299, n90: 60, c90: 10, v90: 1, vu90: 150, ca90: 299 },
    // devenu performant : 7j 50💬/100 vs 30j 10
    { produit: 'Sommier test', dim: '90x190', prov: false, n7: 6, c7: 3, v7: 0, vu7: 30, ca7: 0, n30: 20, c30: 2, v30: 0, vu30: 60, ca30: 0, n90: 25, c90: 3, v90: 0, vu90: 70, ca90: 0 },
  ],
  perf_dept: [
    { dept: '94', n7: 12, c7: 4, v7: 1, n30: 50, c30: 8, v30: 2, ca30: 500, n90: 120, c90: 15, v90: 3, ca90: 900, pv90: 900 },
    { dept: '75', n7: 5, c7: 0, v7: 0, n30: 40, c30: 2, v30: 0, ca30: 0, n90: 100, c90: 4, v90: 0, ca90: 0, pv90: 0 },
  ],
};
// publications 7j : surpublication du produit P1 en IDF (15/30) + photos A/B
for (let i = 0; i < 30; i++) {
  const isP1 = i < 15;
  data.recs.push({
    id: 'r' + i, date_pub: dAgo(i % 6), heure: '10:00', ville: 'Créteil', dept: isP1 ? '94' : '75',
    produit: isP1 ? 'Lit coffre premium Blanc avec matelas' : 'Sommier test', dim: isP1 ? '140x190' : '90x190',
    prix: '299', priorite: 'Haute', titre: 't' + i, photo: i % 2 ? 'Photo A' : 'Photo B',
    validation: 'ON', statut: 'Validée', vues: 5, messages: i % 3 ? 0 : 1, appels: 0, vendu: false, ca: null, collab_id: ''
  });
}
vm.runInContext('PRODS=__D.prods;RECS=__D.recs;PERF_AGG=__D.perf_agg;PERF_DEPT=__D.perf_dept;CATSITE=[];PARAMS={};VILLES_DB=[];ROLE="admin";',
  Object.assign(ctx, { __D: data }));
// __D via assign ne crée pas le binding dans le contexte vm — passer par globalThis :
vm.runInContext('this.__ok=true', ctx);

let pass = 0, fail = 0;
function T(name, fn) {
  try { fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + ' — ' + e.message); fail++; }
}
function get(id) { return elements[id] ? elements[id].innerHTML : ''; }

console.log('— renderAlertes —');
vm.runInContext('renderAlertes()', ctx);
T('forte baisse détectée', () => { if (!/FORTE BAISSE/.test(get('dash-alertes'))) throw new Error(get('dash-alertes').slice(0, 200)); });
T('devenu performant détecté', () => { if (!/DEVENU PERFORMANT/.test(get('dash-alertes'))) throw new Error('absent'); });
T('surpublication détectée', () => { if (!/SURPUBLI/.test(get('dash-alertes'))) throw new Error('absent'); });
T('sous-testés détectés', () => { if (!/SOUS-TEST/.test(get('dash-alertes'))) throw new Error('absent'); });

console.log('— renderPhotos —');
vm.runInContext('renderPhotos()', ctx);
T('comparaison photos rendue', () => { if (!/💬\/100/.test(get('dash-photos'))) throw new Error(get('dash-photos').slice(0, 200)); });
T('gagnante ou pas-encore affichée', () => { if (!/🏆|gagnante/.test(get('dash-photos'))) throw new Error('absent'); });

console.log('— renderDepts —');
vm.runInContext('renderDepts()', ctx);
T('tableau départements rendu', () => { if (!/94/.test(get('dash-depts'))) throw new Error('absent'); });
T('horizons 7/30/90 affichés', () => { if (!/12 \/ 50 \/ 120/.test(get('dash-depts'))) throw new Error(get('dash-depts').slice(0, 300)); });
T('évolution flèche présente', () => { if (!/↗|↘|→/.test(get('dash-depts'))) throw new Error('absent'); });
T('marge/100 colonne présente', () => { if (!/Marge\/100/.test(get('dash-depts'))) throw new Error('absent'); });

console.log('— renderDash complet (aucune exception) —');
T('renderDash tourne sans erreur', () => { vm.runInContext('renderDash()', ctx); });
T('tops dimensions présents', () => { if (!/Top dimensions/.test(get('dash-tops'))) throw new Error('absent'); });
T('tops départements présents', () => { if (!/Top départements/.test(get('dash-tops'))) throw new Error('absent'); });

console.log('— garde-fou date (rappel v4.5.1) —');
T('toggleVal futur demande confirmation', () => {
  let asked = false;
  ctx.confirm = () => { asked = true; return false; };
  vm.runInContext('RECS.push({id:"fut1",date_pub:"' + dAgo(-3) + '",produit:"X",dim:"",ville:"V",dept:"75",validation:"OFF",statut:"À publier"});toggleVal("fut1")', ctx);
  if (!asked) throw new Error('confirm non appelé');
  const r = vm.runInContext('RECS.find(x=>x.id==="fut1").validation', ctx);
  if (r !== 'OFF') throw new Error('validation modifiée malgré annulation');
});

console.log('\nRésultat : ' + pass + ' OK / ' + fail + ' KO');
process.exit(fail ? 1 : 0);
