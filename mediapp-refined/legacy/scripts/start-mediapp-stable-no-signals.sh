#!/bin/bash

# Script para iniciar MediApp com servidor estável (sem SIGINT/SIGTERM handlers)

cd /mnt/c/workspace/aplicativo/backend

echo "🚀 Iniciando MediApp Server Estável..."

# Finalizar processos anteriores
pkill -f "real-data-server" 2>/dev/null || true
sleep 2

# Iniciar servidor estável em background
PORT=3001 nohup node real-data-server-stable.js > /tmp/mediapp-stable.log 2>&1 &

# Aguardar inicialização
sleep 5

# Verificar se está rodando
if pgrep -f "real-data-server-stable" > /dev/null; then
    echo "✅ MediApp Server Estável iniciado com sucesso!"
    echo "📊 Porta: 3001"
    echo "🌐 Dashboard: http://localhost:3001/app.html"
    echo "🩺 Gestão Médicos: http://localhost:3001/gestao-medicos.html"
    echo "🔧 Health Check: http://localhost:3001/health"
    echo "📈 API Stats: http://localhost:3001/api/statistics/dashboard"
    echo "📝 Logs: /tmp/mediapp-stable.log"
    echo ""
    echo "💡 Servidor configurado SEM handlers SIGINT/SIGTERM"
    echo "🔄 Para ver logs: tail -f /tmp/mediapp-stable.log"
    echo "🛑 Para parar: pkill -f real-data-server-stable"
    echo ""
    
    # Testar conectividade
    sleep 3
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "🎉 Servidor respondendo corretamente!"
    else
        echo "⚠️  Servidor iniciado mas pode estar carregando..."
    fi
else
    echo "❌ Erro ao iniciar servidor. Verificando logs..."
    cat /tmp/mediapp-stable.log 2>/dev/null || echo "Nenhum log encontrado"
fi