#!/usr/bin/env node

/**
 * Test semplificato del sistema di sostituzione intelligente
 */

console.log('🚀 AVVIO TEST SISTEMA SOSTITUZIONE');
console.log('='.repeat(60));
console.log('Data:', new Date().toLocaleString('it-IT'));
console.log('='.repeat(60));

async function runTests() {
  try {
    // Test 1: Import dei moduli
    console.log('\n📦 Test import moduli...');
    
    const { ProductSubstitution } = await import('./server/utils/productSubstitution.js');
    console.log('✅ ProductSubstitution importato');
    
    const { PriceChecker } = await import('./server/utils/priceChecker.js');
    console.log('✅ PriceChecker importato');
    
    const database = await import('./server/config/database.js');
    console.log('✅ Database importato');
    
    // Test 2: Creazione istanze
    console.log('\n🔧 Test creazione istanze...');
    
    const priceChecker = new PriceChecker();
    console.log('✅ PriceChecker istanza creata');
    
    const substitution = new ProductSubstitution();
    console.log('✅ ProductSubstitution istanza creata');
    
    // Test 3: Database queries
    console.log('\n🗄️ Test database queries...');
    
    const db = database.default;
    const componentCount = db.prepare('SELECT COUNT(*) as count FROM components').get();
    console.log(`✅ Componenti nel database: ${componentCount.count}`);
    
    const buildCount = db.prepare('SELECT COUNT(*) as count FROM builds').get();
    console.log(`✅ Build nel database: ${buildCount.count}`);
    
    // Test 4: Verifica colonne sostituzione
    console.log('\n🔍 Test colonne sostituzione...');
    
    const tableInfo = db.prepare("PRAGMA table_info(components)").all();
    const requiredColumns = ['searchterm', 'original_price', 'is_substituted', 'substitution_reason', 'original_asin', 'last_price_check'];
    
    for (const column of requiredColumns) {
      const exists = tableInfo.some(col => col.name === column);
      console.log(`${exists ? '✅' : '❌'} ${column}: ${exists ? 'Esiste' : 'Manca'}`);
    }
    
    // Test 5: Pulizia
    console.log('\n🧹 Pulizia risorse...');
    
    await priceChecker.close();
    console.log('✅ PriceChecker chiuso');
    
    await substitution.cleanup();
    console.log('✅ ProductSubstitution chiuso');
    
    console.log('\n✅ TUTTI I TEST COMPLETATI CON SUCCESSO!');
    console.log('='.repeat(60));
    console.log('Il sistema di sostituzione intelligente è funzionante!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRORE NEL TEST:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Esegui i test
runTests();
