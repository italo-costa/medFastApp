#!/bin/bash

# 🔧 MediApp - Script de Monitoramento e Auto-Restart
# Mantém o servidor sempre ativo mesmo com quedas

BACKEND_DIR="/home/italo_unix_user/aplicativo/backend"
LOG_FILE="$BACKEND_DIR/monitor.log"
PID_FILE="$BACKEND_DIR/mediapp.pid"

# Função para log com timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para verificar se o servidor está rodando
is_server_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Rodando
        else
            rm -f "$PID_FILE"
            return 1  # Não rodando
        fi
    else
        return 1  # Não rodando
    fi
}

# Função para iniciar o servidor
start_server() {
    cd "$BACKEND_DIR"
    
    # Parar processo existente se houver
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if ps -p "$old_pid" > /dev/null 2>&1; then
            log_message "Parando processo existente (PID: $old_pid)"
            kill "$old_pid" 2>/dev/null
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi
    
    # Iniciar novo processo
    log_message "Iniciando MediApp Backend..."
    nohup node src/server.js > server_output.log 2>&1 &
    local new_pid=$!
    echo "$new_pid" > "$PID_FILE"
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se iniciou com sucesso
    if ps -p "$new_pid" > /dev/null 2>&1; then
        log_message "✅ Servidor iniciado com sucesso (PID: $new_pid)"
        return 0
    else
        log_message "❌ Falha ao iniciar servidor"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Função para testar conectividade
test_connectivity() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:3001/health 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0  # Online
    else
        return 1  # Offline
    fi
}

# Função principal de monitoramento
monitor_server() {
    log_message "🔍 Iniciando monitoramento do MediApp"
    
    while true; do
        if is_server_running && test_connectivity; then
            log_message "✅ Servidor funcionando normalmente"
        else
            log_message "⚠️ Servidor com problemas, reiniciando..."
            start_server
            
            # Aguardar e testar novamente
            sleep 5
            if test_connectivity; then
                log_message "✅ Servidor restaurado com sucesso"
            else
                log_message "❌ Falha na restauração, tentando novamente em 30s"
                sleep 30
                continue
            fi
        fi
        
        # Aguardar antes da próxima verificação
        sleep 10
    done
}

# Verificar argumentos
case "$1" in
    start)
        log_message "🚀 Comando: Iniciar servidor"
        start_server
        ;;
    stop)
        log_message "🛑 Comando: Parar servidor"
        if [ -f "$PID_FILE" ]; then
            local pid=$(cat "$PID_FILE")
            if ps -p "$pid" > /dev/null 2>&1; then
                kill "$pid"
                log_message "✅ Servidor parado (PID: $pid)"
            fi
            rm -f "$PID_FILE"
        else
            log_message "⚠️ Servidor não estava rodando"
        fi
        ;;
    monitor)
        log_message "🔍 Comando: Iniciar monitoramento"
        monitor_server
        ;;
    status)
        if is_server_running && test_connectivity; then
            local pid=$(cat "$PID_FILE")
            log_message "✅ Servidor ONLINE (PID: $pid)"
            echo "Status: ONLINE"
            echo "PID: $pid"
            echo "URL: http://localhost:3001"
        else
            log_message "❌ Servidor OFFLINE"
            echo "Status: OFFLINE"
        fi
        ;;
    restart)
        log_message "🔄 Comando: Reiniciar servidor"
        $0 stop
        sleep 2
        $0 start
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|monitor}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar servidor"
        echo "  stop    - Parar servidor"
        echo "  restart - Reiniciar servidor"
        echo "  status  - Verificar status"
        echo "  monitor - Monitoramento contínuo (auto-restart)"
        exit 1
        ;;
esac