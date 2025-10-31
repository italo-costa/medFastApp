#!/bin/bash

echo "🚀 Iniciando MediApp e testando conectividade..."

# Matar processos existentes na porta 3001
pkill -f "node.*server-clean" 2>/dev/null || true

# Iniciar servidor
cd /mnt/c/workspace/aplicativo/backend
node server-clean.js &
SERVER_PID=$!

echo "📋 Servidor iniciado com PID: $SERVER_PID"

# Aguardar 3 segundos para o servidor inicializar
sleep 3

echo ""
echo "🔍 Testando conectividade..."

# Testar health check
echo "1. Testando /health:"
wget -qO- http://127.0.0.1:3001/health || echo "❌ Falhou"

echo ""
echo "2. Testando /api/medicos:"
wget -qO- http://127.0.0.1:3001/api/medicos | head -5 || echo "❌ Falhou"

echo ""
echo "3. Testando página principal:"
wget -qO- http://127.0.0.1:3001/ | head -2 || echo "❌ Falhou"

echo ""
echo "✅ Testes concluídos. Servidor PID: $SERVER_PID"