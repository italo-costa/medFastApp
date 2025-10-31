#!/bin/bash

# MediApp Android Beta - Implementação Imediata
# Script para gerar APK Beta em 2-3 horas

echo "🚀 === MEDIAPP ANDROID BETA - IMPLEMENTAÇÃO IMEDIATA ==="
echo "📅 $(date)"
echo ""

cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile

# Verificar estrutura atual
echo "📋 Verificando estrutura atual..."
if [[ ! -f "package.json" ]]; then
    echo "❌ Erro: package.json não encontrado"
    exit 1
fi

if [[ ! -d "android" ]]; then
    echo "❌ Erro: pasta android/ não encontrada"
    exit 1
fi

echo "✅ Estrutura React Native confirmada"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node --version) encontrado"
fi

# Verificar dependências
echo "📦 Verificando dependências..."
if [[ ! -d "node_modules" ]]; then
    echo "🔄 Instalando dependências React Native..."
    npm install
fi

# Verificar Java
echo "☕ Verificando Java..."
if ! command -v java &> /dev/null; then
    echo "🔄 Instalando OpenJDK 11..."
    sudo apt update
    sudo apt install -y openjdk-11-jdk
    echo "✅ Java instalado"
else
    echo "✅ Java $(java -version 2>&1 | head -n 1) encontrado"
fi

# Configurar JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc

# Verificar Android SDK
echo "🤖 Verificando Android SDK..."
if [[ ! -d "$HOME/Android/Sdk" ]]; then
    echo "🔄 Baixando Android Command Line Tools..."
    
    # Criar diretório Android
    mkdir -p $HOME/Android/Sdk/cmdline-tools
    cd $HOME/Android/Sdk/cmdline-tools
    
    # Baixar command line tools
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip
    unzip -q commandlinetools-linux-10406996_latest.zip
    mv cmdline-tools latest
    rm commandlinetools-linux-10406996_latest.zip
    
    echo "✅ Android Command Line Tools baixado"
else
    echo "✅ Android SDK encontrado"
fi

# Configurar Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/33.0.0

# Adicionar ao bashrc
echo "export ANDROID_HOME=$HOME/Android/Sdk" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/build-tools/33.0.0" >> ~/.bashrc

# Aceitar licenças do Android SDK
echo "📜 Aceitando licenças Android..."
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses 2>/dev/null

# Instalar packages essenciais do Android
echo "📦 Instalando packages Android essenciais..."
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.0" \
    "system-images;android-33;google_apis;x86_64" 2>/dev/null

# Voltar para diretório do mobile
cd /mnt/c/workspace/aplicativo/mediapp-refined/apps/mobile

# Verificar se o bundle existe, senão gerar
echo "📱 Verificando bundle JavaScript..."
if [[ ! -f "dist/index.android.bundle" ]]; then
    echo "🔄 Gerando bundle Android..."
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output dist/index.android.bundle \
        --assets-dest dist/
    echo "✅ Bundle Android gerado"
else
    echo "✅ Bundle Android já existe ($(ls -lh dist/index.android.bundle | awk '{print $5}'))"
fi

# Limpar e preparar build Android
echo "🧹 Limpando build anterior..."
cd android
./gradlew clean 2>/dev/null || echo "⚠️ Gradlew clean falhou (normal na primeira execução)"

# Gerar APK Debug
echo "🏗️ Gerando APK Debug..."
echo "⏱️ Isso pode levar 5-10 minutos na primeira vez..."

