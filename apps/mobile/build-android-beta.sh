#!/bin/bash

# MediApp - Build Android Beta Script
# ===================================
# Este script automatiza a criação de APKs beta do MediApp

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "📱 =========================================="
echo "📱 MediApp - Build Android Beta"
echo "📱 Sistema de Gestão Médica"
echo "📱 =========================================="

# Verificar se estamos na pasta mobile
if [ ! -f "package.json" ] || [ ! -d "android" ]; then
    log_error "Execute este script na pasta mobile do projeto"
    exit 1
fi

# ==========================================
# 1. VERIFICAÇÕES INICIAIS
# ==========================================

log_info "Verificando ambiente de desenvolvimento..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
log_success "Node.js: v$NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado"
    exit 1
fi

# Verificar Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    log_success "Java: $JAVA_VERSION"
    JAVA_AVAILABLE=true
else
    log_warning "Java não encontrado"
    JAVA_AVAILABLE=false
fi

# Verificar Android SDK
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    log_success "ANDROID_HOME: $ANDROID_HOME"
    ANDROID_SDK_AVAILABLE=true
else
    log_warning "ANDROID_HOME não configurado"
    ANDROID_SDK_AVAILABLE=false
fi

# Verificar ADB
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version | head -n 1)
    log_success "ADB: $ADB_VERSION"
    ADB_AVAILABLE=true
else
    log_warning "ADB não encontrado"
    ADB_AVAILABLE=false
fi

# ==========================================
# 2. PREPARAÇÃO DO AMBIENTE
# ==========================================

log_info "Preparando ambiente para build..."

# Verificar dependências npm
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências npm..."
    npm install
fi

# Verificar React Native CLI
if ! command -v npx &> /dev/null; then
    log_error "npx não encontrado"
    exit 1
fi

# ==========================================
# 3. VERIFICAÇÃO DA ESTRUTURA ANDROID
# ==========================================

log_info "Verificando estrutura Android..."

