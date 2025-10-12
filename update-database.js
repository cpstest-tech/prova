#!/usr/bin/env node

/**
 * Script per aggiornare il database esistente con le nuove colonne
 */

import database from './server/config/database.js';

console.log('🔧 AGGIORNAMENTO DATABASE');
console.log('='.repeat(50));

try {
  // Verifica colonne esistenti
  console.log('🔍 Verifica colonne esistenti...');
  const tableInfo = database.prepare("PRAGMA table_info(components)").all();
  const existingColumns = tableInfo.map(col => col.name);
  console.log('Colonne esistenti:', existingColumns);

  // Colonne da aggiungere
  const columnsToAdd = [
    { name: 'searchterm', type: 'TEXT' },
    { name: 'original_price', type: 'REAL' },
    { name: 'is_substituted', type: 'INTEGER DEFAULT 0' },
    { name: 'substitution_reason', type: 'TEXT' },
    { name: 'original_asin', type: 'TEXT' },
    { name: 'last_price_check', type: 'DATETIME' }
  ];

  console.log('\n📝 Aggiunta colonne mancanti...');
  
  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      try {
        const query = `ALTER TABLE components ADD COLUMN ${column.name} ${column.type}`;
        console.log(`Aggiunta colonna: ${column.name}`);
        database.exec(query);
        console.log(`✅ ${column.name} aggiunta con successo`);
      } catch (error) {
        console.log(`❌ Errore aggiunta ${column.name}: ${error.message}`);
      }
    } else {
      console.log(`ℹ️  ${column.name} già presente`);
    }
  }

  // Aggiorna original_price per componenti esistenti
  console.log('\n💰 Aggiornamento prezzi originali...');
  const updateResult = database.prepare(`
    UPDATE components 
    SET original_price = price 
    WHERE original_price IS NULL AND price IS NOT NULL
  `).run();
  
  console.log(`✅ ${updateResult.changes} componenti aggiornati con prezzo originale`);

  // Verifica finale
  console.log('\n✅ Verifica finale...');
  const finalTableInfo = database.prepare("PRAGMA table_info(components)").all();
  const finalColumns = finalTableInfo.map(col => col.name);
  
  console.log('Colonne finali:', finalColumns);
  
  const allRequiredColumns = columnsToAdd.map(col => col.name);
  const missingColumns = allRequiredColumns.filter(col => !finalColumns.includes(col));
  
  if (missingColumns.length === 0) {
    console.log('\n🎉 AGGIORNAMENTO DATABASE COMPLETATO CON SUCCESSO!');
    console.log('Tutte le colonne per la sostituzione intelligente sono presenti.');
  } else {
    console.log('\n❌ Colonne ancora mancanti:', missingColumns);
  }

} catch (error) {
  console.error('\n❌ ERRORE NELL\'AGGIORNAMENTO:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

console.log('\n📊 STATISTICHE FINALI:');
try {
  const componentCount = database.prepare('SELECT COUNT(*) as count FROM components').get();
  const buildCount = database.prepare('SELECT COUNT(*) as count FROM builds').get();
  
  console.log(`Componenti totali: ${componentCount.count}`);
  console.log(`Build totali: ${buildCount.count}`);
  
  // Conta componenti con searchterm
  const withSearchterm = database.prepare(`
    SELECT COUNT(*) as count 
    FROM components 
    WHERE searchterm IS NOT NULL AND searchterm != ''
  `).get();
  
  console.log(`Componenti con searchterm: ${withSearchterm.count}`);
  
} catch (error) {
  console.error('Errore nelle statistiche:', error.message);
}

console.log('\n✅ Database aggiornato! Ora puoi usare il sistema di sostituzione intelligente.');
