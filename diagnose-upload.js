#!/usr/bin/env node

/**
 * Script di diagnostica per problemi di upload su AWS EC2
 * Esegui: node diagnose-upload.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DIAGNOSTICA UPLOAD AWS EC2');
console.log('================================\n');

// 1. Verifica configurazione ambiente
console.log('1. 📋 CONFIGURAZIONE AMBIENTE:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non impostato'}`);
console.log(`   PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`   MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE || '52428800 (50MB default)'}`);

// 2. Verifica file .env
console.log('\n2. 🔧 FILE .env:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ File .env trovato');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const maxFileSize = envContent.match(/MAX_FILE_SIZE=(.+)/);
  if (maxFileSize) {
    console.log(`   MAX_FILE_SIZE configurato: ${maxFileSize[1]} bytes (${Math.round(parseInt(maxFileSize[1]) / 1024 / 1024)}MB)`);
  } else {
    console.log('   ⚠️  MAX_FILE_SIZE non configurato nel .env');
  }
} else {
  console.log('   ❌ File .env non trovato - crea da env.example');
}

// 3. Verifica directory uploads
console.log('\n3. 📁 DIRECTORY UPLOADS:');
const uploadsDir = path.join(__dirname, 'public/uploads');
if (fs.existsSync(uploadsDir)) {
  console.log('   ✅ Directory uploads esiste');
  const stats = fs.statSync(uploadsDir);
  console.log(`   Permessi: ${stats.mode.toString(8)}`);
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('   ✅ Directory scrivibile');
  } catch (err) {
    console.log('   ❌ Directory non scrivibile:', err.message);
  }
} else {
  console.log('   ❌ Directory uploads non esiste');
}

// 4. Verifica dipendenze
console.log('\n4. 📦 DIPENDENZE:');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['multer', 'compression', 'express'];
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`   ✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`   ❌ ${dep}: mancante`);
    }
  });
}

// 5. Test configurazione multer
console.log('\n5. 🗂️  CONFIGURAZIONE MULTER:');
try {
  const uploadPath = path.join(__dirname, 'server/middleware/upload.js');
  if (fs.existsSync(uploadPath)) {
    console.log('   ✅ File upload.js trovato');
    const content = fs.readFileSync(uploadPath, 'utf8');
    
    // Estrai configurazione limits
    const limitsMatch = content.match(/limits:\s*{([^}]+)}/s);
    if (limitsMatch) {
      console.log('   Configurazione limits trovata:');
      const limits = limitsMatch[1];
      const fileSizeMatch = limits.match(/fileSize:\s*([^,]+)/);
      const fieldsMatch = limits.match(/fields:\s*([^,]+)/);
      const partsMatch = limits.match(/parts:\s*([^,]+)/);
      
      if (fileSizeMatch) console.log(`   - fileSize: ${fileSizeMatch[1].trim()}`);
      if (fieldsMatch) console.log(`   - fields: ${fieldsMatch[1].trim()}`);
      if (partsMatch) console.log(`   - parts: ${partsMatch[1].trim()}`);
    }
  } else {
    console.log('   ❌ File upload.js non trovato');
  }
} catch (err) {
  console.log('   ❌ Errore lettura configurazione:', err.message);
}

// 6. Suggerimenti per AWS EC2
console.log('\n6. ☁️  SUGGERIMENTI PER AWS EC2:');
console.log('   - Verifica che Nginx (se usato) abbia client_max_body_size 50M');
console.log('   - Controlla i log di Nginx: sudo tail -f /var/log/nginx/error.log');
console.log('   - Verifica che l\'Application Load Balancer non abbia limiti di dimensione');
console.log('   - Controlla i security groups per timeout');
console.log('   - Verifica lo spazio disco: df -h');

// 7. Test di connessione
console.log('\n7. 🌐 TEST DI CONNESSIONE:');
console.log('   Per testare l\'upload:');
console.log('   curl -X POST http://localhost:3000/api/admin/upload \\');
console.log('        -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('        -F "image=@/path/to/test-image.jpg"');

console.log('\n✅ Diagnostica completata!');
console.log('📝 Controlla i log del server durante l\'upload per maggiori dettagli.');

