import { Component } from '../models/Component.js';
import { Build } from '../models/Build.js';
import { checkComponentAvailability, extractASIN, calculatePriceDifference } from './availabilityChecker.js';
import { findAlternativeByQuery } from './alternativeFinder.js';

/**
 * Utility principale per la sostituzione intelligente dei componenti
 */

// Configurazione
const REPLACEMENT_CONFIG = {
  affiliateTag: 'cpstest05-21',
  maxPriceIncrease: 50, // Massimo aumento prezzo consentito in euro
  maxPriceIncreasePercentage: 20, // Massimo aumento prezzo in percentuale
  notifyAdmin: true
};

/**
 * Controlla e sostituisce automaticamente i componenti non disponibili di una build
 * @param {number} buildId - ID della build
 * @returns {Object} - Risultato dell'operazione
 */
export async function checkAndReplaceComponents(buildId) {
  try {
    console.log(`🔍 Controllo componenti build ${buildId}...`);
    
    // Recupera tutti i componenti della build
    const components = await Component.getByBuildId(buildId);
    
    if (components.length === 0) {
      return {
        success: true,
        message: 'Nessun componente trovato',
        replaced: 0,
        checked: 0
      };
    }
    
    let replacedCount = 0;
    let checkedCount = 0;
    const results = [];
    
    for (const component of components) {
      // Salta i componenti già sostituiti
      if (component.is_replacement) {
        continue;
      }
      
      checkedCount++;
      
      try {
        // Controlla disponibilità
        const availability = await checkComponentAvailability(component);
        
        // Aggiorna stato disponibilità
        await Component.updateAvailability(
          component.id, 
          availability.available || false, 
          availability.lastChecked || new Date().toISOString()
        );
        
        if (!availability.available && component.search_query) {
          // Cerca alternativa
          const alternative = await findAlternativeByQuery(component);
          
          if (alternative) {
            // Verifica se la sostituzione è accettabile
            const replacementResult = await replaceComponent(component, alternative);
            
            if (replacementResult.success) {
              replacedCount++;
              results.push({
                original: component.name,
                replacement: alternative.name,
                priceDifference: replacementResult.priceDifference
              });
              
              console.log(`✅ Sostituito: ${component.name} → ${alternative.name}`);
            } else {
              console.log(`❌ Sostituzione rifiutata per ${component.name}: ${replacementResult.reason}`);
            }
          } else {
            console.log(`⚠️  Nessuna alternativa trovata per ${component.name}`);
          }
        }
        
      } catch (error) {
        console.error(`Errore nel controllo componente ${component.name}:`, error.message);
        results.push({
          component: component.name,
          error: error.message
        });
      }
    }
    
    // Rigenera il carrello Amazon se ci sono state sostituzioni
    if (replacedCount > 0) {
      await regenerateAmazonCart(buildId);
    }
    
    return {
      success: true,
      message: `Controllati ${checkedCount} componenti, sostituiti ${replacedCount}`,
      replaced: replacedCount,
      checked: checkedCount,
      results: results
    };
    
  } catch (error) {
    console.error(`Errore nel controllo build ${buildId}:`, error.message);
    return {
      success: false,
      message: error.message,
      replaced: 0,
      checked: 0
    };
  }
}

/**
 * Sostituisce un componente con un'alternativa
 * @param {Object} originalComponent - Componente originale
 * @param {Object} alternative - Componente alternativo
 * @returns {Object} - Risultato della sostituzione
 */
async function replaceComponent(originalComponent, alternative) {
  try {
    // Calcola differenza prezzo
    const priceDiff = calculatePriceDifference(originalComponent.price, alternative.price);
    
    // Verifica se la sostituzione è accettabile
    const validation = validateReplacement(originalComponent, alternative, priceDiff);
    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason
      };
    }
    
    // Crea nuovo componente sostituto
    const replacementData = {
      ...originalComponent,
      name: alternative.name,
      price: alternative.price,
      amazon_link: alternative.amazonLink,
      image_url: alternative.imageUrl,
      is_replacement: true,
      original_component_id: originalComponent.id,
      replacement_reason: `Prodotto esaurito - sostituzione automatica (${alternative.searchQuery})`,
      price_difference: priceDiff.difference,
      last_checked: new Date().toISOString(),
      is_available: true
    };
    
    // Aggiorna il componente nel database
    await Component.update(originalComponent.id, replacementData);
    
    // Segna il componente originale come non disponibile
    await Component.updateAvailability(originalComponent.id, false, new Date().toISOString());
    
    return {
      success: true,
      priceDifference: priceDiff,
      replacementData: replacementData
    };
    
  } catch (error) {
    console.error('Errore nella sostituzione componente:', error.message);
    return {
      success: false,
      reason: error.message
    };
  }
}

/**
 * Valida se una sostituzione è accettabile
 * @param {Object} original - Componente originale
 * @param {Object} alternative - Componente alternativo
 * @param {Object} priceDiff - Differenza di prezzo
 * @returns {Object} - Risultato della validazione
 */
function validateReplacement(original, alternative, priceDiff) {
  // Controlla aumento prezzo massimo
  if (priceDiff.difference > REPLACEMENT_CONFIG.maxPriceIncrease) {
    return {
      valid: false,
      reason: `Aumento prezzo troppo elevato: +€${priceDiff.difference.toFixed(2)}`
    };
  }
  
  // Controlla percentuale di aumento
  if (priceDiff.percentage > REPLACEMENT_CONFIG.maxPriceIncreasePercentage) {
    return {
      valid: false,
      reason: `Aumento prezzo in percentuale troppo elevato: +${priceDiff.percentage}%`
    };
  }
  
  // Controlla che l'alternativa sia effettivamente disponibile
  if (alternative.availability === 'Out of Stock') {
    return {
      valid: false,
      reason: 'Prodotto alternativo non disponibile'
    };
  }
  
  return {
    valid: true
  };
}

