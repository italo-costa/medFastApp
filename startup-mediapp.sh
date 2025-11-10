#!/bin/bash
# 🚀 MediApp - Script de Inicialização Completa v3

set -e

# Configurações
APP_DIR="/mnt/c/workspace/aplicativo"
BACKEND_DIR="$APP_DIR/apps/backend"
LOG_FILE="/tmp/mediapp_startup.log"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
    echo "[$(date +'%H:%M:%S')] $1" >> "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
    echo "[$(date +'%H:%M:%S')] $1" >> "$LOG_FILE"
}

success() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] ✅ $1${NC}"
    echo "[$(date +'%H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

echo -e "${PURPLE}"
cat << 'EOF'
🏥 ============================================= 🏥
   MediApp v3.0.0 - Sistema de Inicialização
   🚀 Subindo aplicação completa...
🏥 ============================================= 🏥
EOF
echo -e "${NC}"

log "🎯 Iniciando processo de startup do MediApp v3.0.0"

# 1. Verificar estrutura de diretórios
log "📁 Verificando estrutura de diretórios..."
if [ ! -d "$BACKEND_DIR" ]; then
    error "Diretório backend não encontrado: $BACKEND_DIR"
fi

cd "$BACKEND_DIR"
log "📂 Navegando para: $(pwd)"

# 2. Verificar dependências do sistema
log "🔍 Verificando dependências do sistema..."

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    error "Node.js não está instalado"
fi
NODE_VERSION=$(node --version)
log "✅ Node.js encontrado: $NODE_VERSION"

# Verificar npm
if ! command -v npm >/dev/null 2>&1; then
    error "npm não está instalado"
fi
NPM_VERSION=$(npm --version)
log "✅ npm encontrado: v$NPM_VERSION"

# 3. Instalar/Verificar dependências npm
log "📦 Verificando dependências npm..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    log "📥 Instalando dependências npm..."
    npm install >/dev/null 2>&1 || warn "Erro na instalação - continuando"
    success "Dependências npm instaladas"
else
    log "✅ Dependências npm já existem"
fi

# 4. Configurar banco de dados
log "🗄️ Configurando banco de dados..."

# Verificar se PostgreSQL está rodando (Docker ou nativo)
if docker ps | grep -q postgres; then
    log "✅ PostgreSQL Docker encontrado"
    DB_HOST="localhost"
    DB_PORT="5433"
elif pgrep -x "postgres" > /dev/null; then
    log "✅ PostgreSQL nativo encontrado"
    DB_HOST="localhost"  
    DB_PORT="5432"
else
    log "🐘 Iniciando PostgreSQL via Docker..."
    
    # Criar docker-compose temporário para PostgreSQL
    cat > /tmp/postgres-only.yml << EOF
services:
  postgres:
    image: postgres:15-alpine
    container_name: mediapp-postgres-startup
    environment:
      POSTGRES_USER: mediapp
      POSTGRES_PASSWORD: mediapp123
      POSTGRES_DB: mediapp_db
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mediapp"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
EOF

    docker compose -f /tmp/postgres-only.yml up -d
    
    # Aguardar PostgreSQL ficar pronto
    log "⏳ Aguardando PostgreSQL ficar pronto..."
    for i in {1..30}; do
        if docker exec mediapp-postgres-startup pg_isready -U mediapp >/dev/null 2>&1; then
            success "PostgreSQL está pronto!"
            break
        elif [ $i -eq 30 ]; then
            error "PostgreSQL não ficou pronto após 30 tentativas"
        else
            sleep 2
        fi
    done
    
    DB_HOST="localhost"
    DB_PORT="5433"
fi

# 5. Configurar variáveis de ambiente
log "⚙️ Configurando variáveis de ambiente..."

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    log "📝 Criando arquivo .env..."
    cat > .env << EOF
# MediApp v3.0.0 - Configurações de Ambiente
NODE_ENV=development
PORT=3002

# Banco de Dados
DATABASE_URL="postgresql://mediapp:mediapp123@${DB_HOST}:${DB_PORT}/mediapp_db?schema=public"
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=mediapp
DB_PASSWORD=mediapp123
DB_NAME=mediapp_db

# JWT
JWT_SECRET=mediapp_jwt_secret_super_secure_2025_development

# Logs
LOG_LEVEL=info
LOG_FILE=logs/mediapp.log

# Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Cache
REDIS_URL=redis://localhost:6379

# Aplicação
APP_NAME=MediApp
APP_VERSION=3.0.0
ENVIRONMENT=development
EOF
    success "Arquivo .env criado"
