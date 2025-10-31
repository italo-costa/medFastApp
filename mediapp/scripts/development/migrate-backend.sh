#!/bin/bash

# Script de Migração Automática - MediApp v2.0
# Copia toda a estrutura do backend para a nova arquitetura centralizada

echo "🚀 Iniciando migração para estrutura centralizada..."

# Definir caminhos
OLD_BACKEND="C:/workspace/aplicativo/backend"
NEW_BACKEND="C:/workspace/aplicativo/mediapp/apps/backend"

# Criar estrutura de diretórios se não existir
mkdir -p "$NEW_BACKEND/src"

# Copiar arquivos de configuração
echo "📋 Copiando configurações..."
cp -r "$OLD_BACKEND/src/config" "$NEW_BACKEND/src/" 2>/dev/null || echo "Config já existe"

# Copiar controladores
echo "🎮 Copiando controladores..."
cp -r "$OLD_BACKEND/src/controllers" "$NEW_BACKEND/src/" 2>/dev/null || echo "Controllers já existem"

# Copiar middleware
echo "🛡️ Copiando middleware..."
cp -r "$OLD_BACKEND/src/middleware" "$NEW_BACKEND/src/" 2>/dev/null || echo "Middleware já existe"

# Copiar rotas
echo "🛤️ Copiando rotas..."
cp -r "$OLD_BACKEND/src/routes" "$NEW_BACKEND/src/" 2>/dev/null || echo "Routes já existem"

# Copiar serviços
echo "⚙️ Copiando serviços..."
cp -r "$OLD_BACKEND/src/services" "$NEW_BACKEND/src/" 2>/dev/null || echo "Services já existem"

# Copiar utilitários
echo "🔧 Copiando utilitários..."
cp -r "$OLD_BACKEND/src/utils" "$NEW_BACKEND/src/" 2>/dev/null || echo "Utils já existem"

# Copiar package.json
echo "📦 Copiando package.json..."
cp "$OLD_BACKEND/package.json" "$NEW_BACKEND/" 2>/dev/null || echo "Package.json já existe"

# Copiar .env.example
echo "🔐 Copiando .env.example..."
cp "$OLD_BACKEND/.env.example" "$NEW_BACKEND/" 2>/dev/null || echo ".env.example já existe"

# Copiar schema do Prisma
echo "🗄️ Copiando schema Prisma..."
mkdir -p "$NEW_BACKEND/prisma"
cp -r "$OLD_BACKEND/prisma" "$NEW_BACKEND/" 2>/dev/null || echo "Prisma já existe"

# Copiar pasta public
echo "🌐 Copiando arquivos públicos..."
cp -r "$OLD_BACKEND/public" "$NEW_BACKEND/" 2>/dev/null || echo "Public já existe"

echo "✅ Migração concluída!"
echo "📁 Nova estrutura disponível em: $NEW_BACKEND"
echo ""
echo "Próximos passos:"
echo "1. cd $NEW_BACKEND"
echo "2. npm install"
echo "3. npm run dev"