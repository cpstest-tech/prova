import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { load } from "cheerio";
import UserAgent from "user-agents";
import { fetchProductByASIN } from "./amazonParser.js";
import ComponentAlternatives from "./componentAlternatives.js";
import db from "../config/database.js";

const CACHE_DIR = "./price_cache";
await fs.mkdir(CACHE_DIR, { recursive: true });

// User agents casuali per evitare ban - aggiornati e più realistici
const uaList = [
  (new UserAgent()).toString(),
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
];

// Delay casuale tra richieste
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Funzione HTTP con headers casuali e delay
async function httpGet(url) {
  const headers = { 
    "User-Agent": uaList[Math.floor(Math.random() * uaList.length)], 
    "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
    "DNT": "1"
  };
  
  // Delay più lungo per evitare detection
  await sleep(2000 + Math.random() * 3000);
  
  try {
    const response = await axios.get(url, { 
      headers, 
      timeout: 20000,
      maxRedirects: 5
    });
    return response.data;
  } catch (error) {
    console.error(`HTTP Error for ${url}:`, error.message);
    
    // Gestione specifica per rate limiting
    if (error.response?.status === 403) {
      console.log(`⚠️ Rate limiting rilevato per ${url}, aspetto più a lungo...`);
      await sleep(10000 + Math.random() * 10000); // 10-20 secondi di attesa
    }
    
    throw error;
  }
}

// Keepa pubblica - fonte primaria
async function fromKeepaPublic(asin) {
  try {
    console.log(`🔍 Keepa: cercando prezzo per ASIN ${asin}`);
    const html = await httpGet(`https://keepa.com/#!product/1-${asin}`);
    const $ = load(html);
    
    // Cerca pattern di prezzo in euro
    const priceMatch = $.text().match(/([0-9]{1,3}(?:[.,][0-9]{2})?)\s*€/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", "."));
      console.log(`✅ Keepa: trovato prezzo €${price} per ${asin}`);
      return { 
        price, 
        source: "keepa_public",
        url: `https://keepa.com/#!product/1-${asin}`
      };
    }
    
    console.log(`❌ Keepa: prezzo non trovato per ${asin}`);
    return null;
  } catch (error) {
    console.error(`❌ Keepa error per ${asin}:`, error.message);
    return null;
  }
}

// CamelCamelCamel - fallback secondario
async function fromCamel(asin) {
  try {
    console.log(`🔍 CamelCamelCamel: cercando prezzo per ASIN ${asin}`);
    const html = await httpGet(`https://it.camelcamelcamel.com/product/${asin}`);
    const $ = load(html);
    
    // Cerca pattern di prezzo in euro
    const priceMatch = $.text().match(/([0-9]{1,3}(?:[.,][0-9]{2})?)\s*€/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", "."));
      console.log(`✅ CamelCamelCamel: trovato prezzo €${price} per ${asin}`);
      return { 
        price, 
        source: "camelcamelcamel",
        url: `https://it.camelcamelcamel.com/product/${asin}`
      };
    }
    
    console.log(`❌ CamelCamelCamel: prezzo non trovato per ${asin}`);
    return null;
  } catch (error) {
    console.error(`❌ CamelCamelCamel error per ${asin}:`, error.message);
    return null;
  }
}

// Amazon parser custom - fallback finale
async function fromAmazonParser(asin) {
  try {
    console.log(`🔍 Amazon Parser: cercando prezzo per ASIN ${asin}`);
    const product = await fetchProductByASIN(asin);
    
    if (product.price) {
      console.log(`✅ Amazon Parser: trovato prezzo €${product.price} per ${asin}`);
      return { 
        price: product.price, 
        source: "amazon_parser",
        url: product.amazonLink
      };
    }
    
    console.log(`❌ Amazon Parser: prezzo non trovato per ${asin}`);
    return null;
  } catch (error) {
    console.error(`❌ Amazon Parser error per ${asin}:`, error.message);
    return null;
  }
}

// Cache management
class PriceCache {
  static async get(asin) {
    try {
      const stmt = db.prepare('SELECT * FROM price_cache WHERE asin = ? AND expires_at > ?');
      const cached = stmt.get(asin, new Date().toISOString());
      return cached;
    } catch (error) {
      console.error(`Cache get error for ${asin}:`, error.message);
      return null;
    }
  }

