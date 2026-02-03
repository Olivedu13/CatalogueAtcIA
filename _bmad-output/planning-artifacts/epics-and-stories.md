# Epics & Stories — Catalogue Joaillerie

## Epic 1: Authentification & Session

### Story 1.1: Login Utilisateur
- **AC1**: Formulaire login (user + password) → appel login.php?action=login
- **AC2**: Succès → création log entry (login.php?action=log) → token stocké localStorage
- **AC3**: Erreur réseau → message clair à l'utilisateur
- **AC4**: Token persistence → relancer app = reste connecté
- **Tasks:**
  - [ ] Implémentation loginUser() dans dataService.ts (done)
  - [ ] Tests: login valide, password incorrect, timeout réseau
  - [ ] Message erreur UX sur le formulaire
  - [ ] localStorage management sécurisé

### Story 1.2: Logout & Nettoyage Session
- **AC1**: Bouton logout → suppression token localStorage + user state
- **AC2**: Logout → retour écran login (formulaire vierge)
- **AC3**: Naviguer back après logout → écran login bloque (pas de cached state)
- **Tasks:**
  - [ ] clearSession() appelé au logout (done)
  - [ ] Tests: logout → réinitialisation UI
  - [ ] Vérifier localStorage.clear() complet

---

## Epic 2: Catalogue & Normalisation Données

### Story 2.1: Récupération Catalogue
- **AC1**: Post-login: fetchCatalog() → GET catalogue.php avec Authorization header
- **AC2**: Response structure: Array<RawProductItem> avec formes/types CSV
- **AC3**: Gestion erreur réseau: fallback empty array, message utilisateur
- **AC4**: Spinner loading pendant fetch
- **Tasks:**
  - [ ] Endpoint catalogue.php renvoie formes CSV + types CSV (backend)
  - [ ] Test fetchCatalog() parsing
  - [ ] Gestion timeout (5s) et retry

### Story 2.2: Normalisation Images & Thumbnails
- **AC1**: Images brutes: IMG_BASE/filename → thumbs.php?image=filename&size=700
- **AC2**: Fallback: si thumbs indisponible → image brute directement
- **AC3**: Gallery: normaliser Array<galerie> → thumbs.php pour chaque
- **AC4**: Perf: lazy loading + decoding async sur toutes images
- **Tasks:**
  - [ ] buildThumb() finalisé dans dataService.ts (done)
  - [ ] Tests: URL thumbs, fallback IMG_BASE, gallery normalization
  - [ ] Vérifier decoding="async" appliqué aux images de grid & modal

### Story 2.3: Agrégation Produits par Référence
- **AC1**: Variations brutes regroupées par `ref` → ProductModel unique
- **AC2**: ProductModel: thumbnail (img_cv), minPrice, maxPrice, variations[]
- **AC3**: Dérivation formes/types utilisées: Set d'IDs présents dans variations
- **AC4**: ResolvedShape/Type: libellé de la 1ère variation (fallback lookup)
- **Tasks:**
  - [ ] Agrégation logique finalisée dans fetchCatalog() (done)
  - [ ] Tests: groupement multi-ref, prix min/max, agrégation formes/types
  - [ ] Lookup tables: SHAPE_LOOKUP, TYPE_LOOKUP maintenues à jour

---

## Epic 3: Filtres & Recherche

### Story 3.1: Filtres Statiques (Catégorie, Ligne)
- **AC1**: Dropdown catégorie (valeurs dérivées de descriptions uniques)
- **AC2**: Dropdown collection/ligne (valeurs dérivées de prenom_ligne uniques)
- **AC3**: OR logic: catégorie=null = toutes, sinon = produits matching
- **AC4**: Reset bouton → réinitialise tous les filtres
- **Tasks:**
  - [ ] FilterBar: <select> catégorie et ligne
  - [ ] Tests: dérivation unique categories/lines, reset

### Story 3.2: Filtres Dynamiques (Formes, Types)
- **AC1**: Afficher uniquement formes/types réellement utilisées (dériv du catalogue)
- **AC2**: Multi-select chips (toggle): formes[] ET types[] séparément
- **AC3**: Logique: produit inclus si (au moins 1 forme ET au moins 1 type) OU (aucun sélectionné)
- **AC4**: UI: chips actifs = gold-600 bg, inactifs = border slate-200
- **Tasks:**
  - [ ] FilterBar: chips dynamiques pour formes/types
  - [ ] Tests: toggle shape/type, filtering logic, combined filters

