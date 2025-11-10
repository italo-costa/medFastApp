#!/bin/bash
# 🔄 MediApp - Monitor Nativo v3.0.0

GREEN='\033[0;32m'
YELLOW='\033[0;33m'  
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
success() { echo -e "${PURPLE}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }

clear
echo -e "${PURPLE}"
cat << 'EOF'
🏥 ==========================================
   MediApp v3.0.0 - Monitor em Tempo Real
🏥 ==========================================
EOF
echo -e "${NC}"

# Função para verificar status do servidor
check_server() {
    local pid_file="/tmp/mediapp.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            return 0  # Servidor rodando
        else
            return 1  # PID não existe
        fi
    else
        return 1  # Arquivo PID não existe
    fi
}

# Função para obter estatísticas
get_stats() {
    local backend_dir="/mnt/c/workspace/aplicativo/apps/backend"
    cd "$backend_dir"
    
    # Status do servidor
    if check_server; then
        local pid=$(cat /tmp/mediapp.pid)
        echo -e "${GREEN}✅ Servidor MediApp: RODANDO (PID: $pid)${NC}"
        
        # CPU e Memória do processo
        if command -v ps >/dev/null 2>&1; then
            local cpu_mem=$(ps -p $pid -o %cpu,%mem --no-headers 2>/dev/null || echo "N/A N/A")
            echo -e "${BLUE}📊 CPU: $(echo $cpu_mem | awk '{print $1}')% | Memória: $(echo $cpu_mem | awk '{print $2}')%${NC}"
        fi
        
        # Verificar conectividade
        if timeout 3 bash -c "</dev/tcp/localhost/3002" 2>/dev/null; then
            echo -e "${GREEN}🌐 Porta 3002: ACESSÍVEL${NC}"
        else
            echo -e "${RED}❌ Porta 3002: INACESSÍVEL${NC}"
        fi
        
        # Status do banco
        if docker ps | grep -q "mediapp-db"; then
            echo -e "${GREEN}🐘 PostgreSQL: RODANDO (Docker)${NC}"
        else
            echo -e "${YELLOW}⚠️ PostgreSQL: NÃO DETECTADO${NC}"
        fi
        
        # Últimos logs
        echo -e "${BLUE}📋 Últimos logs:${NC}"
        if [ -f "logs/server.log" ]; then
            tail -3 logs/server.log | sed 's/^/   /'
        else
            echo "   Arquivo de log não encontrado"
        fi
        
    else
        echo -e "${RED}❌ Servidor MediApp: PARADO${NC}"
        
        # Verificar se processo existe na porta
        local port_proc=$(lsof -ti:3002 2>/dev/null || echo "")
        if [ -n "$port_proc" ]; then
            echo -e "${YELLOW}⚠️ Porta 3002 ocupada por PID: $port_proc${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🔗 URLs da Aplicação:${NC}"
    echo -e "   • Frontend: ${GREEN}http://localhost:3002${NC}"
    echo -e "   • Health: ${GREEN}http://localhost:3002/health${NC}"
    echo -e "   • API Médicos: ${GREEN}http://localhost:3002/api/medicos${NC}"
    echo -e "   • API Pacientes: ${GREEN}http://localhost:3002/api/pacientes${NC}"
    echo ""
    
    # Arquivos importantes
    echo -e "${BLUE}📁 Status dos Arquivos:${NC}"
    local files=("logs/server.log" ".env" "src/app.js")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local size=$(ls -lh "$file" | awk '{print $5}')
            echo -e "   ✅ $file ($size)"
        else
            echo -e "   ❌ $file (não encontrado)"
        fi
    done
}

# Função para manter aplicação viva
keep_alive() {
    while true; do
        if ! check_server; then
            warn "Servidor parado! Tentando reiniciar..."
            
            cd /mnt/c/workspace/aplicativo/apps/backend
            
            # Verificar se banco está rodando
            if ! docker ps | grep -q "mediapp-db"; then
                log "Reiniciando banco de dados..."
                docker run -d \
                  --name mediapp-db \
                  --rm \
                  -e POSTGRES_USER=mediapp \
                  -e POSTGRES_PASSWORD=mediapp123 \
                  -e POSTGRES_DB=mediapp_db \
                  -p 5433:5432 \
                  postgres:15-alpine >/dev/null 2>&1
                
                sleep 5
            fi
            
            # Reiniciar servidor
            log "Reiniciando servidor..."
            nohup node src/app.js > logs/server.log 2>&1 &
            echo $! > /tmp/mediapp.pid
            
            sleep 3
            
            if check_server; then
                success "Servidor reiniciado com sucesso!"
            else
                warn "Falha ao reiniciar servidor"
            fi
        fi
        
        sleep 10
    done
}

# Menu principal
case "${1:-status}" in
    "status"|"-s")
        get_stats
        ;;
    "monitor"|"-m")
        log "Iniciando monitoramento contínuo..."
        while true; do
            clear
            echo -e "${PURPLE}🏥 MediApp v3.0.0 - Monitor ($(date))${NC}"
            echo "================================"
            get_stats
            echo -e "${YELLOW}Atualizando a cada 5 segundos... (Ctrl+C para sair)${NC}"
            sleep 5
        done
        ;;
    "keepalive"|"-k")
        log "Iniciando modo Keep-Alive..."
        keep_alive
        ;;
    "restart"|"-r")
        log "Reiniciando aplicação..."
        if check_server; then
            local pid=$(cat /tmp/mediapp.pid)
            kill $pid 2>/dev/null || true
        fi
        
        cd /mnt/c/workspace/aplicativo/apps/backend
        nohup node src/app.js > logs/server.log 2>&1 &
        echo $! > /tmp/mediapp.pid
        
        sleep 2
        get_stats
        ;;
    "stop"|"-x")
        log "Parando aplicação..."
        if check_server; then
            local pid=$(cat /tmp/mediapp.pid)
            kill $pid 2>/dev/null || true
            rm -f /tmp/mediapp.pid
        fi
        
        docker stop mediapp-db 2>/dev/null || true
        success "Aplicação parada"
        ;;
    "help"|"-h")
        echo "🏥 MediApp Monitor - Comandos:"
        echo ""
        echo "  status, -s     Status atual"
        echo "  monitor, -m    Monitoramento contínuo"
        echo "  keepalive, -k  Manter aplicação viva"
        echo "  restart, -r    Reiniciar aplicação"
        echo "  stop, -x       Parar aplicação"
        echo "  help, -h       Mostrar ajuda"
        echo ""
        ;;
    *)
        get_stats
        ;;
esac