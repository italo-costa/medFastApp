#!/bin/bash

echo "🚀 TESTE DE ESTABILIDADE DO SERVIDOR MEDIAPP"
echo "============================================="

cd /mnt/c/workspace/aplicativo/backend

echo "📍 Iniciando servidor em background..."
node src/server.js &
SERVER_PID=$!

echo "⏳ Aguardando 3 segundos para inicialização..."
sleep 3

echo "🩺 Testando health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3002/health)

if [ $? -eq 0 ]; then
    echo "✅ Health check funcionando!"
    echo "📋 Resposta: $HEALTH_RESPONSE"
else
    echo "❌ Health check falhou!"
fi

echo "🩺 Testando endpoint de pacientes..."
PATIENTS_RESPONSE=$(curl -s http://localhost:3002/api/patients)

if [ $? -eq 0 ]; then
    echo "✅ API de pacientes respondendo!"
    echo "📋 Resposta: $PATIENTS_RESPONSE"
else
    echo "❌ API de pacientes falhou!"
fi

echo "⏳ Deixando servidor rodar por 10 segundos..."
sleep 10

echo "🛑 Finalizando servidor..."
kill $SERVER_PID

echo "✅ Teste de estabilidade concluído!"