#!/bin/bash
cd /mnt/c/workspace/aplicativo/apps/backend
echo "🚀 Iniciando MediApp v2.0..."
echo "📂 Diretório: $(pwd)"
echo "📦 Verificando dependências..."

if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

echo "🔄 Gerando cliente Prisma..."
npx prisma generate

echo "🏥 Iniciando servidor MediApp..."
node src/app.js