#!/bin/bash

# MediApp - Build APK Complete
# ============================

set -e

echo "📱 =========================================="
echo "📱 MediApp - Build APK Beta Complete"
echo "📱 =========================================="

# Configure Android environment
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"

echo "✅ Android SDK configurado:"
echo "   ANDROID_HOME: $ANDROID_HOME"
echo "   ADB: $(which adb)"

# Navigate to mobile directory
cd /mnt/c/workspace/aplicativo/mobile

echo ""
echo "📋 Passo 1: Criando keystore de debug..."

# Create debug keystore if not exists
if [ ! -f "android/app/mediapp-debug.keystore" ]; then
    echo "Criando keystore para assinatura..."
    
    keytool -genkeypair \
        -v \
        -storetype PKCS12 \
        -keystore android/app/mediapp-debug.keystore \
        -alias mediapp-debug \
        -keyalg RSA \
        -keysize 2048 \
        -validity 365 \
        -storepass mediapp123 \
        -keypass mediapp123 \
        -dname "CN=MediApp Debug, OU=Development, O=MediApp, L=City, ST=State, C=BR"
    
    echo "✅ Keystore criado: android/app/mediapp-debug.keystore"
else
    echo "✅ Keystore já existe"
fi

echo ""
echo "📋 Passo 2: Configurando build.gradle..."

# Update build.gradle with signing config
GRADLE_FILE="android/app/build.gradle"

if ! grep -q "signingConfigs" "$GRADLE_FILE"; then
    echo "Adicionando configuração de assinatura ao build.gradle..."
    
    # Add signing configuration before the last }
    sed -i '/^}$/i\
\
android {\
    signingConfigs {\
        debug {\
            storeFile file("mediapp-debug.keystore")\
            storePassword "mediapp123"\
            keyAlias "mediapp-debug"\
            keyPassword "mediapp123"\
        }\
    }\
    buildTypes {\
        debug {\
            signingConfig signingConfigs.debug\
        }\
        release {\
            signingConfig signingConfigs.debug\
            minifyEnabled false\
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"\
        }\
    }\
}' "$GRADLE_FILE"
    
    echo "✅ build.gradle configurado"
else
    echo "✅ build.gradle já configurado"
fi

echo ""
echo "📋 Passo 3: Limpando builds anteriores..."

cd android
chmod +x gradlew
./gradlew clean

echo ""
echo "📋 Passo 4: Gerando APK debug..."

./gradlew assembleDebug

echo ""
echo "📋 Passo 5: Verificando APK gerado..."

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo "✅ APK gerado com sucesso!"
    
    # Create distribution directory
    cd ..
    mkdir -p dist
    
    # Copy APK with timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    APK_NAME="MediApp-v1.0.0-beta-$TIMESTAMP.apk"
    
    cp "android/$APK_PATH" "dist/$APK_NAME"
    
    echo ""
    echo "📱 =========================================="
    echo "📱 APK BETA GERADO COM SUCESSO!"
    echo "📱 =========================================="
    echo ""
    echo "📊 Informações do APK:"
    echo "   📍 Local: dist/$APK_NAME"
    echo "   📏 Tamanho: $(du -h dist/$APK_NAME | cut -f1)"
    echo "   🔑 Assinado: Sim (debug keystore)"
    echo "   📅 Data: $(date)"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Testar APK em dispositivo Android"
    echo "   2. Distribuir para beta testers"
    echo "   3. Coletar feedback"
    echo ""
    echo "📋 Para instalar:"
    echo "   1. Transferir APK para dispositivo Android"
    echo "   2. Permitir 'Fontes Desconhecidas' nas configurações"
    echo "   3. Instalar APK"
    echo ""
    echo "✅ MediApp Beta Android pronto!"
    
else
    echo "❌ Falha ao gerar APK"
    echo "Verificar logs do Gradle"
    exit 1
fi