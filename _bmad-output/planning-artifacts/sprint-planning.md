# Sprint Planning — Catalogue Joaillerie (Sprint 1)

## Sprint Scope

**Duration:** 2 semaines (10 jours travail)  
**Velocity:** 18-20 story points  
**Objectif:** MVP fonctionnel auth + catalogue + filtres + fiche produit

---

## Sprint 1 Backlog (Priorisé)

### Theme 1: Authentication & Session (Epic 1)

#### 🔴 Story 1.1: Login Utilisateur
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (dataService.ts prêt, tests manquent)

**Tasks:**
1. [ ] Valider loginUser() parsing réponse backend (test case: success + failure)
2. [ ] Tests: login valide, password incorrect, timeout réseau
3. [ ] Vérifier token localStorage persist après reload
4. [ ] Ajouter message erreur UX sur form (done)
5. [ ] Test end-to-end: form → POST → token stored → logged in

**Acceptance Criteria:**
- AC1: Form login (user + pwd) → POST login.php?action=login
- AC2: Succès → POST login.php?action=log → token localStorage
- AC3: Erreur → message utilisateur clair (bandeau rouge)
- AC4: Token persist après reload page

**Sprint Notes:** Prêt sauf tests end-to-end. Demander backend confirm formes CSV Response format.

---

#### 🟢 Story 1.2: Logout & Nettoyage Session
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (clearSession() implémenté)

**Tasks:**
1. [x] clearSession() appelé au logout
2. [x] Token localStorage supprimé
3. [ ] Tests: logout → retour login screen vierge
4. [ ] Tests: logout → refresh page → login screen (pas de cached state)

**Acceptance Criteria:**
- AC1: Bouton logout → suppression token localStorage + user state
- AC2: Logout → retour écran login (form vierge)
- AC3: Logout → navigate back → écran login bloque (pas de cached state)

**Sprint Notes:** Implémentation simple. Tests rapides.

---

### Theme 2: Catalogue & Data Normalization (Epic 2)

#### 🟡 Story 2.1: Récupération Catalogue
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (fetchCatalog prêt, tests manquent)

**Tasks:**
1. [ ] Test fetchCatalog() parsing Array<RawProductItem>
2. [ ] Vérifier formes CSV parser (parseCsvIds)
3. [ ] Fallback erreur réseau: vérifier message utilisateur
4. [ ] Test timeout (5s) + retry logique
5. [ ] Validation: gallery Array normalisée

**Acceptance Criteria:**
- AC1: POST-login: fetchCatalog() → GET imageCatalogue.php avec Authorization header
- AC2: Response Array<RawProductItem> avec formes/types CSV
- AC3: Erreur réseau → fallback empty array + message utilisateur
- AC4: Spinner loading visible pendant fetch

**Sprint Notes:** Prêt sauf validation. Backend doit confirmer formes CSV + idéalement types CSV.

---

#### 🟢 Story 2.2: Normalisation Images & Thumbnails
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (buildThumb() implémenté, lazy/async appliqué)

**Tasks:**
1. [x] buildThumb() via thumbs.php?image=<file>&size=700
2. [x] Fallback IMG_BASE si thumbs indisponible
3. [x] Gallery normalisée via thumbs
4. [x] lazy loading + decoding async sur grid + modal images
5. [ ] Tests: URL construction, fallback

**Acceptance Criteria:**
- AC1: Images brutes → thumbs.php + fallback IMG_BASE
- AC2: Gallery normalisée
- AC3: Lazy loading + decoding async appliqué
- AC4: Images chargent sans bloquer rendu

**Sprint Notes:** Prêt. Validations rapides.

---

#### 🟢 Story 2.3: Agrégation Produits par Référence
**Points:** 2  
**Assigné:** Dev  
**Status:** ✅ Done (agrégation logique implémentée)

