#!/bin/bash

# 🚀 MediApp - Script de Inicialização Robusta para WSL
# Versão: 2.0 - Otimizada para estabilidade Windows-Linux

set -euo pipefail  # Modo estrito

# =====================================
# CONFIGURAÇÕES
# =====================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="/home/italo_unix_user/aplicativo/backend"
LOG_DIR="$BACKEND_DIR/logs"
PID_FILE="$BACKEND_DIR/mediapp.pid"
LOG_FILE="$LOG_DIR/mediapp.log"
SERVER_SCRIPT="src/server-stable.js"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =====================================
# FUNÇÕES UTILITÁRIAS
# =====================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" ;;
        *)       echo -e "${CYAN}[LOG]${NC}   [$timestamp] $message" ;;
    esac
    
    # Salvar no arquivo de log se possível
    if [[ -d "$LOG_DIR" ]]; then
        echo "[$level] [$timestamp] $message" >> "$LOG_FILE"
    fi
}

# Função para verificar dependências
check_dependencies() {
    log "INFO" "🔍 Verificando dependências..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js não encontrado!"
        return 1
    fi
    local node_version=$(node --version)
    log "INFO" "✅ Node.js $node_version"
    
    # PostgreSQL
    if ! command -v psql &> /dev/null; then
        log "WARN" "PostgreSQL CLI não encontrado, mas pode estar funcionando"
    else
        log "INFO" "✅ PostgreSQL CLI disponível"
    fi
    
    # NPM packages
    if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
        log "WARN" "node_modules não encontrado - executando npm install"
        cd "$BACKEND_DIR"
        npm install --silent
    fi
    
    return 0
}

# Função para verificar se o servidor está rodando
is_server_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Rodando
        else
            log "WARN" "PID file existe mas processo morreu - limpando"
            rm -f "$PID_FILE"
            return 1  # Não rodando
        fi
    else
        return 1  # Não rodando
    fi
}

# Função para testar conectividade
test_connectivity() {
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f --connect-timeout 5 http://localhost:3001/health > /dev/null; then
            return 0  # Online
        fi
        
        log "DEBUG" "Tentativa $attempt/$max_attempts falhou, aguardando..."
        sleep 2
        ((attempt++))
    done
    
    return 1  # Offline após todas as tentativas
}

# Função para preparar ambiente
setup_environment() {
    log "INFO" "🔧 Preparando ambiente..."
    
    # Criar diretórios necessários
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKEND_DIR/temp"
    mkdir -p "$BACKEND_DIR/uploads"
    
    # Verificar arquivos necessários
    if [[ ! -f "$BACKEND_DIR/$SERVER_SCRIPT" ]]; then
        log "ERROR" "Script do servidor não encontrado: $SERVER_SCRIPT"
        return 1
    fi
    
    # Configurar arquivo .env
    if [[ ! -f "$BACKEND_DIR/.env" ]]; then
        log "WARN" "Arquivo .env não encontrado - criando padrão"
        cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env" 2>/dev/null || {
            log "WARN" "Arquivo .env.production não encontrado - usando configuração padrão"
            cat > "$BACKEND_DIR/.env" << EOF
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mediapp?schema=public"
JWT_SECRET="MediApp2024_WSL_SecureToken_Development_Key"
JWT_EXPIRES_IN="24h"
EOF
        }
    fi
    
    return 0
}

# Função para iniciar PostgreSQL se necessário
ensure_postgresql() {
    log "INFO" "🗄️ Verificando PostgreSQL..."
    
    # Verificar se PostgreSQL está rodando
    if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
        log "INFO" "Iniciando PostgreSQL..."
        if sudo systemctl start postgresql 2>/dev/null; then
            log "INFO" "✅ PostgreSQL iniciado"
            sleep 2
        else
            log "WARN" "Falha ao iniciar PostgreSQL via systemctl - tentando pg_ctlcluster"
            sudo pg_ctlcluster 16 main start 2>/dev/null || {
                log "ERROR" "Falha ao iniciar PostgreSQL"
                return 1
            }
        fi
    else
        log "INFO" "✅ PostgreSQL já está rodando"
    fi
    
    # Verificar conectividade
    if sudo -u postgres psql -c '\q' 2>/dev/null; then
        log "INFO" "✅ Conexão com PostgreSQL OK"
        return 0
    else
        log "ERROR" "Falha na conexão com PostgreSQL"
        return 1
    fi
}

