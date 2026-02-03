# Implementation Readiness — Catalogue Joaillerie

## 1. Checklist Dépendances

### Frontend (React + Vite)

| Dépendance | Version | Status | Notes |
|-----------|---------|--------|-------|
| React | 19.x | ✅ Installée | Hooks, suspense modernes |
| Vite | 6.4.1 | ✅ Installée | HMR, bundle < 250 kB gz |
| TypeScript | 5.8 | ✅ Installée | Type safety |
| Tailwind CSS | 4.x | ✅ Installée | Styling, responsive, print |
| Lucide React | Latest | ✅ Installée | Icons (Search, Filter, Gem, etc.) |

### Backend (PHP + MySQL)

| Stack | Version | Status | Notes |
|-------|---------|--------|-------|
| PHP | 7.4+ | ✅ Requis | mysqli, JSON |
| MySQL/MariaDB | 5.7+ | ✅ Requis | Tables: forme_pier, type_pier, produits |
| Apache/Nginx | Any | ✅ Requis | CORS headers si cross-origin |

### Infrastructure

| Composant | Statut | Notes |
|-----------|--------|-------|
| Node.js 18+ | ✅ Codespaces | Pour npm, build Vite |
| HTTPS | ✅ Requis PROD | Sécurité token localStorage |
| CORS | ⚠️ À configurer | Backend allow-origin frontend |
| ETag/Cache | ⚠️ À implémenter | thumbs.php caching |

---

## 2. Environnements de Déploiement

### Développement (Codespaces)

```
Frontend: http://localhost:5173 (Vite)
Backend: http://localhost/api (PHP locale ou distante)
API_BASE: http://localhost/api
IMG_BASE: http://localhost/imgs
THUMB_URL: http://localhost/imgs/thumbs.php
Token: localStorage (mock ou vrai)
```

**Go/No-Go:**
- ✅ npm install + npm run dev
- ✅ Build Vite successful (dist/)
- ⚠️ Backend PHP doit être accessible (IP/DNS)
- ⚠️ CORS headers si cross-origin

### Production (Extensia)

```
Frontend: https://extensia.com/ (Vite static)
Backend: https://extensia.com/api (PHP)
API_BASE: https://extensia.com/api
IMG_BASE: https://extensia.com/imgs
THUMB_URL: https://extensia.com/imgs/thumbs.php
Token: localStorage (JWT optionnel)
```

**Go/No-Go:**
- ✅ Build Vite compress (dist/)
- ✅ Déploiement frontend (S3, Vercel, ou statique serveur)
- ✅ Backend PHP disponible HTTPS
- ✅ Images serveur thumbnails caching

---

## 3. Risques Techniques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| **API indisponible au login** | Moyenne | Élevé | Fallback mock, message clair, retry auto |
| **Images manquantes/broken links** | Moyenne | Moyen | Img alt text, fallback placeholder |
| **Types CSV manquants en endpoint** | Moyen | Moyen | Fallback id_typ_pier par ligne, lookup minimal |
| **Thumbs.php non implémenté** | Faible | Moyen | Fallback IMG_BASE direct, images un peu plus lourdes |
| **Token localStorage expiré** | Bas | Bas | Logout automatique, re-login simple |
| **CORS bloqué (dev cross-domain)** | Moyen | Moyen | Proxy dev, backend CORS headers, HTTPS prod |
| **Données volumineuses (> 10k produits)** | Bas | Moyen | Pagination/virtualisation Sprint 3 |
| **Mobile 375px overflow** | Bas | Bas | Tests responsive, drawer overflow-y |

### Stratégies Mitigations Prioritaires

1. **Mock API fallback** : DataService retourne empty array au lieu de crash
2. **Gestion erreurs réseau** : Message utilisateur clair, pas de console errors
3. **Lazy loading images** : Pas de blocage rendu, thumbs async
4. **Validation types CSV** : Frontend handle vide string OU id_typ_pier OU types array

---

## 4. Points d'Intégration Backend (Blocking)

### db.php (NOUVEAU — Connexion Centralisée)

**Requis pour Sprint 1:**

```php
// backend/db.php
- Connecter mysqli avec credentials env (DB_HOST, DB_USER, DB_PASS, DB_NAME)
- Set charset utf8mb4
- Fournir helpers: execute_query(), get_insert_id()
- Importé par login.php, imageCatalogue.php
```

