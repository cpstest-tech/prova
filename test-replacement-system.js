#!/usr/bin/env node

/**
 * Script di test per il sistema di sostituzione intelligente componenti
 * Esegue test delle funzionalità principali
 */

import { checkComponentAvailability, extractASIN } from './server/utils/availabilityChecker.js';
import { findAlternativeByQuery, validateSearchQuery, suggestSearchQueries } from './server/utils/alternativeFinder.js';
import { checkAndReplaceComponents, regenerateAmazonCart } from './server/utils/smartReplacer.js';
import { Component } from './server/models/Component.js';
import { Build } from './server/models/Build.js';
import './server/config/database.js';

// Colori per console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log('cyan', `\n🧪 Test: ${testName}`);
  log('blue', '='.repeat(50));
}

function logSuccess(message) {
  log('green', `✅ ${message}`);
}

function logError(message) {
  log('red', `❌ ${message}`);
}

function logWarning(message) {
  log('yellow', `⚠️  ${message}`);
}

function logInfo(message) {
  log('blue', `ℹ️  ${message}`);
}

/**
 * Test 1: Estrazione ASIN da link Amazon
 */
async function testASINExtraction() {
  logTest('Estrazione ASIN da link Amazon');
  
  const testUrls = [
    'https://www.amazon.it/dp/B08N5WRWNW',
    'https://www.amazon.it/product/B08N5WRWNW',
    'https://www.amazon.it/gp/product/B08N5WRWNW',
    'https://www.amazon.it/exec/obidos/ASIN/B08N5WRWNW',
    'invalid-url',
    null
  ];
  
  for (const url of testUrls) {
    const asin = extractASIN(url);
    if (asin) {
      logSuccess(`ASIN estratto da "${url}": ${asin}`);
    } else {
      logWarning(`Nessun ASIN estratto da "${url}"`);
    }
  }
}

/**
 * Test 2: Controllo disponibilità componenti
 */
async function testComponentAvailability() {
  logTest('Controllo disponibilità componenti');
  
  const testComponent = {
    id: 1,
    name: 'AMD Ryzen 5 5600',
    amazon_link: 'https://www.amazon.it/dp/B08N5WRWNW'
  };
  
  try {
    const availability = await checkComponentAvailability(testComponent);
    logInfo(`Risultato controllo disponibilità:`, availability);
    
    if (availability.available) {
      logSuccess(`Componente disponibile - Prezzo: €${availability.price}`);
    } else {
      logWarning(`Componente non disponibile: ${availability.error || 'Motivo sconosciuto'}`);
    }
  } catch (error) {
    logError(`Errore nel controllo disponibilità: ${error.message}`);
  }
}

/**
 * Test 3: Validazione query di ricerca
 */
async function testSearchQueryValidation() {
  logTest('Validazione query di ricerca');
  
  const testQueries = [
    'RTX 4060 Ti OR RTX 4070 OR RX 7600',
    'DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz',
    '', // Query vuota
    'A'.repeat(501), // Query troppo lunga
    'RTX 4060 OR RTX 4060 Ti OR RTX 4070 OR RX 7600 OR RTX 3060 Ti OR RTX 3060 OR RTX 3060 Super OR RTX 3070 OR RX 6600 OR RX 6600 XT OR RX 6700 XT', // Troppe alternative
    'RTX 4060 OR OR RTX 4070' // Alternative vuote
  ];
  
  for (const query of testQueries) {
    const validation = validateSearchQuery(query);
    if (validation.valid) {
      logSuccess(`Query valida: "${query}" (${validation.alternatives} alternative)`);
    } else {
      logWarning(`Query non valida: "${query}" - ${validation.error}`);
    }
  }
}

/**
 * Test 4: Suggerimenti query di ricerca
 */
async function testSearchQuerySuggestions() {
  logTest('Suggerimenti query di ricerca');
  
  const testComponents = [
    { type: 'GPU', name: 'RTX 4060 8GB' },
    { type: 'CPU', name: 'Ryzen 5 5600' },
    { type: 'RAM', name: 'DDR4 16GB 3200MHz' },
    { type: 'SSD', name: 'NVMe 1TB' },
    { type: 'PSU', name: '650W 80 Plus Gold' }
  ];
  
  for (const component of testComponents) {
    const suggestions = suggestSearchQueries(component.type, component.name);
    logInfo(`Suggerimenti per ${component.type} "${component.name}":`);
    suggestions.forEach((suggestion, index) => {
      logInfo(`  ${index + 1}. ${suggestion}`);
    });
  }
}

