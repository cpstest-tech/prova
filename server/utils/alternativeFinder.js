// import fetch from 'node-fetch'; // Non necessario per la simulazione

/**
 * Utility per la ricerca di alternative automatiche su Amazon
 */

// Configurazione
const SEARCH_CONFIG = {
  requestTimeout: 15000,
  requestDelay: 2000,
  maxResults: 5,
  affiliateTag: 'cpstest05-21'
};

/**
 * Cerca prodotti Amazon usando una query di ricerca
 * @param {string} searchQuery - Query di ricerca
 * @param {string} componentType - Tipo di componente (per filtrare risultati)
 * @returns {Array} - Array di prodotti trovati
 */
export async function searchAmazonProducts(searchQuery, componentType = null) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  try {
    // Simula la ricerca su Amazon
    // In un'implementazione reale, useresti l'Amazon Product Advertising API
    const results = await simulateAmazonSearch(searchQuery, componentType);
    
    return results.map(product => ({
      asin: product.asin,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      amazonLink: product.amazonLink,
      availability: product.availability,
      rating: product.rating,
      reviewCount: product.reviewCount,
      brand: product.brand,
      model: product.model
    }));
    
  } catch (error) {
    console.error(`Errore nella ricerca Amazon per "${searchQuery}":`, error.message);
    return [];
  }
}

/**
 * Simula la ricerca Amazon (da sostituire con API reale)
 * @param {string} searchQuery - Query di ricerca
 * @param {string} componentType - Tipo di componente
 * @returns {Array} - Risultati simulati
 */
