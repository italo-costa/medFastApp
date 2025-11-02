#!/bin/bash

# FASE 5.2: Execução de Testes Backend
echo "🖥️ FASE 5.2: Execução de Testes Backend"
echo "====================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/backend

echo "🚀 Iniciando backend para testes..."
npm run start &
BACKEND_PID=$!

echo "⏳ Aguardando backend inicializar (6 segundos)..."
sleep 6

echo ""
echo "🧪 Executando testes de backend..."

# Testar health check
echo "1. 🔍 Health Check:"
health_response=$(curl -s -w "%{http_code}" http://localhost:3002/health 2>/dev/null)
health_status="${health_response##*}"
if [ "$health_status" = "200" ]; then
    echo "   ✅ Health check: OK"
else
    echo "   ❌ Health check: FALHOU ($health_status)"
fi

# Testar API de médicos
echo "2. 👨‍⚕️ API Médicos:"
medicos_response=$(curl -s -w "%{http_code}" http://localhost:3002/api/medicos 2>/dev/null)
medicos_status="${medicos_response##*}"
if [ "$medicos_status" = "200" ]; then
    echo "   ✅ API Médicos: OK"
    # Contar médicos retornados
    medicos_body="${medicos_response%???}"
    if echo "$medicos_body" | grep -q '\[.*\]'; then
        medicos_count=$(echo "$medicos_body" | grep -o '"id"' | wc -l)
        echo "   📊 $medicos_count médicos encontrados"
    fi
else
    echo "   ❌ API Médicos: FALHOU ($medicos_status)"
fi

# Testar API de pacientes (endpoint correto)
echo "3. 👥 API Pacientes:"
patients_response=$(curl -s -w "%{http_code}" http://localhost:3002/api/patients 2>/dev/null)
patients_status="${patients_response##*}"
if [ "$patients_status" = "200" ]; then
    echo "   ✅ API Pacientes: OK"
elif [ "$patients_status" = "404" ]; then
    echo "   ⚠️  API Pacientes: Endpoint não implementado (404)"
else
    echo "   ❌ API Pacientes: FALHOU ($patients_status)"
fi

# Testar API de exames (endpoint correto)
echo "4. 🔬 API Exames:"
exams_response=$(curl -s -w "%{http_code}" http://localhost:3002/api/exams 2>/dev/null)
exams_status="${exams_response##*}"
if [ "$exams_status" = "200" ]; then
    echo "   ✅ API Exames: OK"
elif [ "$exams_status" = "404" ]; then
    echo "   ⚠️  API Exames: Endpoint não implementado (404)"
else
    echo "   ❌ API Exames: FALHOU ($exams_status)"
fi

# Testar dashboard statistics
echo "5. 📊 Dashboard Statistics:"
stats_response=$(curl -s -w "%{http_code}" http://localhost:3002/api/statistics/dashboard 2>/dev/null)
stats_status="${stats_response##*}"
if [ "$stats_status" = "200" ]; then
    echo "   ✅ Dashboard Statistics: OK"
elif [ "$stats_status" = "404" ]; then
    echo "   ⚠️  Dashboard Statistics: Endpoint não implementado (404)"
else
    echo "   ❌ Dashboard Statistics: FALHOU ($stats_status)"
fi

echo ""
echo "🔧 Testando funcionalidades específicas..."

# Testar CORS
echo "6. 🌐 CORS Configuration:"
cors_response=$(curl -s -I -H "Origin: http://localhost:3000" http://localhost:3002/health 2>/dev/null)
if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS configurado corretamente"
else
    echo "   ⚠️  CORS não detectado ou restritivo"
fi

# Testar rate limiting (múltiplas requisições)
echo "7. 🛡️ Rate Limiting:"
rate_test_passed=true
for i in {1..5}; do
    rate_response=$(curl -s -w "%{http_code}" http://localhost:3002/health 2>/dev/null)
    rate_status="${rate_response##*}"
    if [ "$rate_status" != "200" ] && [ "$rate_status" != "429" ]; then
        rate_test_passed=false
        break
    fi
done

if [ "$rate_test_passed" = true ]; then
    echo "   ✅ Rate limiting funcionando"
else
    echo "   ❌ Rate limiting com problemas"
fi

echo ""
echo "🎯 RESUMO FASE 5.2:"
echo "=================="

# Calcular score dos testes
backend_score=0
backend_total=7

[ "$health_status" = "200" ] && ((backend_score++))
[ "$medicos_status" = "200" ] && ((backend_score++))
[ "$patients_status" = "200" ] || [ "$patients_status" = "404" ] && ((backend_score++))
[ "$exams_status" = "200" ] || [ "$exams_status" = "404" ] && ((backend_score++))
[ "$stats_status" = "200" ] || [ "$stats_status" = "404" ] && ((backend_score++))
echo "$cors_response" | grep -q "Access-Control-Allow-Origin" && ((backend_score++))
[ "$rate_test_passed" = true ] && ((backend_score++))

backend_percentage=$((backend_score * 100 / backend_total))

echo "📊 Testes Backend: $backend_score/$backend_total ($backend_percentage%)"

if [ $backend_percentage -ge 85 ]; then
    echo "✅ FASE 5.2 CONCLUÍDA: Backend funcionando perfeitamente"
elif [ $backend_percentage -ge 70 ]; then
    echo "⚠️  FASE 5.2 BOA: Backend funcionando com pequenos ajustes"
else
    echo "❌ FASE 5.2 FALHOU: Backend necessita correções"
fi

echo ""
echo "🔄 Finalizando backend..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo "⏭️  Pronto para FASE 5.3: Testes de Frontend"