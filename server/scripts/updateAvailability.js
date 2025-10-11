import { checkAllBuilds } from '../utils/smartReplacer.js';
import { Component } from '../models/Component.js';
import { Build } from '../models/Build.js';
import '../config/database.js'; // Inizializza database

/**
 * Script per il controllo automatico della disponibilità dei componenti
 * Esegue ogni 6 ore per controllare e sostituire componenti non disponibili
 */

// Configurazione
const CONFIG = {
  checkInterval: 6 * 60 * 60 * 1000, // 6 ore in millisecondi
  maxRetries: 3,
  retryDelay: 30000, // 30 secondi
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};

/**
 * Logga un messaggio con timestamp
 * @param {string} level - Livello di log
 * @param {string} message - Messaggio da loggare
 * @param {Object} data - Dati aggiuntivi
 */
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevel = levels.indexOf(CONFIG.logLevel);
  const messageLevel = levels.indexOf(level);
  
  if (messageLevel >= currentLevel) {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
  }
}

/**
 * Esegue il controllo di tutte le build
 * @param {number} attempt - Numero del tentativo
 * @returns {Object} - Risultato dell'operazione
 */
async function runAvailabilityCheck(attempt = 1) {
  try {
    log('info', `Avvio controllo disponibilità (tentativo ${attempt}/${CONFIG.maxRetries})`);
    
    const startTime = Date.now();
    const result = await checkAllBuilds();
    const duration = Date.now() - startTime;
    
    if (result.success) {
      log('info', 'Controllo disponibilità completato con successo', {
        duration: `${duration}ms`,
        totalChecked: result.totalChecked,
        totalReplaced: result.totalReplaced,
        buildsAffected: result.buildsAffected
      });
      
      // Log dettagli sostituzioni
      if (result.results && result.results.length > 0) {
        log('info', 'Build con sostituzioni:', {
          builds: result.results.map(r => ({
            id: r.buildId,
            title: r.buildTitle,
            replaced: r.replaced,
            checked: r.checked
          }))
        });
      }
      
      return {
        success: true,
        duration,
        result
      };
    } else {
      throw new Error(result.message || 'Controllo fallito');
    }
    
  } catch (error) {
    log('error', `Errore nel controllo disponibilità (tentativo ${attempt}):`, {
      error: error.message,
      stack: error.stack
    });
    
    if (attempt < CONFIG.maxRetries) {
      log('info', `Riprovo tra ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return runAvailabilityCheck(attempt + 1);
    } else {
      log('error', 'Controllo disponibilità fallito dopo tutti i tentativi');
      return {
        success: false,
        error: error.message,
        attempts: attempt
      };
    }
  }
}

/**
 * Genera un report delle statistiche del sistema
 * @returns {Object} - Statistiche del sistema
 */
async function generateSystemStats() {
  try {
    const builds = await Build.getAll();
    const components = await Component.getUnavailableComponents();
    const replacedComponents = components.filter(c => c.is_replacement);
    
    const stats = {
      timestamp: new Date().toISOString(),
      totalBuilds: builds.length,
      totalComponents: builds.reduce((sum, build) => sum + build.componentCount || 0, 0),
      unavailableComponents: components.filter(c => !c.is_replacement).length,
      replacedComponents: replacedComponents.length,
      componentsNeedingQuery: components.filter(c => !c.is_replacement && !c.search_query).length
    };
    
    log('info', 'Statistiche sistema:', stats);
    return stats;
    
  } catch (error) {
    log('error', 'Errore nella generazione statistiche:', { error: error.message });
    return null;
  }
}

/**
 * Invia notifica admin se configurato
 * @param {Object} result - Risultato del controllo
 */
async function notifyAdmin(result) {
  // Implementazione notifica admin (email, webhook, ecc.)
  // Per ora solo log
  if (result.success && result.result.totalReplaced > 0) {
    log('info', 'NOTIFICA ADMIN: Sostituzioni automatiche eseguite', {
      totalReplaced: result.result.totalReplaced,
      buildsAffected: result.result.buildsAffected
    });
  } else if (!result.success) {
    log('error', 'NOTIFICA ADMIN: Errore nel controllo automatico', {
      error: result.error
    });
  }
}

/**
 * Funzione principale del job schedulato
 */
async function scheduledAvailabilityCheck() {
  try {
    log('info', '=== AVVIO JOB SCHEDULATO CONTROLLO DISPONIBILITÀ ===');
    
    // Genera statistiche preliminari
    await generateSystemStats();
    
    // Esegui controllo disponibilità
    const result = await runAvailabilityCheck();
    
    // Notifica admin se necessario
    await notifyAdmin(result);
    
    log('info', '=== COMPLETATO JOB SCHEDULATO CONTROLLO DISPONIBILITÀ ===');
    
    return result;
    
  } catch (error) {
    log('error', 'Errore critico nel job schedulato:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Avvia il job schedulato
 */
function startScheduledJob() {
  log('info', 'Avvio job schedulato controllo disponibilità', {
    interval: `${CONFIG.checkInterval / 1000 / 60 / 60} ore`
  });
  
  // Esegui immediatamente al primo avvio
  scheduledAvailabilityCheck();
  
  // Poi esegui ogni intervallo configurato
  setInterval(scheduledAvailabilityCheck, CONFIG.checkInterval);
}

/**
 * Gestisce l'arresto del job
 */
function stopScheduledJob() {
  log('info', 'Arresto job schedulato controllo disponibilità');
  // Qui si potrebbero aggiungere cleanup se necessario
}

// Gestione segnali di sistema
process.on('SIGINT', () => {
  log('info', 'Ricevuto SIGINT, arresto job schedulato...');
  stopScheduledJob();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Ricevuto SIGTERM, arresto job schedulato...');
  stopScheduledJob();
  process.exit(0);
});

// Esporta funzioni per uso esterno
export {
  scheduledAvailabilityCheck,
  runAvailabilityCheck,
  generateSystemStats,
  startScheduledJob,
  stopScheduledJob
};

// Avvia automaticamente se il file viene eseguito direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  log('info', 'Esecuzione diretta del job controllo disponibilità');
  
  scheduledAvailabilityCheck()
    .then(result => {
      log('info', 'Esecuzione completata:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      log('error', 'Errore nell\'esecuzione:', { error: error.message });
      process.exit(1);
    });
}
