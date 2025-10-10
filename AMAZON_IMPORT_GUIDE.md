# Guida Importazione Componenti da Amazon

## Panoramica

La funzionalità di importazione da Amazon permette di creare automaticamente una lista di componenti a partire da un link di carrello Amazon con link di affiliazione.

## Come Funziona

### 1. Preparazione del Link Amazon

Crea un link di carrello Amazon nel formato:
```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=XXX&Quantity.1=1&ASIN.2=YYY&Quantity.2=1...
```

**Esempio reale:**
```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1&ASIN.3=B07ZH2DLRB&Quantity.3=1&ASIN.4=B088M1YZX3&Quantity.4=1&ASIN.5=B09J8VCFWN&Quantity.5=1&ASIN.6=B09VCHR1VH&Quantity.6=1&ASIN.7=B07S1PRCKP&Quantity.7=1
```

### 2. Utilizzo nell'Editor

1. Accedi all'area admin: `/admin/builds/new` o `/admin/builds/edit/:id`
2. Nella sezione **Componenti**, clicca su **"Importa da Amazon"**
3. Incolla il link del carrello Amazon nel campo
4. Clicca su **"Importa Componenti"**
5. I componenti verranno automaticamente aggiunti alla lista

### 3. Informazioni Estratte

Per ogni prodotto Amazon, il sistema estrae:
- ✅ **Nome prodotto completo**
- ✅ **Brand/Marca**
- ✅ **Prezzo** (se disponibile)
- ✅ **Specifiche tecniche** (dalle bullet points)
- ✅ **Link Amazon affiliato**
- ✅ **Tipo componente** (CPU, GPU, RAM, etc.) - rilevato automaticamente
- ✅ **Modello** - estratto dal nome

### 4. Rilevamento Automatico Tipo Componente

Il sistema rileva automaticamente il tipo di componente basandosi su parole chiave:

| Parole Chiave | Tipo Assegnato |
|--------------|----------------|
| ryzen, intel, processor, cpu | CPU |
| rtx, gtx, radeon, rx, gpu | GPU |
| motherboard, scheda madre, b450, b550, x570 | Motherboard |
| ram, ddr4, ddr5, memoria | RAM |
| ssd, nvme, m.2, storage | Storage |
| alimentatore, power supply, psu, watt | PSU |
| case, cabinet, chassis | Case |
| cooler, dissipatore, ventola | Cooler |
| (altro) | Other |

### 5. Modifiche Post-Importazione

Dopo l'importazione, puoi:
- ✏️ Modificare qualsiasi campo dei componenti
- 🔄 Correggere il tipo di componente se non rilevato correttamente
- ➕ Aggiungere ulteriori specifiche
- 🗑️ Rimuovere componenti non desiderati

## API Endpoint

### POST `/admin/import-amazon`

**Autenticazione:** Richiesta (token JWT + ruolo admin)

**Request Body:**
```json
{
  "cartUrl": "https://www.amazon.it/gp/aws/cart/add.html?..."
}
```

**Response (Successo):**
```json
{
  "message": "Importati 7 componenti con successo",
  "components": [
    {
      "type": "CPU",
      "name": "Processore AMD Ryzen 5 5600",
      "brand": "AMD",
      "model": "Ryzen 5 5600",
      "price": 139.99,
      "amazon_link": "https://www.amazon.it/dp/B0CBCP3HN4",
      "specs": "6 Cores/12 Threads | 65W | AM4 Socket",
      "image_url": "https://m.media-amazon.com/images/..."
    },
    // ... altri componenti
  ]
}
```

**Response (Errore):**
```json
{
  "error": {
    "message": "URL del carrello Amazon mancante"
  }
}
```

## Funzioni Backend

### `extractASINsFromCartUrl(cartUrl)`
Estrae gli ASIN dall'URL del carrello.

**Parametri:**
- `cartUrl` (string): URL del carrello Amazon

