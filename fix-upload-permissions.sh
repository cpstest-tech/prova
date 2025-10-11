#!/bin/bash

echo "🔧 CORREZIONE PERMESSI UPLOAD"
echo "============================="

# Vai nella directory del progetto
cd ~/prova

echo "📁 Directory corrente: $(pwd)"

# Crea la directory uploads se non esiste
echo "📂 Creazione directory uploads..."
mkdir -p public/uploads

# Imposta i permessi corretti
echo "🔐 Impostazione permessi..."
chmod 755 public/uploads

# Cambia il proprietario
echo "👤 Cambio proprietario..."
chown -R ubuntu:ubuntu public/uploads

# Verifica i permessi
echo "✅ Verifica permessi:"
ls -la public/uploads/

# Test scrittura
echo "🧪 Test scrittura..."
echo "test" > public/uploads/test-permissions.txt
if [ -f public/uploads/test-permissions.txt ]; then
    echo "✅ Directory scrivibile"
    rm public/uploads/test-permissions.txt
else
    echo "❌ Directory non scrivibile"
fi

# Controlla il proprietario dell'intero progetto
echo "📋 Proprietario progetto:"
ls -la ~/prova/ | head -5

# Suggerimenti
echo ""
echo "🎯 PROSSIMI PASSI:"
echo "1. Riavvia il server Node.js"
echo "2. Prova di nuovo l'upload"
echo ""
echo "🔄 Per riavviare il server:"
echo "   pkill -f 'node server/index.js'"
echo "   cd ~/prova && npm start"

