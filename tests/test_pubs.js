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

// Tests « data publications » (27/11/2026) — lecture seule, moteur inchangé.
let okN=0,koN=0;const t=(n,c)=>{if(c){okN++;console.log('  ✓ '+n);}else{koN++;console.log('  ✗ '+n);}};
const run=s=>vm.runInContext(s,ctx);
run('PARAMS={};ROLE="admin";');
t('parse : 2 lignes valides + 1 ignorée',(run('globalThis.__r=parsePubsText("3271792774;2026-11-27;18h;matelas;140x200;199;Asnieres;92;1\\n3276276504;2026-11-27;18h;nico;140x190;279;Paris;75;1\\nfoo")'),run('__r.rows.length')===2&&run('__r.bad.length')===1));
run('PARAMS.pubs={rows:[{id:"1",slot:"18h",type:"matelas",dep:"92",vues:100,msg:4,fav:1,vendu:1},{id:"2",slot:"18h",type:"nico",dep:"34",vues:50,msg:1},{id:"3",slot:"11h30",type:"matelas",dep:"75",bf:1}]}');
const st=run('pubsStats()');
t('total 3 / mesurées 2',st.total===3&&st.mesurees===2);
t('par type : matelas 2 pubs, 4 msg',(a=>a&&a.n===2&&a.msg===4)(st.parType.find(x=>x.k==='matelas')));
t('msg/100 vues matelas = 4',st.parType.find(x=>x.k==='matelas').msgPer100===4);
t('zone IDF vs Province',st.parZone.find(x=>x.k==='IDF').n===2&&st.parZone.find(x=>x.k==='Province').n===1);
t('vente comptée',st.parType.find(x=>x.k==='matelas').vendu===1);
run('renderPubsPanel()');
t('panneau rendu',run('document.getElementById("pubs-panel").innerHTML').includes('Data publications'));
t('moteur inchangé : stockFactor=1 par défaut',run('stockFactor({})')===1);
console.log('\nRésultat pubs : '+okN+' OK / '+koN+' KO');process.exit(koN?1:0);
