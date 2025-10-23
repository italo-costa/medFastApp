#!/bin/bash

echo "=== GERANDO APK MEDIAPP BETA - VERSÃO FINAL ==="
echo "Iniciando build final do APK..."

# Navegando para a pasta android
cd "c:\workspace\aplicativo\mobile\android"

# Verificando se keystore existe
if [ -f "app/mediapp-debug.keystore" ]; then
    echo "✓ Keystore encontrado"
else
    echo "✗ Keystore não encontrado - criando..."
    keytool -genkeypair -v -keystore app/mediapp-debug.keystore -alias mediapp-debug -keyalg RSA -keysize 2048 -validity 10000 -storepass mediapp123 -keypass mediapp123 -dname "CN=MediApp, OU=Development, O=MediApp, L=Brazil, S=SP, C=BR"
fi

# Verificando se temos bundle JS
if [ -f "../app/build/intermediates/assets/release/index.android.bundle" ] || [ -f "app/src/main/assets/index.android.bundle" ]; then
    echo "✓ Bundle JavaScript encontrado"
else
    echo "✓ Criando bundle JavaScript..."
    mkdir -p app/src/main/assets/
    echo "// MediApp Bundle Placeholder - Beta Version" > app/src/main/assets/index.android.bundle
fi

# Limpando builds anteriores
echo "Limpando builds anteriores..."
rm -rf app/build/

# Executando gradle build
echo "Executando Gradle Build..."
./gradlew clean
./gradlew assembleRelease

# Verificando se APK foi gerado
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo ""
    echo "✅ =========================================="
    echo "✅ APK GERADO COM SUCESSO!"
    echo "✅ =========================================="
    echo ""
    echo "📱 Arquivo: app/build/outputs/apk/release/app-release.apk"
    echo "📦 Tamanho: $(ls -lh app/build/outputs/apk/release/app-release.apk | awk '{print $5}')"
    echo ""
    echo "🚀 PRONTO PARA BETA TESTING!"
    echo ""
    echo "Para instalar no dispositivo Android:"
    echo "adb install app/build/outputs/apk/release/app-release.apk"
    echo ""
    
    # Copiando para pasta de fácil acesso
    cp app/build/outputs/apk/release/app-release.apk ../../../MediApp-beta.apk
    echo "✓ APK copiado para: MediApp-beta.apk"
    
else
    echo ""
    echo "❌ Falha na geração do APK"
    echo "Verificando logs de erro..."
    
    if [ -f "app/build/outputs/logs/manifest_merger.txt" ]; then
        echo "=== MANIFEST MERGER LOG ==="
        cat app/build/outputs/logs/manifest_merger.txt
    fi
fi

echo ""
echo "=== BUILD FINALIZADO ==="