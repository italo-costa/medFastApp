#!/bin/bash
# 🐘 PostgreSQL Troubleshooter para MediApp

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; }

echo -e "${BLUE}"
cat << 'EOF'
🐘 ==========================================
   PostgreSQL Troubleshooter v1.0
🐘 ==========================================
EOF
echo -e "${NC}"

# Função para limpar containers órfãos
cleanup_containers() {
    log "Limpando containers PostgreSQL órfãos..."
    
    # Parar containers com nome mediapp-db
    docker stop mediapp-db 2>/dev/null || true
    docker rm mediapp-db 2>/dev/null || true
    
    # Remover containers PostgreSQL órfãos
    local orphan_containers=$(docker ps -a | grep postgres | awk '{print $1}')
    if [ -n "$orphan_containers" ]; then
        echo "$orphan_containers" | xargs -r docker rm -f
        log "Containers órfãos removidos"
    fi
}

# Função para verificar portas
check_ports() {
    log "Verificando portas PostgreSQL..."
    
    # Verificar porta 5432
    if lsof -i :5432 >/dev/null 2>&1; then
        warn "Porta 5432 em uso:"
        lsof -i :5432 2>/dev/null || echo "  Processo não identificado"
    else
        log "Porta 5432 disponível"
    fi
    
    # Verificar porta 5433
    if lsof -i :5433 >/dev/null 2>&1; then
        warn "Porta 5433 em uso:"
        lsof -i :5433 2>/dev/null || echo "  Processo não identificado"
    else
        log "Porta 5433 disponível"
    fi
}

# Função para encontrar porta livre
find_free_port() {
    local start_port=5433
    local port=$start_port
    
    while [ $port -lt 5450 ]; do
        if ! lsof -i :$port >/dev/null 2>&1; then
            echo $port
            return
        fi
        ((port++))
    done
    
    echo "5439"  # Fallback
}

# Função para iniciar PostgreSQL com retry
start_postgres() {
    local max_attempts=3
    local port=${1:-5433}
    
    log "Tentando iniciar PostgreSQL na porta $port..."
    
    for attempt in $(seq 1 $max_attempts); do
        log "Tentativa $attempt de $max_attempts..."
        
        # Tentar iniciar container
        local container_id=$(docker run -d \
            --name mediapp-db \
            --restart unless-stopped \
            -e POSTGRES_USER=mediapp \
            -e POSTGRES_PASSWORD=mediapp123 \
            -e POSTGRES_DB=mediapp_db \
            -e POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256 --auth-local=trust" \
            -p $port:5432 \
            --memory=1g \
            --shm-size=256mb \
            postgres:15-alpine \
            postgres -c 'max_connections=200' -c 'shared_buffers=256MB' 2>/dev/null)
        
        if [ -n "$container_id" ]; then
            log "Container iniciado: $container_id"
            
            # Aguardar inicialização
            log "Aguardando PostgreSQL ficar pronto..."
            local ready=false
            
            for i in {1..30}; do
                if docker exec mediapp-db pg_isready -U mediapp >/dev/null 2>&1; then
                    ready=true
                    break
                fi
                sleep 1
                echo -n "."
            done
            echo
            
            if $ready; then
                log "✅ PostgreSQL pronto na porta $port!"
                
                # Testar conexão externa
                if timeout 3 bash -c "</dev/tcp/localhost/$port" 2>/dev/null; then
                    log "✅ Conexão externa funcionando!"
                    return 0
                else
                    warn "Conexão interna OK, mas externa falhou"
                fi
                
                return 0
            else
                error "PostgreSQL não ficou pronto após 30s"
                docker logs mediapp-db --tail 5
                docker stop mediapp-db 2>/dev/null || true
                docker rm mediapp-db 2>/dev/null || true
            fi
        else
            error "Falha ao iniciar container"
        fi
        
        sleep 2
    done
    
    return 1
}

# Função para atualizar .env
update_env() {
    local port=$1
    local backend_dir="/mnt/c/workspace/aplicativo/apps/backend"
    local env_file="$backend_dir/.env"
    
    if [ -f "$env_file" ]; then
        log "Atualizando .env para porta $port..."
        sed -i "s/localhost:[0-9]*/localhost:$port/" "$env_file"
        log "✅ .env atualizado"
    else
        warn ".env não encontrado em $env_file"
    fi
}

# Menu principal
case "${1:-auto}" in
    "auto"|"-a")
        cleanup_containers
        check_ports
        
        # Tentar porta 5433 primeiro
        if start_postgres 5433; then
            update_env 5433
        else
            # Se falhar, encontrar porta livre
            warn "Porta 5433 falhou, procurando porta livre..."
            local free_port=$(find_free_port)
            log "Tentando porta $free_port..."
            
            if start_postgres $free_port; then
                update_env $free_port
            else
                error "❌ Falha ao iniciar PostgreSQL em qualquer porta"
                exit 1
            fi
        fi
        ;;
    "cleanup"|"-c")
        cleanup_containers
        log "✅ Limpeza concluída"
        ;;
    "check"|"-k")
        check_ports
        ;;
    "test"|"-t")
        if docker ps | grep -q mediapp-db; then
            log "Container está rodando"
            docker exec mediapp-db pg_isready -U mediapp
            log "Status da conexão externa:"
            timeout 3 bash -c "</dev/tcp/localhost/5433" && log "✅ OK" || warn "❌ Falhou"
        else
            error "Container não está rodando"
        fi
        ;;
    "logs"|"-l")
        docker logs mediapp-db --tail 20
        ;;
    "help"|"-h")
        echo "🐘 PostgreSQL Troubleshooter"
        echo ""
        echo "Comandos:"
        echo "  auto, -a      Inicialização automática (padrão)"
        echo "  cleanup, -c   Limpar containers órfãos"
        echo "  check, -k     Verificar status das portas"
        echo "  test, -t      Testar conexão"
        echo "  logs, -l      Ver logs do container"
        echo "  help, -h      Mostrar ajuda"
        echo ""
        ;;
    *)
        echo "Comando inválido. Use 'help' para ver opções."
        exit 1
        ;;
esac