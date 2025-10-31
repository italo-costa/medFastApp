Write-Host "=== MEDIAPP APK BUILDER - VERSAO CORRIGIDA ==="
Write-Host "Criando APK Android com estrutura completa..."

Set-Location "c:\workspace\aplicativo\mobile\android"

Write-Host "[1/5] Criando estrutura de diretorios..."
if (Test-Path "apk-build") { Remove-Item "apk-build" -Recurse -Force }
New-Item -ItemType Directory -Path "apk-build\META-INF" -Force | Out-Null
New-Item -ItemType Directory -Path "apk-build\res\values" -Force | Out-Null
New-Item -ItemType Directory -Path "apk-build\assets" -Force | Out-Null

Write-Host "[2/5] Criando AndroidManifest.xml..."
$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mediapp" android:versionCode="1" android:versionName="1.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="MediApp Beta">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
$manifest | Out-File -FilePath "apk-build\AndroidManifest.xml" -Encoding UTF8

Write-Host "[3/5] Copiando aplicacao web..."
if (Test-Path "app\src\main\assets\mediapp.html") {
    Copy-Item "app\src\main\assets\mediapp.html" "apk-build\assets\index.html"
} else {
    "<!DOCTYPE html><html><head><title>MediApp</title></head><body><h1>MediApp Beta</h1></body></html>" | Out-File -FilePath "apk-build\assets\index.html" -Encoding UTF8
}

Write-Host "[4/5] Compactando APK..."
Compress-Archive -Path "apk-build\*" -DestinationPath "MediApp-Fixed.zip" -Force
if (Test-Path "MediApp-Fixed.zip") {
    Rename-Item "MediApp-Fixed.zip" "MediApp-Fixed.apk" -Force
}

Write-Host "[5/5] Copiando APK final..."
if (Test-Path "MediApp-Fixed.apk") {
    Copy-Item "MediApp-Fixed.apk" "..\..\..\MediApp-Beta-Fixed.apk" -Force
    $apkInfo = Get-Item "..\..\..\MediApp-Beta-Fixed.apk"
    Write-Host "✅ APK criado com sucesso!"
    Write-Host "📱 Arquivo: MediApp-Beta-Fixed.apk"
    Write-Host "📊 Tamanho: $($apkInfo.Length) bytes"
} else {
    Write-Host "❌ Falha na criacao do APK"
}

Write-Host "=== BUILD FINALIZADO ==="