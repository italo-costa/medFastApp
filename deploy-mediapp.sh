#!/bin/bash

# 🏥 MediApp v2.0 - Script de Deploy e Monitoramento Completo
# Mantém toda a aplicação executando com monitoramento ativo

echo "🚀 ======================================"
echo "🏥 MEDIAPP V2.0 - DEPLOY COMPLETO"
echo "🚀 ======================================"

# Configurações
BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
MOBILE_DIR="/mnt/c/workspace/aplicativo/apps/mobile"
LOG_DIR="/mnt/c/workspace/aplicativo/logs"
PID_FILE="/tmp/mediapp.pid"
HEALTH_URL="http://localhost:3002/health"
MAX_RETRIES=5

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para cleanup
cleanup() {
    log "🛑 Iniciando shutdown graceful..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log "📋 Parando processo principal (PID: $PID)..."
            kill -TERM "$PID"
            sleep 3
            if kill -0 "$PID" 2>/dev/null; then
                log "⚠️ Forçando término do processo..."
                kill -KILL "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # Mata todos os processos node relacionados ao mediapp
    pkill -f "node.*mediapp" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    log "✅ Cleanup concluído!"
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM EXIT

# Função para verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log "❌ Node.js não encontrado!"
        exit 1
    fi
    log "✅ Node.js: $(node --version)"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log "❌ npm não encontrado!"
        exit 1
    fi
    log "✅ npm: $(npm --version)"
    
    # Verificar PostgreSQL
    if ! command -v psql &> /dev/null; then
        log "⚠️ PostgreSQL CLI não encontrado (opcional)"
    else
        log "✅ PostgreSQL CLI disponível"
    fi
}

# Função para setup do ambiente
setup_environment() {
    log "🔧 Configurando ambiente..."
    
    # Criar diretório de logs
    mkdir -p "$LOG_DIR"
    
    # Ir para o diretório do backend
    cd "$BACKEND_DIR" || {
        log "❌ Não foi possível acessar $BACKEND_DIR"
        exit 1
    }
    
    # Verificar se package.json existe
    if [ ! -f "package.json" ]; then
        log "❌ package.json não encontrado em $BACKEND_DIR"
        exit 1
    fi
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependências..."
        npm install || {
            log "❌ Falha ao instalar dependências"
            exit 1
        }
    else
        log "✅ Dependências já instaladas"
    fi
    
    # Gerar cliente Prisma
    log "🔄 Gerando cliente Prisma..."
    npx prisma generate || {
        log "❌ Falha ao gerar cliente Prisma"
        exit 1
    }
    
    log "✅ Ambiente configurado!"
}

# Função para iniciar o servidor
start_server() {
    log "🚀 Iniciando servidor MediApp..."
    
    cd "$BACKEND_DIR"
    
    # Iniciar servidor em background
    nohup node src/app.js > "$LOG_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    
    # Salvar PID
    echo "$SERVER_PID" > "$PID_FILE"
    
    log "📋 Servidor iniciado com PID: $SERVER_PID"
    
    # Aguardar inicialização
    log "⏳ Aguardando servidor inicializar..."
    sleep 5
    
    return 0
}

# Função para verificar saúde do servidor
check_health() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log "🔍 Verificando saúde do servidor (tentativa $((retries + 1))/$MAX_RETRIES)..."
        
        if curl -s --connect-timeout 5 "$HEALTH_URL" > /dev/null 2>&1; then
            log "✅ Servidor respondendo normalmente!"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "⏳ Aguardando 3 segundos antes da próxima tentativa..."
            sleep 3
        fi
    done
    
    log "❌ Servidor não está respondendo após $MAX_RETRIES tentativas"
    return 1
}

# Função para mostrar status
show_status() {
    log "📊 Status da aplicação:"
    echo "   🔗 Health Check: $HEALTH_URL"
    echo "   🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html"
    echo "   👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html"
    echo "   📊 Dashboard: http://localhost:3002/api/statistics/dashboard"
    echo "   📋 API Médicos: http://localhost:3002/api/medicos"
    echo "   👨‍⚕️ API Pacientes: http://localhost:3002/api/pacientes"
    echo ""
    
    # Mostrar dados do banco
    if curl -s --connect-timeout 3 "$HEALTH_URL" > /dev/null 2>&1; then
        log "💾 Dados do sistema:"
        curl -s "$HEALTH_URL" 2>/dev/null | grep -E "(médicos|pacientes|exames)" || echo "   📊 Estatísticas carregando..."
    fi
}

# Função de monitoramento contínuo
monitor_server() {
    log "👁️ Iniciando monitoramento contínuo..."
    log "💡 Pressione Ctrl+C para parar o servidor"
    echo ""
    
    local check_interval=30
    local last_check=0
    
    while true; do
        current_time=$(date +%s)
        
        # Verificar a cada 30 segundos
        if [ $((current_time - last_check)) -ge $check_interval ]; then
            if ! curl -s --connect-timeout 5 "$HEALTH_URL" > /dev/null 2>&1; then
                log "⚠️ Servidor não está respondendo! Tentando reiniciar..."
                
                # Matar processo atual
                if [ -f "$PID_FILE" ]; then
                    OLD_PID=$(cat "$PID_FILE")
                    kill -TERM "$OLD_PID" 2>/dev/null || true
                    sleep 2
                    kill -KILL "$OLD_PID" 2>/dev/null || true
                fi
                
                # Reiniciar servidor
                start_server
                
                if check_health; then
                    log "✅ Servidor reiniciado com sucesso!"
                else
                    log "❌ Falha ao reiniciar servidor!"
                    exit 1
                fi
            else
                log "✅ Servidor funcionando normalmente"
            fi
            
            last_check=$current_time
        fi
        
        sleep 5
    done
}

# Função principal
main() {
    log "🏥 Iniciando deploy completo do MediApp v2.0..."
    
    # Cleanup inicial
    cleanup 2>/dev/null || true
    
    # Verificar dependências
    check_dependencies
    
    # Setup do ambiente
    setup_environment
    
    # Iniciar servidor
    start_server
    
    # Verificar saúde
    if check_health; then
        log "🎉 Deploy concluído com sucesso!"
        show_status
        monitor_server
    else
        log "❌ Falha no deploy - servidor não está respondendo"
        exit 1
    fi
}

# Verificar se script está sendo executado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi