#!/bin/bash
# 🚀 MediApp - Script de Deploy Simplificado v2

set -e

# Configurações
ENVIRONMENT=${1:-local}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy_${ENVIRONMENT}_${TIMESTAMP}.log"
BACKUP_DIR="./backups"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

warn() {
    local msg="[$(date +'%H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

error() {
    local msg="[$(date +'%H:%M:%S')] ERROR: $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
    exit 1
}

info() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

show_help() {
    echo "🚀 MediApp - Deploy Script"
    echo ""
    echo "Uso:"
    echo "  $0 [ambiente]"
    echo ""
    echo "Ambientes:"
    echo "  local        Deploy Docker local (padrão)"
    echo "  development  Deploy desenvolvimento"
    echo "  staging      Deploy staging"
    echo "  production   Deploy produção"
    echo ""
    echo "Exemplos:"
    echo "  $0 local"
    echo "  $0 production"
}

check_prerequisites() {
    log "🔍 Verificando pré-requisitos..."
    
    # Verificar Docker
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker não está instalado"
    fi
    
    # Verificar Docker Compose
    if ! docker compose version >/dev/null 2>&1 && ! docker-compose --version >/dev/null 2>&1; then
        error "Docker Compose não está disponível"
    fi
    
    # Definir comando do compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    log "✅ Pré-requisitos verificados"
}

configure_environment() {
    log "⚙️ Configurando ambiente: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        "local"|"development")
            APP_PORT=3002
            DB_NAME="mediapp_db"
            LOG_LEVEL="debug"
            ;;
        "staging")
            APP_PORT=3003
            DB_NAME="mediapp_staging"
            LOG_LEVEL="info"
            ;;
        "production")
            APP_PORT=3000
            DB_NAME="mediapp_prod"
            LOG_LEVEL="warn"
            ;;
        *)
            error "Ambiente '$ENVIRONMENT' não suportado. Use: local, development, staging, production"
            ;;
    esac
    
    export NODE_ENV=$ENVIRONMENT
    export PORT=$APP_PORT
    export DATABASE_NAME=$DB_NAME
    export LOG_LEVEL=$LOG_LEVEL
    
    log "✅ Ambiente configurado - Porta: $APP_PORT"
}

backup_if_exists() {
    if docker ps | grep -q "mediapp-postgres"; then
        log "💾 Fazendo backup de segurança..."
        mkdir -p "$BACKUP_DIR"
        
        local backup_file="$BACKUP_DIR/pre_deploy_${TIMESTAMP}.sql"
        docker exec mediapp-postgres pg_dump -U mediapp -d mediapp_db > "$backup_file" 2>/dev/null || warn "Backup falhou"
        
        if [ -f "$backup_file" ]; then
            log "✅ Backup salvo: $(basename $backup_file)"
        fi
    fi
}

find_compose_file() {
    # Procurar docker-compose.yml
    if [ -f "../apps/backend/docker-compose.yml" ]; then
        COMPOSE_PATH="../apps/backend"
        log "📋 Encontrado compose em: $COMPOSE_PATH"
    elif [ -f "docker/docker-compose.yml" ]; then
        COMPOSE_PATH="docker"
        log "📋 Encontrado compose em: $COMPOSE_PATH"
    elif [ -f "docker-compose.yml" ]; then
        COMPOSE_PATH="."
        log "📋 Encontrado compose no diretório atual"
    else
        error "Arquivo docker-compose.yml não encontrado"
    fi
}

deploy_docker() {
    log "🐳 Iniciando deploy Docker..."
    
    find_compose_file
    
    cd "$COMPOSE_PATH" || error "Erro ao acessar $COMPOSE_PATH"
    
    # Parar containers existentes
    log "🛑 Parando containers existentes..."
    $COMPOSE_CMD down || warn "Erro ao parar containers"
    
    # Limpar volumes órfãos
    log "🧹 Limpando recursos órfãos..."
    docker system prune -f --volumes || warn "Erro na limpeza"
    
    # Build das imagens
    log "🏗️ Fazendo build das imagens..."
    $COMPOSE_CMD build --no-cache || error "Erro no build"
    
    # Subir containers
    log "🚀 Iniciando containers..."
    $COMPOSE_CMD up -d || error "Erro ao iniciar containers"
    
    # Aguardar inicialização
    log "⏳ Aguardando inicialização dos serviços..."
    sleep 15
    
    log "✅ Deploy Docker concluído"
}

run_health_checks() {
    log "🏥 Executando health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Verificar se containers estão rodando
    log "📊 Status dos containers:"
    cd "$COMPOSE_PATH" 2>/dev/null || true
    $COMPOSE_CMD ps || docker ps
    
    # Tentar conectar na API
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$APP_PORT/health" >/dev/null 2>&1; then
            log "✅ API respondendo em http://localhost:$APP_PORT"
            break
        elif [ $attempt -eq $max_attempts ]; then
            error "API não está respondendo após $max_attempts tentativas"
        else
            info "Tentativa $attempt/$max_attempts - Aguardando API..."
            sleep 2
            ((attempt++))
        fi
    done
    
    # Verificar banco de dados
    if docker ps | grep -q "postgres"; then
        if docker exec -it $(docker ps --format "{{.Names}}" | grep postgres | head -1) pg_isready -U mediapp >/dev/null 2>&1; then
            log "✅ Banco de dados conectado"
        else
            warn "Banco de dados não está pronto"
        fi
    fi
    
    # Teste de conectividade frontend
    if curl -s "http://localhost:$APP_PORT/" >/dev/null 2>&1; then
        log "✅ Frontend acessível"
    else
        warn "Frontend não está acessível"
    fi
}

show_deployment_info() {
    log ""
    log "📊 RESUMO DO DEPLOY"
    log "=================="
    log "• Ambiente: $ENVIRONMENT"
    log "• Porta: $APP_PORT"
    log "• Log: $LOG_FILE"
    log "• Timestamp: $TIMESTAMP"
    log ""
    log "🌐 URLs disponíveis:"
    log "   • Frontend: http://localhost:$APP_PORT"
    log "   • API Health: http://localhost:$APP_PORT/health"
    log "   • API Docs: http://localhost:$APP_PORT/api-docs"
    log ""
    log "🐳 Containers ativos:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mediapp|postgres)" || echo "   Nenhum container encontrado"
    log ""
    log "🎯 Comandos úteis:"
    log "   • Ver logs: docker logs -f <container_name>"
    log "   • Parar: $COMPOSE_CMD down"
    log "   • Monitorar: ./scripts/monitor.sh --dashboard"
    log ""
}

# Função principal
main() {
    case "${1:-}" in
        "--help"|"-h")
            show_help
            exit 0
            ;;
    esac
    
    log "🚀 MediApp - Deploy Automatizado v2"
    log "📅 Iniciado em: $(date)"
    log "🎯 Ambiente: $ENVIRONMENT"
    log "📝 Log: $LOG_FILE"
    
    check_prerequisites
    configure_environment
    backup_if_exists
    deploy_docker
    run_health_checks
    show_deployment_info
    
    log "✅ Deploy concluído com sucesso!"
    log "🎉 MediApp está rodando em http://localhost:$APP_PORT"
}

# Executar função principal
main "$@"