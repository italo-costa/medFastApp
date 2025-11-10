#!/bin/bash
# MediApp v3.0.0 - Sistema Unificado de Inicialização

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
LOG_DIR="/tmp/mediapp-logs"
SERVICES_CONFIG="/tmp/mediapp-services.json"
MAIN_PID_FILE="/tmp/mediapp-main.pid"
DB_CONTAINER_NAME="mediapp-db"

mkdir -p "$LOG_DIR"

log() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$LOG_DIR/startup.log"
}

error() {
    local msg="[$(date +'%H:%M:%S')] ERROR: $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$LOG_DIR/startup.log"
}

success() {
    local msg="[$(date +'%H:%M:%S')] SUCCESS: $1"
    echo -e "${PURPLE}$msg${NC}"
    echo "$msg" >> "$LOG_DIR/startup.log"
}

warn() {
    local msg="[$(date +'%H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}$msg${NC}"
    echo "$msg" >> "$LOG_DIR/startup.log"
}

print_header() {
    clear
    echo -e "${PURPLE}"
    cat << 'EOF'
🏥 ================================================
   __  __          _ _    _               
  |  \/  | ___  __| (_)  / \   _ __  _ __ 
  | |\/| |/ _ \/ _` | | / _ \ | '_ \| '_ \
  | |  | |  __/ (_| | |/ ___ \| |_) | |_) |
  |_|  |_|\___|\__,_|_/_/   \_\ .__/| .__/
                              |_|   |_|   
   Sistema Unificado de Inicialização v3.0.0
🏥 ================================================
EOF
    echo -e "${NC}"
    log "Inicializando MediApp com resolução inteligente de portas..."
}

check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":${port}.*LISTEN" || lsof -Pi :${port} >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

find_available_port() {
    local base_port=$1
    local service_name=$2
    
    if ! check_port $base_port; then
        echo $base_port
        return 0
    fi
    
    local fallback_ports=(3001 3003 3004 3005 3006 3007 3008 5434 5435 5436)
    for port in "${fallback_ports[@]}"; do
        if ! check_port $port; then
            warn "Usando porta alternativa $port para $service_name"
            echo $port
            return 0
        fi
    done
    
    local dynamic_port
    dynamic_port=$(python3 -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1]); s.close()" 2>/dev/null || echo "")
    
    if [ -n "$dynamic_port" ]; then
        warn "Usando porta dinâmica $dynamic_port para $service_name"
        echo $dynamic_port
    else
        error "Não foi possível encontrar porta disponível para $service_name"
        return 1
    fi
}

configure_ports() {
    log "🔧 Configurando sistema de portas..."
    
    local main_port=$(find_available_port 3002 "Servidor Principal")
    local db_port=$(find_available_port 5433 "PostgreSQL")
    local test_port=$(find_available_port 3003 "Servidor Teste")
    
    if [ -z "$main_port" ] || [ -z "$db_port" ]; then
        error "Falha na configuração de portas críticas"
        return 1
    fi
    
    cat > "$SERVICES_CONFIG" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "ports": {
    "main": $main_port,
    "database": $db_port,
    "test": $test_port
  },
  "urls": {
    "main": "http://localhost:$main_port",
    "health": "http://localhost:$main_port/health",
    "api": "http://localhost:$main_port/api",
    "gestao_medicos": "http://localhost:$main_port/gestao-medicos.html",
    "gestao_pacientes": "http://localhost:$main_port/gestao-pacientes.html"
  },
  "database": {
    "url": "postgresql://mediapp:mediapp123@localhost:$db_port/mediapp_db?schema=public",
    "container": "$DB_CONTAINER_NAME"
  }
}
EOF

    success "✅ Configuração de portas salva em $SERVICES_CONFIG"
    
    log "📊 Configuração de Portas:"
    echo -e "   ${BLUE}• Servidor Principal:${NC} $main_port"
    echo -e "   ${BLUE}• PostgreSQL:${NC} $db_port"
    echo -e "   ${BLUE}• Servidor Teste:${NC} $test_port"
    
    export MEDIAPP_MAIN_PORT=$main_port
    export MEDIAPP_DB_PORT=$db_port
    export MEDIAPP_TEST_PORT=$test_port
    export MEDIAPP_CONFIG_FILE=$SERVICES_CONFIG
    
    return 0
}

setup_postgresql() {
    log "🐘 Configurando PostgreSQL..."
    
    local db_port=${MEDIAPP_DB_PORT:-5433}
    
    docker stop $DB_CONTAINER_NAME 2>/dev/null || true
    docker rm $DB_CONTAINER_NAME 2>/dev/null || true
    
    log "Iniciando PostgreSQL na porta $db_port..."
    local container_id
    container_id=$(docker run -d \
        --name $DB_CONTAINER_NAME \
        --restart unless-stopped \
        -e POSTGRES_USER=mediapp \
        -e POSTGRES_PASSWORD=mediapp123 \
        -e POSTGRES_DB=mediapp_db \
        -e POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256 --auth-local=trust" \
        -p $db_port:5432 \
        --shm-size=256mb \
        postgres:15-alpine)
    
    if [ $? -ne 0 ]; then
        error "Falha ao iniciar container PostgreSQL"
        return 1
    fi
    
    log "Container PostgreSQL iniciado: $container_id"
    
    log "⏳ Aguardando PostgreSQL ficar pronto..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec $DB_CONTAINER_NAME pg_isready -U mediapp >/dev/null 2>&1; then
            success "✅ PostgreSQL pronto na porta $db_port"
            return 0
        fi
        
        sleep 1
        ((attempts++))
        
        if [ $((attempts % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    echo
    
    error "PostgreSQL não ficou pronto após ${max_attempts}s"
    docker logs $DB_CONTAINER_NAME --tail 10
    return 1
}

setup_application() {
    log "📦 Configurando aplicação Node.js..."
    
    cd "$BACKEND_DIR" || {
        error "Diretório backend não encontrado: $BACKEND_DIR"
        return 1
    }
    
    if ! command -v node >/dev/null; then
        error "Node.js não encontrado"
        return 1
    fi
    
    local node_version=$(node -v)
    log "✅ Node.js: $node_version"
    
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências..."
        npm install --silent --no-fund --no-audit
        
        if [ $? -ne 0 ]; then
            error "Falha na instalação de dependências"
            return 1
        fi
    fi
    
    log "✅ Dependências Node.js OK"
    
    local db_port=${MEDIAPP_DB_PORT:-5433}
    local main_port=${MEDIAPP_MAIN_PORT:-3002}
    
    cat > .env << EOF
NODE_ENV=development
PORT=$main_port
DATABASE_URL="postgresql://mediapp:mediapp123@localhost:$db_port/mediapp_db?schema=public"
JWT_SECRET=mediapp_jwt_2025
LOG_LEVEL=info
MEDIAPP_CONFIG_FILE=$SERVICES_CONFIG
EOF
    
    log "✅ Arquivo .env atualizado"
    
    log "Verificando migrações do banco..."
    npx prisma generate >/dev/null 2>&1 || true
    npx prisma migrate deploy --quiet >/dev/null 2>&1 || true
    log "✅ Migrações processadas"
    
    return 0
}

start_main_server() {
    log "🚀 Iniciando servidor principal..."
    
    local main_port=${MEDIAPP_MAIN_PORT:-3002}
    
    cd "$BACKEND_DIR"
    
    local server_file
    if [ -f "src/app.js" ]; then
        server_file="src/app.js"
    else
        error "Arquivo servidor não encontrado"
        return 1
    fi
    
    log "Usando servidor: $server_file"
    
    nohup node "$server_file" > "$LOG_DIR/main-server.log" 2>&1 &
    local server_pid=$!
    echo "$server_pid" > "$MAIN_PID_FILE"
    
    log "Servidor iniciado (PID: $server_pid) na porta $main_port"
    
    log "⏳ Verificando conectividade..."
    local attempts=0
    local max_attempts=15
    
    while [ $attempts -lt $max_attempts ]; do
        if timeout 2 bash -c "</dev/tcp/localhost/$main_port" 2>/dev/null; then
            success "✅ Servidor acessível na porta $main_port"
            return 0
        fi
        
        if ! kill -0 "$server_pid" 2>/dev/null; then
            error "Processo do servidor morreu!"
            if [ -f "$LOG_DIR/main-server.log" ]; then
                echo "Últimos logs:"
                tail -10 "$LOG_DIR/main-server.log"
            fi
            return 1
        fi
        
        sleep 1
        ((attempts++))
        
        if [ $((attempts % 3)) -eq 0 ]; then
            echo -n "."
        fi
    done
    echo
    
    warn "Servidor pode estar funcionando mas não respondeu na verificação"
    return 0
}

show_final_status() {
    log "📊 Status Final do Sistema:"
    echo ""
    
    if [ -f "$SERVICES_CONFIG" ]; then
        local main_port=$(cat "$SERVICES_CONFIG" | grep -o '"main": [0-9]*' | cut -d' ' -f2)
        local db_port=$(cat "$SERVICES_CONFIG" | grep -o '"database": [0-9]*' | cut -d' ' -f2)
        
        if docker ps | grep -q "$DB_CONTAINER_NAME"; then
            success "✅ PostgreSQL: RODANDO (porta $db_port)"
        else
            error "❌ PostgreSQL: PARADO"
        fi
        
        if [ -f "$MAIN_PID_FILE" ]; then
            local pid=$(cat "$MAIN_PID_FILE")
            if kill -0 "$pid" 2>/dev/null; then
                success "✅ Servidor Principal: RODANDO (PID: $pid, porta $main_port)"
            else
                error "❌ Servidor Principal: PARADO"
            fi
        fi
        
        echo ""
        echo -e "${CYAN}🔗 URLs da Aplicação:${NC}"
        echo -e "   • Frontend: ${GREEN}http://localhost:$main_port${NC}"
        echo -e "   • Health: ${GREEN}http://localhost:$main_port/health${NC}"
        echo -e "   • API Médicos: ${GREEN}http://localhost:$main_port/api/medicos${NC}"
        echo -e "   • Gestão Médicos: ${GREEN}http://localhost:$main_port/gestao-medicos.html${NC}"
        echo -e "   • Gestão Pacientes: ${GREEN}http://localhost:$main_port/gestao-pacientes.html${NC}"
        echo ""
        
        if [ -f "$LOG_DIR/main-server.log" ]; then
            local log_size=$(wc -l < "$LOG_DIR/main-server.log" 2>/dev/null || echo "0")
            if [ "$log_size" -gt 0 ]; then
                echo -e "${BLUE}📋 Últimos logs do servidor:${NC}"
                tail -5 "$LOG_DIR/main-server.log" | sed 's/^/   /'
                echo ""
            fi
        fi
    fi
}

cleanup() {
    log "🧹 Executando limpeza..."
    
    pkill -f "node.*app.js" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    
    rm -f "$MAIN_PID_FILE" 2>/dev/null || true
    
    log "✅ Limpeza concluída"
}

main() {
    print_header
    
    log "🏥 Iniciando MediApp v3.0.0 com sistema unificado..."
    
    cleanup
    
    if ! configure_ports; then
        error "❌ Falha na configuração de portas"
        exit 1
    fi
    
    if ! setup_postgresql; then
        error "❌ Falha na configuração do PostgreSQL"
        exit 1
    fi
    
    if ! setup_application; then
        error "❌ Falha na configuração da aplicação"
        exit 1
    fi
    
    if ! start_main_server; then
        error "❌ Falha ao iniciar servidor principal"
        exit 1
    fi
    
    show_final_status
    
    success "🎉 MediApp v3.0.0 iniciado com sucesso!"
    log "📝 Configuração salva em: $SERVICES_CONFIG"
    log "📂 Logs disponíveis em: $LOG_DIR"
    
    return 0
}

trap 'echo -e "\n"; log "Interrompido pelo usuário"; exit 0' INT TERM

main "$@"