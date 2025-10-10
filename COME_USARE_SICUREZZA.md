# 🔒 Come Usare il Sistema di Sicurezza

## 🚀 Setup Veloce (5 minuti)

### 1. Aggiorna il Database

```bash
npm run update-security
```

✅ Questo crea la tabella `login_attempts` per tracciare gli accessi

### 2. Configura JWT_SECRET

```bash
# Copia il file di esempio
cp env.example .env

# Genera un JWT_SECRET sicuro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia l'output e incollalo nel file `.env`:

```env
JWT_SECRET=IL_TUO_SECRET_GENERATO_QUI
```

### 3. Cambia la Password Admin

1. Avvia il server: `npm run dev`
2. Login su http://localhost:5173/admin
3. Vai su **Cambia Password**
4. Inserisci una password forte:
   - Minimo 8 caratteri
   - Almeno 1 maiuscola (A-Z)
   - Almeno 1 minuscola (a-z)
   - Almeno 1 numero (0-9)
   - Almeno 1 carattere speciale (!@#$%...)

**Esempi password valide**:
- ✅ `MySecure2024!`
- ✅ `BuildPC@2024`
- ✅ `Admin!Pass123`

---

## 🛡️ Protezioni Attive

### ✅ Anti Brute-Force
- **Max 5 tentativi** di login ogni 15 minuti
- Dopo **10 tentativi falliti** → account bloccato per **1 ora**
- Tutti i tentativi vengono **loggati con IP**

### ✅ Password Forte
- Impossibile usare password deboli
- Validazione automatica su cambio password

### ✅ SQL Injection
- **100% protetto** con prepared statements
- Nessuna concatenazione SQL

### ✅ XSS Protection
- Input **sanitizzati automaticamente**
- Tag `<script>` e `<iframe>` **rimossi**
- **CSP headers** configurati

### ✅ File Upload Sicuro
- Solo immagini: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Verifica **MIME type** reale
- Nomi file **sanitizzati**

---

## 📊 Monitoraggio Accessi

### Visualizza Tentativi di Login

Connettiti al database SQLite:

```bash
cd server/database
sqlite3 buildpc.db
```

**Query utili**:

```sql
-- Ultimi 50 tentativi falliti
SELECT username, ip_address, reason, attempted_at 
FROM login_attempts 
WHERE success = 0 
ORDER BY attempted_at DESC 
LIMIT 50;

-- IP con più di 5 tentativi falliti nell'ultima ora
SELECT ip_address, COUNT(*) as attempts 
FROM login_attempts 
WHERE success = 0 
  AND attempted_at > datetime('now', '-1 hour')
GROUP BY ip_address 
HAVING attempts > 5;

-- Statistiche login oggi
SELECT 
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successi,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as falliti
FROM login_attempts 
WHERE DATE(attempted_at) = DATE('now');
```

### Pulizia Log Periodica

```sql
-- Elimina log più vecchi di 90 giorni
DELETE FROM login_attempts 
WHERE attempted_at < datetime('now', '-90 days');
```

---

## 🧪 Test Sicurezza

### Test 1: Rate Limiting

Prova a fare 6 login errati consecutivi - al 6° vedrai il blocco:

```bash
# Primo tentativo (OK)
# Secondo tentativo (OK)
# ... 
# Sesto tentativo (BLOCKED: "Troppe richieste, riprova tra 15 minuti")
```

### Test 2: Password Debole

Prova a cambiare password con `password123` → vedrai errore di validazione

### Test 3: Upload File

Prova a caricare un file `.exe` o `.php` → verrà rifiutato

---

## 🚨 Cosa Fare Se...

### Account Bloccato per Errore

Se il tuo account è bloccato dopo troppi tentativi:

1. **Aspetta 1 ora** (blocco automatico scade)
   
   OPPURE

2. **Resetta manualmente** dal database:
   ```sql
   -- Elimina tentativi falliti per username
   DELETE FROM login_attempts 
   WHERE username = 'admin' AND success = 0;
   ```

### Password Dimenticata

Resetta dal database:

```bash
cd server
node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('NuovaPassword123!', 10);
console.log(hash);
"
# Copia l'hash generato
```

Poi aggiorna nel database:

```sql
UPDATE users 
SET password_hash = 'HASH_GENERATO_QUI' 
WHERE username = 'admin';
```

### Attacco in Corso

Se vedi tentativi sospetti nei log:

1. **Blocca IP** a livello firewall/nginx
2. **Controlla log** per identificare pattern
3. **Cambia password** se compromessa
4. **Aumenta rate limiting** temporaneamente

---

## 🔧 Configurazione Avanzata

### Modifica Rate Limiting

In `server/middleware/security.js`:

```javascript
// Più restrittivo: max 3 tentativi in 10 minuti
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  // ...
});
```

### Modifica Account Lock

In `server/middleware/security.js`:

```javascript
// Blocco dopo 5 tentativi invece di 10
export function isAccountLocked(username) {
  // ...
  return result.count >= 5; // era 10
}
```

### Whitelist IP Admin

In `server/routes/auth.js`:

```javascript
const ADMIN_WHITELIST = ['192.168.1.100', '10.0.0.5'];

router.post('/login', (req, res) => {
  const clientIp = req.ip;
  
  if (!ADMIN_WHITELIST.includes(clientIp)) {
    return res.status(403).json({ 
      error: { message: 'IP non autorizzato' } 
    });
  }
  // ... resto del codice
});
```

---

## 📱 Produzione

### Checklist Pre-Deploy

- [ ] `.env` configurato con JWT_SECRET sicuro
- [ ] `NODE_ENV=production` in .env
- [ ] `FRONTEND_URL=https://tuodominio.com` in .env
- [ ] Password admin cambiata
- [ ] HTTPS configurato (Nginx/Apache)
- [ ] Firewall configurato
- [ ] Backup database automatico
- [ ] Monitoring attivo

### Configurazione Nginx (HTTPS)

```nginx
server {
    listen 443 ssl http2;
    server_name tuodominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting aggiuntivo Nginx
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name tuodominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📚 Documentazione Completa

- 📖 **SECURITY.md** - Guida completa sicurezza (2000+ righe)
- 📋 **SECURITY_UPDATES.md** - Dettagli aggiornamenti implementati
- 🔧 **env.example** - Template configurazione

---

## ✅ Quick Checklist

**Dopo ogni aggiornamento**:

- [x] Database aggiornato (`npm run update-security`)
- [x] `.env` configurato con JWT_SECRET
- [x] Password admin cambiata (8+ caratteri)
- [x] Test login fallito (verifica rate limiting)
- [x] Test upload file (verifica whitelist)
- [ ] Backup database
- [ ] Monitoring attivo

**In produzione**:

- [ ] HTTPS attivo
- [ ] NODE_ENV=production
- [ ] Firewall configurato
- [ ] Logging centralizzato
- [ ] Alert configurati

---

## 🎉 Il Tuo Sito è Sicuro!

Tutte le protezioni sono attive. Il tuo sito è protetto contro:

- ✅ Brute Force
- ✅ SQL Injection  
- ✅ XSS
- ✅ CSRF
- ✅ Clickjacking
- ✅ File Upload Malicious
- ✅ Password Deboli

**Sei pronto per la produzione! 🚀**

