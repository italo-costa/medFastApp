#!/bin/bash

# MediApp - Script de Inicialização Robusta
echo "=========================================="
echo "🏥 MediApp - Inicialização do Servidor"
echo "=========================================="

# Definir diretório
BACKEND_DIR="/mnt/c/workspace/aplicativo/backend"
cd "$BACKEND_DIR" || exit 1

# Verificar se arquivo existe
if [ ! -f "server-clean.js" ]; then
    echo "❌ ERRO: server-clean.js não encontrado"
    exit 1
fi

# Matar processos anteriores
echo "🧹 Limpando processos anteriores..."
pkill -f "node.*server-clean.js" 2>/dev/null || true
sleep 2

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado"
    exit 1
fi

echo "📋 Node.js: $(node --version)"
echo "📁 Diretório: $(pwd)"

# Verificar porta
if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo "⚠️  Porta 3001 em uso, liberando..."
    sudo fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
export NODE_ENV=production
export PORT=3001

# Método 1: Tentar iniciar diretamente
node server-clean.js &
SERVER_PID=$!

echo "📊 PID do servidor: $SERVER_PID"
sleep 3

# Verificar se está rodando
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor iniciado com sucesso!"
    
    # Testar conectividade
    for i in {1..5}; do
        if curl -s http://localhost:3001/health > /dev/null; then
            echo "✅ Servidor respondendo na porta 3001"
            echo "🌐 URL: http://localhost:3001"
            echo "📋 Health: http://localhost:3001/health"
            echo "🎯 PRONTO PARA USO!"
            exit 0
        fi
        echo "⏳ Aguardando servidor responder ($i/5)..."
        sleep 2
    done
    
    echo "⚠️  Servidor iniciado mas não responde"
    ps aux | grep node
else
    echo "❌ Falha ao iniciar servidor"
    exit 1
fi