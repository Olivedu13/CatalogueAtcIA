# 🚀 Sprint 3 — Planning & Roadmap

**Project:** CatalogueATC — Advanced Features  
**Duration:** 2-3 weeks (estimated)  
**Status:** Planning Phase  
**Date:** 2026-01-23

---

## 📊 Sprint 3 Overview

**Goal:** Transform MVP into production-grade application with real database, admin capabilities, and optimized media delivery.

### Story Points Breakdown
- **Task 3.1:** MySQL Integration & Real Data (8 pts)
- **Task 3.2:** Admin Panel - Product Management (13 pts)
- **Task 3.3:** Image Optimization & CDN (8 pts)
- **Task 3.4:** Authentication Enhancement (5 pts)
- **Task 3.5:** Advanced Analytics & Monitoring (3 pts)

**Total: 37 story points**

---

## 📋 Detailed Tasks

### ✅ TASK 3.1: MySQL Integration & Real Data (8 pts)

**Objective:** Replace dummy data with real MySQL database

#### Deliverables
1. **Database Schema**
   - `users` table (authentication)
   - `products` table (catalog items)
   - `variations` table (product variants)
   - `product_types` table (classifications)
   - `product_shapes` table (stone categories)

2. **Migration Script**
   - Convert dummy data to SQL inserts
   - Backup procedure (automated)
   - Rollback capability

3. **Connection Pool**
   - Implement persistent connections
   - Connection pooling (reduce overhead)
   - Error handling for DB disconnections

#### Acceptance Criteria
- [ ] All 6 dummy products loaded from database
- [ ] User authentication reads from `users` table
- [ ] Product filters query real data
- [ ] API response time < 200ms
- [ ] Database backup runs daily (automated)

#### Files to Create/Modify
```
backend/
  ├── db-config.php (new) — DB connection settings
  ├── db-init.sql (new) — Schema + dummy data
  ├── db-backup.sh (new) — Automated backup script
  ├── login.php (modify) — Use DB instead of dummy
  ├── imageCatalogue.php (modify) — Query DB for products
  └── thumbs.php (modify) — Pull images from DB metadata
```

#### Implementation Steps
1. Create database schema (4 tables)
2. Write migration script (PHP)
3. Implement connection pooling
4. Update API endpoints (login, catalog, thumbs)
5. Test with real data
6. Set up automated backups

**Estimated Time:** 3-4 days

---

### ✅ TASK 3.2: Admin Panel - Product Management (13 pts)

**Objective:** Build admin UI for creating/editing/deleting products

#### Deliverables
1. **Admin Dashboard**
   - Product list with pagination
   - Quick stats (total products, active users, revenue)
   - Search & filter for products

2. **Product CRUD Interface**
   - Create new product form
   - Edit existing product
   - Delete product (with confirmation)
   - Bulk upload CSV

3. **Variation Manager**
   - Add/edit/delete product variants
   - Price management
   - Image upload per variant

4. **User Management**
   - List all users
   - Create new user account
   - Assign roles (admin/viewer/restricted)
   - Reset passwords

5. **Image Manager**
   - Upload product images
   - Crop/resize thumbnails
   - Set featured image
   - Bulk upload ZIP

#### Acceptance Criteria
- [ ] Admin login works (role-based)
- [ ] Can create product with all fields
- [ ] Can edit product and see changes immediately
- [ ] Can delete product with confirmation dialog
- [ ] CSV bulk upload works (50+ products in < 5s)
- [ ] All images display correctly
- [ ] Mobile-responsive (tablet admin view works)
- [ ] Performance: Admin page load < 2s

#### Architecture
```
frontend/
  ├── pages/
  │   ├── AdminDashboard.tsx (new)
  │   └── AdminProducts.tsx (new)
  ├── components/
  │   ├── AdminHeader.tsx (new)
  │   ├── ProductForm.tsx (new)
  │   ├── VariationEditor.tsx (new)
  │   ├── ImageUploader.tsx (new)
  │   └── BulkUpload.tsx (new)
  └── services/
      └── adminService.ts (new) — API calls for admin

backend/
  ├── admin/
  │   ├── products-api.php (new)
  │   ├── variations-api.php (new)
  │   ├── users-api.php (new)
  │   ├── upload.php (new) — Image upload handler
  │   └── bulk-import.php (new) — CSV import handler
  └── middleware/
      └── admin-auth.php (new) — Admin role check
```

