@echo off
echo ========================================
echo   Build PC CMS - Setup Completo
echo ========================================
echo.

echo [1/4] Installazione dipendenze...
call npm install
if errorlevel 1 (
    echo.
    echo ERRORE: Installazione fallita!
    pause
    exit /b 1
)

echo.
echo [2/4] Creazione file .env...
if exist ".env" (
    echo File .env gia esistente, skip...
) else (
    (
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=super-secret-jwt-key-change-this-in-production-%RANDOM%%RANDOM%
        echo DB_PATH=./server/database/buildpc.db
        echo UPLOAD_DIR=./public/uploads
        echo MAX_FILE_SIZE=5242880
        echo AMAZON_AFFILIATE_TAG=your-affiliate-tag
        echo FRONTEND_URL=http://localhost:5173
    ) > .env
    echo File .env creato!
)

echo.
echo [3/4] Inizializzazione database...
call npm run init-db
if errorlevel 1 (
    echo.
    echo ERRORE: Inizializzazione database fallita!
    pause
    exit /b 1
)

echo.
echo [4/4] Verifica installazione...
if exist "node_modules\" (
    echo [OK] node_modules
) else (
    echo [ERRORE] node_modules mancante
)

if exist ".env" (
    echo [OK] .env
) else (
    echo [ERRORE] .env mancante
)

if exist "server\database\buildpc.db" (
    echo [OK] database
) else (
    echo [ERRORE] database mancante
)

echo.
echo ========================================
echo   Setup Completato!
echo ========================================
echo.
echo Per avviare il progetto:
echo   npm run dev
echo.
echo Oppure usa:
echo   start.bat
echo.
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/admin/login
echo.
echo Credenziali: admin / admin123
echo.
echo IMPORTANTE: Cambia la password dopo il primo login!
echo ========================================
echo.
pause
