#!/usr/bin/env node

/**
 * Script per aggiornare il database con le nuove tabelle di sicurezza
 * Esegui: node server/scripts/updateSecurityDb.js
 */

import db from '../config/database.js';

console.log('\n🔒 Aggiornamento Database Sicurezza\n');

try {
  // Crea tabella login_attempts se non esiste
  console.log('📝 Creazione tabella login_attempts...');
  
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

  console.log('✅ Tabella login_attempts creata');

  // Crea indici per performance
  console.log('📝 Creazione indici...');
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);
  `);

  console.log('✅ Indici creati');

  // Verifica tabella creata
  const tableInfo = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='login_attempts'").get();
  
  if (tableInfo.count === 1) {
    console.log('\n✅ Database aggiornato con successo!');
    console.log('\n📊 La tabella login_attempts è pronta per tracciare i tentativi di accesso.\n');
  } else {
    console.log('\n❌ Errore: Tabella non creata correttamente\n');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Errore durante l\'aggiornamento del database:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('🎉 Aggiornamento completato!\n');

