# Task 3.3: Image Optimization & CDN

**Effort:** 8 story points | 3-4 days  
**Status:** Planning  
**Date:** 2026-01-23

---

## 🎯 Objective

Optimize product images for fast delivery and implement CDN (Content Delivery Network) for global users. This includes:
- Automatic thumbnail generation
- WebP format support  
- Responsive image sizing
- Lazy loading
- CloudFlare CDN integration
- Service Worker for offline support

---

## 📊 Current Performance vs Target

| Metric | Current | Target | Gain |
|--------|---------|--------|------|
| **Image Load Time (10 imgs)** | ~1.5s | <1s | 33% faster |
| **Mobile Pageload** | ~3s | <2s | 33% faster |
| **Cache Hit Rate** | 0% | 80%+ | More hits |
| **Lighthouse Score** | 95 | 98+ | Better |
| **Webp Support** | ❌ No | ✅ Yes | -30% size |

---

## 🏗️ Architecture

### Current Flow (Dummy Data)
```
Browser → imageCatalogue.php → Static thumbs.php → Local images → Display
```

### Optimized Flow (With CDN)
```
Browser → CDN (Cloudflare) → imageCatalogue.php → S3/Local images → Cache
         (cached images)    (API with headers)
```

---

## 🖼️ Image Processing Pipeline

### 1. UPLOAD & PROCESS

When admin uploads an image:
```
[Original Image]
    ↓
[GD Library Process]
    ├─ Thumbnail: 200x200px (WebP + JPEG)
    ├─ Mobile: 400x300px (WebP + JPEG)
    ├─ Tablet: 800x600px (WebP + JPEG)
    └─ Desktop: 1200x900px (WebP + JPEG)
    ↓
[Store in Backend]
    └─ /backend/uploads/products/
```

### 2. DELIVERY

When browser requests image:
```
[Browser Request]
    ↓
[CDN (Cloudflare)]
    ├─ Cache HIT? → Return (instant)
    └─ Cache MISS?
        ↓
    [thumbs.php]
        ├─ Generate metadata
        ├─ Set cache headers
        └─ Return best format (WebP/JPEG)
        ↓
    [CDN Caches it]
        ↓
    [Browser displays]
```

---

## 💻 Implementation

### Step 1: Image Processing Library

**File:** `backend/image-processor.php`

```php
<?php
class ImageProcessor {
  private $uploadDir = '/backend/uploads/products/';
  
  // Generate multiple sizes from original image
  public function processProductImage($uploadedFile, $productRef) {
    $originalPath = $this->uploadDir . 'original/' . $productRef . '.jpg';
    move_uploaded_file($uploadedFile['tmp_name'], $originalPath);
    
    $image = imagecreatefromjpeg($originalPath);
    if (!$image) throw new Exception('Invalid image');
    
    // Generate sizes
    $this->generateSize($image, $productRef, 'thumb', 200, 200);      // 200x200
    $this->generateSize($image, $productRef, 'mobile', 400, 300);     // 400x300
    $this->generateSize($image, $productRef, 'tablet', 800, 600);     // 800x600
    $this->generateSize($image, $productRef, 'desktop', 1200, 900);   // 1200x900
    
    imagedestroy($image);
    
    return [
      'thumb' => "/uploads/products/{$productRef}/thumb.webp",
      'mobile' => "/uploads/products/{$productRef}/mobile.webp",
      'tablet' => "/uploads/products/{$productRef}/tablet.webp",
      'desktop' => "/uploads/products/{$productRef}/desktop.webp",
    ];
  }
  
  private function generateSize(&$image, $productRef, $sizeName, $width, $height) {
    // Resize with aspect ratio
    $resized = imagescale($image, $width, $height, IMG_BILINEAR_FIXED);
    
    // Create directory
    $dir = $this->uploadDir . $productRef . '/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    
    // Save as WebP (better compression)
    $webpPath = $dir . $sizeName . '.webp';
    imagewebp($resized, $webpPath, 80); // 80% quality
    
    // Also save JPEG for fallback
    $jpegPath = $dir . $sizeName . '.jpg';
    imagejpeg($resized, $jpegPath, 85); // 85% quality
    
    imagedestroy($resized);
  }
}
?>
```

### Step 2: Responsive Image Generator

**File:** `backend/image-url-generator.php`

