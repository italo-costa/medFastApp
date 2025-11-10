#!/bin/bash
# 🏥 MediApp v3.0.0 - Sistema Unificado de Inicialização
# Sistema inteligente com resolução automática de conflitos de porta

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
LOG_DIR="/tmp/mediapp-logs"
SERVICES_CONFIG="/tmp/mediapp-services.json"
MAIN_PID_FILE="/tmp/mediapp-main.pid"
DB_CONTAINER_NAME="mediapp-db"

# Criar diretório de logs
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

info() {
    local msg="[$(date +'%H:%M:%S')] INFO: $1"
    echo -e "${CYAN}$msg${NC}"
    echo "$msg" >> "$LOG_DIR/startup.log"
}

# Cabeçalho artístico
print_header() {
    clea
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
    info "Inicializando MediApp com resolução inteligente de portas..."
}

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":${port}.*LISTEN" || lsof -Pi :${port} >/dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para liberar porta
free_port() {
    local port=$1
    local service_name=$2
    
    log "🔄 Verificando porta $port para $service_name..."
    
    if ! check_port $port; then
        success "✅ Porta $port livre"
        return 0
    fi
    
    warn "⚠️ Porta $port em uso - tentando liberar..."
    
    # Encontrar e finalizar processos
    local pids=$(lsof -ti:$port 2>/dev/null || echo "")
    
    if [ -n "$pids" ]; then
        log "Finalizando processos: $pids"
        echo "$pids" | xargs -r kill -9 2>/dev/null || true
        sleep 2
        
        # Verificar se foi liberada
        if ! check_port $port; then
            success "✅ Porta $port liberada"
            return 0
        else
            error "❌ Falha ao liberar porta $port"
            return 1
        fi
    else
        warn "Nenhum processo encontrado na porta $port"
        return 1
    fi
}

