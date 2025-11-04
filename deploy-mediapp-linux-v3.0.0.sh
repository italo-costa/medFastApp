#!/bin/bash
#
# 🏥 MediApp v3.0.0 - Script de Deploy Automático Linux
# Esteira completa para subir a aplicação no ambiente virtualizado
# Compatível: WSL, Ubuntu, Debian, CentOS
#

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="MediApp"
VERSION="3.0.0-linux"
PORT=3002
APP_DIR="/mnt/c/workspace/aplicativo"
BACKEND_DIR="$APP_DIR/apps/backend"
LOG_FILE="/tmp/mediapp-deploy.log"

# Função de logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${GREEN}[INFO]${NC} [$timestamp] $message" | tee -a $LOG_FILE ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message" | tee -a $LOG_FILE ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" | tee -a $LOG_FILE ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" | tee -a $LOG_FILE ;;
    esac
}

# Banner de inicialização
print_banner() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "🏥 $APP_NAME v$VERSION - Deploy Script"
    echo "=============================================="
    echo -e "${NC}"
    echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
    echo "🖥️  Sistema: $(uname -s) $(uname -r)"
    echo "📁 Diretório: $APP_DIR"
    echo "🔌 Porta: $PORT"
    echo ""
}

# Verificar pré-requisitos
check_prerequisites() {
    log "INFO" "🔍 Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "❌ Node.js não encontrado!"
        log "INFO" "📥 Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    local node_version=$(node --version)
    log "INFO" "✅ Node.js: $node_version"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "❌ npm não encontrado!"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    log "INFO" "✅ npm: $npm_version"
    
    # Verificar diretório da aplicação
    if [ ! -d "$APP_DIR" ]; then
        log "ERROR" "❌ Diretório da aplicação não encontrado: $APP_DIR"
        exit 1
    fi
    
    log "INFO" "✅ Pré-requisitos verificados com sucesso!"
}

# Parar processos existentes
stop_existing_processes() {
    log "INFO" "🛑 Parando processos existentes..."
    
    # Parar servidor Node.js existente
    pkill -f "node.*server-linux-stable" 2>/dev/null || true
    pkill -f "node.*app.js" 2>/dev/null || true
    
    # Aguardar processos finalizarem
    sleep 2
    
    # Verificar se ainda há processos rodando
    if pgrep -f "node.*server" > /dev/null; then
        log "WARN" "⚠️  Processos Node.js ainda ativos, forçando encerramento..."
        pkill -9 -f "node.*server" 2>/dev/null || true
        sleep 1
    fi
    
    log "INFO" "✅ Processos anteriores encerrados"
}

# Verificar e liberar porta
check_port() {
    log "INFO" "🔌 Verificando porta $PORT..."
    
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        log "WARN" "⚠️  Porta $PORT em uso, liberando..."
        local pid=$(lsof -t -i:$PORT 2>/dev/null || echo "")
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
    fi
    
    log "INFO" "✅ Porta $PORT disponível"
}

# Instalar dependências
install_dependencies() {
    log "INFO" "📦 Instalando dependências..."
    
    cd "$BACKEND_DIR"
    
    # Verificar se package.json existe
    if [ ! -f "package.json" ]; then
        log "ERROR" "❌ package.json não encontrado em $BACKEND_DIR"
        exit 1
    fi
    
    # Instalar dependências do backend
    log "INFO" "📥 Instalando dependências do backend..."
    npm install --production
    
    if [ $? -eq 0 ]; then
        log "INFO" "✅ Dependências instaladas com sucesso"
    else
        log "ERROR" "❌ Erro ao instalar dependências"
        exit 1
    fi
}

# Configurar ambiente
setup_environment() {
    log "INFO" "⚙️  Configurando ambiente..."
    
    # Criar diretórios necessários
    mkdir -p "$BACKEND_DIR/logs"
    mkdir -p "$BACKEND_DIR/uploads"
    mkdir -p "$APP_DIR/data"
    
    # Configurar permissões
    chmod 755 "$BACKEND_DIR/src"
    chmod 644 "$BACKEND_DIR/src/server-linux-stable.js"
    
    # Criar arquivo de PID
    echo $$ > "/tmp/mediapp-deploy.pid"
    
    log "INFO" "✅ Ambiente configurado"
}

