import db from '../config/database.js';
import { fetchPrice } from './priceUpdater.js';

class ComponentAlternatives {
  static async addAlternative(originalAsin, alternativeAsin, alternativeName, alternativePrice, priority = 1) {
    try {
      const stmt = db.prepare(`
        INSERT INTO component_alternatives 
        (original_asin, alternative_asin, alternative_name, alternative_price, priority)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(originalAsin, alternativeAsin, alternativeName, alternativePrice, priority);
      console.log(`✅ Aggiunta alternativa ${alternativeAsin} per ${originalAsin}`);
      return result.lastInsertRowid;
    } catch (error) {
      console.error(`❌ Errore aggiunta alternativa per ${originalAsin}:`, error.message);
      throw error;
    }
  }

  static getAlternatives(originalAsin) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM component_alternatives 
        WHERE original_asin = ? 
        ORDER BY priority ASC, alternative_price ASC
      `);
      return stmt.all(originalAsin);
    } catch (error) {
      console.error(`❌ Errore recupero alternative per ${originalAsin}:`, error.message);
      return [];
    }
  }

  static async removeAlternative(id) {
    try {
      const stmt = db.prepare('DELETE FROM component_alternatives WHERE id = ?');
      return stmt.run(id);
    } catch (error) {
      console.error(`❌ Errore rimozione alternativa ${id}:`, error.message);
      throw error;
    }
  }

  static async updateAlternativePrice(alternativeAsin) {
    try {
      console.log(`🔄 Aggiornamento prezzo alternativa ${alternativeAsin}`);
      
      const priceData = await fetchPrice(alternativeAsin);
      
      if (priceData.price) {
        const stmt = db.prepare(`
          UPDATE component_alternatives 
          SET alternative_price = ? 
          WHERE alternative_asin = ?
        `);
        
        const result = stmt.run(priceData.price, alternativeAsin);
        console.log(`✅ Prezzo alternativa aggiornato: ${alternativeAsin} → €${priceData.price}`);
        return result.changes > 0;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Errore aggiornamento prezzo alternativa ${alternativeAsin}:`, error.message);
      return false;
    }
  }

  // Trova la migliore alternativa disponibile per un ASIN
  static async findBestAlternative(originalAsin) {
    try {
      const alternatives = this.getAlternatives(originalAsin);
      
      if (alternatives.length === 0) {
        return null;
      }

      // Prova a trovare un'alternativa con prezzo valido
      for (const alt of alternatives) {
        if (alt.alternative_price && alt.alternative_price > 0) {
          return {
            asin: alt.alternative_asin,
            name: alt.alternative_name,
            price: alt.alternative_price,
            priority: alt.priority,
            source: 'alternative_cached'
          };
        }
      }

      // Se nessuna alternativa ha prezzo, prova ad aggiornare la prima
      const firstAlt = alternatives[0];
      const updated = await this.updateAlternativePrice(firstAlt.alternative_asin);
      
      if (updated) {
        const updatedAlt = db.prepare('SELECT * FROM component_alternatives WHERE alternative_asin = ?').get(firstAlt.alternative_asin);
        return {
          asin: updatedAlt.alternative_asin,
          name: updatedAlt.alternative_name,
          price: updatedAlt.alternative_price,
          priority: updatedAlt.priority,
          source: 'alternative_updated'
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Errore ricerca migliore alternativa per ${originalAsin}:`, error.message);
      return null;
    }
  }

  // Sistema di fallback automatico per componenti senza prezzo
  static async handlePriceFallback(component) {
    try {
      if (!component.asin) {
        console.log(`⚠️ Componente ${component.name} senza ASIN, skip fallback`);
        return null;
      }

      console.log(`🔄 Tentativo fallback per componente ${component.name} (${component.asin})`);

      // Cerca alternative predefinite
      const alternative = await this.findBestAlternative(component.asin);
      
      if (alternative) {
        console.log(`✅ Fallback trovato: ${alternative.name} → €${alternative.price}`);
        return {
          asin: alternative.asin,
          name: alternative.name,
          price: alternative.price,
          source: alternative.source,
          isFallback: true,
          originalAsin: component.asin
        };
      }

      // Fallback generico: cerca componenti simili per tipo
      const similarComponents = await this.findSimilarComponents(component);
      
      if (similarComponents.length > 0) {
        const cheapest = similarComponents.reduce((min, comp) => 
          comp.price < min.price ? comp : min
        );
        
        console.log(`✅ Fallback generico trovato: ${cheapest.name} → €${cheapest.price}`);
        return {
          asin: cheapest.asin,
          name: cheapest.name,
          price: cheapest.price,
          source: 'similar_component',
          isFallback: true,
          originalAsin: component.asin
        };
      }

      console.log(`❌ Nessun fallback disponibile per ${component.name}`);
      return null;
    } catch (error) {
      console.error(`❌ Errore fallback per ${component.name}:`, error.message);
      return null;
    }
  }

