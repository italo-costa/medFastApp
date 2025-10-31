#!/bin/bash

# Script simples para monitorar a aplicação
echo "🔍 Monitoramento simplificado da aplicação MediApp..."

cd /mnt/c/workspace/aplicativo/backend

# Verificar recursos
echo "📊 Recursos disponíveis:"
free -h | grep '^Mem:'
df -h /mnt/c | tail -1

# Iniciar servidor com logs
echo "🚀 Iniciando servidor..."
PORT=3001 node src/server.js > monitor.log 2>&1 &
SERVER_PID=$!

echo "📋 Servidor PID: $SERVER_PID"

# Monitorar por 30 segundos
for i in {1..30}; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Servidor parou após $i segundos!"
        echo "🔍 Últimas linhas do log:"
        tail -10 monitor.log 2>/dev/null || echo "Sem logs disponíveis"
        exit 1
    fi
    
    # Teste de conectividade
    if [ $i -eq 5 ]; then
        echo "🌐 Testando conectividade..."
        curl -s http://localhost:3001/health > /dev/null && echo "✅ Health check OK" || echo "❌ Health check falhou"
    fi
    
    echo "✅ Servidor ativo ($i/30s)"
    sleep 1
done

echo "🎉 Monitoramento concluído - servidor estável!"
kill $SERVER_PID 2>/dev/null