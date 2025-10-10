# Test Importazione Amazon

## Test URL Parsing

Il sistema può estrarre correttamente gli ASIN dal tuo URL:

```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1&ASIN.3=B07ZH2DLRB&Quantity.3=1&ASIN.4=B088M1YZX3&Quantity.4=1&ASIN.5=B09J8VCFWN&Quantity.5=1&ASIN.6=B09VCHR1VH&Quantity.6=1&ASIN.7=B07S1PRCKP&Quantity.7=1
```

### ASIN Estratti:

1. **B0CBCP3HN4** - Probabilmente CPU AMD Ryzen 5 5600
2. **B07MWGKHR9** - Probabilmente Cooler Master PSU
3. **B07ZH2DLRB** - Probabilmente SSD NVMe
4. **B088M1YZX3** - Probabilmente RAM DDR4
5. **B09J8VCFWN** - Probabilmente GPU AMD RX 6600
6. **B09VCHR1VH** - Probabilmente Scheda Madre
7. **B07S1PRCKP** - Probabilmente Case PC

## Come Testare Manualmente

### 1. Avvia il Server

```bash
npm run dev
```

### 2. Accedi all'Area Admin

1. Vai su `http://localhost:5173/admin/login`
2. Accedi con le credenziali admin
3. Naviga su "Builds" → "Nuova Build"

### 3. Usa la Funzione Import

1. Scorri fino alla sezione **Componenti**
2. Clicca sul pulsante **"Importa da Amazon"** (icona carrello)
3. Incolla il link del carrello Amazon
4. Clicca **"Importa Componenti"**
5. Attendi il completamento (può richiedere 10-15 secondi per 7 prodotti)

### 4. Verifica Risultati

Dovresti vedere 7 componenti importati con:
- Nome prodotto
- Brand
- Prezzo (se disponibile)
- Tipo (rilevato automaticamente)
- Link Amazon
- Specifiche

## Test API Diretta (con cURL)

Se hai già il token di autenticazione:

```bash
curl -X POST http://localhost:5000/admin/import-amazon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"cartUrl":"https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1&ASIN.3=B07ZH2DLRB&Quantity.3=1&ASIN.4=B088M1YZX3&Quantity.4=1&ASIN.5=B09J8VCFWN&Quantity.5=1&ASIN.6=B09VCHR1VH&Quantity.6=1&ASIN.7=B07S1PRCKP&Quantity.7=1"}'
```

## Test con Postman

1. **Endpoint:** `POST http://localhost:5000/admin/import-amazon`
2. **Headers:**
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
3. **Body (raw JSON):**
```json
{
  "cartUrl": "https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1&ASIN.3=B07ZH2DLRB&Quantity.3=1&ASIN.4=B088M1YZX3&Quantity.4=1&ASIN.5=B09J8VCFWN&Quantity.5=1&ASIN.6=B09VCHR1VH&Quantity.6=1&ASIN.7=B07S1PRCKP&Quantity.7=1"
}
```

## Risultato Atteso

```json
{
  "message": "Importati 7 componenti con successo",
  "components": [
    {
      "type": "CPU",
      "name": "Processore AMD Ryzen 5 5600 ( 6 Cores/12 Threads, 65W, AM4 Socket, Boost di Frequenza fino a 4.4 Ghz max, dissipatore ad aria\"Wraith stealth cooler\")",
      "brand": "AMD",
      "model": "Ryzen 5 5600 ( 6 Cores/12 Threads, 65W...",
      "price": 139.99,
      "amazon_link": "https://www.amazon.it/dp/B0CBCP3HN4",
      "specs": "6 Core | 12 Thread | 65W TDP | AM4",
      "image_url": "https://m.media-amazon.com/images/..."
    },
    // ... altri 6 componenti
  ]
}
```

## Note sul Test

### ✅ Compatibilità Node 18

Il progetto usa **cheerio 1.0.0-rc.12** che è completamente compatibile con Node 18.18.0.

**Versioni supportate:**
- ✅ Node 16.x
- ✅ Node 18.x (testato)
- ✅ Node 20.x

### Possibili Problemi

1. **Amazon Rate Limiting**
   - Se fai troppe richieste rapidamente, Amazon potrebbe bloccarti temporaneamente
   - Soluzione: Aspetta qualche minuto e riprova

2. **Prodotti Non Disponibili**
   - Alcuni ASIN potrebbero non essere più disponibili
   - Il sistema importerà comunque il componente con dati base

3. **Prezzi Mancanti**
   - Amazon nasconde a volte i prezzi agli scraper
   - Puoi inserire manualmente il prezzo dopo l'importazione

## Verifica Funzionalità Base

Puoi verificare che il parsing URL funzioni creando un semplice test:

```javascript
// test-parser.js
const url = 'https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1';

const urlObj = new URL(url);
const params = urlObj.searchParams;
const asins = [];

let index = 1;
while (params.has(`ASIN.${index}`)) {
  asins.push({
    asin: params.get(`ASIN.${index}`),
    quantity: parseInt(params.get(`Quantity.${index}`) || '1')
  });
  index++;
}

console.log('ASIN trovati:', asins);
// Output: ASIN trovati: [ { asin: 'B0CBCP3HN4', quantity: 1 }, { asin: 'B07MWGKHR9', quantity: 1 } ]
```

## Link Utili

- [Amazon Product Advertising API](https://webservices.amazon.it/paapi5/documentation/)
- [Guida Link di Affiliazione Amazon](https://programma-affiliazione.amazon.it/)
- [Documentazione Cheerio](https://cheerio.js.org/)

