# Task 3.2: Admin Panel — Product Management

**Effort:** 13 story points | 5-6 days  
**Status:** Planning  
**Date:** 2026-01-23

---

## 🎯 Objective

Build a complete admin dashboard where authorized users can:
- View all products with statistics
- Create, edit, delete products
- Manage product variations (sizes, colors, prices)
- Upload and manage images
- Bulk import products via CSV
- Manage user accounts and permissions

---

## 📊 Admin Panel Features

### 1️⃣ DASHBOARD
```
┌─────────────────────────────────────────┐
│  📊 Dashboard                    🔒 Admin│
├─────────────────────────────────────────┤
│                                         │
│  📦 Total Products: 156                │
│  👥 Active Users: 42                   │
│  📸 Total Images: 524                  │
│  💰 Average Price: €850.00             │
│                                         │
│  [Recent Products]  [Recent Users]    │
│  ├─ Bague OR-001    ├─ user_demo      │
│  ├─ Collier AR-042  └─ user_123       │
│  └─ Bracelet BR-089                   │
│                                         │
└─────────────────────────────────────────┘
```

### 2️⃣ PRODUCT LIST
```
┌─────────────────────────────────────────────────┐
│  Products (156)                    [+ Add] [🔍]   │
├────────────────────────────────────────────────┤
│ Ref    │ Label          │ Category │ Price │ ... │
│────────┼────────────────┼──────────┼───────┼─────│
│ AB001  │ Bague Or       │ Bagues   │ €250  │ 👁️ 🖊️ 🗑️│
│ AB002  │ Bague Argent   │ Bagues   │ €150  │ 👁️ 🖊️ 🗑️│
│ AR042  │ Collier Or     │ Colliers │ €450  │ 👁️ 🖊️ 🗑️│
│ ...    │ ...            │ ...      │ ...   │ ... │
└────────────────────────────────────────────────┘
```

### 3️⃣ PRODUCT FORM
```
┌─────────────────────────────────────────┐
│  New Product                     ✕ Close│
├─────────────────────────────────────────┤
│ Reference:     [AB999        ]          │
│ Label:         [Bague Or Blanc]         │
│ Category:      [Bagues       ▼]         │
│ Line:          [Classique    ▼]         │
│ Description:   [Large text area...]     │
│ Min Price:     [€250.00      ]          │
│ Max Price:     [€1500.00     ]          │
│                                         │
│ [Upload Thumbnail]      [Preview img]  │
│ [Upload Main Image]     [Preview img]  │
│                                         │
│ [Save Product]  [Cancel]                │
└─────────────────────────────────────────┘
```

### 4️⃣ VARIATION EDITOR
```
┌──────────────────────────────────────┐
│  Variations (8)            [+ Add]    │
├──────────────────────────────────────┤
│ Label      │ Price  │ Image │ Actions│
│────────────┼────────┼───────┼────────│
│ Taille S   │ €250   │ 🖼️   │ 🖊️ 🗑️  │
│ Taille M   │ €300   │ 🖼️   │ 🖊️ 🗑️  │
│ Taille L   │ €350   │ 🖼️   │ 🖊️ 🗑️  │
└──────────────────────────────────────┘
```

### 5️⃣ BULK IMPORT
```
┌──────────────────────────────────────┐
│  Bulk Upload Products                │
├──────────────────────────────────────┤
│ [Drag CSV here or click to browse]   │
│                                      │
│ Template: [Download template.csv]    │
│                                      │
│ Progress: [████████░░] 80%           │
│ Status: Importing 6/8 products...    │
│                                      │
│ [Cancel]  [Done]                     │
└──────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Frontend Structure
```
src/
├── pages/
│   ├── AdminDashboard.tsx       (main dashboard)
│   ├── AdminProducts.tsx         (product list & CRUD)
│   ├── AdminVariations.tsx       (variation management)
│   ├── AdminUsers.tsx            (user management)
│   └── AdminBulkImport.tsx       (CSV upload)
│
├── components/
│   ├── AdminLayout.tsx           (sidebar + header)
│   ├── AdminHeader.tsx           (nav + logout)
│   ├── ProductForm.tsx           (create/edit form)
│   ├── VariationEditor.tsx       (variation CRUD)
│   ├── ImageUploader.tsx         (image upload)
│   ├── BulkUploadDialog.tsx      (CSV import)
│   ├── ConfirmDialog.tsx         (delete confirmation)
│   └── StatCard.tsx              (dashboard metric)
│
└── services/
    └── adminService.ts           (API calls)
