import database from '../config/database.js';
import { PriceChecker } from './priceChecker.js';
import { extractASINFromUrl } from './amazonParser.js';

/**
 * Sistema di sostituzione intelligente dei prodotti
 * Gestisce la sostituzione automatica quando prodotti non sono disponibili o hanno prezzi troppo alti
 */
export class ProductSubstitution {
  constructor() {
    this.priceChecker = new PriceChecker();
  }

  /**
   * Trova un prodotto sostitutivo per un componente
   */
  async findSubstitute(component, tolerancePercent = 15) {
    try {
      console.log(`🔍 Ricerca sostituto per: ${component.name} (€${component.price})`);
      
      // Se non c'è searchterm, usa il nome del componente
      const searchTerm = component.searchterm || component.name;
      
      // Calcola range di prezzo (tolleranza del 15%)
      const originalPrice = component.original_price || component.price;
      const maxPrice = originalPrice * (1 + tolerancePercent / 100);
      const minPrice = Math.max(originalPrice * 0.5, 10); // Minimo 50% del prezzo originale o 10€

      console.log(`💰 Range prezzo: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);

      // Cerca prodotti alternativi
      const alternatives = await this.priceChecker.searchAlternativeProducts(searchTerm, maxPrice, minPrice);
      
      if (alternatives.length === 0) {
        console.log(`❌ Nessun prodotto alternativo trovato per ${component.name}`);
        return null;
      }

      // Filtra prodotti disponibili e ordina per prezzo
      const availableAlternatives = alternatives
        .filter(alt => alt.available && alt.price)
        .sort((a, b) => a.price - b.price);

      if (availableAlternatives.length === 0) {
        console.log(`❌ Nessun prodotto disponibile trovato per ${component.name}`);
        return null;
      }

      // Prendi il primo prodotto disponibile (quello più economico)
      const substitute = availableAlternatives[0];
      
      console.log(`✅ Trovato sostituto: ${substitute.title} (€${substitute.price})`);

      return {
        name: substitute.title,
        price: substitute.price,
        amazon_link: substitute.link,
        image_url: substitute.image,
        original_asin: substitute.asin,
        substitution_reason: this.getSubstitutionReason(component),
        searchterm: searchTerm
      };

    } catch (error) {
      console.error(`❌ Errore nella ricerca sostituto per ${component.name}:`, error.message);
      return null;
    }
  }

  /**
   * Determina il motivo della sostituzione
   */
  getSubstitutionReason(component) {
    if (component.is_substituted) {
      return component.substitution_reason || 'Prodotto sostituito precedentemente';
    }
    return 'Prodotto non disponibile o prezzo aumentato';
  }

  /**
   * Controlla e aggiorna tutti i componenti di una build
   */
  async checkAndUpdateBuild(buildId) {
    try {
      console.log(`🔍 Controllo build ${buildId}...`);
      
      // Ottieni tutti i componenti della build
      const components = database.prepare('SELECT * FROM components WHERE build_id = ?').all(buildId);
      
      if (components.length === 0) {
        console.log(`⚠️ Nessun componente trovato per build ${buildId}`);
        return { updated: 0, substituted: 0 };
      }

      let updated = 0;
      let substituted = 0;

      for (const component of components) {
        try {
          const result = await this.checkAndUpdateComponent(component);
          if (result.updated) updated++;
          if (result.substituted) substituted++;
        } catch (error) {
          console.error(`❌ Errore nel controllo componente ${component.id}:`, error.message);
        }
      }

      console.log(`✅ Build ${buildId} controllata: ${updated} aggiornati, ${substituted} sostituiti`);
      return { updated, substituted };

    } catch (error) {
      console.error(`❌ Errore nel controllo build ${buildId}:`, error.message);
      return { updated: 0, substituted: 0 };
    }
  }

  /**
   * Controlla e aggiorna un singolo componente
   */
  async checkAndUpdateComponent(component) {
    try {
      if (!component.amazon_link) {
        console.log(`⚠️ Nessun link Amazon per componente ${component.id}`);
        return { updated: false, substituted: false };
      }

      // Controlla prezzo e disponibilità
      const productData = await this.priceChecker.checkProductPrice(component.amazon_link);
      
      if (productData.error) {
        console.log(`❌ Errore nel controllo prezzo per componente ${component.id}: ${productData.error}`);
        return { updated: false, substituted: false };
      }

      const originalPrice = component.original_price || component.price;
      let needsUpdate = false;
      let needsSubstitution = false;
      let updateData = {};

      // Controlla disponibilità
      if (!productData.available) {
        console.log(`🚫 Prodotto ${component.id} non disponibile: ${component.name}`);
        needsSubstitution = true;
      }
      // Controlla prezzo se disponibile
      else if (productData.price && originalPrice) {
        const priceDifference = this.priceChecker.calculatePriceDifference(productData.price, originalPrice);
        
        if (!this.priceChecker.isPriceWithinTolerance(productData.price, originalPrice)) {
          console.log(`💰 Prezzo aumentato del ${priceDifference.toFixed(1)}% per ${component.name}: €${originalPrice} → €${productData.price}`);
          needsSubstitution = true;
        } else if (Math.abs(priceDifference) > 1) { // Aggiorna se differenza > 1%
          console.log(`📊 Aggiornamento prezzo per ${component.name}: €${originalPrice} → €${productData.price} (${priceDifference.toFixed(1)}%)`);
          needsUpdate = true;
          updateData.price = productData.price;
        }
      }

      // Se serve sostituzione, trova un sostituto
      if (needsSubstitution) {
        const substitute = await this.findSubstitute(component);
        
        if (substitute) {
          // Aggiorna il componente con il sostituto
          const substitutionData = {
            name: substitute.name,
            price: substitute.price,
            amazon_link: substitute.amazon_link,
            image_url: substitute.image_url,
            is_substituted: 1,
            substitution_reason: substitute.substitution_reason,
            original_asin: substitute.original_asin,
            last_price_check: new Date().toISOString()
          };

          // Se non è già un sostituto, salva l'ASIN originale
          if (!component.is_substituted && component.amazon_link) {
            const originalAsin = extractASINFromUrl(component.amazon_link);
            if (originalAsin) {
              substitutionData.original_asin = originalAsin;
            }
          }

          database.prepare(`
            UPDATE components 
            SET name = ?, price = ?, amazon_link = ?, image_url = ?, 
                is_substituted = ?, substitution_reason = ?, original_asin = ?, last_price_check = ?
            WHERE id = ?
          `).run(
            substitutionData.name,
            substitutionData.price,
            substitutionData.amazon_link,
            substitutionData.image_url,
            substitutionData.is_substituted,
            substitutionData.substitution_reason,
            substitutionData.original_asin,
            substitutionData.last_price_check,
            component.id
          );

          console.log(`🔄 Componente ${component.id} sostituito con: ${substitute.name}`);
          return { updated: true, substituted: true };
        } else {
          console.log(`⚠️ Nessun sostituto trovato per ${component.name}, mantengo il prodotto originale`);
          // Aggiorna solo il timestamp dell'ultimo controllo
          database.prepare('UPDATE components SET last_price_check = ? WHERE id = ?')
            .run(new Date().toISOString(), component.id);
          return { updated: false, substituted: false };
        }
      }
      // Se serve solo aggiornamento prezzo
      else if (needsUpdate) {
        updateData.last_price_check = new Date().toISOString();
        
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        values.push(component.id);
        
        const query = `UPDATE components SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        database.prepare(query).run(...values);
        
        console.log(`📊 Componente ${component.id} aggiornato: €${updateData.price}`);
        return { updated: true, substituted: false };
      }
      // Nessun aggiornamento necessario
      else {
        // Aggiorna solo il timestamp dell'ultimo controllo
        db.prepare('UPDATE components SET last_price_check = ? WHERE id = ?')
          .run(new Date().toISOString(), component.id);
        return { updated: false, substituted: false };
      }

    } catch (error) {
      console.error(`❌ Errore nel controllo componente ${component.id}:`, error.message);
      return { updated: false, substituted: false };
    }
  }

