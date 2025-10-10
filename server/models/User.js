import db from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByIdWithPassword(id) {
    const stmt = db.prepare('SELECT id, username, email, role, password_hash, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static create(username, password, email = null) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, passwordHash, email);
    return result.lastInsertRowid;
  }

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static updatePassword(userId, newPassword) {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(passwordHash, userId);
  }

  static getAll() {
    const stmt = db.prepare('SELECT id, username, email, role, created_at FROM users');
    return stmt.all();
  }
}
