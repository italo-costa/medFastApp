Write-Host "=== INSTALADOR MEDIAPP APK NO ANDROID STUDIO ==="
Write-Host ""

# Configurar caminhos
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$adbPath = "$sdkPath\platform-tools\adb.exe"
$apkPath = "c:\workspace\aplicativo\MediApp-Beta-Fixed.apk"

Write-Host "[1/6] Verificando ambiente..."

# Verificar se ADB existe
if (Test-Path $adbPath) {
    Write-Host "✓ ADB encontrado: $adbPath"
} else {
    Write-Host "❌ ADB não encontrado. Verificando caminhos alternativos..."
    
    # Tentar outros locais comuns
    $altPaths = @(
        "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools\adb.exe",
        "C:\Android\Sdk\platform-tools\adb.exe",
        "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe"
    )
    
    foreach ($path in $altPaths) {
        if (Test-Path $path) {
            $adbPath = $path
            Write-Host "✓ ADB encontrado em: $adbPath"
            break
        }
    }
    
    if (-not (Test-Path $adbPath)) {
        Write-Host "❌ ADB não encontrado. Por favor:"
        Write-Host "   1. Instale Android Studio"
        Write-Host "   2. Configure Android SDK"
        Write-Host "   3. Execute este script novamente"
        exit 1
    }
}

Write-Host "[2/6] Verificando APK..."

# Verificar se APK existe
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length
    Write-Host "✓ APK encontrado: $apkPath ($apkSize bytes)"
} else {
    Write-Host "❌ APK não encontrado: $apkPath"
    Write-Host "Execute o script de build primeiro!"
    exit 1
}

Write-Host "[3/6] Verificando dispositivos Android..."

# Iniciar servidor ADB se necessário
& $adbPath start-server | Out-Null

# Verificar dispositivos conectados
$devices = & $adbPath devices
Write-Host "Dispositivos conectados:"
Write-Host $devices

$deviceList = & $adbPath devices | Select-String "device$" | Measure-Object
if ($deviceList.Count -eq 0) {
    Write-Host ""
    Write-Host "⚠️  NENHUM DISPOSITIVO CONECTADO!"
    Write-Host ""
    Write-Host "Para continuar, você precisa:"
    Write-Host "1. Abrir Android Studio"
    Write-Host "2. Tools → AVD Manager"
    Write-Host "3. Iniciar um emulador (clique no ▶️)"
    Write-Host "4. Aguardar boot completo do Android"
    Write-Host "5. Executar este script novamente"
    Write-Host ""
    Read-Host "Pressione Enter após iniciar o emulador..."
    
    # Verificar novamente
    $devices = & $adbPath devices
    $deviceList = & $adbPath devices | Select-String "device$" | Measure-Object
    if ($deviceList.Count -eq 0) {
        Write-Host "❌ Ainda não há dispositivos conectados."
        exit 1
    }
}

Write-Host "[4/6] Desinstalando versão anterior (se existir)..."
& $adbPath uninstall com.mediapp 2>$null
Write-Host "✓ Limpeza concluída"

Write-Host "[5/6] Instalando MediApp APK..."
$installResult = & $adbPath install $apkPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MediApp instalado com sucesso!"
} else {
    Write-Host "❌ Falha na instalação:"
    Write-Host $installResult
    Write-Host ""
    Write-Host "Tentativas de solução:"
    Write-Host "1. Certifique-se que o emulador está totalmente carregado"
    Write-Host "2. Tente arrastar o APK diretamente na tela do emulador"
    Write-Host "3. Verifique se há espaço suficiente no dispositivo virtual"
    exit 1
}

Write-Host "[6/6] Iniciando aplicação..."

# Aguardar um pouco para instalação finalizar
Start-Sleep -Seconds 2

# Abrir app
$startResult = & $adbPath shell am start -n com.mediapp/.MainActivity 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "🚀 MediApp iniciado no emulador!"
} else {
    Write-Host "⚠️  App instalado, mas falha ao abrir automaticamente."
    Write-Host "📱 Procure por 'MediApp Beta' na tela inicial do Android"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ INSTALAÇÃO CONCLUÍDA!"
Write-Host "=========================================="
Write-Host ""
Write-Host "📱 App: MediApp Beta"
Write-Host "📦 APK: MediApp-Beta-Fixed.apk"
Write-Host "🎯 Status: Instalado e pronto para uso"
Write-Host ""
Write-Host "🔧 Para reinstalar:"
Write-Host "Execute este script novamente"
Write-Host ""
Write-Host "🐛 Para debug:"
Write-Host "adb logcat | findstr mediapp"
Write-Host ""

# Mostrar informações do pacote instalado
Write-Host "📊 Informações do pacote instalado:"
& $adbPath shell pm list packages | Select-String "mediapp"

Write-Host ""
Write-Host "🎉 MediApp Beta está rodando no Android Studio!"