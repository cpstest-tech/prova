#!/bin/bash

echo "🔧 Installazione Chromium per Puppeteer..."

# Aggiorna il sistema
echo "📦 Aggiornamento pacchetti..."
sudo apt-get update

# Installa Chromium
echo "🌐 Installazione Chromium..."
sudo apt-get install -y chromium-browser

# Verifica installazione
echo "✅ Verifica installazione..."
if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium installato correttamente"
    chromium-browser --version
else
    echo "❌ Errore nell'installazione di Chromium"
    exit 1
fi

# Installa dipendenze Node.js
echo "📦 Installazione dipendenze Node.js..."
npm install puppeteer node-cron

echo "🎉 Installazione completata!"
echo "Ora puoi eseguire: npm run test-substitution-simple"