# Arquivos essenciais
REQUIRED_FILES=(
    "android/build.gradle"
    "android/app/build.gradle"
    "android/app/src/main/AndroidManifest.xml"
    "android/app/src/main/java/com/mediapp/MainActivity.java"
    "android/app/src/main/java/com/mediapp/MainApplication.java"
    "android/gradlew"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "✓ $file"
    else
        log_error "✗ $file não encontrado"
        exit 1
    fi
done

# Verificar React Native config
log_info "Verificando configuração React Native..."
RN_CONFIG=$(npx react-native config 2>/dev/null || echo "erro")
if [[ $RN_CONFIG == *"com.mediapp"* ]]; then
    log_success "React Native detecta projeto Android corretamente"
else
    log_warning "Possível problema na configuração React Native"
fi

# ==========================================
# 4. BUILD STRATEGY
# ==========================================

log_info "Determinando estratégia de build..."

BUILD_STRATEGY="basic"

if [ "$ANDROID_SDK_AVAILABLE" = true ] && [ "$ADB_AVAILABLE" = true ]; then
    BUILD_STRATEGY="full"
    log_success "Build completo disponível (Android SDK + ADB)"
elif [ "$JAVA_AVAILABLE" = true ]; then
    BUILD_STRATEGY="gradle"
    log_success "Build via Gradle disponível"
else
    BUILD_STRATEGY="bundle"
    log_warning "Apenas bundle JavaScript disponível"
fi

log_info "Estratégia selecionada: $BUILD_STRATEGY"

# ==========================================
# 5. EXECUÇÃO DO BUILD
# ==========================================

# Criar pasta de distribuição
mkdir -p dist
mkdir -p dist/logs

# Timestamp para versionamento
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERSION="1.0.0-beta.$TIMESTAMP"

log_info "Versão do build: $VERSION"

case $BUILD_STRATEGY in
    "full")
        log_info "🔨 Executando build completo com Android SDK..."
        
        # Verificar React Native Doctor
        log_info "Executando diagnóstico React Native..."
        npx react-native doctor > dist/logs/rn-doctor-$TIMESTAMP.log 2>&1 || true
        
        # Limpar builds anteriores
        log_info "Limpando builds anteriores..."
        cd android
        ./gradlew clean > ../dist/logs/gradle-clean-$TIMESTAMP.log 2>&1
        
        # Build APK Debug
        log_info "Gerando APK debug..."
        if ./gradlew assembleDebug > ../dist/logs/gradle-debug-$TIMESTAMP.log 2>&1; then
            log_success "APK debug gerado com sucesso"
            
            # Copiar APK debug
            if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
                cp app/build/outputs/apk/debug/app-debug.apk ../dist/MediApp-$VERSION-debug.apk
                log_success "APK debug copiado: dist/MediApp-$VERSION-debug.apk"
            fi
        else
            log_error "Falha no build debug. Ver logs em dist/logs/"
        fi
        
        # Verificar se existe keystore para release
        if [ -f "app/mediapp-debug.keystore" ]; then
            log_info "Keystore encontrado. Gerando APK release..."
            
            if ./gradlew assembleRelease > ../dist/logs/gradle-release-$TIMESTAMP.log 2>&1; then
                log_success "APK release gerado com sucesso"
                
                # Copiar APK release
                if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
                    cp app/build/outputs/apk/release/app-release.apk ../dist/MediApp-$VERSION-release.apk
                    log_success "APK release copiado: dist/MediApp-$VERSION-release.apk"
                fi
            else
                log_warning "Falha no build release. Ver logs em dist/logs/"
            fi
        else
            log_info "Keystore não encontrado. Pulando build release."
            log_info "Para criar keystore execute: ./create-keystore.sh"
        fi
        
        cd ..
        ;;
        
    "gradle")
        log_info "🔨 Executando build via Gradle (sem Android SDK)..."
        
        cd android
        
        # Verificar Gradle Wrapper
        if [ ! -f "gradlew" ]; then
            log_error "Gradle wrapper não encontrado"
            exit 1
        fi
        
        # Dar permissões ao gradlew
        chmod +x gradlew
        
        # Tentar build básico
        log_info "Tentando build básico..."
        if ./gradlew assembleDebug --offline > ../dist/logs/gradle-offline-$TIMESTAMP.log 2>&1; then
            log_success "Build offline bem-sucedido"
        else
            log_warning "Build offline falhou. Tentando online..."
            if ./gradlew assembleDebug > ../dist/logs/gradle-online-$TIMESTAMP.log 2>&1; then
                log_success "Build online bem-sucedido"
            else
                log_error "Build falhou. Verifique logs em dist/logs/"
                cd ..
                # Continuar para bundle JS
                BUILD_STRATEGY="bundle"
            fi
        fi
        
        cd ..
        ;;
        
    "bundle")
        log_info "🔨 Gerando bundle JavaScript apenas..."
        ;;
esac

# ==========================================
# 6. BUNDLE JAVASCRIPT (SEMPRE)
# ==========================================

log_info "Gerando bundle JavaScript..."

# Metro bundle
if npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output dist/index.android.bundle \
    --assets-dest dist/assets/ > dist/logs/bundle-$TIMESTAMP.log 2>&1; then
    
    log_success "Bundle JavaScript gerado: dist/index.android.bundle"
    
    # Informações do bundle
    BUNDLE_SIZE=$(du -h dist/index.android.bundle | cut -f1)
    log_info "Tamanho do bundle: $BUNDLE_SIZE"
    
else
    log_warning "Falha ao gerar bundle JavaScript"
fi

# ==========================================
# 7. TESTES E VALIDAÇÃO
# ==========================================

log_info "Executando testes de validação..."

# Testes unitários
if npm test > dist/logs/tests-$TIMESTAMP.log 2>&1; then
    log_success "Testes unitários passaram"
else
    log_warning "Alguns testes falharam. Ver dist/logs/tests-$TIMESTAMP.log"
fi

# Verificação TypeScript
if npx tsc --noEmit > dist/logs/typescript-$TIMESTAMP.log 2>&1; then
    log_success "Verificação TypeScript passou"
