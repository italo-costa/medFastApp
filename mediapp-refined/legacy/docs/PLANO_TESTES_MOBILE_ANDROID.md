# 📱 PLANO DE IMPLEMENTAÇÃO DE TESTES MOBILE ANDROID

## 🔍 **ANÁLISE ATUAL DO PROJETO MOBILE**

### ✅ **O que temos:**
- 📁 Estrutura mobile básica em `/mobile/`
- 📦 React Native 0.72.6 configurado no package.json
- 🧩 Redux Toolkit para gerenciamento de estado
- 🎨 React Native Paper para UI
- 📝 TypeScript configurado
- 🧪 Jest configurado (básico)

### ❌ **O que está faltando:**
- 📂 Pastas `android/` e `ios/` (projeto não inicializado)
- 🏗️ Build nativo não configurado
- 🧪 Testes específicos para mobile
- 📲 Configuração para Android Play Store
- 🔧 Pipeline de CI/CD mobile

## 🎯 **OBJETIVO: IMPLEMENTAR TESTES PARA PLAY STORE**

### 📋 **TIPOS DE TESTE NECESSÁRIOS:**

#### 1. **🧪 Testes Unitários React Native**
- Componentes React Native
- Redux stores e slices
- Hooks customizados
- Serviços de API

#### 2. **🔄 Testes de Integração Mobile**
- Navegação entre telas
- Estado global do app
- Integração com APIs backend
- Autenticação mobile

#### 3. **📲 Testes E2E Mobile (Appium/Detox)**
- Fluxos completos do usuário
- Testes em dispositivos reais
- Performance mobile
- Comportamento offline/online

#### 4. **🏪 Testes Específicos Play Store**
- APK signing
- Permissões Android
- Compatibilidade de versões
- Testes de segurança

## 🛠️ **PLANO DE IMPLEMENTAÇÃO DETALHADO**

### **FASE 1: CONFIGURAÇÃO BÁSICA (Prioridade ALTA)**

#### 📋 **Passo 1.1: Inicializar Projeto React Native Completo**
```bash
# Instalar React Native CLI
npm install -g react-native-cli

# Recriar projeto com estrutura completa
cd mobile
npx react-native init MediAppMobile --template react-native-template-typescript
```

#### 📋 **Passo 1.2: Configurar Estrutura de Testes**
```bash
# Instalar dependências de teste
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev react-native-testing-library
npm install --save-dev jest-circus
```

#### 📋 **Passo 1.3: Configurar Jest para React Native**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### **FASE 2: TESTES UNITÁRIOS MOBILE (Prioridade ALTA)**

#### 📋 **Passo 2.1: Testes de Componentes**
```typescript
// __tests__/components/LoginForm.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import LoginForm from '../src/components/LoginForm';

describe('LoginForm', () => {
  test('deve renderizar formulário de login', () => {
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginForm />
      </Provider>
    );
    
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
  });

  test('deve validar campos obrigatórios', async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <LoginForm />
      </Provider>
    );
    
    fireEvent.press(getByTestId('login-button'));
    
    await waitFor(() => {
      expect(getByText('Email é obrigatório')).toBeTruthy();
      expect(getByText('Senha é obrigatória')).toBeTruthy();
    });
  });
});
```

#### 📋 **Passo 2.2: Testes de Redux Slices**
```typescript
// __tests__/store/authSlice.test.ts
import { authSlice, login, logout } from '../src/store/slices/authSlice';

describe('authSlice', () => {
  test('deve inicializar com estado correto', () => {
    const state = authSlice.reducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });

  test('deve fazer login com sucesso', () => {
    const userData = { id: 1, email: 'test@test.com', tipo: 'MEDICO' };
    const action = login.fulfilled(userData, 'requestId', { email: 'test@test.com', senha: '123' });
    
    const state = authSlice.reducer(undefined, action);
    expect(state.user).toEqual(userData);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
  });
});
```

### **FASE 3: TESTES E2E MOBILE (Prioridade MÉDIA)**

#### 📋 **Passo 3.1: Configurar Detox para E2E**
```bash
# Instalar Detox
npm install --save-dev detox
npm install -g detox-cli

# Configurar Detox
detox init -r jest
```

