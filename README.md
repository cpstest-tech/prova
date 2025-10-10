# 🖥️ Build PC CMS - MVP

Sito web moderno per la gestione e presentazione di build PC con link affiliati Amazon.

## 🚀 Features

- ✅ **CMS Completo**: Dashboard admin per gestire articoli e build
- ✅ **Autenticazione Sicura**: Login con JWT e password hashate
- ✅ **SEO Optimized**: Meta tags, sitemap XML, URL friendly
- ✅ **Responsive Design**: Mobile-first con TailwindCSS
- ✅ **Link Affiliati**: Integrazione Amazon affiliate links
- ✅ **Upload Immagini**: Gestione media integrata
- ✅ **Performance**: Ottimizzato per velocità e Core Web Vitals

## 📦 Tecnologie

### Frontend
- React 18
- React Router
- TailwindCSS
- Lucide Icons
- Axios

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT Authentication
- Bcrypt per password
- Multer per upload

## 🛠️ Installazione

1. **Clona e installa dipendenze**
```bash
npm install
```

2. **Configura environment**
```bash
cp .env.example .env
# Modifica .env con le tue configurazioni
```

3. **Inizializza database**
```bash
npm run init-db
```

4. **Avvia in sviluppo**
```bash
npm run dev
```

Il sito sarà disponibile su:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 👤 Credenziali Default

**Username**: admin  
**Password**: admin123

⚠️ **IMPORTANTE**: Cambia la password dopo il primo login!

## 📁 Struttura Progetto

```
build-pc-cms/
├── server/              # Backend Node.js
│   ├── index.js        # Entry point
│   ├── config/         # Configurazioni
│   ├── middleware/     # Auth, validation
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── models/         # Database models
│   ├── database/       # SQLite DB
│   └── scripts/        # Utility scripts
├── src/                # Frontend React
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utilities
│   └── App.jsx         # Main app
├── public/             # Static files
│   └── uploads/        # User uploads
└── package.json

```

## 🔐 Sicurezza

### Protezioni Implementate

- ✅ **Anti Brute-Force**: Rate limiting aggressivo (max 5 tentativi login/15min)
- ✅ **Account Locking**: Blocco automatico dopo 10 tentativi falliti
- ✅ **Password Forte**: Minimo 8 caratteri, maiuscole, numeri, simboli
- ✅ **SQL Injection**: Prepared statements ovunque
- ✅ **XSS Protection**: Sanitizzazione input + CSP headers
- ✅ **Security Headers**: Helmet.js con configurazione avanzata (HSTS, X-Frame-Options, etc.)
- ✅ **File Upload Sicuro**: Whitelist estensioni + verifica MIME type
- ✅ **Logging Completo**: Tracciamento tentativi di accesso con IP
- ✅ **JWT Sicuro**: Token con scadenza 7 giorni
- ✅ **CORS Configurato**: Whitelist domini autorizzati

### Configurazione Sicurezza

1. **Setup iniziale**:
```bash
# Copia configurazione
cp env.example .env

# Genera JWT_SECRET sicuro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Incolla il secret generato in .env
```

2. **Primo accesso**:
   - Login con credenziali default
   - **CAMBIA PASSWORD IMMEDIATAMENTE**
   - Usa password forte (min 8 caratteri, maiuscole, numeri, simboli)

3. **Produzione**:
   - Usa HTTPS (reverse proxy Nginx/Apache)
   - Imposta `NODE_ENV=production`
   - Configura `FRONTEND_URL` al dominio reale
   - Backup database regolare

📖 **Guida completa**: Vedi [SECURITY.md](./SECURITY.md) per dettagli su:
- Protezioni implementate
- Monitoraggio sicurezza
- Incident response
- Best practices

## 📝 API Endpoints

### Public
- `GET /api/builds` - Lista build pubblicate
- `GET /api/builds/:slug` - Dettaglio build
- `GET /sitemap.xml` - Sitemap SEO

### Admin (require auth)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/admin/builds` - Tutte le build
- `POST /api/admin/builds` - Crea build
- `PUT /api/admin/builds/:id` - Aggiorna build
- `DELETE /api/admin/builds/:id` - Elimina build
- `POST /api/admin/upload` - Upload immagine

## 🎨 Personalizzazione

### Colori e Stile
Modifica `tailwind.config.js` per personalizzare i colori del tema.

### Amazon Affiliate Tag
Imposta `AMAZON_AFFILIATE_TAG` nel file `.env`

### Meta Tags Default
Modifica in `src/components/SEO.jsx`

## 🚀 Deploy

### Build per produzione
```bash
npm run build
```

### Hosting consigliati
- **VPS**: DigitalOcean, Linode, Hetzner
- **Platform**: Railway, Render, Fly.io
- **Shared**: Qualsiasi hosting con Node.js support

## 📈 TODO Future Features

- [ ] Integrazione API Amazon Product Advertising per prezzi real-time
- [ ] Configuratore interattivo build
- [ ] Sistema commenti
- [ ] Newsletter
- [ ] Analytics dashboard
- [ ] Multi-lingua
- [ ] Dark mode
- [ ] Comparatore build

## 📄 Licenza

MIT License - Usa liberamente per progetti personali e commerciali.

---

Creato con ❤️ per gli appassionati di PC building
