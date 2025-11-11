#!/bin/bash

echo "🔧 TESTE COMPLETO API AGENDA - MediApp"
echo "======================================"

cd /mnt/c/workspace/aplicativo/apps/backend

# Verificar se Docker está rodando
echo "🐳 Verificando PostgreSQL..."
if ! docker ps | grep -q postgres; then
    echo "⚠️  PostgreSQL não está rodando. Iniciando..."
    docker-compose up -d
    sleep 5
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar arquivo de ambiente
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Usando configuração padrão..."
fi

# Iniciar servidor
echo "🚀 Iniciando servidor na porta 3002..."
PORT=3002 node src/server.js > /tmp/server-teste.log 2>&1 &
SERVER_PID=$!
echo "📍 Servidor iniciado com PID: $SERVER_PID"

# Aguardar inicialização
echo "⏳ Aguardando inicialização (5 segundos)..."
sleep 5

# Testar health check
echo "🏥 Testando health check..."
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Health check OK"
else
    echo "❌ Health check falhou"
fi

# Testar APIs de agenda
echo ""
echo "📅 Testando APIs de Agenda:"
echo "=========================="

# Dashboard
echo "📊 Dashboard:"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/dashboard.json http://localhost:3002/api/agenda/dashboard)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Dashboard: OK"
    echo "   Dados: $(cat /tmp/dashboard.json | head -c 100)..."
else
    echo "❌ Dashboard: ERRO (HTTP $RESPONSE)"
fi

# Pacientes
echo "👥 Pacientes:"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/pacientes.json http://localhost:3002/api/agenda/pacientes)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Pacientes: OK"
    echo "   Dados: $(cat /tmp/pacientes.json | head -c 100)..."
else
    echo "❌ Pacientes: ERRO (HTTP $RESPONSE)"
fi

# Médicos
echo "👨‍⚕️ Médicos:"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/medicos.json http://localhost:3002/api/agenda/medicos)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Médicos: OK"
    echo "   Dados: $(cat /tmp/medicos.json | head -c 100)..."
else
    echo "❌ Médicos: ERRO (HTTP $RESPONSE)"
fi

# Agendamentos
echo "📅 Agendamentos:"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/agendamentos.json http://localhost:3002/api/agenda/agendamentos)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Agendamentos: OK"
    echo "   Dados: $(cat /tmp/agendamentos.json | head -c 100)..."
else
    echo "❌ Agendamentos: ERRO (HTTP $RESPONSE)"
fi

echo ""
echo "🔍 Logs do servidor:"
echo "==================="
tail -10 /tmp/server-teste.log

echo ""
echo "🎯 RESUMO DO TESTE"
echo "=================="
echo "📍 Servidor PID: $SERVER_PID"
echo "🌐 URL: http://localhost:3002"
echo "📊 APIs testadas: Dashboard, Pacientes, Médicos, Agendamentos"

echo ""
echo "Para parar o servidor, execute:"
echo "kill $SERVER_PID"