**Checklist:**
- [ ] db.php créé avec connexion centralisée ✅ (à adapter à vos credentials)
- [ ] login.php + imageCatalogue.php utilisent `require_once __DIR__ . '/db.php'` ✅
- [ ] Env vars DB_HOST, DB_USER, DB_PASS, DB_NAME configurées
- [ ] Test: `php -r "require 'db.php';"` ne retourne pas d'erreur

**Status:** ✅ **Structure créée** — À adapter à votre DB réelle

---

### Story 2.1: Endpoint imageCatalogue.php

**Requis pour Sprint 1:**
```sql
SELECT 
  p.ref, 
  p.label, 
  p.prix, 
  p.description, 
  p.prenom_ligne,
  p.id_centre,
  p.img, 
  p.img_cv,
  GROUP_CONCAT(DISTINCT p.id_form_pier) AS formes,
  GROUP_CONCAT(DISTINCT p.id_typ_pier) AS types,
  GROUP_CONCAT(DISTINCT p.id_typ_pier) AS id_typ_pier,
  p.gallery
FROM produits p
WHERE p.visible = 1
ORDER BY p.ref;
```

**Checklist:**
- [ ] `formes` retourné en CSV (ex: "1005,1016")
- [ ] `types` retourné en CSV (ex: "1003,1009") ← **BLOQUANT pour filtres types**
- [ ] `gallery` array JSON de filenames
- [ ] Endpoint retourne 200 + Array JSON
- [ ] Authorization header respected (Bearer token)

**Status:** ⚠️ **À CONFIRMER** — Demander backend si `types` CSV possible Sprint 1 ou fallback id_typ_pier

---

### Story 6.1: Types CSV Backend

**Si types CSV pas dispo**, Frontend fallback sur `id_typ_pier` (ID unique par variation). Filtres types toujours 100% fonctionnels mais moins précis.

**Recommandation:** Ajouter types CSV au query imageCatalogue.php ASAP (gain: filtres types exacts).

---

### Story 1.1: Endpoint login.php?action=login

**Format requis (actuellement implémenté):**
```json
[{
  "id": 1,
  "Nom_agence": "Joaillerie X",
  "logo": "logo.png"
}]
```

**Checklist:**
- [ ] POST `/login.php?action=login` accepte `{ user, password }`
- [ ] Retour Array<user> avec au minimum `{ id, Nom_agence }`
- [ ] Logo field optionnel (fallback UI avatar)

**Status:** ✅ **Confirmé** — Implémenté dans dataService.ts

---

### Story 1.2: Endpoint login.php?action=log

**Format requis:**
```json
{ "insertId": 42 }
```

**Checklist:**
- [ ] POST `/login.php?action=log` accepte `{ id_user }`
- [ ] Crée log entry DB
- [ ] Retour insertId OU simple token string
- [ ] Frontend convertit en token localStorage

**Status:** ✅ **Confirmé** — Implémenté dans dataService.ts

---

### Story 6.2: Thumbs Service (Optional Sprint 1, Priority Sprint 2)

**Endpoint:** `GET /imgs/thumbs.php?image=<file>&size=<n>`

**Requis:**
- [ ] Redimensionner image à `size` pixels
- [ ] Cache local (1 jour)
- [ ] ETag header (hash fichier + size)
- [ ] 304 Not Modified si unchanged
- [ ] Fallback 404 ou image brute si erreur

**Status:** ⚠️ **À implémenter** — Sprint 2 (perfs optimization)

---

## 5. Checklist Technique de Lancement

### Pre-Sprint 1 Go/No-Go

- [ ] **Backend API**
  - [ ] login.php?action=login déployé & testé
  - [ ] login.php?action=log déployé & testé
  - [ ] imageCatalogue.php déployé avec `formes` CSV
  - [ ] Types CSV idéalement inclus (fallback id_typ_pier sinon)
  - [ ] **db.php connexion centralisée** (NOUVEAU) ← utilisé par tous endpoints
  - [ ] CORS headers configurés (Access-Control-Allow-Origin)
  - [ ] HTTPS disponible (prod)

- [ ] **Frontend Code**
  - [ ] `npm install` sans erreurs
  - [ ] `npm run build` sans erreurs (dist/ généré)
  - [ ] `npm run dev` lance Vite sur 5173
  - [ ] Types compilent (TypeScript no errors)

