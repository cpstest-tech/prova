import db from '../config/database.js';

export function initializeDatabase() {
  // Tabella utenti
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella build
  db.exec(`
    CREATE TABLE IF NOT EXISTS builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      content TEXT,
      featured_image TEXT,
      budget INTEGER,
      category TEXT,
      status TEXT DEFAULT 'draft',
      meta_title TEXT,
      meta_description TEXT,
      views INTEGER DEFAULT 0,
      author_id INTEGER,
      affiliate_tag TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // Aggiungi colonna affiliate_tag se non esiste (per database esistenti)
  try {
    // Verifica se la colonna esiste già
    const tableInfo = db.prepare("PRAGMA table_info(builds)").all();
    const hasAffiliateTag = tableInfo.some(column => column.name === 'affiliate_tag');
    
    if (!hasAffiliateTag) {
      db.exec(`ALTER TABLE builds ADD COLUMN affiliate_tag TEXT`);
      console.log('✅ Colonna affiliate_tag aggiunta alla tabella builds');
    } else {
      console.log('ℹ️  Colonna affiliate_tag già presente nella tabella builds');
    }
  } catch (error) {
    console.error('❌ Errore nell\'aggiunta della colonna affiliate_tag:', error.message);
  }

  // Aggiungi colonne per il sistema di sostituzione componenti
  try {
    db.exec('ALTER TABLE components ADD COLUMN is_replaced INTEGER DEFAULT 0');
    console.log('✅ Aggiunta colonna is_replaced alla tabella components');
  } catch (error) {
    console.log('⚠️ Colonna is_replaced già esistente o errore:', error.message);
  }

  try {
    db.exec('ALTER TABLE components ADD COLUMN original_component_id INTEGER');
    console.log('✅ Aggiunta colonna original_component_id alla tabella components');
  } catch (error) {
    console.log('⚠️ Colonna original_component_id già esistente o errore:', error.message);
  }

  try {
    db.exec('ALTER TABLE components ADD COLUMN replacement_reason TEXT');
    console.log('✅ Aggiunta colonna replacement_reason alla tabella components');
  } catch (error) {
    console.log('⚠️ Colonna replacement_reason già esistente o errore:', error.message);
  }

  // Tabella componenti
  db.exec(`
    CREATE TABLE IF NOT EXISTS components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      price REAL,
      amazon_link TEXT,
      image_url TEXT,
      specs TEXT,
      position INTEGER DEFAULT 0,
      asin TEXT,
      price_source TEXT,
      price_updated_at DATETIME,
      price_cache_expires_at DATETIME,
      tier TEXT DEFAULT 'C',
      is_replaced INTEGER DEFAULT 0,
      original_component_id INTEGER,
      replacement_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
      FOREIGN KEY (original_component_id) REFERENCES components(id) ON DELETE SET NULL
    )
  `);

  // Tabella cache prezzi
  db.exec(`
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

  // Tabella categorie alternative
  db.exec(`
    CREATE TABLE IF NOT EXISTS alternative_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      component_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella alternative componenti
  db.exec(`
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


  // Tabella tentativi di login (security logging)
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      success INTEGER DEFAULT 0,
      reason TEXT,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indici per performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_builds_slug ON builds(slug);
    CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
    CREATE INDEX IF NOT EXISTS idx_builds_category ON builds(category);
    CREATE INDEX IF NOT EXISTS idx_components_build ON components(build_id);
    CREATE INDEX IF NOT EXISTS idx_components_asin ON components(asin);
    CREATE INDEX IF NOT EXISTS idx_components_tier ON components(tier);
    CREATE INDEX IF NOT EXISTS idx_components_price_updated ON components(price_updated_at);
    CREATE INDEX IF NOT EXISTS idx_price_cache_asin ON price_cache(asin);
    CREATE INDEX IF NOT EXISTS idx_price_cache_expires ON price_cache(expires_at);
    CREATE INDEX IF NOT EXISTS idx_component_alternatives_original ON component_alternatives(original_asin);
    CREATE INDEX IF NOT EXISTS idx_component_alternatives_category ON component_alternatives(category_id);
    CREATE INDEX IF NOT EXISTS idx_component_alternatives_priority ON component_alternatives(priority);
    CREATE INDEX IF NOT EXISTS idx_alternative_categories_type ON alternative_categories(component_type);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);
  `);

  console.log('✅ Database schema inizializzato');
}

export default db;