#### Implementation Steps
1. Create admin layout & navigation
2. Build product CRUD forms
3. Implement API endpoints (PHP)
4. Add image upload handler
5. Build bulk import CSV parser
6. Test all CRUD operations
7. Mobile responsiveness testing

**Estimated Time:** 5-6 days

---

### ✅ TASK 3.3: Image Optimization & CDN (8 pts)

**Objective:** Optimize images and implement CDN for fast delivery

#### Deliverables
1. **Image Processing**
   - Automatic thumbnail generation (GD library)
   - WebP format support
   - Responsive image sizes (mobile/tablet/desktop)
   - Lazy loading implementation

2. **CDN Integration**
   - Cloudflare or AWS S3 integration
   - Automatic cache headers
   - Image compression
   - Edge location serving

3. **Performance Optimization**
   - Implement caching headers (max-age)
   - Gzip compression for assets
   - Minify CSS/JS (already done, verify)
   - Service Worker for offline support

#### Acceptance Criteria
- [ ] Thumbnail generation < 500ms per image
- [ ] WebP format served to modern browsers
- [ ] Images cached for 30 days (header: max-age=2592000)
- [ ] Mobile image load time < 1s (10 images)
- [ ] Lighthouse performance score ≥ 95
- [ ] Offline page load works (Service Worker)

#### Files to Create/Modify
```
backend/
  ├── image-processor.php (new) — Thumbnail generation
  ├── cdn-config.php (new) — Cloudflare/S3 config
  ├── thumbs.php (modify) — Add WebP support
  └── cache-headers.php (new) — Cache control logic

frontend/
  ├── utils/
  │   ├── imageOptimizer.ts (new) — srcset generation
  │   └── lazyLoad.ts (new) — Intersection observer
  ├── service-worker.ts (new) — Offline support
  └── public/
      └── manifest.json (modify) — PWA support
```

#### Implementation Steps
1. Set up GD library for image processing
2. Create thumbnail generation endpoint
3. Add WebP format support
4. Integrate Cloudflare CDN
5. Implement lazy loading (frontend)
6. Add Service Worker
7. Test performance metrics

**Estimated Time:** 3-4 days

---

### ✅ TASK 3.4: Authentication Enhancement (5 pts)

**Objective:** Improve security and user experience

#### Deliverables
1. **Security Enhancements**
   - Password hashing (bcrypt instead of MD5)
   - JWT tokens with expiry
   - CSRF protection
   - Rate limiting (login attempts)

2. **User Experience**
   - "Forgot Password" flow
   - Email verification for new accounts
   - Password change capability
   - Session timeout warning

3. **Admin Restrictions**
   - Role-based access control (RBAC)
   - IP whitelist option (admin access)
   - Activity logging (login history)

#### Acceptance Criteria
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens expire after 7 days
- [ ] Failed login attempts limited to 5/minute
- [ ] "Forgot Password" sends reset link
- [ ] Admin can only access admin pages
- [ ] Session expires gracefully (logout warning)

**Estimated Time:** 2-3 days

---

### ✅ TASK 3.5: Advanced Analytics & Monitoring (3 pts)

**Objective:** Track usage and monitor system health

#### Deliverables
1. **Analytics**
   - Product view tracking
   - Search analytics
   - Download tracking (PDF exports)
   - User engagement metrics

2. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Daily health checks
   - Automated alerts

#### Acceptance Criteria
- [ ] Analytics dashboard shows top products
- [ ] Errors logged to external service (Sentry)
- [ ] Performance metrics available
- [ ] Slack alerts on critical errors

**Estimated Time:** 1-2 days

---

