#!/bin/bash

# Script para iniciar servidor robusto que ignora sinais SIGINT/SIGTERM

cd /mnt/c/workspace/aplicativo/backend

echo "🛡️  Iniciando MediApp Servidor Robusto..."
echo "📍 Diretório: $(pwd)"
echo "🔧 Node.js: $(node --version)"
echo "📦 NPM: $(npm --version)"
echo ""

# Matar processos anteriores
echo "🔄 Limpando processos anteriores..."
pkill -f "robust-server" 2>/dev/null || true
pkill -f "test-server" 2>/dev/null || true
pkill -f "real-data-server" 2>/dev/null || true
sleep 2

# Verificar se a porta está livre
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Porta 3001 em uso, liberando..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🚀 Iniciando servidor robusto..."
echo "🎯 O servidor ignorará sinais SIGINT/SIGTERM"
echo "💡 Para parar: pkill -f robust-server"
echo ""

# Iniciar servidor robusto
export PORT=3001
nohup node robust-server.js > /tmp/robust-server.log 2>&1 &

# Aguardar inicialização
sleep 5

# Verificar se está rodando
if pgrep -f "robust-server" > /dev/null; then
    echo "✅ Servidor robusto iniciado com sucesso!"
    echo "📊 PID: $(pgrep -f robust-server)"
    echo "🌐 URL: http://localhost:3001/gestao-medicos.html"
    echo "🔧 Health: http://localhost:3001/health"
    echo "📈 API: http://localhost:3001/api/medicos"
    echo "📝 Logs: tail -f /tmp/robust-server.log"
    echo ""
    
    # Testar conectividade após 3 segundos
    sleep 3
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "🎉 Servidor respondendo corretamente!"
        echo "🔥 Sistema 100% operacional!"
    else
        echo "⏳ Servidor iniciando, aguarde mais alguns segundos..."
    fi
    
    echo ""
    echo "📋 Para monitorar: tail -f /tmp/robust-server.log"
    echo "🛑 Para parar: pkill -f robust-server"
    
else
    echo "❌ Erro ao iniciar servidor"
    echo "📝 Verificando logs..."
    cat /tmp/robust-server.log 2>/dev/null || echo "Nenhum log encontrado"
fi