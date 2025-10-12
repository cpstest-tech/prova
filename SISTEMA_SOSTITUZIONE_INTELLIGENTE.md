# Sistema di Sostituzione Intelligente

## Panoramica

Il sistema di sostituzione intelligente monitora automaticamente i prezzi e la disponibilità dei prodotti Amazon nei componenti delle build PC. Quando un prodotto non è più disponibile o il prezzo aumenta oltre il 15%, il sistema trova automaticamente un prodotto sostitutivo simile.

## Funzionalità Principali

### 🔍 Monitoraggio Prezzi
- Controllo automatico ogni 6 ore dei prezzi Amazon
- Controllo notturno per build critiche (con molti componenti sostituiti)
- Scraping intelligente per evitare blocchi Amazon

### 🔄 Sostituzione Intelligente
- Ricerca automatica di prodotti alternativi
- Limite di tolleranza del 15% sul prezzo
- Mantiene compatibilità e specifiche simili
- Salva il prodotto originale per ripristino manuale

### 📊 Gestione Carrello
- Generazione automatica di link carrello aggiornati
- Include prodotti sostituiti con notifiche
- Mantiene tag affiliati Amazon

### 🎯 Interfaccia Admin
- Campo "Termine di Ricerca" per ogni componente
- Controllo manuale di singoli componenti
- Statistiche di sostituzione
- Ripristino manuale di prodotti originali

## Configurazione

### 1. Installazione Dipendenze
```bash
npm install puppeteer node-cron
```

### 2. Configurazione Database
Il database viene aggiornato automaticamente con le colonne necessarie:
- `searchterm`: Termine di ricerca per trovare alternative
- `original_price`: Prezzo originale del prodotto
- `is_substituted`: Flag per prodotti sostituiti
- `substitution_reason`: Motivo della sostituzione
- `original_asin`: ASIN del prodotto originale
- `last_price_check`: Timestamp ultimo controllo

### 3. Variabili Ambiente
```env
PRICE_THRESHOLD=15  # Soglia percentuale per sostituzione (default: 15%)
```

## Utilizzo

### Per gli Admin

#### Aggiungere Termini di Ricerca
1. Vai alla sezione Admin → Builds
2. Modifica una build esistente
3. Per ogni componente, aggiungi un "Termine di Ricerca"
   - Esempio: "AMD Ryzen 5 5600 CPU" invece di solo "AMD Ryzen 5 5600"

#### Controllo Manuale
```bash
# Controllo di tutte le build
curl -X POST http://localhost:3000/api/admin/check-prices

# Controllo di una build specifica
curl -X POST http://localhost:3000/api/admin/check-prices \
  -H "Content-Type: application/json" \
  -d '{"buildId": 1}'

# Controllo di un singolo componente
curl -X POST http://localhost:3000/api/admin/components/123/check
```

#### Gestione Sostituzioni
```bash
# Trova sostituto per un componente
curl -X POST http://localhost:3000/api/admin/components/123/find-substitute

# Ripristina prodotto originale
curl -X POST http://localhost:3000/api/admin/components/123/restore

# Genera carrello aggiornato
curl -X POST http://localhost:3000/api/admin/builds/1/generate-cart
```

### Per gli Utenti

#### Notifiche di Sostituzione
- I componenti sostituiti mostrano un badge "Prodotto Sostituito"
- Viene indicato il motivo della sostituzione
- Il prezzo originale viene mostrato barrato se diverso

#### Carrello Aggiornato
- Il link "Compra Tutto" include automaticamente i prodotti sostituiti
- Le notifiche indicano quali prodotti sono stati sostituiti

## API Endpoints

### Controllo Prezzi
- `POST /api/admin/check-prices` - Controlla tutti i prezzi
- `POST /api/admin/check-prices` (con `buildId`) - Controlla build specifica
- `POST /api/admin/components/:id/check` - Controlla singolo componente

### Gestione Sostituzioni
- `POST /api/admin/components/:id/find-substitute` - Trova sostituto
- `POST /api/admin/components/:id/substitute` - Applica sostituzione
- `POST /api/admin/components/:id/restore` - Ripristina originale

