#!/usr/bin/env node

import db from './server/config/database.js';

console.log('🔄 Migrazione database per sistema prezzi...');

function addColumnIfNotExists(table, column, definition) {
  try {
    // Verifica se la colonna esiste già
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasColumn = tableInfo.some(col => col.name === column);
    
    if (!hasColumn) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`✅ Aggiunta colonna ${column} alla tabella ${table}`);
      return true;
    } else {
      console.log(`ℹ️  Colonna ${column} già presente nella tabella ${table}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Errore nell'aggiunta della colonna ${column} alla tabella ${table}:`, error.message);
    return false;
  }
}

function createTableIfNotExists(sql) {
  try {
    db.exec(sql);
    console.log(`✅ Tabella creata o già esistente`);
  } catch (error) {
    console.error(`❌ Errore creazione tabella:`, error.message);
  }
}

function createIndexIfNotExists(sql) {
  try {
    db.exec(sql);
    console.log(`✅ Indice creato o già esistente`);
  } catch (error) {
    console.error(`❌ Errore creazione indice:`, error.message);
  }
}

async function main() {
  try {
    console.log('📊 Aggiunta colonne alla tabella components...');
    
    // Aggiungi colonne alla tabella components
    addColumnIfNotExists('components', 'asin', 'TEXT');
    addColumnIfNotExists('components', 'price_source', 'TEXT');
    addColumnIfNotExists('components', 'price_updated_at', 'DATETIME');
    addColumnIfNotExists('components', 'price_cache_expires_at', 'DATETIME');
    addColumnIfNotExists('components', 'tier', 'TEXT DEFAULT "C"');
    
    console.log('\n📊 Creazione tabella price_cache...');
    createTableIfNotExists(`
      CREATE TABLE IF NOT EXISTS price_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asin TEXT UNIQUE NOT NULL,
        price REAL,
        source TEXT,
        url TEXT,
        last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('\n📊 Creazione tabella component_alternatives...');
    createTableIfNotExists(`
      CREATE TABLE IF NOT EXISTS component_alternatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_asin TEXT NOT NULL,
        alternative_asin TEXT NOT NULL,
        alternative_name TEXT,
        alternative_price REAL,
        priority INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('\n📊 Creazione indici...');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_asin ON components(asin)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_tier ON components(tier)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_price_updated ON components(price_updated_at)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_price_cache_asin ON price_cache(asin)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_price_cache_expires ON price_cache(expires_at)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_component_alternatives_original ON component_alternatives(original_asin)');
    
    console.log('\n✅ Migrazione database completata con successo!');
    
    // Mostra statistiche
    const componentCount = db.prepare('SELECT COUNT(*) as count FROM components').get();
    const priceCacheCount = db.prepare('SELECT COUNT(*) as count FROM price_cache').get();
    const alternativesCount = db.prepare('SELECT COUNT(*) as count FROM component_alternatives').get();
    
    console.log('\n📈 Statistiche database:');
    console.log(`  Componenti: ${componentCount.count}`);
    console.log(`  Cache prezzi: ${priceCacheCount.count}`);
    console.log(`  Alternative: ${alternativesCount.count}`);
    
  } catch (error) {
    console.error('\n❌ Errore durante la migrazione:', error.message);
    process.exit(1);
  }
}

main();
