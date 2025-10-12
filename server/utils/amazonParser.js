import axios from 'axios';
import { load } from 'cheerio';

/**
 * Estrae ASIN da un URL di prodotto Amazon
 * @param {string} url - URL del prodotto Amazon
 * @returns {string|null} - ASIN del prodotto o null se non trovato
 */
export function extractASINFromUrl(url) {
  if (!url) return null;
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i);
  return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;
}

/**
 * Estrae gli ASIN e l'affiliate tag da un URL di carrello Amazon
 * @param {string} cartUrl - URL del carrello Amazon
 * @returns {{asins: Array<{asin: string, quantity: number}>, affiliateTag: string|null}} - Oggetto con array di ASIN e affiliate tag
 */
export function extractASINsFromCartUrl(cartUrl) {
  try {
    const url = new URL(cartUrl);
    const params = url.searchParams;
    const asins = [];
    
    // Estrai l'affiliate tag
    const affiliateTag = params.get('AssociateTag') || params.get('tag') || null;
    
    // Cerca parametri ASIN.1, ASIN.2, etc.
    let index = 1;
    while (params.has(`ASIN.${index}`)) {
      const asin = params.get(`ASIN.${index}`);
      const quantity = parseInt(params.get(`Quantity.${index}`) || '1');
      
      if (asin) {
        asins.push({ asin, quantity });
      }
      index++;
    }
    
    return { asins, affiliateTag };
  } catch (error) {
    console.error('Error parsing cart URL:', error);
    throw new Error('URL del carrello non valido');
  }
}

/**
 * Recupera le informazioni di un prodotto Amazon tramite ASIN
 * @param {string} asin - ASIN del prodotto
 * @param {string} domain - Dominio Amazon (default: 'amazon.it')
 * @param {string} affiliateTag - Tag affiliato Amazon (opzionale)
 * @returns {Promise<Object>} - Informazioni del prodotto
 */
export async function fetchProductByASIN(asin, domain = 'amazon.it', affiliateTag = null) {
  try {
    const url = `https://www.${domain}/dp/${asin}`;
    
    // Headers per simulare un browser reale
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      maxRedirects: 5
    });
    
    const $ = load(response.data);
    
    // Estrai informazioni del prodotto
    const title = $('#productTitle').text().trim() ||
                  $('h1.a-size-large').first().text().trim() ||
                  $('span#productTitle').text().trim();
    
    // Verifica disponibilità del prodotto con controlli più rigorosi
    const availabilityText = $('#availability .a-color-price, #availability .a-color-success, .a-color-price, .a-color-success').text().toLowerCase();
    const outOfStockElements = $('#outOfStock, .a-color-price, .a-color-success').length;
    const hasUnavailableText = availabilityText.includes('non disponibile') || 
                               availabilityText.includes('currently unavailable') ||
                               availabilityText.includes('temporaneamente esaurito') ||
                               availabilityText.includes('out of stock');
    
    // Verifica se ci sono opzioni di acquisto disponibili
    const hasBuyingOptions = $('.a-button-primary[data-action="show-all-offers-display"], .a-button-primary[data-action="show-all-offers-display"]').length > 0;
    const hasAddToCart = $('input[name="submit.add-to-cart"], #add-to-cart-button').length > 0;
    
    // Controllo specifico per "No featured offers available"
    const hasNoFeaturedOffers = $('.a-section.a-spacing-mini.a-color-secondary').text().toLowerCase().includes('no featured offers available') ||
                                $('.a-section.a-spacing-mini.a-color-secondary').text().toLowerCase().includes('nessuna offerta in evidenza disponibile');
    
    // Il prodotto è disponibile solo se:
    // 1. Non ha testi di indisponibilità
    // 2. Ha un bottone "Add to Cart" (acquisto diretto)
    // 3. NON ha solo "opzioni di acquisto" senza acquisto diretto
    // 4. NON ha "No featured offers available"
    let isAvailable = !hasUnavailableText && 
                     !$('#outOfStock').length && 
                     hasAddToCart && // DEVE avere add to cart per essere disponibile
                     !hasBuyingOptions && // NON deve avere solo "vedi altre opzioni"
                     !hasNoFeaturedOffers; // NON deve avere "no featured offers"
    
    console.log(`🔍 Debug disponibilità per ${asin}:`);
    console.log(`   Testo disponibilità: "${availabilityText}"`);
    console.log(`   Ha testo non disponibile: ${hasUnavailableText}`);
    console.log(`   Ha opzioni di acquisto: ${hasBuyingOptions}`);
    console.log(`   Ha add to cart: ${hasAddToCart}`);
    console.log(`   Ha "No featured offers": ${hasNoFeaturedOffers}`);
    console.log(`   Risultato finale: ${isAvailable ? 'DISPONIBILE' : 'NON DISPONIBILE'}`);

    // Prova diversi selettori per il prezzo - solo se disponibile
    let priceText = '';
    let price = null;
    
    if (isAvailable) {
      // Cerca il prezzo principale del prodotto selezionato
      priceText = $('.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen').first().text().trim() ||
                  $('.a-price.a-text-price.a-size-base.apexPriceToPay .a-offscreen').first().text().trim() ||
                  $('#apex_desktop .a-price .a-offscreen').first().text().trim() ||
                  $('#priceblock_ourprice').text().trim() ||
                  $('#priceblock_dealprice').text().trim() ||
                  $('.a-price-whole').first().text().trim();
      
      // Pulisci il prezzo e converti in numero
      if (priceText) {
        priceText = priceText.replace(/[€\s.]/g, '').replace(',', '.');
        price = parseFloat(priceText);
        
        // Verifica che il prezzo sia ragionevole e non di un'alternativa
        if (price && price < 20) {
          console.log(`⚠️ Prezzo sospetto (${price}€) - potrebbe essere di un'alternativa`);
          // Controlla se il prezzo corrisponde a un'alternativa nella pagina
          const alternativePrices = [];
          $('.a-price .a-offscreen').each((i, elem) => {
            const altPrice = $(elem).text().trim();
            if (altPrice) {
              const cleanPrice = parseFloat(altPrice.replace(/[€\s.]/g, '').replace(',', '.'));
              if (cleanPrice && cleanPrice !== price) {
                alternativePrices.push(cleanPrice);
              }
            }
          });
          
          if (alternativePrices.includes(price)) {
            console.log(`❌ Prezzo ${price}€ corrisponde a un'alternativa, prodotto principale non disponibile`);
            price = null;
            isAvailable = false;
          }
        }
      }
    } else {
      console.log(`❌ Prodotto non disponibile per ASIN ${asin}`);
    }
    
    // Estrai l'immagine principale
    const imageUrl = $('#landingImage').attr('src') ||
                     $('#imgBlkFront').attr('src') ||
                     $('.a-dynamic-image').first().attr('src') ||
                     null;
    
    // Estrai brand e specifiche dalla tabella dei dettagli tecnici
    let brand = '';
    let specs = '';
    
    // Cerca il brand
    $('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, .prodDetTable tr').each((i, elem) => {
      const label = $(elem).find('th').text().trim().toLowerCase();
      const value = $(elem).find('td').text().trim();
      
      if (label.includes('marca') || label.includes('brand') || label.includes('produttore')) {
        brand = value;
      }
    });
    
    // Se non trovato, prova nei bullet points
    if (!brand) {
      brand = $('a#bylineInfo').text().trim().replace(/^Marca:\s*/i, '').replace(/^Visita lo Store di\s*/i, '');
    }
    
    // Raccogli specifiche dai feature bullets
    const features = [];
    $('#feature-bullets ul li span.a-list-item, #feature-bullets ul li').each((i, elem) => {
      const feature = $(elem).text().trim();
      if (feature && !feature.includes('Visualizza altri dettagli prodotto')) {
        features.push(feature);
      }
    });
    
    if (features.length > 0) {
      specs = features.slice(0, 3).join(' | '); // Prendi le prime 3 caratteristiche
    }
    
    // Costruisci il link Amazon con il tag affiliato se presente
    let amazonLink = url;
    if (affiliateTag) {
      amazonLink = `${url}?tag=${affiliateTag}`;
    }
    
    return {
      asin,
      name: title || `Prodotto Amazon ${asin}`,
      brand: brand || '',
      price: price || null,
      imageUrl: imageUrl || null,
      specs: specs || '',
      amazonLink: amazonLink,
      isAvailable: isAvailable,
      availabilityStatus: isAvailable ? 'available' : 'unavailable'
    };
    
  } catch (error) {
    console.error(`Error fetching product ${asin}:`, error.message);
    
    // Costruisci il link base con affiliato se presente
    let amazonLink = `https://www.${domain}/dp/${asin}`;
    if (affiliateTag) {
      amazonLink = `${amazonLink}?tag=${affiliateTag}`;
    }
    
    // Ritorna un oggetto base anche in caso di errore
    return {
      asin,
      name: `Prodotto Amazon ${asin}`,
      brand: '',
      price: null,
      imageUrl: null,
      specs: '',
      amazonLink: amazonLink,
      error: 'Impossibile recuperare i dettagli del prodotto. Compila manualmente.',
    };
  }
}

