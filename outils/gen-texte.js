#!/usr/bin/env node
// Générateur de TITRE + TEXTE d'annonce Leboncoin (même moteur que l'outil maxiconfort-lbc, index.html).
// Usage : node outils/gen-texte.js --id 3270040221 --produit "Ensemble matelas + sommier mémoire de forme" --dim 140x190 --ville "Asnières-sur-Seine" [--prov] [--couleur noir] [--prix 199] [--log]
//  --id     : id de l'annonce (graine : un id différent = un texte différent, un même id = même texte)
//  --produit: nom produit tel que dans l'outil (Ensemble…, Matelas…, Sommier…, Lit coffre … avec/sans matelas, Lit Nico … avec/sans matelas, Lit superposé…)
//  --dim    : 140x190, 160x200, 120x190…  (120x190 = Île-de-France uniquement)
//  --ville  : ville de l'annonce (localisation réelle)
//  --prov   : annonce province (sinon Île-de-France)
//  --log    : ajoute une ligne à suivi-forfait-pro/TEXTES-UTILISES.md (registre anti-doublons) et refuse si la 1ère phrase existe déjà
// Règle (Borhen 15/11/2026) : livraison GRATUITE, prix défiant toute concurrence, récap de toute la collection avec les prix de la grille ; aucun doublon.
const fs=require('fs'),path=require('path'),vm=require('vm');
const args=process.argv.slice(2),get=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:undefined;},has=k=>args.includes('--'+k);
const root=path.join(__dirname,'..');
const s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=s.indexOf('// ── Générateur de contenu UNIQUE'),b=s.indexOf('// ── Publiabilité RÉELLE');
if(a<0||b<0){console.error('générateur introuvable dans index.html');process.exit(1);}
const f=vm.runInNewContext(s.slice(a,b)+';({genTitre,genDescription})',{});
const id=get('id'),produit=get('produit'),dim=get('dim'),ville=get('ville');
if(!id||!produit||!dim||!ville){console.error('usage: --id ID --produit "…" --dim 140x190 --ville "…" [--prov] [--log]');process.exit(2);}
const prov=has('prov');
const r={id:String(id),produit,dim,ville,dept:prov?'PROV':'IDF'};
if(get('couleur'))r.couleur=get('couleur'); // --couleur noir|blanc|gris… (revêtement/coloris réel de l'annonce)
if(get('prix'))r.prix=get('prix'); // --prix 199 : 140x190 = 15 cm par défaut, 20 cm seulement à 259/179
const titre=f.genTitre(produit,dim,ville,prov,String(id)),desc=f.genDescription(r);
if(has('log')){
  const reg=path.join(root,'suivi-forfait-pro','TEXTES-UTILISES.md');
  const first=desc.split('\n')[0];
  const cur=fs.existsSync(reg)?fs.readFileSync(reg,'utf8'):'';
  if(cur.includes('| '+first+' |')){console.error('DOUBLON : cette première phrase existe déjà dans le registre. Changer l\'id ou le produit.');process.exit(3);}
  fs.appendFileSync(reg,`${id} | ${ville} | ${produit} ${dim} | ${first} | généré\n`);
}
console.log('TITRE:'+titre+'\n---TEXTE---\n'+desc);
