#!/bin/bash

# MediApp - Setup Android SDK
# ============================

set -e

echo "📱 Configurando Android SDK para MediApp..."

# Definir variáveis
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

echo "ANDROID_HOME: $ANDROID_HOME"

# Verificar estrutura
cd "$ANDROID_HOME"
echo "Estrutura atual:"
ls -la

# Aceitar todas as licenças automaticamente
echo "Configurando licenças do Android SDK..."
yes | sdkmanager --licenses > /dev/null 2>&1 || echo "Licenças configuradas"

# Instalar SDK essenciais
echo "Instalando Android SDK 33..."
sdkmanager "platforms;android-33"

echo "Instalando build tools..."
sdkmanager "build-tools;33.0.0"

echo "Instalando platform tools (ADB)..."
sdkmanager "platform-tools"

# Verificar instalação
echo "Verificando instalação..."
sdkmanager --list | grep "build-tools\|platforms"

# Configurar variáveis permanentemente
echo "Configurando variáveis de ambiente..."
echo "export ANDROID_HOME=$HOME/Android/Sdk" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> ~/.bashrc

echo "✅ Android SDK configurado com sucesso!"
echo "Execute 'source ~/.bashrc' para carregar as variáveis"