#!/bin/bash

# MediApp - Script de Start Robusto para Linux
# Configurado para ambiente virtualizado

echo "==========================================="
echo "🏥 MediApp Linux Server Startup v3.0.0"
echo "==========================================="

# Configurações
SERVER_PORT=3002
SERVER_HOST="0.0.0.0"
SERVER_FILE="/mnt/c/workspace/aplicativo/apps/backend/src/server-linux-stable.js"
PID_FILE="/tmp/mediapp.pid"
LOG_FILE="/tmp/mediapp.log"

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    log "❌ Node.js não encontrado"
    exit 1
fi

log "✅ Node.js encontrado: $(node --version)"

# Verificar se o arquivo do servidor existe
if [ ! -f "$SERVER_FILE" ]; then
    log "❌ Arquivo do servidor não encontrado: $SERVER_FILE"
    exit 1
fi

log "✅ Arquivo do servidor encontrado"

# Parar instância anterior se existir
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        log "🛑 Parando instância anterior (PID: $OLD_PID)"
        kill "$OLD_PID"
        sleep 2
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log "⚠️ Forçando encerramento"
            kill -9 "$OLD_PID"
        fi
    fi
    rm -f "$PID_FILE"
fi

# Verificar se a porta está livre
if netstat -tulpn 2>/dev/null | grep -q ":$SERVER_PORT "; then
    log "⚠️ Porta $SERVER_PORT em uso, tentando liberar..."
    PID_PORT=$(netstat -tulpn 2>/dev/null | grep ":$SERVER_PORT " | awk '{print $7}' | cut -d'/' -f1)
    if [ ! -z "$PID_PORT" ]; then
        kill "$PID_PORT" 2>/dev/null || true
        sleep 2
    fi
fi

# Limpar log anterior
> "$LOG_FILE"

log "🚀 Iniciando MediApp Server..."

# Definir variáveis de ambiente
export NODE_ENV=development
export PORT=$SERVER_PORT
export HOST=$SERVER_HOST

# Iniciar servidor em background
cd "$(dirname "$SERVER_FILE")"
nohup node server-linux-stable.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Salvar PID
echo $SERVER_PID > "$PID_FILE"

log "📊 Servidor iniciado com PID: $SERVER_PID"

# Aguardar inicialização
sleep 3

# Verificar se está rodando
if ps -p "$SERVER_PID" > /dev/null 2>&1; then
    log "✅ Servidor rodando com sucesso!"
    
    # Testar conectividade
    for i in {1..10}; do
        if curl -s http://localhost:$SERVER_PORT/health > /dev/null 2>&1; then
            log "✅ Health check OK - Servidor responsivo"
            break
        else
            log "⏳ Aguardando servidor ficar responsivo... ($i/10)"
            sleep 1
        fi
    done
    
    # Status final
    log "==========================================="
    log "🎯 MediApp Server ATIVO!"
    log "📊 PID: $SERVER_PID"
    log "🌐 Porta: $SERVER_PORT"
    log "🔗 Health: http://localhost:$SERVER_PORT/health"
    log "🏥 Dashboard: http://localhost:$SERVER_PORT/"
    log "📝 Log: $LOG_FILE"
    log "==========================================="
    
    echo ""
    echo "✅ Servidor iniciado com sucesso!"
    echo "🔗 Acesse: http://localhost:$SERVER_PORT"
    echo "📝 Logs: tail -f $LOG_FILE"
    echo ""
    
else
    log "❌ Falha ao iniciar servidor"
    exit 1
fi