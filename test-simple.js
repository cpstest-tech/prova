#!/usr/bin/env node

/**
 * Test semplificato per verificare che il sistema funzioni
 */

console.log('🚀 AVVIO TEST SEMPLIFICATO');
console.log('='.repeat(50));

// Test 1: Verifica che i file esistano
import fs from 'fs';
import path from 'path';

console.log('📁 Test esistenza file...');

const filesToCheck = [
  'server/utils/priceChecker.js',
  'server/utils/productSubstitution.js',
  'server/utils/amazonParser.js',
  'server/scripts/scheduledPriceCheck.js',
  'server/config/database.js'
];

for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Esiste`);
  } else {
    console.log(`❌ ${file} - Non trovato`);
  }
}

// Test 2: Verifica package.json
console.log('\n📦 Test package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json valido');
  
  const requiredDeps = ['puppeteer', 'node-cron'];
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - Presente (${packageJson.dependencies[dep]})`);
    } else {
      console.log(`❌ ${dep} - Mancante`);
    }
  }
} catch (error) {
  console.log(`❌ Errore nel package.json: ${error.message}`);
}

// Test 3: Verifica database
console.log('\n🗄️ Test database...');
try {
  const dbPath = 'server/database/buildpc.db';
  if (fs.existsSync(dbPath)) {
    console.log('✅ Database esiste');
    
    // Prova a leggere le dimensioni
    const stats = fs.statSync(dbPath);
    console.log(`   Dimensione: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log('❌ Database non trovato');
  }
} catch (error) {
  console.log(`❌ Errore nel database: ${error.message}`);
}

// Test 4: Verifica import di base
console.log('\n🔗 Test import di base...');
try {
  // Test import semplice
  const testImport = await import('./server/config/database.js');
  console.log('✅ Import database funziona');
} catch (error) {
  console.log(`❌ Errore import database: ${error.message}`);
}

console.log('\n✅ TEST SEMPLIFICATO COMPLETATO');
console.log('='.repeat(50));