async function simulateAmazonSearch(searchQuery, componentType) {
  // Simula delay di rete
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));
  
  const results = [];
  const numResults = Math.floor(Math.random() * 5) + 2; // 2-6 risultati
  
  for (let i = 0; i < numResults; i++) {
    const random = Math.random();
    
    // Simula diversi tipi di prodotti in base al tipo di componente
    const productData = generateMockProduct(searchQuery, componentType, i);
    
    results.push({
      asin: `B${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name: productData.name,
      price: productData.price,
      imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(productData.name)}`,
      amazonLink: `https://www.amazon.it/dp/B${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      availability: random < 0.8 ? 'In Stock' : 'Limited Stock',
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      reviewCount: Math.floor(Math.random() * 1000) + 10,
      brand: productData.brand,
      model: productData.model
    });
  }
  
  return results;
}

/**
 * Genera dati mock per un prodotto
 * @param {string} searchQuery - Query di ricerca
 * @param {string} componentType - Tipo di componente
 * @param {number} index - Indice del risultato
 * @returns {Object} - Dati del prodotto
 */
function generateMockProduct(searchQuery, componentType, index) {
  const brands = {
    'GPU': ['MSI', 'ASUS', 'Gigabyte', 'EVGA', 'Sapphire'],
    'CPU': ['AMD', 'Intel'],
    'RAM': ['Corsair', 'G.Skill', 'Kingston', 'Crucial'],
    'SSD': ['Samsung', 'Crucial', 'WD', 'Kingston'],
    'PSU': ['Corsair', 'Seasonic', 'EVGA', 'be quiet!'],
    'Motherboard': ['ASUS', 'MSI', 'Gigabyte', 'ASRock'],
    'Case': ['Fractal Design', 'Corsair', 'NZXT', 'Cooler Master']
  };
  
  const componentBrands = brands[componentType] || ['Generic'];
  const brand = componentBrands[Math.floor(Math.random() * componentBrands.length)];
  
  // Genera nome basato sulla query e sul tipo
  let name = searchQuery;
  if (index > 0) {
    // Aggiungi variazioni per risultati alternativi
    const variations = ['Pro', 'Gaming', 'OC', 'Ti', 'XT', 'Plus'];
    name += ` ${variations[index % variations.length]}`;
  }
  
  return {
    name: `${brand} ${name}`,
    brand: brand,
    model: `${brand}-${Math.floor(Math.random() * 9999) + 1000}`,
    price: Math.floor(Math.random() * 800) + 50 // 50-850€
  };
}

/**
 * Cerca alternative per un componente usando la query di ricerca
 * @param {Object} component - Componente originale
 * @returns {Object|null} - Prima alternativa disponibile o null
 */
export async function findAlternativeByQuery(component) {
  if (!component.search_query) {
    return null;
  }
  
  // Dividi la query per "OR"
  const alternatives = component.search_query.split(' OR ').map(q => q.trim());
  
  for (const query of alternatives) {
    if (query.length === 0) continue;
    
    try {
      // Cerca su Amazon con la query specifica
      const results = await searchAmazonProducts(query, component.type);
      
      // Prendi il primo disponibile
      const available = results.find(r => r.availability === 'In Stock' || r.availability === 'Limited Stock');
      if (available) {
        return {
          ...available,
          searchQuery: query,
          originalComponent: component
        };
      }
      
      // Delay tra ricerche per evitare rate limiting
      if (alternatives.indexOf(query) < alternatives.length - 1) {
        await new Promise(resolve => setTimeout(resolve, SEARCH_CONFIG.requestDelay));
      }
      
    } catch (error) {
      console.error(`Errore nella ricerca alternativa "${query}":`, error.message);
      continue;
    }
  }
  
  return null; // Nessuna alternativa trovata
}

/**
 * Valida una query di ricerca per alternative
 * @param {string} searchQuery - Query da validare
 * @returns {Object} - Risultato della validazione
 */
export function validateSearchQuery(searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return {
      valid: false,
      error: 'Query di ricerca vuota'
    };
  }
  
  if (searchQuery.length > 500) {
    return {
      valid: false,
      error: 'Query troppo lunga (max 500 caratteri)'
    };
  }
  
  const alternatives = searchQuery.split(' OR ');
  if (alternatives.length > 10) {
    return {
      valid: false,
      error: 'Troppe alternative (max 10)'
    };
  }
  
  for (const alt of alternatives) {
    if (alt.trim().length === 0) {
      return {
        valid: false,
        error: 'Alternative vuote non consentite'
      };
    }
  }
  
  return {
    valid: true,
    alternatives: alternatives.length
  };
}

/**
 * Suggerisce query di ricerca basate sul tipo di componente
 * @param {string} componentType - Tipo di componente
 * @param {string} componentName - Nome del componente
 * @returns {Array} - Array di query suggerite
 */
export function suggestSearchQueries(componentType, componentName) {
  const suggestions = {
    'GPU': [
      `${componentName} OR RTX 4060 Ti OR RTX 4070 OR RX 7600 OR RTX 3060 Ti`,
      `${componentName} OR alternative ${componentType} OR substitute ${componentType}`,
      `${componentType} gaming OR ${componentType} budget OR ${componentType} mid-range`
    ],
    'CPU': [
      `${componentName} OR Ryzen 5 5600X OR Intel i5-12400F OR Ryzen 5 5500`,
      `${componentType} 6 core OR ${componentType} 8 core OR ${componentType} budget`,
      `${componentName} OR alternative ${componentType} OR substitute ${componentType}`
    ],
    'RAM': [
      `${componentName} OR DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz`,
      `${componentType} 16GB OR ${componentType} 32GB OR ${componentType} budget`,
      `${componentName} OR alternative ${componentType} OR substitute ${componentType}`
    ],
    'SSD': [
      `${componentName} OR NVMe 1TB PCIe 4.0 OR NVMe 1TB PCIe 3.0`,
      `${componentType} 1TB OR ${componentType} 500GB OR ${componentType} budget`,
      `${componentName} OR alternative ${componentType} OR substitute ${componentType}`
    ],
    'PSU': [
      `${componentName} OR PSU 650W 80 Plus Gold OR PSU 700W 80 Plus Gold`,
      `${componentType} 650W OR ${componentType} 750W OR ${componentType} 80 Plus Gold`,
      `${componentName} OR alternative ${componentType} OR substitute ${componentType}`
    ]
  };
  
  return suggestions[componentType] || [
    `${componentName} OR alternative ${componentType}`,
    `${componentType} budget OR ${componentType} mid-range`,
    `${componentName} OR substitute ${componentType}`
  ];
}

/**
 * Formatta i risultati della ricerca per il display
 * @param {Array} results - Risultati della ricerca
 * @returns {Array} - Risultati formattati
 */
export function formatSearchResults(results) {
  return results.map(result => ({
    ...result,
    formattedPrice: result.price ? `€${result.price.toFixed(2)}` : 'N/A',
    availabilityBadge: result.availability === 'In Stock' ? 'Disponibile' : 
                      result.availability === 'Limited Stock' ? 'Scorte limitate' : 'Esaurito',
    ratingDisplay: result.rating ? `${result.rating}/5 (${result.reviewCount} recensioni)` : 'N/A'
  }));
}
