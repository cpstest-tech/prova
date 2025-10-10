# Guida Affiliate Amazon - Link Affiliati Automatici

## 🎯 Panoramica

Sistema completo per gestire automaticamente i link affiliati Amazon durante l'importazione e la pubblicazione degli articoli.

## ✨ Funzionalità Implementate

### 1. **Import da Carrello con Affiliate Tag** 🛒

Quando importi componenti da un carrello Amazon, il sistema:
- ✅ Estrae automaticamente l'**affiliate tag** dal link del carrello
- ✅ Aggiunge il tag affiliato a **tutti i link dei prodotti** importati
- ✅ Salva l'affiliate tag nella build per uso futuro

**Esempio di link carrello:**
```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=B0CBCP3HN4&Quantity.1=1&ASIN.2=B07MWGKHR9&Quantity.2=1
```

Il sistema estrae `cpstest05-21` e lo applica a tutti i prodotti:
- `https://www.amazon.it/dp/B0CBCP3HN4?tag=cpstest05-21`
- `https://www.amazon.it/dp/B07MWGKHR9?tag=cpstest05-21`

### 2. **Generazione Carrello "Compra Tutto"** 🛍️

Quando pubblichi un articolo, il sistema genera automaticamente:
- Un link "**Compra Tutto su Amazon**" con tutti i componenti
- Il carrello include l'**affiliate tag** salvato nella build
- Gli utenti possono aggiungere tutti i componenti al carrello con un click

**Il link generato include:**
```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=cpstest05-21&ASIN.1=XXX&Quantity.1=1&ASIN.2=YYY&Quantity.2=1...
```

### 3. **Gestione Affiliate Tag nell'Editor** ⚙️

Nell'editor delle build è stato aggiunto:
- Campo "**Affiliate Tag**" nella sezione Amazon Affiliate
- Il tag viene salvato automaticamente durante l'import
- Può essere modificato manualmente in qualsiasi momento
- Viene applicato a tutti i link generati

### 4. **Genera Carrello nell'Admin** 📋

Nuova funzionalità nell'editor:
- Pulsante "**Genera Carrello**" per creare il link prima di pubblicare
- Copia automaticamente il link negli appunti
- Mostra numero di componenti e affiliate tag usato
- Permette di testare il carrello prima della pubblicazione

## 📝 Come Usare

### Workflow Completo

#### 1. Crea Link Carrello Amazon con Affiliate

```
https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=TUO-TAG-21&ASIN.1=XXX&Quantity.1=1&ASIN.2=YYY&Quantity.2=1
```

#### 2. Importa nell'Editor

1. Vai su `/admin/builds/new` o `/admin/builds/edit/:id`
2. Clicca su "**Importa da Amazon**"
3. Incolla il link del carrello
4. Clicca "**Importa Componenti**"

**Risultato:**
- ✅ Componenti importati con tutti i dati
- ✅ Link affiliati aggiunti automaticamente
- ✅ Affiliate tag salvato nella build

#### 3. Verifica il Carrello (Opzionale)

1. Clicca su "**Genera Carrello**" nella sezione Componenti
2. Il link viene copiato negli appunti
3. Testa il link per verificare che funzioni

#### 4. Pubblica l'Articolo

1. Compila tutti i campi (titolo, descrizione, ecc.)
2. Cambia lo stato in "**Pubblicato**"
3. Salva la build

**Risultato:**
- ✅ Articolo pubblicato con link affiliati su ogni componente
- ✅ Pulsante "Compra Tutto" generato automaticamente
- ✅ Carrello Amazon con tutti gli ASIN e affiliate tag

## 🔧 Dettagli Tecnici

### Database

Aggiunto campo `affiliate_tag` alla tabella `builds`:

```sql
ALTER TABLE builds ADD COLUMN affiliate_tag TEXT;
```

### API Changes

**POST `/admin/import-amazon`** - Response aggiornata:
```json
{
  "message": "Importati N componenti con successo",
  "components": [...],
  "affiliateTag": "cpstest05-21"
}
```

**POST `/admin/builds`** - Request aggiornata:
```json
{
  "title": "...",
  "description": "...",
  "affiliate_tag": "cpstest05-21",
  "components": [...]
}
```

### Funzioni Modificate

#### `server/utils/amazonParser.js`

```javascript
// Estrae ASIN e affiliate tag dal carrello
export function extractASINsFromCartUrl(cartUrl) {
  // ... estrae AssociateTag dal URL
  return { asins, affiliateTag };
}

// Aggiunge affiliate tag ai link dei prodotti
export async function fetchProductByASIN(asin, domain, affiliateTag) {
  // ... costruisce link con ?tag=affiliateTag
  return { amazonLink: `${url}?tag=${affiliateTag}` };
}

// Ritorna componenti e affiliate tag
export async function importFromAmazonCart(cartUrl, domain) {
  // ...
  return { components, affiliateTag };
}
```

#### `src/pages/BuildDetail.jsx`

```javascript
// Genera carrello con affiliate tag della build
const generateBuyAllLink = () => {
  const associateTag = build.affiliate_tag || 'cpstest05-21';
  // ... genera URL con AssociateTag
  return cartUrl;
};
```

#### `src/pages/admin/BuildEditor.jsx`

```javascript
// Genera e copia link carrello
const generateAmazonCartLink = () => {
  const associateTag = formData.affiliate_tag || 'cpstest05-21';
  // ... genera URL carrello
  navigator.clipboard.writeText(cartUrl);
};
```

