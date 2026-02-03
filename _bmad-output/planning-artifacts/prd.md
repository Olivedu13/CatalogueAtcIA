# PRD — Catalogue Joaillerie (V1)

## 1. Vision & Contexte
- Objectif: fournir a mes clients B2B un catalogue joaillerie privé, rapide, lisible et imprimable, connecté à un backend PHP existant.
- Environnement: Frontend React + Vite (mobile-first), Backend PHP (mysqli) avec endpoints `login.php`, `imageCatalogue.php`, `thumbs.php`.
- Portée initiale: consultation, recherche/filtrage, téchargement images, fiche produit détaillée, impression tarifs côté front. Pas de panier/commande.

## 2. Personae & Cas d’usage
- Client Admin itinérant: consulte le catalogue sur mobile/tablette, filtre par forme/type/ligne, montre les variantes et imprime/partage un récap prix d'achat + prix de vente magasin (prix achat x coef client).
- Client Boutique: consulte le catalogue sur mobile/tablette, filtre par forme/type/ligne, montre les variantes et imprime/partage un uniquement  prix de vente magasin (prix achat x coef client).
- Back-office (lecture seule): vérifie cohérence des données, identifie manquants (images, formes/types).

## 3. Périmètre Fonctionnel
- Authentification: formulaire login (user + password), stockage token localStorage (issu de `login.php?action=log`).
- Catalogue:
  - Récupération via `catalogue.php`.

  - Regroupement par `ref` → modèle avec prix min/max, vignette, variations.
  - Normalisation images via miniatures (`thumbs.php`) avec fallback direct (`VITE_IMG_BASE`).
- Filtres: par référence, catégorie (description), ligne (`prenom_ligne`), formes (IDs), types de pierre (IDs), prix min/max dérivés.
- Fiche produit:
  - Galerie + zoom (hover/click), sélection variation → image active.
  - Tableau des déclinaisons avec prix.
  - Bouton "Imprimer" (mise en page CSS print). Frontend-only.

## 4. Exigences Fonctionnelles (FR)
- FR-1: En tant qu’utilisateur, je peux me connecter avec identifiant et mot de passe.
- FR-2: En tant qu’utilisateur, je vois le catalogue regroupé par `ref` avec une image de couverture et un prix à partir de.
- FR-3: Je peux filtrer par référence, catégorie, ligne, formes, types et plage de prix.
- FR-4: Je peux ouvrir une fiche produit, voir les variantes, zoomer l’image et changer de variation.
- FR-5: Je peux imprimer une fiche tarifaire multi-variantes (sans backend PDF).
- FR-6: Le système doit fonctionner même si `types` CSV n’est pas renvoyé, via fallback `id_typ_pier`.

## 5. Intégration API (contrats cibles)
- POST `/login.php?action=login` → body: `{ user, password }` → 200: `[{ id, Nom_agence, logo }]`.
- POST `/login.php?action=log` → body: `{ id_user }` → 200: `{ insertId }` ou un identifiant exploitable comme token.
- GET `/catalogue.php` → 200: tableau d’items contenant au minimum:
  - `ref`, `label`, `prix`, `description`, `prenom_ligne`, `img`, `img_cv`, `formes` (CSV ex: "1016,1005"), `gallery` (array)
  - idéal: `types` (CSV) sinon `id_typ_pier` par ligne pour fallback.

Notes backend:
- Recommandé: ajouter `types` = `GROUP_CONCAT(DISTINCT p.id_typ_pier)` dans la requête pour cohérence des filtres.
- Côté thumbs, exposer `thumbs.php?image=<file>&size=<n>` avec ETag/Cache-Control. (fichier thumb a créer)

## 6. Données & Modèle Front
- Agrégation: variations → `ProductModel` (par `ref`) avec `availableShapeIds`, `availableTypeIds`.
- Dérivation: listes de formes/types réellement utilisées (pour limiter filtres aux valeurs présentes).
- Lookups: tables locales minimales pour libellés (formes/types) si backend ne renvoie pas tout.

## 7. Non-Fonctionnel (NFR)
- NFR-1 Performance: vignettes via thumbs, lazy-loading, bundling Vite, images optimisées.
- NFR-2 Disponibilité: gestion d’erreurs réseau (messages discrets, retrys limités).
- NFR-3 Sécurité: pas d’infos sensibles en clair; token localStorage simple (usage interne). HTTPS requis.
- NFR-4 Accessibilité: contrastes lisibles, focus visibles, labels de formulaires.
- NFR-5 Imprimabilité: CSS `@media print` pour une sortie claire et compacte.

## 8. Critères d’Acceptation (sample)
- AC-1: Login valide affiche l’entête personnalisé (logo + agence) et charge le catalogue.
- AC-2: Filtrer par une forme/type réduit la liste aux produits correspondants (ET logique inclusive par critère).
- AC-3: La fiche produit imprime un A4 propre avec entête (logo, ref), tableau des variantes et prix.
- AC-4: Les images chargent des miniatures < 1 Mo et restent nettes sur mobile/desktop.

## 9. Métriques & Observabilité
- Latence initiale catalogue (< 2 s sur réseau 4G typique).
- Taille page initiale (JS) < 250 kB gz.
- Erreurs réseau/API loggées (console/monitoring) avec context minimal.

## 10. Risques & Questions Ouvertes
- Risque: données incomplètes (formes/types/gallery manquants) → fallback + tolérance.
- Risque: variations nombreuses par `ref` → pagination/virtuallist (à évaluer).
- Questions:
  1) Confirmer format exact de `login.php?action=log` (token ou insertId?).
  2) Confirmer ajout `types` (CSV) côté `catalogue.php`.
  3) Liste complète des mappings formes/types à exposer côté API?

## 11. Roadmap (prochaines étapes)
- Étape 1: Valider PRD via BMad (Claude Code) et figer contrats API.
- Étape 2: Architecture front (états, services, store éventuel), stratégie images, styles print.
- Étape 3: Épique + Stories (filtres avancés, UX mobile, perf/a11y passes).
- Étape 4: Sprint 1 (filtres raffinés + print enrichi), Sprint 2 (optimisations & QA).
