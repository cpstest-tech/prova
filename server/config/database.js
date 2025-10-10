import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../database');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'buildpc.db');

// Crea directory se non esiste
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Abilita foreign keys
db.pragma('foreign_keys = ON');

// Ottimizzazioni
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log(`📦 Database connesso: ${dbPath}`);

export default db;