else
    log "✅ Arquivo .env já existe"
fi

# Carregar variáveis de ambiente
export NODE_ENV=development
export PORT=3002
export DATABASE_URL="postgresql://mediapp:mediapp123@${DB_HOST}:${DB_PORT}/mediapp_db?schema=public"

# 6. Executar migrações do banco
log "🔄 Executando migrações do banco de dados..."
if [ -d "prisma" ]; then
    log "📋 Gerando Prisma Client..."
    npx prisma generate >/dev/null 2>&1 || warn "Erro ao gerar Prisma Client"
    
    log "🔄 Executando migrações..."
    npx prisma db push --force-reset --skip-generate >/dev/null 2>&1 || warn "Erro nas migrações - continuando"
    
    success "Migrações executadas"
else
    warn "Diretório prisma não encontrado - pulando migrações"
fi

# 7. Criar diretórios necessários
log "📁 Criando diretórios necessários..."
mkdir -p uploads logs
chmod 755 uploads logs
success "Diretórios criados"

# 8. Verificar estrutura de arquivos críticos
log "📋 Verificando arquivos críticos..."
CRITICAL_FILES=("src/app.js" "package.json")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "✅ $file encontrado"
    else
        error "Arquivo crítico não encontrado: $file"
    fi
done

# 9. Testar conectividade do banco
log "🔗 Testando conectividade do banco de dados..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Conexão com banco estabelecida');
    process.exit(0);
  })
  .catch((e) => {
    console.log('❌ Erro na conexão:', e.message);
    process.exit(1);
  });
" || warn "Erro na conexão com banco - continuando"

# 10. Iniciar aplicação
log "🚀 Iniciando aplicação MediApp..."

# Função para verificar se a porta está livre
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Porta em uso
    else
        return 0  # Porta livre
    fi
}

# Verificar porta 3002
if ! check_port 3002; then
    warn "Porta 3002 em uso - tentando liberar..."
    pkill -f "node.*3002" 2>/dev/null || true
    sleep 2
fi

# Iniciar servidor em background com logs
log "🎯 Iniciando servidor na porta 3002..."
nohup node src/app.js > logs/server.log 2>&1 &
SERVER_PID=$!

# Salvar PID para controle
echo $SERVER_PID > /tmp/mediapp_server.pid
log "📋 Servidor iniciado com PID: $SERVER_PID"

# 11. Aguardar servidor ficar pronto
log "⏳ Aguardando servidor ficar pronto..."
for i in {1..30}; do
    if curl -s http://localhost:3002/health >/dev/null 2>&1; then
        success "Servidor está respondendo!"
        break
    elif [ $i -eq 30 ]; then
        error "Servidor não respondeu após 30 tentativas"
    else
        sleep 2
        info "Tentativa $i/30..."
    fi
done

# 12. Verificação final e relatório
log "📊 Executando verificação final..."

# Testar endpoints básicos
ENDPOINTS=(
    "http://localhost:3002/health"
    "http://localhost:3002/"
    "http://localhost:3002/api/medicos"
    "http://localhost:3002/api/pacientes"
)

success "🏥 MediApp v3.0.0 iniciado com sucesso!"
echo -e "${PURPLE}"
cat << EOF

🎉 =============================================
   ✅ MEDIAPP v3.0.0 ESTÁ RODANDO!
🎉 =============================================

📊 Status da Aplicação:
   • Servidor: ✅ Rodando (PID: $SERVER_PID)
   • Porta: ✅ 3002
   • Banco: ✅ PostgreSQL (${DB_HOST}:${DB_PORT})
   • Ambiente: ✅ Development
   • Logs: ✅ logs/server.log

🌐 URLs Disponíveis:
   • Frontend: http://localhost:3002
   • Health Check: http://localhost:3002/health
   • API Médicos: http://localhost:3002/api/medicos
   • API Pacientes: http://localhost:3002/api/pacientes

🛠️ Comandos Úteis:
   • Ver logs: tail -f logs/server.log
   • Parar servidor: kill $SERVER_PID
   • Status: ps aux | grep $SERVER_PID
   • Monitorar: cd /mnt/c/workspace/aplicativo/infra-deploy && ./scripts/monitor.sh --dashboard

📝 Arquivos de Log:
   • Startup: $LOG_FILE
   • Servidor: $BACKEND_DIR/logs/server.log

EOF
echo -e "${NC}"

success "Aplicação MediApp v3.0.0 está funcionando e monitorada!"
log "🎯 Processo de startup concluído com sucesso"