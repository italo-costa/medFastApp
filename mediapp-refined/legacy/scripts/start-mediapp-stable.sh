#!/bin/bash

# Script para iniciar o MediApp em background de forma estável

cd /mnt/c/workspace/aplicativo/backend

# Finalizar processos anteriores
pkill -f real-data-server 2>/dev/null

# Aguardar um momento
sleep 2

# Iniciar servidor em background com nohup
echo "Iniciando MediApp Server..."
PORT=3001 nohup node real-data-server.js > /tmp/mediapp-server.log 2>&1 &

# Aguardar inicialização
sleep 5

# Verificar se está rodando
if pgrep -f real-data-server > /dev/null; then
    echo "✅ MediApp Server iniciado com sucesso!"
    echo "📊 Porta: 3001"
    echo "📱 Dashboard: http://localhost:3001/app.html"
    echo "🩺 Gestão Médicos: http://localhost:3001/gestao-medicos.html"
    echo "📝 Logs: /tmp/mediapp-server.log"
    echo ""
    echo "Para ver logs em tempo real: tail -f /tmp/mediapp-server.log"
    echo "Para parar servidor: pkill -f real-data-server"
else
    echo "❌ Erro ao iniciar servidor. Verificando logs..."
    cat /tmp/mediapp-server.log
fi