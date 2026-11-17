#!/usr/bin/env node
// Garde-fou des créneaux Leboncoin Pro : calcule COMBIEN publier MAINTENANT (heure de Paris), jamais d'avance.
// Usage : node outils/creneau.js --faites 29 [--heure 20:54] [--date 2026-11-18]
// Règle (Borhen 17/11) : rattraper = jusqu'au cumul du créneau PRÉCÉDENT seulement (créneau en cours inclus s'il a sonné).
const a=process.argv.slice(2),g=k=>{const i=a.indexOf('--'+k);return i>=0?a[i+1]:undefined};
const faites=parseInt(g('faites')||'0',10);
let PLAN=[['08:00',6],['11:30',12],['16:30',18],['18:00',24],['18:45',29],['22:00',35],['23:30',40]];
// Quotas du mois (Borhen 17/11 21h14) : du 18/11 au 30/11 = 38/jour (501 insertions restantes) ; reset des compteurs le 01/12 -> retour à 40
const jour=g('date')||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date());
if(jour>='2026-11-18'&&jour<='2026-11-30')PLAN=[['08:00',6],['11:30',12],['16:30',18],['18:00',24],['18:45',29],['22:00',34],['23:30',38]];
let h=g('heure');
if(!h){h=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date()).replace('h',':');}
const m=s=>{const [x,y]=s.split(':').map(Number);return x*60+y};
const now=m(h);
let cible=0,dernier=null;for(const [t,c] of PLAN){if(now>=m(t)){cible=c;dernier=t;}}
const suivant=PLAN.find(([t])=>now<m(t));
const reste=Math.max(0,cible-faites);
console.log(JSON.stringify({heure_paris:h,creneau_en_cours:dernier,cumul_autorise:cible,faites,a_publier_maintenant:reste,prochain_creneau:suivant?suivant[0]+' (cumul '+suivant[1]+')':'aucun (journée finie)',consigne:reste===0?'STOP : cumul du créneau atteint, ne rien publier avant le prochain créneau':'publier '+reste+' (pas plus)'}));