```php
<?php
class ImageUrlGenerator {
  // Generate srcset for responsive images
  public static function generateSrcSet($productRef, $alt = '') {
    $baseUrl = 'https://yourdomain.com/uploads/products/' . $productRef;
    
    // Check browser support for WebP
    $supportsWebp = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'webp') !== false;
    
    $extension = $supportsWebp ? 'webp' : 'jpg';
    
    return [
      'srcset' => implode(', ', [
        "{$baseUrl}/thumb.{$extension} 200w",
        "{$baseUrl}/mobile.{$extension} 400w",
        "{$baseUrl}/tablet.{$extension} 800w",
        "{$baseUrl}/desktop.{$extension} 1200w",
      ]),
      'sizes' => '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px',
      'src' => "{$baseUrl}/mobile.{$extension}",
      'alt' => $alt,
    ];
  }
  
  // Generate picture element for best format
  public static function generatePictureElement($productRef, $alt = '') {
    $baseUrl = 'https://yourdomain.com/uploads/products/' . $productRef;
    
    return <<<HTML
      <picture>
        <source 
          srcset="
            {$baseUrl}/thumb.webp 200w,
            {$baseUrl}/mobile.webp 400w,
            {$baseUrl}/tablet.webp 800w,
            {$baseUrl}/desktop.webp 1200w
          "
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
          type="image/webp"
        />
        <img
          src="{$baseUrl}/mobile.jpg"
          srcset="
            {$baseUrl}/thumb.jpg 200w,
            {$baseUrl}/mobile.jpg 400w,
            {$baseUrl}/tablet.jpg 800w,
            {$baseUrl}/desktop.jpg 1200w
          "
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
          alt="{$alt}"
          loading="lazy"
          decoding="async"
        />
      </picture>
    HTML;
  }
}
?>
```

### Step 3: Updated thumbs.php (with caching headers)

```php
<?php
require 'db-config.php';

header('Content-Type: application/json');

// CORS headers (safe for CDN)
header('Access-Control-Allow-Origin: *');

// Cache control headers (critical for CDN)
header('Cache-Control: public, max-age=2592000, immutable'); // 30 days
header('ETag: "' . md5(file_get_contents(__FILE__)) . '"');
header('Expires: ' . date('D, d M Y H:i:s \G\M\T', time() + 2592000));

// Verify token
$token = getBearerToken();
if (!verifyJWT($token)) {
  http_response_code(401);
  die(json_encode(['error' => 'Unauthorized']));
}

// Get user to check WebP support
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$supportsWebp = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'webp') !== false;

// Fetch all products with images from database
$stmt = $db->prepare('
  SELECT p.ref, v.image, v.label
  FROM products p
  LEFT JOIN variations v ON p.id = v.product_id
  WHERE p.is_active = 1
');
$stmt->execute();
$results = $stmt->fetchAll();

$thumbs = [];
foreach ($results as $row) {
  $ext = $supportsWebp ? 'webp' : 'jpg';
  
  $thumbs[] = [
    'ref' => $row['ref'],
    'url' => "/uploads/products/{$row['ref']}/mobile.{$ext}",
    'srcset' => "/uploads/products/{$row['ref']}/thumb.{$ext} 200w, " .
                "/uploads/products/{$row['ref']}/mobile.{$ext} 400w, " .
                "/uploads/products/{$row['ref']}/tablet.{$ext} 800w, " .
                "/uploads/products/{$row['ref']}/desktop.{$ext} 1200w",
  ];
}

echo json_encode($thumbs);
?>
```

---

## 🌐 CDN Integration (Cloudflare)

### Why Cloudflare?
- ✅ Free tier (perfect for MVP)
- ✅ Global edge locations (fast delivery)
- ✅ Automatic image optimization
- ✅ WebP conversion built-in
- ✅ Cache everything > 30 days
- ✅ HTTPS/SSL free

### Setup (5 min)

1. **Create Cloudflare Account**
   - Go: https://dash.cloudflare.com/sign-up
   - Free tier sufficient

2. **Add Your Domain**
   - Points domain to Cloudflare nameservers
   - Automatic image optimization enabled

3. **Enable Caching Rules**
   ```
   // In Cloudflare Dashboard:
   Caching → Page Rules
   
   Rule 1: https://yourdomain.com/uploads/products/*
   → Cache Level: Cache Everything
   → Browser Cache TTL: 30 days
   → Edge Cache TTL: 30 days
   
   Rule 2: https://yourdomain.com/backend/thumbs.php
   → Cache Level: Cache Everything
   → Browser Cache TTL: 24 hours
   ```

4. **Image Optimization**
   ```
   Speed → Image Optimization
   ✅ Enable Polish (automatic optimization)
   ✅ Enable WebP (format conversion)
   ✅ Enable Auto Minify (CSS/JS)
   ```

---

## 🖼️ Frontend Implementation

### React Component with Lazy Loading