**Ritorna:**
```javascript
[
  { asin: "B0CBCP3HN4", quantity: 1 },
  { asin: "B07MWGKHR9", quantity: 1 },
  // ...
]
```

### `fetchProductByASIN(asin, domain)`
Recupera i dati di un prodotto da Amazon tramite web scraping.

**Parametri:**
- `asin` (string): Amazon Standard Identification Number
- `domain` (string): Dominio Amazon (default: "amazon.it")

**Ritorna:**
```javascript
{
  asin: "B0CBCP3HN4",
  name: "Processore AMD Ryzen 5 5600",
  brand: "AMD",
  price: 139.99,
  imageUrl: "https://...",
  specs: "6 Cores/12 Threads...",
  amazonLink: "https://www.amazon.it/dp/B0CBCP3HN4"
}
```

### `importFromAmazonCart(cartUrl, domain)`
Funzione principale che gestisce l'intera importazione.

**Parametri:**
- `cartUrl` (string): URL del carrello Amazon
- `domain` (string): Dominio Amazon (default: "amazon.it")

**Ritorna:** Array di componenti pronti per essere salvati nel database

## Note Tecniche

### Rate Limiting
Il sistema include un delay di 1.5 secondi tra le richieste per evitare problemi di rate limiting da parte di Amazon.

### Gestione Errori
Se un prodotto non può essere recuperato, viene comunque aggiunto alla lista con i dati base (ASIN e link) e un messaggio di errore, permettendo la compilazione manuale.

### Domini Supportati
Il sistema supporta tutti i domini Amazon:
- amazon.it (Italia)
- amazon.com (USA)
- amazon.co.uk (UK)
- amazon.de (Germania)
- amazon.fr (Francia)
- amazon.es (Spagna)
- etc.

## Limitazioni

⚠️ **Importante:**
- Il web scraping potrebbe non funzionare sempre al 100% a causa di cambiamenti nella struttura HTML di Amazon
- Alcuni prodotti potrebbero non avere tutte le informazioni disponibili
- Il prezzo potrebbe non essere sempre disponibile (prodotti non disponibili, ecc.)
- Amazon potrebbe bloccare richieste multiple troppo rapide

## Troubleshooting

### "Impossibile recuperare i dettagli del prodotto"
- Verifica che l'ASIN sia corretto
- Controlla che il prodotto sia disponibile su Amazon
- Attendi qualche secondo e riprova

### "URL non valido"
- Assicurati che l'URL contenga `amazon.` e `cart/add`
- Verifica che gli ASIN siano nel formato corretto (`ASIN.1=XXX`)

### Componenti importati senza prezzo
- Alcuni prodotti potrebbero non avere il prezzo disponibile al momento dello scraping
- Puoi inserire manualmente il prezzo dopo l'importazione

## Esempio Completo

```javascript
// Frontend - BuildEditor.jsx
const handleAmazonImport = async () => {
  const response = await api.post('/admin/import-amazon', { 
    cartUrl: 'https://www.amazon.it/gp/aws/cart/add.html?...' 
  });
  
  const importedComponents = response.data.components;
  setComponents([...components, ...importedComponents]);
};
```

```javascript
// Backend - admin.js
router.post('/import-amazon', async (req, res) => {
  const { cartUrl } = req.body;
  const components = await importFromAmazonCart(cartUrl, 'amazon.it');
  res.json({ components });
});
```

## File Modificati

1. **server/utils/amazonParser.js** - Logica di parsing e scraping
2. **server/routes/admin.js** - Endpoint API `/admin/import-amazon`
3. **src/pages/admin/BuildEditor.jsx** - UI per l'importazione
4. **package.json** - Aggiunta dipendenza `cheerio`

## Dipendenze

- **cheerio** 1.0.0-rc.12 - Per il parsing HTML (compatibile con Node 16+)
- **axios** - Per le richieste HTTP (già presente)

## Requisiti

- **Node.js** >= 16.0.0 (testato su Node 18.18.0)

