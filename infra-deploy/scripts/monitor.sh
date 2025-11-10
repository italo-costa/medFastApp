#!/bin/bash
# 📊 MediApp - Monitoramento e Métricas do Sistema

set -e

# Configurações
METRICS_DIR="./metrics"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_DB_CONN=80
LOG_FILE="$METRICS_DIR/monitoring_$(date +%Y%m%d).log"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Criar diretório de métricas
mkdir -p "$METRICS_DIR"

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
}

info() {
    local msg="[$(date +'%H:%M:%S')] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

alert() {
    local msg="[$(date +'%H:%M:%S')] 🚨 ALERT: $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
    
    # Salvar alertas em arquivo específico
    echo "$msg" >> "$METRICS_DIR/alerts_$(date +%Y%m%d).log"
}

show_help() {
    echo "📊 MediApp - Sistema de Monitoramento"
    echo ""
    echo "Uso:"
    echo "  $0 [OPÇÃO]"
    echo ""
    echo "Opções:"
    echo "  --status     Mostra status atual de todos os serviços"
    echo "  --metrics    Coleta e exibe métricas detalhadas"
    echo "  --health     Verifica saúde da aplicação"
    echo "  --logs       Exibe logs dos containers"
    echo "  --alerts     Mostra alertas ativos"
    echo "  --dashboard  Inicia dashboard interativo"
    echo "  --export     Exporta métricas para JSON"
    echo "  --help       Mostra esta ajuda"
    echo ""
}

get_container_stats() {
    local container_name="$1"
    
    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo "STOPPED"
        return 1
    fi
    
    # Obter estatísticas do container
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" "$container_name" 2>/dev/null
}

check_service_health() {
    local service_name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $service_name: HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: UNHEALTHY (HTTP $response)${NC}"
        return 1
    fi
}

get_database_stats() {
    if ! docker ps | grep -q "mediapp-postgres"; then
        echo "❌ PostgreSQL: STOPPED"
        return 1
    fi
    
    # Estatísticas do banco
    local db_stats=$(docker exec mediapp-postgres psql -U mediapp -d mediapp_db -t -c "
        SELECT 
            (SELECT COUNT(*) FROM medicos) as total_medicos,
            (SELECT COUNT(*) FROM pacientes) as total_pacientes,
            (SELECT COUNT(*) FROM exames) as total_exames,
            (SELECT COUNT(*) FROM prescricoes) as total_prescricoes,
            (SELECT pg_database_size('mediapp_db')) as db_size_bytes;
    " 2>/dev/null | tr -d ' ')
    
    if [ $? -eq 0 ]; then
        echo "$db_stats"
    else
        echo "ERROR"
    fi
}

get_system_metrics() {
    echo "📊 MÉTRICAS DO SISTEMA - $(date)"
    echo "=================================="
    
    # 1. Status dos Containers
    echo ""
    echo "🐳 STATUS DOS CONTAINERS:"
    echo "-------------------------"
    
    local containers=("mediapp-backend" "mediapp-postgres" "mediapp-nginx")
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            local uptime=$(docker inspect "$container" --format='{{.State.StartedAt}}' | xargs date -d)
            local status=$(docker inspect "$container" --format='{{.State.Status}}')
            echo -e "${GREEN}✅ $container${NC}: $status (desde $uptime)"
        else
            echo -e "${RED}❌ $container${NC}: STOPPED"
        fi
    done
    
    # 2. Recursos do Sistema
    echo ""
    echo "💻 RECURSOS DO SISTEMA:"
    echo "-----------------------"
    
    # CPU e Memória
    if command -v docker stats >/dev/null 2>&1; then
        echo "📈 Uso de recursos dos containers:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Erro ao obter estatísticas"
    fi
    
    # Espaço em disco
    echo ""
    echo "💾 Espaço em disco:"
    df -h . | tail -1 | awk '{
        usage = substr($5, 1, length($5)-1);
        if (usage > 90) 
            printf "\033[0;31m🔴 Disco: %s usado (%s livre)\033[0m\n", $5, $4;
        else if (usage > 75)
            printf "\033[0;33m🟡 Disco: %s usado (%s livre)\033[0m\n", $5, $4;
        else
            printf "\033[0;32m🟢 Disco: %s usado (%s livre)\033[0m\n", $5, $4;
    }'
    
    # 3. Saúde da Aplicação
    echo ""
    echo "🏥 SAÚDE DA APLICAÇÃO:"
    echo "---------------------"
    
    check_service_health "Backend API" "http://localhost:3002/health"
    check_service_health "Frontend" "http://localhost:3002/"
    
    # 4. Estatísticas do Banco de Dados
    echo ""
    echo "🗄️ ESTATÍSTICAS DO BANCO:"
    echo "------------------------"
    
    local db_stats=$(get_database_stats)
    if [ "$db_stats" != "ERROR" ] && [ "$db_stats" != "❌ PostgreSQL: STOPPED" ]; then
        echo "✅ PostgreSQL: CONECTADO"
        
        # Parse das estatísticas
        local medicos=$(echo "$db_stats" | head -1 | cut -d'|' -f1)
        local pacientes=$(echo "$db_stats" | head -1 | cut -d'|' -f2)
        local exames=$(echo "$db_stats" | head -1 | cut -d'|' -f3)
        local prescricoes=$(echo "$db_stats" | head -1 | cut -d'|' -f4)
        local db_size=$(echo "$db_stats" | head -1 | cut -d'|' -f5)
        
        echo "   • Médicos cadastrados: $medicos"
        echo "   • Pacientes cadastrados: $pacientes"
        echo "   • Exames realizados: $exames"
        echo "   • Prescrições emitidas: $prescricoes"
        echo "   • Tamanho do banco: $(numfmt --to=iec $db_size 2>/dev/null || echo "$db_size bytes")"
        
        # Verificar conexões ativas
        local connections=$(docker exec mediapp-postgres psql -U mediapp -d mediapp_db -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'mediapp_db';" 2>/dev/null | tr -d ' ')
        echo "   • Conexões ativas: $connections"
        
        if [ "$connections" -gt 50 ]; then
            alert "Muitas conexões ativas no banco: $connections"
        fi
    else
        echo "$db_stats"
    fi
    
    # 5. Logs Recentes
    echo ""
    echo "📋 LOGS RECENTES (últimas 5 linhas):"
    echo "------------------------------------"
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            echo ""
            echo "📄 $container:"
            docker logs --tail 5 "$container" 2>/dev/null | sed 's/^/   /' || echo "   Erro ao acessar logs"
        fi
    done
}

check_alerts() {
    local alerts_found=false
    
    echo "🚨 VERIFICAÇÃO DE ALERTAS"
    echo "========================"
    
    # Verificar uso de CPU dos containers
    for container in "mediapp-backend" "mediapp-postgres" "mediapp-nginx"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" 2>/dev/null | sed 's/%//')
            if [ -n "$cpu_usage" ] && [ "$(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l 2>/dev/null || echo 0)" -eq 1 ]; then
                alert "$container: Alto uso de CPU ($cpu_usage%)"
                alerts_found=true
            fi
        fi
    done
    
    # Verificar espaço em disco
    local disk_usage=$(df . | tail -1 | awk '{print substr($5, 1, length($5)-1)}')
    if [ "$disk_usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
        alert "Espaço em disco baixo: $disk_usage%"
        alerts_found=true
    fi
    
    # Verificar se serviços estão rodando
    if ! docker ps | grep -q "mediapp-backend"; then
        alert "Container mediapp-backend não está rodando"
        alerts_found=true
    fi
    
    if ! docker ps | grep -q "mediapp-postgres"; then
        alert "Container mediapp-postgres não está rodando"
        alerts_found=true
    fi
    
    # Verificar conectividade da API
    if ! curl -s http://localhost:3002/health >/dev/null; then
        alert "API não está respondendo em http://localhost:3002/health"
        alerts_found=true
    fi
    
    if [ "$alerts_found" = false ]; then
        echo -e "${GREEN}✅ Nenhum alerta ativo${NC}"
    fi
}

export_metrics() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local export_file="$METRICS_DIR/metrics_$(date +%Y%m%d_%H%M%S).json"
    
    log "📤 Exportando métricas para: $export_file"
    
    # Coletar métricas em formato JSON
    cat > "$export_file" << EOF
{
    "timestamp": "$timestamp",
    "mediapp_version": "3.0.0",
    "system": {
        "hostname": "$(hostname)",
        "uptime": "$(uptime -p 2>/dev/null || echo 'N/A')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | trim 2>/dev/null || echo 'N/A')"
    },
    "containers": {
EOF

    local first_container=true
    for container in "mediapp-backend" "mediapp-postgres" "mediapp-nginx"; do
        if ! $first_container; then
            echo "," >> "$export_file"
        fi
        first_container=false
        
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            local cpu=$(docker stats --no-stream --format "{{.CPUPerc}}" "$container" 2>/dev/null | sed 's/%//' || echo "0")
            local mem=$(docker stats --no-stream --format "{{.MemPerc}}" "$container" 2>/dev/null | sed 's/%//' || echo "0")
            local status="running"
        else
            local cpu="0"
            local mem="0" 
            local status="stopped"
        fi
        
        cat >> "$export_file" << EOF
        "$container": {
            "status": "$status",
            "cpu_percent": $cpu,
            "memory_percent": $mem
        }
EOF
    done
    
    # Adicionar estatísticas do banco
    local db_stats=$(get_database_stats)
    if [ "$db_stats" != "ERROR" ] && [ "$db_stats" != "❌ PostgreSQL: STOPPED" ]; then
        local medicos=$(echo "$db_stats" | head -1 | cut -d'|' -f1 | tr -d ' ')
        local pacientes=$(echo "$db_stats" | head -1 | cut -d'|' -f2 | tr -d ' ')
        local exames=$(echo "$db_stats" | head -1 | cut -d'|' -f3 | tr -d ' ')
        local prescricoes=$(echo "$db_stats" | head -1 | cut -d'|' -f4 | tr -d ' ')
    else
        local medicos=0 pacientes=0 exames=0 prescricoes=0
    fi
    
    cat >> "$export_file" << EOF
    },
    "database": {
        "medicos": $medicos,
        "pacientes": $pacientes,
        "exames": $exames,
        "prescricoes": $prescricoes
    },
    "health_checks": {
        "api_health": $(curl -s http://localhost:3002/health >/dev/null && echo 'true' || echo 'false'),
        "frontend": $(curl -s http://localhost:3002/ >/dev/null && echo 'true' || echo 'false')
    }
}
EOF
    
    log "✅ Métricas exportadas com sucesso"
}

interactive_dashboard() {
    clear
    echo -e "${PURPLE}🎛️  MediApp - Dashboard Interativo${NC}"
    echo "=================================="
    
    while true; do
        echo ""
        echo "Escolha uma opção:"
        echo "1. 📊 Ver métricas atuais"
        echo "2. 🚨 Verificar alertas"
        echo "3. 🏥 Status dos serviços"
        echo "4. 📋 Ver logs dos containers"
        echo "5. 📤 Exportar métricas"
        echo "6. 🔄 Atualizar (F5)"
        echo "0. ❌ Sair"
        echo ""
        read -p "Opção [0-6]: " choice
        
        case $choice in
            1)
                clear
                get_system_metrics
                ;;
            2)
                clear
                check_alerts
                ;;
            3)
                clear
                echo "🔍 STATUS DOS SERVIÇOS:"
                echo "====================="
                docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                ;;
            4)
                clear
                echo "📋 LOGS DOS CONTAINERS:"
                echo "====================="
                for container in "mediapp-backend" "mediapp-postgres" "mediapp-nginx"; do
                    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                        echo ""
                        echo "--- $container ---"
                        docker logs --tail 10 "$container" 2>/dev/null
                    fi
                done
                ;;
            5)
                export_metrics
                ;;
            6)
                clear
                echo -e "${BLUE}🔄 Atualizando dashboard...${NC}"
                sleep 1
                ;;
            0)
                echo "👋 Saindo do dashboard..."
                break
                ;;
            *)
                echo "❌ Opção inválida"
                ;;
        esac
        
        if [ "$choice" != "6" ] && [ "$choice" != "0" ]; then
            echo ""
            read -p "Pressione ENTER para continuar..."
        fi
    done
}

