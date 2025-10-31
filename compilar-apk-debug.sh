#!/bin/bash

echo "🏗️ Compilando APK de desenvolvimento MediApp"
echo "=========================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile

# Configurar variáveis de ambiente
export ANDROID_HOME=/home/italo_unix_user/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "📋 Verificando configuração..."
echo "ANDROID_HOME: $ANDROID_HOME"
echo "Local properties:"
cat android/local.properties

echo "🧹 Limpando builds anteriores..."
cd android
./gradlew clean

echo "📱 Gerando APK debug..."
./gradlew assembleDebug

if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "🎉 APK GERADO COM SUCESSO!"
    echo "📱 Arquivo: app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    
    # Copiar APK para local acessível
    cp app/build/outputs/apk/debug/app-debug.apk ../../MediApp-Debug.apk
    echo "📋 APK copiado para: mediapp-refined/apps/mobile/MediApp-Debug.apk"
    
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "1. Conectar dispositivo Android via USB"
    echo "2. Ativar 'Depuração USB' nas configurações do desenvolvedor"
    echo "3. Instalar APK: adb install MediApp-Debug.apk"
    echo "4. Ou transferir APK para dispositivo e instalar manualmente"
    echo ""
    echo "✅ ANDROID BETA PRONTO PARA TESTE!"
    
else
    echo "❌ Erro ao gerar APK"
    echo "📋 Verificar logs acima para detalhes"
fi