#!/bin/bash

# Controlla se è richiesta la modalità produzione
PRODUCTION_MODE=false
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    PRODUCTION_MODE=true
fi

echo "========================================"
if [ "$PRODUCTION_MODE" = true ]; then
    echo "  Build PC CMS - Modalità PRODUZIONE"
else
    echo "  Build PC CMS - Modalità SVILUPPO"
fi
echo "========================================"
echo

# Verifica se node_modules esiste
if [ ! -d "node_modules" ]; then
    echo "[1/4] Installazione dipendenze..."
    npm install
    if [ $? -ne 0 ]; then
        echo
        echo "ERRORE: Installazione fallita!"
        read -p "Premi INVIO per continuare..."
        exit 1
    fi
else
    echo "[1/4] Dipendenze gia installate"
fi

# Verifica se vite è disponibile (necessario per il build)
if ! command -v npx &> /dev/null || ! npx vite --version &> /dev/null; then
    echo "[1.5/4] Reinstallazione dipendenze per assicurarsi che vite sia disponibile..."
    npm install
fi

echo

# Verifica se .env esiste
if [ ! -f ".env" ]; then
    echo "[2/4] File .env non trovato!"
    echo
    if [ "$PRODUCTION_MODE" = true ]; then
        echo "Crea un file .env per PRODUZIONE con questo contenuto:"
        echo
        echo "PORT=3000"
        echo "NODE_ENV=production"
        echo "JWT_SECRET=cambia-questo-secret-molto-lungo-e-sicuro"
        echo "DB_PATH=./server/database/buildpc.db"
        echo "UPLOAD_DIR=./public/uploads"
        echo "MAX_FILE_SIZE=5242880"
        echo "AMAZON_AFFILIATE_TAG=your-tag"
        echo "FRONTEND_URL=https://build-pc.it"
        echo
    else
        echo "Crea un file .env per SVILUPPO con questo contenuto:"
        echo
        echo "PORT=3000"
        echo "NODE_ENV=development"
        echo "JWT_SECRET=cambia-questo-secret-molto-lungo"
        echo "DB_PATH=./server/database/buildpc.db"
        echo "UPLOAD_DIR=./public/uploads"
        echo "MAX_FILE_SIZE=5242880"
        echo "AMAZON_AFFILIATE_TAG=your-tag"
        echo "FRONTEND_URL=http://localhost:5173"
        echo
    fi
    read -p "Premi INVIO per continuare..."
    exit 1
else
    echo "[2/4] File .env trovato"
fi

echo

# Verifica se database esiste
if [ ! -f "server/database/buildpc.db" ]; then
    echo "[3/4] Inizializzazione database..."
    npm run init-db
    if [ $? -ne 0 ]; then
        echo
        echo "ERRORE: Inizializzazione database fallita!"
        read -p "Premi INVIO per continuare..."
        exit 1
    fi
else
    echo "[3/4] Database gia inizializzato"
fi

echo

# Build per produzione se richiesto
if [ "$PRODUCTION_MODE" = true ]; then
    echo "[4/4] Building per produzione..."
    npm run build
    if [ $? -ne 0 ]; then
        echo
        echo "ERRORE: Build fallito!"
        read -p "Premi INVIO per continuare..."
        exit 1
    fi
    echo "Build completato!"
else
    echo "[4/4] Modalità sviluppo - build non necessario"
fi

echo
echo "========================================"
echo "  Avvio server..."
echo "========================================"
echo

if [ "$PRODUCTION_MODE" = true ]; then
    echo "🌐 MODALITÀ PRODUZIONE"
    echo "======================"
    echo
    echo "Sito: https://build-pc.it"
    echo "Admin: https://build-pc.it/admin/login"
    echo
    echo "⚠️  IMPORTANTE: Assicurati di aver configurato:"
    echo "   - Nginx come reverse proxy"
    echo "   - Certificato SSL (Let's Encrypt)"
    echo "   - Firewall (porte 80, 443 aperte)"
    echo
    echo "Test endpoints:"
    echo "Backend test: https://build-pc.it/test"
    echo "Health check: https://build-pc.it/api/health"
    echo
    echo "Credenziali: admin / admin123"
    echo
    echo "Premi CTRL+C per fermare il server"
    echo "========================================"
    echo
    npm start
else
    echo "🛠️  MODALITÀ SVILUPPO"
    echo "====================="
    echo
    echo "Frontend: http://localhost:5173"
    echo "Backend:  http://localhost:3000"
    echo "Admin:    http://localhost:5173/admin/login"
    echo
    echo "Per accesso esterno, sostituisci 'localhost' con l'IP del server:"
    echo "Frontend: http://[SERVER_IP]:5173"
    echo "Backend:  http://[SERVER_IP]:3000"
    echo "Admin:    http://[SERVER_IP]:5173/admin/login"
    echo
    echo "Accesso tramite dominio build-pc.it:"
    echo "Frontend: http://build-pc.it:5173"
    echo "Backend:  http://build-pc.it:3000"
    echo "Admin:    http://build-pc.it:5173/admin/login"
    echo
    echo "Test endpoints:"
    echo "Backend test: http://[SERVER_IP]:3000/test"
    echo "Health check: http://[SERVER_IP]:3000/api/health"
    echo
    echo "Credenziali: admin / admin123"
    echo
    echo "Premi CTRL+C per fermare il server"
    echo "========================================"
    echo
    npm run dev
fi