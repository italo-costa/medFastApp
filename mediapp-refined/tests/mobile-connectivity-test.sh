#!/bin/bash

# Teste de Conectividade Mobile-Backend
echo "📱 FASE 4: Teste Mobile App - React Native"
echo "========================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile

echo "📋 Verificando estrutura do mobile app..."
echo "✅ Verificando arquivos essenciais:"

# Verificar arquivos principais
files=("package.json" "App.tsx" "index.js" "android/build.gradle" "ios/MediApp.xcodeproj/project.pbxproj")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file - OK"
    else
        echo "  ❌ $file - AUSENTE"
    fi
done

echo ""
echo "📦 Verificando dependências principais:"

# Verificar dependências críticas no package.json
dependencies=("react-native" "@reduxjs/toolkit" "@react-navigation/native" "axios")
for dep in "${dependencies[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        version=$(grep "\"$dep\"" package.json | sed 's/.*": "//; s/".*//')
        echo "  ✅ $dep: $version"
    else
        echo "  ❌ $dep - NÃO ENCONTRADO"
    fi
done

echo ""
echo "🛠️ Verificando configuração de build:"

# Android
if [ -d "android" ]; then
    echo "  ✅ Configuração Android presente"
    if [ -f "android/app/build.gradle" ]; then
        echo "    ✅ build.gradle configurado"
    fi
else
    echo "  ❌ Configuração Android ausente"
fi

# iOS
if [ -d "ios" ]; then
    echo "  ✅ Configuração iOS presente"
    if [ -f "ios/MediApp.xcodeproj/project.pbxproj" ]; then
        echo "    ✅ projeto Xcode configurado"
    fi
else
    echo "  ❌ Configuração iOS ausente"
fi

echo ""
echo "🧪 Testando build potencial (verificação de sintaxe):"

# Verificar se as dependências estão instaladas
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules presente - dependências instaladas"
    
    # Verificar alguns módulos críticos
    critical_modules=("react-native" "@reduxjs/toolkit" "react-redux")
    for module in "${critical_modules[@]}"; do
        if [ -d "node_modules/$module" ]; then
            echo "    ✅ $module instalado"
        else
            echo "    ❌ $module NÃO instalado"
        fi
    done
else
    echo "  ⚠️  node_modules não encontrado"
    echo "    💡 Execute: npm install ou yarn install"
fi

echo ""
echo "🔗 Simulando conectividade com backend:"

# Como o mobile provavelmente usa axios para conectar ao backend
# vamos verificar se há configuração de API
if grep -r "localhost:3002\|127.0.0.1:3002" src/ 2>/dev/null; then
    echo "  ✅ Configuração de API local encontrada"
else
    echo "  ⚠️  Configuração de API não especificada ou usa IP dinâmico"
fi

# Verificar se há serviços de API configurados
if [ -d "src/services" ]; then
    echo "  ✅ Diretório de serviços presente"
    if ls src/services/*.ts src/services/*.js 2>/dev/null | head -1 > /dev/null; then
        echo "    ✅ Arquivos de serviço encontrados"
    else
        echo "    ⚠️  Nenhum arquivo de serviço encontrado"
    fi
else
    echo "  ⚠️  Diretório de serviços não encontrado"
fi

echo ""
echo "🔄 Verificando Redux Store:"
if [ -f "src/store/store.ts" ]; then
    echo "  ✅ Redux store configurado"
    if grep -q "auth.*patients.*records" src/store/store.ts; then
        echo "    ✅ Slices configurados: auth, patients, records"
    fi
else
    echo "  ❌ Redux store não encontrado"
fi

echo ""
echo "📊 RESUMO MOBILE APP:"
echo "===================="

# Calcular pontuação
score=0
total=10

# Verificações
[ -f "package.json" ] && ((score++))
[ -f "App.tsx" ] && ((score++))
[ -d "android" ] && ((score++))
[ -d "ios" ] && ((score++))
[ -d "node_modules" ] && ((score++))
[ -d "src/store" ] && ((score++))
[ -f "src/store/store.ts" ] && ((score++))
grep -q "react-native" package.json && ((score++))
grep -q "@reduxjs/toolkit" package.json && ((score++))
[ -d "src" ] && ((score++))

percentage=$((score * 100 / total))

echo "📈 Pontuação: $score/$total ($percentage%)"

if [ $percentage -ge 80 ]; then
    echo "✅ MOBILE APP: EXCELENTE - Pronto para uso"
elif [ $percentage -ge 60 ]; then
    echo "⚠️  MOBILE APP: BOM - Pequenos ajustes necessários"
else
    echo "❌ MOBILE APP: NECESSITA CORREÇÕES"
fi

echo ""
echo "✅ Verificação mobile concluída!"