# Iniciar servidor
start_server() {
    log "INFO" "🚀 Iniciando servidor $APP_NAME..."
    
    cd "$BACKEND_DIR/src"
    
    # Verificar se arquivo do servidor existe
    if [ ! -f "server-linux-stable.js" ]; then
        log "ERROR" "❌ Arquivo server-linux-stable.js não encontrado"
        exit 1
    fi
    
    # Iniciar servidor em background
    nohup node server-linux-stable.js > "/tmp/mediapp-server.log" 2>&1 &
    local server_pid=$!
    
    # Salvar PID do servidor
    echo $server_pid > "/tmp/mediapp-server.pid"
    log "INFO" "📝 PID do servidor: $server_pid"
    
    # Aguardar inicialização
    log "INFO" "⏳ Aguardando inicialização do servidor..."
    sleep 5
    
    # Verificar se processo ainda está rodando
    if ! kill -0 $server_pid 2>/dev/null; then
        log "ERROR" "❌ Servidor falhou ao iniciar"
        log "ERROR" "📄 Verificar logs em: /tmp/mediapp-server.log"
        exit 1
    fi
    
    log "INFO" "✅ Servidor iniciado com sucesso (PID: $server_pid)"
}

# Teste de conectividade
test_connectivity() {
    log "INFO" "🔍 Testando conectividade..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "DEBUG" "Tentativa $attempt/$max_attempts..."
        
        if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
            log "INFO" "✅ Servidor respondendo na porta $PORT"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log "ERROR" "❌ Servidor não respondeu após $max_attempts tentativas"
    log "ERROR" "📄 Verificar logs em: /tmp/mediapp-server.log"
    exit 1
}

# Validar APIs
validate_apis() {
    log "INFO" "🧪 Validando APIs..."
    
    # Test health check
    local health_response=$(curl -s "http://localhost:$PORT/health" || echo "ERROR")
    if [[ $health_response == *"success"* ]]; then
        log "INFO" "✅ Health Check API funcionando"
    else
        log "ERROR" "❌ Health Check API com problemas"
        return 1
    fi
    
    # Test médicos API
    local medicos_response=$(curl -s "http://localhost:$PORT/api/medicos" || echo "ERROR")
    if [[ $medicos_response == *"success"* ]]; then
        log "INFO" "✅ API de Médicos funcionando"
    else
        log "ERROR" "❌ API de Médicos com problemas"
        return 1
    fi
    
    # Test pacientes API
    local pacientes_response=$(curl -s "http://localhost:$PORT/api/pacientes" || echo "ERROR")
    if [[ $pacientes_response == *"success"* ]]; then
        log "INFO" "✅ API de Pacientes funcionando"
    else
        log "ERROR" "❌ API de Pacientes com problemas"
        return 1
    fi
    
    log "INFO" "✅ Todas as APIs validadas com sucesso"
}

# Exibir status final
show_status() {
    echo ""
    echo -e "${GREEN}=============================================="
    echo "🎉 $APP_NAME v$VERSION DEPLOY CONCLUÍDO!"
    echo -e "==============================================${NC}"
    echo ""
    echo "📊 STATUS DO SISTEMA:"
    echo -e "   🟢 Servidor: ${GREEN}ONLINE${NC}"
    echo -e "   🔌 Porta: ${BLUE}$PORT${NC}"
    echo -e "   📁 PID: ${BLUE}$(cat /tmp/mediapp-server.pid 2>/dev/null || echo 'N/A')${NC}"
    echo -e "   📄 Logs: ${BLUE}/tmp/mediapp-server.log${NC}"
    echo ""
    echo "🌐 URLS DE ACESSO:"
    echo -e "   🏠 Portal:           ${BLUE}http://localhost:$PORT/${NC}"
    echo -e "   🏥 Dashboard:        ${BLUE}http://localhost:$PORT/app.html${NC}"
    echo -e "   👨‍⚕️ Gestão Médicos:   ${BLUE}http://localhost:$PORT/gestao-medicos.html${NC}"
    echo -e "   👥 Gestão Pacientes: ${BLUE}http://localhost:$PORT/gestao-pacientes.html${NC}"
    echo -e "   📊 Analytics:        ${BLUE}http://localhost:$PORT/analytics-mapas.html${NC}"
    echo -e "   🔍 Health Check:     ${BLUE}http://localhost:$PORT/health${NC}"
    echo ""
    echo "🛠️  COMANDOS ÚTEIS:"
    echo -e "   Parar servidor:     ${YELLOW}kill \$(cat /tmp/mediapp-server.pid)${NC}"
    echo -e "   Ver logs:          ${YELLOW}tail -f /tmp/mediapp-server.log${NC}"
    echo -e "   Status processo:    ${YELLOW}ps aux | grep server-linux-stable${NC}"
    echo ""
}

# Função principal
main() {
    print_banner
    
    # Executar passos do deploy
    check_prerequisites
    stop_existing_processes
    check_port
    install_dependencies
    setup_environment
    start_server
    test_connectivity
    validate_apis
    
    # Exibir status final
    show_status
    
    log "INFO" "🎯 Deploy concluído com sucesso!"
    log "INFO" "📝 Logs salvos em: $LOG_FILE"
}

# Tratamento de sinais
trap 'log "ERROR" "❌ Deploy interrompido pelo usuário"; exit 1' INT TERM

# Tratamento de erros
set -o errexit
set -o pipefail

# Executar função principal
main "$@"

# Exit com sucesso
exit 0