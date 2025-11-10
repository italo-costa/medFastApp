@echo off
REM 🚀 MediApp - Script de Preparação para Commit GitHub (Windows)

echo 🏥 MediApp - Preparando arquivos para GitHub...

set SOURCE_DIR=c:\workspace\aplicativo\apps
set TARGET_DIR=c:\workspace\aplicativo\github-deploy
set BACKEND_TARGET=%TARGET_DIR%\mediapp-backend
set FRONTEND_TARGET=%TARGET_DIR%\mediapp-frontend

REM Limpar diretórios anteriores
echo 🧹 Limpando arquivos anteriores...
if exist "%BACKEND_TARGET%" rmdir /s /q "%BACKEND_TARGET%"
if exist "%FRONTEND_TARGET%" rmdir /s /q "%FRONTEND_TARGET%"

REM Criar estrutura de diretórios
mkdir "%BACKEND_TARGET%"
mkdir "%FRONTEND_TARGET%"

echo 📦 Copiando arquivos do Backend...
REM Copiar backend
xcopy "%SOURCE_DIR%\backend\src" "%BACKEND_TARGET%\src" /e /i /y
xcopy "%SOURCE_DIR%\backend\prisma" "%BACKEND_TARGET%\prisma" /e /i /y
xcopy "%SOURCE_DIR%\backend\public" "%BACKEND_TARGET%\public" /e /i /y
copy "%SOURCE_DIR%\backend\package.json" "%BACKEND_TARGET%\" /y

echo 🌐 Preparando arquivos do Frontend...
REM Copiar frontend
mkdir "%FRONTEND_TARGET%\public"
mkdir "%FRONTEND_TARGET%\assets"
xcopy "%SOURCE_DIR%\backend\public\assets" "%FRONTEND_TARGET%\assets" /e /i /y
copy "%SOURCE_DIR%\backend\public\index.html" "%FRONTEND_TARGET%\public\" /y
copy "%SOURCE_DIR%\backend\public\app.html" "%FRONTEND_TARGET%\public\" /y
copy "%SOURCE_DIR%\backend\public\gestao-medicos.html" "%FRONTEND_TARGET%\public\" /y
copy "%SOURCE_DIR%\backend\public\gestao-pacientes.html" "%FRONTEND_TARGET%\public\" /y

echo 🧹 Limpando arquivos temporários...
del /s /q "%TARGET_DIR%\*.log" 2>nul
del /s /q "%TARGET_DIR%\*.tmp" 2>nul

echo.
echo ✅ Preparação concluída!
echo 📁 Arquivos organizados em: %TARGET_DIR%
echo 🔄 Próximos passos:
echo    1. Revisar arquivos em %TARGET_DIR%
echo    2. Testar funcionalidades
echo    3. Fazer commit
echo    4. Fazer push para GitHub
echo.
pause