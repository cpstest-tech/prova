import { CronJob } from 'cron';
import { updatePricesForTier, autoAssignTiers } from './priceUpdater.js';
import { Component } from '../models/Component.js';

class PriceScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ PriceScheduler già in esecuzione');
      return;
    }

    console.log('🚀 Avvio PriceScheduler...');

    // Job Tier A - ogni giorno alle 6:00
    this.jobs.set('tierA_daily', new CronJob(
      '0 6 * * *', // Ogni giorno alle 6:00
      async () => {
        console.log('\n⏰ CRON: Avvio aggiornamento Tier A (giornaliero)');
        try {
          await updatePricesForTier('A', 24);
          console.log('✅ CRON: Aggiornamento Tier A completato');
        } catch (error) {
          console.error('❌ CRON: Errore aggiornamento Tier A:', error.message);
        }
      },
      null,
      true, // start immediately
      'Europe/Rome'
    ));

    // Job Tier B - ogni 4 giorni alle 7:00
    this.jobs.set('tierB_4days', new CronJob(
      '0 7 */4 * *', // Ogni 4 giorni alle 7:00
      async () => {
        console.log('\n⏰ CRON: Avvio aggiornamento Tier B (ogni 4 giorni)');
        try {
          await updatePricesForTier('B', 96); // 4 giorni = 96 ore
          console.log('✅ CRON: Aggiornamento Tier B completato');
        } catch (error) {
          console.error('❌ CRON: Errore aggiornamento Tier B:', error.message);
        }
      },
      null,
      true,
      'Europe/Rome'
    ));

    // Job pulizia cache - ogni settimana
    this.jobs.set('cache_cleanup', new CronJob(
      '0 2 * * 0', // Ogni domenica alle 2:00
      async () => {
        console.log('\n⏰ CRON: Avvio pulizia cache');
        try {
          await this.cleanupExpiredCache();
          console.log('✅ CRON: Pulizia cache completata');
        } catch (error) {
          console.error('❌ CRON: Errore pulizia cache:', error.message);
        }
      },
      null,
      true,
      'Europe/Rome'
    ));

    // Job assegnazione tier - ogni giorno alle 5:00
    this.jobs.set('auto_tier_assignment', new CronJob(
      '0 5 * * *', // Ogni giorno alle 5:00
      async () => {
        console.log('\n⏰ CRON: Avvio assegnazione automatica tier');
        try {
          const assigned = autoAssignTiers();
          console.log(`✅ CRON: Assegnati ${assigned} componenti ai tier`);
        } catch (error) {
          console.error('❌ CRON: Errore assegnazione tier:', error.message);
        }
      },
      null,
      true,
      'Europe/Rome'
    ));

    this.isRunning = true;
    console.log(`✅ PriceScheduler avviato con ${this.jobs.size} job attivi`);
    
    // Log dei prossimi esecuzioni
    this.logNextExecutions();
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ PriceScheduler non è in esecuzione');
      return;
    }

    console.log('🛑 Arresto PriceScheduler...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹️ Job ${name} arrestato`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ PriceScheduler arrestato');
  }

  restart() {
    console.log('🔄 Riavvio PriceScheduler...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };

    for (const [name, job] of this.jobs) {
      status.jobs.push({
        name,
        running: job.running,
        nextDate: job.nextDate().toISOString(),
        lastDate: job.lastDate()?.toISOString() || null
      });
    }

    return status;
  }

  logNextExecutions() {
    console.log('\n📅 Prossime esecuzioni programmate:');
    for (const [name, job] of this.jobs) {
      const nextDate = job.nextDate();
      console.log(`  ${name}: ${nextDate.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`);
    }
    console.log('');
  }

  async cleanupExpiredCache() {
    const db = (await import('../config/database.js')).default;
    
    // Rimuovi cache scadute da più di 7 giorni
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const stmt = db.prepare('DELETE FROM price_cache WHERE expires_at < ?');
    const result = stmt.run(cutoffDate);
    
    console.log(`🗑️ Rimossi ${result.changes} record di cache scaduti`);
    
    // Aggiorna statistiche cache
    const stats = db.prepare('SELECT COUNT(*) as total FROM price_cache').get();
    console.log(`📊 Cache attuale: ${stats.total} record`);
  }

  // Metodi per esecuzione manuale
  async runTierAUpdate() {
    console.log('🔧 Esecuzione manuale aggiornamento Tier A');
    return await updatePricesForTier('A', 24);
  }

  async runTierBUpdate() {
    console.log('🔧 Esecuzione manuale aggiornamento Tier B');
    return await updatePricesForTier('B', 96);
  }

  async runCacheCleanup() {
    console.log('🔧 Esecuzione manuale pulizia cache');
    await this.cleanupExpiredCache();
  }

  async runAutoTierAssignment() {
    console.log('🔧 Esecuzione manuale assegnazione tier');
    return autoAssignTiers();
  }
}

// Singleton instance
const priceScheduler = new PriceScheduler();

export default priceScheduler;

// Funzioni di utilità per l'integrazione con il server
export function startPriceScheduler() {
  priceScheduler.start();
}

export function stopPriceScheduler() {
  priceScheduler.stop();
}

export function getSchedulerStatus() {
  return priceScheduler.getStatus();
}

export function runManualUpdate(tier) {
  if (tier === 'A') {
    return priceScheduler.runTierAUpdate();
  } else if (tier === 'B') {
    return priceScheduler.runTierBUpdate();
  } else {
    throw new Error(`Tier ${tier} non supportato per aggiornamenti automatici`);
  }
}
