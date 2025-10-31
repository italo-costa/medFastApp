#!/bin/bash
echo "⚙️ Configurando ambiente MediApp Refinado..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd apps/backend && npm install

# Voltar para raiz
cd ../..

echo "✅ Setup concluído!"
echo "🚀 Para iniciar: ./scripts/development/start.sh"
