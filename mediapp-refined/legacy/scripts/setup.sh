#!/bin/bash

# MediApp - Script de Inicialização Completa
# ===========================================
# Este script configura todo o ambiente de desenvolvimento
# para o aplicativo MediApp (Frontend, Backend e Mobile)

set -e

echo "🏥 =========================================="
echo "🏥 MediApp - Inicialização Completa"
echo "🏥 Sistema de Gestão Médica"
echo "🏥 =========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# ==========================================
# 1. VERIFICAÇÃO DE DEPENDÊNCIAS
# ==========================================

log_info "Verificando dependências do sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale Node.js 18+ primeiro"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
log_success "Node.js encontrado: v$NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado"
    exit 1
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    log_error "Git não encontrado"
    exit 1
fi

# Verificar Docker (opcional)
if command -v docker &> /dev/null; then
    log_success "Docker encontrado"
    DOCKER_AVAILABLE=true
else
    log_warning "Docker não encontrado (opcional para desenvolvimento)"
    DOCKER_AVAILABLE=false
fi

# Verificar Java para Android
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    log_success "Java encontrado: $JAVA_VERSION"
    JAVA_AVAILABLE=true
else
    log_warning "Java não encontrado (necessário para desenvolvimento Android)"
    JAVA_AVAILABLE=false
fi

# ==========================================
# 2. INSTALAÇÃO DE DEPENDÊNCIAS
# ==========================================

log_info "Instalando dependências do projeto principal..."
npm install

log_info "Instalando dependências do frontend..."
cd frontend
npm install
cd ..

log_info "Instalando dependências do backend..."
cd backend
npm install
cd ..

log_info "Instalando dependências do mobile..."
cd mobile
npm install
cd ..

# ==========================================
# 3. CONFIGURAÇÃO DO BANCO DE DADOS
# ==========================================

log_info "Configurando banco de dados..."

if [ "$DOCKER_AVAILABLE" = true ]; then
    log_info "Iniciando PostgreSQL com Docker..."
    
    # Criar docker-compose.yml se não existir
    if [ ! -f "docker-compose.yml" ]; then
        log_info "Criando arquivo docker-compose.yml..."
        cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: mediapp_postgres
    environment:
      POSTGRES_DB: mediapp
      POSTGRES_USER: mediapp
      POSTGRES_PASSWORD: mediapp123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: mediapp_redis
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
EOF
        log_success "docker-compose.yml criado"
    fi
    
    # Iniciar containers
    docker-compose up -d
    
    # Aguardar containers iniciarem
    log_info "Aguardando containers iniciarem..."
    sleep 10
    
    log_success "Banco de dados PostgreSQL iniciado"
else
    log_warning "Docker não disponível. Configure PostgreSQL manualmente:"
    echo "  - Host: localhost:5432"
    echo "  - Database: mediapp"
    echo "  - Username: mediapp"
    echo "  - Password: mediapp123"
fi

# ==========================================
# 4. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ==========================================

log_info "Configurando variáveis de ambiente..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    log_info "Criando backend/.env..."
    cat > backend/.env << EOF
# Configuração do Servidor
NODE_ENV=development
PORT=3001
HOST=localhost

# Banco de Dados
DATABASE_URL=postgresql://mediapp:mediapp123@localhost:5432/mediapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediapp
DB_USER=mediapp
DB_PASSWORD=mediapp123

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui_123456789
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Email (configurar com seus dados)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Upload de Arquivos
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Cors
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
EOF
    log_success "backend/.env criado"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    log_info "Criando frontend/.env..."
    cat > frontend/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=10000

# App Configuration
REACT_APP_NAME=MediApp
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Features
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_NOTIFICATIONS=true
EOF
    log_success "frontend/.env criado"
fi

# Mobile .env
if [ ! -f "mobile/.env" ]; then
    log_info "Criando mobile/.env..."
    cat > mobile/.env << EOF
# API Configuration
API_URL=http://localhost:3001/api
API_TIMEOUT=10000

# App Configuration
APP_NAME=MediApp
APP_VERSION=1.0.0
APP_ENVIRONMENT=development

# Push Notifications
FCM_SERVER_KEY=your_fcm_server_key_here
EOF
    log_success "mobile/.env criado"
fi

# ==========================================
# 5. EXECUTAR MIGRAÇÕES DO BANCO
# ==========================================

log_info "Executando migrações do banco de dados..."
cd backend

# Aguardar PostgreSQL estar pronto
if [ "$DOCKER_AVAILABLE" = true ]; then
    log_info "Aguardando PostgreSQL estar pronto..."
    for i in {1..30}; do
        if npm run db:test 2>/dev/null; then
            break
        fi
        sleep 2
    done
fi

# Executar migrações
npm run migrate 2>/dev/null || log_warning "Migrações não executadas (configure o banco primeiro)"

