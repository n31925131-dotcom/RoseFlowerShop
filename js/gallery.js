class GalleryManager {
  constructor() {
    this.dropboxAccessToken = this.getDropboxToken();
    this.dropboxSharedLink = 'https://www.dropbox.com/scl/fo/oiblsau70d5mmtw8kd0k7/AIuZ7aXvZe1euP-gObY-xJM?rlkey=8ehbej0bwnapshnm28z8t5b01&st=vf4u7cu2&dl=0';

    this.scanner = new DropboxScanner(this.dropboxAccessToken, this.dropboxSharedLink);
    this.processor = new ImageProcessor();

    this.currentFilter = 'all';
    this.currentLanguage = localStorage.getItem('language') || 'el';
    this.galleryData = [];

    this.grid = document.getElementById('gallery-grid');
    this.lightbox = document.getElementById('lightbox');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxTitle = document.getElementById('lightbox-title');
    this.lightboxDesc = document.getElementById('lightbox-desc');
  }

  getDropboxToken() {
    const metaTag = document.querySelector('meta[name="dropbox-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    const scriptTag = document.querySelector('script[data-dropbox-token]');
    if (scriptTag) {
      return scriptTag.getAttribute('data-dropbox-token');
    }

    return localStorage.getItem('dropbox_access_token') || 'YOUR_DROPBOX_ACCESS_TOKEN';
  }

  async init() {
    this.setupEventListeners();
    await this.loadGallery();
  }

  async loadGallery(forceRefresh = false) {
    this.showLoading();

    try {
      let images = await this.scanner.getImages(!forceRefresh);

      if (!images || images.length === 0) {
        this.showFallbackGallery();
        return;
      }

      this.galleryData = this.processor.batchProcess(images, this.currentLanguage);
      this.renderGallery();
    } catch (error) {
      console.error('Error loading gallery:', error);
      this.showFallbackGallery();
    }
  }

  showLoading() {
    if (!this.grid) return;

    this.grid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rose-600 border-t-transparent"></div>
        <p class="mt-4 text-gray-600" data-i18n="gallery.loading">Φόρτωση γκαλερί...</p>
      </div>
    `;
  }

  renderGallery() {
    if (!this.grid) return;

    const filtered = this.processor.filterByCategory(this.galleryData, this.currentFilter);
    const sorted = this.processor.sortImages(filtered, 'filename');

    if (sorted.length === 0) {
      this.grid.innerHTML = `
        <div class="col-span-full text-center py-20 text-gray-600">
          <p data-i18n="gallery.noImages">Δεν βρέθηκαν φωτογραφίες</p>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = '';

    sorted.forEach((image, index) => {
      const item = this.createGalleryItem(image, index);
      this.grid.appendChild(item);
    });

    this.attachLightboxHandlers();
  }

  createGalleryItem(image, index) {
    const div = document.createElement('div');
    div.className = 'gallery-item group cursor-pointer';
    div.dataset.category = image.category;
    div.dataset.index = index;

    const srcset = this.processor.createResponsiveSrcSet(image.url);
    const sizes = this.processor.getSizesAttribute();

    div.innerHTML = `
      <div class="relative h-80 rounded-xl overflow-hidden shadow-md">
        <img
          src="${image.thumbnail || image.url}"
          srcset="${srcset}"
          sizes="${sizes}"
          alt="${image.caption}"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <h3 class="text-white font-medium">${image.caption}</h3>
        </div>
      </div>
    `;

    return div;
  }

  attachLightboxHandlers() {
    const items = this.grid.querySelectorAll('.gallery-item');

    items.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.showLightbox(index);
      });
    });
  }

  showLightbox(index) {
    if (!this.lightbox || !this.galleryData[index]) return;

    const image = this.galleryData[index];

    this.lightboxImg.src = image.url;
    this.lightboxTitle.textContent = image.caption;
    this.lightboxDesc.textContent = image.filename;

    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    if (!this.lightbox) return;

    this.lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  filterGallery(category) {
    this.currentFilter = category;
    this.renderGallery();
  }

  setupEventListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.classList.remove('bg-rose-600', 'text-white');
          b.classList.add('bg-gray-100', 'text-gray-700');
        });

        btn.classList.remove('bg-gray-100', 'text-gray-700');
        btn.classList.add('bg-rose-600', 'text-white');

        const filter = btn.getAttribute('data-filter');
        this.filterGallery(filter);
      });
    });

    const closeLightbox = document.querySelector('.close-lightbox');
    if (closeLightbox) {
      closeLightbox.addEventListener('click', () => this.closeLightbox());
    }

    if (this.lightbox) {
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.lightbox && this.lightbox.classList.contains('active')) {
        this.closeLightbox();
      }
    });

    window.addEventListener('languageChanged', (e) => {
      this.currentLanguage = e.detail.language;
      this.galleryData = this.processor.batchProcess(
        this.galleryData.map(img => ({
          ...img,
          filename: img.filename,
          category: img.category,
          url: img.url,
          thumbnail: img.thumbnail,
          id: img.id,
          modified: img.modified
        })),
        this.currentLanguage
      );
      this.renderGallery();
    });

    const refreshBtn = document.getElementById('refresh-gallery');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadGallery(true);
      });
    }
  }

  showFallbackGallery() {
    const staticItems = document.querySelectorAll('.gallery-item');

    if (staticItems.length > 0) {
      this.grid.innerHTML = '';

      staticItems.forEach(item => {
        this.grid.appendChild(item.cloneNode(true));
      });

      this.attachLightboxHandlers();
    } else {
      this.grid.innerHTML = `
        <div class="col-span-full text-center py-20">
          <div class="max-w-md mx-auto">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Dropbox σύνδεση μη ρυθμισμένη</h3>
            <p class="text-gray-600 mb-4">Για να ενεργοποιήσετε την αυτόματη ενημέρωση του γκαλερί, παρακαλώ ρυθμίστε το Dropbox access token.</p>
            <a href="#setup" class="text-rose-600 hover:text-rose-700 font-medium">Οδηγίες ρύθμισης →</a>
          </div>
        </div>
      `;
    }
  }
}

let galleryManager;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery-grid')) {
    galleryManager = new GalleryManager();
    galleryManager.init();
  }
});
