# Deployment Guide — Catalogue Joaillerie Extensia

**Version:** 1.0  
**Last Updated:** 2026-01-22  
**Status:** Draft (Sprint 2 Task 2.4)  
**Target:** Ionos Hosting (extensia-france.com)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Post-Deployment Validation](#post-deployment-validation)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring & Support](#monitoring--support)

---

## Pre-Deployment Checklist

**Requirements:**
- [ ] Ionos FTP/SSH access credentials obtained
- [ ] Database credentials confirmed (DB_HOST, DB_USER, DB_PASS, DB_NAME)
- [ ] SSL certificate active on extensia-france.com
- [ ] Domain DNS records pointing to Ionos IP
- [ ] Team members assigned (Backend Dev, Frontend Dev, DevOps, QA)
- [ ] All Sprint 2 tasks completed + merged to main branch
- [ ] Production build tested locally: `npm run build`
- [ ] Environment variables configured (.env.production)
- [ ] Rollback plan documented (current version snapshot)

**Credentials & Access:**

```
Ionos Hosting:
├─ FTP Host: ftp.extensia-france.com
├─ FTP User: [CREDENTIALS_VAULT]
├─ SSH Host: extensia-france.com
├─ SSH User: [CREDENTIALS_VAULT]
│
Database:
├─ Host: db764389948.hosting-data.io
├─ Port: 3306
├─ User: dbo764389948
├─ Pass: [CREDENTIALS_VAULT]
├─ Database: db764389948
│
Domain:
├─ Domain: extensia-france.com
├─ SSL: ✅ Active (Let's Encrypt or Ionos SSL)
├─ DNS: ✅ Configured
```

**Store credentials securely:**
- Use password manager (LastPass, 1Password, etc.)
- Do NOT commit to git
- Do NOT share in chat/email
- Rotate post-deployment (best practice)

---

## Environment Setup

### 1. Backend Environment Variables

**On Ionos Hosting (via FTP or SSH):**

Create `backend/.env` or configure PHP environment:

```bash
# Option A: .env file (if .htaccess allows reading)
DB_HOST=db764389948.hosting-data.io
DB_USER=dbo764389948
DB_PASS=YOUR_ACTUAL_PASSWORD
DB_NAME=db764389948
DB_PORT=3306
```

**Or Option B: PHP Environment Variables (safer)**

Ask Ionos support to set in:
- `php.ini` OR
- Ionos control panel → Environment variables

```
export DB_HOST=db764389948.hosting-data.io
export DB_USER=dbo764389948
export DB_PASS=YOUR_ACTUAL_PASSWORD
export DB_NAME=db764389948
export DB_PORT=3306
```

### 2. Frontend Environment Variables

**In project root (`.env.production`):**

```bash
# These are embedded in the build, so ONLY public values
VITE_API_BASE=https://catalogue.sarlatc.com/backend
VITE_IMG_BASE=https://catalogue.sarlatc.com/imgs
VITE_THUMB_URL=https://catalogue.sarlatc.com/backend/thumbs.php
GEMINI_API_KEY=PLACEHOLDER_API_KEY  # Optional, for future
```

**Important:** Never commit `.env.production` with real credentials. Use a secrets manager or GitHub Actions secrets if using CI/CD.

### 3. Ionos Server Configuration

**Verify PHP version:**
```bash
ssh [user]@extensia-france.com
php -v  # Should be PHP 8.0+
```

**Verify MySQL/PDO availability:**
```bash
php -m | grep -i mysqli  # or pdo_mysql
```

**Create necessary directories:**
```bash
mkdir -p /var/www/extensia-france.com/api
mkdir -p /var/www/extensia-france.com/imgs/cache  # For thumbs cache
mkdir -p /var/www/extensia-france.com/dist        # For frontend build
chmod 755 /var/www/extensia-france.com/imgs/cache
```

---

## Backend Deployment

### Step 1: Upload Backend Files

**Via FTP:**
```bash
ftp ftp.extensia-france.com
cd /www/api/
put backend/db.php
put backend/login.php
put backend/imageCatalogue.php
put backend/thumbs.php
put backend/README.md
```

**Or via SCP:**
```bash
scp backend/*.php [user]@extensia-france.com:/var/www/extensia-france.com/api/
```

### Step 2: Test Backend Endpoints

**Test login endpoint:**
```bash
curl -X POST https://catalogue.sarlatc.com/backend/login.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"admin123"}'

# Expected response:
# [{"id":1,"username":"admin","Nom_agence":"Extensia France","logo":"..."}]
```

**Test catalogue endpoint:**
```bash
curl -X GET https://catalogue.sarlatc.com/backend/imageCatalogue.php \
  -H "Authorization: Bearer token123"

# Expected response: Array of 5+ products with ref, label, prix, etc.
```

**Test thumbs endpoint:**
```bash
curl -I https://catalogue.sarlatc.com/backend/thumbs.php?image=ring-diamond.jpg&size=700

# Expected response: 200 OK + ETag header
# Or 304 Not Modified if ETag matches
```

**Test error handling:**
```bash
curl -X POST https://catalogue.sarlatc.com/backend/login.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"user":"invalid","password":"wrong"}'

# Expected response: 401 error
```

### Step 3: Database Connection Test

**Via SSH:**
```bash
ssh [user]@extensia-france.com
cd /var/www/extensia-france.com/api/
php -r "require 'db.php'; echo 'DB connected!'"

# Expected output: "DB connected!" (no errors)
```

**If error:** Check db.php configuration and Ionos MySQL credentials.

---

## Frontend Deployment

### Step 1: Build for Production

**Locally:**
```bash
npm run build
# Output: dist/ directory with compiled static files
```

**Verify build:**
```bash
ls -la dist/
# Should contain:
# - index.html (1.7 kB)
# - assets/index-*.js (222 kB)
# - assets/index-*.css (2.4 kB)
```

### Step 2: Upload Frontend Files

**Via FTP:**
```bash
ftp ftp.extensia-france.com
cd /www/
put -r dist/* .
# This uploads index.html + assets/ to web root
```

**Or via SCP:**
```bash
scp -r dist/* [user]@extensia-france.com:/var/www/extensia-france.com/
```

### Step 3: Verify Frontend

**Test in browser:**
```
https://catalogue.sarlatc.com
```

**Expected behavior:**
1. Page loads (white page briefly, then app)
2. Login form appears
3. Enter admin/admin123
4. Click Login
5. Catalogue loads with products
6. Filters work
7. Click product → modal opens with zoom
8. Logout works → returns to login form

### Step 4: Configure Web Server (if needed)

**For Vite SPA routing, create `.htaccess` in web root:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Don't rewrite if it's a real file or directory
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html (SPA routing)
  RewriteRule ^ index.html [QSA,L]
</IfModule>
```

---

## Post-Deployment Validation

### 1. Smoke Test (Manual)

**Checklist:**
- [ ] App loads at https://catalogue.sarlatc.com
- [ ] Login form visible
- [ ] Login succeeds with admin/admin123
- [ ] Catalogue displays (5+ products visible)
- [ ] Filters work (ref search, categories, etc.)
- [ ] Product modal opens on click
- [ ] Zoom works in modal
- [ ] Logout button works
- [ ] Print page works (Ctrl+P)
- [ ] Mobile view responsive (test on phone or DevTools)
- [ ] No console errors (F12 → Console tab)

### 2. Lighthouse Audit (Production)

**Run Lighthouse on production URL:**
```bash
# Chrome DevTools:
1. Open https://catalogue.sarlatc.com
2. F12 → Lighthouse tab
3. Click "Analyze page load"
4. Target: Performance ≥ 80, A11y ≥ 95
```

**Expected metrics:**
- Performance: ≥ 80 (target LCP < 2.5s, CLS < 0.1)
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 90

### 3. A11y Scan (axe DevTools)

**Run axe scan on production:**
```bash
# Chrome DevTools:
1. Open https://catalogue.sarlatc.com
2. F12 → axe DevTools tab (if installed)
3. Click "Scan ALL of my page"
4. Target: 0 violations
```

### 4. Responsive Testing

**Test on multiple breakpoints:**
- [ ] 375px (mobile): Single column, no pinch-zoom needed
- [ ] 768px (tablet): Two-column layout
- [ ] 1920px (desktop): Three-column layout

**Use Chrome DevTools or real devices.**

### 5. Error Logging

**Monitor server logs:**
```bash
ssh [user]@extensia-france.com
tail -f /var/log/php-errors.log  # PHP errors
tail -f /var/www/extensia-france.com/logs/access.log  # HTTP requests
```

**Monitor browser console errors (production):**
- Open DevTools on live site
- Check Console tab for any errors/warnings
- Target: 0 errors

### 6. Endpoint Testing (curl)

**Run endpoint tests documented in backend/README.md:**

```bash
# Login test
curl -X POST https://catalogue.sarlatc.com/backend/login.php?action=login \
  -d '{"user":"admin","password":"admin123"}' \
  -H "Content-Type: application/json"

# Catalogue test
curl https://catalogue.sarlatc.com/backend/imageCatalogue.php \
  -H "Authorization: Bearer token123"

# Thumbs test
curl -I https://catalogue.sarlatc.com/backend/thumbs.php?image=ring-diamond.jpg&size=700
```

---

## Rollback Procedure

**If production deployment fails:**

### Quick Rollback (< 5 min)

```bash
# Via FTP or SCP, restore from backup:
ftp ftp.extensia-france.com
cd /www/
# Delete new files
rm -r assets/
rm index.html
# Upload old version or use .backup folder
put backup/index.html
put -r backup/assets/* assets/
```

### Full Rollback (with database)

```bash
# Backup current state first
mysqldump -h db764389948.hosting-data.io -u dbo764389948 -p db764389948 > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore previous backup
mysql -h db764389948.hosting-data.io -u dbo764389948 -p db764389948 < backup-2026-01-20-120000.sql

# Restore old frontend/backend
scp -r old-version/* [user]@extensia-france.com:/var/www/extensia-france.com/
```

### Notify Team
- Post in Slack/Teams
- Document issue in postmortem
- Schedule debrief meeting

---

## Monitoring & Support

### Ongoing Monitoring

**Daily checks (first week post-deploy):**
- [ ] https://catalogue.sarlatc.com loads successfully
- [ ] Login works
- [ ] No 500 errors in logs
- [ ] No performance degradation

**Weekly checks (ongoing):**
- [ ] Run Lighthouse audit (maintain ≥ 80 Performance)
- [ ] Check error logs (resolve any warnings)
- [ ] User feedback (monitor for issues)

### Performance Metrics Dashboard

**Create a dashboard tracking:**
- Page load time (Google Analytics or equivalent)
- Lighthouse scores (monthly)
- API response times
- Error rate (target: < 0.1%)
- Uptime (target: 99.9%)

### Support & Escalation

| Issue | Severity | Escalation |
|-------|----------|-----------|
| App not loading | P0 (Critical) | Immediately notify team lead + DevOps |
| Login failing | P0 (Critical) | Check API logs, database connection |
| Slow load times | P1 (High) | Run Lighthouse, check CDN cache |
| Console errors | P2 (Medium) | Debug in DevTools, check for JS issues |
| UI bug (specific page) | P2 (Medium) | Reproduce locally, file issue in tracker |

### Contact Information

```
Team Contacts:
├─ Frontend Lead: [contact]
├─ Backend Lead: [contact]
├─ DevOps / Release Manager: [contact]
├─ QA Lead: [contact]

Ionos Support:
├─ Phone: +33 (0)1 72 89 89 89
├─ Chat: https://www.ionos.fr/support
├─ Ticket: support@ionos.fr

On-Call Rotation:
├─ Week 1: [Name]
├─ Week 2: [Name]
```

---

## Deployment Timeline (Sprint 2 Task 2.4)

| Phase | Duration | Owner |
|-------|----------|-------|
| Pre-deployment prep | 1 day | DevOps + Backend Lead |
| Backend deployment | 1 hour | Backend Lead |
| Frontend deployment | 30 min | Frontend Lead |
| Smoke testing | 30 min | QA Lead |
| Lighthouse audit | 30 min | Frontend Lead |
| Go-live | Immediate | DevOps |
| Monitoring (24h) | Ongoing | On-call engineer |

**Total:** ~2 days prep, ~3 hours deployment, 24h monitoring

---

## Appendix A: SSH Commands Cheatsheet

```bash
# Connect via SSH
ssh [user]@extensia-france.com

# Upload file
scp local-file [user]@extensia-france.com:/remote/path/

# Upload directory
scp -r local-dir/* [user]@extensia-france.com:/remote/path/

# Download file
scp [user]@extensia-france.com:/remote/file local-path/

# List directory
ssh [user]@extensia-france.com "ls -la /var/www/"

# View log file
ssh [user]@extensia-france.com "tail -f /var/log/php-errors.log"

# Restart PHP-FPM
ssh [user]@extensia-france.com "systemctl restart php-fpm"

# Check disk space
ssh [user]@extensia-france.com "df -h"

# Check memory usage
ssh [user]@extensia-france.com "free -h"
```

---

## Appendix B: FTP Commands Cheatsheet

```bash
# Connect via FTP
ftp ftp.extensia-france.com

# Upload file
put local-file remote-file

# Upload directory
put -r local-dir/*

# Download file
get remote-file local-path

# List directory
ls -la

# Change directory
cd /www/

# Make directory
mkdir api

# Delete file
delete file

# Delete directory
rmdir dir

# Quit
quit
```

---

## Appendix C: Database Migration (if needed)

**Migrate dummy data to real data:**

```sql
-- Example: Insert real users (replace with actual data)
INSERT INTO users (id, username, Nom_agence, logo) VALUES
(1, 'admin', 'Extensia France', '/imgs/logo-extensia.png'),
(2, 'user', 'Atelier Luxe', '/imgs/logo-atelier.png');

-- Example: Insert real products (replace with actual data)
INSERT INTO produits (ref, label, prix, description, img, gallery) VALUES
('BAG001', 'Bague Diamant', 1500.00, 'Bague élégante...', 'bague-001.jpg', ...);

-- Verify data inserted
SELECT COUNT(*) FROM users;  -- Should return 3+
SELECT COUNT(*) FROM produits;  -- Should return 5+
```

---

## Approval & Sign-Off

- [ ] Backend Lead: Code ready, endpoints tested
- [ ] Frontend Lead: Build successful, Lighthouse ≥ 80
- [ ] QA Lead: Smoke test passed, no critical issues
- [ ] DevOps / Release Manager: Deployment plan confirmed
- [ ] Project Manager: Go-live approved

**Date:** ________________  
**Time:** ________________  
**Deployed by:** ________________

---

**Generated by:** Sprint 2 Task 2.4 (Deployment Preparation)  
**Version:** 1.0  
**Status:** Draft → Ready for Sprint 2 execution
