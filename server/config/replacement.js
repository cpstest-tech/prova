/**
 * Configurazione per il sistema di sostituzione intelligente componenti
 */

export const REPLACEMENT_CONFIG = {
  // Controllo disponibilità ogni X ore
  checkInterval: 6, // ore
  
  // Timeout per richieste Amazon
  requestTimeout: 10000, // millisecondi
  
  // Delay tra richieste per evitare rate limiting
  requestDelay: 1500, // millisecondi
  
  // Affiliate tag Amazon
  affiliateTag: 'cpstest05-21',
  
  // Notifiche admin quando sostituzioni avvengono
  notifyAdmin: true,
  
  // Limiti per sostituzioni
  limits: {
    // Massimo aumento prezzo consentito in euro
    maxPriceIncrease: 50,
    
    // Massimo aumento prezzo in percentuale
    maxPriceIncreasePercentage: 20,
    
    // Numero massimo di alternative da cercare per query
    maxAlternatives: 10,
    
    // Numero massimo di tentativi per componente
    maxRetries: 3
  },
  
  // Configurazione job schedulato
  scheduler: {
    // Intervallo di esecuzione in ore
    interval: 6,
    
    // Livello di log (debug, info, warn, error)
    logLevel: 'info',
    
    // Numero massimo di tentativi per job fallito
    maxRetries: 3,
    
    // Delay tra tentativi in millisecondi
    retryDelay: 30000
  },
  
  // Configurazione Amazon API (quando implementata)
  amazon: {
    // Endpoint API Amazon Product Advertising
    apiEndpoint: 'https://webservices.amazon.it/paapi5/searchitems',
    
    // Partner tag
    partnerTag: 'cpstest05-21',
    
    // Marketplace ID per Italia
    marketplace: 'APJ6JRA9NG5V4',
    
    // Configurazione rate limiting
    rateLimit: {
      requestsPerSecond: 1,
      burstLimit: 10
    }
  },
  
  // Configurazione notifiche
  notifications: {
    // Email admin per notifiche
    adminEmail: process.env.ADMIN_EMAIL || 'admin@build-pc.it',
    
    // Webhook per notifiche (opzionale)
    webhookUrl: process.env.REPLACEMENT_WEBHOOK_URL,
    
    // Notifica solo se ci sono sostituzioni
    notifyOnlyOnReplacements: true,
    
    // Notifica errori critici
    notifyOnErrors: true
  },
  
  // Configurazione debug e logging
  debug: {
    // Abilita log dettagliati
    verbose: process.env.NODE_ENV !== 'production',
    
    // Salva log delle sostituzioni
    logReplacements: true,
    
    // Salva log degli errori
    logErrors: true,
    
    // Directory per i log
    logDirectory: './logs/replacement'
  }
};

/**
 * Esempi di query di ricerca per tipo di componente
 */
export const SEARCH_QUERY_EXAMPLES = {
  'GPU': [
    'RTX 4060 Ti OR RTX 4070 OR RX 7600 OR RTX 3060 Ti',
    'RTX 4060 OR RTX 4060 Ti OR RTX 4070 OR alternative GPU',
    'RTX 4060 OR RTX 4060 Ti OR RTX 4070 OR RX 7600 OR RTX 3060 Ti OR RTX 3060'
  ],
  
  'CPU': [
    'Ryzen 5 5600X OR Intel i5-12400F OR Ryzen 5 5500',
    'Ryzen 5 5600 OR Ryzen 5 5600X OR Intel i5-12400F',
    'Ryzen 5 5600 OR Ryzen 5 5600X OR Intel i5-12400F OR Ryzen 5 5500'
  ],
  
  'RAM': [
    'DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz',
    'DDR4 16GB OR DDR4 32GB OR DDR4 3200MHz',
    'DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz OR DDR4 16GB 2666MHz'
  ],
  
  'SSD': [
    'NVMe 1TB PCIe 4.0 OR NVMe 1TB PCIe 3.0',
    'NVMe 1TB OR SATA SSD 1TB OR PCIe SSD 1TB',
    'NVMe 1TB PCIe 4.0 OR NVMe 1TB PCIe 3.0 OR SATA SSD 1TB'
  ],
  
  'PSU': [
    'PSU 650W 80 Plus Gold OR PSU 700W 80 Plus Gold',
    'PSU 650W OR PSU 750W OR 80 Plus Gold',
    'PSU 650W 80 Plus Gold OR PSU 700W 80 Plus Gold OR PSU 600W 80 Plus Gold'
  ],
  
  'Motherboard': [
    'B550 OR B450 OR X570 motherboard',
    'AM4 motherboard OR B550 OR B450',
    'AM4 motherboard OR B550 OR B450 OR X570'
  ],
  
  'Case': [
    'ATX case OR mid tower case OR PC case',
    'ATX case OR micro ATX case OR mid tower',
    'ATX case OR micro ATX case OR mid tower OR full tower'
  ]
};

/**
 * Configurazione per la validazione delle sostituzioni
 */
export const REPLACEMENT_VALIDATION = {
  // Controlli di qualità per le sostituzioni
  qualityChecks: {
    // Verifica che il prezzo sia ragionevole
    priceReasonableness: true,
    
    // Verifica che il prodotto sia della stessa categoria
    categoryMatch: true,
    
    // Verifica che le specifiche siano compatibili
    compatibilityCheck: false, // Da implementare in futuro
    
    // Verifica rating del prodotto
    ratingCheck: true,
    minRating: 3.0
  },
  
  // Blacklist di prodotti da evitare
  blacklist: {
    // ASIN da evitare
    asins: [],
    
    // Brand da evitare
    brands: [],
    
    // Modelli da evitare
    models: []
  }
};

/**
 * Configurazione per le statistiche e reporting
 */
export const REPORTING_CONFIG = {
  // Intervallo per report automatici
  reportInterval: 24, // ore
  
  // Metriche da tracciare
  metrics: [
    'totalReplacements',
    'averagePriceDifference',
    'successRate',
    'mostReplacedComponents',
    'replacementReasons'
  ],
  
  // Formato report
  reportFormat: 'json', // json, csv, html
  
  // Destinazione report
  reportDestination: 'database' // database, email, webhook
};

export default REPLACEMENT_CONFIG;