#### 📋 **Passo 3.2: Configuração Detox**
```javascript
// .detoxrc.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'android.emu.debug': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      device: {
        avdName: 'Pixel_API_30',
      },
    },
    'android.emu.release': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      device: {
        avdName: 'Pixel_API_30',
      },
    },
  },
};
```

#### 📋 **Passo 3.3: Testes E2E de Fluxo Médico**
```typescript
// e2e/medicoFlow.e2e.js
describe('Fluxo Médico Completo', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('deve fazer login e acessar lista de pacientes', async () => {
    // Login
    await element(by.id('email-input')).typeText('dr.teste@mediapp.com');
    await element(by.id('password-input')).typeText('medico123');
    await element(by.id('login-button')).tap();

    // Verificar se chegou na tela principal
    await expect(element(by.text('Lista de Pacientes'))).toBeVisible();

    // Acessar lista de pacientes
    await element(by.id('patients-tab')).tap();
    
    // Verificar se lista carregou
    await expect(element(by.id('patients-list'))).toBeVisible();
  });

  test('deve buscar paciente por nome', async () => {
    await element(by.id('search-input')).typeText('Maria Silva');
    await element(by.id('search-button')).tap();
    
    await waitFor(element(by.text('Maria Silva Santos')))
      .toBeVisible()
      .withTimeout(5000);
  });

  test('deve criar nova consulta', async () => {
    // Selecionar paciente
    await element(by.text('Maria Silva Santos')).tap();
    
    // Agendar consulta
    await element(by.id('schedule-consultation')).tap();
    
    // Preencher dados
    await element(by.id('consultation-date')).tap();
    await element(by.text('15')).tap(); // Dia 15
    await element(by.id('consultation-time')).typeText('14:30');
    await element(by.id('consultation-notes')).typeText('Consulta de rotina cardiológica');
    
    // Salvar
    await element(by.id('save-consultation')).tap();
    
    // Verificar sucesso
    await expect(element(by.text('Consulta agendada com sucesso'))).toBeVisible();
  });
});
```

### **FASE 4: TESTES ESPECÍFICOS ANDROID/PLAY STORE (Prioridade ALTA)**

#### 📋 **Passo 4.1: Configurar Build de Produção**
```bash
# Configurar keystore para assinatura
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore mediapp-release-key.keystore -alias mediapp-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 📋 **Passo 4.2: Testes de Build Android**
```bash
# Script de teste de build
#!/bin/bash
# test-android-build.sh

echo "🔧 Testando build Android..."

# Limpar build anterior
cd android
./gradlew clean

# Build debug
echo "📱 Testando build debug..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    echo "✅ Build debug OK"
else
    echo "❌ Build debug falhou"
    exit 1
fi

# Build release
echo "📱 Testando build release..."
./gradlew assembleRelease
if [ $? -eq 0 ]; then
    echo "✅ Build release OK"
else
    echo "❌ Build release falhou"
    exit 1
fi

# Verificar assinatura
echo "🔐 Verificando assinatura APK..."
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk

echo "✅ Todos os testes de build passaram!"
```

#### 📋 **Passo 4.3: Testes de Permissões Android**
```typescript
// __tests__/android/permissions.test.ts
import { PermissionsAndroid, Platform } from 'react-native';

describe('Permissões Android', () => {
  test('deve solicitar permissões necessárias', async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      for (const permission of permissions) {
        const result = await PermissionsAndroid.check(permission);
        expect(typeof result).toBe('boolean');
      }
    }
  });

  test('deve ter todas as permissões declaradas no manifest', () => {
    // Teste seria executado verificando AndroidManifest.xml
    expect(true).toBe(true); // Placeholder
  });
});
```

### **FASE 5: CI/CD E AUTOMAÇÃO (Prioridade MÉDIA)**

#### 📋 **Passo 5.1: GitHub Actions para Testes Mobile**
```yaml
# .github/workflows/mobile-tests.yml
name: Mobile Tests

