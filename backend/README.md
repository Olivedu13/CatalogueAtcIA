# Backend — Fichiers PHP

## Structure

```
backend/
├── db.php              # Connexion DB centralisée (NOUVEAU)
├── login.php           # Authentification + logs
├── imageCatalogue.php  # Récupération catalogue
├── thumbs.php          # Service miniatures
└── .env.example        # Variables d'environnement
```

## Configuration

### db.php (Connexion Centralisée — NOUVEAU)

Centralise la connexion MySQL pour tous les endpoints.

**Utilisation:**
```php
require_once __DIR__ . '/db.php';
// $mysqli est maintenant disponible globalement
```

**Helpers:**
- `execute_query($query, $types, $params)` — Prepared statement réutilisable
- `get_insert_id()` — Retourne le dernier ID inséré

**Avantages:**
- Une seule connexion pour tout le projet
- Gestion d'erreurs centralisée
- Charset utf8mb4 configuré automatiquement

### Variables d'environnement (.env)

```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=catalogue

IMG_DIR=/var/www/imgs
CACHE_DIR=/var/www/imgs_cache
```

## Endpoints

### POST /login.php?action=login

**Request:**
```json
{
  "user": "commercial",
  "password": "pwd123"
}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "commercial",
    "Nom_agence": "Joaillerie X",
    "logo": "logo.png"
  }
]
```

**Erreurs:**
- 400: Missing user/password
- 500: DB error

---

### POST /login.php?action=log

**Request:**
```json
{
  "id_user": 1
}
```

**Response (200):**
```json
{
  "insertId": 42
}
```

Le frontend utilise `insertId` comme token localStorage.

---

### GET /imageCatalogue.php

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "ref": "BAG001",
    "label": "Bague Classique",
    "prix": 150.00,
    "description": "Bague",
    "prenom_ligne": "Collection Or",
    "id_centre": 5,
    "img": "bague001.jpg",
    "img_cv": "bague001_cover.jpg",
    "formes": "1005,1016",
    "types": "1003,1009",
    "id_typ_pier": 1003,
    "gallery": ["bague001_v1.jpg", "bague001_v2.jpg"]
  }
]
```

**Champs obligatoires:**
- `ref`: Référence produit (clé de regroupement)
- `label`, `prix`, `description`, `prenom_ligne`
- `img`, `img_cv`: Noms de fichiers (sans dossier)
- `formes`: CSV d'IDs (ex: "1005,1016")
- `id_typ_pier` OU `types`: Type de pierre (ID unique ou CSV)
- `gallery`: Array de filenames

---

### GET /imgs/thumbs.php?image=<file>&size=<n>

**Params:**
- `image`: Filename (ex: "bague001.jpg")
- `size`: Taille pixels (ex: 700)

**Response:**
- 200: Image optimisée + ETag header + Cache-Control
- 304: Not Modified (si ETag match)
- 404: Image not found

**Headers:**
```
ETag: <hash>
Cache-Control: max-age=86400, public
Content-Type: image/jpeg
```

---

## Table Structure (Exemple)

### users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  Nom_agence VARCHAR(255),
  logo VARCHAR(255)
);
```

### logs

```sql
CREATE TABLE logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_user INT,
  action VARCHAR(50),
  date_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id)
);
```

### produits

```sql
CREATE TABLE produits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ref VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(255),
  prix DECIMAL(10, 2),
  description VARCHAR(255),
  prenom_ligne VARCHAR(100),
  id_centre INT,
  img VARCHAR(255),
  img_cv VARCHAR(255),
  formes VARCHAR(255),
  id_typ_pier INT,
  gallery JSON,
  visible TINYINT DEFAULT 1
);
```

### forme_pier & type_pier

```sql
CREATE TABLE forme_pier (
  id INT PRIMARY KEY,
  description VARCHAR(100)
);

CREATE TABLE type_pier (
  id INT PRIMARY KEY,
  description VARCHAR(100)
);

-- Exemples:
INSERT INTO forme_pier VALUES (1005, 'ROND'), (1006, 'OVALE'), (1016, 'POIRE');
INSERT INTO type_pier VALUES (1003, 'DIAMANT'), (1004, 'RUBIS'), (1009, 'EMERAUDE');
```

---

## Installation & Tests

### 1. Adapter les fichiers PHP

Chaque `login.php`, `imageCatalogue.php` contient des dummy responses (pour tests).
Remplacer par vraies queries mysqli:

```php
$stmt = $mysqli->prepare("SELECT * FROM users WHERE username = ?");
$stmt->bind_param("s", $user);
$stmt->execute();
$result = $stmt->get_result();
```

### 2. Tester

```bash
# Login
curl -X POST http://localhost/api/login.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"user": "test", "password": "pwd"}'

# Catalogue
curl -H "Authorization: Bearer token123" \
  http://localhost/api/imageCatalogue.php

# Thumbs
curl http://localhost/api/thumbs.php?image=bague001.jpg&size=700 -o thumb.jpg
```

### 3. Configuration CORS (Apache .htaccess)

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

### 4. Production

- Hacher les passwords (bcrypt, not MD5)
- Valider/sanitize inputs
- Rate limiting sur login
- HTTPS obligatoire
- Cache headers étagés sur thumbs
- Compression gzip sur responses JSON

---

## Notes

- **Dummy responses actuellement retournées** pour démo sans DB
- Remplacer `// TODO:` par vraies implementations
- Frontend `.env.local` doit pointer vers `VITE_API_BASE=http://localhost/api`
- Token localStorage issu de `login.php?action=log` insertId
- Fallback mock activé si API_BASE absent (pour dev client-side)
