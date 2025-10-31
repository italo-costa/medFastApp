#!/bin/bash

# MediApp - Create Android Keystore Script
# ========================================
# Este script cria um keystore para assinatura de APKs

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔐 =========================================="
echo "🔐 MediApp - Criação de Keystore Android"
echo "🔐 =========================================="

# Verificar se Java está disponível
if ! command -v keytool &> /dev/null; then
    log_error "keytool não encontrado. Instale Java JDK."
    exit 1
fi

# Configurações do keystore
KEYSTORE_NAME="mediapp-debug.keystore"
KEYSTORE_ALIAS="mediapp-debug"
KEYSTORE_PASSWORD="mediapp123"
KEY_PASSWORD="mediapp123"
VALIDITY_DAYS="365"

# Para produção, usar configurações mais seguras:
KEYSTORE_NAME_PROD="mediapp-release.keystore"
KEYSTORE_ALIAS_PROD="mediapp-release"

echo ""
echo "📋 OPÇÕES DE KEYSTORE:"
echo "1) Debug Keystore (para testes)"
echo "2) Release Keystore (para produção)"
echo "3) Ambos"
echo ""

read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        KEYSTORES=("debug")
        ;;
    2)
        KEYSTORES=("release")
        ;;
    3)
        KEYSTORES=("debug" "release")
        ;;
    *)
        log_error "Opção inválida"
        exit 1
        ;;
esac

# Criar pasta android se não existir
mkdir -p android/app

for keystore_type in "${KEYSTORES[@]}"; do
    echo ""
    log_info "Criando keystore $keystore_type..."
    
    if [ "$keystore_type" = "debug" ]; then
        KEYSTORE_FILE="android/app/$KEYSTORE_NAME"
        ALIAS="$KEYSTORE_ALIAS"
        STORE_PASS="$KEYSTORE_PASSWORD"
        KEY_PASS="$KEY_PASSWORD"
        
        # Informações do certificado para debug
        DNAME="CN=MediApp Debug, OU=Development, O=MediApp, L=City, ST=State, C=BR"
    else
        KEYSTORE_FILE="android/app/$KEYSTORE_NAME_PROD"
        ALIAS="$KEYSTORE_ALIAS_PROD"
        
        # Para produção, solicitar senhas seguras
        echo "🔒 Para keystore de PRODUÇÃO, use senhas seguras!"
        read -s -p "Senha do keystore: " STORE_PASS
        echo ""
        read -s -p "Senha da chave: " KEY_PASS
        echo ""
        
        # Informações do certificado para produção
        echo "📋 Informações do certificado:"
        read -p "Nome da organização: " ORG_NAME
        read -p "Unidade organizacional: " ORG_UNIT
        read -p "Cidade: " CITY
        read -p "Estado: " STATE
        read -p "País (código de 2 letras): " COUNTRY
        
        DNAME="CN=$ORG_NAME, OU=$ORG_UNIT, O=MediApp, L=$CITY, ST=$STATE, C=$COUNTRY"
    fi
    
    # Verificar se keystore já existe
    if [ -f "$KEYSTORE_FILE" ]; then
        log_warning "Keystore $keystore_type já existe: $KEYSTORE_FILE"
        read -p "Sobrescrever? (y/N): " overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            log_info "Pulando criação do keystore $keystore_type"
            continue
        fi
        rm -f "$KEYSTORE_FILE"
    fi
    
    # Criar keystore
    log_info "Gerando keystore $keystore_type..."
    
    keytool -genkeypair \
        -v \
        -storetype PKCS12 \
        -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity $VALIDITY_DAYS \
        -storepass "$STORE_PASS" \
        -keypass "$KEY_PASS" \
        -dname "$DNAME"
    
    if [ $? -eq 0 ]; then
        log_success "Keystore $keystore_type criado: $KEYSTORE_FILE"
        
        # Mostrar informações do keystore
        log_info "Informações do keystore:"
        keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$STORE_PASS" | head -20
        
        # Salvar configurações
        CONFIG_FILE="android/app/keystore-$keystore_type.properties"
        cat > "$CONFIG_FILE" << EOF
# Configurações do Keystore $keystore_type
# Gerado em: $(date)

KEYSTORE_FILE=$KEYSTORE_FILE
KEYSTORE_PASSWORD=$STORE_PASS
KEY_ALIAS=$ALIAS
KEY_PASSWORD=$KEY_PASS
EOF
        
        log_success "Configurações salvas: $CONFIG_FILE"
        
        # Configurar build.gradle se for debug
        if [ "$keystore_type" = "debug" ]; then
            log_info "Configurando build.gradle..."
            
            # Verificar se build.gradle já tem configuração de signing
            GRADLE_FILE="android/app/build.gradle"
            
            if [ -f "$GRADLE_FILE" ]; then
                if ! grep -q "signingConfigs" "$GRADLE_FILE"; then
                    log_info "Adicionando configuração de assinatura ao build.gradle..."
                    
                    # Backup do arquivo original
                    cp "$GRADLE_FILE" "$GRADLE_FILE.backup"
                    
                    # Adicionar configuração de signing
                    cat >> "$GRADLE_FILE" << 'EOF'

// Configuração de assinatura
android {
    signingConfigs {
        debug {
            storeFile file('mediapp-debug.keystore')
            storePassword 'mediapp123'
            keyAlias 'mediapp-debug'
            keyPassword 'mediapp123'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
EOF
                    
                    log_success "build.gradle configurado para usar keystore"
                else
                    log_info "build.gradle já possui configuração de assinatura"
                fi
            fi
        fi
        
    else
        log_error "Falha ao criar keystore $keystore_type"
        exit 1
    fi
done

echo ""
echo "🎉 =========================================="
echo "🎉 KEYSTORES CRIADOS COM SUCESSO!"
echo "🎉 =========================================="

echo ""
echo "📁 ARQUIVOS GERADOS:"
find android/app/ -name "*.keystore" -exec ls -lh {} \;

echo ""
echo "⚠️ IMPORTANTE - SEGURANÇA:"
echo "  🔒 Mantenha os keystores em local seguro"
echo "  💾 Faça backup dos keystores"
echo "  🚫 NÃO commite keystores no Git"
echo "  📝 Documente as senhas em local seguro"

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "  1. Execute: ./build-android-beta.sh"
echo "  2. APK será assinado automaticamente"
echo "  3. Distribua para beta testers"

echo ""
echo "📋 PARA PRODUÇÃO:"
echo "  1. Use keystore de release para Play Store"
echo "  2. Configure Google Play App Signing"
echo "  3. Mantenha backup do keystore original"

echo ""
echo "🔐 Keystores prontos para uso!"