# Dropbox Auto-Gallery Setup Guide
## Rose Flower Shop - Automatic Image Gallery System

This guide will help you set up the automatic Dropbox gallery system so Anna can simply upload photos to Dropbox from her smartphone and they will appear automatically on the website.

---

## 📋 Overview

**What this does:**
- Anna uploads photos to Dropbox folders from her phone
- Website automatically detects new photos
- Photos appear in the gallery within minutes
- NO manual JSON editing needed
- NO coding required after initial setup

**Folder Structure:**
```
Rose-Flower-Shop-Gallery/
├── weddings-γαμοι/          (Wedding photos)
├── baptisms-βαφτισια/        (Baptism photos)
├── events-εκδηλωσεις/        (Event photos)
└── bouquets-μπουκετα/        (Bouquet photos)
```

---

## 🔧 One-Time Setup (15 minutes)

### Step 1: Create a Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Choose these settings:
   - **API**: Scoped access
   - **Type of access**: Full Dropbox
   - **Name**: `rose-flower-shop-gallery` (or any unique name)
4. Click **"Create app"**

### Step 2: Configure App Permissions

1. In your new app settings, click on **"Permissions"** tab
2. Enable these permissions:
   - ✅ `files.metadata.read`
   - ✅ `files.content.read`
   - ✅ `sharing.read`
   - ✅ `sharing.write`
3. Click **"Submit"** at the bottom

### Step 3: Generate Access Token

1. Go to the **"Settings"** tab
2. Scroll down to **"OAuth 2"** section
3. Under **"Generated access token"**, click **"Generate"**
4. Copy the token (starts with `sl.` - it's very long)
5. **IMPORTANT**: Save this token somewhere safe! You can't see it again.

### Step 4: Add Token to Website

**Option A: Using HTML Meta Tag (Recommended)**
1. Open `gallery.html` in a text editor
2. Find this line in the `<head>` section:
   ```html
   <meta name="dropbox-token" content="YOUR_DROPBOX_ACCESS_TOKEN">
   ```
3. Replace `YOUR_DROPBOX_ACCESS_TOKEN` with your actual token
4. Save the file

**Option B: Using Browser Console (Temporary Testing)**
1. Open the website gallery page
2. Press F12 to open browser console
3. Type:
   ```javascript
   localStorage.setItem('dropbox_access_token', 'YOUR_TOKEN_HERE');
   ```
4. Refresh the page

---

## 📱 How Anna Uses It (Daily Workflow)

### Adding New Photos

1. **Open Dropbox app** on smartphone
2. **Navigate to folder:**
   - For weddings: `Rose-Flower-Shop-Gallery/weddings-γαμοι/`
   - For baptisms: `Rose-Flower-Shop-Gallery/baptisms-βαφτισια/`
   - For events: `Rose-Flower-Shop-Gallery/events-εκδηλωσεις/`
   - For bouquets: `Rose-Flower-Shop-Gallery/bouquets-μπουκετα/`
3. **Upload photos** (tap + button, select photos)
4. **Done!** Photos will appear on website within 30 minutes

### Naming Photos (Optional)

The filename becomes the caption, so name them descriptively:

**Good examples:**
- `γαμηλια-ανθοδεσμη-1.jpg` → "Γαμηλια Ανθοδεσμη 1"
- `wedding-bouquet-roses.jpg` → "Wedding Bouquet Roses"
- `λευκα-τριανταφυλλα.jpg` → "Λευκα Τριανταφυλλα"

**Tips:**
- Use hyphens (-) instead of spaces
- Keep names simple and descriptive
- Photos appear in alphabetical order by filename

---

## 🔄 How Auto-Update Works

### Automatic Caching (Smart Loading)

The system uses intelligent caching to load fast:

1. **First visit**: Scans Dropbox, downloads image list, caches for 30 minutes
2. **Return visits**: Loads from cache instantly
3. **Manual refresh**: Click the refresh button to check for new photos immediately
4. **Auto-refresh**: Automatically checks for updates every 30 minutes

### Performance Features

- **Lazy loading**: Images load as you scroll down
- **Responsive images**: Different sizes for mobile/desktop
- **Thumbnail optimization**: Smaller preview images load first
- **Browser caching**: Faster repeat visits

---

## 🎨 Auto-Caption Generation

The system automatically creates captions from filenames:

### Greek to English Translation

Common words are auto-translated:

| Greek | English |
|-------|---------|
| γάμος, γαμηλια | wedding |
| νύφη | bride |
| ανθοδέσμη | bouquet |
| βάφτιση | baptism |
| τριαντάφυλλο | rose |
| λευκό | white |
| ροζ | pink |

### Example Transformations

```
filename: γαμηλια-ανθοδεσμη-τριανταφυλλα-1.jpg
Greek caption: Γαμηλια Ανθοδεσμη Τριανταφυλλα 1
English caption: Wedding Bouquet Roses 1

filename: baptism-white-flowers-2.jpg
Greek caption: Baptism White Flowers 2
English caption: Baptism White Flowers 2
```

---

## 🛠️ Troubleshooting

### Gallery Shows "Dropbox σύνδεση μη ρυθμισμένη"

**Problem**: Dropbox access token not configured
**Solution**: Follow Step 4 in setup to add your access token

### Photos Don't Appear After Upload

**Possible causes:**
1. **Cache hasn't expired yet** → Click refresh button on gallery page
2. **Wrong folder** → Check photos are in correct subfolder
3. **File format** → Only .jpg, .png, .webp files work
4. **Dropbox still uploading** → Wait a few minutes, especially for large files

### Some Photos Missing

**Check:**
1. File is actually uploaded (check Dropbox app)
2. File extension is supported (.jpg, .jpeg, .png, .webp)
3. Filename doesn't contain special characters (%, &, etc.)

### Click Refresh Button Not Working

**Solution:**
1. Check browser console for errors (F12)
2. Verify access token is correct
3. Check Dropbox app permissions are enabled

---

## 📊 Technical Details (For Developers)

### File Structure

```
project/
├── js/
│   ├── dropbox-scanner.js      # Dropbox API integration
│   ├── image-processor.js      # Caption generation
│   └── gallery.js              # Main gallery manager
└── gallery.html                # Gallery page
```

### API Endpoints Used

- `POST /2/files/list_folder` - List images in folders
- `POST /2/sharing/create_shared_link_with_settings` - Get public URLs
- `POST /2/sharing/list_shared_links` - Get existing links

### Caching Strategy

- **LocalStorage**: 30-minute cache for image metadata
- **Browser Cache**: Standard HTTP caching for images
- **Supabase**: Optional server-side cache (if configured)

### Security Notes

- Access token provides read-only access to Dropbox
- Token stored in meta tag (static site limitation)
- For production: Move to environment variables or server-side
- RLS policies ensure only active images are displayed

---

## 🚀 Advanced Features (Optional)

### Manual Sorting

Images are sorted alphabetically by filename. To control order:

**Number prefixes:**
```
01-best-wedding-bouquet.jpg    (shows first)
02-church-decoration.jpg       (shows second)
03-reception-centerpiece.jpg   (shows third)
```

### Hide/Remove Photos

**Option 1: Delete from Dropbox**
- Remove file from Dropbox folder
- Will disappear from gallery after cache expires

**Option 2: Move to archive folder** (Recommended)
- Create `_archive/` subfolder in each category
- Move old photos there
- They won't appear in gallery but stay backed up

### Batch Upload

1. Select multiple photos on phone
2. Upload all at once to Dropbox
3. All will appear together on next refresh

---

## 📞 Support

### Quick Reference Card for Anna

```
📱 HOW TO ADD PHOTOS TO WEBSITE:

1. Open Dropbox app
2. Go to: Rose-Flower-Shop-Gallery
3. Choose folder: weddings, baptisms, events, or bouquets
4. Tap + button
5. Select photos
6. Upload
7. Done! Photos appear automatically

💡 TIP: Name files descriptively
   Example: wedding-roses-white.jpg

🔄 To see photos immediately:
   Visit website → Click refresh button
```

### Common Questions

**Q: How many photos can I upload at once?**
A: As many as you want! Upload in batches of 10-20 for best results.

**Q: What happens to old photos?**
A: They stay in the gallery unless you delete them from Dropbox.

**Q: Can I reorganize photos?**
A: Yes, rename files with number prefixes (01-, 02-, etc.) to control order.

**Q: Do I need to do anything after uploading?**
A: No! Just upload to Dropbox and photos appear automatically.

---

## 🎯 Next Steps

### After Setup Complete:

1. ✅ Test upload one photo to each folder
2. ✅ Verify photos appear on website
3. ✅ Test refresh button works
4. ✅ Check photos display on mobile
5. ✅ Save access token somewhere safe
6. ✅ Print Quick Reference Card for Anna

### Future Enhancements:

- [ ] Add photo descriptions (not just captions)
- [ ] Categories can be added/modified
- [ ] Bulk actions (hide/show multiple photos)
- [ ] Photo upload date display
- [ ] Search/filter by keywords

---

## 📝 Maintenance

### Monthly Tasks

- Check Dropbox storage usage
- Archive very old photos to save space
- Review and remove blurry/duplicate photos

### Yearly Tasks

- Refresh Dropbox access token (they can expire)
- Review gallery categories, add new if needed
- Backup all photos to external drive

---

**Setup Complete!** 🎉

Anna can now manage the gallery simply by uploading photos to Dropbox from her phone. No technical knowledge needed!
