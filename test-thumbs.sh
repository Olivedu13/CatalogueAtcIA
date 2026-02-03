#!/bin/bash

# Test du service thumbs.php avec ETag et Cache-Control

echo "🧪 Test Thumbs Service — Cache & ETag"
echo "======================================"
echo ""

# Configuration
THUMBS_URL="https://extensia-france.com/api/thumbs.php"
IMAGE="bague-diamant-001.jpg"
SIZE="700"

# Test 1: First request (200 OK + ETag)
echo "1️⃣  Premier appel (doit retourner 200 + ETag)"
echo "───────────────────────────────────────────"
curl -i "${THUMBS_URL}?image=${IMAGE}&size=${SIZE}" 2>&1 | grep -E "^HTTP|ETag|Cache-Control|Content-Length" | head -5
ETAG=$(curl -s -i "${THUMBS_URL}?image=${IMAGE}&size=${SIZE}" 2>&1 | grep "^ETag:" | cut -d' ' -f2 | tr -d '\r')
echo "📌 ETag obtenu: $ETAG"
echo ""

# Test 2: Second request avec If-None-Match (doit retourner 304)
if [ -n "$ETAG" ]; then
    echo "2️⃣  Deuxième appel avec If-None-Match (doit retourner 304 Not Modified)"
    echo "──────────────────────────────────────────────────────────────────────"
    curl -i -H "If-None-Match: $ETAG" "${THUMBS_URL}?image=${IMAGE}&size=${SIZE}" 2>&1 | grep -E "^HTTP|ETag|Cache-Control" | head -3
    echo ""
fi

# Test 3: Cache headers
echo "3️⃣  Vérification des headers Cache"
echo "───────────────────────────────────"
curl -s -i "${THUMBS_URL}?image=${IMAGE}&size=${SIZE}" 2>&1 | grep -E "^Cache-Control|^Content-Type|^Content-Length" | head -5
echo ""

# Test 4: 404 error (image inexistante)
echo "4️⃣  Erreur 404 (image inexistante)"
echo "──────────────────────────────────"
curl -s -w "HTTP %{http_code}\n" -o /dev/null "${THUMBS_URL}?image=nonexistent.jpg&size=${SIZE}"
echo ""

# Test 5: Vérifier que le cache local fonctionne
echo "5️⃣  Vérification du répertoire cache"
echo "────────────────────────────────────"
ssh [user]@extensia-france.com "ls -la /var/www/extensia-france.com/imgs_cache/ 2>/dev/null | tail -5" || echo "(SSH non configuré, sauté)"
echo ""

echo "✅ Tests thumbs.php terminés"
