# Pause des annonces « Province » en 120x190 — 05/10/2026

Demande de Borhen du 05/10/2026 : rupture usine du matelas 120x190. Le matelas de dépannage (fournisseur proche) est livré
à plat et ne peut pas partir par GLS. Consigne : « annonces Province utilisant GLS : à suspendre / ne pas pousser ;
annonces Île-de-France : peuvent continuer si la marge est correcte ».

## Outil (Supabase) — fait le 05/10/2026
- `lbc_produits` : P54 (Matelas mémoire de forme 20 cm Province 120x190, 149 €) et P44 (Ensemble matelas + sommier Province
  120x190, 229 €) passés à `actif=false` : le générateur ne les propose plus.
- `lbc_annonces` : les 10 annonces planifiées « À publier » de ces 2 produits (du 05 au 07/10) passées à « Bloqué ».
  Les 3 annonces déjà « Validée » du 05/10 ne sont pas modifiées (historique conservé).
- Restent ACTIFS : P1788428698121 (Ensemble complet 120x190, 209 €), P1788428698126 (Matelas 120x190, 149 €),
  P1788428698137 (Sommier 120x190, 99 €) — ventes Île-de-France livrées par nos livreurs.

## Leboncoin (compte pro) — NON FAIT
Les annonces « Province » en 120x190 déjà en ligne n'ont pas été mises en pause sur Leboncoin : à faire sur feu vert
(même méthode que pour les lits coffres, fonction officielle « Mettre en pause », aucune suppression).

## Prix Leboncoin à revoir (calcul du 05/10, coûts du fournisseur proche, livraison maison 25 €)
- Ensemble 120x190 à 209 € : marge 15,83 € (9,1 % du hors taxes) → prix minimum 219 €, prix conseillé 239 €.
- Matelas 120x190 à 149 € : marge 15,83 € (12,8 %) → prix minimum 149 €, prix conseillé 169 €.
Feu vert de Borhen le 05/10/2026 : prix appliqués dans l'outil vers 16 h 05 — P1788428698121 (ensemble 120x190) 209 → 239 €, P1788428698126 (matelas 120x190) 149 → 169 € ; les 17 annonces planifiées « À publier » de l'ensemble passées à 239 €. Les annonces déjà « Validée » et les annonces déjà en ligne sur Leboncoin ne sont pas modifiées (elles affichent encore 209 €).

À voir avec Borhen : les titres des annonces citent « Matelas Dodo Confort Mémoire de Forme 20cm » ; ils devront suivre les caractéristiques réelles du matelas de dépannage.

## Pour réactiver au retour du stock usine
Dans l'outil : remettre `actif=true` sur P54 et P44. Les annonces « Bloqué » peuvent être régénérées par le planning habituel.
