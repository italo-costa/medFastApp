#!/bin/bash

# Script de startup mínimo para WSL
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ir para diretório do projeto
cd /mnt/c/workspace/aplicativo/backend

log "🔧 INICIANDO MEDIAPP MINIMAL..."

# Matar processos anteriores
pkill -f "node.*server-minimal" || true

# Aguardar um momento
sleep 2

# Iniciar servidor minimal
log "🚀 Iniciando servidor minimal..."
NODE_ENV=development node src/server-minimal.js &
SERVER_PID=$!

log "✅ Servidor iniciado com PID: $SERVER_PID"

# Aguardar um momento para verificar se está rodando
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    log "✅ Servidor rodando normalmente"
    echo $SERVER_PID > /tmp/mediapp-minimal.pid
    
    # Testar conectividade
    sleep 2
    if curl -s http://localhost:3001/health > /dev/null; then
        log "✅ Health check OK"
    else
        log "⚠️ Health check falhou"
    fi
else
    log "❌ Servidor falhou ao iniciar"
    exit 1
fi

log "🎯 Servidor disponível em:"
log "   http://localhost:3001"
log "   http://localhost:3001/health"
log "   http://localhost:3001/wsl-test"