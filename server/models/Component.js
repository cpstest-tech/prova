import db from '../config/database.js';

export class Component {
  static getByBuildId(buildId) {
    // Esclude i componenti marcati come sostituiti, mostra solo quelli attivi
    const stmt = db.prepare(`
      SELECT * FROM components 
      WHERE build_id = ? AND is_replaced = 0 
      ORDER BY position ASC, id ASC
    `);
    return stmt.all(buildId);
  }

  // Metodo per ottenere tutti i componenti inclusi quelli sostituiti (per admin)
  static getAllByBuildId(buildId) {
    const stmt = db.prepare(`
      SELECT c.*, 
             oc.name as original_name, 
             oc.asin as original_asin,
             oc.amazon_link as original_link
      FROM components c
      LEFT JOIN components oc ON c.original_component_id = oc.id
      WHERE c.build_id = ? 
      ORDER BY c.position ASC, c.id ASC
    `);
    return stmt.all(buildId);
  }

  static create(data) {
    const stmt = db.prepare(`
      INSERT INTO components (
        build_id, type, name, brand, model, price, 
        amazon_link, image_url, specs, position, asin, 
        price_source, price_updated_at, price_cache_expires_at, tier,
        is_replaced, original_component_id, replacement_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.asin || null,
      data.price_source || null,
      data.price_updated_at || null,
      data.price_cache_expires_at || null,
      data.tier || 'C',
      data.is_replaced || 0,
      data.original_component_id || null,
      data.replacement_reason || null
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
    if (data.asin !== undefined) {
      fields.push('asin = ?');
      values.push(data.asin);
    }
    if (data.price_source !== undefined) {
      fields.push('price_source = ?');
      values.push(data.price_source);
    }
    if (data.price_updated_at !== undefined) {
      fields.push('price_updated_at = ?');
      values.push(data.price_updated_at);
    }
    if (data.price_cache_expires_at !== undefined) {
      fields.push('price_cache_expires_at = ?');
      values.push(data.price_cache_expires_at);
    }
    if (data.tier !== undefined) {
      fields.push('tier = ?');
      values.push(data.tier);
    }
    if (data.is_replaced !== undefined) {
      fields.push('is_replaced = ?');
      values.push(data.is_replaced);
    }
    if (data.original_component_id !== undefined) {
      fields.push('original_component_id = ?');
      values.push(data.original_component_id);
    }
    if (data.replacement_reason !== undefined) {
      fields.push('replacement_reason = ?');
      values.push(data.replacement_reason);
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
        amazon_link, image_url, specs, position, asin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          comp.asin || null
        );
      }
    });
    
    insertMany(components);
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM components WHERE id = ?');
    return stmt.get(id);
  }

  static getByTier(tier) {
    const stmt = db.prepare('SELECT * FROM components WHERE tier = ? AND asin IS NOT NULL');
    return stmt.all(tier);
  }

  static getComponentsNeedingPriceUpdate(tier, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare(`
      SELECT * FROM components 
      WHERE tier = ? AND asin IS NOT NULL 
      AND (price_updated_at IS NULL OR price_updated_at < ? OR price_cache_expires_at < ?)
    `);
    return stmt.all(tier, cutoffTime, new Date().toISOString());
  }

  static updatePrice(asin, priceData) {
    const stmt = db.prepare(`
      UPDATE components 
      SET price = ?, price_source = ?, price_updated_at = ?, price_cache_expires_at = ?
      WHERE asin = ?
    `);
    return stmt.run(
      priceData.price,
      priceData.source,
      priceData.last_checked,
      priceData.expires_at,
      asin
    );
  }

  static setTier(componentId, tier) {
    const stmt = db.prepare('UPDATE components SET tier = ? WHERE id = ?');
    return stmt.run(tier, componentId);
  }

  // Nuovo metodo per sostituire un componente mantenendo l'originale
  static replaceComponent(originalComponentId, replacementData) {
    try {
      // Prima ottieni il componente originale
      const originalComponent = this.getById(originalComponentId);
      if (!originalComponent) {
        throw new Error('Componente originale non trovato');
      }

      // Aggiorna il componente originale con flag di sostituzione
      this.update(originalComponentId, {
        is_replaced: 1,
        replacement_reason: replacementData.reason || 'Prodotto non disponibile'
      });

      // Crea il nuovo componente sostitutivo
      const replacementComponent = this.create({
        build_id: originalComponent.build_id,
        type: originalComponent.type,
        name: replacementData.name,
        brand: replacementData.brand || originalComponent.brand,
        model: replacementData.model || originalComponent.model,
        price: replacementData.price,
        amazon_link: replacementData.amazon_link,
        image_url: replacementData.image_url || originalComponent.image_url,
        specs: replacementData.specs || originalComponent.specs,
        position: originalComponent.position,
        asin: replacementData.asin,
        price_source: replacementData.source || 'replacement',
        tier: originalComponent.tier,
        original_component_id: originalComponentId,
        replacement_reason: replacementData.reason || 'Prodotto non disponibile'
      });

      console.log(`✅ Componente ${originalComponent.name} sostituito con ${replacementData.name}`);
      return {
        original: originalComponent,
        replacement: this.getById(replacementComponent)
      };
    } catch (error) {
      console.error(`❌ Errore sostituzione componente ${originalComponentId}:`, error.message);
      throw error;
    }
  }

  // Metodo per ripristinare un componente originale
  static restoreComponent(replacementComponentId) {
    try {
      const replacementComponent = this.getById(replacementComponentId);
      if (!replacementComponent || !replacementComponent.original_component_id) {
        throw new Error('Componente sostitutivo non trovato o non valido');
      }

      const originalComponentId = replacementComponent.original_component_id;

      // Ripristina il componente originale
      this.update(originalComponentId, {
        is_replaced: 0,
        replacement_reason: null
      });

      // Elimina il componente sostitutivo
      this.delete(replacementComponentId);

      console.log(`✅ Componente ripristinato all'originale (ID: ${originalComponentId})`);
      return this.getById(originalComponentId);
    } catch (error) {
      console.error(`❌ Errore ripristino componente ${replacementComponentId}:`, error.message);
      throw error;
    }
  }

  static bulkUpdateTiers(updates) {
    const stmt = db.prepare('UPDATE components SET tier = ? WHERE id = ?');
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.tier, item.id);
      }
    });
    updateMany(updates);
  }
}
