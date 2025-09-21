#!/bin/bash

# 🔧 MediApp - Script de Verificação de Portas
# Este script verifica se as portas estão disponíveis e mapeia conflitos

echo "🏥 MediApp - Verificação de Portas e Serviços"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar porta
check_port() {
    local port=$1
    local service=$2
    local technology=$3
    
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${GREEN}✅ PORTA $port${NC} - $service ($technology) - ${GREEN}EM USO${NC}"
        echo "   $(netstat -tuln | grep ":$port " | head -1)"
    else
        echo -e "${YELLOW}⚠️  PORTA $port${NC} - $service ($technology) - ${YELLOW}DISPONÍVEL${NC}"
    fi
}

# Função para verificar processo específico
check_process() {
    local process_name=$1
    local port=$2
    
    if pgrep -f "$process_name" > /dev/null; then
        local pid=$(pgrep -f "$process_name")
        echo -e "${BLUE}🔍 PROCESSO:${NC} $process_name (PID: $pid) - Porta: $port"
    fi
}

echo -e "\n${BLUE}📊 VERIFICAÇÃO DE PORTAS:${NC}"
echo "----------------------------------------"

# Verificar portas principais do MediApp
check_port "3001" "Backend API" "Node.js/Express"
check_port "5432" "PostgreSQL" "Database"
check_port "3000" "Frontend Web" "React.js"
check_port "8081" "Metro Bundler" "React Native"
check_port "19000" "Expo Dev" "Expo CLI"
check_port "19006" "Expo Web" "Expo Web"

echo -e "\n${BLUE}🔍 PROCESSOS ATIVOS:${NC}"
echo "----------------------------------------"

# Verificar processos específicos
check_process "node src/server.js" "3001"
check_process "postgres" "5432"
check_process "metro" "8081"
check_process "expo" "19000"

echo -e "\n${BLUE}🌐 TESTE DE CONECTIVIDADE:${NC}"
echo "----------------------------------------"

# Testar endpoints principais
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302"; then
        echo -e "${GREEN}✅ $name${NC} - $url - ${GREEN}ONLINE${NC}"
    else
        echo -e "${RED}❌ $name${NC} - $url - ${RED}OFFLINE${NC}"
    fi
}

test_endpoint "http://localhost:3001/health" "Backend API Health"
test_endpoint "http://localhost:3001" "Web Dashboard"

echo -e "\n${BLUE}📋 RECOMENDAÇÕES:${NC}"
echo "----------------------------------------"

# Verificar conflitos
conflict_detected=false

if netstat -tuln | grep -q ":3001 " && ! pgrep -f "node src/server.js" > /dev/null; then
    echo -e "${RED}⚠️  CONFLITO:${NC} Porta 3001 ocupada por outro processo"
    conflict_detected=true
fi

if netstat -tuln | grep -q ":5432 " && ! pgrep -f "postgres" > /dev/null; then
    echo -e "${RED}⚠️  CONFLITO:${NC} Porta 5432 ocupada por outro processo"
    conflict_detected=true
fi

if [ "$conflict_detected" = false ]; then
    echo -e "${GREEN}✅ NENHUM CONFLITO DETECTADO${NC}"
    echo -e "${GREEN}✅ CONFIGURAÇÃO DE PORTAS APROVADA${NC}"
else
    echo -e "${YELLOW}💡 SOLUÇÃO:${NC} Execute 'sudo pkill -f <processo>' para liberar portas"
fi

echo -e "\n${BLUE}🏥 MEDIAPP STATUS:${NC}"
echo "----------------------------------------"

if pgrep -f "node src/server.js" > /dev/null; then
    echo -e "${GREEN}✅ MediApp Backend RODANDO${NC}"
    echo "   📊 Health Check: http://localhost:3001/health"
    echo "   🌐 Dashboard: http://localhost:3001"
    echo "   📱 API: http://localhost:3001/api/"
else
    echo -e "${YELLOW}⚠️  MediApp Backend PARADO${NC}"
    echo "   💡 Para iniciar: cd backend && node src/server.js"
fi

echo -e "\n🎯 Verificação concluída!"