#!/bin/bash
# Sistema de Monitoramento MediApp v3.0.0
# Monitora todos os componentes da aplicação

set -euo pipefail

# Configurações
MONITORING_LOG="/tmp/mediapp-monitoring.log"
ALERT_LOG="/tmp/mediapp-alerts.log"
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Função de logging
log_monitor() {
    local level=${1:-"INFO"}
    local component=${2:-"SYSTEM"}
    local message=${3:-""}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] [$component] $message" | tee -a "$MONITORING_LOG"
}

# Função de alerta
alert() {
    local component=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${RED}🚨 ALERT: [$component] $message${NC}"
    echo "[$timestamp] [ALERT] [$component] $message" >> "$ALERT_LOG"
}

# Verificar PostgreSQL
check_postgresql() {
    local status="HEALTHY"
    local message=""
    
    if docker ps | grep -q "mediapp-db"; then
        if docker exec mediapp-db pg_isready -U mediapp >/dev/null 2>&1; then
            message="PostgreSQL rodando e aceitando conexões"
            log_monitor "INFO" "POSTGRES" "$message"
        else
            status="UNHEALTHY"
            message="PostgreSQL rodando mas não aceitando conexões"
            alert "POSTGRES" "$message"
        fi
    else
        status="DOWN"
        message="Container PostgreSQL não está rodando"
        alert "POSTGRES" "$message"
    fi
    
    echo "$status"
}

# Verificar Backend
check_backend() {
    local status="HEALTHY"
    local message=""
    local pid_file="/tmp/mediapp-server.pid"
    
    # Verificar se PID file existe
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        # Verificar se processo está rodando
        if kill -0 "$pid" 2>/dev/null; then
            # Verificar se responde a requisições HTTP
            if curl -s -f "http://localhost:3002/health" >/dev/null 2>&1; then
                message="Backend rodando e respondendo (PID: $pid)"
                log_monitor "INFO" "BACKEND" "$message"
            else
                status="UNHEALTHY"
                message="Backend rodando mas não respondendo HTTP (PID: $pid)"
                alert "BACKEND" "$message"
            fi
        else
            status="DOWN"
            message="Processo backend morreu (PID: $pid)"
            alert "BACKEND" "$message"
        fi
    else
        status="DOWN"
        message="Backend não iniciado - PID file não encontrado"
        alert "BACKEND" "$message"
    fi
    
    echo "$status"
}

# Verificar Frontend
check_frontend() {
    local status="HEALTHY"
    local message=""
    
    # Verificar se arquivos estáticos existem
    if [ -d "apps/backend/public" ] && [ -f "apps/backend/public/index.html" ]; then
        # Verificar se frontend é acessível via backend
        if curl -s -f "http://localhost:3002/" >/dev/null 2>&1; then
            message="Frontend acessível via backend"
            log_monitor "INFO" "FRONTEND" "$message"
        else
            status="UNHEALTHY"
            message="Frontend não acessível"
            alert "FRONTEND" "$message"
        fi
    else
        status="DOWN"
        message="Arquivos do frontend não encontrados"
        alert "FRONTEND" "$message"
    fi
    
    echo "$status"
}

# Verificar recursos do sistema
check_system_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}' || echo "0")
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1 || echo "0")
    
    log_monitor "INFO" "SYSTEM" "CPU: ${cpu_usage}% | Memory: ${memory_usage}% | Disk: ${disk_usage}%"
    
    # Alertas de recursos
    if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        alert "SYSTEM" "High CPU usage: ${cpu_usage}%"
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        alert "SYSTEM" "High memory usage: ${memory_usage}%"
    fi
    
    if [ "$disk_usage" -gt 80 ]; then
        alert "SYSTEM" "High disk usage: ${disk_usage}%"
    fi
}

# Tentar reiniciar serviço
restart_service() {
    local service=$1
    local restart_file="/tmp/mediapp-${service}-restarts"
    
    # Contar tentativas de restart
    local attempts=0
    if [ -f "$restart_file" ]; then
        attempts=$(cat "$restart_file")
    fi
    
    if [ "$attempts" -ge "$MAX_RESTART_ATTEMPTS" ]; then
        alert "$service" "Max restart attempts reached ($MAX_RESTART_ATTEMPTS). Manual intervention required."
        return 1
    fi
    
    log_monitor "WARN" "$service" "Attempting automatic restart (attempt $((attempts + 1)))"
    
    case $service in
        "postgres")
            docker start mediapp-db >/dev/null 2>&1 || docker run -d --name mediapp-db -e POSTGRES_USER=mediapp -e POSTGRES_PASSWORD=mediapp123 -e POSTGRES_DB=mediapp_db -p 5433:5432 postgres:15-alpine
            ;;
        "backend")
            cd /mnt/c/workspace/aplicativo/apps/backend
            nohup node server-robust.js >/dev/null 2>&1 &
            ;;
    esac
    
    # Incrementar contador de restarts
    echo $((attempts + 1)) > "$restart_file"
    
    # Aguardar um pouco antes de verificar novamente
    sleep 10
}

