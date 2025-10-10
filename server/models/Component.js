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
        amazon_link, image_url, specs, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.position || 0
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
        amazon_link, image_url, specs, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          comp.position || 0
        );
      }
    });
    
    insertMany(components);
  }
}
