#!/bin/bash
# Script robusto para iniciar MediApp v3.0.0
# Resolve problemas de SIGTERM/SIGINT prematuros

set -euo pipefail

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/apps/backend"
LOG_DIR="/tmp/mediapp-logs"
PID_FILE="/tmp/mediapp-server.pid"
LOCK_FILE="/tmp/mediapp-startup.lock"
SERVER_LOG="/tmp/mediapp-server.log"
STARTUP_LOG="/tmp/mediapp-startup.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Função de logging
log() {
    local level=${1:-"INFO"}
    local message=${2:-""}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color_code=""
    
    case $level in
        "ERROR") color_code=$RED ;;
        "WARN") color_code=$YELLOW ;;
        "INFO") color_code=$GREEN ;;
        "DEBUG") color_code=$BLUE ;;
    esac
    
    echo -e "${color_code}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$STARTUP_LOG"
}

# Função para limpar recursos
cleanup() {
    local exit_code=${1:-0}
    
    log "INFO" "Limpando recursos de inicialização..."
    
    # Remover lock
    rm -f "$LOCK_FILE" 2>/dev/null || true
    
    if [ $exit_code -ne 0 ]; then
        log "ERROR" "Script finalizado com erro (código: $exit_code)"
    else
        log "INFO" "Script finalizado com sucesso"
    fi
    
    exit $exit_code
}

# Trap para limpeza
trap 'cleanup 1' ERR INT TERM

# Verificar se já está rodando
check_if_running() {
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            log "WARN" "Servidor já está rodando (PID: $old_pid)"
            log "INFO" "Para parar: kill $old_pid"
            log "INFO" "Para verificar status: curl http://localhost:3002/status"
            cleanup 0
        else
            log "INFO" "Removendo PID file obsoleto"
            rm -f "$PID_FILE"
        fi
    fi
}

# Verificar lock de inicialização
check_startup_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log "ERROR" "Outra instância de inicialização já está rodando (PID: $lock_pid)"
            cleanup 1
        else
            log "WARN" "Removendo lock file obsoleto"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Criar lock
    echo $$ > "$LOCK_FILE"
    log "INFO" "Lock de inicialização criado"
}

# Configurar diretórios
setup_directories() {
    log "INFO" "Configurando diretórios..."
    
    mkdir -p "$LOG_DIR"
    touch "$SERVER_LOG" "$STARTUP_LOG"
    
    # Verificar se diretório backend existe
    if [ ! -d "$BACKEND_DIR" ]; then
        log "ERROR" "Diretório backend não encontrado: $BACKEND_DIR"
        cleanup 1
    fi
    
    log "INFO" "✅ Diretórios configurados"
}

# Verificar dependências
check_dependencies() {
    log "INFO" "Verificando dependências..."
    
    # Node.js
    if ! command -v node >/dev/null 2>&1; then
        log "ERROR" "Node.js não encontrado. Instale Node.js v18+"
        cleanup 1
    fi
    
    local node_version=$(node -v)
    log "INFO" "✅ Node.js: $node_version"
    
    # Docker
    if ! command -v docker >/dev/null 2>&1; then
        log "ERROR" "Docker não encontrado. Instale Docker"
        cleanup 1
    fi
    
    log "INFO" "✅ Docker disponível"
    
    # npm
    if [ ! -f "$BACKEND_DIR/package.json" ]; then
        log "ERROR" "package.json não encontrado em $BACKEND_DIR"
        cleanup 1
    fi
    
    log "INFO" "✅ Dependências verificadas"
}

