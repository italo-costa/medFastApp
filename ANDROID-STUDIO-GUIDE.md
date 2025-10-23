# 📱 COMO EXECUTAR APK NO ANDROID STUDIO - GUIA COMPLETO

## 🎯 **MÉTODOS DISPONÍVEIS**

### **Método 1: Device Manager (AVD) - RECOMENDADO**
### **Método 2: ADB Command Line**
### **Método 3: Drag & Drop no Emulador**

---

## 📋 **PRÉ-REQUISITOS**

### ✅ **Verificações Necessárias**
- [x] Android SDK instalado: `C:\Users\italo\AppData\Local\Android\Sdk`
- [ ] Android Studio instalado
- [ ] AVD (Android Virtual Device) configurado
- [x] APK disponível: `MediApp-Beta-Fixed.apk`

---

## 🚀 **MÉTODO 1: DEVICE MANAGER (AVD) - PRINCIPAL**

### **Passo 1: Abrir Android Studio**
```bash
# Localizar Android Studio (locais comuns):
C:\Program Files\Android\Android Studio\bin\studio64.exe
C:\Users\%USERNAME%\AppData\Local\Android\Sdk\tools\android.exe
```

### **Passo 2: Configurar AVD Manager**
1. **Abrir Android Studio**
2. **Tools** → **AVD Manager**
3. **Create Virtual Device**
4. **Escolher dispositivo**: Pixel 7 ou similar
5. **Selecionar API Level**: 33 (Android 13) ou superior
6. **Finish** para criar o emulador

### **Passo 3: Instalar APK no Emulador**
1. **Iniciar o emulador** criado
2. **Aguardar boot completo** do Android
3. **Arrastar e soltar** o APK na tela do emulador
   ```
   Arquivo: c:\workspace\aplicativo\MediApp-Beta-Fixed.apk
   ```
4. **Confirmar instalação** quando solicitado
5. **Abrir app** na tela inicial do Android

---

## 💻 **MÉTODO 2: ADB COMMAND LINE**

### **Passo 1: Configurar ADB**
```powershell
# Adicionar ADB ao PATH
$env:PATH += ";C:\Users\italo\AppData\Local\Android\Sdk\platform-tools"

# Verificar ADB
adb version
```

### **Passo 2: Conectar ao Emulador**
```powershell
# Listar dispositivos conectados
adb devices

# Se não aparecer nada, iniciar servidor ADB
adb start-server
```

### **Passo 3: Instalar APK**
```powershell
# Navegar para pasta do APK
cd "c:\workspace\aplicativo"

# Instalar APK no emulador
adb install MediApp-Beta-Fixed.apk

# Forçar reinstalação (se já instalado)
adb install -r MediApp-Beta-Fixed.apk
```

### **Passo 4: Executar App**
```powershell
# Abrir aplicação
adb shell am start -n com.mediapp/.MainActivity

# Ou localizar na tela inicial do Android
```

---

## 🖱️ **MÉTODO 3: DRAG & DROP DIRETO**

### **Processo Simplificado**
1. **Abrir Android Studio**
2. **Iniciar qualquer emulador** existente
3. **Aguardar carregamento** completo
4. **Arrastar arquivo APK** da pasta para a tela do emulador
5. **Confirmar instalação** no popup
6. **Localizar app** "MediApp Beta" na tela inicial

---

## 🔧 **SCRIPTS DE AUTOMAÇÃO**

### **Script PowerShell: Instalar APK Automaticamente**
```powershell
# Salvar como: install-mediapp.ps1

Write-Host "=== INSTALADOR MEDIAPP APK NO ANDROID STUDIO ==="

# Configurar caminhos
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$adbPath = "$sdkPath\platform-tools\adb.exe"
$apkPath = "c:\workspace\aplicativo\MediApp-Beta-Fixed.apk"

# Verificar se ADB existe
if (Test-Path $adbPath) {
    Write-Host "✓ ADB encontrado: $adbPath"
} else {
    Write-Host "❌ ADB não encontrado. Instale Android SDK."
    exit 1
}

# Verificar se APK existe
if (Test-Path $apkPath) {
    Write-Host "✓ APK encontrado: $apkPath"
} else {
    Write-Host "❌ APK não encontrado: $apkPath"
    exit 1
}

# Verificar dispositivos conectados
Write-Host "Verificando dispositivos..."
& $adbPath devices

# Instalar APK
Write-Host "Instalando MediApp..."
& $adbPath install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MediApp instalado com sucesso!"
    Write-Host "🚀 Iniciando aplicação..."
    
    # Abrir app
    & $adbPath shell am start -n com.mediapp/.MainActivity
    
    Write-Host "📱 MediApp aberto no emulador!"
} else {
    Write-Host "❌ Falha na instalação. Verifique o emulador."
}
```

