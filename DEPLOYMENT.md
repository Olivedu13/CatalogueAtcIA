# 🚀 CatalogueATC Deployment Guide

Script de déploiement automatisé pour Ionos Hosting

## ⚡ Quick Start (5 minutes)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit with your credentials
nano .env
# Fill in: IONOS_HOST, IONOS_USER, IONOS_PASS, DOMAIN

# 3. Load environment variables
source .env

# 4. Run deployment
./deployment.sh
```

## 📋 Prerequisites

- **Local Machine:** Linux, macOS, or WSL (Windows Subsystem for Linux)
- **Tools:** `sftp` or `ftp` (usually pre-installed on Unix systems)
- **Node.js:** For building the frontend (`npm run build`)
- **Ionos Account:** With FTP/SFTP access enabled

## 🔑 Getting Ionos Credentials

1. Login to Ionos: https://www.ionos.com/signin
2. Navigate to: **Web Hosting → Manage → [Your Domain]**
3. Find: **FTP Access** or **File Manager** section
4. Note down:
   - **FTP Hostname** (e.g., `ftp123.ionos.eu` or `ftp.yourdomain.com`)
   - **FTP Username** (usually your domain or email)
   - **FTP Password** (or generate new one)

### Alternatively (SSH/SFTP, more secure):

1. Same as above, but look for **SSH Access** (if available in your plan)
2. Use SSH key instead of password:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/ionos_key
   # Add public key to Ionos account
   ```

## 🛠️ Script Features

### ✅ Pre-Deployment
- Validates build (`dist/` folder exists)
- Checks backend files
- Verifies all required files present
- Shows build size

### ✅ Deployment
- Uploads `dist/` (frontend build)
- Uploads `backend/` (PHP files)
- Sets correct file permissions (644 for files, 755 for folders)
- Handles SFTP and FTP protocols
- Creates `.htaccess` for production optimization

### ✅ Post-Deployment
- Verifies endpoints are accessible
- Tests catalog API
- Tests login API
- Provides troubleshooting guidance
- Shows next steps (DNS, SSL, etc.)

## 📝 Configuration Options

### Using .env file (Recommended)

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit file
vim .env

# 3. Set variables:
IONOS_HOST="ftp.yourdomain.com"
IONOS_USER="your_username"
IONOS_PASS="your_password"
DOMAIN="yourdomain.com"
USE_SFTP="true"  # true for SFTP, false for FTP

# 4. Load and deploy
source .env
./deployment.sh
```

### Using Environment Variables (Terminal)

```bash
export IONOS_HOST="ftp.yourdomain.com"
export IONOS_USER="username"
export IONOS_PASS="password"
export DOMAIN="yourdomain.com"
./deployment.sh
```

### Interactive Prompts

If credentials not set, script will prompt:

```bash
./deployment.sh
# Will ask for: hostname, username, password, domain
```

## 🔒 Security Best Practices

### ✅ Do This

1. **Use SSH/SFTP over FTP** (more secure)
   ```bash
   USE_SFTP="true"
   ```

2. **Store credentials in .env** (add to .gitignore)
   ```bash
   echo ".env" >> .gitignore
   cp .env.example .env
   # Edit .env with credentials
   ```

3. **Use strong passwords** (16+ chars, mixed case, numbers, symbols)
   ```bash
   # Example: MyDomain2024!@#$Secure%
   ```

4. **Use SSH keys if available** (no password needed)
   ```bash
   # Generate key
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/ionos_key
   
   # Add to Ionos, then use sftp without password
   ```

### ❌ Don't Do This

- ❌ Commit `.env` file to git (credentials exposed!)
- ❌ Use weak passwords
- ❌ Share .env file via email
- ❌ Upload credentials to public repositories

## 📊 Script Workflow

```
1. Prompt for credentials
   ↓
2. Validate build (npm run build if needed)
   ↓
3. Pre-deployment checks (files, permissions, etc.)
   ↓
4. Check tools (sftp/ftp available)
   ↓
5. Create .htaccess (optimization rules)
   ↓
6. Deploy files (SFTP or FTP)
   ↓
7. Set permissions (chmod 644/755)
   ↓
8. Verify deployment (test endpoints)
   ↓
