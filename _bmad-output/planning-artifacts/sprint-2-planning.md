# Sprint 2 Planning — Optimisation & Backend (2 semaines)

## 🎯 Objectifs Sprint 2
1. Optimiser les performances (Lighthouse > 80)
2. Raffinement mobile UX + a11y validation complet
3. Implémenter backend enhancements (types CSV, thumbs caching)
4. Tester tous endpoints avec données réelles (post-déploiement)
5. **Deliverable:** Version production-ready, prête au déploiement

---

## 📊 Backlog Sprint 2

### Semaine 1 : Backend Integration & Performance

#### Task 1.1: Backend Types CSV Integration (Story 6.1)
- **Owner:** Backend Dev
- **Story Points:** 3
- **Description:** 
  - Adapter catalogue.php pour retourner `types`: GROUP_CONCAT(DISTINCT id_typ_pier)
  - Frontend met à jour fetchCatalog() pour utiliser types CSV au lieu de id_typ_pier seul
  - Tests: vérifier types CSV correctement parsés dans ProductModel
- **Acceptance Criteria:**
  - [x] catalogue.php retourne types CSV
  - [ ] Frontend parse types CSV sans erreur
  - [ ] Test: compare types vs id_typ_pier, ensure no duplicates
- **Definition of Done:**
  - [ ] Code deployed + tested
  - [ ] No console errors
  - [ ] npm run build succeeds

#### Task 1.2: Lighthouse Audit & Performance Optimization (Story 5.2)
- **Owner:** Frontend Lead
- **Story Points:** 5
- **Description:**
  - Lancer Lighthouse audit (production build)
  - Target: Performance > 80, LCP < 2.5s, CLS < 0.1
  - Optimisations potentielles:
    - Lazy loading déjà appliqué ✓
    - Async decoding déjà appliqué ✓
    - Code splitting si nécessaire
    - Image optimization (WebP fallback)
    - CSS critiques inlining
  - Documenter résultats + actions
