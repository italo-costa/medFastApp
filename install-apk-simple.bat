@echo off
cls
echo.
echo ====================================================
echo           MEDIAPP - INSTALADOR ANDROID APK
echo ====================================================
echo.

echo Verificando ambiente...
set "ADB=adb"
set "APK=MediApp-Beta-Fixed.apk"

if not exist "%APK%" (
    echo ERRO: APK nao encontrado: %APK%
    echo.
    echo Certifique-se que o arquivo esta na pasta:
    echo %CD%\%APK%
    pause
    exit /b 1
)

echo OK: APK encontrado (%APK%)
echo.

echo Verificando conexao com Android...
%ADB% devices > devices.tmp
findstr "device$" devices.tmp > connected.tmp

if not exist connected.tmp (
    echo.
    echo ATENCAO: Nenhum dispositivo Android conectado!
    echo.
    echo Para continuar:
    echo 1. Abra Android Studio
    echo 2. Va em Tools ^> AVD Manager  
    echo 3. Inicie um emulador (clique no botao play)
    echo 4. Aguarde o boot completo
    echo 5. Execute este script novamente
    echo.
    del devices.tmp 2>nul
    pause
    exit /b 1
)

echo OK: Dispositivo Android conectado
type connected.tmp
del devices.tmp connected.tmp 2>nul
echo.

echo Instalando MediApp APK...
%ADB% install -r "%APK%"

if errorlevel 1 (
    echo.
    echo ERRO na instalacao!
    echo.
    echo Solucoes:
    echo 1. Tente arrastar o APK diretamente na tela do emulador
    echo 2. Verifique se o emulador terminou de carregar
    echo 3. Execute: adb install -r %APK%
    pause
    exit /b 1
)

echo.
echo ====================================================
echo           INSTALACAO CONCLUIDA COM SUCESSO!
echo ====================================================
echo.
echo APK: %APK%
echo Status: Instalado no Android
echo.
echo Para abrir o app:
echo - Procure "MediApp Beta" na tela inicial do Android
echo - Ou execute: adb shell am start -n com.mediapp/.MainActivity
echo.

echo Iniciando aplicacao...
%ADB% shell am start -n com.mediapp/.MainActivity

echo.
echo MediApp Beta esta rodando no Android!
echo.
pause