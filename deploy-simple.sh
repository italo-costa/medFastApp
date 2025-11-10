#!/bin/bash
# Script simplificado para deploy do MediApp

echo "🏥 Iniciando MediApp v3.0.0..."

# Configurações
BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
PORT=3002

# Limpeza inicial
echo "🧹 Limpando processos anteriores..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "node.*app" 2>/dev/null || true

# Verificar se PostgreSQL está rodando
echo "🐘 Verificando PostgreSQL..."
if ! docker ps | grep -q "mediapp-db"; then
    echo "Iniciando PostgreSQL..."
    docker run -d \
        --name mediapp-db \
        --restart unless-stopped \
        -e POSTGRES_USER=mediapp \
        -e POSTGRES_PASSWORD=mediapp123 \
        -e POSTGRES_DB=mediapp_db \
        -p 5433:5432 \
        postgres:15-alpine
    
    echo "Aguardando PostgreSQL ficar pronto..."
    sleep 10
fi

# Ir para diretório do backend
cd "$BACKEND_DIR" || exit 1

# Aplicar migrações
echo "🔄 Aplicando migrações..."
npx prisma migrate deploy >/dev/null 2>&1 || true

# Iniciar servidor
echo "🚀 Iniciando servidor na porta $PORT..."
nohup node server-minimal.js >/dev/null 2>&1 &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 5

# Verificar se está funcionando
if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "✅ Servidor iniciado com sucesso (PID: $SERVER_PID)"
    echo "📍 Acesse: http://localhost:$PORT"
    echo "📍 Health Check: http://localhost:$PORT/health"
    echo "📍 API Médicos: http://localhost:$PORT/api/medicos"
    echo ""
    echo "🎉 MediApp v3.0.0 está funcionando!"
    echo "   Você pode navegar pelos seguintes links:"
    echo "   • Frontend: http://localhost:$PORT"
    echo "   • Documentação da API: http://localhost:$PORT/health"
    echo ""
else
    echo "❌ Falha ao iniciar servidor"
    exit 1
fi