**Tasks:**
1. [x] Regroupement par `ref` → ProductModel
2. [x] Calcul minPrice/maxPrice
3. [x] Dérivation formes/types utilisées (Set d'IDs)
4. [ ] Tests: multi-ref, prix min/max, formes/types agrégation
5. [ ] Lookup tables SHAPE_LOOKUP, TYPE_LOOKUP

**Acceptance Criteria:**
- AC1: Variations brutes → ProductModel par ref
- AC2: thumbnail, minPrice, maxPrice, variations[]
- AC3: Formes/types dérivées → Set d'IDs utilisés
- AC4: ResolvedShape/Type: libellé de 1ère variation

**Sprint Notes:** Prêt. Tests simples.

---

### Theme 3: Filters & Search (Epic 3)

#### 🟡 Story 3.1: Filtres Statiques (Catégorie, Ligne)
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (FilterBar dropdown exist, logique apply manque)

**Tasks:**
1. [ ] Dropdown catégorie: dériver unique categories
2. [ ] Dropdown collection/ligne: dériver unique lines
3. [ ] Logique filter: produit inclus si category match OU category=null (toutes)
4. [ ] Logique filter: produit inclus si line match OU line=null (toutes)
5. [ ] Tests: filter application, reset

**Acceptance Criteria:**
- AC1: Dropdown catégorie (valeurs dérivées descriptions uniques)
- AC2: Dropdown collection/ligne (valeurs dérivées prenom_ligne uniques)
- AC3: OR logic: catégorie=null = toutes, sinon = products matching
- AC4: Reset bouton → réinitialise tous filtres

**Sprint Notes:** FilterBar structure exist. Ajouter logique filter App.tsx.

---

#### 🟡 Story 3.2: Filtres Dynamiques (Formes, Types)
**Points:** 3  
**Assigné:** Dev  
**Status:** 🟡 En cours (chips exist, logique filter + toggle manque)

**Tasks:**
1. [ ] Afficher uniquement formes réellement utilisées (dériv catalogue)
2. [ ] Chips multi-select formes: toggle shape IDs
3. [ ] Chips multi-select types: toggle type IDs
4. [ ] Logique filter: produit inclus si (au moins 1 forme ∩ au moins 1 type) OU (aucun sélectionné)
5. [ ] Tests: toggle, filtering logic, combined filters

**Acceptance Criteria:**
- AC1: Afficher uniquement formes/types utilisés (dynamiques)
- AC2: Multi-select chips (toggle)
- AC3: Logique: produit inclus si matching shape AND matching type
- AC4: UI: chips actifs = gold-600, inactifs = border slate-200

**Sprint Notes:** Chips UI exist. Ajouter logique toggle + filtering App.tsx.

---

#### 🟡 Story 3.3: Recherche Référence
**Points:** 1  
**Assigné:** Dev  
**Status:** 🟡 En cours (input exist, logique filter manque)

**Tasks:**
1. [ ] Input "Réf..." dans FilterBar
2. [ ] Filtrage case-insensitive: product.ref.includes(refSearch)
3. [ ] Visible desktop seulement; mobile: drawer only
4. [ ] Tests: case-insensitive, partial match

**Acceptance Criteria:**
- AC1: Input text → filtrage case-insensitive par product.ref
- AC2: Résultat: include si ref contient chaîne
- AC3: Visible desktop; mobile: drawer only

**Sprint Notes:** Prêt. Logique simple include.

---

#### 🟡 Story 3.4: Filtres Prix Min/Max
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (inputs numériques, NaN handling fixed)

**Tasks:**
1. [x] Deux inputs numériques: minPrice, maxPrice
2. [x] inputMode="numeric" + aria-labels
3. [x] Gestion NaN: null si empty string
4. [ ] Tests: range pricing, boundary cases

**Acceptance Criteria:**
- AC1: Deux inputs numériques (min/max)
- AC2: Valeurs par défaut: global min/max
- AC3: Filtrage: product inclus si (minPrice ≤ product.maxPrice) AND (maxPrice ≥ product.minPrice)
- AC4: inputMode="numeric" + aria

**Sprint Notes:** Prêt. Tests boundary cases.

---

#### 🟢 Story 3.5: Affichage Résultats Dynamiques
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (compteur + aria-live)

**Tasks:**
1. [x] Compteur "N résultats" dynamique
2. [x] aria-live="polite" pour annonce
3. [x] Empty state: "Aucun produit trouvé" + reset button
4. [ ] Tests: compteur filtre, message empty state

**Acceptance Criteria:**
- AC1: Compteur "N résultats" mis à jour lors filtrage
- AC2: aria-live="polite" pour annonce
- AC3: Si 0 résultats: message "Aucun produit trouvé" + reset

**Sprint Notes:** Prêt. Tests simples.

---

### Theme 4: Product Detail & Interactions (Epic 4)

#### 🟢 Story 4.1: Modal Produit Détaillée
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (structure implémentée)

**Tasks:**
1. [x] Modal overlay avec close (X, backdrop)
2. [x] Responsive: side-by-side desktop, stack mobile
3. [ ] Tests: open/close, responsive layout
4. [ ] Vérifier print styles (CSS @media print)

**Acceptance Criteria:**
- AC1: Click card → ouvre modal overlay
- AC2: Close: X button, backdrop click
- AC3: Responsive desktop/tablet/mobile
- AC4: Modal print-friendly A4

**Sprint Notes:** Prêt. Tests layout.

---

#### 🟢 Story 4.2: Galerie & Zoom
**Points:** 2  
**Assigné:** Dev  
**Status:** ✅ Done (zoom logic implémenté)

**Tasks:**
1. [x] Click/hover → zoom 2.5x
2. [x] Vignettes: clic → change image active
3. [x] Zoom coordonnées: transform-origin calculé
4. [ ] Tests: zoom scale, thumb selection
5. [ ] Vérifier lazy/async images vignettes

**Acceptance Criteria:**
- AC1: Image principale: clic/hover → zoom 2.5x
- AC2: Vignettes: clic → change image active
- AC3: Zoom coordonnées (transform-origin)
- AC4: Lazy loading vignettes

**Sprint Notes:** Prêt. Tests interaction.

---

#### 🟢 Story 4.3: Tableau Variantes Interactif
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (tableau implémenté)

**Tasks:**
1. [x] Colonnes: Label, Détails Pierre, Prix
2. [x] Clic ligne → change image active
3. [x] Hover feedback (bg-slate-50)
4. [ ] Tests: row click, image switch
5. [ ] Responsive overflow-x mobile

**Acceptance Criteria:**
- AC1: Tableau colonnes: Label, Détails, Prix
- AC2: Clic ligne → change image active
- AC3: Hover feedback
- AC4: Responsive overflow-x

**Sprint Notes:** Prêt. Tests interaction.

---

#### 🟡 Story 4.4: Impression Tarifs
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (CSS @media print exist, tests manquent)

**Tasks:**
1. [ ] Bouton "Imprimer" testé → window.print()
2. [ ] CSS @media print: layout 2 cols (image 1/3, tableau 2/3)
3. [ ] Header print: logo + ref + date
4. [ ] Tests: browser print preview, A4 layout, pas de débordement
5. [ ] Vérifier pagination multi-pages si variations nombreuses

**Acceptance Criteria:**
- AC1: Bouton "Imprimer Tarifs" → window.print()
- AC2: CSS @media print: 2 cols, A4 optimisé
- AC3: Header: logo + ref + date impression
- AC4: A4 complet, pas de débordement

**Sprint Notes:** CSS exist. Tests print browser requis.

---

### Theme 5: Quality & Performance (Epic 5, partiel Sprint 1)

#### 🟡 Story 5.1: Gestion Erreurs Réseau
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (bandeau erreur exist, tests manquent)

**Tasks:**
1. [ ] Try/catch autour loginUser & fetchCatalog
2. [ ] Message utilisateur non-technique: "Connexion impossible"
3. [ ] Bandeau rouge login + main content
4. [ ] Tests: network error scenarios, timeout simulation
5. [ ] Retry implicite: fallback mock

**Acceptance Criteria:**
- AC1: API timeout (5s) → message utilisateur clair
- AC2: Login échoue → bandeau rouge
- AC3: Catalogue échoue → bandeau rouge main
- AC4: Retry/fallback mock

**Sprint Notes:** Structure exist. Tests requis.

---

#### 🟢 Story 5.2: Performance Images
**Points:** 1  
**Assigné:** Dev  
**Status:** ✅ Done (lazy + async appliqué)

**Tasks:**
1. [x] Lazy loading toutes images
2. [x] Async decoding grid + modal
3. [ ] Audit Lighthouse (target: > 80 perf score)
4. [ ] Valider thumbs < 100 kB (idéal)
5. [ ] Bundle Vite < 250 kB gz (vérifié: 68 kB)

**Acceptance Criteria:**
- AC1: Lazy loading: `loading="lazy"` sur toutes images
- AC2: Async decoding: `decoding="async"` grid + modal
- AC3: Thumbs serveur < 100 kB (ETag caching)
- AC4: Bundle JS < 250 kB gz ✅

**Sprint Notes:** Prêt. Audit Lighthouse requis.

---

#### 🟡 Story 5.3: Accessibilité (WCAG AA)
**Points:** 2  
**Assigné:** Dev  
**Status:** 🟡 En cours (labels + aria-live appliqués, scan manque)

**Tasks:**
1. [ ] Form inputs: aria-label (done)
2. [ ] Compteur résultats: aria-live="polite" (done)
3. [ ] Scan axe DevTools: 0 violations
4. [ ] Buttons: focus visible (outline), keyboard nav
5. [ ] Images: alt text pertinent
6. [ ] Contrastes WCAG AA test

**Acceptance Criteria:**
- AC1: Form inputs: aria-label, labels clairs
- AC2: Compteur: aria-live="polite"
- AC3: Axe scan: 0 violations
- AC4: Focus visible, keyboard accessible
- AC5: Images alt text
- AC6: Contrastes ≥ 4.5:1 (WCAG AA)

**Sprint Notes:** Structure exist. Scan axe + test keyboard nav requis.

---

## Sprint 1 Story Map

```
Day 1-2:   Story 1.1, 1.2 (Auth)
Day 2-3:   Story 2.1, 2.2, 2.3 (Catalogue)
Day 4-6:   Story 3.1-3.5 (Filtres)
Day 7-8:   Story 4.1-4.4 (Fiche produit + impression)
Day 9-10:  Story 5.1-5.3 (QA, perf, a11y tests)
```

---

## Daily Standups (Template)

**Format:** 15 min, fin de journée

```
- ✅ Complété aujourd'hui: [Story/Task]
- 🟡 En cours: [Story/Task] → blockers?
- ⬜ Prévu demain: [Story/Task]
- 🚨 Blocker: [None / Description] → escalade if needed
```

---

## Definition of Done (Sprint 1)

Pour chaque story, avant "Done":

1. [ ] Code implémenté + compilé (npm run build)
2. [ ] Tests: acceptance criteria vérifiés (manual ou unit)
3. [ ] Responsive: mobile 375, tablet 768, desktop 1920 testé
4. [ ] Axe a11y scan: 0 violations (5.3 story)
5. [ ] Aucune console error/warning prod
6. [ ] Code review: nommage clair, pas de hacks
7. [ ] Docs/comments si logique complexe
8. [ ] Tests cross-browser: Chrome, Firefox, Safari

---

## Sprint Success Criteria

- ✅ Toutes 18 stories completed (DoD)
- ✅ Build Vite success, dist/ généré
- ✅ No critical P1 bugs (blockers)
- ✅ Lighthouse score ≥ 80
- ✅ A11y: 0 axe violations
- ✅ Mobile 375px navigable sans pinch
- ✅ Login→Catalogue→Filter→Detail flow 100% fonctionnel

---

## Sprint 1 Risks & Mitigations

| Risque | Mitigation |
|--------|-----------|
| Backend API delayed | Fallback mock, proceed with client-side |
| Types CSV absent | Use id_typ_pier fallback, add Sprint 2 |
| Mobile UX discovery | Quick UX audit mid-sprint, adjust Day 5 |
| Print layout breaks | Browser print tests Day 8, fix same day |
| A11y scan violations | Run axe early (Day 1), fix in parallel |

---

## Sign-Off

- **Sprint Start:** 2026-01-22
- **Sprint End:** 2026-02-05
- **Scrum Master Approval:** [À signer]
- **Tech Lead Approval:** [À signer]

---

## Appendix: Task Breakdown Example (Story 3.2)

### Story 3.2: Filtres Dynamiques (Formes, Types)

**Décomposition des tasks:**

1. **Task 3.2.1: Afficher formes dynamiques** (Dev, 2h)
   - Dériver formes utilisées du catalogue
   - Passer au FilterBar en props
   - Rendre chips Tailwind

2. **Task 3.2.2: Afficher types dynamiques** (Dev, 2h)
   - Dériver types utilisés du catalogue
   - Passer au FilterBar en props
   - Rendre chips Tailwind

3. **Task 3.2.3: Logique toggle shapes** (Dev, 1h)
   - toggleShape(id) dans FilterBar
   - State: filters.shapeIds[]
   - UI feedback: selected = gold-600

4. **Task 3.2.4: Logique toggle types** (Dev, 1h)
   - toggleType(id) dans FilterBar
   - State: filters.stoneTypeIds[]
   - UI feedback: selected = gold-600

5. **Task 3.2.5: Logique filtrage App.tsx** (Dev, 2h)
   - Filter logic: produit inclus si matching shape ∩ type
   - OR: aucun sélectionné = toutes (défaut)
   - Dépendance: filters.shapeIds + filters.stoneTypeIds

6. **Task 3.2.6: Tests manuels** (Dev, 1h)
   - Toggle formes → grid update
   - Toggle types → grid update
   - Combined filters
   - Reset all

**Total Task Estimate:** 9h (→ ~1 jour complet)
