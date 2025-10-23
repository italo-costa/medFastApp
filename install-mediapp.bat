@echo off
title MediApp APK Installer - Android Studio
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    MEDIAPP APK INSTALLER                     ║
echo ║                  Android Studio Edition                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
set "ADB_PATH=%SDK_PATH%\platform-tools\adb.exe"
set "APK_PATH=c:\workspace\aplicativo\MediApp-Beta-Fixed.apk"

echo [1/7] Verificando ambiente Android...

if exist "%ADB_PATH%" (
    echo ✓ ADB encontrado: %ADB_PATH%
) else (
    echo ❌ ADB não encontrado!
    echo.
    echo Por favor, instale o Android Studio e configure o SDK.
    echo Locais comuns do SDK:
    echo   - %LOCALAPPDATA%\Android\Sdk
    echo   - C:\Android\Sdk
    echo.
    pause
    exit /b 1
)

echo [2/7] Verificando APK...

if exist "%APK_PATH%" (
    echo ✓ APK encontrado: %APK_PATH%
) else (
    echo ❌ APK não encontrado!
    echo Execute primeiro o script de build do APK.
    pause
    exit /b 1
)

echo [3/7] Iniciando servidor ADB...
"%ADB_PATH%" start-server >nul 2>&1
echo ✓ Servidor ADB iniciado

echo [4/7] Verificando emuladores...
"%ADB_PATH%" devices > temp_devices.txt

findstr /C:"device" temp_devices.txt | findstr /V /C:"List of devices" >nul
if errorlevel 1 (
    echo.
    echo ⚠️  NENHUM EMULADOR CONECTADO!
    echo.
    echo Para continuar, siga estes passos:
    echo.
    echo 1️⃣  Abra o Android Studio
    echo 2️⃣  Vá em Tools ^> AVD Manager
    echo 3️⃣  Clique no botão ▶️ de um emulador
    echo 4️⃣  Aguarde o boot completo do Android
    echo 5️⃣  Execute este script novamente
    echo.
    echo 💡 Dica: Se não tem emulador criado:
    echo    - Clique em "Create Virtual Device"
    echo    - Escolha um Pixel 7 ou similar
    echo    - Selecione API 33 ^(Android 13^)
    echo    - Finalize a criação
    echo.
    del temp_devices.txt
    pause
    exit /b 1
) else (
    echo ✓ Emulador conectado!
    type temp_devices.txt
    del temp_devices.txt
)

echo [5/7] Removendo instalação anterior...
"%ADB_PATH%" uninstall com.mediapp >nul 2>&1
echo ✓ Limpeza concluída

echo [6/7] Instalando MediApp APK...
"%ADB_PATH%" install "%APK_PATH%"

if errorlevel 1 (
    echo.
    echo ❌ Falha na instalação!
    echo.
    echo Soluções possíveis:
    echo 1. Certifique-se que o emulador terminou de carregar
    echo 2. Tente arrastar o APK na tela do emulador
    echo 3. Verifique espaço disponível no dispositivo virtual
    echo.
    pause
    exit /b 1
) else (
    echo ✅ MediApp instalado com sucesso!
)

echo [7/7] Iniciando aplicação...
timeout /t 2 /nobreak >nul

"%ADB_PATH%" shell am start -n com.mediapp/.MainActivity >nul 2>&1

if errorlevel 1 (
    echo ⚠️  App instalado, mas falha ao abrir automaticamente
    echo 📱 Procure "MediApp Beta" na tela inicial do Android
) else (
    echo 🚀 MediApp iniciado no emulador!
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ✅ INSTALAÇÃO CONCLUÍDA!                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📱 Aplicação: MediApp Beta
echo 📦 APK: MediApp-Beta-Fixed.apk  
echo 🎯 Status: Instalado e executando
echo.
echo 🔧 Para reinstalar: Execute este script novamente
echo 🐛 Para debug: adb logcat ^| findstr mediapp
echo.

rem Mostrar informações do pacote
echo 📊 Verificando instalação:
"%ADB_PATH%" shell pm list packages | findstr mediapp

echo.
echo 🎉 MediApp Beta está rodando no Android Studio!
echo.
pause