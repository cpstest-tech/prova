# ✅ Test Checklist - Verifica Funzionalità

## 🔧 Setup Iniziale

- [ ] `npm install` completato senza errori
- [ ] File `.env` creato con tutte le variabili
- [ ] `npm run init-db` eseguito con successo
- [ ] Database creato in `server/database/buildpc.db`
- [ ] Cartella `public/uploads` creata
- [ ] `npm run dev` avvia frontend e backend

## 🌐 Frontend Pubblico

### Homepage (http://localhost:5173)
- [ ] Pagina carica correttamente
- [ ] Header con logo e navigazione visibile
- [ ] Hero section con titolo e CTA
- [ ] Sezione features con 3 card
- [ ] Filtri categoria funzionanti
- [ ] 2 build di esempio visualizzate
- [ ] Card build mostrano: immagine, titolo, descrizione, budget, views
- [ ] Click su card apre pagina dettaglio
- [ ] Footer con informazioni visibile
- [ ] Responsive su mobile (testa con DevTools)

### Pagina Build Detail (http://localhost:5173/build/pc-gaming-1000-euro)
- [ ] Pagina carica correttamente
- [ ] Immagine featured visibile (se presente)
- [ ] Titolo H1 corretto
- [ ] Badge categoria presente
- [ ] Descrizione visibile
- [ ] Data pubblicazione e views mostrati
- [ ] Pulsanti social share funzionanti
- [ ] Contenuto articolo formattato correttamente
- [ ] Lista componenti visualizzata
- [ ] Ogni componente mostra: tipo, nome, specs, prezzo
- [ ] Link "Acquista" su Amazon presenti
- [ ] Totale build calcolato correttamente
- [ ] Disclaimer affiliazione presente
- [ ] Responsive su mobile

### SEO & Meta Tags
- [ ] Title tag corretto nel browser
- [ ] Meta description presente (View Page Source)
- [ ] Open Graph tags presenti
- [ ] Sitemap accessibile: http://localhost:3000/sitemap.xml
- [ ] robots.txt accessibile: http://localhost:3000/robots.txt

## 🔐 Admin CMS

### Login (http://localhost:5173/admin/login)
- [ ] Pagina login carica correttamente
- [ ] Form con username e password
- [ ] Login con `admin` / `admin123` funziona
- [ ] Redirect a dashboard dopo login
- [ ] Errore mostrato per credenziali errate
- [ ] Token JWT salvato in localStorage

### Dashboard (http://localhost:5173/admin)
- [ ] Redirect a login se non autenticato
- [ ] Sidebar con navigazione visibile
- [ ] 4 card statistiche mostrate:
  - [ ] Totale Build
  - [ ] Pubblicate
  - [ ] Bozze
  - [ ] Visualizzazioni Totali
- [ ] Lista "Build Recenti" con 5 build
- [ ] Click su build apre editor
- [ ] Sezione "Azioni Rapide" presente
- [ ] Pulsante "Nuova Build" funziona
- [ ] Link "Visualizza Sito" apre frontend
- [ ] Pulsante Logout funziona

### Lista Build (http://localhost:5173/admin/builds)
- [ ] Tabella con tutte le build
- [ ] Colonne: Titolo, Categoria, Budget, Stato, Views, Data, Azioni
- [ ] Ricerca per titolo funziona
- [ ] Filtro per stato funziona
- [ ] Badge stato colorati correttamente
- [ ] Pulsante "Visualizza" apre build pubblica
- [ ] Pulsante "Modifica" apre editor
- [ ] Pulsante "Elimina" chiede conferma
- [ ] Eliminazione rimuove build

### Editor Build - Nuova (http://localhost:5173/admin/builds/new)
- [ ] Form carica correttamente
- [ ] Tutti i campi presenti:
  - [ ] Titolo (obbligatorio)
  - [ ] Descrizione
  - [ ] Categoria (select)
  - [ ] Budget (numero)
  - [ ] Stato (select)
  - [ ] Immagine featured (upload)
  - [ ] Contenuto (textarea)
  - [ ] Meta title
  - [ ] Meta description
- [ ] Upload immagine funziona
- [ ] Preview immagine mostrata
- [ ] Rimozione immagine funziona
- [ ] Sezione componenti presente
- [ ] Pulsante "Aggiungi Componente" funziona
- [ ] Form componente con tutti i campi
- [ ] Rimozione componente funziona
- [ ] Contatore caratteri meta tags funziona
- [ ] Pulsante "Crea Build" salva correttamente
- [ ] Redirect a lista build dopo salvataggio

