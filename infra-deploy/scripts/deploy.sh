#!/bin/bash
# 🚀 MediApp - Script de Deploy Automatizado

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Configurações
ENVIRONMENT=${1:-development}
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
DEPLOY_DIR="/workspace/aplicativo"

log "🏥 MediApp - Deploy Automatizado"
log "📋 Ambiente: $ENVIRONMENT"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando. Inicie o Docker primeiro."
fi

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Função de backup do banco
backup_database() {
    log "💾 Fazendo backup do banco de dados..."
    
    # Verificar se container do postgres está rodando
    if docker ps | grep -q "mediapp-postgres"; then
        BACKUP_FILE="$BACKUP_DIR/mediapp_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker exec mediapp-postgres pg_dump -U mediapp mediapp_db > "$BACKUP_FILE" 2>/dev/null || {
            warn "Não foi possível fazer backup do banco (container pode estar iniciando)"
        }
        
        if [ -f "$BACKUP_FILE" ]; then
            log "✅ Backup criado: $BACKUP_FILE"
        fi
    else
        warn "Container PostgreSQL não encontrado. Pulando backup."
    fi
}

# Deploy baseado no ambiente
    case "$ENVIRONMENT" in
        "local"|"development")
            log "� Configurando ambiente de desenvolvimento/local..."
            COMPOSE_FILE="docker-compose.yml"
            APP_PORT=3002
            DB_NAME="mediapp_dev"
            REPLICAS=1
            ;;
        "staging")
            log "🚀 Configurando ambiente de staging..."
            COMPOSE_FILE="docker-compose.staging.yml"
            APP_PORT=3003
            DB_NAME="mediapp_staging"
            REPLICAS=2
            ;;
        "production")
            log "🏭 Configurando ambiente de produção..."
            COMPOSE_FILE="docker-compose.prod.yml"
            APP_PORT=3000
            DB_NAME="mediapp_prod"
            REPLICAS=3
            ;;
        *)
            error "Ambiente desconhecido: $ENVIRONMENT. Use: local, development, staging, ou production"
            ;;
    esac    *)
        error "Ambiente desconhecido: $ENVIRONMENT. Use: development, staging, ou production"
        ;;
esac

# Logs finais
log "📊 Status dos containers:"
docker-compose ps

log "🌐 Aplicação disponível em:"
case $ENVIRONMENT in
    "production")
        log "   • Frontend: http://localhost/ (ou https:// se SSL configurado)"
        log "   • Backend API: http://localhost/api/"
        log "   • Health Check: http://localhost/health"
        ;;
    *)
        log "   • Frontend: http://localhost/"
        log "   • Backend: http://localhost:3002/"
        log "   • Health Check: http://localhost:3002/health"
        log "   • Database: localhost:5432"
        ;;
esac

log "✅ Deploy concluído!"

# Comandos úteis
log ""
log "🔧 Comandos úteis:"
log "   • Ver logs: docker-compose logs -f"
log "   • Parar: docker-compose down"
log "   • Restart: docker-compose restart"
log "   • Shell backend: docker exec -it mediapp-backend sh"
log "   • Shell database: docker exec -it mediapp-postgres psql -U mediapp mediapp_db"