```

### Backend Structure
```
backend/
├── admin/
│   ├── products-api.php          (GET/POST/PUT/DELETE)
│   ├── variations-api.php        (GET/POST/PUT/DELETE)
│   ├── users-api.php             (GET/POST/PUT)
│   ├── upload.php                (image upload)
│   ├── bulk-import.php           (CSV import)
│   ├── dashboard.php             (statistics)
│   └── README.md
│
└── middleware/
    ├── admin-auth.php            (verify admin role)
    └── request-validator.php     (sanitize inputs)
```

---

## 🔧 API Endpoints

### Products
```
GET    /backend/admin/products-api.php              (list with pagination)
POST   /backend/admin/products-api.php              (create)
PUT    /backend/admin/products-api.php?id=1         (update)
DELETE /backend/admin/products-api.php?id=1         (delete)
```

### Variations
```
GET    /backend/admin/variations-api.php?product_id=1
POST   /backend/admin/variations-api.php            (create)
PUT    /backend/admin/variations-api.php?id=1       (update)
DELETE /backend/admin/variations-api.php?id=1       (delete)
```

### Images
```
POST   /backend/admin/upload.php                    (upload single image)
POST   /backend/admin/bulk-upload.php               (bulk upload ZIP)
```

### Bulk Import
```
POST   /backend/admin/bulk-import.php               (CSV import)
```

### Users
```
GET    /backend/admin/users-api.php                 (list)
POST   /backend/admin/users-api.php                 (create)
PUT    /backend/admin/users-api.php?id=1            (update role/coef)
DELETE /backend/admin/users-api.php?id=1            (delete)
```

### Dashboard
```
GET    /backend/admin/dashboard.php                 (stats & metrics)
```

---

## 💻 Implementation Details

### Admin Layout Component
```tsx
// src/components/AdminLayout.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Package, BarChart3, LogOut } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
        </div>
        
        <nav className="p-4 space-y-2">
          <NavItem icon={<BarChart3 />} label="Dashboard" href="/admin" />
          <NavItem icon={<Package />} label="Products" href="/admin/products" />
          <NavItem icon={<Users />} label="Users" href="/admin/users" />
          <NavItem icon={<Settings />} label="Settings" href="/admin/settings" />
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t">
          <button className="w-full flex items-center gap-2 text-slate-600 hover:text-red-600">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
```

### Product Form Component
```tsx
// src/components/ProductForm.tsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface ProductFormProps {
  product?: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState(product || {
    ref: '',
    label: '',
    category: '',
    line: '',
    description: '',
    min_price: '',
    max_price: '',
    thumbnail: null,
    main_image: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(product?.thumbnail);
  const [mainImagePreview, setMainImagePreview] = useState(product?.main_image);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (field === 'thumbnail') {
          setThumbnailPreview(evt.target?.result);
          setFormData(prev => ({ ...prev, thumbnail: file }));
        } else {
          setMainImagePreview(evt.target?.result);
          setFormData(prev => ({ ...prev, main_image: file }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) form.append(key, formData[key]);
      });
      
      await onSave(form);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {product ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Reference & Label */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference *</label>
              <input
                type="text"
                required
                value={formData.ref}
                onChange={(e) => setFormData({...formData, ref: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., AB001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Label *</label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Bague Or Blanc"
              />
            </div>
          </div>
          
          {/* Row 2: Category & Line */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="Bagues">Bagues</option>
                <option value="Colliers">Colliers</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Boucles">Boucles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Line</label>
              <select
                value={formData.line}
                onChange={(e) => setFormData({...formData, line: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="Classique">Classique</option>
                <option value="Moderne">Moderne</option>
                <option value="Vintage">Vintage</option>
              </select>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500"
              rows={3}
              placeholder="Product details..."
            />
          </div>
          
          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Price €</label>
              <input
                type="number"
                step="0.01"
                value={formData.min_price}
                onChange={(e) => setFormData({...formData, min_price: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Price €</label>
              <input
                type="number"
                step="0.01"
                value={formData.max_price}
                onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Image Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Thumbnail</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-24 h-24 mx-auto mb-2" />
                )}
                <label className="cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600">
                  <Upload size={18} />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'thumbnail')} hidden />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                {mainImagePreview && (
                  <img src={mainImagePreview} alt="Main" className="w-24 h-24 mx-auto mb-2" />
                )}
                <label className="cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600">
                  <Upload size={18} />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'main_image')} hidden />
                </label>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 📡 Backend API Example (products-api.php)

```php
<?php
require '../db-config.php';
require '../middleware/admin-auth.php';

header('Content-Type: application/json');

// Verify admin role
verifyAdminRole();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  case 'GET':
    handleGetProducts();
    break;
  case 'POST':
    handleCreateProduct();
    break;
  case 'PUT':
    handleUpdateProduct();
    break;
  case 'DELETE':
    handleDeleteProduct();
    break;
  default:
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function handleGetProducts() {
  global $db;
  
  $page = $_GET['page'] ?? 1;
  $limit = 20;
  $offset = ($page - 1) * $limit;
  
  $countStmt = $db->prepare('SELECT COUNT(*) as total FROM products');
  $countStmt->execute();
  $total = $countStmt->fetch()['total'];
  
  $stmt = $db->prepare('
    SELECT * FROM products
    ORDER BY ref ASC
    LIMIT ? OFFSET ?
  ');
  $stmt->execute([$limit, $offset]);
  $products = $stmt->fetchAll();
  
  echo json_encode([
    'products' => $products,
    'total' => $total,
    'page' => $page,
    'per_page' => $limit,
    'total_pages' => ceil($total / $limit)
  ]);
}

function handleCreateProduct() {
  global $db;
  
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validate
  if (!$data['ref'] || !$data['label']) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing required fields']));
  }
  
  $stmt = $db->prepare('
    INSERT INTO products (ref, label, category, line, description, min_price, max_price, thumbnail, main_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ');
  
  $stmt->execute([
    $data['ref'],
    $data['label'],
    $data['category'] ?? null,
    $data['line'] ?? null,
    $data['description'] ?? null,
    $data['min_price'] ?? null,
    $data['max_price'] ?? null,
    $data['thumbnail'] ?? null,
    $data['main_image'] ?? null,
  ]);
  
  echo json_encode(['id' => $db->lastInsertId(), 'message' => 'Product created']);
}

function handleUpdateProduct() {
  global $db;
  
  $id = $_GET['id'] ?? null;
  if (!$id) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing product ID']));
  }
  
  $data = json_decode(file_get_contents('php://input'), true);
  
  $stmt = $db->prepare('
    UPDATE products
    SET ref = ?, label = ?, category = ?, line = ?, description = ?, 
        min_price = ?, max_price = ?, thumbnail = ?, main_image = ?
    WHERE id = ?
  ');
  
  $stmt->execute([
    $data['ref'],
    $data['label'],
    $data['category'] ?? null,
    $data['line'] ?? null,
    $data['description'] ?? null,
    $data['min_price'] ?? null,
    $data['max_price'] ?? null,
    $data['thumbnail'] ?? $data['thumbnail'] ?? null,
    $data['main_image'] ?? $data['main_image'] ?? null,
    $id
  ]);
  
  echo json_encode(['message' => 'Product updated']);
}

function handleDeleteProduct() {
  global $db;
  
  $id = $_GET['id'] ?? null;
  if (!$id) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing product ID']));
  }
  
  $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
  $stmt->execute([$id]);
  
  echo json_encode(['message' => 'Product deleted']);
}
?>
```

---

## 🔐 Security & Permissions

### Admin Role Check
```php
// backend/middleware/admin-auth.php
function verifyAdminRole() {
  // Verify JWT token
  $token = getBearerToken();
  $claims = verifyJWT($token);
  
  if (!$claims || $claims['role'] !== 'admin') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden: Admin role required']));
  }
  
  return $claims;
}
```

---

## ✅ Testing Checklist

- [ ] Admin login works
- [ ] Can create product with all fields
- [ ] Can edit product and see changes
- [ ] Can delete product with confirmation
- [ ] Can upload product images
- [ ] Variations can be added/edited
- [ ] CSV bulk import works (50+ products)
- [ ] Performance: Admin page load < 2s
- [ ] Mobile responsive (tablet view)
- [ ] All validations work

---

## 🚀 Next: Task 3.3

After admin panel, optimize images and implement CDN for fast delivery.

---

**Let's build the admin panel!** 💪
