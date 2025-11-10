#!/bin/bash
# 🏥 MediApp - Inicialização Completa e Robusta v3.0

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
PID_FILE="/tmp/mediapp-final.pid"
LOG_FILE="/tmp/mediapp-startup.log"

log() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${GREEN}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

error() {
    local msg="[$(date +'%H:%M:%S')] ERROR: $1"
    echo -e "${RED}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

success() {
    local msg="[$(date +'%H:%M:%S')] SUCCESS: $1"
    echo -e "${PURPLE}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

warn() {
    local msg="[$(date +'%H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}$msg${NC}"
    echo "$msg" >> "$LOG_FILE"
}

# Cabeçalho
clear
echo -e "${PURPLE}"
cat << 'EOF'
🏥 ==========================================
   MediApp v3.0.0 - Startup Completo
🏥 ==========================================
EOF
echo -e "${NC}"

# Limpeza inicial
cleanup() {
    log "🧹 Limpando processos anteriores..."
    
    # Parar processos Node.js anteriores
    pkill -f "node src/app.js" 2>/dev/null || true
    pkill -f "node test-server.js" 2>/dev/null || true
    rm -f "$PID_FILE" 2>/dev/null || true
    
    log "✅ Limpeza concluída"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "📋 Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node >/dev/null; then
        error "Node.js não encontrado!"
        exit 1
    fi
    
    local node_version=$(node -v)
    log "✅ Node.js: $node_version"
    
    # Verificar Docker
    if ! command -v docker >/dev/null; then
        error "Docker não encontrado!"
        exit 1
    fi
    
    log "✅ Docker disponível"
    
    # Verificar diretório backend
    if [ ! -d "$BACKEND_DIR" ]; then
        error "Diretório backend não encontrado: $BACKEND_DIR"
        exit 1
    fi
    
    log "✅ Diretório backend encontrado"
}

# Configurar PostgreSQL
setup_postgres() {
    log "🐘 Configurando PostgreSQL..."
    
    # Limpar containers anteriores
    docker stop mediapp-db 2>/dev/null || true
    docker rm mediapp-db 2>/dev/null || true
    
    # Iniciar PostgreSQL
    log "Iniciando container PostgreSQL..."
    docker run -d \
        --name mediapp-db \
        --restart unless-stopped \
        -e POSTGRES_USER=mediapp \
        -e POSTGRES_PASSWORD=mediapp123 \
        -e POSTGRES_DB=mediapp_db \
        -p 5433:5432 \
        --memory=1g \
        postgres:15-alpine >/dev/null
    
    if [ $? -ne 0 ]; then
        error "Falha ao iniciar PostgreSQL"
        return 1
    fi
    
    # Aguardar PostgreSQL ficar pronto
    log "⏳ Aguardando PostgreSQL ficar pronto..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec mediapp-db pg_isready -U mediapp >/dev/null 2>&1; then
            log "✅ PostgreSQL pronto!"
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
    return 1
}

# Configurar aplicação
setup_application() {
    log "📦 Configurando aplicação..."
    
    cd "$BACKEND_DIR" || exit 1
    
    # Verificar dependências
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log "Instalando dependências..."
        npm install --no-fund --no-audit >/dev/null 2>&1
        
        if [ $? -ne 0 ]; then
            error "Falha na instalação de dependências"
            return 1
        fi
    fi
    
    log "✅ Dependências OK"
    
    # Verificar e aplicar migrações
    log "Verificando migrações do banco..."
    local migration_output=$(npx prisma migrate status 2>&1)
    
    if echo "$migration_output" | grep -q "have not yet been applied"; then
        log "Aplicando migrações..."
        npx prisma migrate deploy >/dev/null 2>&1
        
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

# Iniciar servidor
start_server() {
    log "🚀 Iniciando servidor MediApp..."
    
    cd "$BACKEND_DIR"
    
    # Iniciar em background com logs
    nohup node src/app.js > "/tmp/mediapp-server.log" 2>&1 &
    local server_pid=$!
    echo "$server_pid" > "$PID_FILE"
    
    log "Servidor iniciado (PID: $server_pid)"
    
    # Aguardar servidor ficar pronto
    log "⏳ Aguardando servidor ficar acessível..."
    
    local attempts=0
    local max_attempts=20
    
    while [ $attempts -lt $max_attempts ]; do
        if timeout 2 bash -c "</dev/tcp/localhost/3002" 2>/dev/null; then
            success "✅ Servidor acessível na porta 3002!"
            return 0
        fi
        
        # Verificar se processo ainda existe
        if ! kill -0 "$server_pid" 2>/dev/null; then
            error "Processo do servidor morreu!"
            cat "/tmp/mediapp-server.log" | tail -10
            return 1
        fi
        
        sleep 1
        ((attempts++))
        
        if [ $((attempts % 3)) -eq 0 ]; then
            echo -n "."
        fi
    done
    echo
    
    warn "Servidor não ficou acessível, mas pode estar funcionando"
    return 0
}

# Verificar status final
verify_status() {
    log "🔍 Verificando status final..."
    
    # Verificar PostgreSQL
    if docker ps | grep -q "mediapp-db"; then
        success "✅ PostgreSQL: RODANDO"
    else
        error "❌ PostgreSQL: PARADO"
    fi
    
    # Verificar servidor Node.js
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            success "✅ Servidor Node.js: RODANDO (PID: $pid)"
        else
            error "❌ Servidor Node.js: PARADO"
        fi
    else
        error "❌ PID file não encontrado"
    fi
    
    # Verificar conectividade
    if timeout 3 bash -c "</dev/tcp/localhost/3002" 2>/dev/null; then
        success "✅ Conectividade: OK"
    else
        warn "⚠️ Conectividade: PROBLEMA"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 URLs da Aplicação:${NC}"
    echo -e "   • Frontend: ${GREEN}http://localhost:3002${NC}"
    echo -e "   • Health: ${GREEN}http://localhost:3002/health${NC}"
    echo -e "   • API Médicos: ${GREEN}http://localhost:3002/api/medicos${NC}"
    echo -e "   • Gestão Médicos: ${GREEN}http://localhost:3002/gestao-medicos.html${NC}"
    echo ""
    
    # Mostrar logs recentes se houver problemas
    if [ -f "/tmp/mediapp-server.log" ]; then
        local log_size=$(wc -l < "/tmp/mediapp-server.log")
        if [ "$log_size" -gt 0 ]; then
            echo -e "${BLUE}📋 Últimos logs do servidor:${NC}"
            tail -5 "/tmp/mediapp-server.log" | sed 's/^/   /'
            echo ""
        fi
    fi
}

# Função principal
main() {
    log "🏥 Iniciando MediApp v3.0.0..."
    
    cleanup
    
    if ! check_prerequisites; then
        error "❌ Falha na verificação de pré-requisitos"
        exit 1
    fi
    
    if ! setup_postgres; then
        error "❌ Falha na configuração do PostgreSQL"
        exit 1
    fi
    
    if ! setup_application; then
        error "❌ Falha na configuração da aplicação"
        exit 1
    fi
    
    if ! start_server; then
        error "❌ Falha ao iniciar servidor"
        exit 1
    fi
    
    verify_status
    
    success "🎉 MediApp v3.0.0 iniciado com sucesso!"
    log "📝 Logs salvos em: $LOG_FILE"
    
    return 0
}

# Tratamento de sinais
trap 'echo -e "\n"; log "Interrompido pelo usuário"; exit 0' INT TERM

# Executar
main "$@"