/**
 * Versione semplificata del PriceChecker per test senza Puppeteer
 * Usa solo richieste HTTP per testare la logica
 */

export class PriceCheckerSimple {
  constructor() {
    console.log('🔧 PriceCheckerSimple inizializzato (modalità test)');
  }

  async init() {
    console.log('✅ PriceCheckerSimple init completato');
  }

  async close() {
    console.log('✅ PriceCheckerSimple chiuso');
  }

  /**
   * Simula controllo prezzo (per test)
   */
  async checkProductPrice(amazonLink) {
    console.log(`🔍 [SIMULATO] Controllo prezzo per: ${amazonLink}`);
    
    // Simula un controllo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      available: true,
      price: Math.floor(Math.random() * 100) + 50, // Prezzo casuale 50-150€
      originalPrice: null,
      title: 'Prodotto Test Simulato',
      image: '',
      asin: 'TEST1234567',
      error: null
    };
  }

  /**
   * Simula ricerca prodotti alternativi
   */
  async searchAlternativeProducts(searchTerm, maxPrice, minPrice = 0) {
    console.log(`🔍 [SIMULATO] Ricerca alternativa per: "${searchTerm}" (€${minPrice}-${maxPrice})`);
    
    // Simula ricerca
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const alternatives = [
      {
        title: `Alternativa 1 per ${searchTerm}`,
        price: Math.floor(Math.random() * (maxPrice - minPrice)) + minPrice,
        link: 'https://www.amazon.it/dp/TEST1234567',
        image: '',
        asin: 'TEST1234567',
        rating: 4.5,
        available: true
      },
      {
        title: `Alternativa 2 per ${searchTerm}`,
        price: Math.floor(Math.random() * (maxPrice - minPrice)) + minPrice,
        link: 'https://www.amazon.it/dp/TEST1234568',
        image: '',
        asin: 'TEST1234568',
        rating: 4.2,
        available: true
      }
    ];
    
    console.log(`✅ [SIMULATO] Trovati ${alternatives.length} prodotti alternativi`);
    return alternatives;
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

export default PriceCheckerSimple;
