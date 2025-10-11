# Sistema di Sostituzione Intelligente Componenti PC

## 🎯 Panoramica

Il Sistema di Sostituzione Intelligente risolve automaticamente il problema dei componenti PC che vanno in esaurimento o cambiano prezzo, mantenendo i carrelli Amazon sempre funzionanti e aggiornati.

## ✨ Caratteristiche Principali

### 🔍 **Controllo Automatico Disponibilità**
- Controlla la disponibilità dei componenti ogni 6 ore
- Verifica prezzi e stock status su Amazon
- Aggiorna automaticamente lo stato nel database

### 🔄 **Sostituzione Intelligente**
- Cerca automaticamente alternative quando un prodotto è esaurito
- Usa query di ricerca personalizzate per ogni componente
- Valida la qualità delle sostituzioni (prezzo, categoria, rating)

### 🛒 **Carrelli Amazon Sempre Aggiornati**
- Rigenera automaticamente i link "Compra Tutto"
- Mantiene l'affiliate tag corretto
- Aggiorna i prezzi in tempo reale

### 📊 **Interfaccia Trasparente**
- Mostra badge per componenti sostituiti
- Statistiche delle sostituzioni
- Possibilità di ripristinare componenti originali

## 🏗️ Architettura del Sistema

### Database Schema
```sql
-- Nuove colonne aggiunte alla tabella components
ALTER TABLE components ADD COLUMN search_query TEXT;
ALTER TABLE components ADD COLUMN is_replacement BOOLEAN DEFAULT FALSE;
ALTER TABLE components ADD COLUMN original_component_id INTEGER;
ALTER TABLE components ADD COLUMN replacement_reason TEXT;
ALTER TABLE components ADD COLUMN price_difference DECIMAL(10,2);
ALTER TABLE components ADD COLUMN last_checked DATETIME;
ALTER TABLE components ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
```

### File Principali

#### Backend
- `server/utils/availabilityChecker.js` - Controllo disponibilità Amazon
- `server/utils/alternativeFinder.js` - Ricerca alternative automatiche
- `server/utils/smartReplacer.js` - Logica sostituzione componenti
- `server/routes/availability.js` - API endpoints
- `server/scripts/updateAvailability.js` - Job schedulato
- `server/config/replacement.js` - Configurazione sistema

#### Frontend
- `src/components/ReplacementBadge.jsx` - UI componenti sostituiti
- `src/pages/admin/BuildEditor.jsx` - Campo ricerca alternative
- `src/components/ComponentsList.jsx` - Badge sostituzioni
- `src/pages/BuildDetail.jsx` - Statistiche sostituzioni

## 🚀 Come Usare il Sistema

### 1. **Configurazione Componenti**

Nell'interfaccia admin, per ogni componente puoi aggiungere una **Query di Ricerca Alternative**:

```
Esempio per GPU RTX 4060:
RTX 4060 Ti OR RTX 4070 OR RX 7600 OR RTX 3060 Ti

Esempio per CPU Ryzen 5 5600:
Ryzen 5 5600X OR Intel i5-12400F OR Ryzen 5 5500

Esempio per RAM DDR4 16GB:
DDR4 16GB 3200MHz OR DDR4 16GB 3600MHz OR DDR4 16GB 2666MHz
```

### 2. **Controllo Manuale**

Puoi controllare e sostituire manualmente i componenti:

```bash
# Controlla disponibilità di una build
curl -X GET /api/builds/123/availability

# Controlla e sostituisce automaticamente
curl -X POST /api/builds/123/check-and-replace

# Rigenera carrello Amazon
curl -X GET /api/builds/123/regenerate-cart
```

### 3. **Controllo Automatico**

Il sistema esegue automaticamente ogni 6 ore:
- Controlla tutti i componenti di tutte le build
- Sostituisce automaticamente quelli non disponibili
- Rigenera i carrelli Amazon
- Invia notifiche se configurate

## 📋 API Endpoints

### Controllo Disponibilità
```http
GET /api/builds/:id/availability
POST /api/builds/:id/check-and-replace
```

