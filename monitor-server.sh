#!/bin/bash

# Script para monitorar SIGTERM/SIGINT e problemas de estabilidade
echo "🔍 Iniciando monitoramento da aplicação MediApp..."

cd /mnt/c/workspace/aplicativo/backend

# Função para cleanup em caso de interrupção
cleanup() {
    echo "🧹 Limpando processos..."
    pkill -f "node src/server.js" 2>/dev/null || true
    exit 0
}

# Capturar sinais
trap cleanup SIGTERM SIGINT

# Verificar recursos do sistema
echo "📊 Status do sistema:"
echo "Memory usage: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "Disk usage: $(df -h /mnt/c | tail -1 | awk '{print $5}')"
echo "Process count: $(ps aux | wc -l)"

# Iniciar servidor com logs detalhados
echo "🚀 Iniciando servidor com monitoramento..."
PORT=3001 timeout 60 strace -e signal -p $$ node src/server.js 2>&1 | tee detailed-server.log &
SERVER_PID=$!

echo "📋 Servidor PID: $SERVER_PID"

# Monitorar por 30 segundos
for i in {1..30}; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Servidor morreu após $i segundos!"
        echo "🔍 Verificando logs..."
        tail -20 detailed-server.log
        break
    fi
    echo "✅ Servidor ativo ($i/30s)"
    sleep 1
done

# Cleanup final
cleanup