# Gerar relatório de status
generate_status_report() {
    local postgres_status=$(check_postgresql)
    local backend_status=$(check_backend)
    local frontend_status=$(check_frontend)
    
    cat > /tmp/mediapp-status-report.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "overall_status": "$([ "$postgres_status" = "HEALTHY" ] && [ "$backend_status" = "HEALTHY" ] && [ "$frontend_status" = "HEALTHY" ] && echo "HEALTHY" || echo "UNHEALTHY")",
  "components": {
    "postgresql": "$postgres_status",
    "backend": "$backend_status",
    "frontend": "$frontend_status"
  },
  "urls": {
    "health_check": "http://localhost:3002/health",
    "main_app": "http://localhost:3002/",
    "api_status": "http://localhost:3002/status"
  },
  "monitoring": {
    "log_file": "$MONITORING_LOG",
    "alert_file": "$ALERT_LOG",
    "check_interval": "${HEALTH_CHECK_INTERVAL}s"
  }
}
EOF
}

# Função de monitoramento contínuo
continuous_monitoring() {
    log_monitor "INFO" "MONITOR" "Starting continuous monitoring (interval: ${HEALTH_CHECK_INTERVAL}s)"
    
    while true; do
        echo -e "${CYAN}🔍 Health Check - $(date)${NC}"
        
        # Verificar PostgreSQL
        local postgres_status=$(check_postgresql)
        if [ "$postgres_status" != "HEALTHY" ]; then
            restart_service "postgres"
        fi
        
        # Verificar Backend
        local backend_status=$(check_backend)
        if [ "$backend_status" != "HEALTHY" ]; then
            restart_service "backend"
        fi
        
        # Verificar Frontend
        local frontend_status=$(check_frontend)
        
        # Verificar recursos do sistema
        check_system_resources
        
        # Gerar relatório
        generate_status_report
        
        # Mostrar status resumido
        echo -e "PostgreSQL: $([ "$postgres_status" = "HEALTHY" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}") | Backend: $([ "$backend_status" = "HEALTHY" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}") | Frontend: $([ "$frontend_status" = "HEALTHY" ] && echo "${GREEN}✅${NC}" || echo "${RED}❌${NC}")"
        
        sleep "$HEALTH_CHECK_INTERVAL"
    done
}

# Função de verificação única
single_check() {
    echo -e "${PURPLE}🏥 MediApp v3.0.0 - Health Check${NC}"
    echo "================================"
    
    local postgres_status=$(check_postgresql)
    local backend_status=$(check_backend)
    local frontend_status=$(check_frontend)
    
    echo -e "PostgreSQL: $([ "$postgres_status" = "HEALTHY" ] && echo "${GREEN}✅ $postgres_status${NC}" || echo "${RED}❌ $postgres_status${NC}")"
    echo -e "Backend:    $([ "$backend_status" = "HEALTHY" ] && echo "${GREEN}✅ $backend_status${NC}" || echo "${RED}❌ $backend_status${NC}")"
    echo -e "Frontend:   $([ "$frontend_status" = "HEALTHY" ] && echo "${GREEN}✅ $frontend_status${NC}" || echo "${RED}❌ $frontend_status${NC}")"
    
    check_system_resources
    generate_status_report
    
    echo ""
    echo -e "${BLUE}📊 Status Report: /tmp/mediapp-status-report.json${NC}"
    echo -e "${BLUE}📋 Monitoring Log: $MONITORING_LOG${NC}"
    echo -e "${BLUE}🚨 Alert Log: $ALERT_LOG${NC}"
}

# Mostrar ajuda
show_help() {
    cat << EOF
🏥 MediApp v3.0.0 - Sistema de Monitoramento

COMANDOS:
  monitor           Monitoramento contínuo
  check             Verificação única de saúde
  status            Status atual dos componentes
  logs              Mostrar logs de monitoramento
  alerts            Mostrar alertas
  report            Gerar relatório JSON
  help              Mostrar esta ajuda

EXEMPLOS:
  $0 monitor        # Iniciar monitoramento contínuo
  $0 check          # Verificação rápida
  $0 status         # Status atual
  $0 logs           # Ver últimos logs
EOF
}

# Função principal
main() {
    local command=${1:-"check"}
    
    case $command in
        "monitor"|"continuous")
            continuous_monitoring
            ;;
        "check"|"health")
            single_check
            ;;
        "status")
            generate_status_report
            cat /tmp/mediapp-status-report.json | python3 -m json.tool 2>/dev/null || cat /tmp/mediapp-status-report.json
            ;;
        "logs")
            echo -e "${BLUE}📋 Últimos logs de monitoramento:${NC}"
            tail -20 "$MONITORING_LOG" 2>/dev/null || echo "Nenhum log encontrado"
            ;;
        "alerts")
            echo -e "${RED}🚨 Alertas recentes:${NC}"
            tail -10 "$ALERT_LOG" 2>/dev/null || echo "Nenhum alerta encontrado"
            ;;
        "report")
            generate_status_report
            echo "Relatório gerado: /tmp/mediapp-status-report.json"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando não reconhecido: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"