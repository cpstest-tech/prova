# 🚀 Guida Setup Rapido

## 1. Installazione Dipendenze

```bash
npm install
```

## 2. Configurazione Environment

Crea il file `.env` nella root del progetto:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (CAMBIA QUESTO!)
JWT_SECRET=tuo-super-secret-jwt-key-molto-lungo-e-sicuro

# Database
DB_PATH=./server/database/buildpc.db

# Upload Configuration
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880

# Amazon Affiliate (opzionale)
AMAZON_AFFILIATE_TAG=your-affiliate-tag

# Frontend URL (per produzione)
FRONTEND_URL=http://localhost:5173
```

## 3. Inizializza Database

```bash
npm run init-db
```

Questo creerà:
- ✅ Tabelle del database
- ✅ Utente admin (username: `admin`, password: `admin123`)
- ✅ 2 build di esempio

## 4. Avvia il Progetto

```bash
npm run dev
```

Questo avvierà:
- 🔧 Backend API su http://localhost:3000
- 🎨 Frontend React su http://localhost:5173

## 5. Accedi al CMS

1. Vai su http://localhost:5173/admin/login
2. Username: `admin`
3. Password: `admin123`
4. ⚠️ **CAMBIA LA PASSWORD SUBITO!**

## 6. Testa il Sito

- **Homepage**: http://localhost:5173
- **Admin**: http://localhost:5173/admin
- **Sitemap**: http://localhost:3000/sitemap.xml
- **API Health**: http://localhost:3000/api/health

## 📝 Prossimi Passi

1. **Cambia password admin** dalla dashboard
2. **Modifica JWT_SECRET** nel file `.env`
3. **Aggiungi il tuo Amazon Affiliate Tag** nel `.env`
4. **Crea le tue build** dal CMS
5. **Personalizza colori** in `tailwind.config.js`
6. **Carica immagini** per le build

## 🐛 Troubleshooting

### Errore "Cannot find module"
```bash
npm install
```

### Database non si crea
```bash
npm run init-db
```

### Porta già in uso
Cambia `PORT` nel file `.env`

### Errore CORS
Verifica che `FRONTEND_URL` nel `.env` corrisponda all'URL del frontend

## 🚀 Deploy in Produzione

### Build Frontend
```bash
npm run build
```

### Configurazione Produzione
1. Cambia `NODE_ENV=production` nel `.env`
2. Imposta `FRONTEND_URL` con il tuo dominio
3. Usa un JWT_SECRET sicuro e lungo
4. Configura HTTPS
5. Usa un database più robusto (PostgreSQL/MySQL) se necessario

### Hosting Consigliati
- **VPS**: DigitalOcean, Linode, Hetzner
- **Platform**: Railway.app, Render.com, Fly.io
- **Shared**: Qualsiasi hosting con Node.js support

## 📚 Documentazione API

Vedi `README.md` per la lista completa degli endpoint API.

## 🎨 Personalizzazione

### Colori
Modifica `tailwind.config.js` per cambiare i colori del tema.

### Logo
Sostituisci l'icona `<Cpu>` in `Layout.jsx` con il tuo logo.

### Meta Tags Default
Modifica `index.html` e `SEO.jsx` per i meta tag di default.

## ✅ Checklist Pre-Launch

- [ ] Password admin cambiata
- [ ] JWT_SECRET personalizzato
- [ ] Amazon Affiliate Tag configurato
- [ ] Almeno 5-10 build pubblicate
- [ ] Immagini ottimizzate caricate
- [ ] Meta tags personalizzati
- [ ] Sitemap verificata
- [ ] Test su mobile
- [ ] Google Search Console configurato
- [ ] Analytics installato (opzionale)

---

Buon lavoro! 🎉