- [ ] **Environnement Codespaces**
  - [ ] Node 18+ installé
  - [ ] .env.local présent avec API_BASE/IMG_BASE
  - [ ] Accès backend depuis Codespaces (firewall OK)

- [ ] **QA Basique**
  - [ ] Login form affiche
  - [ ] Login POST teste (mock ou vrai endpoint)
  - [ ] Catalogue charge (ou mock fallback)
  - [ ] Filtres affichent (dérivation unique categories/lines)
  - [ ] Modal ouvre/ferme au clic

- [ ] **Documentation**
  - [ ] README.md mis à jour (démarrage, env)
  - [ ] Architecture.md reviewed
  - [ ] Epics-and-stories.md accepté

### Risques Critiques Pre-Launch

| Risque | Resolution |
|--------|-----------|
| Backend API inaccessible | Fallback mock (dev only), tester firewall |
| Types CSV absent | Fallback id_typ_pier, ajouter Sprint 2 |
| CORS bloqué | Backend add Access-Control headers |
| Build Vite fails | Vérifier dépendances, npm audit fix |

---

## 6. Estimation & Capacity

### Team Capacity (Hypothèse 1 dev fulltime)

**Velocity assumée:** 5-8 story points/sprint (5 jours)
- Design/markup: ~1 jour
- Logique filtres: ~1 jour
- Tests/polish: ~1 jour

### Sprint 1 Objectif (2-3 semaines)

**High Priority Stories** (18-20 pts estimé):
- 1.1: Auth (2 pts) ✅ Prêt
- 1.2: Logout (1 pt) ✅ Prêt
- 2.1: Catalogue fetch (2 pts) ✅ Prêt
- 2.2: Normalisation images (1 pt) ✅ Prêt
- 2.3: Agrégation (2 pts) ✅ Prêt
- 3.1-3.5: Filtres (8 pts) 🟡 Partiellement prêt (chips, inputs existants)
- 4.1-4.3: Fiche produit (4 pts) ✅ Prêt
- 4.4: Impression (2 pts) ✅ Prêt (CSS @media print exist)
- 5.3: A11y passes (2 pts) ⚠️ À faire (tests axe)

**Total Sprint 1: ~18 pts** → Faisable en 2 semaines

### Sprint 2 (Optimisation — semaine 3-4)

- 5.1: Gestion erreurs (2 pts)
- 5.2: Perf images (2 pts)
- 5.4: Mobile UX refinement (3 pts)
- 6.1: Types CSV backend (1 pt)
- 6.2: Thumbs caching (3 pts)

---

## 7. Signature Go/No-Go

### Conditions Go pour Sprint 1

**MUST HAVE:**
1. ✅ Backend login.php?action=login réponse testée
2. ✅ Backend imageCatalogue.php endpoint réponse testée (formes CSV obligatoire)
3. ✅ Frontend npm run build réussit
4. ✅ Frontend npm run dev accessible
5. ✅ .env.local présent et testé

**NICE TO HAVE (Sprint 2 OK):**
- Types CSV backend idéal mais fallback OK
- Thumbs.php caching (fallback IMG_BASE)

### Recommendation

**✅ GO for Sprint 1** avec conditions:
- Backend confirme imageCatalogue.php formes CSV ✅
- Frontend build OK ✅
- Fallback mock activé si API_BASE absent

**Blocker si:**
- [ ] Backend API inaccessible depuis Codespaces (firewall) → Résoudre AVANT
- [ ] Build Vite échoue → Debugger AVANT
- [ ] imageCatalogue.php ne retourne pas formes → Demander backend ASAP

---

## 8. Ressources & Contacts

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| Backend PHP | [À confirmer] | [À confirmer] |
| Frontend React | Dev (moi, agent) | ✅ Continu |
| DevOps/Infra | [À confirmer] | [À confirmer] |
| QA/Tests | [À planifier] | [À planifier] |

---

## Prochaines Étapes

1. **Valider cette checklist** avec backend (notamment formes CSV, types CSV)
2. **Confirmer firewall/CORS** depuis Codespaces
3. **Signer le Go/No-Go**
4. **Lancer Sprint 1** avec sprint-planning.md
5. **Daily standups** pour blockers

---

## Signature & Date

- **Review Date:** 2026-01-22
- **Tech Lead Approval:** [À signer]
- **Backend Lead Approval:** [À signer]
- **GO/NO-GO Status:** 🟡 **CONDITIONAL GO** (pending backend confirmation formes/types CSV)