/**
 * Test 5: Ricerca alternative
 */
async function testAlternativeSearch() {
  logTest('Ricerca alternative');
  
  const testComponent = {
    id: 1,
    name: 'RTX 4060 8GB',
    type: 'GPU',
    search_query: 'RTX 4060 Ti OR RTX 4070 OR RX 7600'
  };
  
  try {
    const alternative = await findAlternativeByQuery(testComponent);
    if (alternative) {
      logSuccess(`Alternativa trovata: ${alternative.name}`);
      logInfo(`Prezzo: €${alternative.price}`);
      logInfo(`Disponibilità: ${alternative.availability}`);
      logInfo(`Query usata: ${alternative.searchQuery}`);
    } else {
      logWarning('Nessuna alternativa trovata');
    }
  } catch (error) {
    logError(`Errore nella ricerca alternative: ${error.message}`);
  }
}

/**
 * Test 6: Controllo e sostituzione componenti (simulato)
 */
async function testComponentReplacement() {
  logTest('Controllo e sostituzione componenti');
  
  try {
    // Simula una build con componenti
    const mockBuildId = 999;
    
    logInfo('Simulazione controllo build...');
    
    // Nota: In un test reale, dovresti avere una build esistente nel database
    logWarning('Questo test richiede una build esistente nel database');
    logInfo('Per testare completamente, crea prima una build con componenti');
    
  } catch (error) {
    logError(`Errore nel test sostituzione: ${error.message}`);
  }
}

/**
 * Test 7: Rigenerazione carrello Amazon
 */
async function testCartRegeneration() {
  logTest('Rigenerazione carrello Amazon');
  
  try {
    // Simula componenti con link Amazon
    const mockComponents = [
      { amazon_link: 'https://www.amazon.it/dp/B08N5WRWNW', is_available: true },
      { amazon_link: 'https://www.amazon.it/dp/B08N5WRWNW', is_available: true },
      { amazon_link: 'invalid-link', is_available: true },
      { amazon_link: 'https://www.amazon.it/dp/B08N5WRWNW', is_available: false }
    ];
    
    logInfo('Simulazione rigenerazione carrello con componenti mock...');
    
    // In un test reale, useresti regenerateAmazonCart con un buildId esistente
    logWarning('Questo test richiede una build esistente nel database');
    
  } catch (error) {
    logError(`Errore nel test rigenerazione carrello: ${error.message}`);
  }
}

/**
 * Test 8: Statistiche database
 */
async function testDatabaseStats() {
  logTest('Statistiche database');
  
  try {
    // Conta componenti totali
    const builds = await Build.getAll();
    logInfo(`Build totali nel database: ${builds.length}`);
    
    // Conta componenti sostituiti
    const unavailableComponents = await Component.getUnavailableComponents();
    logInfo(`Componenti non disponibili: ${unavailableComponents.length}`);
    
    const replacedComponents = unavailableComponents.filter(c => c.is_replacement);
    logInfo(`Componenti sostituiti: ${replacedComponents.length}`);
    
    if (replacedComponents.length > 0) {
      logInfo('Esempi di componenti sostituiti:');
      replacedComponents.slice(0, 3).forEach(comp => {
        logInfo(`  - ${comp.name} (${comp.replacement_reason})`);
      });
    }
    
  } catch (error) {
    logError(`Errore nel recupero statistiche: ${error.message}`);
  }
}

/**
 * Esegue tutti i test
 */
async function runAllTests() {
  log('bright', '\n🚀 AVVIO TEST SISTEMA SOSTITUZIONE INTELLIGENTE');
  log('bright', '='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    await testASINExtraction();
    await testComponentAvailability();
    await testSearchQueryValidation();
    await testSearchQuerySuggestions();
    await testAlternativeSearch();
    await testComponentReplacement();
    await testCartRegeneration();
    await testDatabaseStats();
    
    const duration = Date.now() - startTime;
    logSuccess(`\n🎉 Tutti i test completati in ${duration}ms`);
    
  } catch (error) {
    logError(`\n💥 Errore durante i test: ${error.message}`);
    process.exit(1);
  }
}

// Esegui i test se il file viene chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(() => {
      log('green', '\n✅ Test completati con successo!');
      process.exit(0);
    })
    .catch(error => {
      log('red', `\n❌ Test falliti: ${error.message}`);
      process.exit(1);
    });
}

export { runAllTests };
