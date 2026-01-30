class ImageProcessor {
  constructor() {
    this.greekToEnglishMap = {
      'γάμος': 'wedding',
      'γαμος': 'wedding',
      'γαμηλια': 'wedding',
      'γαμηλιο': 'wedding',
      'νύφη': 'bride',
      'νυφη': 'bride',
      'γαμπρός': 'groom',
      'γαμπρος': 'groom',
      'ανθοδέσμη': 'bouquet',
      'ανθοδεσμη': 'bouquet',
      'μπουκέτο': 'bouquet',
      'μπουκετο': 'bouquet',
      'διακόσμηση': 'decoration',
      'διακοσμηση': 'decoration',
      'στολισμός': 'decoration',
      'στολισμος': 'decoration',
      'εκκλησία': 'church',
      'εκκλησια': 'church',
      'δεξίωση': 'reception',
      'δεξιωση': 'reception',
      'βάφτιση': 'baptism',
      'βαφτιση': 'baptism',
      'βαφτίσια': 'baptism',
      'βαφτισια': 'baptism',
      'κολυμπήθρα': 'font',
      'κολυμπηθρα': 'font',
      'λαμπάδα': 'candle',
      'λαμπαδα': 'candle',
      'εκδήλωση': 'event',
      'εκδηλωση': 'event',
      'πάρτι': 'party',
      'παρτι': 'party',
      'γενέθλια': 'birthday',
      'γενεθλια': 'birthday',
      'επέτειος': 'anniversary',
      'επετειος': 'anniversary',
      'τριαντάφυλλο': 'rose',
      'τριανταφυλλο': 'rose',
      'τριαντάφυλλα': 'roses',
      'τριανταφυλλα': 'roses',
      'λουλούδι': 'flower',
      'λουλουδι': 'flower',
      'λουλούδια': 'flowers',
      'λουλουδια': 'flowers',
      'άνοιξη': 'spring',
      'ανοιξη': 'spring',
      'καλοκαίρι': 'summer',
      'καλοκαιρι': 'summer',
      'φθινόπωρο': 'autumn',
      'φθινοπωρο': 'autumn',
      'χειμώνας': 'winter',
      'χειμωνας': 'winter',
      'ρομαντικό': 'romantic',
      'ρομαντικο': 'romantic',
      'κλασικό': 'classic',
      'κλασικο': 'classic',
      'μοντέρνο': 'modern',
      'μοντερνο': 'modern',
      'κομψό': 'elegant',
      'κομψο': 'elegant',
      'λευκό': 'white',
      'λευκο': 'white',
      'ροζ': 'pink',
      'κόκκινο': 'red',
      'κοκκινο': 'red',
      'μωβ': 'purple',
      'μπλε': 'blue'
    };
  }

  processImage(imageData, language = 'el') {
    const captionEl = this.generateCaption(imageData.filename, 'el');
    const captionEn = this.generateCaption(imageData.filename, 'en');

    return {
      ...imageData,
      caption_el: captionEl,
      caption_en: captionEn,
      display_caption: language === 'en' ? captionEn : captionEl
    };
  }

  generateCaption(filename, language = 'el') {
    let name = filename;
    const lastDot = name.lastIndexOf('.');
    if (lastDot > 0) {
      name = name.substring(0, lastDot);
    }

    name = name.replace(/[-_]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();

    if (language === 'en') {
      name = this.translateToEnglish(name);
      name = this.capitalizeWords(name);
    } else {
      name = this.capitalizeGreek(name);
    }

    return name;
  }

  translateToEnglish(greekText) {
    const words = greekText.toLowerCase().split(' ');
    const translatedWords = words.map(word => {
      const cleaned = word.replace(/[0-9]/g, '').trim();
      const translation = this.greekToEnglishMap[cleaned];

      if (translation) {
        const numbers = word.match(/[0-9]+/);
        return numbers ? `${translation} ${numbers[0]}` : translation;
      }

      return word;
    });

    return translatedWords.join(' ');
  }

  capitalizeWords(text) {
    return text.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  capitalizeGreek(text) {
    return text.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  sortImages(images, sortBy = 'filename') {
    const sorted = [...images];

    switch (sortBy) {
      case 'filename':
        return sorted.sort((a, b) => a.filename.localeCompare(b.filename, 'el'));

      case 'date':
        return sorted.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      case 'category':
        return sorted.sort((a, b) => {
          if (a.category === b.category) {
            return a.filename.localeCompare(b.filename, 'el');
          }
          return a.category.localeCompare(b.category);
        });

      default:
        return sorted;
    }
  }

  filterByCategory(images, category) {
    if (category === 'all' || !category) {
      return images;
    }

    return images.filter(img => img.category === category);
  }

  createGalleryItem(imageData, language = 'el') {
    const processed = this.processImage(imageData, language);

    return {
      id: processed.id,
      url: processed.url,
      thumbnail: processed.thumbnail,
      category: processed.category,
      caption: processed.display_caption,
      caption_el: processed.caption_el,
      caption_en: processed.caption_en,
      filename: processed.filename,
      modified: processed.modified
    };
  }

  batchProcess(images, language = 'el') {
    return images.map(img => this.createGalleryItem(img, language));
  }

  generateOptimizedUrl(url, width = 800, quality = 85) {
    if (!url || !url.includes('dropbox')) {
      return url;
    }

    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=${width}&q=${quality}`;
  }

  createResponsiveSrcSet(url) {
    if (!url) return '';

    return `
      ${this.generateOptimizedUrl(url, 400)} 400w,
      ${this.generateOptimizedUrl(url, 800)} 800w,
      ${this.generateOptimizedUrl(url, 1200)} 1200w,
      ${this.generateOptimizedUrl(url, 1600)} 1600w
    `.trim();
  }

  getSizesAttribute() {
    return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageProcessor;
}