else
    log_warning "Erros TypeScript encontrados. Ver dist/logs/typescript-$TIMESTAMP.log"
fi

# ==========================================
# 8. RELATÓRIO FINAL
# ==========================================

log_info "Gerando relatório final..."

# Criar relatório
cat > dist/build-report-$TIMESTAMP.md << EOF
# MediApp Android Build Report
**Timestamp:** $(date)
**Version:** $VERSION
**Strategy:** $BUILD_STRATEGY

## Environment
- Node.js: $NODE_VERSION
- Java Available: $JAVA_AVAILABLE
- Android SDK: $ANDROID_SDK_AVAILABLE
- ADB Available: $ADB_AVAILABLE

## Generated Files
EOF

# Listar arquivos gerados
echo "" >> dist/build-report-$TIMESTAMP.md
echo "### APKs" >> dist/build-report-$TIMESTAMP.md
find dist/ -name "*.apk" -exec ls -lh {} \; >> dist/build-report-$TIMESTAMP.md

echo "" >> dist/build-report-$TIMESTAMP.md
echo "### Bundles" >> dist/build-report-$TIMESTAMP.md
find dist/ -name "*.bundle" -exec ls -lh {} \; >> dist/build-report-$TIMESTAMP.md

echo "" >> dist/build-report-$TIMESTAMP.md
echo "### Logs" >> dist/build-report-$TIMESTAMP.md
find dist/logs/ -name "*.log" -exec ls -lh {} \; >> dist/build-report-$TIMESTAMP.md

# ==========================================
# 9. SUMMARY
# ==========================================

echo ""
echo "📊 =========================================="
echo "📊 RELATÓRIO DO BUILD"
echo "📊 =========================================="

log_info "Estratégia utilizada: $BUILD_STRATEGY"
log_info "Versão gerada: $VERSION"

echo ""
echo "📁 ARQUIVOS GERADOS:"
find dist/ -name "*.apk" -o -name "*.bundle" | while read file; do
    SIZE=$(du -h "$file" | cut -f1)
    echo "  📱 $file ($SIZE)"
done

echo ""
echo "📋 LOGS DISPONÍVEIS:"
find dist/logs/ -name "*.log" | while read file; do
    echo "  📄 $file"
done

echo ""
if [ -f "dist/MediApp-$VERSION-release.apk" ]; then
    log_success "✅ APK RELEASE PRONTO PARA DISTRIBUIÇÃO!"
    echo "  📱 Arquivo: dist/MediApp-$VERSION-release.apk"
    echo "  🔗 Pronto para upload no Google Play Console"
elif [ -f "dist/MediApp-$VERSION-debug.apk" ]; then
    log_success "✅ APK DEBUG PRONTO PARA TESTES!"
    echo "  📱 Arquivo: dist/MediApp-$VERSION-debug.apk"
    echo "  🧪 Pronto para testes internos"
elif [ -f "dist/index.android.bundle" ]; then
    log_success "✅ BUNDLE JAVASCRIPT GERADO!"
    echo "  📦 Arquivo: dist/index.android.bundle"
    echo "  ⚙️ Configure Android SDK para gerar APK"
else
    log_warning "⚠️ NENHUM ARTEFATO PRINCIPAL GERADO"
    echo "  🔧 Verifique os logs para diagnóstico"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
if [ "$ANDROID_SDK_AVAILABLE" = false ]; then
    echo "  1. Instalar Android SDK e configurar ANDROID_HOME"
    echo "  2. Executar novamente para gerar APK completo"
fi

if [ ! -f "android/app/mediapp-debug.keystore" ]; then
    echo "  3. Criar keystore para builds de release"
    echo "  4. Configurar assinatura automática"
fi

echo "  5. Testar APK em dispositivos reais"
echo "  6. Distribuir para beta testers"

echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "  📋 Relatório completo: dist/build-report-$TIMESTAMP.md"
echo "  🔧 Plano Android Beta: ../PLANO_ANDROID_BETA.md"
echo ""
echo "📱 MediApp build concluído!"
echo "=========================================="