#!/bin/bash

##############################################################################
#                                                                            #
#  CatalogueATC — Ionos Deployment Script                                   #
#  Production-Ready Automated Deployment                                    #
#                                                                            #
#  Usage: ./deployment.sh                                                   #
#  Then: Enter credentials when prompted (or set env variables)             #
#                                                                            #
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

##############################################################################
# AUTO-LOAD ENVIRONMENT FILE
##############################################################################

if [ -f ".env.local" ]; then
    log "Loading .env.local..."
    source .env.local
    log_success ".env.local loaded"
fi

##############################################################################
# CONFIGURATION SECTION — Edit these or set environment variables
##############################################################################

# Read from environment variables or prompt user
IONOS_HOST="${IONOS_HOST:-}"
IONOS_USER="${IONOS_USER:-}"
IONOS_PASS="${IONOS_PASS:-}"
IONOS_PORT="${IONOS_PORT:-22}"
REMOTE_PATH="${REMOTE_PATH:-/public_html}"
DOMAIN="${DOMAIN:-}"
USE_SFTP="${USE_SFTP:-true}"  # true for SFTP, false for FTP

##############################################################################
# VALIDATION & INPUT
##############################################################################

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║        CatalogueATC — Ionos Deployment Script                  ║${NC}"
echo -e "${BLUE}║                   Production Deployment                        ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to prompt for credentials
prompt_credentials() {
    if [ -z "$IONOS_HOST" ]; then
        echo -e "${YELLOW}IONOS Hosting Credentials Required${NC}"
        echo ""
        read -p "Enter IONOS FTP/SFTP hostname (e.g., ftp.ionos.eu): " IONOS_HOST
    fi
    
    if [ -z "$IONOS_USER" ]; then
        read -p "Enter IONOS FTP/SFTP username: " IONOS_USER
    fi
    
    if [ -z "$IONOS_PASS" ]; then
        read -sp "Enter IONOS FTP/SFTP password: " IONOS_PASS
        echo ""
    fi
    
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain (e.g., yourdomain.com) [optional, for verification]: " DOMAIN
    fi
}

# Function to validate build
validate_build() {
    log "Validating build..."
    
    if [ ! -f "dist/index.html" ]; then
        log_error "Build not found! Run 'npm run build' first"
        echo ""
        read -p "Run npm build now? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Building project..."
            npm run build
        else
            log_error "Aborting deployment"
            exit 1
        fi
    fi
    
    if [ ! -d "backend" ]; then
        log_error "Backend folder not found!"
        exit 1
    fi
    
    log_success "Build validated"
}

# Function to check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if [ "$USE_SFTP" = true ]; then
        if ! command -v sftp &> /dev/null; then
            log_warning "sftp not found, falling back to lftp"
            if ! command -v lftp &> /dev/null; then
                log_error "Neither sftp nor lftp found. Install openssh-client or lftp"
                exit 1
            fi
            SFTP_TOOL="lftp"
        else
            SFTP_TOOL="sftp"
        fi
    else
        if ! command -v ftp &> /dev/null && ! command -v lftp &> /dev/null; then
            log_error "FTP tools not found. Install ftp or lftp"
            exit 1
        fi
    fi
    
    log_success "Dependencies OK"
}

##############################################################################
# BUILD FRONTEND
##############################################################################

build_frontend() {
    log "Installing frontend dependencies (npm install if needed)..."
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log "node_modules already present, skipping npm install"
    fi

    log "Building frontend (npm run build)..."
    npm run build
    log_success "Frontend build completed"
}

##############################################################################
# DEPLOYMENT FUNCTIONS
##############################################################################

