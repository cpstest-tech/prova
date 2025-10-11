#!/usr/bin/env node

/**
 * Script di test per verificare l'upload
 * Esegui: node test-upload.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TEST UPLOAD SERVER');
console.log('====================\n');

// 1. Verifica directory uploads
const uploadsDir = path.join(__dirname, 'public/uploads');
console.log('1. 📁 Verifica directory uploads:');
console.log(`   Path: ${uploadsDir}`);

if (fs.existsSync(uploadsDir)) {
    console.log('   ✅ Directory esiste');
    
    try {
        const stats = fs.statSync(uploadsDir);
        console.log(`   Permessi: ${stats.mode.toString(8)}`);
        
        // Test scrittura
        const testFile = path.join(uploadsDir, 'test-write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('   ✅ Directory scrivibile');
    } catch (err) {
        console.log('   ❌ Errore directory:', err.message);
    }
} else {
    console.log('   ❌ Directory non esiste');
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('   ✅ Directory creata');
    } catch (err) {
        console.log('   ❌ Impossibile creare directory:', err.message);
    }
}

// 2. Verifica configurazione Multer
console.log('\n2. 🗂️ Verifica configurazione Multer:');
try {
    const uploadPath = path.join(__dirname, 'server/middleware/upload.js');
    if (fs.existsSync(uploadPath)) {
        console.log('   ✅ File upload.js esiste');
        
        // Verifica sintassi
        const content = fs.readFileSync(uploadPath, 'utf8');
        console.log('   ✅ File leggibile');
        
        // Estrai limiti
        const limitsMatch = content.match(/limits:\s*{([^}]+)}/s);
        if (limitsMatch) {
            console.log('   ✅ Configurazione limits trovata');
        }
    } else {
        console.log('   ❌ File upload.js non trovato');
    }
} catch (err) {
    console.log('   ❌ Errore lettura upload.js:', err.message);
}

// 3. Verifica variabili ambiente
console.log('\n3. 🌍 Verifica variabili ambiente:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non impostato'}`);
console.log(`   MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE || 'non impostato'}`);

// 4. Test creazione file di test
console.log('\n4. 📝 Test creazione file:');
try {
    const testFile = path.join(uploadsDir, 'test-' + Date.now() + '.txt');
    fs.writeFileSync(testFile, 'Test upload');
    console.log('   ✅ File di test creato');
    
    // Verifica dimensione
    const stats = fs.statSync(testFile);
    console.log(`   Dimensione: ${stats.size} bytes`);
    
    // Pulisci
    fs.unlinkSync(testFile);
    console.log('   ✅ File di test rimosso');
} catch (err) {
    console.log('   ❌ Errore test file:', err.message);
}

console.log('\n✅ Test completato!');
console.log('\n📋 Prossimi passi:');
console.log('1. Avvia il server: npm start');
console.log('2. Controlla i log per errori');
console.log('3. Prova l\'upload di nuovo');