### Carrello e Statistiche
- `POST /api/admin/builds/:id/generate-cart` - Genera carrello aggiornato
- `GET /api/admin/substitution-stats` - Statistiche sostituzioni
- `PATCH /api/admin/components/:id/searchterm` - Aggiorna termine ricerca

## Scheduling Automatico

### Controllo Ogni 6 Ore
```javascript
// Cron: 0 */6 * * *
// Controlla tutte le build pubblicate
```

### Controllo Notturno
```javascript
// Cron: 0 2 * * *
// Controlla solo build critiche (con >2 sostituzioni)
```

### Esecuzione Manuale
```bash
# Esegui controllo immediato
node server/scripts/scheduledPriceCheck.js --run-now
```

## Test del Sistema

```bash
# Test completo del sistema
node test-substitution-system.js
```

Il test verifica:
- ✅ Schema database
- ✅ Controllo prezzi Amazon
- ✅ Ricerca prodotti alternativi
- ✅ Sostituzione componenti
- ✅ API endpoints

## Log e Monitoraggio

### Log Database
```sql
-- Visualizza log controlli prezzi
SELECT * FROM price_check_logs ORDER BY run_at DESC LIMIT 10;

-- Statistiche sostituzioni
SELECT 
  COUNT(*) as total_components,
  COUNT(CASE WHEN is_substituted = 1 THEN 1 END) as substituted,
  COUNT(CASE WHEN last_price_check > datetime('now', '-24 hours') THEN 1 END) as checked_today
FROM components;
```

### Log Console
Il sistema produce log dettagliati:
- 🔍 Controllo prezzi in corso
- ✅ Prodotti aggiornati/sostituiti
- ❌ Errori e problemi
- 📊 Statistiche finali

## Risoluzione Problemi

### Problemi Comuni

#### Puppeteer non funziona
```bash
# Installa dipendenze mancanti
sudo apt-get update
sudo apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

#### Amazon blocca le richieste
- Il sistema usa user-agent realistici
- Aggiunge delay tra le richieste
- Usa proxy se necessario (configurabile)

#### Database locked
```bash
# Verifica processi che usano il database
lsof server/database/buildpc.db

# Riavvia il server se necessario
pm2 restart all
```

### Debug Avanzato

#### Test singolo componente
```javascript
import { ProductSubstitution } from './server/utils/productSubstitution.js';

const substitution = new ProductSubstitution();
const component = { /* dati componente */ };
const result = await substitution.checkAndUpdateComponent(component);
console.log(result);
```

#### Test scraping Amazon
```javascript
import { PriceChecker } from './server/utils/priceChecker.js';

const checker = new PriceChecker();
const data = await checker.checkProductPrice('https://amazon.it/dp/...');
console.log(data);
```

## Sicurezza

### Rate Limiting
- Massimo 200 richieste per IP ogni 15 minuti
- Delay automatico tra richieste Amazon
- Controllo timeout per evitare blocchi

### Sanitizzazione
- Tutti gli input vengono sanitizzati
- Validazione URL Amazon
- Escape SQL injection

### Privacy
- Nessun dato personale viene salvato
- Solo URL e prezzi pubblici Amazon
- Log anonimi per debugging

## Performance

### Ottimizzazioni
- Browser Puppeteer condiviso tra richieste
- Query database ottimizzate con indici
- Caching dei risultati per 6 ore

### Monitoraggio
- Memory usage del browser
- Tempo di risposta Amazon
- Successo rate delle sostituzioni

## Roadmap

### Funzionalità Future
- [ ] Supporto per più marketplace (eBay, Amazon US, etc.)
- [ ] Machine Learning per migliorare matching
- [ ] Notifiche email per sostituzioni critiche
- [ ] Dashboard real-time per admin
- [ ] API webhook per integrazioni esterne

### Miglioramenti
- [ ] Cache Redis per performance
- [ ] Queue system per controlli asincroni
- [ ] Metriche Prometheus
- [ ] Test automatizzati CI/CD

---

**Autore**: Paolo Baldini  
**Versione**: 1.0.0  
**Data**: 2024  
**Licenza**: MIT
