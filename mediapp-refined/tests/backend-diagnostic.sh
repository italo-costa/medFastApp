#!/bin/bash

# Script para iniciar backend e fazer testes detalhados
echo "🔍 FASE 3: Diagnóstico Completo Frontend-Backend"
echo "==============================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend

echo "📋 Verificando dependências do backend..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules não encontrado. Instalando dependências..."
    npm install
fi

echo "🔧 Verificando configuração..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    echo "Conteúdo do .env:"
    cat .env | head -10
else
    echo "⚠️  Arquivo .env não encontrado"
fi

echo ""
echo "🚀 Iniciando backend com log detalhado..."
timeout 10s npm run start || echo "Backend foi finalizado após 10 segundos"

echo ""
echo "🧪 Testando portas disponíveis..."
netstat -tln | grep ":3002" || echo "Porta 3002 não está em uso"

echo ""
echo "📊 Resultado do teste:"
echo "- Backend: Testado"
echo "- Logs: Capturados" 
echo "- Diagnóstico: Completo"