  /**
   * Controlla tutti i componenti di tutte le build pubblicate
   */
  async checkAllPublishedBuilds() {
    try {
      console.log('🔍 Controllo tutte le build pubblicate...');
      
      const builds = database.prepare(`
        SELECT id, title FROM builds 
        WHERE status = 'published' 
        ORDER BY updated_at DESC
      `).all();

      let totalUpdated = 0;
      let totalSubstituted = 0;

      for (const build of builds) {
        console.log(`\n📋 Controllo build: ${build.title} (ID: ${build.id})`);
        const result = await this.checkAndUpdateBuild(build.id);
        totalUpdated += result.updated;
        totalSubstituted += result.substituted;
      }

      console.log(`\n✅ Controllo completato: ${totalUpdated} aggiornamenti, ${totalSubstituted} sostituzioni`);
      return { totalUpdated, totalSubstituted };

    } catch (error) {
      console.error('❌ Errore nel controllo globale:', error.message);
      return { totalUpdated: 0, totalSubstituted: 0 };
    }
  }

  /**
   * Ripristina un componente al prodotto originale
   */
  async restoreOriginalProduct(componentId) {
    try {
      const component = database.prepare('SELECT * FROM components WHERE id = ?').get(componentId);
      
      if (!component || !component.is_substituted) {
        throw new Error('Componente non trovato o non sostituito');
      }

      // Ripristina i dati originali
      const restoreData = {
        name: component.name.replace(' (SOSTITUITO)', ''),
        is_substituted: 0,
        substitution_reason: null,
        last_price_check: new Date().toISOString()
      };

      database.prepare(`
        UPDATE components 
        SET is_substituted = ?, substitution_reason = ?, last_price_check = ?
        WHERE id = ?
      `).run(
        restoreData.is_substituted,
        restoreData.substitution_reason,
        restoreData.last_price_check,
        componentId
      );

      console.log(`🔄 Componente ${componentId} ripristinato al prodotto originale`);
      return true;

    } catch (error) {
      console.error(`❌ Errore nel ripristino componente ${componentId}:`, error.message);
      return false;
    }
  }

  /**
   * Chiude le connessioni
   */
  async cleanup() {
    await this.priceChecker.close();
  }
}

export default ProductSubstitution;