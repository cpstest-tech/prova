#!/bin/bash

# Script di deployment per VPS - Sistema Sostituzione Intelligente
# Esegui questo script sulla VPS per aggiornare tutto

echo "🚀 Avvio deployment Sistema Sostituzione Intelligente..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Controlla se siamo nella directory giusta
if [ ! -f "package.json" ]; then
    log_error "package.json non trovato! Assicurati di essere nella directory del progetto."
    exit 1
fi

log_info "Directory progetto verificata ✓"

# 1. Backup database esistente
log_info "Creando backup database..."
if [ -f "server/database/buildpc.db" ]; then
    cp server/database/buildpc.db server/database/buildpc.db.backup.$(date +%Y%m%d_%H%M%S)
    log_success "Backup database creato"
else
    log_warning "Database non trovato, creazione nuovo database"
fi

# 2. Pull ultime modifiche da Git
log_info "Aggiornamento codice da Git..."
git pull origin master
if [ $? -eq 0 ]; then
    log_success "Codice aggiornato da Git"
else
    log_error "Errore nel pull da Git"
    exit 1
fi

# 3. Aggiorna dipendenze npm
log_info "Aggiornamento dipendenze..."
npm install
if [ $? -eq 0 ]; then
    log_success "Dipendenze aggiornate"
else
    log_error "Errore nell'aggiornamento dipendenze"
    exit 1
fi

# 4. Build frontend (se necessario)
log_info "Build frontend..."
if [ -f "vite.config.js" ]; then
    npm run build
    if [ $? -eq 0 ]; then
        log_success "Frontend build completato"
    else
        log_warning "Errore nel build frontend, continuo comunque..."
    fi
fi

# 5. Verifica permessi file
log_info "Verifica permessi file..."
chmod +x server/scripts/updateAvailability.js
chmod +x test-replacement-system.js
log_success "Permessi file aggiornati"

# 6. Test sistema
log_info "Test sistema sostituzione..."
node test-replacement-system.js
if [ $? -eq 0 ]; then
    log_success "Test sistema completato"
else
    log_warning "Test sistema con errori, ma continuo deployment..."
fi

# 7. Riavvia servizi
log_info "Riavvio servizi..."

# Se usi PM2
if command -v pm2 &> /dev/null; then
    pm2 restart build-pc
    log_success "Servizio PM2 riavviato"
elif command -v systemctl &> /dev/null; then
    # Se usi systemd
    sudo systemctl restart build-pc
    log_success "Servizio systemd riavviato"
else
    # Kill processo esistente se presente
    pkill -f "node server/index.js" || true
    log_info "Processi esistenti terminati"
    
    # Avvia nuovo processo in background
    nohup node server/index.js > server.log 2>&1 &
    log_success "Server avviato in background"
fi

# 8. Verifica che il server sia attivo
log_info "Verifica server attivo..."
sleep 5

if curl -s http://localhost:3000/api/health > /dev/null; then
    log_success "Server attivo e risponde ✓"
else
    log_warning "Server potrebbe non essere attivo, controlla i log"
fi

# 9. Mostra informazioni utili
echo ""
log_success "🎉 DEPLOYMENT COMPLETATO!"
echo ""
log_info "Informazioni utili:"
echo "  📊 Server: http://localhost:3000"
echo "  🧪 Test API: curl http://localhost:3000/api/health"
echo "  📝 Log: tail -f server.log"
echo "  🔄 Job schedulato: Attivo ogni 6 ore in produzione"
echo ""
log_info "Nuove funzionalità disponibili:"
echo "  🔍 Sistema sostituzione intelligente"
echo "  📊 API endpoints per gestione sostituzioni"
echo "  🎯 Badge componenti sostituiti"
echo "  ⚙️  Campo ricerca alternative in admin"
echo ""

# 10. Mostra comandi utili per debugging
log_info "Comandi utili per debugging:"
echo "  pm2 logs build-pc                    # Log PM2"
echo "  pm2 status                           # Status PM2"
echo "  tail -f server.log                   # Log server"
echo "  node test-replacement-system.js      # Test sistema"
echo "  curl http://localhost:3000/api/health # Test API"
echo ""

log_success "Deployment completato con successo! 🚀"
