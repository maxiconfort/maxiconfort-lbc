-- GARDE-FOUS PRIX — outil Leboncoin (branche securisation-prix, audit national du 16/10/2026)
-- À APPLIQUER UNIQUEMENT SUR GO DE BORHEN. Additif : aucune colonne ni donnée existante n'est modifiée.
-- L'outil détecte ces colonnes au démarrage ; tant qu'elles n'existent pas, il fonctionne comme avant.
-- Les VALEURS (prix planchers) ne sont pas dans ce fichier : le dépôt est public, les coûts et marges
-- restent hors dépôt et sont saisis en base après validation de la grille.

begin;

-- 1. Grille : prix plancher et traçabilité de la validation sur chaque fiche produit
alter table lbc_produits add column if not exists prix_plancher numeric;
alter table lbc_produits add column if not exists prix_valide_le date;
alter table lbc_produits add column if not exists prix_valide_par text;

-- 2. Rapprochement par identifiant Leboncoin (fin des appariements par titre)
alter table lbc_annonces add column if not exists lbc_id text;
create index if not exists lbc_annonces_lbc_id_idx on lbc_annonces (lbc_id);
alter table lbc_releves add column if not exists lbc_id text;
create index if not exists lbc_releves_lbc_id_idx on lbc_releves (lbc_id, date_releve);

-- 3. Journal des changements de prix (auteur, date, ancien, nouveau, motif, exception direction)
create table if not exists lbc_prix_log (
  id text primary key,
  at timestamptz not null default now(),
  auteur text,
  produit_id text,
  annonce_id text,
  ancien numeric,
  nouveau numeric,
  exception boolean default false,
  motif text
);
create index if not exists lbc_prix_log_at_idx on lbc_prix_log (at desc);

-- Sécurité : mêmes règles que lbc_annonces (RLS obligatoire, sinon la clé publique de l'outil aurait tous les droits)
alter table lbc_prix_log enable row level security;
drop policy if exists auth_all_prix_log on lbc_prix_log;
create policy auth_all_prix_log on lbc_prix_log for all to authenticated using (true) with check (true);
drop policy if exists sess_admin_prix_log on lbc_prix_log;
create policy sess_admin_prix_log on lbc_prix_log for all to anon
  using ((select session_role()) = 'admin') with check ((select session_role()) = 'admin');
drop policy if exists brain_read_prix_log on lbc_prix_log;
create policy brain_read_prix_log on lbc_prix_log for select to public using (brain_has('read'));

commit;

-- Retour arrière (si besoin) :
--   drop table if exists lbc_prix_log;
--   alter table lbc_produits drop column if exists prix_plancher, drop column if exists prix_valide_le, drop column if exists prix_valide_par;
--   alter table lbc_annonces drop column if exists lbc_id;  alter table lbc_releves drop column if exists lbc_id;