# Função para parar servidor
stop_server() {
    log "INFO" "🛑 Parando servidor MediApp..."
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Enviando SIGTERM para processo $pid"
            kill -TERM "$pid" 2>/dev/null
            
            # Aguardar graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [[ $count -lt 10 ]]; do
                sleep 1
                ((count++))
            done
            
            # Forçar se necessário
            if kill -0 "$pid" 2>/dev/null; then
                log "WARN" "Forçando encerramento do processo $pid"
                kill -KILL "$pid" 2>/dev/null
            fi
            
            log "INFO" "✅ Processo $pid encerrado"
        fi
        
        rm -f "$PID_FILE"
    else
        log "INFO" "Nenhum servidor rodando"
    fi
    
    # Limpar processos órfãos
    pkill -f "node.*server-stable.js" 2>/dev/null || true
    
    return 0
}

# Função para iniciar servidor
start_server() {
    log "INFO" "🚀 Iniciando servidor MediApp..."
    
    cd "$BACKEND_DIR"
    
    # Verificar se já está rodando
    if is_server_running; then
        log "WARN" "Servidor já está rodando (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    # Iniciar processo em background
    nohup node "$SERVER_SCRIPT" > "$LOG_DIR/output.log" 2>&1 &
    local pid=$!
    
    # Salvar PID
    echo "$pid" > "$PID_FILE"
    
    log "INFO" "Processo iniciado com PID: $pid"
    
    # Aguardar inicialização
    log "INFO" "Aguardando inicialização..."
    sleep 5
    
    # Verificar se processo ainda está vivo
    if ! kill -0 "$pid" 2>/dev/null; then
        log "ERROR" "Processo morreu após inicialização!"
        log "ERROR" "Últimas linhas do log:"
        tail -10 "$LOG_DIR/output.log" 2>/dev/null || echo "Log não disponível"
        rm -f "$PID_FILE"
        return 1
    fi
    
    # Testar conectividade
    if test_connectivity; then
        log "INFO" "✅ Servidor iniciado com sucesso!"
        log "INFO" "🌐 URL: http://localhost:3001"
        log "INFO" "🔗 Health: http://localhost:3001/health"
        return 0
    else
        log "ERROR" "Servidor iniciou mas não está respondendo"
        stop_server
        return 1
    fi
}

# Função para reiniciar servidor
restart_server() {
    log "INFO" "🔄 Reiniciando servidor MediApp..."
    stop_server
    sleep 2
    start_server
}

# Função para verificar status
check_status() {
    log "INFO" "📊 Verificando status do MediApp..."
    
    if is_server_running; then
        local pid=$(cat "$PID_FILE")
        log "INFO" "✅ Servidor ONLINE (PID: $pid)"
        
        if test_connectivity; then
            log "INFO" "✅ Conectividade OK"
            
            # Mostrar informações adicionais
            local uptime=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')
            local memory=$(ps -o rss= -p "$pid" 2>/dev/null | tr -d ' ')
            memory=$((memory / 1024))
            
            echo ""
            echo -e "${GREEN}📈 ESTATÍSTICAS:${NC}"
            echo -e "   PID: $pid"
            echo -e "   Uptime: $uptime"
            echo -e "   Memória: ${memory}MB"
            echo -e "   URL: http://localhost:3001"
            echo -e "   Health: http://localhost:3001/health"
            
            return 0
        else
            log "ERROR" "❌ Processo rodando mas não respondendo"
            return 1
        fi
    else
        log "ERROR" "❌ Servidor OFFLINE"
        return 1
    fi
}

