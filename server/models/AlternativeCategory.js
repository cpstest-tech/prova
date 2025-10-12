import db from '../config/database.js';

export class AlternativeCategory {
  static getAll() {
    const stmt = db.prepare('SELECT * FROM alternative_categories ORDER BY name ASC');
    return stmt.all();
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM alternative_categories WHERE id = ?');
    return stmt.get(id);
  }

  static getByComponentType(componentType) {
    const stmt = db.prepare('SELECT * FROM alternative_categories WHERE component_type = ? ORDER BY name ASC');
    return stmt.all(componentType);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO alternative_categories (name, description, component_type)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name,
      data.description || null,
      data.component_type || null
    );
    
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.component_type !== undefined) {
      fields.push('component_type = ?');
      values.push(data.component_type);
    }
    
    values.push(id);
    
    const stmt = db.prepare(`UPDATE alternative_categories SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM alternative_categories WHERE id = ?');
    return stmt.run(id);
  }

  static getWithAlternatives(id) {
    const category = this.getById(id);
    if (!category) return null;

    const alternativesStmt = db.prepare(`
      SELECT * FROM component_alternatives 
      WHERE category_id = ? AND is_active = 1
      ORDER BY priority ASC, alternative_name ASC
    `);
    
    const alternatives = alternativesStmt.all(id);
    
    return {
      ...category,
      alternatives
    };
  }

  static getStats() {
    const stats = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.component_type,
        COUNT(a.id) as alternatives_count,
        COUNT(CASE WHEN a.alternative_price IS NOT NULL AND a.alternative_price > 0 THEN 1 END) as with_prices
      FROM alternative_categories c
      LEFT JOIN component_alternatives a ON c.id = a.category_id AND a.is_active = 1
      GROUP BY c.id, c.name, c.component_type
      ORDER BY c.name ASC
    `).all();

    return stats;
  }
}
