cd /mnt/c/workspace/aplicativo

echo "🚀 Iniciando MediApp v3.0.0 - Sistema Refatorado"
echo "================================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado"
    exit 1
fi

echo "✅ Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Limpar processos anteriores
echo "🧹 Limpando processos anteriores..."
pkill -f "node.*app" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
docker stop mediapp-db 2>/dev/null || true
docker rm mediapp-db 2>/dev/null || true

# Aguardar um momento
sleep 2

# Verificar se PostgreSQL está rodando
echo "🐘 Verificando PostgreSQL..."
if ! docker ps | grep -q "mediapp-db"; then
    echo "🚀 Iniciando PostgreSQL..."
    docker run -d \
        --name mediapp-db \
        --memory=256m \
        --memory-swap=512m \
        -p 5433:5432 \
        -e POSTGRES_DB=mediapp \
        -e POSTGRES_USER=mediapp \
        -e POSTGRES_PASSWORD=mediapp123 \
        -e POSTGRES_INITDB_ARGS="--auth-host=md5" \
        -e SHARED_PRELOAD_LIBRARIES="" \
        postgres:15-alpine
    
    echo "⏳ Aguardando PostgreSQL iniciar..."
    sleep 10
    
    # Verificar se iniciou corretamente
    if docker ps | grep -q "mediapp-db"; then
        echo "✅ PostgreSQL rodando"
    else
        echo "❌ Falha ao iniciar PostgreSQL"
        docker logs mediapp-db
        exit 1
    fi
else
    echo "✅ PostgreSQL já rodando"
fi

# Navegar para o backend
cd apps/backend

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar porta disponível
PORT=3002
echo "🔍 Verificando porta $PORT..."
if netstat -tlnp 2>/dev/null | grep -q ":${PORT}.*LISTEN"; then
    echo "⚠️ Porta $PORT em uso, tentando porta 3003..."
    PORT=3003
fi

if netstat -tlnp 2>/dev/null | grep -q ":${PORT}.*LISTEN"; then
    echo "⚠️ Porta $PORT em uso, tentando porta 3004..."
    PORT=3004
fi

echo "✅ Usando porta: $PORT"

# Definir variáveis de ambiente
export DATABASE_URL="postgresql://mediapp:mediapp123@localhost:5433/mediapp"
export PORT=$PORT
export NODE_ENV=development

echo "🗄️ Aplicando migrações..."
npx prisma migrate deploy --schema=./src/prisma/schema.prisma

echo "🌱 Gerando cliente Prisma..."
npx prisma generate --schema=./src/prisma/schema.prisma

# Iniciar servidor
echo "🚀 Iniciando servidor na porta $PORT..."
echo "🌐 Acesse: http://localhost:$PORT"
echo ""
echo "Para parar o servidor, pressione Ctrl+C"
echo "================================================"

node src/app.js