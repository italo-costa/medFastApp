#!/bin/bash

echo "🚀 Iniciando MediApp com servidor PERSISTENTE..."
echo "📅 $(date)"
echo "🔧 WSL Ubuntu - Versão resistente a sinais SIGINT/SIGTERM"

cd /mnt/c/workspace/aplicativo/backend

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

# Verificar se arquivo existe
if [ ! -f "persistent-server.js" ]; then
    echo "❌ persistent-server.js não encontrado"
    exit 1
fi

echo "✅ Arquivos verificados"
echo "🏗️  Verificando dependências..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🔄 Matando processos existentes na porta 3002..."
# Matar processos que possam estar usando a porta
pkill -f "node.*persistent-server.js" 2>/dev/null || true
pkill -f "node.*robust-server.js" 2>/dev/null || true

# Aguardar um pouco
sleep 2

echo "🎯 Iniciando servidor persistente..."
echo "🛡️  Configurado para IGNORAR sinais SIGINT/SIGTERM automáticos"
echo ""

# Executar o servidor
exec node persistent-server.js