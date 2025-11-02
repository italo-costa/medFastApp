#!/bin/bash

# FASE 5.1: Validação dos Testes Unitários
echo "🧪 FASE 5.1: Validação dos Testes Unitários"
echo "=========================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined

echo "📋 Verificando estrutura de testes..."

# Verificar arquivos de teste
test_files=(
    "tests/comprehensive-test-suite.js"
    "tests/deploy-validator.js"
    "tests/mobile-basic.test.ts"
    "tests/comprehensive-mobile.test.tsx"
)

echo "✅ Arquivos de teste encontrados:"
for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
        size=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo "    📊 $size linhas"
    else
        echo "  ❌ $file - AUSENTE"
    fi
done

echo ""
echo "🔍 Verificando sintaxe dos testes JavaScript..."

# Verificar sintaxe do comprehensive-test-suite.js
if [ -f "tests/comprehensive-test-suite.js" ]; then
    echo "📝 Validando comprehensive-test-suite.js..."
    if node -c tests/comprehensive-test-suite.js 2>/dev/null; then
        echo "  ✅ Sintaxe JavaScript válida"
        
        # Contar número de testes
        unit_tests=$(grep -c "async.*test.*Unit" tests/comprehensive-test-suite.js || echo "0")
        integration_tests=$(grep -c "async.*test.*Integration" tests/comprehensive-test-suite.js || echo "0")
        e2e_tests=$(grep -c "async.*test.*E2E" tests/comprehensive-test-suite.js || echo "0")
        
        echo "  📊 Testes encontrados:"
        echo "    🧪 Unitários: $unit_tests"
        echo "    🔗 Integração: $integration_tests"  
        echo "    🌐 E2E: $e2e_tests"
    else
        echo "  ❌ Erro de sintaxe JavaScript"
    fi
else
    echo "  ⚠️  Arquivo de teste principal não encontrado"
fi

echo ""
echo "📱 Verificando testes mobile..."

# Verificar testes TypeScript mobile
mobile_tests=("tests/mobile-basic.test.ts" "tests/comprehensive-mobile.test.tsx")
for test_file in "${mobile_tests[@]}"; do
    if [ -f "$test_file" ]; then
        echo "📱 Validando $test_file..."
        # Verificar se tem imports e testes básicos
        if grep -q "import.*react" "$test_file" && grep -q "test\|describe\|it" "$test_file"; then
            echo "  ✅ Estrutura de teste React/RN válida"
            test_count=$(grep -c "test\|it(" "$test_file" || echo "0")
            echo "  📊 $test_count casos de teste"
        else
            echo "  ⚠️  Estrutura de teste incompleta"
        fi
    fi
done

echo ""
echo "🎯 RESUMO FASE 5.1:"
echo "=================="

# Calcular score
score=0
total=5

[ -f "tests/comprehensive-test-suite.js" ] && ((score++))
[ -f "tests/deploy-validator.js" ] && ((score++))
[ -f "tests/mobile-basic.test.ts" ] && ((score++))
node -c tests/comprehensive-test-suite.js 2>/dev/null && ((score++))
[ $unit_tests -gt 0 ] && ((score++))

percentage=$((score * 100 / total))

echo "📊 Validação: $score/$total ($percentage%)"

if [ $percentage -ge 80 ]; then
    echo "✅ FASE 5.1 CONCLUÍDA: Testes unitários validados"
elif [ $percentage -ge 60 ]; then
    echo "⚠️  FASE 5.1 PARCIAL: Alguns ajustes necessários"
else
    echo "❌ FASE 5.1 FALHOU: Testes precisam ser corrigidos"
fi

echo ""
echo "⏭️  Pronto para FASE 5.2: Execução de Testes Backend"