## 🔍 Estrazione ASIN

Il sistema supporta diversi formati di URL Amazon:

```javascript
// Formati supportati:
https://www.amazon.it/dp/B0CBCP3HN4
https://www.amazon.it/gp/product/B0CBCP3HN4
https://www.amazon.it/dp/B0CBCP3HN4?tag=xxx
https://www.amazon.it/...?asin=B0CBCP3HN4
```

Regex usata:
```javascript
/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|[?&]asin=([A-Z0-9]{10})/i
```

## 🎨 UI/UX

### Nell'Editor Admin

1. **Sezione "Amazon Affiliate"**
   - Campo per inserire/modificare l'affiliate tag
   - Messaggio informativo sull'uso del tag
   - Aggiornamento automatico durante l'import

2. **Sezione "Componenti"**
   - Pulsante "Genera Carrello" (copia negli appunti)
   - Pulsante "Importa da Amazon"
   - Pulsante "Aggiungi Componente"

3. **Modale Import Amazon**
   - Campo per URL carrello
   - Istruzioni d'uso
   - Feedback con affiliate tag trovato

### Nel Frontend

1. **Dettaglio Build**
   - Link "Acquista" su ogni componente (con affiliate tag)
   - Pulsante "Compra Tutto su Amazon" (se ci sono componenti)
   - Disclaimer link affiliati

2. **Link Affiliati**
   - Ogni componente ha il proprio link affiliato
   - Il carrello "Compra Tutto" usa lo stesso affiliate tag
   - rel="noopener noreferrer nofollow" per SEO

## 📊 Vantaggi

✅ **Automatizzazione Completa**
- Nessun copia-incolla manuale di link
- Affiliate tag applicato automaticamente
- Carrello generato automaticamente alla pubblicazione

✅ **Flessibilità**
- Affiliate tag modificabile in qualsiasi momento
- Supporto per diversi tag affiliati per build diverse
- Fallback a tag di default se non specificato

✅ **User Experience**
- Importazione veloce da carrelli esistenti
- Pulsante "Compra Tutto" per gli utenti
- Copia link carrello per condivisione

✅ **Monetizzazione**
- Link affiliati su tutti i componenti
- Carrello completo affiliato
- Tracciamento tramite affiliate tag

## 🚀 Esempi d'Uso

### Caso 1: Import da Carrello Esistente

```
Input: https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=myshop-21&ASIN.1=XXX&ASIN.2=YYY

Output (automatico):
- Componenti importati
- Link affiliati: amazon.it/dp/XXX?tag=myshop-21
- Build affiliate_tag: "myshop-21"
- Carrello "Compra Tutto" con tag "myshop-21"
```

### Caso 2: Build Manuale + Affiliate

```
1. Crea build manualmente
2. Aggiungi componenti con link Amazon normali
3. Imposta affiliate_tag = "myshop-21"
4. Pubblica

Output:
- Link affiliati NON modificati (già impostati)
- Carrello "Compra Tutto" con tag "myshop-21"
```

### Caso 3: Genera Carrello per Marketing

```
1. Crea build con componenti
2. Imposta affiliate_tag
3. Clicca "Genera Carrello"
4. Usa link per campagne marketing/social

Output:
- Link carrello copiato negli appunti
- Condivisibile prima della pubblicazione
```

## ⚡ Performance

- Import ritardato di 1.5s tra prodotti (evita rate limiting Amazon)
- Generazione carrello istantanea (client-side)
- Nessun overhead sul database (solo un campo TEXT)

## 🔒 Sicurezza

- Validazione URL carrello lato server
- Sanitizzazione parametri ASIN
- rel="nofollow" sui link esterni
- Escape XSS su affiliate tag

## 🐛 Troubleshooting

### Affiliate tag non viene salvato
➡️ Verifica che il link carrello contenga `AssociateTag=` o `tag=`

### Carrello "Compra Tutto" non appare
➡️ Verifica che i componenti abbiano `amazon_link` validi
➡️ Controlla che gli ASIN siano estratti correttamente

### Link affiliato non funziona
➡️ Verifica formato: `?tag=XXX` (Amazon.it usa `tag`, non `AssociateTag`)
➡️ Controlla che l'affiliate tag sia valido su Amazon Associates

### Import fallisce
➡️ Verifica formato URL carrello
➡️ Controlla che ci siano ASIN nel URL
➡️ Attendi tra import successivi (rate limiting)

## 📋 Checklist Pubblicazione

Prima di pubblicare una build:

- [ ] Componenti importati o aggiunti
- [ ] Affiliate tag impostato (o usa default)
- [ ] Link Amazon su tutti i componenti
- [ ] Testato "Genera Carrello" nell'admin
- [ ] Verificato link affiliati nei componenti
- [ ] Status = "Pubblicato"
- [ ] ✅ Build pubblicata con link affiliati funzionanti!

## 🎉 Risultato Finale

**Quando pubblichi un articolo:**
1. ✅ Ogni componente ha il link affiliato Amazon
2. ✅ Pulsante "Compra Tutto" con carrello affiliato
3. ✅ Disclaimer link affiliati per trasparenza
4. ✅ Monetizzazione automatica su tutti i click Amazon

**Tutto automatico, nessuna configurazione manuale!** 🚀


