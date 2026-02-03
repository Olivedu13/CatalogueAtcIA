# Task 3.1: MySQL Integration & Real Data

**Effort:** 8 story points | 3-4 days  
**Status:** Planning  
**Date:** 2026-01-23

---

## 🎯 Objective

Replace dummy PHP data with real MySQL database. All products, users, and variations will be stored in a relational database for scalability.

---

## 📊 Current State → Target State

### CURRENT (Dummy Data)
```php
// backend/imageCatalogue.php
$products = [
  ['id' => 1, 'ref' => 'AB001', 'label' => 'Bague Or'],
  // hardcoded array...
];
```

### TARGET (MySQL Database)
```sql
-- database: catalogueAtc
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ref VARCHAR(50) UNIQUE,
  label VARCHAR(255),
  -- more fields...
);

SELECT * FROM products WHERE ref = ?;
```

---

## 🗂️ Database Schema

### 1. USERS TABLE
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('admin', 'viewer', 'restricted') DEFAULT 'viewer',
  coef DECIMAL(5,2) DEFAULT 1.0,
  logo_url VARCHAR(255),
  agency_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active TINYINT DEFAULT 1,
  INDEX idx_username (username),
  INDEX idx_role (role)
);
```

### 2. PRODUCTS TABLE
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ref VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  line VARCHAR(100),
  thumbnail VARCHAR(500),
  main_image VARCHAR(500),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ref (ref),
  INDEX idx_category (category),
  INDEX idx_line (line),
  FULLTEXT INDEX ft_search (label, description)
);
```

### 3. VARIATIONS TABLE
```sql
CREATE TABLE variations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  ref VARCHAR(50),
  label VARCHAR(255),
  description VARCHAR(500),
  prix DECIMAL(10,2),
  image VARCHAR(500),
  id_cv INT,
  shape_ids VARCHAR(50),   -- e.g., "1,3"
  type_ids VARCHAR(50),    -- e.g., "2,4"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_ref (ref)
);
```

### 4. PRODUCT_SHAPES TABLE
```sql
CREATE TABLE product_shapes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shape_name VARCHAR(100) UNIQUE,
  icon VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. PRODUCT_TYPES TABLE
```sql
CREATE TABLE product_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(100) UNIQUE,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Migration Steps

### Step 1: Create Database & Tables

**File:** `backend/db-init.sql`

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS catalogueAtc 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE catalogueAtc;

-- Create all tables (schema above)
-- ...

-- Insert dummy data
INSERT INTO users (username, password_hash, email, role, coef, agency_id) VALUES
('demo', '$2y$10$...', 'demo@test.com', 'viewer', 1.0, '496'),
('admin', '$2y$10$...', 'admin@test.com', 'admin', 1.0, NULL);

INSERT INTO products (ref, label, category, line, thumbnail, min_price, max_price) VALUES
('AB001', 'Bague Or Blanc', 'Bagues', 'Classique', '/images/thumb_ab001.jpg', 250.00, 1500.00),
-- ... more products
;

-- Indexes for performance
CREATE INDEX idx_products_ref ON products(ref);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_variations_product ON variations(product_id);
CREATE FULLTEXT INDEX ft_products_search ON products(label, description);
```

### Step 2: Set Up Database Connection

**File:** `backend/db-config.php`

```php
<?php
// Database connection configuration
// Load from environment variables for security

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'catalogueAtc';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

try {
  $db = new PDO(
    "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
    $db_user,
    $db_pass,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]
  );
} catch (PDOException $e) {
  http_response_code(500);
  die(json_encode(['error' => 'Database connection failed']));
}
?>
```

### Step 3: Update API Endpoints

#### Update `backend/login.php`
```php
<?php
require 'db-config.php';

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Query database instead of dummy data
$stmt = $db->prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
  // Update last login
  $updateStmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
  $updateStmt->execute([$user['id']]);
  
  // Generate JWT token
  $token = createJWT($user['id'], $user['role']);
  
  echo json_encode([
    'token' => $token,
    'user' => [
      'id' => $user['id'],
      'username' => $user['username'],
      'role' => $user['role'],
      'coef' => $user['coef'],
      'logoUrl' => $user['logo_url'],
      'agencyId' => $user['agency_id'],
    ]
  ]);
} else {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid credentials']);
}
?>
```

#### Update `backend/imageCatalogue.php`
```php
<?php
require 'db-config.php';

header('Content-Type: application/json');

// Verify JWT token
$token = getBearerToken();
if (!verifyJWT($token)) {
  http_response_code(401);
  die(json_encode(['error' => 'Unauthorized']));
}