- **Acceptance Criteria:**
  - [ ] Lighthouse Performance score ≥ 80
  - [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
  - [ ] Bundle size JS ≤ 250 kB gzip
  - [ ] Audit screenshot attached
- **Definition of Done:**
  - [ ] Rapport Lighthouse enregistré
  - [ ] Optimisations implémentées
  - [ ] Vérification post-optimisation

#### Task 1.3: Thumbs Service Cache & ETag (Story 6.2)
- **Owner:** Backend Dev
- **Story Points:** 5
- **Description:**
  - Implémenter ETag caching dans thumbs.php
  - Cache headers: Cache-Control: max-age=86400
  - Test avec curl: vérifier 304 Not Modified
  - Gérer fallback si erreur
  - Note: En local, fallback to source image (GD/ImageMagick non disponible)
- **Acceptance Criteria:**
  - [ ] thumbs.php retourne ETag header
  - [ ] 304 Not Modified quand ETag match
  - [ ] Cache-Control headers corrects
  - [ ] Fallback image gracefully on error
- **Definition of Done:**
  - [ ] Code reviewed
  - [ ] Tests curl documentés
  - [ ] No console errors

### Semaine 2 : Mobile UX Refinement & Deployment Readiness

#### Task 2.1: Mobile UX Refinement (Story 5.4)
- **Owner:** Frontend Lead
- **Story Points:** 5
- **Description:**
  - Tester responsive: 375px (mobile), 768px (tablet), 1920px (desktop)
  - Vérifier DrawerFilterBar slide-in/out animation fluide
  - Touch targets: tous boutons/chips ≥ 44x44 px
  - Modal: vérifier aspect mobile (full-width) vs desktop (side-by-side)
  - Ref search: caché sur mobile ✓ (déjà fait)
  - Test sur réels appareils (si possible iPhone, Android)
- **Acceptance Criteria:**
  - [ ] 375px: navigable sans pinch-zoom, légible
  - [ ] 768px: 2-col layout optimal
  - [ ] 1920px: 3-4 col layout, pas cramped
  - [ ] Touch targets ≥ 44x44 px
  - [ ] Drawer animation smooth (no jank)
  - [ ] Modal responsive test passed
- **Definition of Done:**
  - [ ] Screenshots prises (3 breakpoints)
  - [ ] No layout shift (CLS validation)
  - [ ] Tested on real devices if possible

#### Task 2.2: A11y Full Validation (Story 5.3)
- **Owner:** QA Lead
- **Story Points:** 3
- **Description:**
  - Run axe DevTools scan: target 0 violations
  - Keyboard navigation test:
    - Tab through all interactive elements
    - Enter/Space activates buttons
    - Escape closes modal/drawer
  - Screen reader test (NVDA/JAWS mock or actual):
    - Login form: inputs announced with labels
    - Compteur résultats: aria-live=polite announces changes
    - Product cards: ref + price announced
  - Contrast check: all text ≥ 4.5:1 (WCAG AA)
  - Alt text: all images have pertinent alt (or aria-hidden if decorative)
- **Acceptance Criteria:**
  - [ ] axe scan: 0 violations
  - [ ] Keyboard navigation fully functional
  - [ ] Screen reader: all critical content announced
  - [ ] Contrast check: ≥ 4.5:1 everywhere
  - [ ] Alt text complete
- **Definition of Done:**
  - [ ] axe report screenshot
  - [ ] Screen reader test notes
  - [ ] Contrast check documented

#### Task 2.3: Error Handling & Edge Cases (Story 5.1)
- **Owner:** Backend Lead + Frontend Lead
- **Story Points:** 3
- **Description:**
  - Test error scenarios:
    - Login: invalid creds → 401 error displayed
    - Catalogue fetch: timeout (5s) → message "Impossible de charger..."
    - Network offline: graceful degradation
    - Thumbs 404: fallback to source image
  - Verify error messages are user-friendly (non-technical)
  - No console.error in production
  - Implement retry logic if needed
- **Acceptance Criteria:**
  - [ ] Login errors handled + displayed
  - [ ] Catalogue timeout message shown
  - [ ] Network offline handled
  - [ ] Thumbs 404 fallback works
  - [ ] No console.error in production
- **Definition of Done:**
  - [ ] Error test scenarios documented
  - [ ] Screenshots of error messages
  - [ ] Verified in prod build

#### Task 2.4: Deployment Preparation (Meta)
- **Owner:** DevOps / Release Manager
- **Story Points:** 5
- **Description:**
  - Environment prep:
    - [ ] .env.production configured (DB credentials via secrets, not committed)
    - [ ] VITE_API_BASE = https://extensia-france.com/api
    - [ ] VITE_IMG_BASE = https://extensia-france.com/imgs
    - [ ] VITE_THUMB_URL = https://extensia-france.com/imgs/thumbs.php
  - Backend deployment:
    - [ ] Sync backend/*.php to Ionos hosting
    - [ ] db.php credentials via environment vars (PHP_VARS)
    - [ ] Test all endpoints: POST login, POST log, GET catalogue, GET thumbs
  - Frontend deployment:
    - [ ] npm run build → dist/
    - [ ] Sync dist/ to CDN or web root
    - [ ] Test: https://extensia-france.com app loads
  - Post-deployment:
    - [ ] Run Lighthouse again on production URL
    - [ ] Manual smoke test (login → browse → logout)
    - [ ] Monitor error logs (server + browser console)
- **Acceptance Criteria:**
  - [ ] .env.production secured (not in git)
  - [ ] Backend endpoints all responding
  - [ ] Frontend loads on production domain
  - [ ] Lighthouse passes on production
  - [ ] Error logs monitored
- **Definition of Done:**
  - [ ] Deployment checklist ticked
  - [ ] Smoke test passed
  - [ ] Logs clean

---

## 📋 Daily Standup Template

**Every day (15 min sync):**
1. What I did yesterday
2. What I'm doing today
3. Blockers / help needed

**Example:**
```
📌 Frontend Lead:
  ✓ Yesterday: Implemented Lighthouse optimizations (lazy loading validation)
  🔧 Today: Running full a11y axe scan
  ⚠️  Blocker: Need backend types CSV format confirmed

📌 Backend Dev:
  ✓ Yesterday: Updated thumbs.php with ETag caching
  🔧 Today: Test thumbs with curl, finalize fallback
  ⚠️  None

📌 QA Lead:
  ✓ Yesterday: Error handling test scenarios defined
  🔧 Today: Execute responsive tests (375, 768, 1920)
  ⚠️  Need real mobile device for iOS testing
```

---

## 🎯 Sprint Goals Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Lighthouse Performance | ≥ 80 | 🟡 TBD | In Progress |
| A11y Violations (axe) | 0 | 🟡 TBD | In Progress |
| Mobile Responsive Test | 100% | 🟡 TBD | Planned |
| Backend Endpoints Tested | 4/4 | 🟡 0/4 | Not Started |
| Deployment Readiness | 100% | 🟡 70% | In Progress |

---

## 📅 Sprint Timeline

- **Day 1-2 (Mon-Tue):** Kickoff, Task 1.1 + 1.2 start
- **Day 3-4 (Wed-Thu):** Task 1.2 + 1.3 progress, daily standups
- **Day 5 (Fri):** Sprint 1 wrap, Sprint 2 kickoff
- **Day 6-7 (Mon-Tue):** Task 2.1 + 2.2 start
- **Day 8-9 (Wed-Thu):** Task 2.2 + 2.3 progress
- **Day 10 (Fri):** Task 2.4 deployment prep, sprint review
- **Retro + Demo:** End of sprint

---

## 🔧 Technical Stack Sprint 2

| Component | Stack | Status |
|-----------|-------|--------|
| Frontend | React 19, Vite 6, TypeScript 5.8, Tailwind CSS | ✅ Ready |
| Backend | PHP 8.3, mysqli, PDO fallback | ✅ Ready |
| Database | MySQL 5.7+ (Ionos) | 🟡 Pending Creds |
| Performance Tools | Lighthouse, axe DevTools | ✅ Ready |
| Mobile Testing | Browser DevTools + real devices | 🟡 Planned |
| Deployment | Git, FTP/SSH to Ionos | 🟡 Setup Needed |

---

## 📢 Sprint Constraints & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Ionos deployment access issues | High | Pre-test FTP/SSH credentials early |
| Real database not ready | Medium | Continue with dummy data, migrate later |
| Performance bottlenecks (images) | Medium | Pre-cache images, implement CDN if needed |
| A11y issues found late | Low | Test early (Day 3) with axe |
| Mobile testing limited (devices) | Low | Use browser DevTools, plan for real device access |

---

## ✅ Sprint Success Criteria

- [ ] All User Stories in Sprint 2 backlog completed
- [ ] Lighthouse Performance ≥ 80, A11y ≥ 95
- [ ] A11y violations (axe) = 0
- [ ] Responsive tests pass (375, 768, 1920)
- [ ] All backend endpoints tested + working
- [ ] Deployment checklist 100% complete
- [ ] Production smoke test passed
- [ ] Zero critical bugs in production
- [ ] Team satisfied (retro feedback positive)
- [ ] Ready for public launch or Sprint 3

---

## 📝 Notes

- **Phase 3 (Sprint 3)** planned for Q2 2026:
  - Pagination / virtualisation si catalogue > 10k produits
  - Service worker / offline mode
  - Advanced filtering (size, material, etc.)
  - Analytics integration
  - Admin panel for product management

- **Feedback loop:** Sprint 2 outputs inform Phase 3 priority
