#!/bin/bash

# Script de Teste de Conectividade MediApp Mobile
# Específico para ambientes Linux virtualizados
# ===============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

echo "🔌 =========================================="
echo "🔌 MediApp - Teste de Conectividade Mobile"
echo "🔌 Ambiente Linux Virtualizado"
echo "🔌 =========================================="

# ==========================================
# 1. DETECÇÃO DO AMBIENTE
# ==========================================

log_info "Detectando ambiente..."

# Verificar se estamos em WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    ENVIRONMENT="WSL"
    log_success "Ambiente detectado: Windows Subsystem for Linux (WSL)"
elif [ -f /.dockerenv ]; then
    ENVIRONMENT="DOCKER"
    log_success "Ambiente detectado: Docker Container"
elif [ -d /proc/vz ]; then
    ENVIRONMENT="OPENVZ"
    log_success "Ambiente detectado: OpenVZ Container"
elif dmesg 2>/dev/null | grep -qi virtualbox; then
    ENVIRONMENT="VIRTUALBOX"
    log_success "Ambiente detectado: VirtualBox VM"
elif dmesg 2>/dev/null | grep -qi vmware; then
    ENVIRONMENT="VMWARE"
    log_success "Ambiente detectado: VMware VM"
elif [ -d /sys/hypervisor ]; then
    ENVIRONMENT="VM"
    log_success "Ambiente detectado: Máquina Virtual genérica"
else
    ENVIRONMENT="NATIVE"
    log_success "Ambiente detectado: Linux nativo"
fi

# Obter informações de rede
log_info "Coletando informações de rede..."

# IP local
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "N/A")
log_debug "IP Local: $LOCAL_IP"

# Gateway padrão
GATEWAY=$(ip route | grep default | awk '{print $3}' 2>/dev/null || echo "N/A")
log_debug "Gateway: $GATEWAY"

# Interfaces de rede
INTERFACES=$(ip addr show | grep '^[0-9]' | awk '{print $2}' | sed 's/:$//' | tr '\n' ' ')
log_debug "Interfaces: $INTERFACES"

# ==========================================
# 2. CONFIGURAÇÃO BASEADA NO AMBIENTE
# ==========================================

log_info "Configurando URLs baseado no ambiente..."

# URLs para testar baseado no ambiente
declare -A URLS_TO_TEST

case $ENVIRONMENT in
    "WSL")
        URLS_TO_TEST=(
            ["localhost"]="http://localhost:3002/api"
            ["127.0.0.1"]="http://127.0.0.1:3002/api"
            ["windows-host"]="http://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):3002/api"
        )
        ;;
    "DOCKER")
        URLS_TO_TEST=(
            ["localhost"]="http://localhost:3002/api"
            ["host.docker.internal"]="http://host.docker.internal:3002/api"
            ["gateway"]="http://$GATEWAY:3002/api"
        )
        ;;
    "VIRTUALBOX")
        URLS_TO_TEST=(
            ["localhost"]="http://localhost:3002/api"
            ["host-only-gateway"]="http://192.168.56.1:3002/api"
            ["nat-gateway"]="http://10.0.2.2:3002/api"
            ["gateway"]="http://$GATEWAY:3002/api"
        )
        ;;
    "VMWARE")
        URLS_TO_TEST=(
            ["localhost"]="http://localhost:3002/api"
            ["vmware-gateway"]="http://192.168.1.1:3002/api"
            ["gateway"]="http://$GATEWAY:3002/api"
        )
        ;;
    *)
        URLS_TO_TEST=(
            ["localhost"]="http://localhost:3002/api"
            ["127.0.0.1"]="http://127.0.0.1:3002/api"
            ["local-ip"]="http://$LOCAL_IP:3002/api"
            ["gateway"]="http://$GATEWAY:3002/api"
        )
        ;;
esac

# ==========================================
# 3. TESTE DE CONECTIVIDADE
# ==========================================

log_info "Iniciando testes de conectividade..."

SUCCESSFUL_URLS=()
FAILED_URLS=()

for name in "${!URLS_TO_TEST[@]}"; do
    url="${URLS_TO_TEST[$name]}"
    
    log_info "Testando: $name ($url)"
    
    # Teste com curl
    if command -v curl &> /dev/null; then
        if curl -s --connect-timeout 5 --max-time 10 "$url/health" &>/dev/null; then
            log_success "✅ $name: CONECTADO"
            SUCCESSFUL_URLS+=("$name:$url")
        else
            log_error "❌ $name: FALHOU"
            FAILED_URLS+=("$name:$url")
        fi
    # Teste com wget se curl não estiver disponível
    elif command -v wget &> /dev/null; then
        if wget -q --timeout=5 --tries=1 -O /dev/null "$url/health" &>/dev/null; then
            log_success "✅ $name: CONECTADO"
            SUCCESSFUL_URLS+=("$name:$url")
        else
            log_error "❌ $name: FALHOU"
            FAILED_URLS+=("$name:$url")
        fi
    else
        log_warning "curl e wget não disponíveis para teste"
        break
    fi
done

# ==========================================
# 4. TESTES ESPECÍFICOS PARA MOBILE
# ==========================================

log_info "Testando URLs específicas para mobile..."

# URLs específicas para React Native
MOBILE_URLS=(
    "http://10.0.2.2:3002/api"  # Android Emulator
    "http://localhost:3002/api"  # iOS Simulator
)

for url in "${MOBILE_URLS[@]}"; do
    log_info "Testando mobile URL: $url"
    
    if command -v curl &> /dev/null; then
        if curl -s --connect-timeout 3 --max-time 5 "$url/health" &>/dev/null; then
            log_success "✅ Mobile URL funcional: $url"
            SUCCESSFUL_URLS+=("mobile:$url")
        else
            log_warning "⚠️ Mobile URL não disponível: $url"
        fi
    fi
