#!/usr/bin/env node

import db from './server/config/database.js';

console.log('🚀 Setup produzione - Aggiornamento database...');

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

async function setupProduction() {
  try {
    console.log('📊 Aggiunta colonne alla tabella components...');
    
    // Aggiungi colonne alla tabella components
    addColumnIfNotExists('components', 'asin', 'TEXT');
    addColumnIfNotExists('components', 'price_source', 'TEXT');
    addColumnIfNotExists('components', 'price_updated_at', 'DATETIME');
    addColumnIfNotExists('components', 'price_cache_expires_at', 'DATETIME');
    addColumnIfNotExists('components', 'tier', 'TEXT DEFAULT "C"');

    // Aggiungi colonne alla tabella component_alternatives
    addColumnIfNotExists('component_alternatives', 'category_id', 'INTEGER');
    addColumnIfNotExists('component_alternatives', 'is_active', 'BOOLEAN DEFAULT 1');
    
    console.log('\n📊 Creazione tabelle...');
    
    // Crea tabella price_cache
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
    
    // Crea tabella alternative_categories
    createTableIfNotExists(`
      CREATE TABLE IF NOT EXISTS alternative_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        component_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crea tabella component_alternatives (se non esiste)
    createTableIfNotExists(`
      CREATE TABLE IF NOT EXISTS component_alternatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        original_asin TEXT,
        alternative_asin TEXT NOT NULL,
        alternative_name TEXT,
        alternative_price REAL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES alternative_categories(id) ON DELETE CASCADE
      )
    `);
    
    console.log('\n📊 Creazione indici...');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_asin ON components(asin)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_tier ON components(tier)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_components_price_updated ON components(price_updated_at)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_price_cache_asin ON price_cache(asin)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_price_cache_expires ON price_cache(expires_at)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_component_alternatives_original ON component_alternatives(original_asin)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_component_alternatives_category ON component_alternatives(category_id)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_component_alternatives_priority ON component_alternatives(priority)');
    createIndexIfNotExists('CREATE INDEX IF NOT EXISTS idx_alternative_categories_type ON alternative_categories(component_type)');
    
    console.log('\n✅ Setup produzione completato con successo!');
    
    // Mostra statistiche
    const componentCount = db.prepare('SELECT COUNT(*) as count FROM components').get();
    const priceCacheCount = db.prepare('SELECT COUNT(*) as count FROM price_cache').get();
    const alternativesCount = db.prepare('SELECT COUNT(*) as count FROM component_alternatives').get();
    const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM alternative_categories').get();
    
    console.log('\n📈 Statistiche database:');
    console.log(`  Componenti: ${componentCount.count}`);
    console.log(`  Cache prezzi: ${priceCacheCount.count}`);
    console.log(`  Categorie alternative: ${categoriesCount.count}`);
    console.log(`  Alternative: ${alternativesCount.count}`);
    
    console.log('\n🎉 Database pronto per il sistema di aggiornamento prezzi!');
    
  } catch (error) {
    console.error('\n❌ Errore durante il setup:', error.message);
    process.exit(1);
  }
}

setupProduction();
