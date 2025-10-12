#!/usr/bin/env node

/**
 * Test per verificare la correzione della selezione varianti
 */

import { PriceChecker } from './server/utils/priceChecker.js';

async function testVariantSelection() {
  console.log('🔍 Test selezione varianti Amazon...');
  
  const priceChecker = new PriceChecker();
  
  try {
    await priceChecker.init();
    
    // Test con un prodotto che ha varianti (esempio: diverse dimensioni/capacità)
    const testUrls = [
      // URL senza varianti specifiche
      'https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21',
      
      // URL con parametri variante (esempi tipici)
      'https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21&th=1',
      'https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21&psc=1',
      'https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21&ref_=variant_selector'
    ];
    
    for (let i = 0; i < testUrls.length; i++) {
      const testUrl = testUrls[i];
      console.log(`\n🔍 Test ${i + 1}/4: ${testUrl}`);
      
      const result = await priceChecker.checkProductPrice(testUrl);
      
      console.log('\n📊 Risultato:');
      console.log('Disponibile:', result.available);
      console.log('Prezzo:', result.price);
      console.log('Titolo:', result.title?.substring(0, 50) + '...');
      console.log('ASIN:', result.asin);
      
      if (result.debug) {
        console.log('\n🔍 DEBUG - Parametri variante:');
        console.log('Variant Params:', result.debug.variantParams);
        
        if (result.debug.selectedVariant) {
          console.log('Variante selezionata:', result.debug.selectedVariant);
        }
        
        console.log('\n🔍 DEBUG - Elementi prezzo trovati:');
        result.debug.allPriceElements.forEach((el, index) => {
          const status = el.inSelectedVariant ? '✅' : '❌';
          console.log(`${index + 1}. ${status} "${el.text}" (${el.selector})`);
        });
      }
      
      if (result.error) {
        console.log('❌ Errore:', result.error);
      }
      
      // Pausa tra le richieste per evitare rate limiting
      if (i < testUrls.length - 1) {
        console.log('\n⏳ Pausa 3 secondi...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n✅ Test completato!');
    console.log('\n📝 Note:');
    console.log('- ✅ = Prezzo nella variante selezionata');
    console.log('- ❌ = Prezzo in altra variante (ignorato)');
    console.log('- Il sistema ora dovrebbe selezionare solo prezzi della variante corretta');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await priceChecker.close();
  }
}

testVariantSelection();
