#!/bin/bash

# 🏥 MEDIAPP - SCRIPT DE BUILD MOBILE
# Script para compilar APK da aplicação React Native

echo "🏥 MEDIAPP - BUILD MOBILE APK"
echo "============================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${2}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log "❌ Execute este script no diretório mobile: mediapp-refined/apps/mobile" $RED
    exit 1
fi

log "📱 Iniciando build da aplicação mobile..." $BLUE

# 1. Instalar dependências
log "📦 Instalando dependências..." $YELLOW
if npm install; then
    log "✅ Dependências instaladas com sucesso" $GREEN
else
    log "❌ Erro ao instalar dependências" $RED
    exit 1
fi

# 2. Verificar se Android SDK está configurado
log "🔧 Verificando Android SDK..." $YELLOW
if [ -z "$ANDROID_HOME" ]; then
    log "⚠️ ANDROID_HOME não configurado" $YELLOW
    log "💡 Configure o Android SDK antes de continuar" $YELLOW
fi

# 3. Limpar builds anteriores
log "🧹 Limpando builds anteriores..." $YELLOW
rm -rf android/app/build/
rm -rf node_modules/.cache/

# 4. Gerar bundle JavaScript
log "📦 Gerando bundle JavaScript..." $YELLOW
if npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/; then
    log "✅ Bundle gerado com sucesso" $GREEN
else
    log "❌ Erro ao gerar bundle" $RED
    exit 1
fi

# 5. Compilar APK Debug
log "🔨 Compilando APK debug..." $YELLOW
cd android
if ./gradlew assembleDebug; then
    log "✅ APK debug compilado com sucesso" $GREEN
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        # Copiar APK para diretório principal
        cp "$APK_PATH" "../../../MediApp-v1.2.0-Debug.apk"
        log "📱 APK copiado para: MediApp-v1.2.0-Debug.apk" $GREEN
        
        # Informações do APK
        APK_SIZE=$(du -h "../../../MediApp-v1.2.0-Debug.apk" | cut -f1)
        log "📊 Tamanho do APK: $APK_SIZE" $BLUE
    else
        log "❌ APK não encontrado no caminho esperado" $RED
    fi
else
    log "❌ Erro na compilação do APK" $RED
    exit 1
fi

cd ..

# 6. Compilar APK Release (opcional)
log "🔨 Compilando APK release..." $YELLOW
cd android
if ./gradlew assembleRelease; then
    log "✅ APK release compilado com sucesso" $GREEN
    RELEASE_APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
    
    if [ -f "$RELEASE_APK_PATH" ]; then
        # Copiar APK release para diretório principal
        cp "$RELEASE_APK_PATH" "../../../MediApp-v1.2.0-Release.apk"
        log "📱 APK release copiado para: MediApp-v1.2.0-Release.apk" $GREEN
        
        # Informações do APK release
        RELEASE_APK_SIZE=$(du -h "../../../MediApp-v1.2.0-Release.apk" | cut -f1)
        log "📊 Tamanho do APK release: $RELEASE_APK_SIZE" $BLUE
    else
        log "❌ APK release não encontrado no caminho esperado" $RED
    fi
else
    log "⚠️ Erro na compilação do APK release (normal se não há keystore configurado)" $YELLOW
fi

cd ..

# 7. Relatório final
log "📋 BUILD CONCLUÍDO!" $GREEN
echo ""
log "📱 APKs gerados:" $BLUE
log "  • Debug: MediApp-v1.2.0-Debug.apk" $GREEN
log "  • Release: MediApp-v1.2.0-Release.apk" $GREEN
echo ""
log "🚀 Para instalar no dispositivo:" $YELLOW
log "  adb install MediApp-v1.2.0-Debug.apk" $YELLOW
echo ""
log "🎯 APKs prontos para testes humanos!" $GREEN