# Função principal
main() {
    case "${1:---status}" in
        "--help"|"-h")
            show_help
            ;;
        "--metrics"|"-m")
            get_system_metrics
            ;;
        "--health")
            echo "🏥 VERIFICAÇÃO DE SAÚDE"
            echo "======================"
            check_service_health "Backend API" "http://localhost:3002/health"
            check_service_health "Frontend" "http://localhost:3002/"
            ;;
        "--logs"|"-l")
            echo "📋 LOGS DOS CONTAINERS"
            echo "====================="
            for container in "mediapp-backend" "mediapp-postgres" "mediapp-nginx"; do
                if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                    echo ""
                    echo "--- $container ---"
                    docker logs --tail 20 "$container" 2>/dev/null
                fi
            done
            ;;
        "--alerts"|"-a")
            check_alerts
            ;;
        "--dashboard"|"-d")
            interactive_dashboard
            ;;
        "--export"|"-e")
            export_metrics
            ;;
        "--status"|"-s"|*)
            echo "📊 STATUS RÁPIDO - $(date)"
            echo "========================="
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep mediapp || echo "Nenhum container MediApp rodando"
            echo ""
            check_service_health "API Health" "http://localhost:3002/health"
            check_service_health "Frontend" "http://localhost:3002/"
            ;;
    esac
}

# Executar função principal
main "$@"