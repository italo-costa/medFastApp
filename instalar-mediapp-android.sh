#!/bin/bash

echo "📱 MediApp Android Beta - Instalador"
echo "===================================="

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile

# Configurar ADB
export PATH=$PATH:/home/italo_unix_user/Android/Sdk/platform-tools

echo "🔍 Verificando dispositivos conectados..."
adb devices

echo ""
echo "📱 Se seu dispositivo aparece acima, pressione Enter para instalar..."
echo "   Se não aparece, conecte o dispositivo via USB e ative 'Depuração USB'"
read

echo "📦 Instalando MediApp no dispositivo..."
if adb install -r MediApp-Debug-Ready.apk; then
    echo ""
    echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "✅ MediApp foi instalado no seu dispositivo Android"
    echo "📱 Procure o ícone 'MediApp' na lista de aplicativos"
    echo "🚀 Abra o app e teste as funcionalidades"
    echo ""
    echo "📋 Se encontrar problemas, execute:"
    echo "   adb logcat | grep MediApp"
    echo ""
else
    echo ""
    echo "❌ Erro na instalação!"
    echo ""
    echo "🔧 Possíveis soluções:"
    echo "1. Verificar se 'Depuração USB' está ativada"
    echo "2. Tentar instalar manualmente copiando o APK"
    echo "3. Verificar se há espaço suficiente no dispositivo"
    echo "4. Desinstalar versão anterior se existir"
    echo ""
fi

echo "📊 Informações do APK:"
ls -lh MediApp-Debug-Ready.apk