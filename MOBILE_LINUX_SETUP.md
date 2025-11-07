# 📱 MediApp Mobile - Configuração para Ambiente Linux Virtualizado
# ===============================================================

## 🎯 **OVERVIEW**

Este documento fornece instruções completas para configurar e testar a integração do aplicativo mobile MediApp com o backend em ambientes Linux virtualizados (WSL, VirtualBox, VMware, Docker).

---

## 🔧 **CONFIGURAÇÃO AUTOMÁTICA**

### **1. Script de Teste de Conectividade**

Execute o script automático para detectar e configurar seu ambiente:

```bash
# Tornar o script executável
chmod +x test-mobile-connectivity-linux.sh

# Executar teste
./test-mobile-connectivity-linux.sh
```

O script irá:
- ✅ Detectar automaticamente seu ambiente (WSL, Docker, VirtualBox, etc.)
- ✅ Testar conectividade com diferentes URLs
- ✅ Gerar configuração específica para React Native
- ✅ Criar arquivo `mobile-connectivity-config.json` com as configurações

---

## 🐧 **CONFIGURAÇÃO POR TIPO DE AMBIENTE**

### **WSL (Windows Subsystem for Linux)**

**Características:**
- Backend rodando no WSL
- React Native no Windows ou WSL
- Conectividade via localhost

**Configuração:**
```typescript
// src/config/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3002/api', // WSL expõe para Windows
  // ... outras configurações
};
```

**Comandos de verificação:**
```bash
# No WSL - verificar se backend está rodando
curl http://localhost:3002/api/health

# No Windows - verificar acessibilidade
curl http://localhost:3002/api/health
```

### **VirtualBox**

**Características:**
- VM Linux com backend
- Host Windows/Mac com React Native
- Conectividade via IP da VM ou gateway

**Configuração Network:**

#### **Opção 1: Host-Only Network**
```typescript
// src/config/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: 'http://192.168.56.1:3002/api', // IP padrão VirtualBox host-only
};
```

#### **Opção 2: Bridged Network**
```typescript
// Obter IP da VM
ip addr show

// Configurar com IP real da VM
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.XXX:3002/api', // IP da VM na rede
};
```

**Configuração da VM:**
```bash
# Dentro da VM - permitir conexões externas
sudo ufw allow 3002

# Verificar se o servidor está ouvindo em todas as interfaces
netstat -tln | grep 3002
# Deve mostrar: 0.0.0.0:3002 (não apenas 127.0.0.1:3002)
```

### **VMware**

**Configuração similar ao VirtualBox:**
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.XXX:3002/api', // IP da VM VMware
};
```

### **Docker**

**Características:**
- Backend em container Docker
- React Native no host
- Conectividade via port mapping

**Configuração:**
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3002/api', // Port mapping 3002:3002
};
```

**Docker commands:**
```bash
# Executar backend com port mapping
docker run -p 3002:3002 mediapp-backend

# Ou com docker-compose
version: '3'
services:
  backend:
    build: .
    ports:
      - "3002:3002"
```

---

## 📱 **CONFIGURAÇÃO ESPECÍFICA PARA REACT NATIVE**

### **Android Emulator**

O Android Emulator tem um IP especial para acessar o host:

```typescript
// src/config/apiConfig.ts
const getApiBaseUrl = (): string => {
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:3002/api'; // IP especial do Android Emulator
  }
  
  return 'http://localhost:3002/api'; // Outras plataformas
};
```

### **iOS Simulator**

O iOS Simulator pode usar localhost diretamente:

```typescript
if (Platform.OS === 'ios' && __DEV__) {
  return 'http://localhost:3002/api';
}
```

### **Dispositivos Físicos**

Para dispositivos físicos, use o IP real da máquina:

```typescript
// Para desenvolvimento com dispositivos físicos
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.XXX:3002/api', // IP da máquina de desenvolvimento
};
```

---

## 🚀 **CONFIGURAÇÃO DINÂMICA (RECOMENDADO)**

Use o hook `useApiConnectivity` para configuração dinâmica:

```typescript
// Em um componente React Native
import { useLinuxApiConnectivity } from '../hooks/useApiConnectivity';

const App = () => {
  const connectivity = useLinuxApiConnectivity('vm', '192.168.1.100');
  
  if (!connectivity.isConnected) {
    return <ConnectivityTestScreen />;
  }
  
  return <MainApp />;
};
```

**Tipos de ambiente suportados:**
- `'native'` - Linux nativo
- `'wsl'` - Windows Subsystem for Linux
- `'vm'` - Máquina virtual genérica
- `'docker'` - Container Docker

---

## 🔍 **TESTES E DEBUG**

### **1. Tela de Teste de Conectividade**

O app mobile inclui uma tela para testar conectividade:

```typescript
import ConnectivityTestScreen from './src/screens/ConnectivityTestScreen';

// Use esta tela para testar diferentes URLs
<ConnectivityTestScreen />
```

### **2. Comandos de Debug**

```bash
# Verificar se backend está rodando
curl http://localhost:3002/api/health

# Verificar portas abertas
netstat -tln | grep 3002

# Verificar conectividade de outro IP
curl http://192.168.1.XXX:3002/api/health

# Debug de rede no Android Emulator
adb shell
# Dentro do emulator:
ping 10.0.2.2
curl http://10.0.2.2:3002/api/health
```

### **3. Logs do React Native**

```bash
# Logs do Metro bundler
npx react-native start

# Logs do Android
npx react-native log-android

# Logs do iOS
npx react-native log-ios
```

---

## ⚡ **SOLUÇÃO RÁPIDA - AUTO-DETECÇÃO**

Para configuração automática, use a função de auto-detecção:

```typescript
import { useApiConnectivity } from '../hooks/useApiConnectivity';

const connectivity = useApiConnectivity({
  type: 'linux-vm',
  autoDetect: true, // Tenta detectar automaticamente a melhor URL
});

// O hook tentará automaticamente:
// 1. http://localhost:3002/api
// 2. http://10.0.2.2:3002/api (Android)
// 3. http://192.168.1.100:3002/api (IP customizado)
// 4. http://host.docker.internal:3002/api (Docker)
```

---

## 🛠️ **TROUBLESHOOTING**

### **Problema: "Network request failed"**

**Soluções:**
1. Verificar se backend está rodando: `curl http://localhost:3002/api/health`
2. Verificar firewall: `sudo ufw allow 3002`
3. Verificar se servidor está ouvindo em todas as interfaces: `netstat -tln | grep 3002`
4. Testar com IP específico: `curl http://IP_DA_MAQUINA:3002/api/health`

### **Problema: CORS errors**

**Solução:** O backend já está configurado para aceitar requests de mobile apps (sem origin).

### **Problema: Connection timeout**

**Soluções:**
1. Aumentar timeout na configuração da API
2. Verificar conectividade de rede
3. Usar IP direto ao invés de hostname

### **Problema: Android Emulator não conecta**

**Soluções:**
1. Usar `http://10.0.2.2:3002/api` (não localhost)
2. Verificar se a porta está exposta: `adb port forward 3002 3002`
3. Testar conectividade dentro do emulator: `adb shell curl http://10.0.2.2:3002/api/health`

---

## 📋 **CHECKLIST DE CONFIGURAÇÃO**

### **Backend:**
- [ ] Servidor rodando na porta 3002
- [ ] CORS configurado para aceitar requests sem origin
- [ ] Firewall permitindo conexões na porta 3002
- [ ] Servidor ouvindo em `0.0.0.0:3002` (não apenas `127.0.0.1:3002`)

### **Mobile App:**
- [ ] `apiConfig.ts` configurado com URL correta
- [ ] Dependências instaladas (`npm install`)
- [ ] Metro bundler rodando (`npx react-native start`)
- [ ] Hook de conectividade implementado

### **Rede:**
- [ ] IP da máquina de desenvolvimento identificado
- [ ] Conectividade testada com `curl` ou `wget`
- [ ] Port forwarding configurado (se necessário)
- [ ] Emulator/Simulator com conectividade de rede

---

## 🎯 **CONFIGURAÇÃO FINAL RECOMENDADA**

**Para máxima compatibilidade, use esta configuração:**

```typescript
// src/config/apiConfig.ts
import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (!__DEV__) {
    return 'https://api.mediapp.com.br/api'; // Produção
  }

  // Desenvolvimento - auto-detecção baseada na plataforma
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3002/api'; // Android Emulator
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3002/api'; // iOS Simulator
  } else {
    return 'http://localhost:3002/api'; // Web/outros
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  // ... outras configurações
};
```

**E use o hook de conectividade para fallback automático:**

```typescript
// No componente principal
const connectivity = useApiConnectivity({
  autoDetect: true, // Tentará diferentes URLs automaticamente
});

if (connectivity.isLoading) {
  return <LoadingScreen />;
}

if (!connectivity.isConnected) {
  return <ConnectivityTestScreen />;
}

return <MainApp />;
```

---

## ✅ **VERIFICAÇÃO FINAL**

Execute estes comandos para verificar se tudo está funcionando:

```bash
# 1. Executar script de teste
./test-mobile-connectivity-linux.sh

# 2. Verificar configuração gerada
cat mobile-connectivity-config.json

# 3. Testar manualmente as URLs recomendadas
curl http://localhost:3002/api/health
curl http://10.0.2.2:3002/api/health  # Se usando Android

# 4. Executar app mobile e verificar logs
npx react-native start
npx react-native run-android  # ou run-ios
```

Se todos os passos passarem, a integração mobile está funcional! 🎉

---

**📱 MediApp Mobile está pronto para ser usado em ambiente Linux virtualizado!**