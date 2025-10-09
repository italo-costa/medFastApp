#!/bin/bash

# Script para testar conectividade das APIs
echo "==========================================="
echo "🔍 Testando Conectividade MediApp"
echo "==========================================="

# 1. Verificar se servidor está rodando
echo "1. Verificando processos Node.js..."
ps aux | grep "node.*server-clean" | grep -v grep || echo "❌ Servidor não está rodando"

# 2. Verificar porta 3001
echo ""
echo "2. Verificando porta 3001..."
netstat -tln 2>/dev/null | grep ":3001" || echo "❌ Porta 3001 não está sendo escutada"

# 3. Testar API health
echo ""
echo "3. Testando API /health..."
response=$(wget -qO- http://127.0.0.1:3001/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API health respondeu: $response"
else
    echo "❌ API health não respondeu"
fi

# 4. Testar API médicos
echo ""
echo "4. Testando API /api/medicos..."
response=$(wget -qO- http://127.0.0.1:3001/api/medicos 2>/dev/null | head -3)
if [ $? -eq 0 ]; then
    echo "✅ API médicos respondeu:"
    echo "$response"
else
    echo "❌ API médicos não respondeu"
fi

# 5. Testar página principal
echo ""
echo "5. Testando página principal..."
response=$(wget -qO- http://127.0.0.1:3001/ 2>/dev/null | head -2)
if [ $? -eq 0 ]; then
    echo "✅ Página principal respondeu"
else
    echo "❌ Página principal não respondeu"
fi

echo ""
echo "==========================================="
echo "🏁 Teste de conectividade concluído"
echo "==========================================="