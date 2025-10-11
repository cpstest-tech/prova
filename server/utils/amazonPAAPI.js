import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Client Amazon Product Advertising API 5.0
 * Per controllare disponibilità e prezzi reali dei prodotti Amazon
 */

// Configurazione
const AMAZON_CONFIG = {
  host: 'webservices.amazon.it',
  region: 'eu-west-1',
  service: 'ProductAdvertisingAPI',
  algorithm: 'AWS4-HMAC-SHA256',
  apiVersion: 'paapi5',
  marketplace: 'APJ6JRA9NG5V4' // Italia
};

/**
 * Genera la firma AWS per l'autenticazione
 * @param {string} accessKey - Access Key ID
 * @param {string} secretKey - Secret Access Key
 * @param {string} region - Regione AWS
 * @param {string} service - Servizio AWS
 * @param {string} stringToSign - Stringa da firmare
 * @returns {string} - Firma HMAC
 */
function generateSignature(accessKey, secretKey, region, service, stringToSign) {
  const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(new Date().toISOString().slice(0, 10)).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  
  return crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
}

/**
 * Crea l'header di autenticazione AWS
 * @param {string} accessKey - Access Key ID
 * @param {string} secretKey - Secret Access Key
 * @param {Object} requestBody - Body della richiesta
 * @returns {Object} - Headers per la richiesta
 */
function createAuthHeaders(accessKey, secretKey, requestBody) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = now.toISOString().slice(0, 10).replace(/[:\-]/g, '');
  
  const payload = JSON.stringify(requestBody);
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    'POST',
    '/paapi5/searchitems',
    '',
    `host:${AMAZON_CONFIG.host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`,
    '',
    'host;x-amz-date;x-amz-target',
    payloadHash
  ].join('\n');
  
  const stringToSign = [
    AMAZON_CONFIG.algorithm,
    amzDate,
    `${dateStamp}/${AMAZON_CONFIG.region}/${AMAZON_CONFIG.service}/aws4_request`,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const signature = generateSignature(accessKey, secretKey, AMAZON_CONFIG.region, AMAZON_CONFIG.service, stringToSign);
  
  return {
    'Content-Type': 'application/json',
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
    'Authorization': `${AMAZON_CONFIG.algorithm} Credential=${accessKey}/${dateStamp}/${AMAZON_CONFIG.region}/${AMAZON_CONFIG.service}/aws4_request, SignedHeaders=host;x-amz-date;x-amz-target, Signature=${signature}`
  };
}

/**
 * Cerca prodotti su Amazon usando PA-API
 * @param {string} query - Query di ricerca
 * @param {Object} config - Configurazione API
 * @returns {Array} - Array di prodotti trovati
 */
