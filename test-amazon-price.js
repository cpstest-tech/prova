#!/usr/bin/env node

/**
 * Test rapido per verificare i prezzi Amazon
 */

import { PriceChecker } from './server/utils/priceChecker.js';

async function testAmazonPrice() {
  console.log('🔍 Test prezzi Amazon...');
  
  const priceChecker = new PriceChecker();
  
  try {
    await priceChecker.init();
    
    // Test con un prodotto noto
    const testUrl = 'https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21';
    console.log(`\n🔍 Test URL: ${testUrl}`);
    
    const result = await priceChecker.checkProductPrice(testUrl);
    
    console.log('\n📊 Risultato:');
    console.log('Disponibile:', result.available);
    console.log('Prezzo:', result.price);
    console.log('Titolo:', result.title);
    console.log('ASIN:', result.asin);
    console.log('Errore:', result.error);
    
    if (result.price > 200) {
      console.log('\n⚠️ ATTENZIONE: Prezzo sembra troppo alto!');
      console.log('Il prodotto dovrebbe costare circa €60-80, non €' + result.price);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await priceChecker.close();
  }
}

testAmazonPrice();
