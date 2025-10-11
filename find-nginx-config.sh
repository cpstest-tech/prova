#!/bin/bash

echo "🔍 CERCA CONFIGURAZIONE NGINX SU AWS EC2"
echo "=========================================="

# Controlla se Nginx è installato
if command -v nginx &> /dev/null; then
    echo "✅ Nginx è installato"
    
    # Mostra versione
    echo "📋 Versione Nginx:"
    nginx -v
    
    # Mostra configurazione principale
    echo -e "\n📁 File configurazione principale:"
    nginx -T 2>/dev/null | head -20 || echo "Impossibile leggere configurazione"
    
    # Trova file di configurazione
    echo -e "\n📂 Directory configurazione:"
    echo "Configurazione principale: $(nginx -T 2>/dev/null | grep 'configuration file' | cut -d' ' -f4 || echo 'Non trovata')"
    
    # Controlla directory comuni
    echo -e "\n🔍 Controllo directory comuni:"
    
    if [ -d "/etc/nginx" ]; then
        echo "✅ /etc/nginx/ esiste"
        ls -la /etc/nginx/
    fi
    
    if [ -d "/etc/nginx/sites-available" ]; then
        echo -e "\n✅ /etc/nginx/sites-available/ esiste"
        ls -la /etc/nginx/sites-available/
    fi
    
    if [ -d "/etc/nginx/sites-enabled" ]; then
        echo -e "\n✅ /etc/nginx/sites-enabled/ esiste"
        ls -la /etc/nginx/sites-enabled/
    fi
    
    if [ -d "/etc/nginx/conf.d" ]; then
        echo -e "\n✅ /etc/nginx/conf.d/ esiste"
        ls -la /etc/nginx/conf.d/
    fi
    
    # Controlla log
    echo -e "\n📝 Directory log:"
    if [ -d "/var/log/nginx" ]; then
        echo "✅ /var/log/nginx/ esiste"
        ls -la /var/log/nginx/
    else
        echo "❌ /var/log/nginx/ non trovata"
    fi
    
    # Controlla directory web
    echo -e "\n🌐 Directory web:"
    for dir in "/var/www/html" "/usr/share/nginx/html" "/var/www"; do
        if [ -d "$dir" ]; then
            echo "✅ $dir esiste"
            ls -la "$dir"
        fi
    done
    
    # Mostra processi Nginx
    echo -e "\n⚙️ Processi Nginx attivi:"
    ps aux | grep nginx | grep -v grep || echo "Nessun processo Nginx trovato"
    
else
    echo "❌ Nginx non è installato"
    echo "📦 Per installarlo:"
    echo "   Ubuntu/Debian: sudo apt update && sudo apt install nginx"
    echo "   CentOS/RHEL:   sudo yum install nginx"
    echo "   Amazon Linux:  sudo yum install nginx"
fi

echo -e "\n✅ Controllo completato!"

