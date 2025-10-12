import cron from 'node-cron';
import db from '../config/database.js';
import { ProductSubstitution } from '../utils/productSubstitution.js';

/**
 * Script per il controllo automatico periodico dei prezzi
 * Può essere eseguito tramite cron job o scheduler
 */

const PRICE_THRESHOLD = process.env.PRICE_THRESHOLD || 15;
let isRunning = false;

async function runScheduledCheck() {
  if (isRunning) {
    console.log('⚠️ Controllo prezzi già in corso, salto questo ciclo');
    return;
  }

  isRunning = true;
  console.log('\n' + '='.repeat(60));
  console.log('🕐 CONTROLLO PREZZI SCHEDULATO');
  console.log('   Data: ' + new Date().toLocaleString('it-IT'));
  console.log('   Soglia: ' + PRICE_THRESHOLD + '%');
  console.log('='.repeat(60) + '\n');

  const substitution = new ProductSubstitution();
  
  try {
    const result = await substitution.checkAllPublishedBuilds();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONTROLLO COMPLETATO');
    console.log('   Prezzi aggiornati: ' + result.totalUpdated);
    console.log('   Prodotti sostituiti: ' + result.totalSubstituted);
    console.log('='.repeat(60) + '\n');
    
    // Salva log nel database
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS price_check_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          updated INTEGER,
          substituted INTEGER,
          run_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      const stmt = db.prepare(`
        INSERT INTO price_check_logs (updated, substituted)
        VALUES (?, ?)
      `);
      
      stmt.run(result.totalUpdated, result.totalSubstituted);
      console.log('📝 Log salvato nel database\n');
    } catch (logError) {
      console.error('⚠️  Errore nel salvataggio del log:', logError.message);
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRORE NEL CONTROLLO PREZZI');
    console.error('   ' + error.message);
    console.error('='.repeat(60) + '\n');
  } finally {
    await substitution.cleanup();
    isRunning = false;
  }
}

// Controllo ogni 6 ore
cron.schedule('0 */6 * * *', async () => {
  await runScheduledCheck();
});

// Controllo manuale ogni giorno alle 2:00 per componenti critici
cron.schedule('0 2 * * *', async () => {
  if (isRunning) {
    console.log('⚠️ Controllo prezzi già in corso, salto questo ciclo');
    return;
  }

  isRunning = true;
  console.log('🔍 Controllo notturno componenti critici...');
  
  const substitution = new ProductSubstitution();
  
  try {
    // Controlla solo build con molti componenti sostituiti
    const criticalBuilds = db.prepare(`
      SELECT b.id, b.title, COUNT(c.id) as substituted_count
      FROM builds b
      LEFT JOIN components c ON b.id = c.build_id AND c.is_substituted = 1
      WHERE b.status = 'published'
      GROUP BY b.id
      HAVING substituted_count > 2
      ORDER BY substituted_count DESC
    `).all();

    console.log(`📋 Trovate ${criticalBuilds.length} build critiche da controllare`);

    let totalUpdated = 0;
    let totalSubstituted = 0;

    for (const build of criticalBuilds) {
      console.log(`🔍 Controllo build critica: ${build.title} (${build.substituted_count} sostituiti)`);
      const result = await substitution.checkAndUpdateBuild(build.id);
      totalUpdated += result.updated;
      totalSubstituted += result.substituted;
    }

    console.log(`✅ Controllo notturno completato: ${totalUpdated} aggiornamenti, ${totalSubstituted} sostituzioni`);
    
  } catch (error) {
    console.error('❌ Errore nel controllo notturno:', error);
  } finally {
    await substitution.cleanup();
    isRunning = false;
  }
});

console.log('✅ Cron job per controllo prezzi configurato (ogni 6h + controllo notturno)');

// Se eseguito direttamente, esegui subito un controllo
if (process.argv.includes('--run-now')) {
  runScheduledCheck();
}
