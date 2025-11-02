#!/bin/bash

# FASE 5: Teste Final Completo com Backend Ativo
echo "🚀 FASE 5: TESTE FINAL COMPLETO - MEDIAPP"
echo "========================================"

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend

echo "🔄 Iniciando backend para testes finais..."
npm run start &
BACKEND_PID=$!

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar (10 segundos)..."
sleep 10

echo ""
echo "🧪 EXECUTANDO TESTES FINAIS COM BACKEND ATIVO:"
echo "=============================================="

# Função para testar endpoints
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    response=$(curl -s -w ",%{http_code}" "$url" 2>/dev/null)
    status_code="${response##*,}"
    body="${response%,*}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ $name: $status_code (OK)"
        return 0
    else
        echo "❌ $name: $status_code (ERRO)"
        return 1
    fi
}

# 1. TESTES DE CONECTIVIDADE BÁSICA
echo ""
echo "🔗 1. TESTES DE CONECTIVIDADE BÁSICA:"
echo "-----------------------------------"

success_count=0
total_tests=0

# Health Check
((total_tests++))
if test_endpoint "http://localhost:3002/health" "Health Check"; then
    ((success_count++))
fi

# API Médicos
((total_tests++))
if test_endpoint "http://localhost:3002/api/medicos" "API Médicos"; then
    ((success_count++))
fi

# API Patients (endpoint correto)
((total_tests++))
if test_endpoint "http://localhost:3002/api/patients" "API Patients"; then
    ((success_count++))
fi

# Dashboard Statistics
((total_tests++))
if test_endpoint "http://localhost:3002/api/statistics/dashboard" "Dashboard Statistics"; then
    ((success_count++))
fi

echo ""
echo "📊 Conectividade Básica: $success_count/$total_tests testes passaram"

# 2. TESTES DE PÁGINAS WEB
echo ""
echo "🌐 2. TESTES DE PÁGINAS WEB:"
echo "--------------------------"

web_success=0
web_total=0

pages=("gestao-medicos.html" "gestao-pacientes.html" "app.html" "index.html")
for page in "${pages[@]}"; do
    ((web_total++))
    if test_endpoint "http://localhost:3002/$page" "Página $page"; then
        ((web_success++))
    fi
done

echo ""
echo "📊 Páginas Web: $web_success/$web_total testes passaram"

# 3. TESTES DE PERFORMANCE BÁSICA
echo ""
echo "⚡ 3. TESTES DE PERFORMANCE BÁSICA:"
echo "--------------------------------"

echo "🔥 Teste de carga: 10 requisições simultâneas"
start_time=$(date +%s%N)

# Executar 10 requisições em paralelo
for i in {1..10}; do
    curl -s "http://localhost:3002/health" > /dev/null &
done
wait

end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

echo "⏱️  Tempo total: ${duration}ms"
if [ $duration -lt 1000 ]; then
    echo "✅ Performance: EXCELENTE (<1s)"
    perf_result="EXCELENTE"
elif [ $duration -lt 3000 ]; then
    echo "✅ Performance: BOA (<3s)"
    perf_result="BOA"
else
    echo "⚠️  Performance: LENTA (>3s)"
    perf_result="LENTA"
fi

# 4. TESTE DE DADOS
echo ""
echo "📊 4. TESTE DE INTEGRIDADE DOS DADOS:"
echo "-----------------------------------"

# Verificar se APIs retornam dados válidos
medicos_data=$(curl -s "http://localhost:3002/api/medicos" 2>/dev/null)
health_data=$(curl -s "http://localhost:3002/health" 2>/dev/null)

data_success=0
data_total=2

if echo "$medicos_data" | grep -q '\[.*\]'; then
    echo "✅ API Médicos retorna dados válidos"
    medicos_count=$(echo "$medicos_data" | grep -o '"id"' | wc -l)
    echo "   📋 $medicos_count médicos encontrados"
    ((data_success++))
else
    echo "❌ API Médicos não retorna dados válidos"
fi

if echo "$health_data" | grep -q '"status"'; then
    echo "✅ Health Check retorna dados estruturados"
    ((data_success++))
else
    echo "❌ Health Check não retorna dados estruturados"
fi

echo ""
echo "📊 Integridade dos Dados: $data_success/$data_total testes passaram"

# 5. RELATÓRIO FINAL
echo ""
echo "🏁 RELATÓRIO FINAL DE TESTES:"
echo "============================"

total_score=$((success_count + web_success + data_success))
total_possible=$((total_tests + web_total + data_total))

if [ "$perf_result" = "EXCELENTE" ]; then
    ((total_score++))
    ((total_possible++))
elif [ "$perf_result" = "BOA" ]; then
    ((total_possible++))
else
    ((total_possible++))
fi

percentage=$((total_score * 100 / total_possible))

echo "📈 PONTUAÇÃO GERAL: $total_score/$total_possible ($percentage%)"
echo ""
echo "📊 BREAKDOWN POR CATEGORIA:"
echo "  🔗 Conectividade: $success_count/$total_tests"
echo "  🌐 Páginas Web: $web_success/$web_total"
echo "  📊 Dados: $data_success/$data_total"
echo "  ⚡ Performance: $perf_result"

echo ""
if [ $percentage -ge 90 ]; then
    echo "🎉 RESULTADO: EXCELENTE - Sistema pronto para produção!"
    overall_status="EXCELENTE"
elif [ $percentage -ge 75 ]; then
    echo "✅ RESULTADO: BOM - Sistema funcional com pequenos ajustes"
    overall_status="BOM"
elif [ $percentage -ge 50 ]; then
    echo "⚠️  RESULTADO: REGULAR - Necessita melhorias"
    overall_status="REGULAR"
else
    echo "❌ RESULTADO: CRÍTICO - Correções urgentes necessárias"
    overall_status="CRÍTICO"
fi

echo ""
echo "🔄 Finalizando backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "🎯 CONCLUSÃO FASE 5:"
echo "Status: $overall_status"
echo "Pontuação: $percentage%"
echo "✅ TESTE FINAL CONCLUÍDO!"

# Retornar código baseado no resultado
if [ $percentage -ge 75 ]; then
    exit 0
else
    exit 1
fi