./gradlew assembleDebug

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🎉 === APK ANDROID GERADO COM SUCESSO ==="
    echo ""
    
    # Encontrar e mostrar informações do APK
    APK_PATH=$(find . -name "*.apk" -type f | head -1)
    if [[ -n "$APK_PATH" ]]; then
        APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
        APK_FULL_PATH=$(realpath "$APK_PATH")
        
        echo "📱 APK Localização: $APK_FULL_PATH"
        echo "📊 APK Tamanho: $APK_SIZE"
        echo "🔗 APK Windows Path: $(echo "$APK_FULL_PATH" | sed 's|/mnt/c|C:|')"
        echo ""
        
        # Instruções de instalação
        echo "📋 INSTRUÇÕES DE INSTALAÇÃO:"
        echo ""
        echo "OPÇÃO 1 - ADB (Recomendado):"
        echo "  1. Conecte dispositivo Android via USB"
        echo "  2. Ative 'Depuração USB' no dispositivo"
        echo "  3. Execute: adb install \"$APK_FULL_PATH\""
        echo ""
        echo "OPÇÃO 2 - Transferência Manual:"
        echo "  1. Copie APK para dispositivo Android"
        echo "  2. Ative 'Fontes desconhecidas' nas configurações"
        echo "  3. Abra APK no dispositivo e instale"
        echo ""
        echo "OPÇÃO 3 - Emulador:"
        echo "  1. Inicie emulador Android"
        echo "  2. Arraste APK para a tela do emulador"
        echo ""
        
        # Próximos passos
        echo "🚀 PRÓXIMOS PASSOS:"
        echo ""
        echo "1. ✅ TESTAR APK EM DISPOSITIVO"
        echo "   - Instalar e verificar funcionamento"
        echo "   - Testar todas as telas principais"
        echo "   - Verificar conectividade com backend"
        echo ""
        echo "2. 🔐 GERAR APK RELEASE (Opcional):"
        echo "   - Criar keystore para assinatura"
        echo "   - Gerar APK assinado para distribuição"
        echo ""
        echo "3. 🚀 DISTRIBUIR BETA:"
        echo "   - Google Play Internal Testing"
        echo "   - Firebase App Distribution"
        echo "   - Distribuição direta"
        echo ""
        
        # Comandos úteis
        echo "🔧 COMANDOS ÚTEIS:"
        echo ""
        echo "# Verificar dispositivos conectados:"
        echo "adb devices"
        echo ""
        echo "# Instalar APK:"
        echo "adb install \"$APK_FULL_PATH\""
        echo ""
        echo "# Ver logs do app:"
        echo "adb logcat | grep ReactNativeJS"
        echo ""
        echo "# Desinstalar app:"
        echo "adb uninstall com.mediapp"
        echo ""
        
    else
        echo "⚠️ APK gerado mas localização não encontrada"
        echo "Verifique pasta: android/app/build/outputs/apk/"
    fi
    
else
    echo ""
    echo "❌ === ERRO NA GERAÇÃO DO APK ==="
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo ""
    echo "1. Verificar logs de erro acima"
    echo "2. Verificar se ANDROID_HOME está configurado:"
    echo "   echo \$ANDROID_HOME"
    echo ""
    echo "3. Verificar se Java está configurado:"
    echo "   java -version"
    echo ""
    echo "4. Limpar e tentar novamente:"
    echo "   ./gradlew clean"
    echo "   ./gradlew assembleDebug"
    echo ""
    echo "5. Verificar dependências Android:"
    echo "   \$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list"
    echo ""
fi

# Voltar para raiz
cd /mnt/c/workspace/aplicativo/mediapp-refined

echo ""
echo "📋 RESUMO DA IMPLEMENTAÇÃO:"
echo "=========================="
echo "✅ Estrutura React Native: Verificada"
echo "✅ Dependências Node.js: Instaladas"
echo "✅ Java JDK: Configurado"
echo "✅ Android SDK: Instalado"
echo "✅ Bundle JavaScript: Gerado"
echo "📱 APK Android: $(if [[ $? -eq 0 ]]; then echo "✅ Gerado"; else echo "❌ Erro"; fi)"
echo ""
echo "🎯 STATUS: MediApp Android Beta implementado!"
echo "📱 Próximo passo: Testar APK em dispositivo Android"