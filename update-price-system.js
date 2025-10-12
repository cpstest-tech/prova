#!/usr/bin/env node

import { initializeDatabase } from './server/models/schema.js';
import ComponentAlternatives from './server/utils/componentAlternatives.js';
import { autoAssignTiers } from './server/utils/priceUpdater.js';
import db from './server/config/database.js';

console.log('🚀 Aggiornamento sistema prezzi...');

async function updateDatabase() {
  try {
    console.log('📊 Inizializzazione database...');
    initializeDatabase();
    console.log('✅ Database inizializzato');
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error.message);
    throw error;
  }
}

async function initializeAlternatives() {
  try {
    console.log('🔄 Inizializzazione alternative predefinite...');
    const added = await ComponentAlternatives.initializeDefaultAlternatives();
    console.log(`✅ Inizializzate ${added} alternative predefinite`);
  } catch (error) {
    console.error('❌ Errore inizializzazione alternative:', error.message);
    throw error;
  }
}

async function assignTiers() {
  try {
    console.log('🎯 Assegnazione automatica tier componenti...');
    const assigned = await autoAssignTiers();
    console.log(`✅ Assegnati ${assigned} componenti ai tier`);
  } catch (error) {
    console.error('❌ Errore assegnazione tier:', error.message);
    throw error;
  }
}

async function showStats() {
  try {
    console.log('\n📈 Statistiche sistema prezzi:');
    
    // Statistiche componenti per tier
    const componentStats = db.prepare(`
      SELECT 
        tier,
        COUNT(*) as total,
        COUNT(CASE WHEN asin IS NOT NULL THEN 1 END) as with_asin,
        COUNT(CASE WHEN price IS NOT NULL THEN 1 END) as with_price
      FROM components 
      GROUP BY tier
      ORDER BY tier
    `).all();
    
    console.log('\n📊 Componenti per tier:');
    componentStats.forEach(stat => {
      console.log(`  Tier ${stat.tier}: ${stat.total} totali, ${stat.with_asin} con ASIN, ${stat.with_price} con prezzo`);
    });
    
    // Statistiche cache
    const cacheStats = db.prepare(`
      SELECT 
        COUNT(*) as total_cached,
        COUNT(CASE WHEN expires_at > ? THEN 1 END) as valid_cache
      FROM price_cache
    `).get(new Date().toISOString());
    
    console.log('\n💾 Cache prezzi:');
    console.log(`  Totale: ${cacheStats.total_cached}`);
    console.log(`  Validi: ${cacheStats.valid_cache}`);
    
    // Statistiche alternative
    const altStats = ComponentAlternatives.getStats();
    if (altStats) {
      console.log('\n🔄 Alternative componenti:');
      console.log(`  Totale: ${altStats.total}`);
      console.log(`  Con prezzi: ${altStats.withPrices}`);
      console.log(`  Senza prezzi: ${altStats.withoutPrices}`);
    }
    
  } catch (error) {
    console.error('❌ Errore statistiche:', error.message);
  }
}

async function main() {
  try {
    await updateDatabase();
    await initializeAlternatives();
    await assignTiers();
    await showStats();
    
    console.log('\n✅ Sistema prezzi aggiornato con successo!');
    console.log('\n📝 Prossimi passi:');
    console.log('  1. Riavvia il server per attivare il scheduler');
    console.log('  2. Verifica le API admin per gestire i prezzi');
    console.log('  3. Configura i cron job per aggiornamenti automatici');
    
  } catch (error) {
    console.error('\n❌ Errore durante l\'aggiornamento:', error.message);
    process.exit(1);
  }
}

main();
