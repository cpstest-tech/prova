# 🔒 Guida alla Sicurezza - Build PC CMS

## 📋 Indice

1. [Protezioni Implementate](#protezioni-implementate)
2. [Configurazione Sicurezza](#configurazione-sicurezza)
3. [Best Practices](#best-practices)
4. [Monitoraggio](#monitoraggio)
5. [Incident Response](#incident-response)

---

## 🛡️ Protezioni Implementate

### 1. **Protezione Anti Brute-Force**

Il sistema implementa una protezione multilivello contro attacchi brute-force:

- **Rate Limiting Login**: Max 5 tentativi di login ogni 15 minuti per IP/username
- **Account Locking**: Blocco temporaneo (1 ora) dopo 10 tentativi falliti
- **IP Tracking**: Monitoraggio e logging di tutti i tentativi di accesso
- **Logging Completo**: Registrazione di tutti i tentativi di login (riusciti e falliti)

#### Come Funziona

```javascript
// Il rate limiter blocca dopo 5 tentativi in 15 minuti
loginRateLimiter: max 5 requests per 15 minuti

// L'account lock scatta dopo 10 tentativi falliti in 1 ora
isAccountLocked(): controlla tentativi falliti nell'ultima ora
```

### 2. **Protezione SQL Injection**

✅ **Prepared Statements Ovunque**
- Tutti i model utilizzano prepared statements di better-sqlite3
- Nessuna concatenazione di stringhe SQL con input utente
- Validazione parametri prima dell'esecuzione query

```javascript
// SICURO ✅
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
const user = stmt.get(username);

// PERICOLOSO ❌ (NON usato nel progetto)
const query = `SELECT * FROM users WHERE username = '${username}'`;
```

### 3. **Protezione XSS (Cross-Site Scripting)**

- **Sanitizzazione Input**: Tutti i body delle richieste vengono sanitizzati
- **Content Security Policy (CSP)**: Headers configurati per bloccare script non autorizzati
- **HTML Encoding**: Rimozione automatica di tag script e iframe pericolosi

```javascript
// Input sanitizzato automaticamente
sanitizeInput(input):
  - Rimuove <script> tags
  - Rimuove <iframe> tags
  - Rimuove javascript: URLs
  - Rimuove event handlers (onclick, onerror, etc.)
```

### 4. **Validazione Password Forte**

Le password devono soddisfare questi requisiti:

- ✅ Minimo 8 caratteri
- ✅ Almeno una lettera maiuscola (A-Z)
- ✅ Almeno una lettera minuscola (a-z)
- ✅ Almeno un numero (0-9)
- ✅ Almeno un carattere speciale (!@#$%^&*...)

### 5. **File Upload Sicuro**

- **Whitelist Estensioni**: Solo .jpg, .jpeg, .png, .gif, .webp
- **Verifica MIME Type**: Doppio controllo estensione + MIME type
- **Limite Dimensione**: Max 5MB per file (configurabile)
- **Sanitizzazione Nome**: Rimozione caratteri pericolosi dal nome file
- **Limite Quantità**: Max 1 file per upload

### 6. **Security Headers (Helmet)**

Headers di sicurezza implementati:

- **HSTS**: Force HTTPS (in produzione)
- **X-Frame-Options**: Previene clickjacking (DENY)
- **X-Content-Type-Options**: Previene MIME sniffing (nosniff)
- **X-XSS-Protection**: Protezione XSS browser
- **Referrer-Policy**: strict-origin-when-cross-origin
- **CSP**: Content Security Policy completa

### 7. **Rate Limiting Generale**

- **API Generale**: Max 200 richieste ogni 15 minuti per IP
- **Login Endpoint**: Max 5 tentativi ogni 15 minuti
- **Change Password**: Max 3 tentativi ogni 15 minuti

### 8. **CORS Configurato Correttamente**

- Origin whitelist (solo domini autorizzati)
- Methods limitati (GET, POST, PUT, DELETE)
- Headers controllati (Content-Type, Authorization)
- Credentials abilitati solo per domini fidati

---

## ⚙️ Configurazione Sicurezza

### 1. Setup Iniziale

1. **Copia il file di configurazione**:
   ```bash
   cp env.example .env
   ```

2. **Genera JWT_SECRET sicuro**:
   ```bash
   # Con Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Con OpenSSL
   openssl rand -hex 64
   ```

3. **Configura .env**:
   ```env
   JWT_SECRET=TUO_SECRET_GENERATO_QUI_64_CARATTERI_MINIMO
   NODE_ENV=production
   FRONTEND_URL=https://tuodominio.com
   ```

### 2. Primo Accesso Admin

1. **Cambia password default immediatamente**:
   - Login con credenziali iniziali
   - Vai su "Cambia Password"
   - Usa una password forte (vedi requisiti sopra)

2. **Disabilita utenti non necessari**:
   - Mantieni solo gli admin necessari
   - Rimuovi account di test

### 3. Configurazione Database

Il database SQLite è automaticamente protetto:
- File permissions: 600 (solo owner read/write)
- Location: `server/database/buildpc.db`
- Backup automatico consigliato

---

## 🔐 Best Practices

### Per Sviluppatori

1. **Mai committare .env su Git**
   - File già in .gitignore
   - Usa env.example per template

2. **Valida sempre gli input**
   - Usa sanitizeInput per stringhe
   - Valida tipi e range per numeri
   - Usa prepared statements per DB

3. **Usa HTTPS in produzione**
   ```nginx
   # Esempio configurazione Nginx
   server {
       listen 443 ssl http2;
       server_name tuodominio.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

4. **Aggiorna dipendenze regolarmente**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

### Per Admin/Utenti

1. **Password Forte Obbligatoria**
   - ✅ `MyP@ssw0rd2024!` (BUONA)
   - ❌ `password123` (DEBOLE)

2. **Logout dopo l'uso**
   - Token scade dopo 7 giorni
   - Logout manuale consigliato

3. **Non condividere credenziali**
   - Crea account separati per ogni admin
   - Usa password manager

4. **Controlla upload file**
   - Solo immagini legittime
   - Verifica dimensioni ragionevoli

---

## 📊 Monitoraggio

### Log di Sicurezza

Tutti i tentativi di login sono registrati in `login_attempts`:

```sql
-- Visualizza ultimi tentativi falliti
SELECT * FROM login_attempts 
WHERE success = 0 
ORDER BY attempted_at DESC 
LIMIT 50;

-- Account con più tentativi falliti
SELECT username, COUNT(*) as attempts 
FROM login_attempts 
WHERE success = 0 
  AND attempted_at > datetime('now', '-24 hours')
GROUP BY username 
ORDER BY attempts DESC;

-- IP sospetti
SELECT ip_address, COUNT(*) as attempts 
FROM login_attempts 
WHERE success = 0 
  AND attempted_at > datetime('now', '-1 hour')
GROUP BY ip_address 
HAVING attempts > 5;
```

### Pulizia Log (Consigliata)

```sql
-- Elimina log più vecchi di 90 giorni
DELETE FROM login_attempts 
WHERE attempted_at < datetime('now', '-90 days');
```

### Metriche da Monitorare

1. **Tentativi login falliti** (soglia: >10/ora per IP)
2. **Account bloccati** (controlla frequenza)
3. **Errori 429** (rate limit superato)
4. **Upload falliti** (possibili tentativi malicious file)

---

## 🚨 Incident Response

### Se Rilevi Attacco Brute-Force

1. **Blocca IP attaccante** (firewall/nginx):
   ```bash
   # Blocco temporaneo con iptables
   sudo iptables -A INPUT -s IP_ATTACCANTE -j DROP
   ```

2. **Controlla log**:
   ```sql
   SELECT * FROM login_attempts 
   WHERE ip_address = 'IP_ATTACCANTE'
   ORDER BY attempted_at DESC;
   ```

3. **Resetta account se compromesso**:
   ```sql
   -- Forza cambio password al prossimo login
   UPDATE users SET password_hash = '...' WHERE username = '...';
   ```

### Se Rilevi SQL Injection

1. **Identifica query vulnerabile** (controlla log errori)
2. **Verifica prepared statements** usati ovunque
3. **Sanitizza input** non validato
4. **Aggiorna database** se compromesso

### Se Rilevi XSS

1. **Identifica campo vulnerabile**
2. **Verifica sanitizzazione** input
3. **Aggiorna CSP headers** se necessario
4. **Pulisci dati** già inseriti:
   ```sql
   UPDATE builds SET content = REPLACE(content, '<script>', '');
   ```

---

## 🔄 Aggiornamenti Sicurezza

### Checklist Mensile

- [ ] Aggiorna dipendenze npm (`npm update`)
- [ ] Esegui audit sicurezza (`npm audit`)
- [ ] Controlla log tentativi falliti
- [ ] Pulisci log vecchi (>90 giorni)
- [ ] Verifica backup database funzionanti
- [ ] Testa restore da backup

### Checklist Settimanale

- [ ] Monitora tentativi login falliti
- [ ] Controlla upload file sospetti
- [ ] Verifica rate limiting efficace
- [ ] Controlla errori server log

---

## 📞 Contatti Sicurezza

Per segnalare vulnerabilità di sicurezza:
- Email: [inserire email sicurezza]
- PGP Key: [inserire chiave se disponibile]

**NON pubblicare vulnerabilità pubblicamente** prima di averle segnalate.

---

## 📚 Risorse Aggiuntive

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

**Ultimo aggiornamento**: Ottobre 2024  
**Versione**: 1.0.0

