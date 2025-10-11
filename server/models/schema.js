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

  // Aggiungi nuove colonne per sistema sostituzione componenti
  try {
    const componentsTableInfo = db.prepare("PRAGMA table_info(components)").all();
    const componentColumns = componentsTableInfo.map(col => col.name);
    
    const newColumns = [
      { name: 'search_query', type: 'TEXT' },
      { name: 'is_replacement', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'original_component_id', type: 'INTEGER' },
      { name: 'replacement_reason', type: 'TEXT' },
      { name: 'price_difference', type: 'DECIMAL(10,2)' },
      { name: 'last_checked', type: 'DATETIME' },
      { name: 'is_available', type: 'BOOLEAN DEFAULT TRUE' }
    ];
    
    for (const column of newColumns) {
      if (!componentColumns.includes(column.name)) {
        db.exec(`ALTER TABLE components ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Colonna ${column.name} aggiunta alla tabella components`);
      } else {
        console.log(`ℹ️  Colonna ${column.name} già presente nella tabella components`);
      }
    }
    
    // Aggiungi foreign key se non esiste
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_components_original ON components(original_component_id)`);
    } catch (error) {
      console.log('ℹ️  Indice original_component_id già presente o errore:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Errore nell\'aggiunta delle colonne components:', error.message);
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
      search_query TEXT,
      is_replacement BOOLEAN DEFAULT FALSE,
      original_component_id INTEGER,
      replacement_reason TEXT,
      price_difference DECIMAL(10,2),
      last_checked DATETIME,
      is_available BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
      FOREIGN KEY (original_component_id) REFERENCES components(id)
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
    CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);
  `);

  console.log('✅ Database schema inizializzato');
}

export default db;
