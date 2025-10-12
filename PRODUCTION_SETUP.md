# 🚀 Setup Produzione - Sistema Aggiornamento Prezzi

## ⚠️ IMPORTANTE

Prima di avviare il server in produzione, è **NECESSARIO** eseguire il setup del database per aggiungere le nuove tabelle e colonne del sistema di aggiornamento prezzi.

## 📋 Passaggi di Setup

### 1. **Aggiorna Database**
```bash
npm run setup-production
```

Questo comando:
- ✅ Aggiunge le nuove colonne alla tabella `components`
- ✅ Crea le tabelle `price_cache` e `alternative_categories`
- ✅ Aggiorna la tabella `component_alternatives` con nuove colonne
- ✅ Crea tutti gli indici necessari

### 2. **Inizializza Categorie Alternative** (Opzionale)
```bash
npm run init-alternatives
```

Questo comando:
- ✅ Crea 20 categorie predefinite (SSD, RAM, PSU, Case, etc.)
- ✅ Configura il sistema di fallback automatico

### 3. **Avvia Server**
```bash
npm start
```

## 🔧 Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run setup-production` | Setup database per sistema prezzi |
| `npm run init-alternatives` | Inizializza categorie alternative |
| `npm start` | Avvia server |
| `npm run build` | Build applicazione |

## 📊 Verifica Setup

Dopo il setup, verifica che il database abbia:
- ✅ Tabella `components` con colonne: `asin`, `price_source`, `price_updated_at`, `price_cache_expires_at`, `tier`
- ✅ Tabella `price_cache` per cache prezzi
- ✅ Tabella `alternative_categories` per categorie alternative
- ✅ Tabella `component_alternatives` aggiornata con `category_id` e `is_active`

## 🚨 Risoluzione Errori

### Errore: "no such column: asin"
**Soluzione**: Esegui `npm run setup-production`

### Errore: "no such table: price_cache"
**Soluzione**: Esegui `npm run setup-production`

### Errore: "no such table: alternative_categories"
**Soluzione**: Esegui `npm run setup-production`

## 🎯 Dopo il Setup

Una volta completato il setup:

1. **Verifica le API admin**:
   - `/admin/alternatives` - Gestione alternative
   - `/admin/prices/stats` - Statistiche prezzi

2. **Configura le prime alternative**:
   - Vai su `/admin/alternatives`
   - Crea categorie per i componenti più comuni
   - Aggiungi alternative con priorità

3. **Testa il sistema**:
   - Aggiorna i prezzi di una build
   - Verifica che il fallback funzioni

## 📝 Note

- Il setup è **sicuro** e non danneggia i dati esistenti
- Le colonne vengono aggiunte solo se non esistono già
- Le tabelle vengono create solo se non esistono già
- Gli indici vengono creati solo se non esistono già

## 🆘 Supporto

Se riscontri problemi durante il setup:
1. Verifica i permessi del database
2. Controlla che il database non sia bloccato
3. Esegui i comandi uno alla volta
4. Controlla i logs per errori specifici

Il sistema è progettato per essere **robusto** e **sicuro** in produzione! 🎉
