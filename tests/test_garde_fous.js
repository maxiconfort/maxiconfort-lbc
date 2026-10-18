// Tests — garde-fous prix (audit national Leboncoin du 16/10/2026)
// Contrôle des prix, planchers, produits réservés à l'IDF, stock, identifiant Leboncoin,
// rapprochement titre → grille, détection des annonces aux anciens prix, titres explicites.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('C:/Users/moind/maxiconfort-lbc-analyse/index.html', 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');

const elements = {};
function mkEl(id){return{id,innerHTML:'',textContent:'',value:'',style:{},className:'',checked:false,hidden:false,options:[],dataset:{},appendChild(){},focus(){},click(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){},setAttribute(){},getAttribute(){return null;},removeAttribute(){}};}
const documentStub={getElementById(id){return elements[id]||(elements[id]=mkEl(id));},querySelectorAll(){return[];},querySelector(){return null;},createElement(){return mkEl('_tmp');},addEventListener(){},documentElement:mkEl('_root'),body:mkEl('_body')};
const REF_DATE=process.argv[2]||'2026-10-16';
if(!/^\d{4}-\d{2}-\d{2}$/.test(REF_DATE)){console.error('Date de référence invalide : '+REF_DATE);process.exit(2);}
const FIXED_MS=new Date(REF_DATE+'T12:00:00Z').getTime();
class FakeDate extends Date{constructor(...a){if(a.length===0){super(FIXED_MS);}else{super(...a);}}static now(){return FIXED_MS;}}
const toasts=[];let promptReponse='';
const sandbox={console,document:documentStub,window:{location:{reload(){}},addEventListener(){}},navigator:{userAgent:'t',clipboard:{writeText(){}}},localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];}},fetch:async()=>{throw new Error('no-net');},atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),confirm:()=>true,alert(){},prompt:()=>promptReponse,setTimeout(fn){return 0;},clearTimeout(){},setInterval(){return 0;},clearInterval(){},URL:{createObjectURL(){return'';},revokeObjectURL(){}},Blob:function(){},Audio:function(){return{play(){}};},Date:FakeDate};
sandbox.globalThis=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext(script,ctx,{filename:'app.js'});
vm.runInContext('showToast=function(t,b){globalThis.__toasts.push(t+" | "+b);};syncErr=function(){};sbUpsert=async function(){};sbPatch=async function(){};saveLocal=function(){};renderTable=function(){};renderCatalogue=function(){};buildProdSelect=function(){};updateStats=function(){};renderCal=function(){};setSync=function(){};clearAnnForm=function(){};',ctx);
sandbox.__toasts=toasts;
console.log('Date de référence figée : '+REF_DATE);

