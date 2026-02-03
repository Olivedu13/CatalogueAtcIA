# Architecture — Catalogue Joaillerie

## 1. Vue d'ensemble
Architecture **mobile-first** React + Vite (frontend) + PHP/mysqli (backend). Flux d'authentification simple (token localStorage), catalogue stateless, filtrage côté client.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
├──────────────────────────────────────────────────────────────┤
│  App.tsx (état global: user, products, filters, modal)      │
│    ├─ FilterBar (filtres: ref, cat, ligne, forme, type, $)  │
│    ├─ ProductCard Grid (regroupé par ref, thumb, prix)      │
│    └─ ProductModal (galerie, zoom, tableau variantes)       │
├──────────────────────────────────────────────────────────────┤
│  services/dataService.ts (API + normalisation)              │
│    ├─ loginUser() → POST login.php?action=login             │
│    ├─ loginUser() → POST login.php?action=log (token)       │
│    └─ fetchCatalog() → GET imageCatalogue.php + agrégation  │
├──────────────────────────────────────────────────────────────┤
│  types.ts (modèles: User, ProductModel, StoneShape, etc.)   │
└──────────────────────────────────────────────────────────────┘
           ↕ (HTTPS + env vars)
┌──────────────────────────────────────────────────────────────┐
│                    Backend (PHP + mysqli)                    │
├──────────────────────────────────────────────────────────────┤
│  login.php                                                   │
│    ├─ ?action=login  → auth + return user (id, agence, logo)│
│    └─ ?action=log    → log entry, return insertId (token)   │
│                                                              │
│  imageCatalogue.php                                          │
│    └─ GET → products (ref, desc, ligne, prix, formes, ...)  │
│             regroupement logique + types CSV idéal          │
│                                                              │
│  thumbs.php                                                  │
│    └─ ?image=<file>&size=<n> → cache/ETag miniatures        │
│                                                              │
│  DB: forme_pier, type_pier (lookups formes/types)           │
└──────────────────────────────────────────────────────────────┘
```

## 2. Couches Frontend

### 2.1 State Management (App.tsx)
- **User**: authentifié, logo, agence → localStorage + state React.
- **Products**: catalogue regroupé par `ref`, agrégé (min/max prix, variations).
- **Filters**: état global (ref, catégorie, ligne, formes[], types[], prix min/max).
- **Modal**: produit sélectionné pour affichage détaillé.

### 2.2 Services (dataService.ts)
- **loginUser(username, password)**
  - POST `${API_BASE}/login.php?action=login`
  - Gestion token + user storage (localStorage)
  - Fallback mock si API_BASE non configurée
- **fetchCatalog()**
  - GET `${API_BASE}/imageCatalogue.php` avec Authorization header
  - Normalisation images (thumbs.php avec fallback IMG_BASE)
  - Agrégation par `ref` → ProductModel
  - Dérivation formes/types utilisées (filtres dynamiques)
- **getToken(), clearSession()**
  - Accès sécurisé localStorage

### 2.3 Components

#### FilterBar (drawer mobile/desktop)
- Recherche par référence (text input)
- Catégorie (radio buttons)
- Prix min/max (sliders ou inputs numériques)
- Collection/ligne (select)
- Formes (chips multi-select, dynamiques)
- Types de pierre (chips multi-select, dynamiques)
- Reset + Appliquer

#### ProductCard Grid
- Vignette + info rapide (ligne, catégorie, ref, prix dès)
- Lazy loading + decoding async (perf)
- Hover: aperçu nb variantes
- Click: ouvre modal

#### ProductModal
- Galerie principale + zoom (hover/click)
- Vignettes de variantes (clic = change image active)
- Tableau: Label, Détails pierre, Prix (responsive)
- Bouton Imprimer (CSS @media print)
- Responsive: 50/50 desktop, stack mobile

#### Button (réutilisable)
- Variants: primary, secondary, outline
- States: disabled, loading
- Props: fullWidth, icon, className

### 2.4 Types (types.ts)
```typescript
User { id, username, logoUrl, companyName }
ProductModel { ref, category, line, thumbnail, minPrice, maxPrice, variations[], availableShapeIds[], availableTypeIds[] }
ProductVariation extends RawProductItem { resolvedShape?, resolvedType? }
StoneShape { id, description, typ_dim }
StoneType { id, description }
FilterState { reference, category, line, minPrice, maxPrice, shapeIds[], stoneTypeIds[] }
```

## 3. Backend Contracts (PHP)

### POST /login.php?action=login
**Request:**
```json
{ "user": "commercial", "password": "pwd123" }
```
**Response (200):**
```json
[{
  "id": 1,
  "Nom_agence": "Joaillerie X",
  "logo": "logo.png",
  "companyName": "Joaillerie X"
}]
```

### POST /login.php?action=log
**Request:**
```json
{ "id_user": 1 }
```
**Response (200):**
```json
{ "insertId": 42 }
```
Token utilisé = `42` (ou convertir en string pour localStorage).

### GET /imageCatalogue.php
**Request:** Headers: `Authorization: Bearer <token>`

**Response (200):**
```json
[{
  "ref": "BAG001",
  "label": "Bague Classique",
  "prix": 150.00,
  "description": "Bague",
  "prenom_ligne": "Collection Or",
  "id_centre": 5,
  "img": "bag001.jpg",
  "img_cv": "bag001_cover.jpg",
  "formes": "1005,1016",
  "gallery": ["bag001_v1.jpg", "bag001_v2.jpg"],
  "id_typ_pier": 1003,
  "types": "1003,1009"
}]
```
**Champs clés:**
- `formes`: CSV d'IDs (ex: "1005,1016" = ROND, POIRE)
- `types` ou `id_typ_pier`: CSV ou id unique (IDÉAL: ajouter types CSV = GROUP_CONCAT(DISTINCT p.id_typ_pier))
- `gallery`: Array d'autres images

### GET /imgs/thumbs.php?image=<file>&size=<n>
- Serveur: cache local + ETag
- Params: `image` (filename), `size` (pixels, ex: 700)
- Response: image optimisée avec cache headers

## 4. Data Flow

### Authentification
1. User tape login/password dans App.tsx
2. `loginUser(user, pwd)` → POST login.php?action=login
3. Si OK, reçoit user data; POST login.php?action=log pour obtenir token
4. Token + user stockés localStorage
5. Header Authorization: Bearer <token> pour les requêtes suivantes

### Catalogue & Filtres
1. Post-login: `fetchCatalog()` → GET imageCatalogue.php
2. Frontend reçoit Array<RawProductItem>
3. Normalisation: images via thumbs, galerie convertie
4. Agrégation: regroupement par `ref` → ProductModel
5. Dérivation: formes/types réellement utilisées (Set)
6. Retour: { products[], shapes[], types[] }
7. État App: products, shapes, types mis à jour
8. Filtres appliqués en client-side (Array.filter)

### Impression
1. Modal ouverte, user clique "Imprimer"
2. window.print() déclenche CSS @media print
3. Layout optimisé: 2 cols (image 1/3, tableau variantes 2/3)
4. Entête avec logo + ref
5. Tableau compact sans scrolling
6. Client PDF génère via navigateur (Ctrl+P)

## 5. Performance & Accessibilité

### Images
- Lazy loading: `loading="lazy"` sur toutes les cartes
- Async decoding: `decoding="async"` pour déport rendu
- Thumbs serveur via `thumbs.php` (cache + ETag) < 100 kB
- Bundle Vite ~70 kB gz

### Accessibilité
- Labels explicites: `aria-label` sur inputs
- Aria-live sur compteur résultats (mise à jour annoncée)
- Focus visibles: `:focus-visible` Tailwind
- Contrastes: WCAG AA (or #c18b52 sur blanc)
- Alt text: `alt={product.ref}` sur toutes les images

### Erreurs
- Message utilisateur clair: "Connexion ou chargement impossible"
- Retry silencieux: fallback mock si API_BASE absent
- Console: logs détaillés (dev only)

## 6. État de Déploiement

| Env | API_BASE | IMG_BASE | THUMB_URL | Notes |
|-----|----------|----------|-----------|-------|
| DEV | http://localhost/api | http://localhost/imgs | http://localhost/imgs/thumbs.php | Fallback mock |
| PROD | https://extensia.com/api | https://extensia.com/imgs | https://extensia.com/imgs/thumbs.php | HTTPS requis |

## 7. Prochaines Passes

- **Sprint 1**: Filtres avancés (range slider, multi-select ux), print enrichi.
- **Sprint 2**: Pagination/virtualisation si > 500 produits par page.
- **Sprint 3**: Optimisations (service worker, offline fallback), analytics.
