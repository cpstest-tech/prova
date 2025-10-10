import db from '../config/database.js';
import slugify from 'slugify';

export class Build {
  static getAll(status = null) {
    let query = 'SELECT * FROM builds';
    if (status) {
      query += ' WHERE status = ?';
      const stmt = db.prepare(query + ' ORDER BY created_at DESC');
      return stmt.all(status);
    }
    const stmt = db.prepare(query + ' ORDER BY created_at DESC');
    return stmt.all();
  }

  static getPublished(limit = null) {
    let query = 'SELECT * FROM builds WHERE status = ? ORDER BY published_at DESC, created_at DESC';
    if (limit) {
      query += ' LIMIT ?';
      const stmt = db.prepare(query);
      return stmt.all('published', limit);
    }
    const stmt = db.prepare(query);
    return stmt.all('published');
  }

  static getBySlug(slug) {
    const stmt = db.prepare('SELECT * FROM builds WHERE slug = ?');
    return stmt.get(slug);
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM builds WHERE id = ?');
    return stmt.get(id);
  }

  static create(data) {
    const slug = slugify(data.title, { lower: true, strict: true });
    const stmt = db.prepare(`
      INSERT INTO builds (
        title, slug, description, content, featured_image, 
        budget, category, status, meta_title, meta_description, author_id, affiliate_tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.title,
      slug,
      data.description || null,
      data.content || null,
      data.featured_image || null,
      data.budget || null,
      data.category || null,
      data.status || 'draft',
      data.meta_title || data.title,
      data.meta_description || data.description,
      data.author_id || 1,
      data.affiliate_tag || null
    );
    
    return { id: result.lastInsertRowid, slug };
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
      if (data.updateSlug !== false) {
        fields.push('slug = ?');
        values.push(slugify(data.title, { lower: true, strict: true }));
      }
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.featured_image !== undefined) {
      fields.push('featured_image = ?');
      values.push(data.featured_image);
    }
    if (data.budget !== undefined) {
      fields.push('budget = ?');
      values.push(data.budget);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
      if (data.status === 'published') {
        fields.push('published_at = CURRENT_TIMESTAMP');
      }
    }
    if (data.meta_title !== undefined) {
      fields.push('meta_title = ?');
      values.push(data.meta_title);
    }
    if (data.meta_description !== undefined) {
      fields.push('meta_description = ?');
      values.push(data.meta_description);
    }
    if (data.affiliate_tag !== undefined) {
      fields.push('affiliate_tag = ?');
      values.push(data.affiliate_tag);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`UPDATE builds SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM builds WHERE id = ?');
    return stmt.run(id);
  }

  static incrementViews(id) {
    const stmt = db.prepare('UPDATE builds SET views = views + 1 WHERE id = ?');
    return stmt.run(id);
  }

  static getByCategory(category) {
    const stmt = db.prepare('SELECT * FROM builds WHERE category = ? AND status = ? ORDER BY created_at DESC');
    return stmt.all(category, 'published');
  }
}
