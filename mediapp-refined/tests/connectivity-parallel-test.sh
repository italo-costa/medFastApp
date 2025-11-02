#!/bin/bash

# Teste de conectividade Frontend-Backend em paralelo
echo "🚀 INICIANDO TESTE DE CONECTIVIDADE PARALELO"
echo "==========================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend

# Iniciar backend em background
echo "🔄 Iniciando backend..."
npm run start &
BACKEND_PID=$!

# Aguardar inicialização
echo "⏳ Aguardando inicialização (8 segundos)..."
sleep 8

# Função para testar endpoints
test_endpoint() {
    local url=$1
    local name=$2
    local response=$(curl -s -w "%{http_code}" -o /tmp/response.html "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ $name: OK (200)"
        return 0
    else
        echo "❌ $name: FALHOU ($response)"
        return 1
    fi
}

echo ""
echo "🧪 EXECUTANDO TESTES DE CONECTIVIDADE:"
echo "------------------------------------"

# Testar endpoints
test_endpoint "http://localhost:3002/health" "Health Check"
test_endpoint "http://localhost:3002/api/medicos" "API Médicos"  
test_endpoint "http://localhost:3002/gestao-medicos.html" "Gestão Médicos"
test_endpoint "http://localhost:3002/gestao-pacientes.html" "Gestão Pacientes"
test_endpoint "http://localhost:3002/app.html" "App Principal"

echo ""
echo "📊 TESTE ADICIONAL: Conteúdo das páginas"
echo "---------------------------------------"

# Verificar se o conteúdo está sendo servido
if curl -s "http://localhost:3002/gestao-medicos.html" | grep -q "html"; then
    echo "✅ Páginas HTML sendo servidas corretamente"
else
    echo "❌ Problema no serviço de páginas HTML"
fi

# Verificar API JSON
if curl -s "http://localhost:3002/api/medicos" | grep -q "\\["; then
    echo "✅ API JSON respondendo corretamente"
else
    echo "❌ Problema na API JSON"
fi

echo ""
echo "🔄 Finalizando backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo "✅ TESTE DE CONECTIVIDADE CONCLUÍDO!"