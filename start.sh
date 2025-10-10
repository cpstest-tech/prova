#!/bin/bash

echo "========================================"
echo "  Build PC CMS - Avvio Rapido"
echo "========================================"
echo

# Verifica se node_modules esiste
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installazione dipendenze..."
    npm install
    if [ $? -ne 0 ]; then
        echo
        echo "ERRORE: Installazione fallita!"
        read -p "Premi INVIO per continuare..."
        exit 1
    fi
else
    echo "[1/3] Dipendenze gia installate"
fi

echo

# Verifica se .env esiste
if [ ! -f ".env" ]; then
    echo "[2/3] File .env non trovato!"
    echo
    echo "Crea un file .env con questo contenuto:"
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
    read -p "Premi INVIO per continuare..."
    exit 1
else
    echo "[2/3] File .env trovato"
fi

echo

# Verifica se database esiste
if [ ! -f "server/database/buildpc.db" ]; then
    echo "[3/3] Inizializzazione database..."
    npm run init-db
    if [ $? -ne 0 ]; then
        echo
        echo "ERRORE: Inizializzazione database fallita!"
        read -p "Premi INVIO per continuare..."
        exit 1
    fi
else
    echo "[3/3] Database gia inizializzato"
fi

echo
echo "========================================"
echo "  Avvio server..."
echo "========================================"
echo
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo "Admin:    http://localhost:5173/admin/login"
echo
echo "Credenziali: admin / admin123"
echo
echo "Premi CTRL+C per fermare il server"
echo "========================================"
echo

npm run dev
