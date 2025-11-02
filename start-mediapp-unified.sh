#!/bin/bash

# 🚀 MediApp - Script de Inicialização Unificado
# Versão 2.0 - Estrutura Refatorada

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ${1}${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  ${1}${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ${1}${NC}"
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] 🎉 ${1}${NC}"
}

# Header
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🏥 MediApp v2.0                           ║"
echo "║                Sistema Médico Unificado                      ║"
echo "║                 Estrutura Refatorada                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    error "Execute este script na pasta raiz do projeto (onde está package.json)"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js detectado: $NODE_VERSION"

# Verificar estrutura refatorada
if [ ! -d "apps/backend" ]; then
    error "Estrutura refatorada não encontrada. Execute a migração primeiro."
    exit 1
fi

log "✅ Estrutura refatorada detectada"

# Função para parar processos existentes
stop_existing_processes() {
    log "🛑 Parando processos existentes..."
    
    # Parar por porta
    for port in 3001 3002 3003; do
        if lsof -ti:$port >/dev/null 2>&1; then
            warn "Parando processo na porta $port"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Parar por nome do processo
    pkill -f "node.*app\.js" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    sleep 2
    log "✅ Processos parados"
}

# Função de setup inicial
setup_project() {
    log "📦 Configurando projeto..."
    
    # Instalar dependências do workspace
    log "Instalando dependências do workspace..."
    npm install
    
    # Setup do backend
    log "Configurando backend..."
    cd apps/backend
    
    if [ ! -f ".env" ]; then
        warn "Arquivo .env não encontrado, criando..."
        cat > .env << EOF
# Database
DATABASE_URL="postgresql://mediapp:mediapp123@localhost:5432/mediapp_db"

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Security
JWT_SECRET="mediapp_jwt_secret_2024"
JWT_EXPIRES_IN="24h"

# External APIs
VIACEP_URL="https://viacep.com.br/ws"
DATASUS_URL="https://datasus.saude.gov.br/api"
EOF
    fi
    
    npm install
    
    # Verificar Prisma
    if [ -f "prisma/schema.prisma" ]; then
        log "Configurando banco de dados..."
        npx prisma generate
        npx prisma migrate dev --name init 2>/dev/null || true
    fi
    
    cd ../..
    
    # Setup do mobile
    if [ -d "apps/mobile" ]; then
        log "Configurando mobile..."
        cd apps/mobile
        npm install
        cd ../..
    fi
    
    success "✅ Setup concluído!"
}

# Função para iniciar o servidor
start_server() {
    log "🚀 Iniciando MediApp Server v2.0..."
    
    cd apps/backend
    
    # Verificar se o servidor já está rodando
    if lsof -ti:3001 >/dev/null 2>&1; then
        warn "Porta 3001 já está em uso"
        read -p "Deseja parar o processo existente? (y/N): " answer
        if [[ $answer =~ ^[Yy]$ ]]; then
            lsof -ti:3001 | xargs kill -9
            sleep 2
        else
            error "Não é possível iniciar o servidor"
            exit 1
        fi
    fi
    
    # Iniciar servidor
    success "🎯 Iniciando servidor na porta 3001..."
    
    if [ "$1" = "dev" ]; then
        log "Modo desenvolvimento com nodemon"
        npm run dev
    else
        log "Modo produção"
        npm start
    fi
}

# Função de health check
health_check() {
    log "⚡ Executando health check..."
    
    # Aguardar servidor iniciar
    sleep 3
    
    for i in {1..10}; do
        if curl -s http://localhost:3001/health > /dev/null; then
            success "✅ Servidor respondendo corretamente!"
            break
        else
            warn "Tentativa $i/10 - Aguardando servidor..."
            sleep 2
        fi
    done
    
    # Mostrar informações do sistema
    echo -e "\n${BLUE}📊 Status do Sistema:${NC}"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || echo "Servidor iniciando..."
    
    echo -e "\n${BLUE}🔗 Links Principais:${NC}"
    echo "🏠 Home: http://localhost:3001/"
    echo "⚡ Health: http://localhost:3001/health"
    echo "👨‍⚕️ Médicos: http://localhost:3001/gestao-medicos.html"
    echo "👥 Pacientes: http://localhost:3001/gestao-pacientes.html"
    echo "🗺️ Analytics: http://localhost:3001/src/pages/analytics-geografico.html"
}

# Menu principal
show_menu() {
    echo -e "\n${BLUE}🎛️  Escolha uma opção:${NC}"
    echo "1) 🚀 Iniciar servidor (produção)"
    echo "2) 🛠️  Iniciar servidor (desenvolvimento)"
    echo "3) 📦 Setup inicial do projeto"
    echo "4) 🛑 Parar todos os processos"
    echo "5) ⚡ Health check"
    echo "6) 🧹 Limpeza e reinstalação"
    echo "7) 📊 Ver logs"
    echo "8) ❌ Sair"
    echo
    read -p "Digite sua escolha (1-8): " choice
}

# Função de limpeza
clean_project() {
    log "🧹 Limpando projeto..."
    
    stop_existing_processes
    
    # Remover node_modules
    rm -rf node_modules apps/backend/node_modules apps/mobile/node_modules
    rm -rf package-lock.json apps/backend/package-lock.json apps/mobile/package-lock.json
    
    # Reinstalar
    setup_project
    
    success "✅ Limpeza concluída!"
}

# Função para ver logs
show_logs() {
    log "📊 Logs do sistema..."
    
    if [ -f "apps/backend/logs/app.log" ]; then
        tail -f apps/backend/logs/app.log
    else
        warn "Nenhum log encontrado"
    fi
}

# Loop principal
while true; do
    show_menu
    
    case $choice in
        1)
            stop_existing_processes
            start_server "prod"
            health_check
            ;;
        2)
            stop_existing_processes
            start_server "dev"
            health_check
            ;;
        3)
            setup_project
            ;;
        4)
            stop_existing_processes
            success "✅ Todos os processos parados"
            ;;
        5)
            health_check
            ;;
        6)
            clean_project
            ;;
        7)
            show_logs
            ;;
        8)
            log "👋 Encerrando MediApp..."
            stop_existing_processes
            exit 0
            ;;
        *)
            error "Opção inválida!"
            ;;
    esac
    
    echo
    read -p "Pressione Enter para continuar..."
done