// Grille fictive (valeurs d'exemple : les vraies valeurs ne sont jamais dans le dépôt public)
const frais=new Date(FIXED_MS-3600000).toISOString(), perime=new Date(FIXED_MS-10*86400000).toISOString();
const PRODS=[
  {id:'E140',nom:'Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes',dim:'140x190',prix:189,prix_plancher:161,cat:'Ensemble matelas + sommier',zone_pub:'both',actif:true,site_handle:'ens-140'},
  {id:'E140B',nom:'Ensemble Complet 140x190 - Matelas 20cm + Sommier à Lattes',dim:'140x190',prix:219,prix_plancher:216,cat:'Ensemble matelas + sommier',zone_pub:'both',actif:true},
  {id:'E120',nom:'Ensemble 120x190 - Matelas blanc + Sommier à lattes',dim:'120x190',prix:239,cat:'Ensemble matelas + sommier',zone_pub:'idf',actif:true},
  {id:'M120',nom:'Matelas 120x190 blanc',dim:'120x190',prix:169,cat:'Matelas seul',zone_pub:'both',actif:true},
  {id:'S120',nom:'Sommier Bois à Lattes 120x190 avec Contour Cuir PU et Pieds 20cm',dim:'120x190',prix:109,cat:'Sommier tapissier seul',zone_pub:'both',actif:true},
  {id:'C160A',nom:'Lit coffre premium Noir avec matelas',dim:'160x200',prix:359,prix_plancher:309,cat:'Lit coffre premium',zone_pub:'both',actif:true,site_handle:'coffre-160-noir'},
  {id:'C160S',nom:'Lit coffre premium Noir sans matelas',dim:'160x200',prix:309,cat:'Lit coffre premium',zone_pub:'both',actif:true,site_handle:'coffre-160-noir-seul'},
  {id:'N160S',nom:'Lit Nico Noir sans matelas',dim:'160x200',prix:209,cat:'Lit Nico',zone_pub:'both',actif:true},
  {id:'N160A',nom:'Lit Nico Noir avec matelas',dim:'160x200',prix:319,cat:'Lit Nico',zone_pub:'both',actif:true},
  {id:'P50',nom:'Matelas Dodo Confort 15cm Province',dim:'90x190',prix:109,cat:'Matelas seul Province',zone_pub:'both',actif:true},
  {id:'P51',nom:'Matelas Dodo Confort 20cm Ferme Province',dim:'90x190',prix:129,cat:'Matelas seul Province',zone_pub:'both',actif:true},
  {id:'P63',nom:'Lit Nico Noir sommier inclus',dim:'160x200',prix:249,cat:'Matelas seul Province',zone_pub:'prov',actif:true},
  {id:'CZ',nom:'Canapé Cozy Marron',dim:'3 places',prix:349,cat:'Canapé',zone_pub:'both',actif:true},
];
const CATSITE=[
  {handle:'ens-140',dispo:true,updated_at:frais},
  {handle:'coffre-160-noir',dispo:false,updated_at:frais},     // rupture récente → bloquante
  {handle:'coffre-160-noir-seul',dispo:false,updated_at:perime}, // rupture périmée → ignorée
];
const VILLES=[{ville:'Paris 6e',dept:'75'},{ville:'Créteil',dept:'94'},{ville:'Melun',dept:'77'},{ville:'Lyon 3e',dept:'69'},{ville:'Marseille 6e',dept:'PROV'},{ville:'Paris 10e',dept:'75'}];
vm.runInContext('PRODS='+JSON.stringify(PRODS)+';CATSITE='+JSON.stringify(CATSITE)+';VILLES_DB='+JSON.stringify(VILLES)+';ROLE="admin";',ctx);
const R=src=>vm.runInContext(src,ctx);

let ok=0,ko=0;
function t(nom,cond){if(cond){ok++;console.log('  ✓ '+nom);}else{ko++;console.log('  x '+nom);}}

