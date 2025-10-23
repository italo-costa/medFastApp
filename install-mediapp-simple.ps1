Write-Host "=== MEDIAPP APK INSTALLER ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se APK existe
$apkPath = "MediApp-Beta-Fixed.apk"
if (Test-Path $apkPath) {
    $size = (Get-Item $apkPath).Length
    Write-Host "✓ APK encontrado: $apkPath ($size bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ APK não encontrado: $apkPath" -ForegroundColor Red
    exit 1
}

# Verificar dispositivos
Write-Host "Verificando dispositivos Android..." -ForegroundColor Yellow
$devices = adb devices 2>&1
Write-Host $devices

# Contar dispositivos conectados
$deviceCount = ($devices | Select-String "device$" | Measure-Object).Count

if ($deviceCount -eq 0) {
    Write-Host ""
    Write-Host "⚠️ NENHUM EMULADOR CONECTADO!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para continuar:" -ForegroundColor White
    Write-Host "1. Abra Android Studio" -ForegroundColor Cyan
    Write-Host "2. Tools → AVD Manager" -ForegroundColor Cyan  
    Write-Host "3. Clique no ▶️ de um emulador" -ForegroundColor Cyan
    Write-Host "4. Aguarde boot completo" -ForegroundColor Cyan
    Write-Host "5. Execute este script novamente" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Pressione Enter após iniciar emulador"
    
    # Verificar novamente
    $devices = adb devices 2>&1
    $deviceCount = ($devices | Select-String "device$" | Measure-Object).Count
    
    if ($deviceCount -eq 0) {
        Write-Host "❌ Ainda sem emulador. Tente arrastar o APK na tela." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Emulador conectado!" -ForegroundColor Green

# Desinstalar versão anterior
Write-Host "Removendo instalação anterior..." -ForegroundColor Yellow
adb uninstall com.mediapp 2>$null

# Instalar APK
Write-Host "Instalando MediApp..." -ForegroundColor Yellow
$result = adb install $apkPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ INSTALAÇÃO CONCLUÍDA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 App: MediApp Beta" -ForegroundColor Cyan
    Write-Host "📦 APK: $apkPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Tentar abrir app
    Write-Host "Iniciando aplicação..." -ForegroundColor Yellow
    adb shell am start -n com.mediapp/.MainActivity 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🚀 MediApp aberto no emulador!" -ForegroundColor Green
    } else {
        Write-Host "📱 Procure 'MediApp Beta' na tela inicial" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "❌ Falha na instalação:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tente arrastar o APK diretamente na tela do emulador" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Processo finalizado!" -ForegroundColor Green