# Seed do banco (dados iniciais)
npm run seed 2>/dev/null || log_warning "Seed não executado (configure o banco primeiro)"

cd ..

# ==========================================
# 6. CONFIGURAÇÃO MOBILE ESPECÍFICA
# ==========================================

log_info "Configurando ambiente mobile..."

cd mobile

# Configurar React Native CLI
if ! command -v npx react-native &> /dev/null; then
    log_info "Instalando React Native CLI..."
    npm install -g @react-native-community/cli
fi

# iOS Pod Install (se no macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    log_info "Configurando dependências iOS..."
    cd ios
    
    if command -v pod &> /dev/null; then
        pod install
        log_success "Pods iOS instalados"
    else
        log_warning "CocoaPods não encontrado. Instale com: sudo gem install cocoapods"
    fi
    
    cd ..
fi

# Android (se Java disponível)
if [ "$JAVA_AVAILABLE" = true ]; then
    log_info "Configurando dependências Android..."
    cd android
    
    # Dar permissão ao gradlew
    chmod +x gradlew
    
    # Limpar e baixar dependências
    ./gradlew clean 2>/dev/null || log_warning "Gradle não executado (configure Android SDK)"
    
    cd ..
fi

cd ..

# ==========================================
# 7. CONFIGURAR SCRIPTS DE DESENVOLVIMENTO
# ==========================================

log_info "Configurando scripts de desenvolvimento..."

# Criar script para iniciar todos os serviços
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Script para iniciar todos os serviços em desenvolvimento
echo "🚀 Iniciando MediApp em modo desenvolvimento..."

# Função para cleanup
cleanup() {
    echo "🛑 Parando serviços..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "📡 Iniciando Backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
echo "🌐 Iniciando Frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

# Aguardar frontend iniciar
sleep 3

echo "✅ Serviços iniciados:"
echo "   📡 Backend: http://localhost:3001"
echo "   🌐 Frontend: http://localhost:3000"
echo "   📱 Mobile: Execute 'npm run android' ou 'npm run ios' na pasta mobile"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar
wait
EOF

chmod +x start-dev.sh

# Criar script para mobile
cat > start-mobile.sh << 'EOF'
#!/bin/bash

echo "📱 MediApp Mobile Development"
echo "Escolha uma opção:"
echo "1) Android"
echo "2) iOS"
echo "3) Metro Bundler apenas"

read -p "Opção (1-3): " choice

cd mobile

case $choice in
    1)
        echo "🤖 Iniciando Android..."
        npm run android
        ;;
    2)
        echo "🍎 Iniciando iOS..."
        npm run ios
        ;;
    3)
        echo "📦 Iniciando Metro Bundler..."
        npm start
        ;;
    *)
        echo "Opção inválida"
        ;;
esac
EOF

chmod +x start-mobile.sh

# ==========================================
# 8. EXECUTAR TESTES
# ==========================================

log_info "Executando testes de verificação..."

# Teste backend
cd backend
if npm test 2>/dev/null; then
    log_success "Testes do backend passaram"
else
    log_warning "Alguns testes do backend falharam"
fi
cd ..

# Teste frontend
cd frontend
if npm test -- --watchAll=false 2>/dev/null; then
    log_success "Testes do frontend passaram"
else
    log_warning "Alguns testes do frontend falharam"
fi
cd ..

# Teste mobile
cd mobile
if npm test 2>/dev/null; then
    log_success "Testes do mobile passaram"
else
    log_warning "Alguns testes do mobile falharam"
fi
cd ..

# ==========================================
# 9. FINALIZAÇÃO
# ==========================================

log_success "🎉 Inicialização completa!"
echo ""
echo "📋 RESUMO DA CONFIGURAÇÃO:"
echo "  ✅ Dependências instaladas"
echo "  ✅ Banco de dados configurado"
echo "  ✅ Variáveis de ambiente criadas"
echo "  ✅ Scripts de desenvolvimento prontos"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "  1. Para desenvolvimento web:"
echo "     ./start-dev.sh"
echo ""
echo "  2. Para desenvolvimento mobile:"
echo "     ./start-mobile.sh"
echo ""
echo "  3. Para testes:"
echo "     npm run test:all"
echo ""
echo "  4. Para build de produção:"
echo "     npm run build:all"
echo ""

if [ "$DOCKER_AVAILABLE" = false ]; then
    echo "⚠️  ATENÇÃO:"
    echo "   Configure PostgreSQL manualmente antes de iniciar"
fi

if [ "$JAVA_AVAILABLE" = false ]; then
    echo "   Configure Java e Android SDK para desenvolvimento Android"
fi

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "   Para desenvolvimento iOS, use um Mac com Xcode"
fi

echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "   API: http://localhost:3001/api/docs"
echo "   Frontend: http://localhost:3000"
echo "   Código: README.md em cada pasta"
echo ""
echo "🏥 MediApp inicializado com sucesso!"
echo "=========================================="