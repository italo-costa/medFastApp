#!/bin/bash
# 🚀 MediApp - Startup Rápido e Eficiente

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'  
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; exit 1; }
success() { echo -e "${PURPLE}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }

echo -e "${PURPLE}🏥 MediApp v3.0.0 - Inicialização Rápida${NC}"

# 1. Navegar para backend
cd /mnt/c/workspace/aplicativo/apps/backend
log "📁 Diretório: $(pwd)"

# 2. Parar processos conflitantes
log "🛑 Parando processos conflitantes..."
pkill -f "node.*3002" 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

# 3. Iniciar PostgreSQL via Docker
log "🐘 Iniciando PostgreSQL..."
docker run -d \
  --name mediapp-db \
  --rm \
  -e POSTGRES_USER=mediapp \
  -e POSTGRES_PASSWORD=mediapp123 \
  -e POSTGRES_DB=mediapp_db \
  -p 5433:5432 \
  postgres:15-alpine

# 4. Aguardar banco ficar pronto
log "⏳ Aguardando PostgreSQL..."
for i in {1..20}; do
    if docker exec mediapp-db pg_isready -U mediapp >/dev/null 2>&1; then
        success "PostgreSQL pronto!"
        break
    elif [ $i -eq 20 ]; then
        error "PostgreSQL não ficou pronto"
    else
        sleep 1
    fi
done

# 5. Configurar .env
log "⚙️ Configurando ambiente..."
cat > .env << EOF
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://mediapp:mediapp123@localhost:5433/mediapp_db?schema=public"
JWT_SECRET=mediapp_jwt_2025
LOG_LEVEL=info
EOF

# 6. Preparar aplicação
log "📦 Preparando aplicação..."
mkdir -p logs uploads
export DATABASE_URL="postgresql://mediapp:mediapp123@localhost:5433/mediapp_db?schema=public"

# 7. Prisma setup
if [ -d "prisma" ]; then
    log "🔧 Configurando Prisma..."
    npx prisma generate >/dev/null 2>&1 || true
    npx prisma db push >/dev/null 2>&1 || true
fi

# 8. Iniciar servidor
log "🚀 Iniciando servidor..."
nohup node src/app.js > logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/mediapp.pid

# 9. Aguardar servidor
log "⏳ Aguardando servidor (PID: $SERVER_PID)..."
for i in {1..15}; do
    if curl -s http://localhost:3002/health >/dev/null 2>&1; then
        success "Servidor respondendo!"
        break
    elif [ $i -eq 15 ]; then
        warn "Servidor demorou para responder - verificando logs..."
        tail -10 logs/server.log
        break
    else
        sleep 2
    fi
done

# 10. Status final
echo -e "${PURPLE}"
cat << EOF

🎉 ========================================
   ✅ MEDIAPP v3.0.0 INICIADO!
🎉 ========================================

📊 Status:
   • Servidor: http://localhost:3002 (PID: $SERVER_PID)
   • Banco: PostgreSQL Docker (porta 5433)
   • Logs: tail -f logs/server.log

🌐 Testar:
   • curl http://localhost:3002/health
   • curl http://localhost:3002/
   
🛠️ Controle:
   • Parar: kill $SERVER_PID && docker stop mediapp-db
   • Monitorar: cd /mnt/c/workspace/aplicativo/infra-deploy && ./scripts/monitor.sh

EOF
echo -e "${NC}"

success "MediApp está rodando!"