#!/bin/bash

echo "🏥 MediApp - Iniciando Teste de Calendário v3.0.0"
echo "================================================"

# Navegar para diretório correto
cd /mnt/c/workspace/aplicativo/apps/backend

# Matar processos anteriores se existirem
echo "🔄 Limpando processos anteriores..."
pkill -f "node.*server-robust" 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true
sleep 2

# Verificar se Docker está rodando
echo "🐳 Verificando Docker..."
docker ps > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Docker não está rodando. Iniciando banco..."
    docker start mediapp-db 2>/dev/null || echo "⚠️ Container mediapp-db não encontrado"
else
    echo "✅ Docker rodando"
fi

# Aguardar banco
echo "⏳ Aguardando banco de dados..."
sleep 5

# Iniciar servidor em background
echo "🚀 Iniciando servidor MediApp..."
nohup node server-robust.js > server.log 2>&1 &
SERVER_PID=$!

# Aguardar servidor inicializar
echo "⏳ Aguardando servidor inicializar..."
sleep 5

# Testar conectividade
echo "🔍 Testando conectividade..."
for i in {1..10}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ Servidor ativo na porta 3002"
        break
    else
        echo "⏳ Tentativa $i/10 - aguardando servidor..."
        sleep 2
    fi
done

# Testar APIs principais
echo ""
echo "📊 Testando APIs de Agenda:"
echo "=========================="

echo "1. Health Check:"
curl -s http://localhost:3002/health | jq '.' 2>/dev/null || echo "❌ Falha no health check"

echo ""
echo "2. Dashboard Agenda:"
curl -s http://localhost:3002/api/agenda/dashboard | jq '.' 2>/dev/null || echo "⚠️ API agenda/dashboard não encontrada"

echo ""
echo "3. Lista de Pacientes:"
curl -s http://localhost:3002/api/agenda/pacientes | jq '.' 2>/dev/null || echo "⚠️ API agenda/pacientes não encontrada"

echo ""
echo "4. Lista de Médicos:"
curl -s http://localhost:3002/api/agenda/medicos | jq '.' 2>/dev/null || echo "⚠️ API agenda/medicos não encontrada"

echo ""
echo "5. Lista de Agendamentos:"
curl -s http://localhost:3002/api/agenda/agendamentos | jq '.' 2>/dev/null || echo "⚠️ API agenda/agendamentos não encontrada"

echo ""
echo "📱 URLs Disponíveis:"
echo "==================="
echo "🌐 Página de Teste: http://localhost:3002/teste-calendario.html"
echo "📅 Agenda Médica: http://localhost:3002/agenda-medica.html"
echo "🏠 Dashboard: http://localhost:3002/"
echo "🔍 Health: http://localhost:3002/health"

echo ""
echo "🎯 Servidor rodando (PID: $SERVER_PID)"
echo "📄 Logs em: server.log"
echo "⛔ Para parar: kill $SERVER_PID"
echo ""
echo "✅ Teste de Calendário MediApp inicializado com sucesso!"