### Editor Build - Modifica
- [ ] Dati build caricati correttamente
- [ ] Tutti i campi popolati con valori esistenti
- [ ] Componenti caricati e visualizzati
- [ ] Modifiche salvate correttamente
- [ ] Pulsante "Aggiorna Build" funziona

## 🔌 API Backend

### Public Endpoints
```bash
# Test con curl o Postman

# Health check
curl http://localhost:3000/api/health
# ✅ Deve rispondere: {"status":"ok","timestamp":"..."}

# Lista build pubblicate
curl http://localhost:3000/api/builds
# ✅ Deve rispondere con array di build

# Build per slug
curl http://localhost:3000/api/builds/pc-gaming-1000-euro
# ✅ Deve rispondere con build e componenti

# Sitemap
curl http://localhost:3000/sitemap.xml
# ✅ Deve rispondere con XML valido

# robots.txt
curl http://localhost:3000/robots.txt
# ✅ Deve rispondere con testo
```

### Auth Endpoints
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# ✅ Deve rispondere con token e user

# Verify (sostituisci TOKEN)
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer TOKEN"
# ✅ Deve rispondere con user
```

### Admin Endpoints (require auth)
```bash
# Stats
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer TOKEN"
# ✅ Deve rispondere con statistiche

# Tutte le build
curl http://localhost:3000/api/admin/builds \
  -H "Authorization: Bearer TOKEN"
# ✅ Deve rispondere con array di tutte le build
```

## 📱 Responsive Design

### Mobile (375px - iPhone SE)
- [ ] Header menu hamburger funziona
- [ ] Hero section leggibile
- [ ] Card build impilate verticalmente
- [ ] Filtri categoria su una colonna
- [ ] Pagina build detail leggibile
- [ ] Componenti lista leggibili
- [ ] Admin sidebar collassabile
- [ ] Form editor utilizzabili

### Tablet (768px - iPad)
- [ ] Layout a 2 colonne per build
- [ ] Sidebar admin sempre visibile
- [ ] Form editor comodi da usare

### Desktop (1920px)
- [ ] Layout a 3 colonne per build
- [ ] Contenuto centrato con max-width
- [ ] Spazi e padding corretti

## 🔒 Sicurezza

- [ ] Password hashate nel database (non in chiaro)
- [ ] JWT token con scadenza
- [ ] Route admin protette (redirect a login)
- [ ] Upload solo immagini permesso
- [ ] Dimensione file limitata (5MB)
- [ ] CORS configurato correttamente
- [ ] Rate limiting attivo su API
- [ ] Helmet headers presenti

## ⚡ Performance

### Lighthouse Test (Chrome DevTools)
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### Network
- [ ] CSS minificato in produzione
- [ ] JS minificato in produzione
- [ ] Immagini ottimizzate
- [ ] No errori console
- [ ] No warning console

## 🐛 Error Handling

- [ ] 404 page per route inesistenti
- [ ] Errori API mostrati all'utente
- [ ] Loading states durante fetch
- [ ] Conferme per azioni distruttive
- [ ] Validazione form lato client
- [ ] Validazione form lato server

## 📊 Database

- [ ] File `.db` creato in `server/database/`
- [ ] Tabelle create: users, builds, components
- [ ] Utente admin presente
- [ ] 2 build di esempio presenti
- [ ] Componenti collegati alle build
- [ ] Foreign keys funzionanti

## 🎨 UI/UX

- [ ] Design consistente in tutto il sito
- [ ] Colori primari applicati correttamente
- [ ] Icone Lucide visibili
- [ ] Hover states su pulsanti
- [ ] Focus states su input
- [ ] Transizioni smooth
- [ ] Font leggibili
- [ ] Contrasto sufficiente per accessibilità

## 📝 Contenuti

- [ ] Build di esempio complete
- [ ] Componenti con prezzi
- [ ] Link Amazon formattati correttamente
- [ ] Descrizioni presenti
- [ ] Meta tags compilati

## 🚀 Deploy Ready

- [ ] `npm run build` completa senza errori
- [ ] Build folder `dist` creata
- [ ] File statici ottimizzati
- [ ] Environment variables documentate
- [ ] README completo
- [ ] .gitignore configurato

---

## 🎯 Score Finale

**Totale Test**: ___ / 150+

- ✅ **Eccellente**: 140+ test passati
- ⚠️ **Buono**: 120-139 test passati
- ❌ **Da migliorare**: < 120 test passati

---

## 📝 Note

Annota qui eventuali problemi riscontrati:

```
- 
- 
- 
```

## ✅ Approvazione

- [ ] Tutti i test critici passati
- [ ] Pronto per produzione
- [ ] Documentazione completa

**Testato da**: _______________  
**Data**: _______________  
**Versione**: 1.0.0