# Função para monitoramento contínuo
monitor_server() {
    log "INFO" "👁️ Iniciando monitoramento contínuo..."
    log "INFO" "Pressione Ctrl+C para parar o monitoramento"
    
    local check_count=0
    local restart_count=0
    
    while true; do
        ((check_count++))
        
        if is_server_running && test_connectivity; then
            log "DEBUG" "Check #$check_count - Servidor OK"
        else
            log "WARN" "Check #$check_count - Servidor com problemas!"
            ((restart_count++))
            
            log "INFO" "Tentativa de restart #$restart_count"
            
            if restart_server; then
                log "INFO" "✅ Servidor restaurado com sucesso"
            else
                log "ERROR" "❌ Falha na restauração - aguardando próxima tentativa"
                sleep 30
                continue
            fi
        fi
        
        sleep 15  # Verificar a cada 15 segundos
    done
}

# Função para mostrar logs em tempo real
show_logs() {
    local log_type=${1:-"output"}
    local log_path
    
    case $log_type in
        "output") log_path="$LOG_DIR/output.log" ;;
        "error")  log_path="$LOG_DIR/error.log" ;;
        "main")   log_path="$LOG_FILE" ;;
        *) log_path="$LOG_DIR/output.log" ;;
    esac
    
    if [[ -f "$log_path" ]]; then
        log "INFO" "📋 Mostrando logs: $log_path"
        echo "Pressione Ctrl+C para parar..."
        tail -f "$log_path"
    else
        log "ERROR" "Arquivo de log não encontrado: $log_path"
        return 1
    fi
}

# =====================================
# FUNÇÃO PRINCIPAL
# =====================================

main() {
    local command=${1:-"help"}
    
    # Banner
    echo -e "${PURPLE}"
    echo "🏥 =============================================="
    echo "   MediApp - Sistema de Prontuários Médicos"
    echo "   WSL Management Script v2.0"
    echo "==============================================="
    echo -e "${NC}"
    
    # Verificar se estamos no WSL
    if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
        log "WARN" "Este script foi otimizado para WSL"
    fi
    
    case $command in
        "start")
            check_dependencies && setup_environment && ensure_postgresql && start_server
            ;;
        "stop")
            stop_server
            ;;
        "restart")
            check_dependencies && setup_environment && ensure_postgresql && restart_server
            ;;
        "status")
            check_status
            ;;
        "monitor")
            check_dependencies && setup_environment && ensure_postgresql
            if ! is_server_running; then
                start_server
            fi
            monitor_server
            ;;
        "logs")
            show_logs "${2:-output}"
            ;;
        "setup")
            check_dependencies && setup_environment && ensure_postgresql
            log "INFO" "✅ Setup concluído"
            ;;
        "health")
            if test_connectivity; then
                log "INFO" "✅ Health check OK"
                curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
            else
                log "ERROR" "❌ Health check falhou"
                exit 1
            fi
            ;;
        "help"|*)
            echo -e "${CYAN}USO:${NC} $0 {comando} [opções]"
            echo ""
            echo -e "${CYAN}COMANDOS DISPONÍVEIS:${NC}"
            echo "  start    - Iniciar servidor MediApp"
            echo "  stop     - Parar servidor MediApp"
            echo "  restart  - Reiniciar servidor MediApp"
            echo "  status   - Verificar status do servidor"
            echo "  monitor  - Monitoramento contínuo com auto-restart"
            echo "  logs     - Mostrar logs em tempo real"
            echo "  setup    - Configurar ambiente"
            echo "  health   - Testar health check"
            echo "  help     - Mostrar esta ajuda"
            echo ""
            echo -e "${CYAN}EXEMPLOS:${NC}"
            echo "  $0 start           # Iniciar servidor"
            echo "  $0 monitor         # Monitoramento automático"
            echo "  $0 logs output     # Ver logs de saída"
            echo "  $0 status          # Verificar status"
            
            if [[ "$command" != "help" ]]; then
                exit 1
            fi
            ;;
    esac
}

# Trap para limpeza
trap 'log "INFO" "Script interrompido pelo usuário"; exit 0' INT TERM

# Executar função principal
main "$@"