done

# ==========================================
# 5. VERIFICAÇÃO DE PORTAS
# ==========================================

log_info "Verificando disponibilidade de portas..."

PORTS_TO_CHECK=(3002 3000 3001 8080)

for port in "${PORTS_TO_CHECK[@]}"; do
    if command -v nc &> /dev/null; then
        if nc -z localhost $port 2>/dev/null; then
            log_success "✅ Porta $port: ABERTA"
        else
            log_warning "⚠️ Porta $port: FECHADA"
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tln | grep ":$port " &>/dev/null; then
            log_success "✅ Porta $port: EM USO"
        else
            log_warning "⚠️ Porta $port: LIVRE"
        fi
    fi
done

# ==========================================
# 6. GERAÇÃO DE CONFIGURAÇÃO PARA MOBILE
# ==========================================

log_info "Gerando configuração para aplicativo mobile..."

# Criar arquivo de configuração
CONFIG_FILE="mobile-connectivity-config.json"

cat > "$CONFIG_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "detectedAt": "$(date -Iseconds)",
  "networkInfo": {
    "localIp": "$LOCAL_IP",
    "gateway": "$GATEWAY",
    "interfaces": "$INTERFACES"
  },
  "recommendedUrls": [
EOF

# Adicionar URLs bem-sucedidas
for i in "${!SUCCESSFUL_URLS[@]}"; do
    IFS=':' read -r name url <<< "${SUCCESSFUL_URLS[$i]}"
    echo "    {" >> "$CONFIG_FILE"
    echo "      \"name\": \"$name\"," >> "$CONFIG_FILE"
    echo "      \"url\": \"$url\"," >> "$CONFIG_FILE"
    echo "      \"tested\": true," >> "$CONFIG_FILE"
    echo "      \"working\": true" >> "$CONFIG_FILE"
    if [ $i -eq $((${#SUCCESSFUL_URLS[@]} - 1)) ]; then
        echo "    }" >> "$CONFIG_FILE"
    else
        echo "    }," >> "$CONFIG_FILE"
    fi
done

cat >> "$CONFIG_FILE" << EOF
  ],
  "mobileSpecificConfig": {
    "androidEmulator": {
      "url": "http://10.0.2.2:3002/api",
      "description": "Use esta URL no Android Studio Emulator"
    },
    "iosSimulator": {
      "url": "http://localhost:3002/api",
      "description": "Use esta URL no iOS Simulator"
    },
    "physicalDevice": {
      "url": "http://$LOCAL_IP:3002/api",
      "description": "Use esta URL em dispositivos físicos na mesma rede"
    }
  }
}
EOF

log_success "Configuração salva em: $CONFIG_FILE"

# ==========================================
# 7. RELATÓRIO FINAL
# ==========================================

echo ""
echo "📊 =========================================="
echo "📊 RELATÓRIO DE CONECTIVIDADE"
echo "📊 =========================================="

log_info "Ambiente: $ENVIRONMENT"
log_info "IP Local: $LOCAL_IP"
log_info "Gateway: $GATEWAY"

echo ""
echo "✅ CONEXÕES FUNCIONAIS:"
if [ ${#SUCCESSFUL_URLS[@]} -eq 0 ]; then
    log_warning "Nenhuma conexão funcional encontrada"
else
    for url_info in "${SUCCESSFUL_URLS[@]}"; do
        IFS=':' read -r name url <<< "$url_info"
        echo "  📱 $name: $url"
    done
fi

echo ""
echo "❌ CONEXÕES FALHARAM:"
if [ ${#FAILED_URLS[@]} -eq 0 ]; then
    log_success "Todas as conexões testadas funcionaram"
else
    for url_info in "${FAILED_URLS[@]}"; do
        IFS=':' read -r name url <<< "$url_info"
        echo "  ❌ $name: $url"
    done
fi

echo ""
echo "🎯 RECOMENDAÇÕES PARA REACT NATIVE:"

if [ ${#SUCCESSFUL_URLS[@]} -gt 0 ]; then
    # Primeira URL funcional
    first_successful="${SUCCESSFUL_URLS[0]}"
    IFS=':' read -r name url <<< "$first_successful"
    
    echo "  1. Configure apiConfig.ts com:"
    echo "     BASE_URL: '$url'"
    echo ""
    echo "  2. Para Android Emulator, use:"
    echo "     BASE_URL: 'http://10.0.2.2:3002/api'"
    echo ""
    echo "  3. Para iOS Simulator, use:"
    echo "     BASE_URL: 'http://localhost:3002/api'"
    echo ""
    echo "  4. Para dispositivos físicos, use:"
    echo "     BASE_URL: 'http://$LOCAL_IP:3002/api'"
else
    log_error "NENHUMA CONEXÃO FUNCIONAL!"
    echo ""
    echo "🔧 SOLUÇÕES:"
    echo "  1. Verifique se o backend está rodando:"
    echo "     cd /caminho/do/backend && npm start"
    echo ""
    echo "  2. Verifique se a porta 3002 está aberta:"
    echo "     sudo ufw allow 3002"
    echo ""
    echo "  3. Para Docker, use:"
    echo "     docker run -p 3002:3002 mediapp-backend"
    echo ""
    echo "  4. Para WSL, verifique o firewall do Windows"
fi

echo ""
echo "📁 ARQUIVOS GERADOS:"
echo "  📄 $CONFIG_FILE - Configuração completa"

echo ""
echo "🔌 Teste de conectividade concluído!"
echo "=========================================="