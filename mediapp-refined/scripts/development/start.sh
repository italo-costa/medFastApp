#!/bin/bash
echo "🚀 Iniciando MediApp Refinado..."
echo "🔗 Backend: http://localhost:3002"
echo "🌐 Frontend: http://localhost:3000"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

cd apps/backend
echo "🔄 Iniciando backend..."
npm start &
BACKEND_PID=$!

echo "✅ Backend iniciado (PID: $BACKEND_PID)"
echo "⚠️ Use Ctrl+C para parar os serviços"

# Aguardar sinal de interrupção
trap "echo '🛑 Parando serviços...'; kill $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait $BACKEND_PID
