# 📱 GUIA RÁPIDO: EXECUTAR APK NO ANDROID STUDIO

## 🚀 **PASSO-A-PASSO SIMPLIFICADO**

### **1. Preparar Android Studio**
- Abra o **Android Studio**
- Vá em **Tools** → **AVD Manager**
- Se não tiver emulador, clique **"Create Virtual Device"**
- Escolha **Pixel 7** ou similar
- Selecione **API 33** (Android 13)
- Clique **Finish**

### **2. Iniciar Emulador**
- No AVD Manager, clique no botão **▶️** do emulador
- **Aguarde** o boot completo do Android (pode demorar alguns minutos)
- Quando aparecer a tela inicial do Android, está pronto

### **3. Instalar APK (Método Mais Fácil)**
**Arrastar e Soltar:**
1. Localize o arquivo: `c:\workspace\aplicativo\MediApp-Beta-Fixed.apk`
2. **Arraste** o arquivo APK
3. **Solte** na tela do emulador Android
4. Confirme a instalação quando aparecer o popup
5. Procure "MediApp Beta" na tela inicial

### **4. Alternativa: Linha de Comando**
```powershell
# Executar no PowerShell/Terminal
cd "c:\workspace\aplicativo"
adb install MediApp-Beta-Fixed.apk
```

---

## ⚡ **COMANDOS ÚTEIS**

### **Verificar se emulador está conectado:**
```bash
adb devices
```

### **Instalar APK:**
```bash
adb install MediApp-Beta-Fixed.apk
```

### **Reinstalar APK:**
```bash
adb install -r MediApp-Beta-Fixed.apk
```

### **Abrir app:**
```bash
adb shell am start -n com.mediapp/.MainActivity
```

### **Ver logs do app:**
```bash
adb logcat | findstr mediapp
```

---

## 🔧 **SCRIPTS PRONTOS**

### **Instalador Automático**
Execute: `install-mediapp.bat` (já criado na pasta)

### **Verificação Rápida**
```powershell
# Verificar se tudo está OK
adb devices
adb shell pm list packages | findstr mediapp
```

---

## 📊 **RESULTADOS ESPERADOS**

Após instalação bem-sucedida, você verá:
- ✅ **Ícone "MediApp Beta"** na tela inicial
- ✅ **Interface médica** carregando
- ✅ **6 módulos funcionais** (Prontuários, Consultas, etc.)
- ✅ **Navegação responsiva**

---

## 🎯 **RESUMO**

**Para executar rapidamente:**
1. Abrir Android Studio
2. Iniciar emulador
3. Arrastar APK para tela
4. Testar funcionalidades

**APK pronto:** `MediApp-Beta-Fixed.apk` (5.196 bytes)