console.log('— Contrôle des prix');
t('75 010 € refusé net (pas d\'exception possible)',(()=>{const c=R('controlePrix(gfProduit("Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes","140x190"),75010)');return !c.ok&&!c.exception;})());
t('prix nul ou négatif refusé net',(()=>{const c=R('controlePrix(PRODS[0],0)');return !c.ok&&!c.exception;})());
t('produit hors catalogue → exception direction',(()=>{const c=R('controlePrix(null,199)');return !c.ok&&c.exception;})());
t('sous le plancher → exception direction (motif cité)',(()=>{const c=R('controlePrix(PRODS[0],150)');return !c.ok&&c.exception&&/plancher \(161/.test(c.motif);})());
t('au-dessus du plancher mais hors grille → exception direction',(()=>{const c=R('controlePrix(PRODS[0],209)');return !c.ok&&c.exception&&/grille \(189/.test(c.motif);})());
t('prix de la grille → accepté',R('controlePrix(PRODS[0],189)').ok===true);
t('sans plancher renseigné : seul l\'écart à la grille compte',(()=>{const c=R('controlePrix(PRODS[3],149)');return !c.ok&&c.exception&&/grille/.test(c.motif);})());

console.log('— Produits réservés à l\'Île-de-France');
t('matelas 120x190 réservé IDF',R('produitIdfSeul(PRODS[3])')===true);
t('ensemble 120x190 réservé IDF',R('produitIdfSeul(PRODS[2])')===true);
t('sommier 120x190 vendable partout',R('produitIdfSeul(PRODS[4])')===false);
t('canapé réservé IDF',R('produitIdfSeul(PRODS[12])')===true);
t('lit coffre vendable partout',R('produitIdfSeul(PRODS[6])')===false);
t('province : matelas 120x190 bloqué',/Île-de-France/.test(R('controlePublication(PRODS[3],true)')));
t('IDF : matelas 120x190 autorisé',R('controlePublication(PRODS[3],false)')==='');

console.log('— Stock');
t('rupture récente sur le site → bloquée',/rupture/.test(R('controlePublication(PRODS[5],false)')));
t('rupture vieille de 10 jours → ignorée (donnée périmée)',R('stockProduit(PRODS[6])')===null);
t('en stock → publiable',R('stockProduit(PRODS[0])')===true);
t('sans lien site → inconnu, publiable',R('stockProduit(PRODS[7])')===null&&R('controlePublication(PRODS[7],false)')==='');
t('le générateur écarte le produit en rupture',R('prodPubliable(PRODS[5],false)')===false&&R('prodPubliable(PRODS[0],false)')===true);

console.log('— Identifiant Leboncoin');
t('lien mon-activite?adId=…',R('adIdDeLien("https://www.leboncoin.fr/compte/pro/mon-activite?adId=3266223239")')==='3266223239');
t('lien /ad/ameublement/…',R('adIdDeLien("https://www.leboncoin.fr/ad/ameublement/3285480843")')==='3285480843');
t('page de confirmation → aucun identifiant',R('adIdDeLien("https://www.leboncoin.fr/deposer-une-annonce/confirmation")')===null);

console.log('— Rapprochement titre → grille');
t('« Pack Matelas Sommier 120x190 Neuf Paris 3e » → ensemble 120x190',R('gfProduitDeTitre("Pack Matelas Sommier 120x190 Neuf Paris 3e",209)?.id')==='E120');
t('« Lit 160x200 Simili Cuir Design Neuf » à 209 € → Nico sans matelas',R('gfProduitDeTitre("Lit 160x200 Simili Cuir Design Neuf Paris 11e",209)?.id')==='N160S');
t('« Lit avec matelas 160x200 Simili Cuir » → Nico avec matelas',R('gfProduitDeTitre("Lit avec matelas 160x200 Simili Cuir Design Neuf Paris 17e",299)?.id')==='N160A');
t('titre « Province » → fiche province (épaisseur lue)',R('gfProduitDeTitre("Neuf Matelas Dodo Confort 15cm Province 90x190 Lyon 6e",119)?.id')==='P50');
t('Nico « sommier inclus » province → fiche province',R('gfProduitDeTitre("Lit Nico Noir sommier inclus 160x200 Lyon 3e",249)?.id')==='P63');
t('coffre avec matelas reconnu',R('gfProduitDeTitre("Lit coffre premium Noir avec matelas 160x200 Paris 6e",399)?.id')==='C160A');
t('ensemble 140x190 sans épaisseur au titre : variante au prix le plus proche',R('gfProduitDeTitre("Pack Matelas Sommier 140x190 Neuf Nanterre",209)?.id')==='E140B');

console.log('— Annonces aux anciens prix');
const rel=[
  {titre:'Lit coffre premium Noir avec matelas 160x200 Paris 6e',prix:'329',date_pub:'2026-09-01',messages:2,appels:0},
  {titre:'Lit coffre premium Noir avec matelas 160x200 Créteil',prix:'399',date_pub:'2026-10-10',messages:0,appels:0},
  {titre:'Lit coffre premium Noir avec matelas 160x200 Melun',prix:'359',date_pub:'2026-10-12',messages:1,appels:0},
  {titre:'Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes Paris 10e',prix:'75010',date_pub:'2026-10-11',messages:0,appels:0},
  {titre:'Annonce sans rapport',prix:'50',date_pub:'2026-10-01',messages:0,appels:0},
  {titre:'Lit coffre premium Noir avec matelas 160x200 Paris 10e',prix:'259',date_pub:'2026-09-20',messages:0,appels:0},
  {titre:'Matelas 160x200 Neuf Livraison Rapide Marseille 6e',prix:'209',date_pub:'2026-10-01',messages:0,appels:0},
];
vm.runInContext('PRODS.push({id:"M160",nom:"Matelas 160x200 — Épaisseur 20 cm",dim:"160x200",prix:199,cat:"Matelas seul",zone_pub:"both",actif:true},{id:"P58",nom:"Matelas 160x200 — Épaisseur 20 cm (livré roulé)",dim:"160x200",prix:209,cat:"Matelas seul Province",zone_pub:"both",actif:true});',ctx);
const ec=R('gfComparerReleve('+JSON.stringify(rel)+')');
t('les annonces à 329, 399 et 259 € sont signalées, pas celle à 359 €',ec.filter(e=>/coffre/.test(e.titre)).length===3&&!ec.some(e=>e.prix===359));
t('le prix aberrant de 75 010 € est signalé',ec.some(e=>e.prix===75010&&e.grille===189));
t('l\'annonce sous le plancher (259 €) passe en tête',ec[0].sousPlancher===true&&ec[0].prix===259);
t('puis les plus contactées (329 €, 2 contacts)',ec[1].prix===329);
t('annonce province reconnue par sa ville (Marseille, 209 €) : pas de faux écart avec le prix IDF',!ec.some(e=>/Marseille/.test(e.titre)));
t('une annonce sans fiche correspondante est ignorée (pas de faux positif)',!ec.some(e=>/sans rapport/.test(e.titre)));

console.log('— Titres explicites');
t('titre Nico : « sans matelas » écrit',/Lit Nico 160x200 sans matelas/.test(R('TITRES_RECH.nico[0]("Lit Nico Noir sans matelas","160x200","Paris")')));
t('titre Nico : « avec matelas » écrit',/avec matelas/.test(R('TITRES_RECH.nico[0]("Lit Nico Noir avec matelas","160x200","Paris")')));
t('titre coffre : composition écrite',/Lit Coffre 160x200 avec matelas/.test(R('TITRES_RECH.coffre[0]("Lit coffre premium Noir avec matelas","160x200","Paris")')));
t('canapé Cozy : jamais « d\'angle convertible »',!/angle/i.test(R('TITRES_RECH.canape[0]("Canapé Cozy Marron","3 places","Paris")'))&&/Canapé Marron 3 places/.test(R('TITRES_RECH.canape[0]("Canapé Cozy Marron","3 places","Paris")')));
t('canapé d\'angle : titre d\'angle conservé',/Angle/.test(R('TITRES_RECH.canape[0]("Canapé d\'Angle Convertible 5 Places Beige","140x200","Paris")')));
t('titre ensemble : épaisseur écrite',/140x190 15 cm/.test(R('TITRES_RECH.ensemble[2]("Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes","140x190","Paris")')));
t('genTitre : aucun titre Nico sans composition sur 40 tirages',(()=>{for(let i=0;i<40;i++){const s=R(`genTitre("Lit Nico Noir sans matelas","160x200","Paris 11e",false,"seed-${i}")`);if(/Simili Cuir/.test(s)&&!/sans matelas/.test(s))return false;}return true;})());

console.log('— Exception direction et journal');
(async()=>{
  R('ROLE="collab"');toasts.length=0;
  t('collaboratrice : exception refusée',(await R('exceptionDirection({motif:"sous le prix plancher (161 €)"},{})'))===false&&toasts.some(x=>/Prix bloqué/.test(x)));
  R('ROLE="admin"');promptReponse='';
  t('direction sans justification : refusée',(await R('exceptionDirection({motif:"x"},{})'))===false);
  promptReponse='Déstockage validé par Borhen';
  t('direction avec justification : acceptée',(await R('exceptionDirection({motif:"x"},{produit_id:"E140",ancien:189,nouveau:150})'))===true);
  const log=JSON.parse(sandbox.localStorage.getItem('lbc_prix_log_local')||'[]');
  t('l\'exception est journalisée (auteur, ancien, nouveau, motif)',log.some(l=>l.exception&&l.auteur==='admin'&&l.ancien===189&&l.nouveau===150&&/Déstockage/.test(l.motif)));
  // patchPrix : un prix aberrant ne doit jamais être enregistré, même par la direction
  R('RECS=[{id:"A1",produit:"Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes",dim:"140x190",prix:"189"}];CUR=null;');
  await R('patchPrix("A1",75010)');
  t('patchPrix : 75 010 € jamais enregistré',R('RECS[0].prix')==='189');
  promptReponse='';
  await R('patchPrix("A1",150)');
  t('patchPrix : sous le plancher sans justification → inchangé',R('RECS[0].prix')==='189');
  await R('patchPrix("A1",189)');
  t('patchPrix : prix de la grille accepté',R('RECS[0].prix')==='189');
  // « Sommier bois à lattes » ne doit pas être pris pour la commune de Lattes (34)
  R('VILLES_DB.push({ville:"Lattes",dept:"34"});GF_VILLES=null;');
  t('« Sommier Bois à Lattes » reste IDF (pas la commune de Lattes)',R('gfCle("À saisir Sommier Bois à Lattes 90x190 avec Contour Cuir PU prix direct").prov')===false);
  t('une annonce située à Lattes reste province',R('gfCle("Matelas 140x190 15cm neuf Lattes").prov')===true);
  // description : aucun montant figé (sinon elle contredit le prix dès qu'on corrige l'annonce)
  const desc=R('genDescription({produit:"Ensemble 140x190 - Matelas Mémoire de Forme 15cm + Sommier à Lattes",dim:"140x190",prix:189,ville:"Paris 10e",zone:"IDF",date:"2026-10-16"})');
  t('description générée sans montant en euros',typeof desc==='string'&&desc.length>100&&!/\d\s?€/.test(desc));
  console.log('\nRésultat : '+ok+' OK / '+ko+' KO');
  process.exit(ko?1:0);
})();
