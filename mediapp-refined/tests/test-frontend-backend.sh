#!/bin/bash

# Script para testar conectividade Frontend-Backend
echo "🔍 FASE 3: Teste de Conectividade Frontend-Backend"
echo "================================================="

# Navegar para o diretório do backend
cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend

echo "🚀 Iniciando backend em background..."
# Iniciar o backend em background
npm run start &
BACKEND_PID=$!

# Aguardar o backend inicializar
echo "⏳ Aguardando backend inicializar (5 segundos)..."
sleep 5

echo "🧪 Testando conectividade..."

# Testar health check
echo "1. Health Check:"
curl -s -w "\n  Status: %{http_code}\n  Tempo: %{time_total}s\n" http://localhost:3002/health

echo ""
echo "2. API Médicos:"
curl -s -w "\n  Status: %{http_code}\n  Tempo: %{time_total}s\n" http://localhost:3002/api/medicos

echo ""
echo "3. Página Gestão Médicos:"
curl -s -w "\n  Status: %{http_code}\n  Tempo: %{time_total}s\n" -o /dev/null http://localhost:3002/gestao-medicos.html

echo ""
echo "4. Página Gestão Pacientes:"
curl -s -w "\n  Status: %{http_code}\n  Tempo: %{time_total}s\n" -o /dev/null http://localhost:3002/gestao-pacientes.html

echo ""
echo "5. Página Principal (app.html):"
curl -s -w "\n  Status: %{http_code}\n  Tempo: %{time_total}s\n" -o /dev/null http://localhost:3002/app.html

echo ""
echo "🔄 Finalizando testes..."

# Finalizar o backend
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo "✅ Testes de conectividade Frontend-Backend concluídos!"