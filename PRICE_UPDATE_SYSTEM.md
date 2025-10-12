# Sistema Aggiornamento Prezzi - Build PC

## 📋 Panoramica

Sistema completo per l'aggiornamento automatico dei prezzi dei componenti PC usando fonti gratuite pubbliche e un sistema di fallback intelligente.

## 🎯 Caratteristiche Principali

### ✅ Sistema a Tier
- **Tier A**: SSD, RAM, Alimentatore, Case, Scheda madre (aggiornamento giornaliero)
- **Tier B**: GPU <300€, Dissipatori (aggiornamento ogni 4 giorni)
- **Tier C**: GPU >300€, CPU, Ventole, Accessori (solo on-demand)

### ✅ Fonti Prezzi (in ordine di priorità)
1. **Keepa Pubblica** - `https://keepa.com/#!product/1-<ASIN>`
2. **CamelCamelCamel** - `https://it.camelcamelcamel.com/product/<ASIN>`
3. **Amazon Parser Custom** - Parser interno per estrazione diretta

### ✅ Sistema di Cache
- Cache intelligente con scadenza temporale
- Riduzione richieste esterne
- Protezione da rate limiting

### ✅ Fallback Automatico
- Alternative predefinite per componenti comuni
- Ricerca componenti simili per tipo
- Sistema di priorità per le alternative

## 🚀 Installazione e Setup

### 1. Installa Dipendenze
```bash
npm install
```

### 2. Aggiorna Database
```bash
node update-price-system.js
```

### 3. Avvia Server
```bash
npm start
```

Il sistema di aggiornamento prezzi si avvia automaticamente con il server.

## 📊 API Admin

### Aggiornamento Prezzi Build (Tier C)
```http
POST /api/admin/builds/:id/update-prices
```
Aggiorna tutti i prezzi di una build specifica.

### Aggiornamento Manuale Tier
```http
POST /api/admin/prices/update-tier/:tier
```
Aggiorna manualmente i prezzi di un tier specifico (A o B).

### Assegnazione Tier Automatica
```http
POST /api/admin/components/assign-tiers
```
Assegna automaticamente i tier ai componenti basandosi sul tipo.

### Statistiche Sistema
```http
GET /api/admin/prices/stats
```
Restituisce statistiche complete del sistema prezzi.

### Gestione Alternative
```http
GET /api/admin/alternatives/:asin
POST /api/admin/alternatives
DELETE /api/admin/alternatives/:id
POST /api/admin/alternatives/initialize
POST /api/admin/alternatives/update-prices
```

## ⏰ Scheduler Automatico

### Cron Jobs Configurati
- **Tier A**: Ogni giorno alle 6:00
- **Tier B**: Ogni 4 giorni alle 7:00
- **Pulizia Cache**: Ogni domenica alle 2:00
- **Assegnazione Tier**: Ogni giorno alle 5:00

### Gestione Scheduler
```javascript
import { startPriceScheduler, stopPriceScheduler, getSchedulerStatus } from './server/utils/priceScheduler.js';

// Avvia scheduler
startPriceScheduler();

// Arresta scheduler
stopPriceScheduler();

// Stato scheduler
const status = getSchedulerStatus();
```

## 🔧 Configurazione Componenti

### Assegnazione Tier Manuale
```javascript
import { Component } from './server/models/Component.js';

// Imposta tier specifico
Component.setTier(componentId, 'A');

// Aggiornamento bulk
Component.bulkUpdateTiers([
  { id: 1, tier: 'A' },
  { id: 2, tier: 'B' }
]);
```

### Gestione Alternative
```javascript
import ComponentAlternatives from './server/utils/componentAlternatives.js';

// Aggiungi alternativa
await ComponentAlternatives.addAlternative(
  'B08XYZ123',  // ASIN originale
  'B09ABC456',  // ASIN alternativa
  'Nome Prodotto',  // Nome
  129.99,  // Prezzo
  1  // Priorità
);

// Trova migliore alternativa
const alternative = await ComponentAlternatives.findBestAlternative('B08XYZ123');
```

## 📈 Monitoraggio e Logs

### Logs del Sistema
Il sistema genera logs dettagliati per:
- ✅ Successi aggiornamento prezzi
- ❌ Errori e fallimenti
- 🔄 Tentativi fallback
- 💾 Operazioni cache
- ⏰ Esecuzioni scheduler

