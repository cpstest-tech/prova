import { getProductDetails } from './amazonPAAPI.js';
import REPLACEMENT_CONFIG from '../config/replacement.js';

/**
 * Utility per controllare la disponibilità dei prodotti Amazon
 */

// Configurazione
const AMAZON_CONFIG = {
  requestTimeout: 10000,
  requestDelay: 1500,
  maxRetries: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

/**
 * Estrae l'ASIN da un link Amazon
 * @param {string} amazonLink - Link Amazon completo
 * @returns {string|null} - ASIN del prodotto o null se non trovato
 */
export function extractASIN(amazonLink) {
  if (!amazonLink) return null;
  
  // Pattern per estrarre ASIN da vari formati di URL Amazon
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /asin=([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/
  ];
  
  for (const pattern of patterns) {
    const match = amazonLink.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Controlla la disponibilità di un prodotto Amazon usando PA-API
 * @param {string} asin - ASIN del prodotto
 * @returns {Object} - Informazioni sulla disponibilità
 */
export async function checkProductAvailability(asin) {
  if (!asin) {
    return {
      available: false,
      error: 'ASIN non valido'
    };
  }

  try {
    // Usa Amazon PA-API se configurata, altrimenti simula
    const productDetails = await getProductDetails(asin, REPLACEMENT_CONFIG.amazon);
    
    if (productDetails) {
      return {
        available: productDetails.availability === 'In Stock' || productDetails.availability === 'Limited Stock',
        price: productDetails.price,
        stockStatus: productDetails.availability,
        lastChecked: new Date().toISOString(),
        asin: asin,
        name: productDetails.name,
        brand: productDetails.brand
      };
    }
    
    return {
      available: false,
      error: 'Prodotto non trovato',
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Errore nel controllo disponibilità ASIN ${asin}:`, error.message);
    return {
      available: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Simula il controllo Amazon (da sostituire con API reale)
 * @param {string} asin - ASIN del prodotto
 * @returns {Object} - Dati simulati
 */
async function simulateAmazonCheck(asin) {
  // Simula delay di rete
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  // Simula diverse condizioni di disponibilità
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% disponibile
    return {
      available: true,
      price: Math.floor(Math.random() * 500) + 50, // Prezzo casuale 50-550€
      stockStatus: random < 0.9 ? 'In Stock' : 'Limited Stock'
    };
  } else if (random < 0.85) {
    // 15% esaurito
    return {
      available: false,
      price: 0,
      stockStatus: 'Out of Stock'
    };
  } else {
    // 15% errore
    throw new Error('Errore nel recupero informazioni prodotto');
  }
}

/**
 * Controlla la disponibilità di un componente
 * @param {Object} component - Componente da controllare
 * @returns {Object} - Risultato del controllo
 */
export async function checkComponentAvailability(component) {
  const asin = extractASIN(component.amazon_link);
  
  if (!asin) {
    return {
      componentId: component.id,
      available: false,
      error: 'Link Amazon non valido',
      lastChecked: new Date().toISOString()
    };
  }
  
  const availability = await checkProductAvailability(asin);
  
  return {
    componentId: component.id,
    asin: asin,
    available: availability.available,
    price: availability.price,
    stockStatus: availability.stockStatus,
    error: availability.error,
    lastChecked: availability.lastChecked
  };
}

/**
 * Controlla la disponibilità di più componenti in batch
 * @param {Array} components - Array di componenti
 * @returns {Array} - Array di risultati
 */
export async function checkMultipleComponentsAvailability(components) {
  const results = [];
  
  for (const component of components) {
    try {
      // Delay tra richieste per evitare rate limiting
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, AMAZON_CONFIG.requestDelay));
      }
      
      const result = await checkComponentAvailability(component);
      results.push(result);
      
    } catch (error) {
      results.push({
        componentId: component.id,
        available: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      });
    }
  }
  
  return results;
}

/**
 * Valida se un link Amazon è valido
 * @param {string} link - Link da validare
 * @returns {boolean} - True se valido
 */
export function isValidAmazonLink(link) {
  if (!link) return false;
  
  const amazonDomains = [
    'amazon.it',
    'amazon.com',
    'amazon.co.uk',
    'amazon.de',
    'amazon.fr',
    'amazon.es'
  ];
  
  try {
    const url = new URL(link);
    return amazonDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Formatta il prezzo per il display
 * @param {number} price - Prezzo in euro
 * @returns {string} - Prezzo formattato
 */
export function formatPrice(price) {
  if (!price) return 'N/A';
  return `€${price.toFixed(2)}`;
}

/**
 * Calcola la differenza di prezzo tra due componenti
 * @param {number} originalPrice - Prezzo originale
 * @param {number} newPrice - Nuovo prezzo
 * @returns {Object} - Differenza formattata
 */
export function calculatePriceDifference(originalPrice, newPrice) {
  const origPrice = parseFloat(originalPrice) || 0;
  const newPriceVal = parseFloat(newPrice) || 0;
  
  if (origPrice === 0 && newPriceVal === 0) {
    return {
      difference: 0,
      percentage: 0,
      formatted: 'N/A',
      isIncrease: false
    };
  }
  
  const difference = newPriceVal - origPrice;
  const percentage = origPrice > 0 ? Math.round((difference / origPrice) * 100) : 0;
  
  return {
    difference: difference,
    percentage: percentage,
    formatted: `${difference >= 0 ? '+' : ''}€${difference.toFixed(2)} (${percentage >= 0 ? '+' : ''}${percentage}%)`,
    isIncrease: difference > 0
  };
}
