#!/bin/bash

echo "🔧 AGGIORNAMENTO CONFIGURAZIONE NGINX PER UPLOAD"
echo "==============================================="

# Backup della configurazione attuale
echo "📋 Creazione backup configurazione attuale..."
sudo cp /etc/nginx/sites-enabled/build-pc.it /etc/nginx/sites-enabled/build-pc.it.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creato"

# Test della nuova configurazione
echo "🧪 Test della nuova configurazione..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Configurazione valida"
else
    echo "❌ Configurazione non valida, ripristino backup..."
    sudo cp /etc/nginx/sites-enabled/build-pc.it.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-enabled/build-pc.it
    exit 1
fi

# Aggiorna la configurazione
echo "📝 Aggiornamento configurazione..."
sudo cp build-pc.it-nginx-config.conf /etc/nginx/sites-enabled/build-pc.it

# Test finale
echo "🧪 Test finale configurazione..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Configurazione aggiornata con successo"
    
    # Riavvia Nginx
    echo "🔄 Riavvio Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx riavviato"
    
    # Mostra status
    echo "📊 Status Nginx:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    echo "🎉 CONFIGURAZIONE COMPLETATA!"
    echo "📝 Modifiche applicate:"
    echo "   - client_max_body_size: 50M"
    echo "   - Timeout aumentati: 300s"
    echo "   - Configurazione speciale per /api/admin/upload"
    echo "   - Buffer ottimizzati per upload"
    echo ""
    echo "🧪 Testa ora l'upload dell'immagine!"
    
else
    echo "❌ Errore nella configurazione, ripristino backup..."
    sudo cp /etc/nginx/sites-enabled/build-pc.it.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-enabled/build-pc.it
    sudo systemctl reload nginx
    exit 1
fi

