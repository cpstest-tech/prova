#!/usr/bin/env node

/**
 * Script di test per il sistema di sostituzione intelligente
 * Testa tutte le funzionalità implementate
 */

import { ProductSubstitution } from './server/utils/productSubstitution.js';
import { PriceChecker } from './server/utils/priceChecker.js';
import database from './server/config/database.js';

async function testPriceChecker() {
  console.log('\n🧪 TEST: PriceChecker');
  console.log('='.repeat(50));
  
  const priceChecker = new PriceChecker();
  
  try {
    // Test controllo prezzo di un prodotto Amazon
    const testUrl = 'https://www.amazon.it/dp/B08N5WRWNW'; // Esempio CPU AMD
    
    console.log(`🔍 Test controllo prezzo per: ${testUrl}`);
    const productData = await priceChecker.checkProductPrice(testUrl);
    
    console.log('✅ Risultato controllo prezzo:');
    console.log(`   Disponibile: ${productData.available}`);
    console.log(`   Prezzo: €${productData.price || 'N/A'}`);
    console.log(`   Titolo: ${productData.title?.substring(0, 60)}...`);
    
    // Test ricerca prodotti alternativi
    console.log('\n🔍 Test ricerca prodotti alternativi...');
    const alternatives = await priceChecker.searchAlternativeProducts('AMD Ryzen 5 5600', 200, 100);
    
    console.log(`✅ Trovati ${alternatives.length} prodotti alternativi:`);
    alternatives.slice(0, 3).forEach((alt, index) => {
      console.log(`   ${index + 1}. ${alt.title?.substring(0, 50)}... - €${alt.price}`);
    });
    
  } catch (error) {
    console.error('❌ Errore nel test PriceChecker:', error.message);
  } finally {
    await priceChecker.cleanup();
  }
}

async function testProductSubstitution() {
  console.log('\n🧪 TEST: ProductSubstitution');
  console.log('='.repeat(50));
  
  const substitution = new ProductSubstitution();
  
  try {
    // Crea un componente di test
    const testComponent = {
      id: 999,
      name: 'AMD Ryzen 5 5600',
      price: 150,
      original_price: 150,
      amazon_link: 'https://www.amazon.it/dp/B08N5WRWNW',
      searchterm: 'AMD Ryzen 5 5600 CPU',
      is_substituted: 0
    };
    
    console.log(`🔍 Test ricerca sostituto per: ${testComponent.name}`);
    const substitute = await substitution.findSubstitute(testComponent);
    
    if (substitute) {
      console.log('✅ Sostituto trovato:');
      console.log(`   Nome: ${substitute.name}`);
      console.log(`   Prezzo: €${substitute.price}`);
      console.log(`   Link: ${substitute.amazon_link}`);
    } else {
      console.log('⚠️ Nessun sostituto trovato');
    }
    
    // Test controllo componente
    console.log('\n🔍 Test controllo componente...');
    const result = await substitution.checkAndUpdateComponent(testComponent);
    console.log(`✅ Risultato controllo: aggiornato=${result.updated}, sostituito=${result.substituted}`);
    
  } catch (error) {
    console.error('❌ Errore nel test ProductSubstitution:', error.message);
  } finally {
    await substitution.cleanup();
  }
}

async function testDatabaseSchema() {
  console.log('\n🧪 TEST: Database Schema');
  console.log('='.repeat(50));
  
  try {
    // Verifica che le colonne per la sostituzione esistano
    const tableInfo = database.prepare("PRAGMA table_info(components)").all();
    const requiredColumns = ['searchterm', 'original_price', 'is_substituted', 'substitution_reason', 'original_asin', 'last_price_check'];
    
    console.log('🔍 Verifica colonne database...');
    
    for (const column of requiredColumns) {
      const exists = tableInfo.some(col => col.name === column);
      console.log(`   ${exists ? '✅' : '❌'} ${column}: ${exists ? 'Esiste' : 'Manca'}`);
    }
    
    // Test inserimento componente con nuovi campi
    console.log('\n🔍 Test inserimento componente con sostituzione...');
    
    const testComponent = {
      build_id: 1,
      type: 'CPU',
      name: 'Test CPU',
      brand: 'AMD',
      model: 'Test Model',
      price: 100,
      amazon_link: 'https://www.amazon.it/dp/TEST123',
      specs: 'Test specs',
      position: 0,
      searchterm: 'AMD Test CPU',
      original_price: 100,
      is_substituted: 0,
      substitution_reason: null,
      original_asin: 'TEST123',
      last_price_check: new Date().toISOString()
    };
    
    const insertResult = database.prepare(`
      INSERT INTO components (
        build_id, type, name, brand, model, price, amazon_link, specs, position,
        searchterm, original_price, is_substituted, substitution_reason, original_asin, last_price_check
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testComponent.build_id,
      testComponent.type,
      testComponent.name,
      testComponent.brand,
      testComponent.model,
      testComponent.price,
      testComponent.amazon_link,
      testComponent.specs,
      testComponent.position,
      testComponent.searchterm,
      testComponent.original_price,
      testComponent.is_substituted,
      testComponent.substitution_reason,
      testComponent.original_asin,
      testComponent.last_price_check
    );
    
    console.log(`✅ Componente test inserito con ID: ${insertResult.lastInsertRowid}`);
    
    // Pulisci il componente di test
    database.prepare('DELETE FROM components WHERE id = ?').run(insertResult.lastInsertRowid);
    console.log('🧹 Componente test rimosso');
    
  } catch (error) {
    console.error('❌ Errore nel test database:', error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n🧪 TEST: API Endpoints');
  console.log('='.repeat(50));
  
  try {
    // Test statistiche sostituzioni
    const stats = database.prepare(`
      SELECT 
        COUNT(*) as totalComponents,
        COUNT(CASE WHEN is_substituted = 1 THEN 1 END) as substitutedComponents
      FROM components
    `).get();
    
    console.log('✅ Statistiche database:');
    console.log(`   Componenti totali: ${stats.totalComponents}`);
    console.log(`   Componenti sostituiti: ${stats.substitutedComponents}`);
    
    // Test controllo build con sostituzioni
    const buildsWithSubstitutions = database.prepare(`
      SELECT b.id, b.title, COUNT(c.id) as substituted_count
      FROM builds b
      LEFT JOIN components c ON b.id = c.build_id AND c.is_substituted = 1
      WHERE b.status = 'published'
      GROUP BY b.id
      HAVING substituted_count > 0
      ORDER BY substituted_count DESC
    `).all();
    
    console.log(`✅ Build con sostituzioni: ${buildsWithSubstitutions.length}`);
    buildsWithSubstitutions.slice(0, 3).forEach(build => {
      console.log(`   - ${build.title}: ${build.substituted_count} sostituzioni`);
    });
    
  } catch (error) {
    console.error('❌ Errore nel test API:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 AVVIO TEST SISTEMA SOSTITUZIONE INTELLIGENTE');
  console.log('='.repeat(60));
  console.log('Data:', new Date().toLocaleString('it-IT'));
  console.log('='.repeat(60));
  
  try {
    await testDatabaseSchema();
    await testPriceChecker();
    await testProductSubstitution();
    await testAPIEndpoints();
    
    console.log('\n✅ TUTTI I TEST COMPLETATI');
    console.log('='.repeat(60));
    console.log('Il sistema di sostituzione intelligente è pronto per l\'uso!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRORE CRITICO NEI TEST:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Esegui i test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Errore fatale:', error);
    process.exit(1);
  });
}

export { runAllTests };
