#!/bin/bash

# Script para monitorar e manter o servidor MediApp rodando
# Arquivo: monitor-server.sh

BACKEND_DIR="/home/italo_unix_user/aplicativo/backend"
LOG_FILE="$BACKEND_DIR/logs/monitor.log"

# Função para log com timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Função para verificar se o servidor está rodando
check_server() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Função para verificar PM2
check_pm2() {
    cd "$BACKEND_DIR"
    local status=$(npx pm2 jlist | grep -c '"status":"online"')
    if [ "$status" -gt 0 ]; then
        return 0
    else
        return 1
    fi
}

# Função para reiniciar o servidor
restart_server() {
    log "Reiniciando servidor..."
    cd "$BACKEND_DIR"
    npx pm2 restart mediapp-backend
    sleep 5
    if check_server; then
        log "Servidor reiniciado com sucesso"
    else
        log "ERRO: Falha ao reiniciar servidor"
    fi
}

# Loop principal de monitoramento
while true; do
    if ! check_server; then
        log "AVISO: Servidor não responde - verificando PM2..."
        if ! check_pm2; then
            log "ERRO: PM2 não está rodando - reiniciando..."
            restart_server
        else
            log "PM2 rodando mas servidor não responde - reiniciando..."
            restart_server
        fi
    fi
    
    # Aguardar 30 segundos antes da próxima verificação
    sleep 30
done