  static async set(asin, priceData) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO price_cache (asin, price, source, url, last_checked, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 ore
      
      stmt.run(
        asin,
        priceData.price,
        priceData.source,
        priceData.url,
        priceData.last_checked,
        expiresAt
      );
      
      console.log(`💾 Cache: salvato prezzo per ${asin} da ${priceData.source}`);
    } catch (error) {
      console.error(`Cache set error for ${asin}:`, error.message);
    }
  }

  static async isExpired(asin, hours = 24) {
    try {
      const stmt = db.prepare('SELECT expires_at FROM price_cache WHERE asin = ?');
      const cached = stmt.get(asin);
      
      if (!cached) return true;
      
      const expiresAt = new Date(cached.expires_at);
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
      
      return expiresAt < cutoffTime;
    } catch (error) {
      return true;
    }
  }
}

// Funzione principale per recuperare il prezzo
export async function fetchPrice(asin, forceRefresh = false) {
  console.log(`\n🔄 Aggiornamento prezzo per ASIN: ${asin}`);
  
  // Controlla cache se non è forzato il refresh
  if (!forceRefresh) {
    const cached = await PriceCache.get(asin);
    if (cached) {
      console.log(`📦 Cache hit: €${cached.price} da ${cached.source} (${asin})`);
      return { 
        ...cached, 
        fromCache: true,
        asin,
        last_checked: cached.last_checked
      };
    }
  }
  
  console.log(`🌐 Cache miss o refresh forzato per ${asin}, richiesta esterna...`);
  
  // Sequenza di fallback: Keepa → CamelCamelCamel → Amazon Parser
  let result = await fromKeepaPublic(asin);
  
  if (!result) {
    await sleep(5000 + Math.random() * 5000); // Delay più lungo tra fonti
    result = await fromCamel(asin);
  }
  
  if (!result) {
    await sleep(5000 + Math.random() * 5000); // Delay più lungo tra fonti
    result = await fromAmazonParser(asin);
  }
  
  // Prepara risultato finale
  let finalResult = {
    asin,
    price: result?.price || null,
    source: result?.source || null,
    url: result?.url || null,
    last_checked: new Date().toISOString(),
    fromCache: false
  };
  
  // Se non abbiamo trovato un prezzo, prova il fallback
  if (!finalResult.price) {
    console.log(`🔄 Tentativo fallback per ASIN ${asin}`);
    const fallback = await ComponentAlternatives.handlePriceFallback({ asin });
    
    if (fallback) {
      finalResult = {
        ...finalResult,
        price: fallback.price,
        source: fallback.source,
        url: fallback.url || `https://www.amazon.it/dp/${fallback.asin}`,
        isFallback: true,
        fallbackInfo: {
          originalAsin: asin,
          alternativeAsin: fallback.asin,
          alternativeName: fallback.name
        }
      };
      console.log(`✅ Fallback applicato: ${fallback.name} → €${fallback.price}`);
    }
  }
  
  // Salva in cache se abbiamo un prezzo
  if (finalResult.price) {
    await PriceCache.set(asin, finalResult);
  }
  
  console.log(`✅ Risultato finale per ${asin}:`, finalResult);
  return finalResult;
}

// Aggiorna prezzi per tier specifico
export async function updatePricesForTier(tier, maxHours = 24) {
  console.log(`\n🎯 Aggiornamento prezzi Tier ${tier} (max ${maxHours}h)`);
  
  const { Component } = await import("../models/Component.js");
  const components = Component.getComponentsNeedingPriceUpdate(tier, maxHours);
  
  console.log(`📊 Trovati ${components.length} componenti Tier ${tier} da aggiornare`);
  
  const results = [];
  
  for (const component of components) {
    try {
      console.log(`\n--- Aggiornando ${component.name} (${component.asin}) ---`);
      
      const priceData = await fetchPrice(component.asin);
      
      if (priceData.price) {
        // Aggiorna il componente nel database
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        Component.updatePrice(component.asin, {
          price: priceData.price,
          source: priceData.source,
          last_checked: priceData.last_checked,
          expires_at: expiresAt
        });
        
        results.push({
          asin: component.asin,
          name: component.name,
          price: priceData.price,
          source: priceData.source,
          success: true
        });
        
        console.log(`✅ Aggiornato: ${component.name} → €${priceData.price} (${priceData.source})`);
      } else {
        results.push({
          asin: component.asin,
          name: component.name,
          error: "Prezzo non trovato",
          success: false
        });
        
        console.log(`❌ Prezzo non trovato per: ${component.name}`);
      }
      
      // Delay tra richieste per evitare rate limiting
      await sleep(2000 + Math.random() * 3000);
      
    } catch (error) {
      console.error(`❌ Errore aggiornamento ${component.name}:`, error.message);
      results.push({
        asin: component.asin,
        name: component.name,
        error: error.message,
        success: false
      });
    }
  }
  
  console.log(`\n📈 Aggiornamento Tier ${tier} completato: ${results.filter(r => r.success).length}/${results.length} successi`);
  return results;
}

