@echo off
setlocal enabledelayedexpansion

REM ========================================
REM MediApp v3.0.0 - Instalador Windows
REM Instalação automática para Windows
REM ========================================

cls
echo ==========================================
echo 🏥 MediApp v3.0.0 - Instalador Windows
echo ==========================================
echo Sistema de Gestão Médica Completo
echo Configurado para ambiente Linux virtualizado
echo ==========================================
echo.

REM Função de logging
set "LOG_FILE=%TEMP%\mediapp-install.log"
echo. > "%LOG_FILE%"

:log
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> "%LOG_FILE%"
goto :eof

call :log "Iniciando instalação MediApp v3.0.0"

REM Verificar pré-requisitos
call :log "Verificando pré-requisitos..."

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale Node.js v18+ de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :log "Node.js encontrado: %NODE_VERSION%"

REM Verificar npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
call :log "npm encontrado: v%NPM_VERSION%"

REM Verificar WSL (opcional)
where wsl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log "WSL encontrado - ambiente Linux virtualizado disponível"
    set "WSL_AVAILABLE=true"
) else (
    call :log "WSL não encontrado - usando ambiente Windows nativo"
    set "WSL_AVAILABLE=false"
)

call :log "✅ Pré-requisitos verificados"

REM Criar diretório de instalação
set "INSTALL_DIR=%USERPROFILE%\MediApp"
call :log "Criando diretório de instalação: %INSTALL_DIR%"

if exist "%INSTALL_DIR%" (
    call :log "Diretório já existe. Fazendo backup..."
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATE=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
    set TIME=!TIME: =0!
    ren "%INSTALL_DIR%" "MediApp.backup.!DATE!_!TIME!"
)

mkdir "%INSTALL_DIR%" 2>nul
cd /d "%INSTALL_DIR%"
call :log "✅ Diretório criado: %INSTALL_DIR%"

REM Criar estrutura de diretórios
call :log "Criando estrutura da aplicação..."
mkdir apps\backend\src 2>nul
mkdir apps\backend\public 2>nul
mkdir apps\mobile\src\config 2>nul
mkdir apps\mobile\src\services 2>nul
mkdir apps\mobile\src\hooks 2>nul
mkdir data 2>nul
mkdir logs 2>nul

REM Criar package.json
call :log "Criando package.json..."
(
echo {
echo   "name": "mediapp-windows",
echo   "version": "3.0.0",
echo   "description": "MediApp - Sistema de Gestão Médica para Windows",
echo   "main": "apps/backend/src/server.js",
echo   "scripts": {
echo     "start": "node apps/backend/src/server.js",
echo     "dev": "nodemon apps/backend/src/server.js",
echo     "install-deps": "npm install express cors",
echo     "test": "curl -s http://localhost:3002/health ^|^| powershell -Command \"Invoke-WebRequest -Uri http://localhost:3002/health\""
echo   },
echo   "dependencies": {
echo     "express": "^4.21.2",
echo     "cors": "^2.8.5"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0"
echo   },
echo   "author": "MediApp Team",
echo   "license": "MIT"
echo }
) > package.json

REM Instalar dependências
call :log "Instalando dependências..."
npm install
if %ERRORLEVEL% NEQ 0 (
    call :log "❌ Erro ao instalar dependências"
    pause
    exit /b 1
)
call :log "✅ Dependências instaladas"