  // Trova componenti simili per tipo e prezzo
  static async findSimilarComponents(targetComponent) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM components 
        WHERE type = ? 
        AND asin IS NOT NULL 
        AND price IS NOT NULL 
        AND price > 0
        AND id != ?
        ORDER BY price ASC
        LIMIT 5
      `);
      
      return stmt.all(targetComponent.type, targetComponent.id);
    } catch (error) {
      console.error(`❌ Errore ricerca componenti simili:`, error.message);
      return [];
    }
  }

  // Inizializza alternative predefinite per componenti comuni
  static async initializeDefaultAlternatives() {
    const defaultAlternatives = [
      // SSD
      { original: 'B08XYZ123', alternative: 'B09ABC456', name: 'Samsung 970 EVO Plus 500GB', priority: 1 },
      { original: 'B09XYZ789', alternative: 'B08DEF012', name: 'Crucial MX500 1TB', priority: 2 },
      
      // RAM
      { original: 'B08RAM001', alternative: 'B09RAM002', name: 'Corsair Vengeance LPX 16GB DDR4', priority: 1 },
      { original: 'B09RAM003', alternative: 'B08RAM004', name: 'G.Skill Ripjaws V 32GB DDR4', priority: 2 },
      
      // PSU
      { original: 'B08PSU001', alternative: 'B09PSU002', name: 'Corsair RM750x 750W', priority: 1 },
      { original: 'B09PSU003', alternative: 'B08PSU004', name: 'EVGA SuperNOVA 650W', priority: 2 },
      
      // Case
      { original: 'B08CASE001', alternative: 'B09CASE002', name: 'Fractal Design Meshify C', priority: 1 },
      { original: 'B09CASE003', alternative: 'B08CASE004', name: 'NZXT H510', priority: 2 },
      
      // Motherboard
      { original: 'B08MB001', alternative: 'B09MB002', name: 'MSI B450 Tomahawk Max', priority: 1 },
      { original: 'B09MB003', alternative: 'B08MB004', name: 'ASUS ROG Strix B550-F', priority: 2 }
    ];

    console.log(`🔄 Inizializzazione alternative predefinite...`);
    
    let added = 0;
    for (const alt of defaultAlternatives) {
      try {
        await this.addAlternative(
          alt.original,
          alt.alternative,
          alt.name,
          null, // Prezzo verrà aggiornato automaticamente
          alt.priority
        );
        added++;
      } catch (error) {
        console.log(`⚠️ Alternativa già esistente o errore: ${alt.original} → ${alt.alternative}`);
      }
    }

    console.log(`✅ Inizializzate ${added} alternative predefinite`);
    return added;
  }

  // Aggiorna tutti i prezzi delle alternative
  static async updateAllAlternativePrices() {
    try {
      console.log(`🔄 Aggiornamento prezzi alternative...`);
      
      const stmt = db.prepare('SELECT DISTINCT alternative_asin FROM component_alternatives');
      const alternatives = stmt.all();
      
      let updated = 0;
      for (const alt of alternatives) {
        const success = await this.updateAlternativePrice(alt.alternative_asin);
        if (success) updated++;
        
        // Delay tra aggiornamenti
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }
      
      console.log(`✅ Aggiornati ${updated}/${alternatives.length} prezzi alternative`);
      return updated;
    } catch (error) {
      console.error(`❌ Errore aggiornamento prezzi alternative:`, error.message);
      return 0;
    }
  }

  // Statistiche alternative
  static getStats() {
    try {
      const totalAlternatives = db.prepare('SELECT COUNT(*) as total FROM component_alternatives').get();
      const withPrices = db.prepare('SELECT COUNT(*) as total FROM component_alternatives WHERE alternative_price IS NOT NULL AND alternative_price > 0').get();
      const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM component_alternatives GROUP BY priority ORDER BY priority').all();
      
      return {
        total: totalAlternatives.total,
        withPrices: withPrices.total,
        withoutPrices: totalAlternatives.total - withPrices.total,
        byPriority
      };
    } catch (error) {
      console.error(`❌ Errore statistiche alternative:`, error.message);
      return null;
    }
  }
}

export default ComponentAlternatives;
