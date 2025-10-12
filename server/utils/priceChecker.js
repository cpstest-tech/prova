import puppeteer from 'puppeteer';
import { extractASINFromUrl } from './amazonParser.js';

/**
 * Sistema di controllo prezzi tramite scraping Amazon
 * Verifica disponibilità e prezzi dei prodotti
 */
export class PriceChecker {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/chromium-browser', // Forza l'uso di Chromium
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    
    if (!this.page) {
      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1920, height: 1080 });
    }
  }

  async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Controlla prezzo e disponibilità di un prodotto Amazon
   */
  async checkProductPrice(amazonLink) {
    try {
      await this.init();
      
      console.log(`🔍 Controllo prezzo per: ${amazonLink}`);
      
      await this.page.goto(amazonLink, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Aspetta che la pagina si carichi completamente
      await this.page.waitForTimeout(2000);

      const productData = await this.page.evaluate(() => {
        const data = {
          available: false,
          price: null,
          originalPrice: null,
          title: '',
          image: '',
          asin: '',
          error: null
        };

        try {
          // Controlla se il prodotto è disponibile
          const unavailableSelectors = [
            '#availability span:contains("Non disponibile")',
            '#availability span:contains("Temporaneamente non disponibile")',
            '#availability span:contains("Currently unavailable")',
            '.a-color-price.a-text-bold:contains("Non disponibile")',
            '.a-color-price.a-text-bold:contains("Temporaneamente non disponibile")',
            '[data-asin-price="0"]'
          ];

          const availabilityElement = document.querySelector('#availability span, .a-color-price.a-text-bold');
          if (availabilityElement) {
            const availabilityText = availabilityElement.textContent.toLowerCase();
            data.available = !availabilityText.includes('non disponibile') && 
                           !availabilityText.includes('temporaneamente') &&
                           !availabilityText.includes('unavailable');
          } else {
            data.available = true; // Assume disponibile se non trova indicatori
          }

          // Estrai prezzo
          const priceSelectors = [
            '.a-price-whole',
            '.a-offscreen',
            '.a-price .a-offscreen',
            '#priceblock_dealprice',
            '#priceblock_ourprice',
            '.a-price-range .a-offscreen'
          ];

          for (const selector of priceSelectors) {
            const priceElement = document.querySelector(selector);
            if (priceElement) {
              const priceText = priceElement.textContent.replace(/[^\d,.]/g, '');
              const price = parseFloat(priceText.replace(',', '.'));
              if (price > 0) {
                data.price = price;
                break;
              }
            }
          }

          // Estrai prezzo originale (se in sconto)
          const originalPriceElement = document.querySelector('.a-price.a-text-price .a-offscreen');
          if (originalPriceElement) {
            const originalPriceText = originalPriceElement.textContent.replace(/[^\d,.]/g, '');
            const originalPrice = parseFloat(originalPriceText.replace(',', '.'));
            if (originalPrice > 0) {
              data.originalPrice = originalPrice;
            }
          }

          // Estrai titolo
          const titleElement = document.querySelector('#productTitle, .product-title');
          if (titleElement) {
            data.title = titleElement.textContent.trim();
          }

          // Estrai immagine
          const imageElement = document.querySelector('#landingImage, .a-dynamic-image');
          if (imageElement) {
            data.image = imageElement.src || imageElement.getAttribute('data-src');
          }

          // Estrai ASIN dall'URL
          const url = window.location.href;
          const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
          if (asinMatch) {
            data.asin = asinMatch[1] || asinMatch[2] || asinMatch[3];
          }
          
        } catch (error) {
          data.error = error.message;
          console.error('Errore nell\'estrazione dati:', error);
        }

        return data;
      });

      console.log(`✅ Dati prodotto:`, {
        available: productData.available,
        price: productData.price,
        title: productData.title?.substring(0, 50) + '...'
      });

      return productData;
    
  } catch (error) {
      console.error(`❌ Errore nel controllo prezzo per ${amazonLink}:`, error.message);
      return {
        available: false,
        price: null,
        originalPrice: null,
        title: '',
        image: '',
        asin: '',
        error: error.message
      };
  }
}

/**
   * Cerca prodotti alternativi su Amazon
   */
  async searchAlternativeProducts(searchTerm, maxPrice, minPrice = 0) {
    try {
      await this.init();
      
      console.log(`🔍 Ricerca alternativa per: "${searchTerm}" (€${minPrice}-${maxPrice})`);
      
      const searchUrl = `https://www.amazon.it/s?k=${encodeURIComponent(searchTerm)}&rh=p_36:${Math.floor(minPrice * 100)}-${Math.floor(maxPrice * 100)}`;
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await this.page.waitForTimeout(2000);

      const searchResults = await this.page.evaluate(() => {
        const results = [];
        const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');

        for (let i = 0; i < Math.min(productElements.length, 10); i++) {
          const element = productElements[i];
          
          try {
            const product = {
              title: '',
              price: null,
              link: '',
              image: '',
              asin: '',
              rating: null,
              available: false
            };

            // Titolo
            const titleElement = element.querySelector('h2 a span, .s-size-mini span');
            if (titleElement) {
              product.title = titleElement.textContent.trim();
            }

            // Prezzo
            const priceElement = element.querySelector('.a-price-whole, .a-offscreen');
            if (priceElement) {
              const priceText = priceElement.textContent.replace(/[^\d,.]/g, '');
              const price = parseFloat(priceText.replace(',', '.'));
              if (price > 0) {
                product.price = price;
              }
            }

            // Link
            const linkElement = element.querySelector('h2 a, .s-size-mini a');
            if (linkElement) {
              product.link = 'https://www.amazon.it' + linkElement.getAttribute('href');
            }

            // Immagine
            const imageElement = element.querySelector('.s-image');
            if (imageElement) {
              product.image = imageElement.src || imageElement.getAttribute('data-src');
            }

            // ASIN
            const asinMatch = product.link.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
            if (asinMatch) {
              product.asin = asinMatch[1] || asinMatch[2] || asinMatch[3];
            }

            // Rating
            const ratingElement = element.querySelector('.a-icon-alt');
            if (ratingElement) {
              const ratingText = ratingElement.textContent;
              const ratingMatch = ratingText.match(/(\d+[.,]\d+)/);
              if (ratingMatch) {
                product.rating = parseFloat(ratingMatch[1].replace(',', '.'));
              }
            }

            // Disponibilità (controllo semplice)
            const unavailableElement = element.querySelector('.a-color-price.a-text-bold');
            if (unavailableElement) {
              const text = unavailableElement.textContent.toLowerCase();
              product.available = !text.includes('non disponibile') && !text.includes('unavailable');
            } else {
              product.available = true;
            }

            if (product.title && product.price && product.link) {
              results.push(product);
            }

          } catch (error) {
            console.error('Errore nel parsing del prodotto:', error);
          }
        }

        return results;
      });

      console.log(`✅ Trovati ${searchResults.length} prodotti alternativi`);
      return searchResults;

    } catch (error) {
      console.error(`❌ Errore nella ricerca alternativa:`, error.message);
      return [];
    }
  }

  /**
   * Controlla se un prezzo è entro il limite di tolleranza (15%)
   */
  isPriceWithinTolerance(currentPrice, originalPrice, tolerancePercent = 15) {
    if (!originalPrice || !currentPrice) return false;
    
    const maxAllowedPrice = originalPrice * (1 + tolerancePercent / 100);
    return currentPrice <= maxAllowedPrice;
  }

  /**
   * Calcola la differenza percentuale di prezzo
   */
  calculatePriceDifference(currentPrice, originalPrice) {
    if (!originalPrice || !currentPrice) return 0;
    return ((currentPrice - originalPrice) / originalPrice) * 100;
  }
}

export default PriceChecker;