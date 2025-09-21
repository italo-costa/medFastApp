#!/bin/bash

# SCRIPT DEFINITIVO - MediApp WSL-Windows Bridge
# Máxima estabilidade e conectividade

# Configurações
PROJECT_DIR="/mnt/c/workspace/aplicativo/backend"
LOG_FILE="/tmp/mediapp-bridge.log"
PID_FILE="/tmp/mediapp-bridge.pid"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para limpar processos anteriores
cleanup() {
    log "🧹 Limpando processos anteriores..."
    
    # Matar por pattern
    pkill -f "server-bridge" 2>/dev/null || true
    pkill -f "server-stable" 2>/dev/null || true
    pkill -f "server-minimal" 2>/dev/null || true
    pkill -f "test-server.py" 2>/dev/null || true
    
    # Limpar PID files
    rm -f /tmp/mediapp-*.pid 2>/dev/null || true
    
    sleep 3
    log "✅ Limpeza concluída"
}

# Função de verificação de saúde
health_check() {
    local port=$1
    local timeout=${2:-5}
    
    if curl -m $timeout -s "http://localhost:$port/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função principal de inicialização
start_bridge_server() {
    log "🚀 Iniciando MediApp Bridge Server..."
    
    cd "$PROJECT_DIR" || {
        log "❌ Erro: Não foi possível acessar $PROJECT_DIR"
        exit 1
    }
    
    # Verificar dependências
    if ! command -v node >/dev/null 2>&1; then
        log "❌ Node.js não encontrado"
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        log "❌ NPM não encontrado"
        exit 1
    fi
    
    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependências..."
        npm install express cors --silent
    fi
    
    # Iniciar servidor bridge
    log "🌉 Iniciando Bridge Server (porta 3001)..."
    NODE_ENV=production nohup node src/server-bridge.js > "$LOG_FILE" 2>&1 &
    local bridge_pid=$!
    
    echo $bridge_pid > "$PID_FILE"
    log "✅ Bridge Server iniciado com PID: $bridge_pid"
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está rodando
    if kill -0 $bridge_pid 2>/dev/null; then
        log "✅ Processo ativo"
        
        # Testar conectividade
        if health_check 3001 10; then
            log "✅ Health check OK"
            log "🎯 Servidor disponível em http://localhost:3001"
            return 0
        else
            log "⚠️ Health check falhou"
            return 1
        fi
    else
        log "❌ Processo morreu após inicialização"
        return 1
    fi
}

# Função de monitoramento
monitor_server() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "🔄 Tentativa $attempt de $max_attempts"
        
        if start_bridge_server; then
            log "✅ Servidor iniciado com sucesso!"
            
            # Mostrar informações de conectividade
            log "📋 INFORMAÇÕES DE CONECTIVIDADE:"
            log "   🌐 Windows Chrome: http://localhost:3001"
            log "   🔧 Health Check: http://localhost:3001/health"
            log "   🌉 Bridge Test: http://localhost:3001/wsl-bridge-test"
            log "   📊 API Test: http://localhost:3001/api/test"
            
            # Mostrar IPs disponíveis
            log "🌍 IPs disponíveis:"
            ip addr show 2>/dev/null | grep "inet " | awk '{print "   " $2}' | tee -a "$LOG_FILE"
            
            return 0
        else
            log "❌ Falha na tentativa $attempt"
            attempt=$((attempt + 1))
            
            if [ $attempt -le $max_attempts ]; then
                log "⏳ Aguardando antes da próxima tentativa..."
                sleep 10
            fi
        fi
    done
    
    log "❌ Todas as tentativas falharam"
    return 1
}

# Função de status
check_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            log "✅ Servidor rodando (PID: $pid)"
            health_check 3001 && log "✅ Health check OK" || log "⚠️ Health check falhou"
        else
            log "❌ Processo não está rodando"
            rm -f "$PID_FILE"
        fi
    else
        log "❌ Nenhum servidor ativo"
    fi
}

# Função de parada
stop_server() {
    log "🛑 Parando servidor..."
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            kill -TERM $pid
            sleep 5
            
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid
                log "⚠️ Processo forçado a parar"
            else
                log "✅ Processo parado graciosamente"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    cleanup
}

# Main
case "${1:-start}" in
    "start")
        log "🚀 ========================================="
        log "🏥 MediApp Bridge - Inicialização"
        log "🚀 ========================================="
        cleanup
        monitor_server
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        stop_server
        sleep 2
        cleanup
        monitor_server
        ;;
    "status")
        check_status
        ;;
    "logs")
        tail -n 50 "$LOG_FILE"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac