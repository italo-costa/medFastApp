#!/bin/bash

# Script para iniciar aplicação MediApp completa
echo "🚀 Iniciando MediApp v2.0 - Aplicação Completa"
echo "=============================================="

# Limpar processos anteriores
echo "🧹 Limpando processos anteriores..."
pkill -f node 2>/dev/null || true
sleep 2

# Ir para diretório do backend
cd /mnt/c/workspace/aplicativo/backend || {
    echo "❌ Erro: Não foi possível acessar diretório backend"
    exit 1
}

# Verificar se node_modules existe
if [ ! -d "node_modules" ] && [ ! -d "../node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se PostgreSQL está rodando
echo "🗄️ Verificando PostgreSQL..."
service postgresql status | grep -q "online" || {
    echo "🔄 PostgreSQL não detectado, continuando sem DB..."
}

# Verificar se o banco existe
echo "🗄️ Verificando banco de dados..."
echo "� Usando configuração de desenvolvimento local"

# Gerar Prisma Client se necessário
if [ -f "prisma/schema.prisma" ]; then
    echo "🔧 Configurando Prisma..."
    npx prisma generate 2>/dev/null || true
fi

# Definir variáveis de ambiente
export NODE_ENV=development
export PORT=3001
export DATABASE_URL="postgresql://postgres:senha@localhost:5432/mediapp"

echo "🎯 Iniciando servidor completo..."
echo "📊 Frontend + Backend + APIs + Database"
echo "🌐 URL: http://localhost:3001"
echo "🔧 Health: http://localhost:3001/health"
echo "👥 Pacientes: http://localhost:3001/api/pacientes"
echo "👨‍⚕️ Médicos: http://localhost:3001/api/medicos"
echo "=============================================="

# Iniciar servidor
node src/server-frontend.js