9. Post-deployment instructions
```

## 🧪 Testing Deployment

After script completes, test your deployment:

### Test 1: Frontend
```bash
curl -I https://yourdomain.com
# Should return HTTP/2 200
```

### Test 2: Catalog API
```bash
curl https://yourdomain.com/backend/imageCatalogue.php
# Should return JSON with products
```

### Test 3: Login API
```bash
curl -X POST https://yourdomain.com/backend/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
# Should return {"success":true,...}
```

### Test 4: Mobile
- Open https://yourdomain.com on phone
- Check 1-column layout at ~375px
- Test filter drawer
- Test product modal

## 🚨 Troubleshooting

### "Connection refused"
```bash
# Check hostname, username, password
# Verify SFTP/FTP is enabled on Ionos account
# Try FTP if SFTP fails: USE_SFTP="false"
```

### "Permission denied"
```bash
# Verify password is correct
# Check if account is locked (try resetting password in Ionos)
# Try SSH key instead of password (more secure)
```

### "CORS error" in browser
```bash
# Update backend CORS headers with your domain
# Edit: backend/login.php, imageCatalogue.php, thumbs.php
# Add: header('Access-Control-Allow-Origin: https://yourdomain.com');
```

### "404 images" / "API not found"
```bash
# Verify backend/ folder uploaded to public_html/backend/
# Check file permissions: chmod 644 *.php
# Test directly: https://yourdomain.com/backend/imageCatalogue.php
```

### "DNS not resolving"
```bash
# Wait 24-48 hours for DNS propagation
# Check DNS settings in Ionos Control Panel
# Verify: A record or nameservers configured
# Test: nslookup yourdomain.com
```

### "Mixed content" warning (HTTPS)
```bash
# SSL certificate not activated yet
# Go to: Ionos Control Panel → SSL Certificates → Activate
# Wait 15-30 minutes
# .htaccess will handle HTTP → HTTPS redirect
```

## 🔄 Updating Deployment

To deploy updates after code changes:

```bash
# 1. Update code locally
# 2. Rebuild
npm run build

# 3. Deploy again
source .env
./deployment.sh

# The script will overwrite old files with new ones
```

## 💾 Backup & Rollback

### Backup Before Deployment
```bash
# Ionos Control Panel → Backups → Create Backup
# Or: SSH into server and download files
```

### Rollback to Previous Version
```bash
# Option 1: Restore from Ionos backup
# Ionos Control Panel → Backups → Restore

# Option 2: Re-run old deployment script
# Keep old version in git: git checkout <old-commit>
# npm run build
# ./deployment.sh
```

## 📚 Additional Resources

- **Full Deployment Guide:** `_bmad-output/planning-artifacts/task-2-4-deployment-prep.md`
- **Architecture Docs:** `_bmad-output/planning-artifacts/architecture.md`
- **Troubleshooting:** `_bmad-output/planning-artifacts/deployment-guide.md`

## 🆘 Support

### If Script Fails

1. Check error messages (they're detailed)
2. Review troubleshooting section above
3. Check credentials in `.env`
4. Verify SFTP/FTP access enabled on Ionos
5. Try running with verbose output:
   ```bash
   bash -x ./deployment.sh 2>&1 | tee deployment.log
   ```

### Common Issues

See [Troubleshooting](#-troubleshooting) section above

## 📝 Script Details

### What the Script Does

1. **Validates Build**
   - Checks `dist/` folder exists
   - Runs `npm run build` if needed
   - Verifies all files present

2. **Connects to Ionos**
   - SFTP (recommended) or FTP
   - Uses credentials from `.env` or prompts

3. **Uploads Files**
   - Frontend: `dist/index.html`, `dist/index.js`, `dist/style.css`
   - Backend: `backend/*.php`
   - .htaccess: Optimization rules

4. **Sets Permissions**
   - Files: 644 (readable by all, writable by owner)
   - Folders: 755 (executable)
   - PHP files: 644

5. **Creates .htaccess**
   - HTTP → HTTPS redirect
   - Gzip compression
   - Browser caching rules
   - Security headers

6. **Verifies Deployment**
   - Tests frontend load time
   - Tests API endpoints
   - Provides feedback

### Environment Variables

```bash
IONOS_HOST      # FTP hostname
IONOS_USER      # FTP username
IONOS_PASS      # FTP password
IONOS_PORT      # FTP port (default: 22 for SFTP)
REMOTE_PATH     # Remote path (default: /public_html)
DOMAIN          # Domain for verification (optional)
USE_SFTP        # "true" for SFTP, "false" for FTP
```

## ✅ Pre-Deployment Checklist

Before running the script:

- [ ] Ionos hosting account created
- [ ] FTP/SFTP access enabled
- [ ] Domain name configured (or at least purchased)
- [ ] SSL certificate ordered (usually free with Ionos)
- [ ] Local build verified: `npm run build`
- [ ] `.env` file created with credentials
- [ ] `.env` added to `.gitignore` (security!)
- [ ] Credentials tested (optional: `sftp user@host`)

## 🎉 Post-Deployment Checklist

After successful deployment:

- [ ] Frontend loads at `https://yourdomain.com`
- [ ] Login page displays correctly
- [ ] Test login: `admin@test.com` / `password123`
- [ ] Catalog loads with 6 products
- [ ] Filter drawer opens and works
- [ ] Mobile responsive (test on phone)
- [ ] HTTPS works (no mixed content warnings)
- [ ] DNS configured (if not auto-configured)
- [ ] SSL certificate activated (if needed)
- [ ] Announce go-live to users

## 🚀 You're Done!

Your application is now live on production! 🎉

**Next Steps:**
1. Monitor for errors (check Ionos error logs)
2. Test all features on real devices
3. Set up monitoring/alerts (optional, for Sprint 3)
4. Plan Sprint 3 enhancements (database, admin panel, etc.)

---

**Need Help?**
- Check: `_bmad-output/planning-artifacts/NEXT-STEPS.md`
- Read: `_bmad-output/planning-artifacts/deployment-guide.md`
- Review: `_bmad-output/planning-artifacts/task-2-4-deployment-prep.md`
