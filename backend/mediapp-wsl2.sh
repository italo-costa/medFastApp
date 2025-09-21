#!/bin/bash

# SOLUÇÃO DEFINITIVA WSL2 - MediApp Frontend Estável

LOG_FILE="/tmp/mediapp.log"
PID_FILE="/tmp/mediapp.pid"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Limpar processos anteriores
cleanup() {
    log "🧹 Limpando processos anteriores..."
    pkill -f "server-http" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    sudo fuser -k 3001/tcp 2>/dev/null || true
    rm -f "$PID_FILE" 2>/dev/null || true
    sleep 2
}

# Verificar se está rodando
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Testar conectividade
test_health() {
    curl -s http://localhost:3001/health > /dev/null 2>&1
}

# Iniciar servidor
start_server() {
    log "🚀 Iniciando MediApp Server no WSL2..."
    
    cd /mnt/c/workspace/aplicativo/backend || {
        log "❌ Erro: Diretório não encontrado"
        return 1
    }
    
    # Verificar se app.html existe
    if [ ! -f "public/app.html" ]; then
        log "❌ app.html não encontrado!"
        return 1
    fi
    
    log "✅ app.html encontrado - $(wc -l < public/app.html) linhas"
    
    # Iniciar servidor em background
    nohup node server-http.js >> "$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo "$pid" > "$PID_FILE"
    log "📊 Servidor iniciado - PID: $pid"
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se ainda está rodando
    if is_running; then
        log "✅ Processo ativo"
        
        # Testar conectividade
        local attempts=0
        while [ $attempts -lt 10 ]; do
            if test_health; then
                log "✅ Health check OK"
                return 0
            fi
            attempts=$((attempts + 1))
            log "⏳ Tentativa $attempts/10..."
            sleep 1
        done
        
        log "❌ Health check falhou"
        return 1
    else
        log "❌ Processo morreu após inicialização"
        return 1
    fi
}

# Monitor contínuo
monitor() {
    local max_restarts=5
    local restart_count=0
    
    while [ $restart_count -lt $max_restarts ]; do
        if start_server; then
            log "✅ SUCESSO! MediApp rodando no WSL2"
            log "🌐 Frontend: http://localhost:3001"
            log "🔧 Health: http://localhost:3001/health"
            log "👥 API Pacientes: http://localhost:3001/api/pacientes"
            log "👨‍⚕️ API Médicos: http://localhost:3001/api/medicos"
            log "📋 API Prontuários: http://localhost:3001/api/prontuarios"
            log "🎯 PRONTO PARA TESTES MANUAIS!"
            return 0
        else
            restart_count=$((restart_count + 1))
            log "❌ Falha na tentativa $restart_count/$max_restarts"
            
            if [ $restart_count -lt $max_restarts ]; then
                log "⏳ Aguardando antes da próxima tentativa..."
                sleep 5
            fi
        fi
    done
    
    log "❌ Todas as tentativas falharam"
    return 1
}

# Status
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log "✅ Servidor ATIVO (PID: $pid)"
        if test_health; then
            log "✅ Health check OK"
        else
            log "⚠️ Health check falhou"
        fi
    else
        log "❌ Servidor INATIVO"
    fi
}

# Parar
stop_server() {
    log "🛑 Parando servidor..."
    if is_running; then
        local pid=$(cat "$PID_FILE")
        kill -TERM "$pid" 2>/dev/null
        sleep 3
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null
        fi
        rm -f "$PID_FILE"
        log "✅ Servidor parado"
    else
        log "⚠️ Servidor já estava parado"
    fi
}

# Main
case "${1:-start}" in
    start)
        log "🚀 ========================================"
        log "🏥 MediApp WSL2 - Inicialização Frontend"
        log "🚀 ========================================"
        cleanup
        monitor
        ;;
    stop)
        stop_server
        cleanup
        ;;
    status)
        show_status
        ;;
    restart)
        stop_server
        cleanup
        monitor
        ;;
    logs)
        tail -n 30 "$LOG_FILE" 2>/dev/null || echo "Nenhum log encontrado"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "MediApp WSL2 Frontend Manager"
        echo "  start   - Iniciar servidor"
        echo "  stop    - Parar servidor"
        echo "  status  - Ver status"
        echo "  restart - Reiniciar"
        echo "  logs    - Ver logs"
        ;;
esac