## 🔧 Technology Stack (Sprint 3)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Database** | MySQL 8.0 | Persistent data storage |
| **Image Processing** | GD Library (PHP) | Thumbnail generation |
| **CDN** | Cloudflare / AWS S3 | Image delivery |
| **Auth** | bcrypt + JWT | Secure authentication |
| **Monitoring** | Sentry | Error tracking |
| **Analytics** | Custom analytics | Usage tracking |

---

## 📈 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Admin Panel Load Time** | < 2s | N/A (new) |
| **Image Load Time (10 imgs)** | < 1s | ~1.5s (needs optimization) |
| **Lighthouse Score** | ≥ 95 | 95 (maintain) |
| **Security Score** | A+ | A (add HTTPS/headers) |
| **Database Query Time** | < 100ms | N/A (new) |
| **Password Security** | bcrypt | Currently MD5 ❌ |

---

## 🚀 Release Plan

### Phase 1: Database & Core APIs (Days 1-4)
- [ ] MySQL setup & migration
- [ ] Database optimization & indexing
- [ ] API testing

### Phase 2: Admin Panel (Days 5-10)
- [ ] Dashboard UI
- [ ] Product CRUD forms
- [ ] Image upload handler
- [ ] CSV bulk import

### Phase 3: Image & Performance (Days 11-14)
- [ ] Image optimization
- [ ] CDN integration
- [ ] Lazy loading
- [ ] Performance testing

### Phase 4: Security & Monitoring (Days 15-18)
- [ ] Authentication upgrade (bcrypt)
- [ ] RBAC implementation
- [ ] Error monitoring (Sentry)
- [ ] Analytics setup

### Phase 5: Testing & QA (Days 19-21)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation

---

## 📚 Dependencies & Prerequisites

### Before Starting Sprint 3
- [ ] MySQL 8.0 installed on Ionos or local dev
- [ ] Cloudflare account (free tier available)
- [ ] Sentry account (free tier available)
- [ ] GD library enabled on PHP (verify with hosting)
- [ ] Access to admin @ Ionos control panel

### Compatibility Check
```bash
# Verify on Ionos/local:
php -m | grep gd        # Image processing
php -m | grep mysql     # Database support
php -m | grep curl      # External APIs
```

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **DB migration breaks** | Medium | High | Test locally first, backup plan |
| **Admin panel security gap** | Low | Critical | Security audit before launch |
| **Image CDN slowness** | Low | Medium | Fallback to local images |
| **Bcrypt compatibility** | Low | Medium | Test on all browsers |
| **DB size grows** | Medium | Low | Implement archiving strategy |

---

## 📖 Documentation Plan

- [ ] Database schema diagram (ERD)
- [ ] Admin panel user guide
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Image processing guide
- [ ] Security best practices
- [ ] Deployment guide (with DB migration)
- [ ] Troubleshooting guide

---

## 💰 Effort Estimation Summary

| Task | Story Points | Days | Team |
|------|-------------|------|------|
| 3.1: MySQL Integration | 8 | 3-4 | Backend |
| 3.2: Admin Panel | 13 | 5-6 | Full-stack |
| 3.3: Image Optimization | 8 | 3-4 | Backend + Frontend |
| 3.4: Authentication | 5 | 2-3 | Backend |
| 3.5: Analytics | 3 | 1-2 | Backend |
| **Total** | **37** | **14-20 days** | **1-2 people** |

---

## ✅ Definition of Done (Sprint 3)

Each task is done when:
- [ ] Code written & reviewed
- [ ] Unit tests passing (> 80% coverage)
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Deployed to staging
- [ ] Acceptance criteria verified

---

## 🎯 Next Steps

**To start Sprint 3:**

1. **Review this plan** with team
2. **Set up MySQL database** (local dev)
3. **Create GitHub issues** for each task
4. **Assign tasks** to team members
5. **Start Task 3.1** — Database integration

**Or, if you prefer:**
- Continue with **OPTION 1 (Deploy now)** and add Sprint 3 features incrementally

---

**Questions or adjustments needed? Let me know!** ✨
