# Sprint 1 — Test & QA Checklist

## Validation Functionnelle (Manual Testing)

### Auth Flow (Story 1.1-1.2)
- [ ] **Login Success**: Entrer user/pwd valides → dashboard charge
- [ ] **Login Failure**: Password incorrect → message d'erreur rouge
- [ ] **Token Persistence**: Reload page après login → reste connecté
- [ ] **Logout**: Click logout → retour login screen vierge
- [ ] **Network Error**: Arrêter API → message d'erreur login clair

### Catalogue (Story 2.1-2.3)
- [ ] **Catalogue Load**: Post-login → produits affichés en grid
- [ ] **Image Normalization**: Thumbs.php utilisés (ou fallback IMG_BASE)
- [ ] **Lazy Loading**: Scroll → images chargent progressivement
- [ ] **Product Count**: Compteur résultats correct
- [ ] **Grouping by Ref**: Multiiples variantes = 1 card

### Filtres (Story 3.1-3.5)
- [ ] **Ref Search**: "BAG001" → affiche que produits matching
- [ ] **Category Filter**: Sélectionner catégorie → résultats réduits
- [ ] **Line Filter**: Sélectionner ligne → résultats réduits
- [ ] **Shape Filter**: Sélectionner forme(s) → résultats réduits (multi-select)
- [ ] **Type Filter**: Sélectionner type(s) → résultats réduits (multi-select)
- [ ] **Price Range**: Min/Max inputs → résultats réduits
- [ ] **Combined Filters**: 2+ filtres → ET logique appliquée
- [ ] **Reset**: Click "Réinitialiser" → tous filtres vierges
- [ ] **Compteur Dynamique**: Compteur "N résultats" mis à jour correctement
- [ ] **Empty State**: 0 résultats → message + reset button

### Fiche Produit (Story 4.1-4.3)
- [ ] **Modal Open**: Click card → modal overlay
- [ ] **Modal Close**: Click X ou backdrop → modal ferme
- [ ] **Image Zoom**: Hover/click image → zoom 2.5x, transform-origin correct
- [ ] **Thumb Selection**: Click vignette → image change, border doré
- [ ] **Table Row Click**: Click ligne → image change
- [ ] **Responsive**: Desktop 2 cols, mobile 1 stack

### Impression (Story 4.4)
- [ ] **Print Button**: Click "Imprimer" → browser print dialog
- [ ] **Print Preview**: Preview A4 portrait, pas de débordement
- [ ] **Header Print**: Logo + ref + date visibles
- [ ] **Table Print**: Tableau compact, lisible, pas de scroll
- [ ] **No Blur**: Pas de backdrop-blur en preview
- [ ] **Multi-Page**: Si >10 variantes → pagination auto (page break)
- [ ] **Colors Preserved**: Headings/backgrounds imprimés (print-color-adjust: exact)

---

## Accessibility (A11y) — WCAG AA

### Screen Reader & Keyboard Nav
- [ ] **Form Labels**: `aria-label` sur login inputs → annoncé (VoiceOver/NVDA)
- [ ] **Compteur Résultats**: `aria-live="polite"` → annoncé lors filtrage
- [ ] **Keyboard Tab**: Navigable au clavier (Shift+Tab/Tab)
- [ ] **Focus Visible**: Outline clair sur focus (bleu ou or)
- [ ] **Button Roles**: Tous boutons <button>, pas <div> génériques
- [ ] **Image Alt**: Toutes images ont alt text (ref produit)

### Color & Contrast
- [ ] **Text Contrast**: Gold #c18b52 sur blanc → ratio ≥ 4.5:1
- [ ] **Button State**: Hover/active visibles (couleur changement min 3:1)
- [ ] **Error Messages**: Texte rouge + icône/symbole (pas couleur seule)

### Forms & Inputs
- [ ] **Placeholder ≠ Label**: Tous inputs ont labels ou aria-label
- [ ] **Error Messaging**: Erreurs liées aux inputs via aria-describedby ou aria-invalid
- [ ] **Input Types**: type="number" pour prix (inputMode="numeric")

### Tools & Tests
```bash
# Installer axe DevTools (extension Chrome/Firefox) → run scan
# Expected: 0 violations (Automatic Checks)

# Manual Checks (non-automatisées):
# 1. Open Chrome/Firefox DevTools → F12
# 2. Onglet "Accessibility" ou install axe DevTools extension
# 3. Scan page → 0 violations
# 4. Test keyboard: Tab/Shift+Tab → tous interactifs accessibles
# 5. Test screen reader (VoiceOver macOS: Cmd+F5, or NVDA Windows)
```

---

## Performance (Lighthouse)

### Target Metrics
- [ ] **LCP (Largest Contentful Paint)**: < 2.5 s
- [ ] **CLS (Cumulative Layout Shift)**: < 0.1
- [ ] **FID (First Input Delay)**: < 100 ms
- [ ] **TTI (Time To Interactive)**: < 3.8 s
- [ ] **Lighthouse Score**: ≥ 80 (Performance)

### Run Audit
```bash
# Chrome DevTools → Lighthouse tab → Generate report
# or use: npm install -g lighthouse && lighthouse https://url --view
```

### Bundle Size
- [ ] **JS Bundle**: < 250 kB gz ✅ (68 kB)
- [ ] **CSS Bundle**: < 50 kB gz ✅ (0.89 kB + Tailwind CDN)
- [ ] **Images**: Thumbs < 100 kB per image

---

## Responsive Design

### Mobile (375px)
- [ ] **Viewport**: No horizontal scroll
- [ ] **FilterBar**: Drawer latéral, pas écrasé
- [ ] **Cards**: 1 col layout
- [ ] **Modal**: Full-width, scrollable
- [ ] **Buttons**: ≥ 44x44 px touch targets

### Tablet (768px)
- [ ] **Cards**: 2 cols layout
- [ ] **Modal**: 50/50 split (image left, content right)
- [ ] **FilterBar**: Drawer ou inline
- [ ] **Text**: Lisible, pas tiny

### Desktop (1920px)
- [ ] **Cards**: 3-4 cols layout
- [ ] **Modal**: Comfortably 50/50
- [ ] **FilterBar**: Drawer ou sidebar
- [ ] **Header**: Logo + text + logout OK

---

## Browser Compatibility

- [ ] **Chrome (Latest)**: Full support
- [ ] **Firefox (Latest)**: Full support
- [ ] **Safari (Latest)**: Full support, iOS Safari
- [ ] **Edge (Latest)**: Full support

### Known Issues
- Print layout: print-color-adjust may not work on old browsers (graceful fallback OK)
- Flexbox: All modern browsers supported

---

## Error Scenarios

### API Failures
- [ ] **Login API Down**: Fallback mock, message clair
- [ ] **Catalogue API Timeout**: Loading spinner → error message
- [ ] **Images Missing**: Img alt text shows, placeholder or broken image icon
- [ ] **Token Expired**: Auto-logout, re-login prompt

### Edge Cases
- [ ] **0 Products**: Empty state message + reset button
- [ ] **1 Product**: Single card displays correctly
- [ ] **100+ Products**: Grid loads without lag, no pagination needed (Sprint 3)
- [ ] **Very Long Names**: Text truncate or wrap gracefully
- [ ] **Missing Fields**: resolvedShape/Type fallback IDs, no crash

---

## Console & Logs

- [ ] **No errors**: Console clear (F12)
- [ ] **No warnings**: ESLint-compliant, no unused vars
- [ ] **No deprecations**: React 19 API fully compatible

---

## Sprint 1 QA Sign-Off

| Area | Status | Notes |
|------|--------|-------|
| Auth Flow | 🟡 Pending | Test login/logout |
| Catalogue | 🟡 Pending | Test load + images |
| Filters | 🟡 Pending | Test all 5 filter types |
| Product Detail | 🟡 Pending | Test zoom + table |
| Print | 🟡 Pending | Test A4 layout |
| A11y (WCAG AA) | 🟡 Pending | Axe scan + keyboard nav |
| Performance | 🟡 Pending | Lighthouse ≥ 80 |
| Responsive | 🟡 Pending | 375/768/1920 px |
| Errors | 🟡 Pending | Network failure scenarios |

---

## Test Execution Log

**Date:** 2026-01-22  
**Tester:** [Name]  
**Environment:** Codespaces / Prod

### Passed Tests
- [ ] [Test Name] — ✅ PASS / 🟡 FAIL / 🔴 BLOCKER

### Bugs Found
| ID | Title | Severity | Status |
|----|-------|----------|--------|
| BUG-001 | [Issue] | P1/P2/P3 | Open/Fixed/Closed |

### Recommendation
- [ ] **GO**: All critical tests passed, ready for sprint close
- [ ] **CONDITIONAL GO**: Minor bugs, acceptable for current release
- [ ] **NO GO**: Critical blockers, needs fixes before release

---

## Sign-Off

- **QA Lead**: _____________________ Date: _______
- **Dev Lead**: _____________________ Date: _______
- **Product**: _____________________ Date: _______
