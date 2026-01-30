# Technical Documentation
## Dropbox Auto-Gallery System Architecture

---

## Overview

The Rose Flower Shop website implements an automatic gallery system that fetches images from Dropbox folders without requiring manual JSON editing. This document describes the technical implementation.

---

## System Architecture

```
┌─────────────┐
│   Dropbox   │
│   Storage   │
└──────┬──────┘
       │
       │ Dropbox API v2
       ▼
┌─────────────────────┐
│ DropboxScanner.js   │ ← Scans folders, gets image metadata
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ImageProcessor.js   │ ← Generates captions, processes metadata
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   GalleryManager    │ ← Renders gallery, handles UI
│   (gallery.js)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌─────────────────┐
│  LocalStorage       │     │    Supabase     │
│  Cache (30min)      │     │  (Optional DB)  │
└─────────────────────┘     └─────────────────┘
```

---

## Component Details

### 1. DropboxScanner (dropbox-scanner.js)

**Purpose**: Interfaces with Dropbox API to scan folders and retrieve image metadata.

**Key Methods**:

```javascript
class DropboxScanner {
  constructor(accessToken, sharedLink)

  // Main entry point
  async scanAllFolders() → Array<ImageData>

  // Scan a single folder
  async scanFolder(folderPath, category) → Array<ImageData>

  // Get shareable links for images
  async getSharedLink(path) → string
  async getExistingSharedLink(path) → string

  // Caching
  async refreshCache() → Array<ImageData>
  getCachedImages(maxAgeMinutes) → Array<ImageData>
  async getImages(useCache) → Array<ImageData>
}
```

**Data Flow**:
1. Calls Dropbox API `/files/list_folder` for each category folder
2. Filters for image files (.jpg, .png, .webp)
3. Creates shared links via `/sharing/create_shared_link_with_settings`
4. Converts Dropbox URLs to direct download URLs
5. Caches results in LocalStorage

**API Endpoints Used**:
- `POST https://api.dropboxapi.com/2/files/list_folder`
- `POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`
- `POST https://api.dropboxapi.com/2/sharing/list_shared_links`

---

### 2. ImageProcessor (image-processor.js)

**Purpose**: Processes raw image metadata, generates captions, and prepares data for display.

**Key Methods**:

```javascript
class ImageProcessor {
  constructor()

  // Process a single image
  processImage(imageData, language) → ProcessedImage

  // Generate caption from filename
  generateCaption(filename, language) → string

  // Translate Greek to English
  translateToEnglish(greekText) → string

  // Sort and filter
  sortImages(images, sortBy) → Array<ProcessedImage>
  filterByCategory(images, category) → Array<ProcessedImage>

  // Batch processing
  batchProcess(images, language) → Array<ProcessedImage>

  // Responsive images
  generateOptimizedUrl(url, width, quality) → string
  createResponsiveSrcSet(url) → string
}
```

**Caption Generation Logic**:

1. **Filename Parsing**:
   ```
   Input: γαμηλια-ανθοδεσμη-1.jpg
   Remove extension: γαμηλια-ανθοδεσμη-1
   Replace hyphens: γαμηλια ανθοδεσμη 1
   Capitalize: Γαμηλια Ανθοδεσμη 1
   ```

2. **Greek to English Translation**:
   - Dictionary-based word lookup
   - Preserves numbers
   - Capitalizes words
   ```
   γαμηλια → wedding
   ανθοδεσμη → bouquet
   Result: Wedding Bouquet 1
   ```

**Translation Dictionary** (extensible):
```javascript
{
  'γάμος': 'wedding',
  'νύφη': 'bride',
  'ανθοδέσμη': 'bouquet',
  'βάφτιση': 'baptism',
  'τριαντάφυλλο': 'rose',
  // ... 40+ common flower/event terms
}
```

---

### 3. GalleryManager (gallery.js)

**Purpose**: Main orchestrator - manages UI, coordinates scanning/processing, handles user interactions.

**Key Methods**:

```javascript
class GalleryManager {
  constructor()

  // Initialization
  async init()
  getDropboxToken() → string

  // Gallery loading
  async loadGallery(forceRefresh) → void
  showLoading() → void
  renderGallery() → void

  // UI rendering
  createGalleryItem(image, index) → HTMLElement
  attachLightboxHandlers() → void

  // Lightbox
  showLightbox(index) → void
  closeLightbox() → void

  // Filtering
  filterGallery(category) → void

  // Fallback
  showFallbackGallery() → void

  // Event handling
  setupEventListeners() → void
}
```

**Initialization Flow**:

