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

      // Estrai parametri URL per identificare la variante specifica
      const urlParams = new URL(amazonLink).searchParams;
      const variantParams = {
        ref: urlParams.get('ref_'),
        th: urlParams.get('th'),
        psc: urlParams.get('psc'),
        variant: urlParams.get('variant')
      };

      const productData = await this.page.evaluate((variantParams) => {
        const data = {
          available: false,
          price: null,
          originalPrice: null,
          title: '',
          image: '',
          asin: '',
          error: null,
          debug: {
            allPriceElements: [],
            pageUrl: window.location.href,
            variantParams: variantParams,
            selectedVariant: null
          }
        };

        try {
          // Funzione per verificare se un elemento è nella variante selezionata
          function isInSelectedVariant(element, variantParams) {
            // Se non ci sono parametri variante specifici, accetta tutto
            if (!variantParams.ref && !variantParams.th && !variantParams.psc && !variantParams.variant) {
              return true;
            }

            // Controlla se l'elemento è dentro un contenitore di variante specifica
            let parent = element;
            let depth = 0;
            const maxDepth = 10; // Limita la profondità per evitare loop infiniti
            
            while (parent && parent !== document.body && depth < maxDepth) {
              // Controlla attributi data che indicano varianti
              if (parent.dataset.variantId || parent.dataset.asin || parent.dataset.styleId) {
                // Verifica se corrisponde ai parametri della variante
                if (variantParams.variant && parent.dataset.variantId === variantParams.variant) {
                  return true;
                }
                if (variantParams.psc && parent.dataset.styleId === variantParams.psc) {
                  return true;
                }
              }
              
              // Controlla se è nella sezione variante attiva/selezionata
              if (parent.classList.contains('a-selected') || 
                  parent.classList.contains('a-button-selected') ||
                  parent.classList.contains('a-toggle-selected') ||
                  parent.hasAttribute('data-selected') ||
                  parent.getAttribute('aria-selected') === 'true') {
                return true;
              }
              
              // Controlla se è dentro un elemento di variante attiva
              if (parent.classList.contains('a-button-toggle') && 
                  parent.classList.contains('a-button-selected')) {
                return true;
              }
              
              parent = parent.parentElement;
              depth++;
            }
            
            // Se non trova una variante specifica, controlla se ci sono elementi di variante nella pagina
            const variantElements = document.querySelectorAll('[data-variant-id], [data-style-id], .a-button-toggle');
            if (variantElements.length === 0) {
              // Nessuna variante trovata, accetta il prezzo
              return true;
            }
            
            // Se ci sono varianti ma non trova quella selezionata, rifiuta
            return false;
          }

          // Controlla se il prodotto è disponibile
          const availabilityElement = document.querySelector('#availability span, .a-color-price.a-text-bold');
          if (availabilityElement) {
            const availabilityText = availabilityElement.textContent.toLowerCase();
            data.available = !availabilityText.includes('non disponibile') && 
                           !availabilityText.includes('temporaneamente') &&
                           !availabilityText.includes('unavailable');
          } else {
            data.available = true; // Assume disponibile se non trova indicatori
          }

          // DEBUG: Raccogli tutti gli elementi con prezzi
          const allPriceSelectors = [
            '.a-price',
            '.a-price-whole',
            '.a-price-fraction',
            '.a-offscreen',
            '[class*="price"]',
            '[id*="price"]'
          ];
          
          for (const selector of allPriceSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent.trim();
              if (text && text.match(/[\d,.]/)) {
                data.debug.allPriceElements.push({
                  selector: selector,
                  text: text,
                  className: el.className,
                  id: el.id,
                  parentText: el.parentElement?.textContent?.substring(0, 100) || '',
                  inSelectedVariant: isInSelectedVariant(el, variantParams)
                });
              }
            });
          }

          // Estrai prezzo - ordine di priorità per Amazon Italia, ma solo dalla variante selezionata
          const priceSelectors = [
            '.a-price.a-text-price .a-offscreen', // Prezzo principale barrato (sconto)
            '.a-price .a-offscreen', // Prezzo principale
            '#priceblock_dealprice', // Prezzo offerta
            '#priceblock_ourprice', // Prezzo nostro
            '.a-price-whole', // Prezzo senza decimali
            '.a-price-range .a-offscreen' // Range prezzo
          ];

          let foundValidPrice = false;
          let fallbackPrice = null; // Prezzo di fallback se non trova quello della variante
          
          for (const selector of priceSelectors) {
            const priceElements = document.querySelectorAll(selector);
            for (const priceElement of priceElements) {
              const priceText = priceElement.textContent.trim();
              console.log(`🔍 Tentativo parsing prezzo: "${priceText}" con selector: ${selector}`);
              
              // Pulisci il testo del prezzo
              const cleanPriceText = priceText.replace(/[^\d,.]/g, '');
              const price = parseFloat(cleanPriceText.replace(',', '.'));
              
              // Validazione prezzo ragionevole (tra 1€ e 1000€ per componenti PC)
              if (price > 1 && price < 1000) {
                // Controlla se non è un prezzo di venditore terzo (spesso molto alto)
                const elementText = priceElement.textContent.toLowerCase();
                const isThirdParty = elementText.includes('spedito da') || 
                                   elementText.includes('venduto da') ||
                                   elementText.includes('seller');
                
                if (!isThirdParty) {
                  // Verifica se appartiene alla variante selezionata
                  if (isInSelectedVariant(priceElement, variantParams)) {
                    data.price = price;
                    data.debug.selectedVariant = {
                      selector: selector,
                      text: priceText,
                      element: priceElement.className
                    };
                    console.log(`✅ Prezzo valido trovato per variante selezionata: €${price} da selector: ${selector}`);
                    foundValidPrice = true;
                    break;
                  } else {
                    console.log(`⚠️ Prezzo ignorato (non nella variante selezionata): "${priceText}"`);
                    // Salva come fallback se non abbiamo ancora un prezzo
                    if (!fallbackPrice) {
                      fallbackPrice = price;
                      console.log(`💾 Prezzo salvato come fallback: €${price}`);
                    }
                  }
                } else {
                  console.log(`❌ Prezzo venditore terzo ignorato: €${price}`);
                }
              } else {
                console.log(`❌ Prezzo non valido: €${price} (fuori range 1-1000€)`);
              }
            }
            if (foundValidPrice) break;
          }
          
          // Se non trova un prezzo per la variante specifica, usa il fallback
          if (!foundValidPrice && fallbackPrice) {
            console.log(`⚠️ Nessun prezzo trovato per variante specifica, uso fallback: €${fallbackPrice}`);
            data.price = fallbackPrice;
            data.debug.selectedVariant = {
              selector: 'fallback',
              text: `€${fallbackPrice}`,
              element: 'fallback-price'
            };
            foundValidPrice = true;
          }

          // Estrai prezzo originale (se in sconto) - solo dalla variante selezionata
          const originalPriceElement = document.querySelector('.a-price.a-text-price .a-offscreen');
          if (originalPriceElement && isInSelectedVariant(originalPriceElement, variantParams)) {
            const originalPriceText = originalPriceElement.textContent.replace(/[^\d,.]/g, '');
            const originalPrice = parseFloat(originalPriceText.replace(',', '.'));
            if (originalPrice > 0) {
              data.originalPrice = originalPrice;
              console.log(`✅ Prezzo originale trovato per variante selezionata: €${originalPrice}`);
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