# Função para encontrar porta disponível
find_available_port() {
    local base_port=$1
    local service_name=$2
    local fallback_ports=("$@")  # Resto dos argumentos são portas fallback
    fallback_ports=("${fallback_ports[@]:2}")  # Remove os dois primeiros elementos
    
    # Tentar porta preferida primeiro
    if ! check_port $base_port; then
        echo $base_port
        return 0
    fi
    
    # Tentar portas fallback
    for port in "${fallback_ports[@]}"; do
        if ! check_port $port; then
            warn "Usando porta alternativa $port para $service_name"
            echo $port
            return 0
        fi
    done
    
    # Buscar porta dinâmica
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

# Configuração de serviços e portas
configure_ports() {
    log "🔧 Configurando sistema de portas..."
    
    # Configuração de portas preferidas e fallbacks
    local main_port=$(find_available_port 3002 "Servidor Principal" 3001 3003 3004 3005)
    local db_port=$(find_available_port 5433 "PostgreSQL" 5434 5435 5436)
    local test_port=$(find_available_port 3003 "Servidor Teste" 3006 3007 3008)
    
    if [ -z "$main_port" ] || [ -z "$db_port" ]; then
        error "Falha na configuração de portas críticas"
        return 1
    fi
    
    # Salvar configuração em arquivo JSON para os serviços Node.js
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
    
    # Exibir configuração
    info "📊 Configuração de Portas:"
    echo -e "   ${BLUE}• Servidor Principal:${NC} $main_port"
    echo -e "   ${BLUE}• PostgreSQL:${NC} $db_port"
    echo -e "   ${BLUE}• Servidor Teste:${NC} $test_port"
    
    # Exportar variáveis para uso nos scripts
    export MEDIAPP_MAIN_PORT=$main_port
    export MEDIAPP_DB_PORT=$db_port
    export MEDIAPP_TEST_PORT=$test_port
    export MEDIAPP_CONFIG_FILE=$SERVICES_CONFIG
    
    return 0
}

# Configurar PostgreSQL
setup_postgresql() {
    log "🐘 Configurando PostgreSQL..."
    
    local db_port=${MEDIAPP_DB_PORT:-5433}
    
    # Parar container anterior se existi
    docker stop $DB_CONTAINER_NAME 2>/dev/null || true
    docker rm $DB_CONTAINER_NAME 2>/dev/null || true
    
    # Iniciar novo containe
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
    
    # Aguardar PostgreSQL ficar pronto
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

# Configurar aplicação Node.js
setup_application() {
    log "📦 Configurando aplicação Node.js..."
    
    cd "$BACKEND_DIR" || {
        error "Diretório backend não encontrado: $BACKEND_DIR"
        return 1
    }
    
    # Verificar Node.js
    if ! command -v node >/dev/null; then
        error "Node.js não encontrado"
        return 1
    fi
    
    local node_version=$(node -v)
    log "✅ Node.js: $node_version"
    
    # Instalar/verificar dependências
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log "Instalando dependências..."
        npm install --silent --no-fund --no-audit
        
        if [ $? -ne 0 ]; then
            error "Falha na instalação de dependências"
            return 1
        fi
    fi
    
    log "✅ Dependências Node.js OK"
    
    # Atualizar .env com portas configuradas
    local db_port=${MEDIAPP_DB_PORT:-5433}
    local main_port=${MEDIAPP_MAIN_PORT:-3002}
    
    # Criar/atualizar .env
    cat > .env << EOF
NODE_ENV=development
PORT=$main_port
DATABASE_URL="postgresql://mediapp:mediapp123@localhost:$db_port/mediapp_db?schema=public"
JWT_SECRET=mediapp_jwt_2025
LOG_LEVEL=info
MEDIAPP_CONFIG_FILE=$SERVICES_CONFIG
EOF
    
    log "✅ Arquivo .env atualizado"
    
    # Aplicar migrações do banco
    log "Verificando migrações do banco..."
    local migration_output
    migration_output=$(npx prisma migrate status 2>&1)
    
    if echo "$migration_output" | grep -q "have not yet been applied"; then
        log "Aplicando migrações..."
        npx prisma migrate deploy --quiet
        
        if [ $? -eq 0 ]; then
            log "✅ Migrações aplicadas"
        else
            warn "Problema nas migrações, continuando..."
        fi
    else
        log "✅ Migrações já aplicadas"
    fi
    
    return 0
}

# Iniciar servidor principal
start_main_server() {
    log "🚀 Iniciando servidor principal..."
    
    local main_port=${MEDIAPP_MAIN_PORT:-3002}
    
    cd "$BACKEND_DIR"
    
    # Escolher servidor baseado na disponibilidade
    local server_file
    if [ -f "src/app.js" ]; then
        server_file="src/app.js"
    elif [ -f "minimal-server.js" ]; then
        server_file="minimal-server.js"
    elif [ -f "src/demo-server.js" ]; then
        server_file="src/demo-server.js"
    else
        error "Nenhum arquivo de servidor encontrado"
        return 1
    fi
    
    log "Usando servidor: $server_file"
    
    # Iniciar servidor em background
    nohup node "$server_file" > "$LOG_DIR/main-server.log" 2>&1 &
    local server_pid=$!
    echo "$server_pid" > "$MAIN_PID_FILE"
    
    log "Servidor iniciado (PID: $server_pid) na porta $main_port"
    
    # Aguardar servidor ficar acessível
    log "⏳ Verificando conectividade..."
    local attempts=0
    local max_attempts=15
    
    while [ $attempts -lt $max_attempts ]; do
        if timeout 2 bash -c "</dev/tcp/localhost/$main_port" 2>/dev/null; then
            success "✅ Servidor acessível na porta $main_port"
            return 0
        fi
        
        # Verificar se processo ainda existe
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

# Status final do sistema
show_final_status() {
    log "📊 Status Final do Sistema:"
    echo ""
    
    # Ler configuração salva
    if [ -f "$SERVICES_CONFIG" ]; then
        local main_port=$(cat "$SERVICES_CONFIG" | grep -o '"main": [0-9]*' | cut -d' ' -f2)
        local db_port=$(cat "$SERVICES_CONFIG" | grep -o '"database": [0-9]*' | cut -d' ' -f2)
        
        # Verificar PostgreSQL
        if docker ps | grep -q "$DB_CONTAINER_NAME"; then
            success "✅ PostgreSQL: RODANDO (porta $db_port)"
        else
            error "❌ PostgreSQL: PARADO"
        fi
        
        # Verificar servidor principal
        if [ -f "$MAIN_PID_FILE" ]; then
            local pid=$(cat "$MAIN_PID_FILE")
            if kill -0 "$pid" 2>/dev/null; then
                success "✅ Servidor Principal: RODANDO (PID: $pid, porta $main_port)"
            else
                error "❌ Servidor Principal: PARADO"
            fi
        fi
        
        # Verificar conectividade
        if timeout 3 bash -c "</dev/tcp/localhost/$main_port" 2>/dev/null; then
            success "✅ Conectividade: OK"
        else
            warn "⚠️ Conectividade: PROBLEMA"
        fi
        
        echo ""
        echo -e "${CYAN}🔗 URLs da Aplicação:${NC}"
        echo -e "   • Frontend: ${GREEN}http://localhost:$main_port${NC}"
        echo -e "   • Health: ${GREEN}http://localhost:$main_port/health${NC}"
        echo -e "   • API Médicos: ${GREEN}http://localhost:$main_port/api/medicos${NC}"
        echo -e "   • Gestão Médicos: ${GREEN}http://localhost:$main_port/gestao-medicos.html${NC}"
        echo -e "   • Gestão Pacientes: ${GREEN}http://localhost:$main_port/gestao-pacientes.html${NC}"
        echo ""
        
        echo -e "${BLUE}📁 Arquivos de Configuração:${NC}"
        echo -e "   • Config JSON: ${GREEN}$SERVICES_CONFIG${NC}"
        echo -e "   • Logs: ${GREEN}$LOG_DIR/${NC}"
        echo -e "   • PID File: ${GREEN}$MAIN_PID_FILE${NC}"
        echo ""
        
        # Mostrar logs recentes se houver problemas
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

# Função de limpeza
cleanup() {
    log "🧹 Executando limpeza..."
    
    # Parar processos Node.js anteriores
    pkill -f "node.*app.js" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "node.*demo-server.js" 2>/dev/null || true
    pkill -f "node.*minimal-server.js" 2>/dev/null || true
    
    # Remover arquivos PID antigos
    rm -f "$MAIN_PID_FILE" 2>/dev/null || true
    
    log "✅ Limpeza concluída"
}

# Função principal
main() {
    print_heade
    
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
    info "📝 Configuração salva em: $SERVICES_CONFIG"
    info "📂 Logs disponíveis em: $LOG_DIR"
    
    return 0
}

# Tratamento de sinais
trap 'echo -e "\n"; log "Interrompido pelo usuário"; exit 0' INT TERM

# Executar função principal
main "$@"