```
Page Load
    ↓
GalleryManager.init()
    ↓
Get Dropbox Token (from meta tag or localStorage)
    ↓
Check LocalStorage cache (30min TTL)
    ↓
Cache Hit?
    ├─ Yes → Load from cache, async refresh in background
    └─ No  → Call DropboxScanner.scanAllFolders()
              ↓
         ImageProcessor.batchProcess()
              ↓
         Render Gallery
              ↓
         Cache results
```

**Rendering Pipeline**:

```
Gallery Data (Array)
    ↓
Filter by category
    ↓
Sort by filename/date
    ↓
For each image:
    ├─ Create <div> with responsive images
    ├─ Add hover effects
    ├─ Attach lightbox handler
    └─ Lazy load setup
    ↓
Append to DOM
```

---

## Caching Strategy

### Three-Layer Cache

1. **Browser HTTP Cache**
   - Images cached by browser
   - Standard HTTP headers
   - Fastest for repeat views

2. **LocalStorage Cache** (Primary)
   ```javascript
   {
     images: Array<ImageData>,
     timestamp: ISO8601,
     version: "1.0"
   }
   ```
   - TTL: 30 minutes
   - Checked on page load
   - Refreshed in background

3. **Supabase Database** (Optional)
   - Server-side cache
   - Shared across users
   - Used for analytics/admin

### Cache Invalidation

- **Time-based**: Auto-expire after 30 minutes
- **Manual**: Refresh button clears cache
- **Smart**: Background refresh doesn't block UI

---

## Performance Optimizations

### 1. Lazy Loading

```javascript
// Images load as they enter viewport
<img loading="lazy" src="..." />
```

### 2. Responsive Images

```javascript
srcset="
  image.jpg?w=400 400w,
  image.jpg?w=800 800w,
  image.jpg?w=1200 1200w
"
sizes="(max-width: 640px) 100vw, 33vw"
```

### 3. Thumbnail Optimization

- Smaller previews load first
- Full resolution loads in lightbox only

### 4. Batch Operations

```javascript
// Process all images at once
const processed = processor.batchProcess(images, language);
```

### 5. Async/Await Pattern

```javascript
// Non-blocking operations
async loadGallery() {
  const cached = getCachedImages();
  if (cached) {
    renderGallery(cached);
    refreshCache(); // Background update
  } else {
    const fresh = await scanDropbox();
    renderGallery(fresh);
  }
}
```

---

## Security Considerations

### Access Token Storage

**Current Implementation** (Static Site):
```html
<meta name="dropbox-token" content="TOKEN_HERE">
```

**Limitations**:
- Token visible in HTML source
- Read-only access (mitigated risk)
- Acceptable for static sites

**Production Recommendations**:
1. **Environment Variables** (if using build tool)
2. **Server-Side Proxy** (hide token completely)
3. **Supabase Edge Function** (token in environment)

### Dropbox Permissions

**Required (Minimal)**:
- ✅ `files.metadata.read` - List folder contents
- ✅ `files.content.read` - Read files (for thumbnails)
- ✅ `sharing.read` - Get shared links
- ✅ `sharing.write` - Create shared links

**NOT Required**:
- ❌ `files.content.write` - No write access
- ❌ `account_info.read` - No account access
- ❌ Any admin permissions

### RLS (Row Level Security) - Supabase

```sql
-- Gallery images: Public read for active images only
CREATE POLICY "Anyone can view active gallery images"
  ON gallery_images FOR SELECT
  USING (is_active = true);

-- Sync logs: Public read
CREATE POLICY "Anyone can view sync logs"
  ON gallery_sync_log FOR SELECT
  USING (true);
```

---

## API Rate Limits

### Dropbox API Limits

- **Individual user**: 12,000 requests/hour
- **App**: 750 requests/second

### Our Usage

```
Per Page Load:
  - 4 folder scans = 4 API calls
  - Average 10 images/folder = 40 shared link lookups
  - Total: ~44 API calls per scan

With 30min cache:
  - Max scans/hour: 2
  - API calls/hour: ~88
  - Well under limits ✅
```

### Cache Benefits

- Reduces API calls by 95%
- Faster page loads
- Better user experience
- Stays within free tier

---

## Error Handling

### Dropbox API Errors

```javascript
try {
  const images = await scanner.scanAllFolders();
  if (!images || images.length === 0) {
    showFallbackGallery();
  }
} catch (error) {
  console.error('Dropbox scan failed:', error);
  showFallbackGallery();
}
```

### Fallback Strategy

1. **Primary**: Live Dropbox scan
2. **Fallback 1**: LocalStorage cache (even if expired)
3. **Fallback 2**: Static HTML images (hardcoded)
4. **Fallback 3**: "Configure Dropbox" message

### User-Friendly Messages

```javascript
// Not configured
"Dropbox σύνδεση μη ρυθμισμένη"
"Για να ενεργοποιήσετε..."

// Loading
"Φόρτωση γκαλερί..."

// No images
"Δεν βρέθηκαν φωτογραφίες"
```

