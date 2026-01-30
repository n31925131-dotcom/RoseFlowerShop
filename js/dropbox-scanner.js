class DropboxScanner {
  constructor(accessToken, sharedLink) {
    this.accessToken = accessToken;
    this.sharedLink = sharedLink;
    this.apiEndpoint = 'https://api.dropboxapi.com/2';

    this.categoryFolders = {
      'weddings-γαμοι': { en: 'Weddings', el: 'Γάμοι', filter: 'weddings' },
      'baptisms-βαφτισια': { en: 'Baptisms', el: 'Βαφτίσια', filter: 'baptisms' },
      'events-εκδηλωσεις': { en: 'Events', el: 'Εκδηλώσεις', filter: 'events' },
      'bouquets-μπουκετα': { en: 'Bouquets', el: 'Μπουκέτα', filter: 'bouquets' }
    };
  }

  async scanAllFolders() {
    if (!this.accessToken || this.accessToken === 'YOUR_DROPBOX_ACCESS_TOKEN') {
      console.warn('Dropbox access token not configured');
      return null;
    }

    try {
      const allImages = [];

      for (const [folderName, categoryInfo] of Object.entries(this.categoryFolders)) {
        const images = await this.scanFolder(folderName, categoryInfo.filter);
        allImages.push(...images);
      }

      return allImages;
    } catch (error) {
      console.error('Error scanning Dropbox folders:', error);
      return null;
    }
  }

  async scanFolder(folderPath, category) {
    try {
      const response = await fetch(`${this.apiEndpoint}/files/list_folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/${folderPath}`,
          recursive: false,
          include_media_info: true,
          include_deleted: false
        })
      });

      if (!response.ok) {
        console.error(`Failed to scan folder ${folderPath}:`, await response.text());
        return [];
      }

      const data = await response.json();
      const images = [];

      for (const entry of data.entries) {
        if (entry['.tag'] === 'file' && this.isImageFile(entry.name)) {
          const imageData = await this.getImageData(entry, category);
          if (imageData) {
            images.push(imageData);
          }
        }
      }

      return images;
    } catch (error) {
      console.error(`Error scanning folder ${folderPath}:`, error);
      return [];
    }
  }

  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  async getImageData(entry, category) {
    try {
      const sharedLink = await this.getSharedLink(entry.path_lower);

      if (!sharedLink) {
        return null;
      }

      const directUrl = this.convertToDirectUrl(sharedLink);
      const thumbnailUrl = this.getThumbnailUrl(directUrl);

      return {
        filename: entry.name,
        path: entry.path_lower,
        category: category,
        url: directUrl,
        thumbnail: thumbnailUrl,
        size: entry.size,
        modified: entry.client_modified || entry.server_modified,
        id: entry.id
      };
    } catch (error) {
      console.error(`Error getting image data for ${entry.name}:`, error);
      return null;
    }
  }

  async getSharedLink(path) {
    try {
      const response = await fetch(`${this.apiEndpoint}/sharing/create_shared_link_with_settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          settings: {
            requested_visibility: 'public'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }

      if (response.status === 409) {
        const existingLink = await this.getExistingSharedLink(path);
        return existingLink;
      }

      return null;
    } catch (error) {
      console.error(`Error creating shared link for ${path}:`, error);
      return null;
    }
  }

  async getExistingSharedLink(path) {
    try {
      const response = await fetch(`${this.apiEndpoint}/sharing/list_shared_links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          direct_only: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.links && data.links.length > 0) {
          return data.links[0].url;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting existing shared link:', error);
      return null;
    }
  }

  convertToDirectUrl(dropboxUrl) {
    if (!dropboxUrl) return null;
    return dropboxUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }

  getThumbnailUrl(directUrl, size = 'w640h480') {
    if (!directUrl) return null;
    return `https://www.dropbox.com/s/${this.extractFileId(directUrl)}?raw=1&size=${size}`;
  }

  extractFileId(url) {
    const match = url.match(/\/s\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  async refreshCache() {
    const images = await this.scanAllFolders();

    if (images && images.length > 0) {
      localStorage.setItem('dropbox_gallery_cache', JSON.stringify({
        images: images,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));

      return images;
    }

    return null;
  }

  getCachedImages(maxAgeMinutes = 30) {
    try {
      const cached = localStorage.getItem('dropbox_gallery_cache');

      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);
      const cacheAge = (new Date() - new Date(data.timestamp)) / 1000 / 60;

      if (cacheAge > maxAgeMinutes) {
        return null;
      }

      return data.images;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  async getImages(useCache = true) {
    if (useCache) {
      const cached = this.getCachedImages();
      if (cached) {
        this.refreshCache();
        return cached;
      }
    }

    return await this.refreshCache();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DropboxScanner;
}
