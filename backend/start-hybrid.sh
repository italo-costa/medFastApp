#!/bin/bash

# Script para iniciar servidor em modo híbrido (WSL + Windows)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ir para diretório
cd /mnt/c/workspace/aplicativo/backend

log "🔧 INICIANDO MEDIAPP HÍBRIDO..."

# Matar processos anteriores
pkill -f "node.*server" || true
sleep 2

# Tentar primeiro no Node.js
log "🚀 Tentando Node.js..."
NODE_ENV=development node src/server-minimal.js &
NODE_PID=$!

# Aguardar inicialização
sleep 5

if kill -0 $NODE_PID 2>/dev/null; then
    log "✅ Node.js rodando com PID: $NODE_PID"
    echo $NODE_PID > /tmp/mediapp-node.pid
    
    # Testar conectividade interna
    if curl -m 5 -s http://localhost:3001/health > /dev/null; then
        log "✅ Health check Node.js OK"
        log "🎯 Servidor Node.js disponível em http://localhost:3001"
        exit 0
    else
        log "⚠️ Health check Node.js falhou"
        kill $NODE_PID 2>/dev/null
    fi
else
    log "❌ Node.js falhou"
fi

# Fallback para Python
log "🐍 Fallback para Python..."
python3 /mnt/c/workspace/aplicativo/backend/test-server.py &
PYTHON_PID=$!

sleep 3

if kill -0 $PYTHON_PID 2>/dev/null; then
    log "✅ Python rodando com PID: $PYTHON_PID"
    echo $PYTHON_PID > /tmp/mediapp-python.pid
    log "🎯 Servidor Python disponível em http://localhost:3002"
else
    log "❌ Ambos os servidores falharam"
    exit 1
fi