import db from '../config/database.js';

export class Component {
  static getByBuildId(buildId) {
    const stmt = db.prepare('SELECT * FROM components WHERE build_id = ? ORDER BY position ASC, id ASC');
    return stmt.all(buildId);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO components (
        build_id, type, name, brand, model, price, 
        amazon_link, image_url, specs, position,
        search_query, is_replacement, original_component_id,
        replacement_reason, price_difference, last_checked, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.build_id,
      data.type,
      data.name,
      data.brand || null,
      data.model || null,
      data.price || null,
      data.amazon_link || null,
      data.image_url || null,
      data.specs || null,
      data.position || 0,
      data.search_query || null,
      data.is_replacement || false,
      data.original_component_id || null,
      data.replacement_reason || null,
      data.price_difference || null,
      data.last_checked || null,
      data.is_available !== undefined ? data.is_available : true
    );
    
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.brand !== undefined) {
      fields.push('brand = ?');
      values.push(data.brand);
    }
    if (data.model !== undefined) {
      fields.push('model = ?');
      values.push(data.model);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.amazon_link !== undefined) {
      fields.push('amazon_link = ?');
      values.push(data.amazon_link);
    }
    if (data.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(data.image_url);
    }
    if (data.specs !== undefined) {
      fields.push('specs = ?');
      values.push(data.specs);
    }
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position);
    }
    if (data.search_query !== undefined) {
      fields.push('search_query = ?');
      values.push(data.search_query);
    }
    if (data.is_replacement !== undefined) {
      fields.push('is_replacement = ?');
      values.push(data.is_replacement);
    }
    if (data.original_component_id !== undefined) {
      fields.push('original_component_id = ?');
      values.push(data.original_component_id);
    }
    if (data.replacement_reason !== undefined) {
      fields.push('replacement_reason = ?');
      values.push(data.replacement_reason);
    }
    if (data.price_difference !== undefined) {
      fields.push('price_difference = ?');
      values.push(data.price_difference);
    }
    if (data.last_checked !== undefined) {
      fields.push('last_checked = ?');
      values.push(data.last_checked);
    }
    if (data.is_available !== undefined) {
      fields.push('is_available = ?');
      values.push(data.is_available);
    }
    
    values.push(id);
    
    const stmt = db.prepare(`UPDATE components SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM components WHERE id = ?');
    return stmt.run(id);
  }

  static deleteByBuildId(buildId) {
    const stmt = db.prepare('DELETE FROM components WHERE build_id = ?');
    return stmt.run(buildId);
  }

  static bulkCreate(buildId, components) {
    const stmt = db.prepare(`
      INSERT INTO components (
        build_id, type, name, brand, model, price, 
        amazon_link, image_url, specs, position,
        search_query, is_replacement, original_component_id,
        replacement_reason, price_difference, last_checked, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const comp of items) {
        stmt.run(
          buildId,
          comp.type,
          comp.name,
          comp.brand || null,
          comp.model || null,
          comp.price || null,
          comp.amazon_link || null,
          comp.image_url || null,
          comp.specs || null,
          comp.position || 0,
          comp.search_query || null,
          comp.is_replacement || false,
          comp.original_component_id || null,
          comp.replacement_reason || null,
          comp.price_difference || null,
          comp.last_checked || null,
          comp.is_available !== undefined ? comp.is_available : true
        );
      }
    });
    
    insertMany(components);
  }

  // Metodi per il sistema di sostituzione
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM components WHERE id = ?');
    return stmt.get(id);
  }

  static getReplacements(originalComponentId) {
    const stmt = db.prepare('SELECT * FROM components WHERE original_component_id = ? ORDER BY created_at DESC');
    return stmt.all(originalComponentId);
  }

  static getUnavailableComponents() {
    const stmt = db.prepare('SELECT * FROM components WHERE is_available = FALSE AND is_replacement = FALSE');
    return stmt.all();
  }

  static updateAvailability(id, isAvailable, lastChecked = null) {
    const stmt = db.prepare('UPDATE components SET is_available = ?, last_checked = ? WHERE id = ?');
    return stmt.run(
      isAvailable === true ? 1 : 0, // Converte boolean in integer per SQLite
      lastChecked || new Date().toISOString(), 
      parseInt(id)
    );
  }
}