---

## Database Schema (Supabase)

### gallery_images

```sql
CREATE TABLE gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  category text NOT NULL CHECK (category IN ('weddings', 'baptisms', 'events', 'bouquets')),
  dropbox_path text NOT NULL UNIQUE,
  dropbox_id text,
  public_url text NOT NULL,
  thumbnail_url text,
  caption_el text DEFAULT '',
  caption_en text DEFAULT '',
  file_size bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  last_synced timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### gallery_sync_log

```sql
CREATE TABLE gallery_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  images_found integer DEFAULT 0,
  images_added integer DEFAULT 0,
  images_updated integer DEFAULT 0,
  images_removed integer DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'success', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_gallery_images_category ON gallery_images(category);
CREATE INDEX idx_gallery_images_active ON gallery_images(is_active);
CREATE INDEX idx_gallery_images_order ON gallery_images(display_order DESC, created_at DESC);
```

---

## Testing

### Manual Testing Checklist

- [ ] Upload image to each category folder
- [ ] Verify images appear (30min or refresh)
- [ ] Test category filtering
- [ ] Test lightbox functionality
- [ ] Test language switching
- [ ] Test mobile responsive design
- [ ] Test lazy loading
- [ ] Verify captions (Greek & English)
- [ ] Test cache refresh button
- [ ] Test offline fallback

### Browser Console Tests

```javascript
// Test scanner
const scanner = new DropboxScanner('TOKEN', 'LINK');
const images = await scanner.scanAllFolders();
console.log(images);

// Test processor
const processor = new ImageProcessor();
const processed = processor.batchProcess(images, 'el');
console.log(processed);

// Test cache
const cached = scanner.getCachedImages();
console.log(cached);

// Clear cache
localStorage.removeItem('dropbox_gallery_cache');
```

---

## Future Enhancements

### Planned Features

1. **Admin Panel**
   - Edit captions manually
   - Reorder images (drag & drop)
   - Bulk hide/show
   - Category management

2. **Advanced Caching**
   - Service Worker for offline support
   - Progressive Web App (PWA)
   - Image CDN integration

3. **Analytics**
   - Track popular images
   - View counts per category
   - Upload frequency metrics

4. **Automation**
   - Scheduled Dropbox syncs
   - Auto-resize oversized images
   - Duplicate detection

5. **Search & Filter**
   - Search by caption
   - Date range filtering
   - Color-based filtering

### Technical Debt

- [ ] Add TypeScript types
- [ ] Unit tests for processors
- [ ] E2E tests with Playwright
- [ ] Error boundary components
- [ ] Monitoring & logging
- [ ] Performance profiling

---

## Deployment

### GitHub Pages

```bash
# Current setup (static site)
git add .
git commit -m "Update gallery"
git push origin main

# Site automatically updates
```

### With Build Step (Optional)

```javascript
// package.json
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Environment Variables

```env
VITE_DROPBOX_TOKEN=your_token_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Troubleshooting

### Common Issues

**Issue**: "Dropbox σύνδεση μη ρυθμισμένη"
- **Cause**: Token not configured
- **Fix**: Add token to meta tag in gallery.html

**Issue**: Images not appearing
- **Cause**: Cache not expired
- **Fix**: Click refresh button

**Issue**: CORS errors in console
- **Cause**: Dropbox API restrictions
- **Fix**: Verify API permissions are enabled

**Issue**: Slow loading
- **Cause**: Too many images, no cache
- **Fix**: Implement pagination, increase cache TTL

**Issue**: Wrong captions
- **Cause**: Translation dictionary incomplete
- **Fix**: Add missing translations to ImageProcessor

---

## Contributing

### Code Style

- ES6+ JavaScript
- Async/await (not callbacks)
- Class-based components
- JSDoc comments for public methods

### Adding Translations

```javascript
// image-processor.js
this.greekToEnglishMap = {
  'νέα_λέξη': 'new_word',
  // Add here
};
```

### Testing Changes

```bash
# Serve locally
python -m http.server 8000
# or
npx serve .

# Test in browser
open http://localhost:8000/gallery.html
```

---

## Support & Maintenance

### Monitoring

- Check Dropbox API usage monthly
- Review error logs in browser console
- Monitor cache hit rates
- Track page load times

### Updates

- Dropbox API version changes
- Token expiration (refresh annually)
- Browser compatibility
- Security patches

---

## License & Credits

**Built for**: Rose Flower Shop, Rethymno, Crete
**Owner**: Anna Ntakakh
**Technology Stack**: Vanilla JavaScript, Tailwind CSS, Dropbox API, Supabase
**License**: Proprietary

---

**Last Updated**: January 2026
**Version**: 1.0.0
