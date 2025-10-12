# 🎯 Sistema Gestione Alternative - Guida Admin

## 📋 Panoramica

Il sistema di gestione alternative permette di organizzare i componenti di ricambio in categorie e gestire le priorità di selezione per il fallback automatico dei prezzi.

## 🏗️ Struttura del Sistema

### 📂 Categorie Alternative
Le categorie raggruppano componenti simili per tipo e caratteristiche:
- **SSD NVMe 500GB** - SSD NVMe da 500GB per prestazioni elevate
- **SSD NVMe 1TB** - SSD NVMe da 1TB per prestazioni elevate
- **RAM DDR4 16GB** - Memoria DDR4 da 16GB per gaming e workstation
- **PSU 750W** - Alimentatore 750W per build high-end
- **Case Mid Tower** - Case Mid Tower per la maggior parte delle build
- E molte altre...

### 🔄 Alternative per Categoria
Ogni categoria contiene una lista di alternative ordinate per priorità:
- **Priorità 1** = Più importante (scelta per prima)
- **Priorità 2** = Secondaria
- **Priorità 3** = Terziaria
- E così via...

## 🎮 Come Usare l'Admin

### 1. **Accesso alla Sezione Alternative**
- Vai nell'admin panel
- Clicca su **"Alternative"** nel menu laterale
- Vedrai la lista delle categorie esistenti

### 2. **Gestione Categorie**

#### ➕ **Creare Nuova Categoria**
1. Clicca "**Nuova Categoria**"
2. Compila i campi:
   - **Nome**: Es. "SSD NVMe 2TB"
   - **Tipo Componente**: Seleziona da dropdown (Storage, RAM, PSU, etc.)
   - **Descrizione**: Descrizione opzionale della categoria
3. Clicca "**Salva**"

#### ✏️ **Modificare Categoria**
1. Clicca l'icona **matita** accanto alla categoria
2. Modifica i campi necessari
3. Clicca "**Salva**"

#### 🗑️ **Eliminare Categoria**
1. Clicca l'icona **cestino** accanto alla categoria
2. Conferma l'eliminazione
3. ⚠️ **Attenzione**: Verranno eliminate anche tutte le alternative della categoria

### 3. **Gestione Alternative**

#### 📂 **Selezionare Categoria**
1. Clicca su una categoria dalla lista a sinistra
2. Vedrai le alternative della categoria nel pannello principale
3. Se non ci sono alternative, vedrai un messaggio per aggiungerne una

#### ➕ **Aggiungere Nuova Alternativa**
1. Con una categoria selezionata, clicca "**Nuova Alternativa**"
2. Compila i campi:
   - **ASIN Alternativa**: Codice prodotto Amazon (es. B09ABC456)
   - **Nome Prodotto**: Nome completo del prodotto
   - **Prezzo**: Prezzo in euro (opzionale, verrà aggiornato automaticamente)
   - **Priorità**: Numero di priorità (1 = più importante)
3. Clicca "**Salva**"

#### 🔄 **Gestire Priorità**
- Usa le frecce **↑** e **↓** per cambiare l'ordine di priorità
- Le alternative con priorità più bassa vengono scelte per prime
- Il sistema di fallback userà automaticamente l'alternativa con priorità più alta disponibile

#### ✏️ **Modificare Alternativa**
1. Clicca l'icona **matita** accanto all'alternativa
2. Modifica i campi necessari
3. Clicca "**Salva**"

#### 🗑️ **Eliminare Alternativa**
1. Clicca l'icona **cestino** accanto all'alternativa
2. Conferma l'eliminazione

## 🎯 Esempi Pratici

### Esempio 1: Categoria "SSD NVMe 500GB"
```
Priorità 1: Samsung 970 EVO Plus 500GB (B09XYZ123) - €89.99
Priorità 2: WD Black SN850X 500GB (B08ABC456) - €79.99
Priorità 3: Crucial P5 Plus 500GB (B07DEF789) - €69.99
```

### Esempio 2: Categoria "RAM DDR4 16GB"
```
Priorità 1: Corsair Vengeance LPX 16GB DDR4-3200 (B09RAM001) - €65.99
Priorità 2: G.Skill Ripjaws V 16GB DDR4-3200 (B08RAM002) - €59.99
Priorità 3: Crucial Ballistix 16GB DDR4-3200 (B07RAM003) - €54.99
```

## 🔄 Come Funziona il Fallback

### 1. **Ricerca Prezzo Originale**
Il sistema cerca prima il prezzo del componente originale usando:
- Keepa Pubblica
- CamelCamelCamel
- Amazon Parser

### 2. **Fallback per Categoria**
Se il prezzo originale non è disponibile:
1. Il sistema identifica il tipo di componente
2. Cerca una categoria corrispondente
3. Seleziona l'alternativa con priorità più alta che ha prezzo disponibile
4. Usa il prezzo dell'alternativa come fallback

### 3. **Fallback Generico**
Se non trova alternative per categoria:
1. Cerca componenti simili dello stesso tipo
2. Seleziona quello con prezzo più basso
3. Usa il suo prezzo come fallback

## 📊 Statistiche e Monitoraggio

### Dashboard Alternative
- **Totale categorie**: Numero di categorie create
- **Totale alternative**: Numero di alternative configurate
- **Alternative con prezzi**: Quante hanno prezzo aggiornato
- **Alternative senza prezzi**: Quante necessitano aggiornamento

### API Disponibili
```http
# Lista categorie
GET /api/admin/alternative-categories

# Dettagli categoria con alternative
GET /api/admin/alternative-categories/:id

# Crea categoria
POST /api/admin/alternative-categories

# Modifica categoria
PUT /api/admin/alternative-categories/:id

# Elimina categoria
DELETE /api/admin/alternative-categories/:id

# Lista alternative per categoria
GET /api/admin/alternative-categories/:id/alternatives

# Aggiungi alternativa a categoria
POST /api/admin/alternative-categories/:id/alternatives

# Modifica alternativa
PUT /api/admin/alternatives/:id

# Elimina alternativa
DELETE /api/admin/alternatives/:id
```

## 🎯 Best Practices

### 1. **Organizzazione Categorie**
- Usa nomi descrittivi e specifici
- Raggruppa componenti con caratteristiche simili
- Assegna il tipo di componente corretto

### 2. **Gestione Priorità**
- Priorità 1: Prodotti premium/più affidabili
- Priorità 2: Prodotti di buona qualità/prezzo
- Priorità 3+: Alternative economiche/fallback

### 3. **Aggiornamento Prezzi**
- Aggiorna periodicamente i prezzi delle alternative
- Usa l'API per aggiornamento automatico
- Monitora la disponibilità dei prodotti

### 4. **Manutenzione**
- Rimuovi alternative non più disponibili
- Aggiorna ASIN quando i prodotti cambiano
- Verifica regolarmente che le priorità siano corrette

## 🚀 Prossimi Passi

1. **Configura le prime categorie** con i componenti più comuni
2. **Aggiungi alternative** per ogni categoria in ordine di priorità
3. **Testa il sistema** aggiornando i prezzi di una build
4. **Monitora i fallback** per ottimizzare le alternative
5. **Espandi gradualmente** le categorie man mano che servono

Il sistema è progettato per essere flessibile e facile da usare, permettendo una gestione efficiente delle alternative per garantire sempre prezzi aggiornati sui componenti! 🎉