### Gestione Alternative
```http
GET /api/components/:id/alternatives
POST /api/components/:id/test-search
PUT /api/components/:id/search-query
GET /api/components/:id/search-suggestions
```

### Carrello Amazon
```http
GET /api/builds/:id/regenerate-cart
```

### Statistiche
```http
GET /api/builds/:id/replacement-stats
POST /api/admin/check-all-builds
GET /api/admin/replacement-overview
```

### Ripristino Componenti
```http
POST /api/components/:id/restore
```

## ⚙️ Configurazione

### File `server/config/replacement.js`

```javascript
export const REPLACEMENT_CONFIG = {
  // Intervallo controllo (ore)
  checkInterval: 6,
  
  // Affiliate tag Amazon
  affiliateTag: 'cpstest05-21',
  
  // Limiti sostituzioni
  limits: {
    maxPriceIncrease: 50, // euro
    maxPriceIncreasePercentage: 20, // %
    maxAlternatives: 10
  }
};
```

### Variabili Ambiente

```bash
# Email admin per notifiche
ADMIN_EMAIL=admin@build-pc.it

# Webhook per notifiche (opzionale)
REPLACEMENT_WEBHOOK_URL=https://hooks.slack.com/...

# Livello di log
NODE_ENV=production
```

## 🧪 Testing

### Test Manuale
```bash
# Esegui test del sistema
node test-replacement-system.js
```

### Test API
```bash
# Test controllo disponibilità
curl -X GET http://localhost:3000/api/builds/1/availability

# Test ricerca alternative
curl -X GET http://localhost:3000/api/components/1/alternatives
```

## 📊 Monitoraggio

### Log del Sistema
Il sistema genera log dettagliati per:
- Controlli disponibilità
- Sostituzioni eseguite
- Errori e fallimenti
- Statistiche performance

### Dashboard Admin
- Panoramica sostituzioni
- Componenti che necessitano query
- Statistiche utilizzo sistema

## 🔧 Manutenzione

### Aggiornamento Query
1. Vai nell'admin panel
2. Modifica la query di ricerca per un componente
3. Il sistema userà la nuova query per future sostituzioni

### Ripristino Componenti
1. Trova il componente sostituito
2. Clicca "Ripristina" nel badge
3. Il componente originale verrà ripristinato

### Pulizia Database
```sql
-- Rimuovi componenti sostituiti vecchi (opzionale)
DELETE FROM components WHERE is_replacement = TRUE AND created_at < DATE('now', '-30 days');
```

## 🚨 Risoluzione Problemi

### Componenti Non Sostituiti
- Verifica che la query di ricerca sia configurata
- Controlla che l'alternativa sia effettivamente disponibile
- Verifica i limiti di prezzo nella configurazione

### Errori API Amazon
- Il sistema usa simulazioni per evitare rate limiting
- In produzione, implementa l'Amazon Product Advertising API
- Configura proxy se necessario

### Job Schedulato Non Funziona
- Verifica che il server sia in produzione (`NODE_ENV=production`)
- Controlla i log del server
- Verifica che il database sia accessibile

## 🔮 Sviluppi Futuri

### Funzionalità Pianificate
- [ ] Integrazione Amazon Product Advertising API reale
- [ ] Machine Learning per suggerimenti automatici
- [ ] Notifiche email/Slack per sostituzioni
- [ ] Dashboard analytics avanzate
- [ ] Supporto per altri marketplace (eBay, etc.)
- [ ] Controllo compatibilità automatico
- [ ] Sistema di rating alternative

### Miglioramenti Tecnici
- [ ] Cache Redis per performance
- [ ] Queue system per job asincroni
- [ ] API rate limiting avanzato
- [ ] Test suite completo
- [ ] Documentazione API automatica

## 📞 Supporto

Per problemi o domande:
1. Controlla i log del sistema
2. Verifica la configurazione
3. Testa con il file `test-replacement-system.js`
4. Consulta la documentazione API

---

**Il Sistema di Sostituzione Intelligente garantisce che i tuoi carrelli Amazon siano sempre funzionanti e aggiornati, risolvendo automaticamente il problema dei componenti esauriti!** 🎉