// Aggiorna tutti i prezzi per una build specifica (Tier C on-demand)
export async function updatePricesForBuild(buildId) {
  console.log(`\n🎯 Aggiornamento prezzi per Build ID: ${buildId}`);
  
  // Verifica che la build esista
  const { Build } = await import("../models/Build.js");
  const build = Build.getById(buildId);
  
  if (!build) {
    console.log(`❌ Build ${buildId} non trovata`);
    return [{
      buildId,
      error: "Build non trovata",
      success: false
    }];
  }
  
  console.log(`✅ Build trovata: "${build.title}"`);
  
  const { Component } = await import("../models/Component.js");
  const allComponents = Component.getByBuildId(buildId);
  const components = allComponents.filter(c => c.asin && c.asin.trim() !== '');
  
  console.log(`📊 Componenti totali: ${allComponents.length}, con ASIN: ${components.length} per la build ${buildId}`);
  
  if (components.length === 0) {
    console.log(`⚠️ Nessun componente con ASIN trovato per la build ${buildId}. Impossibile aggiornare i prezzi.`);
    console.log(`💡 Suggerimento: Assicurati che i componenti abbiano ASIN validi per aggiornare i prezzi automaticamente.`);
    
    return [{
      buildId,
      message: `Nessun componente con ASIN trovato per la build "${build.title}"`,
      totalComponents: allComponents.length,
      componentsWithASIN: 0,
      success: false
    }];
  }
  
  const results = [];
  
  for (const component of components) {
    try {
      console.log(`\n--- Aggiornando ${component.name} (${component.asin}) ---`);
      
      const priceData = await fetchPrice(component.asin, true); // Forza refresh
      
      if (priceData.price) {
        // Aggiorna il componente nel database
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        Component.updatePrice(component.asin, {
          price: priceData.price,
          source: priceData.source,
          last_checked: priceData.last_checked,
          expires_at: expiresAt
        });
        
        results.push({
          asin: component.asin,
          name: component.name,
          price: priceData.price,
          source: priceData.source,
          success: true
        });
        
        console.log(`✅ Aggiornato: ${component.name} → €${priceData.price} (${priceData.source})`);
      } else {
        results.push({
          asin: component.asin,
          name: component.name,
          error: "Prezzo non trovato",
          success: false
        });
        
        console.log(`❌ Prezzo non trovato per: ${component.name}`);
      }
      
      // Delay tra richieste
      await sleep(2000 + Math.random() * 3000);
      
    } catch (error) {
      console.error(`❌ Errore aggiornamento ${component.name}:`, error.message);
      results.push({
        asin: component.asin,
        name: component.name,
        error: error.message,
        success: false
      });
    }
  }
  
  console.log(`\n📈 Aggiornamento Build ${buildId} completato: ${results.filter(r => r.success).length}/${results.length} successi`);
  return results;
}

// Utility per impostare i tier automaticamente
export async function autoAssignTiers() {
  const tierRules = {
    'A': ['Storage', 'RAM', 'PSU', 'Case', 'Motherboard'],
    'B': ['GPU', 'Cooler'],
    'C': ['CPU', 'Other']
  };
  
  console.log(`\n🎯 Assegnazione automatica tier componenti`);
  
  const { Component } = await import("../models/Component.js");
  const components = db.prepare('SELECT * FROM components WHERE tier = ?').all('C');
  
  const updates = [];
  
  for (const component of components) {
    for (const [tier, types] of Object.entries(tierRules)) {
      if (types.includes(component.type)) {
        // Per GPU, controlla il prezzo per decidere Tier B o C
        if (component.type === 'GPU' && component.price && component.price < 300) {
          updates.push({ id: component.id, tier });
        } else if (component.type !== 'GPU') {
          updates.push({ id: component.id, tier });
        }
        break;
      }
    }
  }
  
  if (updates.length > 0) {
    Component.bulkUpdateTiers(updates);
    console.log(`✅ Assegnati ${updates.length} componenti ai tier appropriati`);
  }
  
  return updates.length;
}

export default {
  fetchPrice,
  updatePricesForTier,
  updatePricesForBuild,
  autoAssignTiers,
  PriceCache
};