/**
 * Rigenera il carrello Amazon per una build
 * @param {number} buildId - ID della build
 * @returns {string} - Nuovo URL del carrello
 */
export async function regenerateAmazonCart(buildId) {
  try {
    const components = await Component.getByBuildId(buildId);
    
    // Estrai ASIN dai componenti disponibili
    const asins = components
      .filter(comp => comp.is_available && comp.amazon_link)
      .map(comp => extractASIN(comp.amazon_link))
      .filter(asin => asin !== null);
    
    if (asins.length === 0) {
      throw new Error('Nessun componente disponibile per il carrello');
    }
    
    // Genera URL carrello Amazon
    const cartParams = asins.map((asin, index) => 
      `ASIN.${index + 1}=${asin}&Quantity.${index + 1}=1`
    ).join('&');
    
    const cartUrl = `https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=${REPLACEMENT_CONFIG.affiliateTag}&${cartParams}`;
    
    // Aggiorna il link carrello nella build
    await Build.update(buildId, { amazon_cart_url: cartUrl });
    
    console.log(`🛒 Carrello Amazon rigenerato per build ${buildId}`);
    
    return cartUrl;
    
  } catch (error) {
    console.error(`Errore nella rigenerazione carrello build ${buildId}:`, error.message);
    throw error;
  }
}

/**
 * Ripristina un componente sostituito al componente originale
 * @param {number} componentId - ID del componente sostituito
 * @returns {Object} - Risultato dell'operazione
 */
export async function restoreOriginalComponent(componentId) {
  try {
    const replacementComponent = await Component.getById(componentId);
    
    if (!replacementComponent || !replacementComponent.is_replacement) {
      return {
        success: false,
        message: 'Componente non trovato o non è una sostituzione'
      };
    }
    
    const originalComponentId = replacementComponent.original_component_id;
    
    if (!originalComponentId) {
      return {
        success: false,
        message: 'Componente originale non trovato'
      };
    }
    
    // Recupera il componente originale
    const originalComponent = await Component.getById(originalComponentId);
    
    if (!originalComponent) {
      return {
        success: false,
        message: 'Componente originale non esiste più'
      };
    }
    
    // Ripristina i dati originali
    await Component.update(componentId, {
      name: originalComponent.name,
      price: originalComponent.price,
      amazon_link: originalComponent.amazon_link,
      image_url: originalComponent.image_url,
      is_replacement: false,
      original_component_id: null,
      replacement_reason: null,
      price_difference: null,
      is_available: true
    });
    
    // Rimuovi il componente originale dal database
    await Component.delete(originalComponentId);
    
    console.log(`↩️  Ripristinato componente originale: ${originalComponent.name}`);
    
    return {
      success: true,
      message: 'Componente ripristinato con successo'
    };
    
  } catch (error) {
    console.error('Errore nel ripristino componente:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Ottiene le statistiche delle sostituzioni per una build
 * @param {number} buildId - ID della build
 * @returns {Object} - Statistiche delle sostituzioni
 */
export async function getReplacementStats(buildId) {
  try {
    const components = await Component.getByBuildId(buildId);
    
    const stats = {
      total: components.length,
      original: 0,
      replaced: 0,
      unavailable: 0,
      totalPriceDifference: 0,
      replacements: []
    };
    
    for (const component of components) {
      if (component.is_replacement) {
        stats.replaced++;
        stats.totalPriceDifference += component.price_difference || 0;
        stats.replacements.push({
          id: component.id,
          name: component.name,
          originalName: component.original_component_id ? 
            (await Component.getById(component.original_component_id))?.name : 'N/A',
          priceDifference: component.price_difference,
          replacementReason: component.replacement_reason
        });
      } else {
        stats.original++;
        if (!component.is_available) {
          stats.unavailable++;
        }
      }
    }
    
    return stats;
    
  } catch (error) {
    console.error('Errore nel recupero statistiche sostituzioni:', error.message);
    return {
      total: 0,
      original: 0,
      replaced: 0,
      unavailable: 0,
      totalPriceDifference: 0,
      replacements: [],
      error: error.message
    };
  }
}

/**
 * Controlla tutti i componenti di tutte le build
 * @returns {Object} - Risultato dell'operazione globale
 */
export async function checkAllBuilds() {
  try {
    console.log('🔍 Avvio controllo globale di tutte le build...');
    
    const builds = await Build.getAll();
    let totalChecked = 0;
    let totalReplaced = 0;
    const results = [];
    
    for (const build of builds) {
      const result = await checkAndReplaceComponents(build.id);
      
      totalChecked += result.checked;
      totalReplaced += result.replaced;
      
      if (result.replaced > 0) {
        results.push({
          buildId: build.id,
          buildTitle: build.title,
          replaced: result.replaced,
          checked: result.checked
        });
      }
    }
    
    console.log(`✅ Controllo globale completato: ${totalChecked} componenti controllati, ${totalReplaced} sostituiti`);
    
    return {
      success: true,
      totalChecked,
      totalReplaced,
      buildsAffected: results.length,
      results
    };
    
  } catch (error) {
    console.error('Errore nel controllo globale:', error.message);
    return {
      success: false,
      message: error.message,
      totalChecked: 0,
      totalReplaced: 0
    };
  }
}