### Story 3.3: Recherche Référence
- **AC1**: Input text "Réf..." → filtrage case-insensitive par product.ref
- **AC2**: Résultat: include si ref contient la chaîne recherchée
- **AC3**: Visible sur desktop; mobile: non visible dans header (drawer uniquement)
- **Tasks:**
  - [ ] Input ref search dans FilterBar
  - [ ] Tests: recherche case-insensitive, partial match

### Story 3.4: Filtres Prix Min/Max
- **AC1**: Deux inputs numériques: minPrice, maxPrice
- **AC2**: Valeurs par défaut: global min/max du catalogue
- **AC3**: Filtrage: produit inclus si (minPrice ≤ product.maxPrice) AND (maxPrice ≥ product.minPrice)
- **AC4**: inputMode="numeric" + aria-labels
- **Tasks:**
  - [ ] FilterBar: inputs prix numériques, gestion NaN
  - [ ] Tests: range pricing, boundary cases

### Story 3.5: Affichage Résultats Dynamiques
- **AC1**: Compteur "N résultats" mis à jour lors filtre change
- **AC2**: Aria-live="polite" pour annonce lecteur d'écran
- **AC3**: Si 0 résultats: message "Aucun produit trouvé" + bouton reset
- **Tasks:**
  - [ ] Compteur dynamique + aria-live (done)
  - [ ] Tests: compteur lors filtrage, message empty state

---

## Epic 4: Fiche Produit & Interactions

### Story 4.1: Modal Produit Détaillée
- **AC1**: Click card → ouvre modal overlay avec fermeture possible (X, backdrop click)
- **AC2**: Responsive: side-by-side desktop, stack mobile
- **AC3**: Left: galerie; Right: infos (titre, tableau variantes)
- **AC4**: Modal print-friendly: `@media print` optimisé pour A4
- **Tasks:**
  - [ ] ProductModal structure (done)
  - [ ] Tests: modal open/close, responsive layout

### Story 4.2: Galerie & Zoom
- **AC1**: Image principale: clic/hover → zoom 2.5x (clip aux bornes image)
- **AC2**: Vignettes variations: clic → change image active (indicateur border-gold)
- **AC3**: Zoom coordonnées: calcul position souris (transform-origin)
- **AC4**: Lazy loading vignettes
- **Tasks:**
  - [ ] Zoom logic: calcul position origin
  - [ ] Tests: zoom scale, thumb selection, cursor feedback

### Story 4.3: Tableau Variantes Interactif
- **AC1**: Colonnes: Label, Détails Pierre (shape chip), Prix
- **AC2**: Clic ligne → change image active (pour voir la variante)
- **AC3**: Hover: bg-slate-50 feedback
- **AC4**: Responsive: overflow-x auto sur mobile
- **Tasks:**
  - [ ] Tableau variantes finalisé (done)
  - [ ] Tests: clic row, image switch, responsive scroll

### Story 4.4: Impression Tarifs
- **AC1**: Bouton "Imprimer Tarifs" → window.print()
- **AC2**: CSS @media print: layout 2 cols (image 1/3, tableau 2/3)
- **AC3**: Header: logo + ref + date impression
- **AC4**: A4 complet: pas de débordement, tableau lisible
- **AC5**: Frontend-only: aucun PDF généré côté serveur
- **Tasks:**
  - [ ] CSS @media print finalisé
  - [ ] Tests: browser print preview, A4 layout, overflow check

---

## Epic 5: Qualité & Performance

### Story 5.1: Gestion Erreurs Réseau
- **AC1**: API timeout (5s) → message utilisateur non-technique
- **AC2**: Login échoue: affiche bandeau rouge "Connexion impossible"
- **AC3**: Catalogue échoue: affiche bandeau rouge dans main content
- **AC4**: Retry implicite: fallback mock (dev/test)
- **Tasks:**
  - [ ] Try/catch autour loginUser et fetchCatalog
  - [ ] Messages erreur UX-friendly (done)
  - [ ] Tests: network error scenarios, timeout simulation

### Story 5.2: Performance Images
- **AC1**: Lazy loading: `loading="lazy"` sur toutes images
- **AC2**: Async decoding: `decoding="async"` sur grid + modal
- **AC3**: Thumbs serveur: < 100 kB par image (ETag caching)
- **AC4**: Bundle JS < 250 kB gz (target Vite)
- **Tasks:**
  - [ ] Audit Lighthouse Performance (Core Web Vitals)
  - [ ] Tests: lazy load triggered on scroll
  - [ ] Valider thumbs.php ETag / cache headers

