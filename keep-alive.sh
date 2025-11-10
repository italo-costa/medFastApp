#!/bin/bash
# 🏥 MediApp - Keep Alive Daemon

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
PID_FILE="/tmp/mediapp-daemon.pid"
LOG_FILE="/tmp/mediapp-daemon.log"

log() {
    local msg="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

error() {
    local msg="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

success() {
    local msg="[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
    echo -e "${PURPLE}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

# Verificar se servidor está rodando
check_server() {
    if timeout 2 bash -c "</dev/tcp/localhost/3003" 2>/dev/null; then
        return 0  # Servidor rodando
    else
        return 1  # Servidor não responde
    fi
}

# Iniciar servidor
start_server() {
    cd "$BACKEND_DIR"
    
    log "Iniciando servidor MediApp..."
    
    # Verificar dependências
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências..."
        npm install >/dev/null 2>&1
    fi
    
    # Verificar se PostgreSQL está rodando
    if ! docker ps | grep -q "mediapp-db"; then
        log "Iniciando PostgreSQL..."
        docker run -d --name mediapp-db --rm \
          -e POSTGRES_USER=mediapp \
          -e POSTGRES_PASSWORD=mediapp123 \
          -e POSTGRES_DB=mediapp_db \
          -p 5433:5432 \
          postgres:15-alpine >/dev/null 2>&1
        sleep 3
    fi
    
    # Iniciar servidor de teste (mais estável)
    nohup node test-server.js > "/tmp/mediapp-server.log" 2>&1 &
    local server_pid=$!
    echo "$server_pid" > "$PID_FILE"
    
    sleep 2
    
    if check_server; then
        success "Servidor iniciado (PID: $server_pid) na porta 3003"
        return 0
    else
        error "Falha ao iniciar servidor"
        return 1
    fi
}

# Parar servidor
stop_server() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null
            rm -f "$PID_FILE"
            log "Servidor parado (PID: $pid)"
        fi
    fi
    
    # Parar possíveis processos órfãos
    pkill -f "node test-server.js" 2>/dev/null || true
}

# Daemon principal
daemon_loop() {
    log "🏥 MediApp Daemon iniciado - Keep Alive ativo"
    
    while true; do
        if ! check_server; then
            error "Servidor não está respondendo - reiniciando..."
            stop_server
            sleep 2
            start_server
        else
            # Servidor está funcionando
            local timestamp=$(date +'%H:%M:%S')
            echo -ne "\r${GREEN}[$timestamp] ✅ MediApp rodando - http://localhost:3003${NC}"
        fi
        
        sleep 10
    done
}

# Tratamento de sinais
trap 'echo -e "\n"; log "Daemon interrompido"; stop_server; exit 0' INT TERM

# Menu principal
case "${1:-daemon}" in
    "start"|"-s")
        stop_server  # Limpar estado anterior
        start_server
        ;;
    "stop"|"-x")
        stop_server
        echo "Daemon parado"
        ;;
    "daemon"|"-d")
        daemon_loop
        ;;
    "status"|"-t")
        if check_server; then
            success "✅ MediApp está rodando - http://localhost:3003"
            if [ -f "$PID_FILE" ]; then
                local pid=$(cat "$PID_FILE")
                echo "PID: $pid"
            fi
        else
            error "❌ MediApp não está rodando"
        fi
        ;;
    "restart"|"-r")
        stop_server
        sleep 2
        start_server
        ;;
    "logs"|"-l")
        echo "=== Daemon Logs ==="
        tail -20 "$LOG_FILE" 2>/dev/null || echo "Nenhum log encontrado"
        echo ""
        echo "=== Server Logs ==="
        tail -20 "/tmp/mediapp-server.log" 2>/dev/null || echo "Nenhum log de servidor encontrado"
        ;;
    "help"|"-h")
        echo "🏥 MediApp Keep Alive Daemon"
        echo ""
        echo "Comandos:"
        echo "  start, -s      Iniciar servidor"
        echo "  stop, -x       Parar servidor"
        echo "  daemon, -d     Iniciar daemon (keep-alive)"
        echo "  status, -t     Status atual"
        echo "  restart, -r    Reiniciar servidor"
        echo "  logs, -l       Ver logs"
        echo "  help, -h       Mostrar ajuda"
        echo ""
        ;;
    *)
        daemon_loop
        ;;
esac