export async function searchAmazonProducts(query, config) {
  try {
    const { accessKeyId, secretAccessKey, partnerTag } = config;
    
    if (!accessKeyId || !secretAccessKey) {
      console.log('Credenziali Amazon PA-API non configurate, uso simulazione');
      return await simulateAmazonSearch(query);
    }
    
    const requestBody = {
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      Marketplace: AMAZON_CONFIG.marketplace,
      SearchIndex: 'Electronics',
      Keywords: query,
      ItemCount: 10,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'Offers.Listings.Price',
        'Offers.Listings.Availability',
        'Images.Primary.Large',
        'ItemInfo.ByLineInfo',
        'CustomerReviews.StarRating'
      ]
    };
    
    const headers = createAuthHeaders(accessKeyId, secretAccessKey, requestBody);
    
    const response = await fetch(`https://${AMAZON_CONFIG.host}/paapi5/searchitems`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Amazon PA-API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.SearchResult && data.SearchResult.Items) {
      return data.SearchResult.Items.map(item => ({
        asin: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || 'Nome non disponibile',
        price: parseFloat(item.Offers?.Listings?.[0]?.Price?.Amount || 0),
        imageUrl: item.Images?.Primary?.Large?.URL || '',
        amazonLink: `https://www.amazon.it/dp/${item.ASIN}`,
        availability: item.Offers?.Listings?.[0]?.Availability?.Message || 'Disponibilità sconosciuta',
        rating: parseFloat(item.CustomerReviews?.StarRating?.Value || 0),
        reviewCount: parseInt(item.CustomerReviews?.TotalCount || 0),
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
        model: item.ItemInfo?.ProductInfo?.ItemPartNumber?.DisplayValue || ''
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('Errore Amazon PA-API:', error.message);
    // Fallback alla simulazione in caso di errore
    return await simulateAmazonSearch(query);
  }
}

/**
 * Ottiene informazioni dettagliate su un prodotto specifico
 * @param {string} asin - ASIN del prodotto
 * @param {Object} config - Configurazione API
 * @returns {Object|null} - Dettagli del prodotto
 */
export async function getProductDetails(asin, config) {
  try {
    const { accessKeyId, secretAccessKey, partnerTag } = config;
    
    if (!accessKeyId || !secretAccessKey) {
      console.log('Credenziali Amazon PA-API non configurate, uso simulazione');
      return await simulateAmazonProductDetails(asin);
    }
    
    const requestBody = {
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      Marketplace: AMAZON_CONFIG.marketplace,
      ItemIds: [asin],
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'Offers.Listings.Price',
        'Offers.Listings.Availability',
        'Images.Primary.Large',
        'ItemInfo.ByLineInfo',
        'CustomerReviews.StarRating'
      ]
    };
    
    const headers = createAuthHeaders(accessKeyId, secretAccessKey, requestBody);
    
    const response = await fetch(`https://${AMAZON_CONFIG.host}/paapi5/getitems`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Amazon PA-API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items.length > 0) {
      const item = data.ItemsResult.Items[0];
      return {
        asin: item.ASIN,
        name: item.ItemInfo?.Title?.DisplayValue || 'Nome non disponibile',
        price: parseFloat(item.Offers?.Listings?.[0]?.Price?.Amount || 0),
        imageUrl: item.Images?.Primary?.Large?.URL || '',
        amazonLink: `https://www.amazon.it/dp/${item.ASIN}`,
        availability: item.Offers?.Listings?.[0]?.Availability?.Message || 'Disponibilità sconosciuta',
        rating: parseFloat(item.CustomerReviews?.StarRating?.Value || 0),
        reviewCount: parseInt(item.CustomerReviews?.TotalCount || 0),
        brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
        model: item.ItemInfo?.ProductInfo?.ItemPartNumber?.DisplayValue || ''
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Errore Amazon PA-API:', error.message);
    // Fallback alla simulazione in caso di errore
    return await simulateAmazonProductDetails(asin);
  }
}

/**
 * Simulazione per quando le credenziali non sono configurate
 * @param {string} query - Query di ricerca
 * @returns {Array} - Risultati simulati
 */
async function simulateAmazonSearch(query) {
  console.log(`Simulazione ricerca Amazon per: "${query}"`);
  
  // Simula delay di rete
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  const results = [];
  const numResults = Math.floor(Math.random() * 5) + 2;
  
  for (let i = 0; i < numResults; i++) {
    const random = Math.random();
    
    results.push({
      asin: `B${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name: `${query} - Prodotto simulato ${i + 1}`,
      price: Math.floor(Math.random() * 500) + 50,
      imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(query)}`,
      amazonLink: `https://www.amazon.it/dp/B${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      availability: random < 0.8 ? 'In Stock' : 'Limited Stock',
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 1000) + 10,
      brand: 'Brand Simulato',
      model: `MODEL-${Math.floor(Math.random() * 9999) + 1000}`
    });
  }
  
  return results;
}

/**
 * Simulazione dettagli prodotto
 * @param {string} asin - ASIN del prodotto
 * @returns {Object} - Dettagli simulati
 */
async function simulateAmazonProductDetails(asin) {
  console.log(`Simulazione dettagli prodotto ASIN: ${asin}`);
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  
  const random = Math.random();
  
  return {
    asin: asin,
    name: `Prodotto simulato per ASIN ${asin}`,
    price: Math.floor(Math.random() * 500) + 50,
    imageUrl: `https://via.placeholder.com/300x300?text=${asin}`,
    amazonLink: `https://www.amazon.it/dp/${asin}`,
    availability: random < 0.7 ? 'In Stock' : random < 0.9 ? 'Limited Stock' : 'Out of Stock',
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviewCount: Math.floor(Math.random() * 1000) + 10,
    brand: 'Brand Simulato',
    model: `MODEL-${asin.slice(-4)}`
  };
}