on:
  push:
    branches: [ master ]
    paths: [ 'mobile/**' ]
  pull_request:
    branches: [ master ]
    paths: [ 'mobile/**' ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      run: |
        cd mobile
        npm ci
    
    - name: Run unit tests
      run: |
        cd mobile
        npm test -- --coverage --watchAll=false
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: mobile/coverage

  android-build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '11'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      run: |
        cd mobile
        npm ci
    
    - name: Build Android Debug
      run: |
        cd mobile/android
        ./gradlew assembleDebug
    
    - name: Build Android Release
      run: |
        cd mobile/android
        ./gradlew assembleRelease

  e2e-tests:
    runs-on: macOS-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      run: |
        cd mobile
        npm ci
    
    - name: Setup iOS Simulator
      run: |
        xcrun simctl boot "iPhone 14" || true
    
    - name: Run E2E Tests
      run: |
        cd mobile
        detox build --configuration ios.sim.debug
        detox test --configuration ios.sim.debug
```

#### 📋 **Passo 5.2: Scripts de Automação**
```json
// mobile/package.json - scripts adicionais
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "build:android:debug": "cd android && ./gradlew assembleDebug",
    "build:android:release": "cd android && ./gradlew assembleRelease",
    "test:build": "./scripts/test-android-build.sh",
    "test:all": "npm run test && npm run test:e2e:android && npm run test:build"
  }
}
```

## 📊 **CRONOGRAMA DE IMPLEMENTAÇÃO**

### **🚀 Sprint 1 (1-2 semanas) - CRÍTICO**
- ✅ Inicializar projeto React Native completo
- ✅ Configurar estrutura de testes básica
- ✅ Implementar testes unitários de componentes principais
- ✅ Configurar Jest e Testing Library

### **🚀 Sprint 2 (1-2 semanas) - ALTA PRIORIDADE**
- ✅ Testes de Redux/Estado Global
- ✅ Testes de integração com API
- ✅ Configurar builds Android
- ✅ Implementar testes de build

### **🚀 Sprint 3 (2-3 semanas) - MÉDIA PRIORIDADE**
- ✅ Configurar Detox para E2E
- ✅ Implementar testes E2E principais
- ✅ Testes específicos Android/Play Store
- ✅ Configurar CI/CD

### **🚀 Sprint 4 (1 semana) - BAIXA PRIORIDADE**
- ✅ Refinamento e otimização
- ✅ Documentação completa
- ✅ Testes de performance
- ✅ Preparação para Play Store

## 💰 **ESTIMATIVA DE ESFORÇO**

| Fase | Esforço | Complexidade | Prioridade |
|------|---------|--------------|------------|
| **Configuração Básica** | 16-24h | Média | ALTA |
| **Testes Unitários** | 24-32h | Média | ALTA |
| **Testes E2E** | 32-40h | Alta | MÉDIA |
| **Testes Android** | 16-24h | Média | ALTA |
| **CI/CD** | 8-16h | Baixa | MÉDIA |
| **Total** | **96-136h** | **3-4 semanas** | **-** |

## 🎯 **METAS DE QUALIDADE**

### **📊 Cobertura de Testes**
- **Testes Unitários:** ≥ 80%
- **Testes Integração:** ≥ 70%
- **Testes E2E:** ≥ 60% dos fluxos críticos

### **📱 Compatibilidade Android**
- **Versões:** Android 7.0+ (API 24+)
- **Dispositivos:** Phones + Tablets
- **Performance:** Inicialização < 3s

### **🏪 Requisitos Play Store**
- **Build:** APK assinado corretamente
- **Permissões:** Apenas necessárias
- **Segurança:** Sem vulnerabilidades críticas
- **Testes:** 100% automação antes upload

## 🚧 **BLOQUEADORES IDENTIFICADOS**

### **🔧 Técnicos**
1. **Estrutura React Native incompleta** - CRÍTICO
2. **Ausência de configuração Android** - CRÍTICO
3. **Dependências mobile não instaladas** - ALTO
4. **Configuração de assinatura APK** - MÉDIO

### **🔄 Processuais**
1. **Conta Google Play Console** - CRÍTICO
2. **Certificados de assinatura** - ALTO
3. **Processo de CI/CD** - MÉDIO
4. **Documentação de testes** - BAIXO

## ✅ **PRÓXIMOS PASSOS IMEDIATOS**

1. **📱 Recriar estrutura React Native completa**
2. **🧪 Implementar testes unitários básicos**
3. **🏗️ Configurar builds Android**
4. **🔐 Configurar assinatura APK**
5. **📋 Criar pipeline de testes**

---

**📝 NOTA:** Este plano foi criado baseado na análise da estrutura atual. A implementação deve começar pela Fase 1 para estabelecer a base necessária para os testes mobile Android.