// Query products with variations
$productsStmt = $db->prepare('
  SELECT 
    p.*,
    COUNT(v.id) as variation_count
  FROM products p
  LEFT JOIN variations v ON p.id = v.product_id
  WHERE p.is_active = 1
  GROUP BY p.id
  ORDER BY p.ref ASC
');
$productsStmt->execute();
$products = $productsStmt->fetchAll();

// Load variations for each product
foreach ($products as &$product) {
  $varStmt = $db->prepare('
    SELECT * FROM variations 
    WHERE product_id = ? 
    ORDER BY label ASC
  ');
  $varStmt->execute([$product['id']]);
  $product['variations'] = $varStmt->fetchAll();
}

// Load shapes
$shapesStmt = $db->prepare('SELECT id, shape_name as label FROM product_shapes');
$shapesStmt->execute();
$shapes = $shapesStmt->fetchAll();

// Load types
$typesStmt = $db->prepare('SELECT id, type_name as label FROM product_types');
$typesStmt->execute();
$types = $typesStmt->fetchAll();

echo json_encode([
  'products' => $products,
  'shapes' => $shapes,
  'types' => $types
]);
?>
```

---

## 🔐 Security Considerations

### 1. Connection Security
```php
// Use environment variables (never hardcode credentials)
$db_user = getenv('DB_USER');
$db_pass = getenv('DB_PASS');

// Use PDO with prepared statements (prevents SQL injection)
$stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]); // Parameters are safe
```

### 2. Password Hashing
```php
// Use bcrypt (never MD5)
$password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

// Verify
if (password_verify($input_password, $password_hash)) {
  // Password is correct
}
```

### 3. Token Security
```php
// JWT tokens with expiry
function createJWT($user_id, $role) {
  $payload = [
    'user_id' => $user_id,
    'role' => $role,
    'exp' => time() + (7 * 24 * 60 * 60) // 7 days
  ];
  
  $secret = getenv('JWT_SECRET');
  return base64_encode(json_encode($payload)) . '.' . hash_hmac('sha256', json_encode($payload), $secret);
}
```

---

## 🗄️ Local Development Setup

### For Windows/Mac/Linux

```bash
# 1. Install MySQL (if not already)
# macOS: brew install mysql
# Windows: Download from mysql.com

# 2. Start MySQL
mysql.server start  # or: brew services start mysql

# 3. Create database
mysql -u root -p < backend/db-init.sql

# 4. Set environment variables
export DB_HOST=localhost
export DB_NAME=catalogueAtc
export DB_USER=root
export DB_PASS=''
export JWT_SECRET='your-secret-key-here'

# 5. Test connection
php -r "require 'backend/db-config.php'; echo 'Connected!'"
```

---

## 🚀 Testing Checklist

- [ ] Database creates without errors
- [ ] Login with dummy user works
- [ ] Catalog loads 6+ products
- [ ] Variations display correctly
- [ ] Filters work (category, line, price)
- [ ] Images load from database paths
- [ ] Search functionality works
- [ ] Performance: Query < 100ms

---

## 📈 Performance Optimization

### Indexes for Speed
```sql
-- Add these after initial setup
CREATE INDEX idx_products_ref ON products(ref);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_variations_product ON variations(product_id);
CREATE FULLTEXT INDEX ft_products ON products(label, description);
```

### Caching Strategy
```php
// Cache products for 1 hour (reduces DB load)
$cacheKey = 'products_catalog';
$cached = apcu_fetch($cacheKey);

if ($cached === false) {
  $products = fetchFromDatabase();
  apcu_store($cacheKey, $products, 3600); // 1 hour
} else {
  $products = $cached;
}
```

---

## 📋 Deployment Steps

### On Ionos Hosting

1. **Access Ionos Control Panel**
   - Admin → MySQL Databases
   - Create new database: `catalogueAtc`
   - Note: Username, Password, Host

2. **Upload SQL Schema**
   - Use File Manager → SQL section
   - Paste contents of `db-init.sql`
   - Execute

3. **Set Environment Variables**
   - Create `.env` file in `backend/`:
   ```
   DB_HOST=abc123.mysql.ionos.com
   DB_USER=abc123
   DB_PASS=your_password
   DB_NAME=catalogueAtc
   JWT_SECRET=your_secret_key
   ```

4. **Upload Updated PHP Files**
   - Upload `backend/db-config.php`
   - Update `backend/login.php`
   - Update `backend/imageCatalogue.php`

5. **Test**
   - Navigate to `https://yourdomain.com`
   - Login with demo/demo
   - Verify products load

---

## ✅ Definition of Done

- [ ] MySQL schema created & tested locally
- [ ] Migration script written & verified
- [ ] All API endpoints updated to use database
- [ ] Security: Bcrypt + JWT implemented
- [ ] Performance: Queries < 100ms
- [ ] Tested on Ionos (or local MySQL)
- [ ] Documentation complete
- [ ] Rollback plan documented

---

## 🔄 Rollback Plan

If something breaks:

```bash
# 1. Drop corrupt database
mysql -u root -p -e "DROP DATABASE catalogueAtc;"

# 2. Restore from backup (automated daily)
mysql -u root -p < backup_2026-01-23.sql

# 3. Revert PHP files to previous version
# (Git: git checkout HEAD~1)
```

---

## 💡 Tips & Best Practices

1. **Always use prepared statements** (prevents SQL injection)
2. **Index frequently searched columns** (ref, category, line)
3. **Use FULLTEXT search** for product discovery
4. **Cache frequent queries** (APCu or Redis)
5. **Log all database operations** for debugging
6. **Regular backups** (automated daily)
7. **Monitor query performance** with EXPLAIN

---

## 📚 Next Tasks (After 3.1)

- **Task 3.2:** Admin Panel → Manage products via UI
- **Task 3.3:** Image Optimization → CDN delivery
- **Task 3.4:** Auth Enhancement → Bcrypt + JWT

---

**Ready to start? Begin with local setup, then move to Ionos staging!** 🚀
