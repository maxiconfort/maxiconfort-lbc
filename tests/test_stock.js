// Tests v4.7 — moteur : pression→générateur, données fictives A/B/C/D, re-test, anti-répétition, horizons
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(require('path').join(__dirname,'..','index.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');

const elements = {};
function mkEl(id){return{id,innerHTML:'',textContent:'',value:'',style:{},className:'',checked:false,hidden:false,options:[],dataset:{},appendChild(){},focus(){},click(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){},setAttribute(){},getAttribute(){return null;},removeAttribute(){}};}
const documentStub={getElementById(id){return elements[id]||(elements[id]=mkEl(id));},querySelectorAll(){return[];},querySelector(){return null;},createElement(){return mkEl('_tmp');},addEventListener(){},documentElement:mkEl('_root'),body:mkEl('_body')};
const sandbox={console,document:documentStub,window:{location:{reload(){}},addEventListener(){}},navigator:{userAgent:'t'},localStorage:{getItem(){return null;},setItem(){},removeItem(){}},fetch:async()=>{throw new Error('no-net');},atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),confirm:()=>true,alert(){},setTimeout(fn){return 0;},clearTimeout(){},setInterval(){return 0;},clearInterval(){},URL:{createObjectURL(){return'';},revokeObjectURL(){}},Blob:function(){},Audio:function(){return{play(){}};}};
// ── DURCISSEMENT 1/3 : HORLOGE FIGÉE ─────────────────────────────────────────
// Sans elle, tout ce qui dépend de la date réelle change d'un jour à l'autre :
// seedRand('villes|'+date) tire d'autres villes, les fenêtres 7 j glissent, et le
// test « 0 répétition » passait ou échouait SELON LE JOUR de son exécution
// (constaté le 10/09/2026 : 30/30 le 08/09, 29/30 le 10/09, code identique).
// Date de référence surchargeable :  node tests/test_v47.js 2026-10-01
const REF_DATE=process.argv[2]||'2026-09-15';
if(!/^\d{4}-\d{2}-\d{2}$/.test(REF_DATE)){console.error('Date de référence invalide : '+REF_DATE);process.exit(2);}
const FIXED_MS=new Date(REF_DATE+'T12:00:00Z').getTime();
class FakeDate extends Date{
  constructor(...a){if(a.length===0){super(FIXED_MS);}else{super(...a);}}
  static now(){return FIXED_MS;}
}
sandbox.Date=FakeDate;

sandbox.globalThis=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext(script,ctx,{filename:'app.js'});

// Tests « stock interne » (27/11/2026) — le mode est désactivé par défaut : moteur strictement inchangé.
let okN=0,koN=0;const t=(n,c)=>{if(c){okN++;console.log('  ✓ '+n);}else{koN++;console.log('  ✗ '+n);}};
const run=s=>vm.runInContext(s,ctx);
run('PRODS=[{id:"a",nom:"Ensemble A",dim:"140x190",cat:"Ensemble matelas + sommier",prix:199,ref:"REF-A"},{id:"b",nom:"Ensemble B",dim:"160x200",cat:"Ensemble matelas + sommier",prix:279,ref:"REF-B"},{id:"c",nom:"Ensemble C",dim:"90x190",cat:"Ensemble matelas + sommier",prix:179}];RECS=[];PERF_AGG=[];PERF_VILLE=[];PERF_DEPT=[];PARAMS={};ROLE="admin";');
const w=id=>run('effWeight(PRODS.find(p=>p.id=="'+id+'"),"2026-11-27",false)');
const base=w('a');
t('mode inactif : poids identiques quel que soit le stock',(run('PARAMS.stock={actif:false,q:{"REF-A":9}}'),w('a')===base&&w('b')===base));
run('PARAMS.stock={actif:true,q:{"REF-A":4,"REF-B":0}}');
t('en stock : poids ×2',w('a')===base*2);
t('stock 0 : poids ×0,15 (jamais exclu, min 1)',w('b')<base&&w('b')>=1);
t('non listé = hors stock',w('c')===w('b'));
t('clé de secours = id quand pas de ref',run('stockKey(PRODS[2])')==='c');
t('stockQty null si non renseigné',run('stockQty(PRODS[2])')===null);
run('PARAMS.stock={actif:true,q:{"c":3}}');
t('stock par id fonctionne',w('c')===base*2);
run('renderCatalogue();renderDecisions();');
t('rendu catalogue/décisions sans erreur',true);
console.log('\nRésultat stock : '+okN+' OK / '+koN+' KO');process.exit(koN?1:0);
