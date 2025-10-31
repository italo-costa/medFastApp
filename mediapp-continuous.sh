#!/bin/bash

# 🚀 MediApp - Servidor de Produção Contínuo
# Script que mantém o servidor sempre rodando

BACKEND_DIR="/mnt/c/workspace/aplicativo/backend"
LOG_FILE="/tmp/mediapp-continuous.log"
PID_FILE="/tmp/mediapp.pid"

echo "🏥 MediApp - Iniciando servidor de produção contínuo..."
echo "📁 Diretório: $BACKEND_DIR"
echo "📋 Log: $LOG_FILE"

# Função para cleanup
cleanup() {
    echo "🛑 Parando MediApp..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill -TERM "$PID"
            sleep 3
            if kill -0 "$PID" 2>/dev/null; then
                kill -KILL "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Registrar handlers para sinais
trap cleanup SIGTERM SIGINT

# Ir para diretório do backend
cd "$BACKEND_DIR" || exit 1

# Loop infinito para manter servidor sempre rodando
restart_count=0
max_restarts=5
restart_delay=3

while true; do
    echo "🚀 $(date): Tentativa $((restart_count + 1)) - Iniciando MediApp Server..."
    echo "🚀 $(date): Iniciando servidor..." >> "$LOG_FILE"
    
    # Iniciar servidor e capturar PID
    node robust-server.js >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # Salvar PID
    echo "$SERVER_PID" > "$PID_FILE"
    
    echo "✅ Servidor iniciado com PID: $SERVER_PID"
    echo "✅ $(date): Servidor PID $SERVER_PID" >> "$LOG_FILE"
    
    # Aguardar um pouco para verificar se servidor ainda está rodando
    sleep 10
    
    # Verificar se processo ainda existe
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "✅ Servidor funcionando normalmente"
        
        # Loop de monitoramento
        while kill -0 "$SERVER_PID" 2>/dev/null; do
            # Testar API a cada 30 segundos
            if curl -s -f http://localhost:3002/health > /dev/null 2>&1; then
                echo "💓 $(date): Heartbeat OK" >> "$LOG_FILE"
            else
                echo "⚠️  $(date): API não responde" >> "$LOG_FILE"
            fi
            sleep 30
        done
    fi
    
    echo "⚠️  $(date): Servidor parou. PID $SERVER_PID não existe mais"
    echo "⚠️  $(date): Servidor parou" >> "$LOG_FILE"
    
    restart_count=$((restart_count + 1))
    
    if [ $restart_count -ge $max_restarts ]; then
        echo "❌ Máximo de restarts atingido ($max_restarts). Parando."
        break
    fi
    
    echo "🔄 Reiniciando em $restart_delay segundos..."
    sleep $restart_delay
done

echo "🏁 Script finalizado"