/**
 * Determina il tipo di componente basandosi sul nome del prodotto
 * @param {string} name - Nome del prodotto
 * @returns {string} - Tipo di componente
 */
export function detectComponentType(name) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('ryzen') || nameLower.includes('intel') || nameLower.includes('processor') || nameLower.includes('cpu')) {
    return 'CPU';
  }
  if (nameLower.includes('rtx') || nameLower.includes('gtx') || nameLower.includes('radeon') || nameLower.includes('rx ') || nameLower.includes('gpu')) {
    return 'GPU';
  }
  if (nameLower.includes('motherboard') || nameLower.includes('scheda madre') || nameLower.includes('b450') || nameLower.includes('b550') || nameLower.includes('x570') || nameLower.includes('z690')) {
    return 'Motherboard';
  }
  if (nameLower.includes('ram') || nameLower.includes('ddr4') || nameLower.includes('ddr5') || nameLower.includes('memoria')) {
    return 'RAM';
  }
  if (nameLower.includes('ssd') || nameLower.includes('nvme') || nameLower.includes('m.2') || nameLower.includes('storage') || nameLower.includes('hard disk')) {
    return 'Storage';
  }
  if (nameLower.includes('alimentatore') || nameLower.includes('power supply') || nameLower.includes('psu') || nameLower.includes('watt')) {
    return 'PSU';
  }
  if (nameLower.includes('case') || nameLower.includes('cabinet') || nameLower.includes('chassis')) {
    return 'Case';
  }
  if (nameLower.includes('cooler') || nameLower.includes('dissipatore') || nameLower.includes('ventola')) {
    return 'Cooler';
  }
  
  return 'Other';
}

/**
 * Estrae il modello dal nome del prodotto
 * @param {string} name - Nome del prodotto
 * @param {string} brand - Brand del prodotto
 * @returns {string} - Modello estratto
 */
export function extractModel(name, brand) {
  if (!name) return '';
  
  // Rimuovi il brand dal nome se presente
  let model = name;
  if (brand) {
    model = model.replace(new RegExp(brand, 'gi'), '').trim();
  }
  
  // Prendi la prima parte significativa (primi 50 caratteri)
  if (model.length > 50) {
    model = model.substring(0, 50).trim();
  }
  
  return model;
}

/**
 * Importa componenti da un URL di carrello Amazon
 * @param {string} cartUrl - URL del carrello Amazon
 * @param {string} domain - Dominio Amazon (default: 'amazon.it')
 * @returns {Promise<{components: Array, affiliateTag: string|null}>} - Oggetto con array di componenti e affiliate tag
 */
export async function importFromAmazonCart(cartUrl, domain = 'amazon.it') {
  try {
    // Estrai gli ASIN e l'affiliate tag dall'URL
    const { asins: asinData, affiliateTag } = extractASINsFromCartUrl(cartUrl);
    
    if (asinData.length === 0) {
      throw new Error('Nessun prodotto trovato nell\'URL del carrello');
    }
    
    console.log(`Trovati ${asinData.length} prodotti da importare`);
    if (affiliateTag) {
      console.log(`Affiliate tag trovato: ${affiliateTag}`);
    }
    
    // Recupera i dettagli di ogni prodotto
    const components = [];
    
    for (const { asin } of asinData) {
      console.log(`Recupero dati per ASIN: ${asin}`);
      
      // Aggiungi un piccolo delay per evitare rate limiting
      if (components.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const product = await fetchProductByASIN(asin, domain, affiliateTag);
      
      const component = {
        type: detectComponentType(product.name),
        name: product.name,
        brand: product.brand,
        model: extractModel(product.name, product.brand),
        price: product.price,
        amazon_link: product.amazonLink,
        image_url: product.imageUrl,
        specs: product.specs,
        asin: asin, // Aggiungi l'ASIN al componente
      };
      
      components.push(component);
    }
    
    return { components, affiliateTag };
    
  } catch (error) {
    console.error('Error importing from Amazon cart:', error);
    throw error;
  }
}