REM Criar script de start
call :log "Criando scripts de execução..."
(
echo @echo off
echo echo 🏥 Iniciando MediApp v3.0.0...
echo.
echo REM Verificar Node.js
echo where node ^>nul 2^>^&1
echo if %%ERRORLEVEL%% NEQ 0 ^(
echo     echo ❌ Node.js não encontrado!
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Ir para diretório da aplicação
echo cd /d "%%~dp0"
echo.
echo REM Verificar WSL
echo if "%WSL_AVAILABLE%"=="true" ^(
echo     echo 🐧 Usando ambiente Linux virtualizado ^(WSL^)...
echo     wsl -e bash -c "cd /mnt/c/Users/%USERNAME%/MediApp/apps/backend/src ^&^& node server.js"
echo ^) else ^(
echo     echo 🪟 Usando ambiente Windows nativo...
echo     node apps\backend\src\server.js
echo ^)
echo.
echo pause
) > start.bat

REM Criar arquivo de configuração
call :log "Criando arquivo de configuração..."
(
echo # MediApp v3.0.0 - Configurações Windows
echo PORT=3002
echo HOST=0.0.0.0
echo NODE_ENV=development
echo.
echo # Configurações específicas para Windows
echo WINDOWS_ENV=true
echo WSL_AVAILABLE=%WSL_AVAILABLE%
echo CORS_ORIGIN=*
echo ENABLE_LOGGING=true
) > .env

REM Criar README
call :log "Criando documentação..."
(
echo # 🏥 MediApp v3.0.0 - Windows
echo.
echo Sistema de Gestão Médica configurado para Windows.
echo Suporte automático para WSL quando disponível.
echo.
echo ## 🚀 Como Executar
echo.
echo ### Windows:
echo ```cmd
echo start.bat
echo ```
echo.
echo ### PowerShell:
echo ```powershell
echo npm start
echo ```
echo.
echo ## 🌐 URLs de Acesso
echo.
echo Após iniciar o servidor, acesse:
echo.
echo - **Dashboard**: http://localhost:3002/
echo - **Health Check**: http://localhost:3002/health
echo - **API Médicos**: http://localhost:3002/api/medicos
echo - **API Pacientes**: http://localhost:3002/api/pacientes
echo.
echo ## 📋 Pré-requisitos
echo.
echo - Node.js v18+
echo - npm v8+
echo - WSL ^(opcional, para melhor performance^)
echo.
echo ## 🔧 Comandos Úteis
echo.
echo - **Iniciar**: `start.bat` ou `npm start`
echo - **Desenvolvimento**: `npm run dev`
echo - **Testar**: `npm test`
echo.
echo ## 📞 Suporte
echo.
echo Para suporte técnico, consulte a documentação completa.
echo.
echo ### 📁 Localização da Instalação
echo %INSTALL_DIR%
) > README.md

REM Criar atalho na área de trabalho
call :log "Criando atalho na área de trabalho..."
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\MediApp v3.0.0.lnk"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = 'shell32.dll,23'; $Shortcut.Description = 'MediApp v3.0.0 - Sistema de Gestão Médica'; $Shortcut.Save()"

REM Verificar instalação
call :log "Verificando instalação..."
if exist "package.json" (
    if exist "start.bat" (
        if exist ".env" (
            call :log "✅ Instalação verificada com sucesso"
        ) else (
            call :log "❌ Arquivo .env não encontrado"
            exit /b 1
        )
    ) else (
        call :log "❌ Script start.bat não encontrado"
        exit /b 1
    )
) else (
    call :log "❌ package.json não encontrado"
    exit /b 1
)

REM Finalizar
cls
echo.
echo ==========================================
echo 🎉 Instalação Concluída com Sucesso!
echo ==========================================
echo.
echo 📁 Diretório de instalação: %INSTALL_DIR%
echo.
echo 🚀 Para iniciar o MediApp:
echo    Duplo clique no atalho da área de trabalho
echo    OU execute: start.bat
echo.
echo 🌐 URLs após inicialização:
echo    Dashboard: http://localhost:3002/
echo    Health:    http://localhost:3002/health
echo.
echo 📚 Documentação: README.md
echo ⚙️ Configuração: .env
echo 📋 Log de instalação: %LOG_FILE%
echo.
if "%WSL_AVAILABLE%"=="true" (
    echo 🐧 WSL detectado - ambiente Linux virtualizado disponível
) else (
    echo 🪟 Usando ambiente Windows nativo
)
echo.
echo ==========================================
echo 🏥 MediApp v3.0.0 pronto para uso!
echo ==========================================
echo.
echo Pressione qualquer tecla para abrir o diretório de instalação...
pause >nul
explorer "%INSTALL_DIR%"

call :log "Instalação finalizada com sucesso"
exit /b 0