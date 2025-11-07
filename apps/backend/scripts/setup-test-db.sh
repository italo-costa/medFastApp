#!/bin/bash

# Script para configurar o banco de dados de teste

echo "🧪 Configurando banco de dados de teste..."

# Verificar se o PostgreSQL está rodando
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL não está rodando. Inicie o PostgreSQL primeiro."
    exit 1
fi

# Criar banco de teste se não existir
echo "📦 Criando banco de teste se necessário..."
createdb -h localhost -U postgres medifast_test 2>/dev/null || echo "Banco medifast_test já existe"

# Exportar variáveis de ambiente para teste
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medifast_test?schema=public"

# Executar migrations no banco de teste
echo "🔄 Executando migrations no banco de teste..."
npx prisma migrate deploy --schema=prisma/schema.prisma

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "✅ Banco de teste configurado com sucesso!"
echo "🔗 DATABASE_URL: $DATABASE_URL"