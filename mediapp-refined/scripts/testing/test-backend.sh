#!/bin/bash
echo "🧪 Testando backend..."
cd apps/backend

# Verificar se o servidor pode ser importado
node -e "
try {
  const app = require('./src/app.js');
  console.log('✅ Servidor pode ser importado');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro ao importar servidor:', error.message);
  process.exit(1);
}
"
