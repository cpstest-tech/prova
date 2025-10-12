#!/usr/bin/env node

/**
 * Script per aggiornare il database esistente
 */

import database from './server/config/database.js';

console.log('🔧 AGGIORNAMENTO DATABASE');
console.log('='.repeat(50));

try {
  console.log('\n📊 STATISTICHE DATABASE:');
  const componentCount = database.prepare('SELECT COUNT(*) as count FROM components').get();
  const buildCount = database.prepare('SELECT COUNT(*) as count FROM builds').get();
  
  console.log(`Componenti totali: ${componentCount.count}`);
  console.log(`Build totali: ${buildCount.count}`);
  
  console.log('\n✅ Database verificato con successo!');
  
} catch (error) {
  console.error('\n❌ ERRORE NELLA VERIFICA:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
