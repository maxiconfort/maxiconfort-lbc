# Pause des lits coffres en rupture — 30/09/2026

Demande de Borhen : mettre en pause (sans supprimer) les annonces Leboncoin des lits coffres
140x190 blanc, 140x190 noir et 160x200 blanc, avec et sans matelas. Le 160x200 noir reste en vente.

## Comment les annonces sont gérées
- L'outil (index.html + Supabase) ne publie rien lui-même : il prépare le planning (`lbc_annonces`),
  les collaboratrices publient à la main sur le compte pro Leboncoin « BMS ».
- La pause a donc été faite directement sur Leboncoin (session déjà connectée, aucun mot de passe saisi),
  avec la fonction officielle « Mettre en pause » (l'annonce, ses stats et sa date d'expiration sont conservées).

## Leboncoin : 679 annonces mises en pause (aucune suppression)
| Variante | Annonces |
|---|---|
| Lit coffre noir 140x190 sans matelas | 132 |
| Lit coffre noir 140x190 avec matelas | 110 |
| Lit coffre blanc 140x190 sans matelas | 80 |
| Lit coffre blanc 140x190 avec matelas | 129 |
| Lit coffre blanc 160x200 sans matelas | 93 |
| Lit coffre blanc 160x200 avec matelas | 135 |

Tri fait sur le texte réel de chaque annonce (ligne « Couleur / Revêtement », « Dimensions couchage »,
« Matelas inclus / non inclus »), pas seulement sur le titre (beaucoup de titres sont du type
« Lit Coffre 160x200 Neuf Sommier Inclus » sans couleur).
Deux annonces incohérentes incluses : 3270707745 (titre canapé, texte lit coffre noir 140x190)
et 3260544624 (titre lit coffre blanc 160x200, texte canapé beige) — à corriger si on les réactive.

Compteurs du tableau de bord pro après l'opération : En ligne 3 379 → 2 700, En pause 502 → 1 181.

## Annonces multi-variantes
Aucune annonce ne proposait plusieurs couleurs/tailles au choix. Seul le pied de page commun
« TOUTE LA GAMME MAXICONFORT » cite « Lits simili cuir, noir ou blanc » de façon générale (pas de
commande possible via ce texte) : à adapter plus tard si besoin.

## Outil (Supabase)
- `lbc_produits` : P110, P111, P113, P114, P115, P117 passés à `actif=false` (le générateur
  `prodPubliable` et la régénération quotidienne de 21h55 les ignorent). P112 et P116 (160x200 noir) restent actifs.
- `lbc_annonces` : 170 annonces planifiées « À publier » de ces 6 produits passées à « Bloqué »
  (historique « Validée » conservé tel quel).
- Tâches planifiées vérifiées : aucune ne republie ni ne « remonte » d'annonce (bilans = lecture seule).

## Vérification finale
Recherche publique de toutes les annonces de la boutique (API de recherche Leboncoin) : 0 annonce
en ligne pour lit coffre 140x190 blanc, 140x190 noir ou 160x200 blanc. Les annonces 160x200 noir restent en ligne.

## Pour réactiver au retour du stock
Leboncoin → Mon compte Pro → Annonces → onglet « En pause » → réactiver ; dans l'outil, remettre
`actif=true` sur les produits concernés.