```tsx
// src/components/OptimizedImage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  productRef: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  productRef,
  alt,
  className = '',
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      // Preload high-priority images
      const img = new Image();
      img.src = `/uploads/products/${productRef}/mobile.webp`;
      return;
    }

    // Lazy load via Intersection Observer
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = imgRef.current.dataset.src || '';
          imgRef.current.srcset = imgRef.current.dataset.srcset || '';
          observer.unobserve(imgRef.current);
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [productRef, priority]);

  const basePath = `/uploads/products/${productRef}`;

  return (
    <picture>
      {/* WebP format (modern browsers) */}
      <source
        srcSet={priority ? `${basePath}/thumb.webp 200w, ${basePath}/mobile.webp 400w, ${basePath}/tablet.webp 800w` : ''}
        data-srcset={`${basePath}/thumb.webp 200w, ${basePath}/mobile.webp 400w, ${basePath}/tablet.webp 800w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
        type="image/webp"
      />

      {/* JPEG fallback */}
      <img
        ref={imgRef}
        src={priority ? `${basePath}/mobile.jpg` : '/placeholder-small.jpg'}
        data-src={`${basePath}/mobile.jpg`}
        data-srcset={`${basePath}/thumb.jpg 200w, ${basePath}/mobile.jpg 400w, ${basePath}/tablet.jpg 800w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-75'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </picture>
  );
};
```

### Usage in Product Card
```tsx
<OptimizedImage 
  productRef="AB001"
  alt="Bague Or Blanc"
  className="w-full h-64 object-cover rounded-lg"
  priority={false}
/>
```

---

## 🔄 Service Worker (Offline Support)

**File:** `public/service-worker.ts`

```typescript
// Cache version
const CACHE_NAME = 'catalogue-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/dist/style.css',
  '/dist/index.js',
  '/placeholder-small.jpg',
];

// Install: cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for images, network-first for APIs
  if (request.url.includes('/uploads/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((newResponse) => {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, newResponse.clone()));
          return newResponse;
        });
      })
    );
  } else {
    // Network-first for APIs
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
```

### Register in App.tsx
```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker registration failed', err));
  }
}, []);
```

---

## 📊 Performance Comparison

### Before (Current)
```
Request for: /backend/thumbs.php?ref=AB001
Response: JSON array (6KB)
Cache Headers: None
Load time: 1.5s (10 products)
```

### After (Optimized)
```
Request for: /uploads/products/AB001/mobile.webp
Response: WebP image (85KB → 50KB after compression)
Cache Headers: max-age=2592000 (30 days)
Load time: 0.3s (CDN cache hit)
           1.0s (first load, CDN caches)
```

---

## ✅ Testing Checklist

- [ ] GD library enabled (php -m | grep gd)
- [ ] Test image upload & processing
- [ ] Verify WebP generation
- [ ] Verify JPEG fallback
- [ ] Test lazy loading with DevTools
- [ ] CloudFlare caching active
- [ ] WebP served on modern browsers
- [ ] JPEG fallback on older browsers
- [ ] Lighthouse score ≥ 98
- [ ] Offline mode works (Service Worker)
- [ ] Mobile performance < 1s load

---

## 🚀 Deployment Steps

1. **Enable GD Library (Ionos)**
   - Contact support or check control panel
   - Verify: `php -i | grep -A 5 "GD Support"`

2. **Upload Image Processor**
   - Upload `backend/image-processor.php`
   - Create directory: `/backend/uploads/products/` (777 permissions)

3. **Configure CloudFlare**
   - Point domain to CloudFlare
   - Enable automatic image optimization
   - Set cache rules (30 days for images)

4. **Deploy Service Worker**
   - Upload `public/service-worker.js` to root
   - Update App.tsx with SW registration

5. **Test Performance**
   - Run Lighthouse audit
   - Test on mobile (4G throttled)
   - Verify offline access

---

## 💡 Best Practices

1. **Always use srcset** for responsive images
2. **Lazy load** images below fold
3. **Set cache headers** on image responses
4. **Use WebP** for modern browsers
5. **Provide JPEG** fallback for old browsers
6. **Preload** hero images (priority=true)
7. **Monitor** CloudFlare analytics
8. **Update** Service Worker when assets change

---

## 🔗 Resources

- **CloudFlare**: https://dash.cloudflare.com
- **WebP Guide**: https://developers.google.com/speed/webp
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Image Optimization**: https://web.dev/image-optimization/

---

## 🎯 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Image Load Time** | <1s | DevTools Network tab |
| **Cache Hit Rate** | 80%+ | CloudFlare Analytics |
| **WebP Usage** | 70%+ | CloudFlare Polish stats |
| **Lighthouse Score** | 98+ | PageSpeed Insights |
| **Mobile Performance** | <2s | WebPageTest (4G) |
| **Offline Access** | ✅ Works | DevTools Offline mode |

---

## 📝 Next: Task 3.4

After image optimization, enhance authentication with bcrypt, JWT, and RBAC.

---

**Images are the largest assets. Optimize them for lightning-fast delivery!** ⚡
