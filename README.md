# Rose Flower Shop - Static Website

This is a static website for Rose Flower Shop, designed for GitHub Pages.

## Project Structure
```
flower-shop-static/
├── index.html        # Homepage
├── about.html        # About page
├── services.html     # Services page
├── gallery.html      # Gallery page (with Dropbox auto-update)
├── contact.html      # Contact page
├── css/
│   └── main.css      # Custom styles
├── js/
│   ├── main.js              # Shared functionality (menu, etc)
│   ├── language-toggle.js   # Translation system
│   ├── dropbox-scanner.js   # Dropbox API integration
│   ├── image-processor.js   # Auto-caption generation
│   ├── gallery.js           # Gallery manager with auto-update
│   └── contact-form.js      # Contact form handler
├── lang/
│   ├── en.json       # English translations
│   └── el.json       # Greek translations
├── DROPBOX_SETUP_GUIDE.md   # Complete Dropbox setup instructions
└── QUICK_START_ANNA.md      # Simple guide for Anna (Greek)
```

## How to Deploy on GitHub Pages

1.  **Clone/Upload**: Upload the contents of the `flower-shop-static` folder to your GitHub repository.
2.  **Settings**: Go to your repository Settings > Pages.
3.  **Source**: Select "Deploy from branch" and choose `main` (or `master`) and the root folder `/` (if you uploaded the *contents* to the root) or `/flower-shop-static` if you kept the folder.
    *   *Recommendation*: Push the *contents* of `flower-shop-static` to the root of your repo for `username.github.io/repo/` URL.
4.  **Save**: Click Save. Your site will be live in a few minutes.

## How to Edit Content

### Changing Text
All text is stored in `lang/en.json` (English) and `lang/el.json` (Greek).
1.  Open the JSON file.
2.  Find the key you want to change (e.g., `"heroTitle"`).
3.  Update the text inside the quotes.
    *   *Note*: Keep valid JSON format (quotes around keys and values, commas at end of lines except the last one).

### Changing Images
1.  Replace the image URLs in the HTML files.
2.  Currently, images are loaded from Pexels (placeholders).
3.  To use your own images:
    *   Create an `images` folder.
    *   Put your photos there.
    *   Update HTML `src` tags: `src="images/my-photo.jpg"`.

### Changing Colors/Styles
1.  Basic colors are set in `css/main.css` variables (`--color-rose-600`, etc).
2.  The site uses Tailwind CSS via CDN. You can edit classes directly in the HTML (e.g., change `text-rose-600` to `text-blue-600`).

## Auto-Updating Gallery System

The website now features an **automatic Dropbox-powered gallery** that allows Anna to update gallery images simply by uploading photos to Dropbox from her smartphone - NO manual editing required!

### How It Works

1. **Anna uploads photos** to Dropbox folders from her phone
2. **Website automatically scans** the Dropbox folders
3. **Images appear automatically** in the gallery
4. **Captions are auto-generated** from filenames in both Greek and English

### Setup Required (One-Time)

See **[DROPBOX_SETUP_GUIDE.md](DROPBOX_SETUP_GUIDE.md)** for complete setup instructions.

**Quick setup:**
1. Create a Dropbox App at [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Enable required permissions: `files.metadata.read`, `files.content.read`, `sharing.read`, `sharing.write`
3. Generate access token
4. Add token to `gallery.html` meta tag:
   ```html
   <meta name="dropbox-token" content="YOUR_DROPBOX_ACCESS_TOKEN">
   ```

### For Anna (Daily Use)

See **[QUICK_START_ANNA.md](QUICK_START_ANNA.md)** for simple Greek instructions.

**Quick workflow:**
1. Open Dropbox app on phone
2. Navigate to correct folder (weddings, baptisms, events, or bouquets)
3. Upload photos
4. Photos appear automatically on website!

### Folder Structure in Dropbox

```
Rose-Flower-Shop-Gallery/
├── weddings-γαμοι/          # Wedding photos
├── baptisms-βαφτισια/        # Baptism photos
├── events-εκδηλωσεις/        # Event photos
└── bouquets-μπουκετα/        # Bouquet photos
```

### Features

- ✅ **Zero manual editing** - just upload to Dropbox
- ✅ **Auto-caption generation** - from filenames in Greek & English
- ✅ **Smart caching** - 30-minute cache for fast loading
- ✅ **Lazy loading** - images load as you scroll
- ✅ **Responsive images** - optimized for mobile & desktop
- ✅ **Category filtering** - automatic based on folder
- ✅ **Manual refresh** - click button to see new photos immediately
- ✅ **Bilingual support** - captions in both Greek and English

## Dependencies
*   **Tailwind CSS**: Loaded via CDN (no build step required).
*   **Fonts**: Inter and Playfair Display from Google Fonts.
*   **Icons**: SVG icons embedded directly in HTML (Lucide style).
*   **Dropbox API**: For automatic gallery updates.