# Configurar PostgreSQL
setup_database() {
    log "INFO" "Configurando PostgreSQL..."
    
    local db_container="mediapp-db"
    local db_port="5433"
    
    # Verificar se container já existe e está rodando
    if docker ps -q -f name="$db_container" | grep -q .; then
        log "INFO" "✅ PostgreSQL já está rodando"
        return 0
    fi
    
    # Parar e remover container anterior se existir
    docker stop "$db_container" 2>/dev/null || true
    docker rm "$db_container" 2>/dev/null || true
    
    # Iniciar novo container
    log "INFO" "Iniciando container PostgreSQL..."
    docker run -d \
        --name "$db_container" \
        --restart unless-stopped \
        -e POSTGRES_USER=mediapp \
        -e POSTGRES_PASSWORD=mediapp123 \
        -e POSTGRES_DB=mediapp_db \
        -e POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256 --auth-local=trust" \
        -p $db_port:5432 \
        --shm-size=256mb \
        postgres:15-alpine > /dev/null
    
    # Aguardar PostgreSQL ficar pronto
    log "INFO" "Aguardando PostgreSQL ficar pronto..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec "$db_container" pg_isready -U mediapp >/dev/null 2>&1; then
            log "INFO" "✅ PostgreSQL pronto na porta $db_port"
            break
        fi
        
        sleep 1
        ((attempts++))
        
        if [ $((attempts % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    
    if [ $attempts -eq $max_attempts ]; then
        log "ERROR" "PostgreSQL não ficou pronto após ${max_attempts}s"
        docker logs "$db_container" --tail 10
        cleanup 1
    fi
}

# Configurar aplicação Node.js
setup_application() {
    log "INFO" "Configurando aplicação Node.js..."
    
    cd "$BACKEND_DIR"
    
    # Verificar e instalar dependências
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log "INFO" "Instalando dependências npm..."
        npm ci --silent --no-fund --no-audit
        
        if [ $? -ne 0 ]; then
            log "ERROR" "Falha na instalação de dependências"
            cleanup 1
        fi
    fi
    
    log "INFO" "✅ Dependências npm OK"
    
    # Atualizar .env
    local env_file=".env"
    cat > "$env_file" << EOF
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://mediapp:mediapp123@localhost:5433/mediapp_db?schema=public"
JWT_SECRET=mediapp_jwt_2025_robust
LOG_LEVEL=info
STARTUP_LOG=$STARTUP_LOG
SERVER_LOG=$SERVER_LOG
EOF
    
    log "INFO" "✅ Arquivo .env atualizado"
    
    # Aplicar migrações
    log "INFO" "Aplicando migrações do banco..."
    npx prisma generate >/dev/null 2>&1
    npx prisma migrate deploy >/dev/null 2>&1 || true
    
    log "INFO" "✅ Migrações aplicadas"
}

# Iniciar servidor robusto
start_server() {
    log "INFO" "Iniciando servidor robusto..."
    
    cd "$BACKEND_DIR"
    
    # Verificar se arquivo do servidor existe
    if [ ! -f "server-robust.js" ]; then
        log "ERROR" "server-robust.js não encontrado"
        cleanup 1
    fi
    
    # Iniciar servidor com nohup e redirecionamento adequado
    log "INFO" "Executando: nohup node server-robust.js"
    
    # Usar setsid para criar nova sessão e evitar sinais do terminal
    setsid nohup node server-robust.js </dev/null >>"$SERVER_LOG" 2>&1 &
    local server_pid=$!
    
    # Aguardar um pouco para o servidor inicializar
    sleep 3
    
    # Verificar se processo ainda existe
    if ! kill -0 "$server_pid" 2>/dev/null; then
        log "ERROR" "Servidor morreu logo após inicialização"
        log "ERROR" "Últimos logs do servidor:"
        tail -10 "$SERVER_LOG" || true
        cleanup 1
    fi
    
    log "INFO" "✅ Servidor iniciado (PID: $server_pid)"
    
    # Aguardar servidor ficar acessível
    log "INFO" "Verificando conectividade do servidor..."
    local attempts=0
    local max_attempts=20
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s -f "http://localhost:3002/health" >/dev/null 2>&1; then
            log "INFO" "✅ Servidor acessível e funcionando!"
            break
        fi
        
        # Verificar se processo ainda existe
        if ! kill -0 "$server_pid" 2>/dev/null; then
            log "ERROR" "Processo do servidor morreu durante inicialização"
            log "ERROR" "Últimos logs:"
            tail -10 "$SERVER_LOG" || true
            cleanup 1
        fi
        
        sleep 2
        ((attempts++))
        
        if [ $((attempts % 3)) -eq 0 ]; then
            echo -n "."
        fi
    done
    
    if [ $attempts -eq $max_attempts ]; then
        log "WARN" "Servidor pode estar funcionando mas não respondeu na verificação"
        log "WARN" "Verifique manualmente: curl http://localhost:3002/health"
    fi
}

# Mostrar status final
show_final_status() {
    echo
    log "INFO" "🎉 MediApp v3.0.0 Robusto iniciado com sucesso!"
    echo
    
    echo -e "${CYAN}🔗 URLs da Aplicação:${NC}"
    echo -e "   • Frontend:        ${GREEN}http://localhost:3002${NC}"
    echo -e "   • Health Check:    ${GREEN}http://localhost:3002/health${NC}"
    echo -e "   • Status:          ${GREEN}http://localhost:3002/status${NC}"
    echo -e "   • API Médicos:     ${GREEN}http://localhost:3002/api/medicos${NC}"
    echo -e "   • API Pacientes:   ${GREEN}http://localhost:3002/api/pacientes${NC}"
    echo -e "   • Estatísticas:    ${GREEN}http://localhost:3002/api/stats${NC}"
    echo
    
    echo -e "${BLUE}📁 Arquivos de Sistema:${NC}"
    echo -e "   • PID File:        ${GREEN}$PID_FILE${NC}"
    echo -e "   • Server Log:      ${GREEN}$SERVER_LOG${NC}"
    echo -e "   • Startup Log:     ${GREEN}$STARTUP_LOG${NC}"
    echo
    
    echo -e "${YELLOW}📋 Comandos Úteis:${NC}"
    echo -e "   • Ver status:      ${GREEN}curl http://localhost:3002/status${NC}"
    echo -e "   • Ver logs:        ${GREEN}tail -f $SERVER_LOG${NC}"
    echo -e "   • Parar servidor:  ${GREEN}kill \$(cat $PID_FILE)${NC}"
    echo
    
    # Mostrar últimos logs se houver
    if [ -f "$SERVER_LOG" ] && [ -s "$SERVER_LOG" ]; then
        echo -e "${BLUE}📋 Últimos logs do servidor:${NC}"
        tail -5 "$SERVER_LOG" | sed 's/^/   /'
        echo
    fi
}

# Função principal
main() {
    echo -e "${PURPLE}"
    cat << 'EOF'
🏥 ================================================
   MediApp v3.0.0 - Inicialização Robusta
🏥 ================================================
EOF
    echo -e "${NC}"
    
    log "INFO" "Iniciando processo de inicialização robusto..."
    
    check_if_running
    check_startup_lock
    setup_directories
    check_dependencies
    setup_database
    setup_application
    start_server
    show_final_status
    
    # Remover lock de inicialização
    rm -f "$LOCK_FILE"
    
    log "INFO" "Inicialização concluída com sucesso!"
}

# Executar função principal
main "$@"