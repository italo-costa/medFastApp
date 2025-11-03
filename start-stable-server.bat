@echo off
title MediApp Server Estável
echo Iniciando MediApp Server Estável...
echo.
echo 🚀 Servidor será iniciado na porta 3001
echo 🌐 Dashboard: http://localhost:3001/app.html
echo 🩺 Gestão Médicos: http://localhost:3001/gestao-medicos.html
echo.

cd /d "C:\workspace\aplicativo\backend"

echo Matando processos anteriores...
taskkill /f /im node.exe 2>nul

echo Aguardando...
timeout /t 2 /nobreak >nul

echo Iniciando servidor estável...
echo.
set PORT=3001
node real-data-server-stable.js

pause