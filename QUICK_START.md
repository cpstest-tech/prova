# ⚡ Quick Start - 5 Minuti per Partire

## 🚀 Setup Veloce

```bash
# 1. Installa dipendenze
npm install

# 2. Crea file .env (copia e modifica)
# Crea un file .env nella root con questo contenuto:
```

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=cambia-questo-secret-con-qualcosa-di-molto-lungo-e-casuale
DB_PATH=./server/database/buildpc.db
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
AMAZON_AFFILIATE_TAG=your-tag
FRONTEND_URL=http://localhost:5173
```

```bash
# 3. Inizializza database
npm run init-db

# 4. Avvia tutto
npm run dev
```

## 🎉 Fatto!

- **Sito pubblico**: http://localhost:5173
- **Admin CMS**: http://localhost:5173/admin/login
- **Credenziali**: `admin` / `admin123`

## 📝 Primi Passi

1. **Login Admin**: Vai su http://localhost:5173/admin/login
2. **Cambia Password**: Importante per sicurezza!
3. **Esplora Build**: Ci sono 2 build di esempio già create
4. **Crea Nuova Build**: Click su "Nuova Build" nella dashboard
5. **Pubblica**: Cambia stato da "Bozza" a "Pubblicato"
6. **Visualizza**: Vai sul sito pubblico per vedere la tua build

## 🎨 Personalizzazione Rapida

### Cambia Colori
Apri `tailwind.config.js` e modifica:
```js
primary: {
  600: '#0284c7', // Cambia questo colore
}
```

### Aggiungi Amazon Tag
Nel file `.env`:
```env
AMAZON_AFFILIATE_TAG=tuo-tag-affiliato-amazon
```

### Modifica Meta Tags
Apri `index.html` e aggiorna title e description.

## 🐛 Problemi Comuni

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"
Cambia `PORT=3001` nel file `.env`

### Database non si crea
```bash
npm run init-db
```

### Errore JWT
Verifica che `JWT_SECRET` sia impostato nel `.env`

## 📚 Struttura Progetto

```
build-pc-cms/
├── server/              # Backend Node.js + Express
│   ├── routes/         # API endpoints
│   ├── models/         # Database models
│   ├── middleware/     # Auth, upload, etc.
│   └── config/         # Configurazioni
├── src/                # Frontend React
│   ├── pages/          # Pagine (Home, BuildDetail, Admin)
│   ├── components/     # Componenti riutilizzabili
│   ├── context/        # React Context (Auth)
│   └── utils/          # Helper functions
├── public/             # File statici
└── package.json        # Dipendenze
```

## 🔑 Comandi Utili

```bash
# Sviluppo
npm run dev              # Avvia dev server (frontend + backend)
npm run server           # Solo backend
npm run client           # Solo frontend

# Database
npm run init-db          # Inizializza/reset database

# Produzione
npm run build            # Build per produzione
npm run preview          # Preview build produzione
```

## 📖 Documentazione Completa

- **README.md** - Documentazione generale
- **SETUP.md** - Setup dettagliato
- **FEATURES.md** - Lista features complete
- **API Endpoints** - Vedi README.md sezione API

## 🎯 Checklist Primo Utilizzo

- [ ] Installato dipendenze (`npm install`)
- [ ] Creato file `.env`
- [ ] Inizializzato database (`npm run init-db`)
- [ ] Avviato server (`npm run dev`)
- [ ] Login effettuato su admin
- [ ] Password admin cambiata
- [ ] Esplorato build di esempio
- [ ] Creato prima build personale
- [ ] Testato su mobile
- [ ] Verificato sitemap (`/sitemap.xml`)

## 🚀 Deploy Veloce

### Railway.app (Consigliato)
1. Push su GitHub
2. Connetti Railway al repo
3. Aggiungi variabili environment
4. Deploy automatico!

### Render.com
1. Push su GitHub
2. Crea nuovo Web Service
3. Imposta build command: `npm install && npm run build`
4. Imposta start command: `node server/index.js`
5. Aggiungi variabili environment

### VPS (DigitalOcean, Linode)
```bash
# Sul server
git clone your-repo
cd build-pc-cms
npm install
npm run build

# Setup PM2
npm install -g pm2
pm2 start server/index.js --name buildpc
pm2 startup
pm2 save

# Nginx reverse proxy
# Configura nginx per proxy_pass a localhost:3000
```

## 💡 Tips

1. **Backup Database**: Copia regolarmente `server/database/buildpc.db`
2. **Immagini**: Usa immagini ottimizzate (WebP, max 500KB)
3. **SEO**: Compila sempre meta title e description
4. **Link Amazon**: Aggiungi sempre il tuo tag affiliato
5. **Mobile**: Testa sempre su mobile prima di pubblicare

## 🆘 Supporto

- **Issues**: Apri issue su GitHub
- **Documentazione**: Leggi README.md e FEATURES.md
- **Community**: Cerca su Stack Overflow

---

**Pronto a creare build PC fantastiche!** 🎮💻
