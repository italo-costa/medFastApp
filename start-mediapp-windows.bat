@echo off
echo Iniciando MediApp Server no Windows...

cd /d "C:\workspace\aplicativo\backend"

echo Finalizando processos anteriores...
taskkill /f /im node.exe 2>nul

echo Aguardando...
timeout /t 3 /nobreak >nul

echo Iniciando servidor na porta 3001...
set PORT=3001
start "MediApp Server" cmd /k "node real-data-server.js"

timeout /t 5 /nobreak >nul

echo.
echo ✅ MediApp Server foi iniciado!
echo 📊 Porta: 3001
echo 📱 Dashboard: http://localhost:3001/app.html  
echo 🩺 Gestão Médicos: http://localhost:3001/gestao-medicos.html
echo.
echo Para parar o servidor, feche a janela do terminal que foi aberta.