### **Script Batch: Versão Simplificada**
```batch
@echo off
echo === MEDIAPP APK INSTALLER ===

set SDK_PATH=%LOCALAPPDATA%\Android\Sdk
set ADB_PATH=%SDK_PATH%\platform-tools\adb.exe
set APK_PATH=c:\workspace\aplicativo\MediApp-Beta-Fixed.apk

echo Instalando MediApp no Android Studio...
"%ADB_PATH%" install -r "%APK_PATH%"

echo Abrindo aplicacao...
"%ADB_PATH%" shell am start -n com.mediapp/.MainActivity

echo MediApp instalado e executado!
pause
```

---

## 🐛 **SOLUÇÃO DE PROBLEMAS**

### **Problema 1: "ADB não reconhecido"**
```powershell
# Solução: Adicionar ADB ao PATH
$env:PATH += ";C:\Users\italo\AppData\Local\Android\Sdk\platform-tools"
```

### **Problema 2: "Nenhum dispositivo conectado"**
```powershell
# Solução: Iniciar emulador primeiro
# 1. Abrir Android Studio
# 2. Tools → AVD Manager
# 3. Click no ▶️ do emulador
# 4. Aguardar boot completo
```

### **Problema 3: "Instalação falhou"**
```powershell
# Solução: Desinstalar versão anterior
adb uninstall com.mediapp
adb install MediApp-Beta-Fixed.apk
```

### **Problema 4: "App não abre"**
```powershell
# Solução: Verificar logs
adb logcat | grep mediapp

# Ou reinstalar
adb install -r MediApp-Beta-Fixed.apk
```

---

## 📊 **VERIFICAÇÃO DE FUNCIONAMENTO**

### **Checklist de Teste**
- [ ] APK instalado sem erros
- [ ] Ícone "MediApp Beta" aparece na tela inicial
- [ ] App abre ao tocar no ícone
- [ ] Interface médica carrega corretamente
- [ ] Módulos respondem ao toque
- [ ] Navegação funciona
- [ ] Sem crashes ou erros

### **Comandos de Debug**
```powershell
# Ver logs em tempo real
adb logcat

# Filtrar apenas MediApp
adb logcat | findstr "mediapp"

# Ver informações do APK instalado
adb shell pm list packages | findstr mediapp

# Ver detalhes do pacote
adb shell dumpsys package com.mediapp
```

---

## 🎯 **PRÓXIMOS PASSOS**

### **Após Instalação Bem-Sucedida**
1. **Testar todas as funcionalidades** do MediApp
2. **Verificar responsividade** da interface
3. **Testar navegação** entre módulos
4. **Coletar feedback** de usabilidade
5. **Documentar bugs** encontrados

### **Para Desenvolvimento Contínuo**
1. **Configurar build automatizado** no Android Studio
2. **Integrar com projeto React Native**
3. **Configurar debugging** em tempo real
4. **Preparar para Play Store** (quando pronto)

---

## 📱 **RESUMO RÁPIDO**

### **Método Mais Simples**
1. Abrir Android Studio
2. Iniciar um emulador
3. Arrastar `MediApp-Beta-Fixed.apk` para a tela
4. Confirmar instalação
5. Abrir "MediApp Beta" na tela inicial

### **Método por Linha de Comando**
```powershell
cd "c:\workspace\aplicativo"
adb install MediApp-Beta-Fixed.apk
adb shell am start -n com.mediapp/.MainActivity
```

---

**📅 Data**: 09/10/2025  
**🎯 Status**: Guia completo para execução no Android Studio  
**📱 APK**: MediApp-Beta-Fixed.apk pronto para teste  

---

> 🏥 **MediApp Beta** agora pode ser testado no Android Studio!  
> Siga os passos acima para instalar e executar no emulador.