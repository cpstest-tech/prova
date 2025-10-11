#!/bin/bash

echo "========================================"
echo "  Diagnostica Rete - Build PC CMS"
echo "========================================"
echo

# Ottieni l'IP del server
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "IP del server: $SERVER_IP"
echo

# Verifica se le porte sono in ascolto
echo "Verifica porte in ascolto:"
netstat -tlnp | grep -E ':(3000|5173)' || echo "Nessuna porta trovata"
echo

# Verifica firewall
echo "Stato firewall (UFW):"
sudo ufw status 2>/dev/null || echo "UFW non installato/configurato"
echo

# Verifica connessioni attive
echo "Connessioni attive:"
ss -tuln | grep -E ':(3000|5173)' || echo "Nessuna connessione attiva"
echo

# Test di connettività locale
echo "Test connettività locale:"
curl -s --connect-timeout 5 http://localhost:3000/test 2>/dev/null && echo "Backend locale: OK" || echo "Backend locale: ERRORE"
curl -s --connect-timeout 5 http://localhost:5173 2>/dev/null && echo "Frontend locale: OK" || echo "Frontend locale: ERRORE"
echo

# Test di connettività esterna
echo "Test connettività esterna:"
curl -s --connect-timeout 10 http://$SERVER_IP:3000/test 2>/dev/null && echo "Backend esterno: OK" || echo "Backend esterno: ERRORE"
curl -s --connect-timeout 10 http://$SERVER_IP:5173 2>/dev/null && echo "Frontend esterno: OK" || echo "Frontend esterno: ERRORE"
echo

# Informazioni di rete
echo "Interfacce di rete:"
ip addr show | grep -E 'inet ' | grep -v '127.0.0.1'
echo

echo "========================================"
echo "  Suggerimenti per risolvere timeout:"
echo "========================================"
echo "1. Verifica che il firewall permetta le porte 3000 e 5173"
echo "2. Controlla se il router/ISP blocca alcune connessioni"
echo "3. Prova da diversi browser/dispositivi"
echo "4. Verifica se ci sono proxy o VPN attivi"
echo "5. Controlla le impostazioni di sicurezza del browser"
echo "========================================"