deploy_with_sftp() {
    log "Deploying with SFTP..."
    
    # Create temporary script for sftp batch operations
    SFTP_BATCH=$(mktemp)
    
    cat > "$SFTP_BATCH" << SFTP_COMMANDS
# Already in /catalogueAtc, no need to cd

# Create backend directory
-mkdir backend

# Upload frontend build files (directly at root)
lcd dist
put index.html
put -r assets
lcd ..

# Upload backend
lcd backend
cd backend
mput *.php
put README.md
cd ..
lcd ..

# Set permissions
chmod 644 index.html
chmod 755 assets
chmod 755 backend
chmod 644 backend/*.php

# Exit
quit
SFTP_COMMANDS

    # Try sshpass first if available
    if command -v sshpass &> /dev/null; then
        log "Using sshpass for SFTP authentication..."
        sshpass -p "$IONOS_PASS" sftp -o StrictHostKeyChecking=no "$IONOS_USER@$IONOS_HOST" < "$SFTP_BATCH"
    # Fallback to expect if available
    elif command -v expect &> /dev/null; then
        log "Using expect for SFTP authentication..."
        expect << EXPECTEOF
set timeout 30
spawn sftp -o StrictHostKeyChecking=no $IONOS_USER@$IONOS_HOST
expect "assword:"
send "$IONOS_PASS\r"
expect sftp>
while {[gets stdin line] >= 0} {
    send "$line\r"
    expect sftp>
}
EXPECTEOF
    else
        log_warning "sshpass/expect not available, attempting interactive SFTP..."
        sftp -o StrictHostKeyChecking=no "$IONOS_USER@$IONOS_HOST" < "$SFTP_BATCH"
    fi
    
    rm -f "$SFTP_BATCH"
    log_success "SFTP deployment complete"
}

deploy_with_lftp() {
    log "Deploying with lftp (SFTP)..."
    
    lftp -u "$IONOS_USER,$IONOS_PASS" "sftp://$IONOS_HOST" << LFTP_COMMANDS
set net:max-retries 3
set net:timeout 10

cd $REMOTE_PATH

mkdir -p dist
mkdir -p backend

# Upload frontend
lcd dist
cd dist
mirror -R --delete --parallel=4
cd ..
lcd ..

# Upload backend
lcd backend
cd ../backend
mirror -R --delete
cd ..
lcd ..

# Set permissions
chmod 644 dist/index.html
chmod 644 dist/index.js
chmod 644 dist/style.css
chmod 755 backend
chmod 644 backend/*.php

quit
LFTP_COMMANDS

    log_success "lftp deployment complete"
}

deploy_with_ftp() {
    log "Deploying with FTP..."
    
    FTP_SCRIPT=$(mktemp)
    
    # Create FTP batch script with better structure
    cat > "$FTP_SCRIPT" << FTP_COMMANDS
open -u $IONOS_USER,$IONOS_PASS $IONOS_HOST $IONOS_PORT
set net:max-retries 3
set net:timeout 10
cd $REMOTE_PATH
mkdir -p dist
mkdir -p backend
mirror -R dist/ dist/ --delete --parallel=4
mirror -R backend/ backend/ --delete
quit
FTP_COMMANDS

    # Use ftp command with environment
    (echo "open $IONOS_HOST"; echo "$IONOS_USER"; echo "$IONOS_PASS"; cat << FTP_BATCH
cd $REMOTE_PATH
mkdir dist
mkdir backend
binary
lcd dist
cd dist
mput *
cd ..
lcd ../backend
cd ../backend
mput *
cd ..
quit
FTP_BATCH
) | ftp -n
    
    rm -f "$FTP_SCRIPT"
    log_success "FTP deployment complete"
}

##############################################################################
# VERIFICATION FUNCTIONS
##############################################################################

verify_deployment() {
    log "Verifying deployment..."
    
    if [ -z "$DOMAIN" ]; then
        log_warning "Domain not provided, skipping online verification"
        return 0
    fi
    
    echo ""
    log "Testing endpoints (this may take 30 seconds)..."
    
    # Test frontend
    echo -n "Testing frontend (https://$DOMAIN)... "
    if curl -s -m 5 "https://$DOMAIN" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️ (May take time for DNS propagation)${NC}"
    fi
    
    # Test catalog API
    echo -n "Testing catalog API... "
    if curl -s -m 5 "https://$DOMAIN/backend/imageCatalogue.php" | grep -q "BAG001" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️${NC}"
    fi
    
    # Test login API
    echo -n "Testing login API... "
    if curl -s -m 5 -X POST "https://$DOMAIN/backend/login.php" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@test.com","password":"password123"}' | grep -q "success" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️${NC}"
    fi
    
    log_success "Verification complete"
}

##############################################################################
# PRE-DEPLOYMENT CHECKLIST
##############################################################################

pre_deployment_checklist() {
    log "Pre-deployment checklist..."
    echo ""
    
    # Check build
    if [ ! -d "dist" ]; then
        log_error "dist/ folder not found"
        return 1
    fi
    echo "✅ dist/ folder present"
    
    # Check backend
    if [ ! -d "backend" ]; then
        log_error "backend/ folder not found"
        return 1
    fi
    echo "✅ backend/ folder present"
    
    # Check key files
    for file in "dist/index.html" "backend/login.php" "backend/imageCatalogue.php" "backend/thumbs.php"; do
        if [ ! -f "$file" ]; then
            log_error "Missing file: $file"
            return 1
        fi
    done
    
    # Check for JS and CSS in assets (Vite uses hashed names)
    if [ ! -f "dist/assets"/*.js ] && [ ! -d "dist/assets" ]; then
        log_error "dist/assets/ folder not found"
        return 1
    fi
    echo "✅ All required files present"
    
    # Check file sizes
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "✅ Build size: $BUILD_SIZE"
    
    log_success "Pre-deployment checklist passed"
    return 0
}

##############################################################################
# POST-DEPLOYMENT INSTRUCTIONS
##############################################################################

post_deployment_instructions() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                   Deployment Complete! 🚀                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${GREEN}Next Steps:${NC}"
    echo ""
    echo "1. ${YELLOW}DNS Configuration${NC}"
    echo "   If not already done:"
    echo "   → Point your domain to Ionos nameservers (usually ns1.ionos.eu, ns2.ionos.eu)"
    echo "   → OR create A record: $DOMAIN → Ionos IP"
    echo "   → Wait 24-48 hours for propagation"
    echo ""
    
    echo "2. ${YELLOW}SSL Certificate${NC}"
    echo "   → Login to Ionos Control Panel"
    echo "   → Web Hosting → Manage → SSL Certificates"
    echo "   → Activate free SSL certificate"
    echo "   → Wait 15-30 minutes"
    echo ""
    
    echo "3. ${YELLOW}Verify Deployment${NC}"
    if [ -n "$DOMAIN" ]; then
        echo "   → https://$DOMAIN (should load login page)"
        echo "   → Test on mobile device (375px viewport)"
        echo "   → Test login with: admin@test.com / password123"
    else
        echo "   → Open your domain in browser"
        echo "   → Should display: Login page"
        echo "   → Test login with: admin@test.com / password123"
    fi
    echo ""
    
    echo "4. ${YELLOW}Common Issues${NC}"
    echo "   → CORS errors: May be due to domain not set in backend CORS headers"
    echo "   → 404 API: Verify backend/ folder uploaded to public_html/backend/"
    echo "   → Images not loading: Check thumbs.php path"
    echo ""
    
    echo "5. ${YELLOW}Monitoring${NC}"
    echo "   → Check Ionos Control Panel for errors"
    echo "   → Monitor /var/log/php/error.log for PHP errors"
    echo "   → Set up email alerts for errors (optional)"
    echo ""
    
    echo -e "${GREEN}Documentation:${NC}"
    echo "   → Full guide: _bmad-output/planning-artifacts/deployment-guide.md"
    echo "   → Task 2.4: _bmad-output/planning-artifacts/task-2-4-deployment-prep.md"
    echo ""
    
    if [ -n "$DOMAIN" ]; then
        echo -e "${YELLOW}Your site will be live at:${NC}"
        echo "   🌐 https://$DOMAIN"
    fi
    echo ""
}

##############################################################################
# CREATE .HTACCESS FILE
##############################################################################

create_htaccess() {
    log "Creating .htaccess file..."
    
    HTACCESS_FILE=".htaccess"
    
    cat > "$HTACCESS_FILE" << 'HTACCESS_CONTENT'
# Enable mod_rewrite for URL rewriting
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirect HTTP to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE application/xml+rss application/atom+xml image/svg+xml
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # HTML files: 1 hour
    ExpiresByType text/html "access plus 1 hour"
    
    # CSS/JS: 30 days
    ExpiresByType text/css "access plus 30 days"
    ExpiresByType application/javascript "access plus 30 days"
    
    # Images: 60 days
    ExpiresByType image/jpeg "access plus 60 days"
    ExpiresByType image/png "access plus 60 days"
    ExpiresByType image/gif "access plus 60 days"
    ExpiresByType image/svg+xml "access plus 60 days"
    
    # Default: 1 day
    ExpiresDefault "access plus 1 day"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\.(env|env\..*|\.git|\.gitignore)$">
    Order allow,deny
    Deny from all
</FilesMatch>
HTACCESS_CONTENT

    log_success ".htaccess created: $HTACCESS_FILE"
}

##############################################################################
# BACKUP FUNCTION
##############################################################################

backup_remote() {
    log "Creating backup of remote files..."
    
    BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [ "$USE_SFTP" = true ]; then
        log_warning "Backup via SFTP not automated. Use Ionos Control Panel instead."
        log "→ Ionos Control Panel → Backups → Download backup"
    fi
    
    log_success "Backup instructions provided"
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    # Step 1: Prompt for credentials
    prompt_credentials
    
    echo ""
    log "Configuration:"
    echo "  Host: $IONOS_HOST"
    echo "  User: $IONOS_USER"
    echo "  Port: $IONOS_PORT"
    echo "  Remote Path: $REMOTE_PATH"
    echo "  Domain: ${DOMAIN:-Not set (will ask later)}"
    echo "  Protocol: ${USE_SFTP:+SFTP}${!USE_SFTP:+FTP}"
    echo ""
    
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled"
        exit 0
    fi

    # Step 2: Build frontend (install deps if needed)
    build_frontend
    
    # Step 3: Validate build
    validate_build
    
    # Step 4: Pre-deployment checklist
    pre_deployment_checklist || exit 1
    
    # Step 5: Check dependencies
    check_dependencies
    
    # Step 6: Create .htaccess
    create_htaccess
    
    # Step 7: Backup
    backup_remote
    
    # Step 8: Deploy
    echo ""
    log "Starting deployment..."
    echo ""
    
    if [ "$USE_SFTP" = true ]; then
        if [ "$SFTP_TOOL" = "lftp" ]; then
            deploy_with_lftp
        else
            deploy_with_sftp
        fi
    else
        deploy_with_ftp
    fi
    
    # Step 9: Verify
    echo ""
    verify_deployment
    
    # Step 10: Post-deployment instructions
    post_deployment_instructions
}

# Run main function
main