### Story 5.3: Accessibilité (WCAG AA)
- **AC1**: Form inputs: `aria-label`, labels clairs
- **AC2**: Compteur résultats: `aria-live="polite"` annonce changes
- **AC3**: Boutons: focus visible (outline), accessible au clavier
- **AC4**: Images: alt text pertinent (ref produit)
- **AC5**: Contrastes: gold #c18b52 sur blanc ≥ 4.5:1
- **Tasks:**
  - [ ] Scan axe DevTools: 0 violations
  - [ ] Tests: keyboard nav, screen reader announcements
  - [ ] Contrast check: button, text, links

### Story 5.4: Mobile UX
- **AC1**: FilterBar: drawer latéral (transform slide-in/out)
- **AC2**: Cards: 1 col mobile, 2 cols tablet, 3-4 cols desktop
- **AC3**: Touch targets: ≥ 44x44 px (buttons, chips)
- **AC4**: Modal: full-width mobile, side-by-side desktop
- **AC5**: Ref search: invisible sur mobile (filtrer uniquement en drawer)
- **Tasks:**
  - [ ] Tests responsive: 375px (mobile), 768px (tablet), 1920px (desktop)
  - [ ] Touch-friendly UX review
  - [ ] Viewport meta tags + media queries

---

## Epic 6: Backend Enhancements

### Story 6.1: Ajouter Types CSV à catalogue.php
- **AC1**: Query catalogue renvoie `types`: GROUP_CONCAT(DISTINCT p.id_typ_pier) AS types
- **AC2**: Fallback: si id_typ_pier absent = frontend utilise id_typ_pier par ligne
- **AC3**: Tests: compare types CSV vs id_typ_pier fallback
- **Tasks:**
  - [ ] SQL UPDATE: ajouter GROUP_CONCAT types au SELECT
  - [ ] Tests: query retourne types CSV, frontendparse

### Story 6.2: Thumbs Service (Cache/ETag)
- **AC1**: thumbs.php?image=<file>&size=<n> → serveur redimensionne + cache local
- **AC2**: ETag header: hash(file, size) → 304 Not Modified si inchangé
- **AC3**: Cache-Control: max-age=86400 (1 jour)
- **AC4**: Fallback si erreur: retourne image brute ou 404 gracefully
- **Tasks:**
  - [ ] Implémenter thumbs.php caching + ETag
  - [ ] Tests: ETag 304, cache hit, size variations

---

## Roadmap Priorité

### Phase 1 (Sprint 1 — MVP)
- ✓ Auth (stories 1.1, 1.2)
- ✓ Catalogue (stories 2.1-2.3)
- ✓ Filtres (stories 3.1-3.4)
- ✓ Fiche produit (stories 4.1-4.3)
- **New:** Story 4.4 (impression), Story 5.3 (a11y passes)

### Phase 2 (Sprint 2 — Optimisation)
- Story 5.1, 5.2 (gestion erreurs, perf images)
- Story 5.4 (mobile UX refinement)
- Story 6.1 (types CSV backend)

### Phase 3 (Sprint 3 — Avancé)
- Story 6.2 (thumbs caching)
- Pagination / virtualisation si données volumineuses
- Service worker / offline support

---

## Définition de "Fait" (Definition of Done)

Pour chaque story :
1. Code implémenté et compilé (npm run build)
2. Tests unitaires (au minimum acceptance criteria vérifiés)
3. Responsive validé (mobile 375, tablet 768, desktop 1920)
4. A11y check: axe no violations
5. Perf check: Lighthouse > 80
6. Code review: nommage clair, pas de hacks
7. Docs/comments si logique complexe
8. Aucun console error/warning en prod
9. Testé sur navigateurs: Chrome, Firefox, Safari mobile

---

## Critères de Succès Globaux

- [ ] Catalogue charge < 2s sur 4G
- [ ] Login/logout fluide, token persiste
- [ ] Filtres appliqués < 100ms (memoization)
- [ ] Images nettes + petites (thumbs caching)
- [ ] Impression A4 propre, sans débordement
- [ ] Mobile 375px navigable sans pinch-zoom
- [ ] Aucune erreur réseau non gérée
- [ ] 95+ Lighthouse score (perf, a11y, best practices)
