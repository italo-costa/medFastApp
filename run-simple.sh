#!/bin/bash
# 🏥 MediApp - Execução Simples

cd /mnt/c/workspace/aplicativo/apps/backend

echo "🏥 MediApp v3.0.0 - Execução Direta"
echo "📁 Diretório: $(pwd)"
echo ""

# Verificar dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🚀 Iniciando servidor de teste..."
echo "🔗 URL: http://localhost:3003"
echo "💊 Health: http://localhost:3003/health"
echo ""
echo "=== LOGS ==="

# Executar direto
exec node test-server.js