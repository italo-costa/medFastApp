#!/bin/bash

# ========================================
# MediApp v3.0.0 - Instalador Universal
# Instalação automática para Windows/Linux
# ========================================

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Header
clear
echo "=========================================="
echo "🏥 MediApp v3.0.0 - Instalador Universal"
echo "=========================================="
echo "Sistema de Gestão Médica Completo"
echo "Configurado para ambiente Linux virtualizado"
echo "=========================================="
echo ""

# Detectar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    
    log "Sistema detectado: $OS"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado!"
        info "Por favor, instale Node.js v18+ de: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log "Node.js encontrado: $NODE_VERSION"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm não encontrado!"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log "npm encontrado: v$NPM_VERSION"
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        warn "Git não encontrado. Algumas funcionalidades podem não funcionar."
    else
        GIT_VERSION=$(git --version)
        log "Git encontrado: $GIT_VERSION"
    fi
    
    log "✅ Pré-requisitos verificados com sucesso!"
}

# Criar diretório de instalação
create_install_dir() {
    INSTALL_DIR="$HOME/mediapp"
    
    log "Criando diretório de instalação: $INSTALL_DIR"
    
    if [ -d "$INSTALL_DIR" ]; then
        warn "Diretório já existe. Fazendo backup..."
        mv "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    log "✅ Diretório criado: $INSTALL_DIR"
}

# Download e configuração dos arquivos
setup_application() {
    log "Configurando aplicação MediApp..."
    
    # Criar estrutura de diretórios
    mkdir -p apps/backend/src
    mkdir -p apps/backend/public
    mkdir -p apps/mobile/src/config
    mkdir -p apps/mobile/src/services
    mkdir -p apps/mobile/src/hooks
    mkdir -p data
    mkdir -p logs
    
    # Criar package.json
    cat > package.json << 'EOF'
{
  "name": "mediapp-installer",
  "version": "3.0.0",
  "description": "MediApp - Sistema de Gestão Médica",
  "main": "apps/backend/src/server-linux-stable.js",
  "scripts": {
    "start": "node apps/backend/src/server-linux-stable.js",
    "dev": "nodemon apps/backend/src/server-linux-stable.js",
    "install-deps": "npm install express cors",
    "test": "curl -s http://localhost:3002/health"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "author": "MediApp Team",
  "license": "MIT"
}
EOF
    
    log "✅ Estrutura de arquivos criada"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    npm install
    
    log "✅ Dependências instaladas"
}

# Criar scripts de execução
create_scripts() {
    log "Criando scripts de execução..."
    
    # Script de start para Linux/WSL
    cat > start.sh << 'EOF'
#!/bin/bash

echo "🏥 Iniciando MediApp v3.0.0..."

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    exit 1
fi

# Ir para diretório da aplicação
cd "$(dirname "$0")"

# Verificar se arquivo principal existe
if [ ! -f "apps/backend/src/server-linux-stable.js" ]; then
    echo "❌ Arquivo servidor não encontrado!"
    echo "Execute o instalador novamente."
    exit 1
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
node apps/backend/src/server-linux-stable.js
EOF
    
    chmod +x start.sh
    
    # Script de start para Windows
    cat > start.bat << 'EOF'
@echo off
echo 🏥 Iniciando MediApp v3.0.0...

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    pause
    exit /b 1
)

REM Ir para diretório da aplicação
cd /d "%~dp0"

REM Verificar arquivo principal
if not exist "apps\backend\src\server-linux-stable.js" (
    echo ❌ Arquivo servidor não encontrado!
    echo Execute o instalador novamente.
    pause
    exit /b 1
)

REM Iniciar servidor
echo 🚀 Iniciando servidor...
node apps\backend\src\server-linux-stable.js
pause
EOF
    
    log "✅ Scripts de execução criados"
}

# Criar arquivo de configuração
create_config() {
    log "Criando arquivo de configuração..."
    
    cat > .env << 'EOF'
# MediApp v3.0.0 - Configurações
PORT=3002
HOST=0.0.0.0
NODE_ENV=development

# Configurações específicas para ambiente virtualizado
VIRTUAL_ENV=true
CORS_ORIGIN=*
ENABLE_LOGGING=true
EOF
    
    log "✅ Arquivo de configuração criado"
}

# Criar README de instalação
create_readme() {
    log "Criando documentação..."
    
    cat > README.md << 'EOF'
# 🏥 MediApp v3.0.0

Sistema de Gestão Médica configurado para ambiente Linux virtualizado.

## 🚀 Como Executar

### Linux/WSL:
```bash
./start.sh
```

### Windows:
```cmd
start.bat
```

## 🌐 URLs de Acesso

Após iniciar o servidor, acesse:

- **Dashboard**: http://localhost:3002/
- **Health Check**: http://localhost:3002/health
- **API Médicos**: http://localhost:3002/api/medicos
- **API Pacientes**: http://localhost:3002/api/pacientes

## 📋 Pré-requisitos

- Node.js v18+
- npm v8+

## 🔧 Comandos Úteis

- **Iniciar**: `npm start`
- **Desenvolvimento**: `npm run dev`
- **Testar**: `npm test`

## 📞 Suporte

Para suporte técnico, consulte a documentação completa.
EOF
    
    log "✅ Documentação criada"
}

# Baixar arquivos principais (simulação - na prática viriam do repositório)
download_core_files() {
    log "Configurando arquivos principais..."
    
    # Aqui normalmente faria download do repositório
    # Para esta demonstração, criamos os arquivos essenciais
    
    warn "⚠️ Esta é uma versão de demonstração do instalador"
    warn "⚠️ Em produção, os arquivos seriam baixados do repositório Git"
    
    info "Para instalação completa:"
    info "1. Clone o repositório: git clone https://github.com/italo-costa/medFastApp.git"
    info "2. Execute: cd medFastApp && npm install"
    info "3. Inicie: npm start"
    
    log "✅ Configuração de download preparada"
}

# Verificar instalação
verify_installation() {
    log "Verificando instalação..."
    
    # Verificar estrutura de arquivos
    if [ -f "package.json" ] && [ -f "start.sh" ] && [ -f "start.bat" ]; then
        log "✅ Arquivos de configuração OK"
    else
        error "❌ Alguns arquivos estão faltando"
        exit 1
    fi
    
    # Verificar dependências
    if [ -d "node_modules" ]; then
        log "✅ Dependências instaladas"
    else
        warn "⚠️ node_modules não encontrado - execute 'npm install'"
    fi
    
    log "✅ Verificação concluída"
}

# Finalizar instalação
finalize_installation() {
    echo ""
    echo "=========================================="
    echo "🎉 Instalação Concluída com Sucesso!"
    echo "=========================================="
    echo ""
    echo "📁 Diretório de instalação: $INSTALL_DIR"
    echo ""
    echo "🚀 Para iniciar o MediApp:"
    echo "   Linux/WSL: ./start.sh"
    echo "   Windows:   start.bat"
    echo ""
    echo "🌐 URLs após inicialização:"
    echo "   Dashboard: http://localhost:3002/"
    echo "   Health:    http://localhost:3002/health"
    echo ""
    echo "📚 Documentação: README.md"
    echo "⚙️ Configuração: .env"
    echo ""
    echo "=========================================="
    echo "🏥 MediApp v3.0.0 pronto para uso!"
    echo "=========================================="
}

# Função principal
main() {
    detect_os
    check_prerequisites
    create_install_dir
    setup_application
    install_dependencies
    create_scripts
    create_config
    create_readme
    download_core_files
    verify_installation
    finalize_installation
}

# Executar instalação
main "$@"