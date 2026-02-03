#!/bin/bash

# Test de connexion aux endpoints PHP sur Ionos

API_BASE="https://extensia-france.com/api"

echo "🧪 Test des endpoints PHP sur Ionos"
echo "=================================="
echo ""

# 1. Test login
echo "1️⃣  Test LOGIN (POST)"
echo "----"
curl -X POST "$API_BASE/login.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"test"}' \
  -v 2>&1 | grep -E "< HTTP|\"id\"|\"error"
echo ""

# 2. Test log
echo "2️⃣  Test LOG (POST)"
echo "----"
curl -X POST "$API_BASE/login.php?action=log" \
  -H "Content-Type: application/json" \
  -d '{"id_user":1,"action":"login"}' \
  -v 2>&1 | grep -E "< HTTP|insertId|\"error"
echo ""

# 3. Test catalogue
echo "3️⃣  Test CATALOGUE (GET)"
echo "----"
curl -X GET "$API_BASE/imageCatalogue.php" \
  -H "Authorization: Bearer token123" \
  -v 2>&1 | grep -E "< HTTP" | head -1
echo "Response preview:"
curl -s "$API_BASE/imageCatalogue.php" | head -c 200 | jq . 2>/dev/null || echo "(non-JSON)"
echo ""

# 4. Test thumbs
echo "4️⃣  Test THUMBS (GET)"
echo "----"
curl -I "$API_BASE/thumbs.php?image=test.jpg&size=700" \
  -v 2>&1 | grep -E "< HTTP|Cache-Control|ETag"
echo ""
