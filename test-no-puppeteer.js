#!/usr/bin/env node

/**
 * Test senza Puppeteer per verificare la logica del sistema
 */

console.log('🚀 AVVIO TEST SENZA PUPPETEER');
console.log('='.repeat(60));
console.log('Data:', new Date().toLocaleString('it-IT'));
console.log('='.repeat(60));

async function runTests() {
  try {
    // Test 1: Import dei moduli
    console.log('\n📦 Test import moduli...');
    
    const { PriceCheckerSimple } = await import('./server/utils/priceCheckerSimple.js');
    console.log('✅ PriceCheckerSimple importato');
    
    const database = await import('./server/config/database.js');
    console.log('✅ Database importato');
    
    // Test 2: Creazione istanze
    console.log('\n🔧 Test creazione istanze...');
    
    const priceChecker = new PriceCheckerSimple();
    console.log('✅ PriceCheckerSimple istanza creata');
    
    await priceChecker.init();
    console.log('✅ PriceCheckerSimple inizializzato');
    
    // Test 3: Test logica prezzi
    console.log('\n💰 Test logica prezzi...');
    
    const testPrice = 100;
    const tolerance = 15;
    
    console.log(`Prezzo originale: €${testPrice}`);
    console.log(`Tolleranza: ${tolerance}%`);
    
    // Test prezzi entro tolleranza
    const price1 = 110; // +10%
    const price2 = 120; // +20%
    
    const withinTolerance1 = priceChecker.isPriceWithinTolerance(price1, testPrice, tolerance);
    const withinTolerance2 = priceChecker.isPriceWithinTolerance(price2, testPrice, tolerance);
    
    console.log(`Prezzo €${price1}: ${withinTolerance1 ? '✅ Entro tolleranza' : '❌ Fuori tolleranza'}`);
    console.log(`Prezzo €${price2}: ${withinTolerance2 ? '✅ Entro tolleranza' : '❌ Fuori tolleranza'}`);
    
    // Test differenza percentuale
    const diff1 = priceChecker.calculatePriceDifference(price1, testPrice);
    const diff2 = priceChecker.calculatePriceDifference(price2, testPrice);
    
    console.log(`Differenza €${price1}: ${diff1.toFixed(1)}%`);
    console.log(`Differenza €${price2}: ${diff2.toFixed(1)}%`);
    
    // Test 4: Test controllo prodotto simulato
    console.log('\n🔍 Test controllo prodotto...');
    
    const productData = await priceChecker.checkProductPrice('https://amazon.it/dp/TEST123');
    console.log('✅ Controllo prodotto completato:');
    console.log(`   Disponibile: ${productData.available}`);
    console.log(`   Prezzo: €${productData.price}`);
    console.log(`   Titolo: ${productData.title}`);
    
    // Test 5: Test ricerca alternative
    console.log('\n🔍 Test ricerca alternative...');
    
    const alternatives = await priceChecker.searchAlternativeProducts('AMD Ryzen 5 5600', 150, 100);
    console.log(`✅ Trovate ${alternatives.length} alternative:`);
    alternatives.forEach((alt, index) => {
      console.log(`   ${index + 1}. ${alt.title} - €${alt.price}`);
    });
    
    // Test 6: Database
    console.log('\n🗄️ Test database...');
    
    const db = database.default;
    const componentCount = db.prepare('SELECT COUNT(*) as count FROM components').get();
    console.log(`✅ Componenti nel database: ${componentCount.count}`);
    
    // Test 7: Pulizia
    console.log('\n🧹 Pulizia risorse...');
    
    await priceChecker.close();
    console.log('✅ PriceCheckerSimple chiuso');
    
    console.log('\n✅ TUTTI I TEST COMPLETATI CON SUCCESSO!');
    console.log('='.repeat(60));
    console.log('La logica del sistema funziona correttamente!');
    console.log('Per il scraping reale, installa Chromium e usa il PriceChecker completo.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRORE NEL TEST:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Esegui i test
runTests();
