@echo off
echo ========================================
echo   Build PC CMS - Avvio Rapido
echo ========================================
echo.

REM Verifica se node_modules esiste
if not exist "node_modules\" (
    echo [1/3] Installazione dipendenze...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERRORE: Installazione fallita!
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dipendenze gia installate
)

echo.

REM Verifica se .env esiste
if not exist ".env" (
    echo [2/3] File .env non trovato!
    echo.
    echo Crea un file .env con questo contenuto:
    echo.
    echo PORT=3000
    echo NODE_ENV=development
    echo JWT_SECRET=cambia-questo-secret-molto-lungo
    echo DB_PATH=./server/database/buildpc.db
    echo UPLOAD_DIR=./public/uploads
    echo MAX_FILE_SIZE=5242880
    echo AMAZON_AFFILIATE_TAG=your-tag
    echo FRONTEND_URL=http://localhost:5173
    echo.
    pause
    exit /b 1
) else (
    echo [2/3] File .env trovato
)

echo.

REM Verifica se database esiste
if not exist "server\database\buildpc.db" (
    echo [3/3] Inizializzazione database...
    call npm run init-db
    if errorlevel 1 (
        echo.
        echo ERRORE: Inizializzazione database fallita!
        pause
        exit /b 1
    )
) else (
    echo [3/3] Database gia inizializzato
)

echo.
echo ========================================
echo   Avvio server...
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo Admin:    http://localhost:5173/admin/login
echo.
echo Credenziali: admin / admin123
echo.
echo Premi CTRL+C per fermare il server
echo ========================================
echo.

call npm run dev