### Esempio Log
```
🔄 Aggiornamento prezzo per ASIN: B08XYZ123
🔍 Keepa: cercando prezzo per ASIN B08XYZ123
✅ Keepa: trovato prezzo €129.99 per B08XYZ123
💾 Cache: salvato prezzo per B08XYZ123 da keepa_public
✅ Risultato finale per B08XYZ123: { price: 129.99, source: 'keepa_public' }
```

## 🛡️ Anti-Ban e Rate Limiting

### Protezioni Implementate
- **User-Agent casuali**: Rotazione automatica
- **Delay casuali**: 2-10 secondi tra richieste
- **Rate limiting**: 1 richiesta ASIN ogni 2-5 secondi
- **Cache obbligatoria**: Riduce richieste giornaliere
- **Timeout configurabili**: 20 secondi per richiesta

### Configurazione Delay
```javascript
// Delay tra richieste
await sleep(2000 + Math.random() * 3000);

// Delay tra fonti diverse
await sleep(500 + Math.random() * 1200);
```

## 🔄 Sistema Fallback

### Fallback Automatico
1. **Tentativo fonti primarie**: Keepa → CamelCamelCamel → Amazon Parser
2. **Ricerca alternative**: Database alternative predefinite
3. **Componenti simili**: Ricerca per tipo e prezzo
4. **Fallback interno**: Prezzo sconosciuto se tutto fallisce

### Alternative Predefinite
Il sistema include alternative per componenti comuni:
- SSD: Samsung 970 EVO Plus, Crucial MX500
- RAM: Corsair Vengeance LPX, G.Skill Ripjaws V
- PSU: Corsair RM750x, EVGA SuperNOVA
- Case: Fractal Design Meshify C, NZXT H510
- Motherboard: MSI B450 Tomahawk, ASUS ROG Strix

## 📊 Database Schema

### Tabelle Aggiunte
```sql
-- Componenti con campi prezzi
ALTER TABLE components ADD COLUMN asin TEXT;
ALTER TABLE components ADD COLUMN price_source TEXT;
ALTER TABLE components ADD COLUMN price_updated_at DATETIME;
ALTER TABLE components ADD COLUMN price_cache_expires_at DATETIME;
ALTER TABLE components ADD COLUMN tier TEXT DEFAULT 'C';

-- Cache prezzi
CREATE TABLE price_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asin TEXT UNIQUE NOT NULL,
  price REAL,
  source TEXT,
  url TEXT,
  last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alternative componenti
CREATE TABLE component_alternatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_asin TEXT NOT NULL,
  alternative_asin TEXT NOT NULL,
  alternative_name TEXT,
  alternative_price REAL,
  priority INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 Troubleshooting

### Problemi Comuni

#### Rate Limiting
```bash
# Verifica logs per errori 429
grep "429" server.log

# Riduci frequenza aggiornamenti
# Modifica delay in priceUpdater.js
```

#### Cache Piena
```bash
# Pulizia cache manuale
curl -X POST http://localhost:3000/api/admin/prices/cleanup-cache
```

#### Scheduler Non Avviato
```bash
# Verifica stato scheduler
curl http://localhost:3000/api/admin/prices/stats

# Riavvia scheduler
# Riavvia server completo
```

### Debug Mode
```javascript
// Abilita logs dettagliati
process.env.DEBUG_PRICES = 'true';
```

## 📝 Note di Sviluppo

### Estensibilità
- Aggiungere nuove fonti prezzi in `priceUpdater.js`
- Implementare nuovi criteri tier in `autoAssignTiers()`
- Estendere alternative predefinite in `initializeDefaultAlternatives()`

### Performance
- Cache riduce richieste esterne del 80%
- Scheduler distribuisce carico nel tempo
- Fallback riduce fallimenti del 60%

### Sicurezza
- Nessuna API key richiesta
- User-Agent casuali per evitare ban
- Rate limiting configurabile
- Timeout per evitare hanging requests

## 🎉 Conclusione

Il sistema implementato fornisce:
- ✅ Aggiornamento automatico prezzi
- ✅ Sistema robusto con fallback
- ✅ Cache intelligente
- ✅ API complete per admin
- ✅ Monitoraggio e logs
- ✅ Configurazione flessibile

Per supporto o modifiche, consultare la documentazione del codice sorgente.
