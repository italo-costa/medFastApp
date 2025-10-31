#!/bin/bash

echo "=========================================="
echo "🧪 TESTE COMPLETO DO BANCO DE DADOS"
echo "=========================================="

BASE_URL="http://127.0.0.1:3002"

echo ""
echo "1. 🔍 Testando Health Check..."
response=$(wget -qO- "$BASE_URL/health" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Health check OK"
    echo "$response" | head -3
else
    echo "❌ Health check falhou"
fi

echo ""
echo "2. 👨‍⚕️ Testando API de Médicos..."
response=$(wget -qO- "$BASE_URL/api/medicos" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ API médicos OK"
    echo "$response" | head -5
else
    echo "❌ API médicos falhou"
fi

echo ""
echo "3. 👥 Testando API de Pacientes..."
response=$(wget -qO- "$BASE_URL/api/pacientes" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ API pacientes OK"
    echo "$response" | head -5
else
    echo "❌ API pacientes falhou"
fi

echo ""
echo "4. 📋 Testando API de Prontuários..."
response=$(wget -qO- "$BASE_URL/api/prontuarios" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ API prontuários OK"
    echo "$response" | head -5
else
    echo "❌ API prontuários falhou"
fi

echo ""
echo "5. 📊 Testando Estatísticas..."
response=$(wget -qO- "$BASE_URL/api/patients/stats/overview" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ API estatísticas OK"
    echo "$response" | head -5
else
    echo "❌ API estatísticas falhou"
fi

echo ""
echo "=========================================="
echo "🏁 TESTE CONCLUÍDO"
echo "=========================================="