#!/bin/bash

# 🚀 MediApp - Script de Inicialização Robusto
# Mantém a aplicação funcionando com restart automático

SCRIPT_DIR="/mnt/c/workspace/aplicativo/backend"
SERVER_SCRIPT="robust-server.js"
LOG_FILE="/tmp/mediapp-production.log"
PID_FILE="/tmp/mediapp.pid"
MAX_RESTARTS=10
RESTART_DELAY=5

echo "🏥 MediApp - Iniciando servidor de produção..."
echo "📁 Diretório: $SCRIPT_DIR"
echo "📄 Script: $SERVER_SCRIPT"
echo "📋 Log: $LOG_FILE"
echo "🆔 PID: $PID_FILE"

# Função para cleanup
cleanup() {
    echo "🛑 Parando servidor MediApp..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill -TERM "$PID"
            sleep 5
            if kill -0 "$PID" 2>/dev/null; then
                kill -KILL "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    echo "✅ Servidor parado"
    exit 0
}

# Registrar handlers para sinais
trap cleanup SIGTERM SIGINT

# Função para iniciar servidor
start_server() {
    cd "$SCRIPT_DIR" || exit 1
    
    echo "🚀 Iniciando MediApp Server..."
    echo "⏰ $(date): Iniciando servidor" >> "$LOG_FILE"
    
    # Iniciar servidor em background
    node "$SERVER_SCRIPT" >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # Salvar PID
    echo "$SERVER_PID" > "$PID_FILE"
    
    echo "✅ Servidor iniciado com PID: $SERVER_PID"
    echo "📋 Logs disponíveis em: $LOG_FILE"
    
    return $SERVER_PID
}

# Função para verificar se servidor está rodando
check_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            return 0  # Rodando
        fi
    fi
    return 1  # Não rodando
}

# Função para testar se API está respondendo
test_api() {
    sleep 5  # Aguardar servidor inicializar
    
    # Testar health endpoint
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ API respondendo corretamente"
        return 0
    else
        echo "❌ API não está respondendo"
        return 1
    fi
}

# Loop principal de monitoramento
restart_count=0

while [ $restart_count -lt $MAX_RESTARTS ]; do
    if ! check_server; then
        echo "🔄 Servidor não está rodando. Iniciando..."
        start_server
        
        # Testar API
        if test_api; then
            restart_count=0  # Reset contador se API estiver funcionando
            echo "🎯 Servidor funcionando normalmente"
        else
            restart_count=$((restart_count + 1))
            echo "⚠️  Tentativa $restart_count de $MAX_RESTARTS"
            
            if [ $restart_count -ge $MAX_RESTARTS ]; then
                echo "❌ Máximo de tentativas atingido. Parando script."
                cleanup
            fi
        fi
    else
        # Servidor rodando, verificar se API responde
        if ! test_api; then
            echo "⚠️  Servidor rodando mas API não responde. Reiniciando..."
            cleanup
            restart_count=$((restart_count + 1))
            continue
        fi
    fi
    
    # Aguardar antes da próxima verificação
    sleep $RESTART_DELAY
done

echo "🏁 Script finalizado"