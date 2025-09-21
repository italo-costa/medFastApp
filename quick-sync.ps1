# Script PowerShell para sincronização rápida
# Uso: .\quick-sync.ps1

Write-Host "🔄 Sincronização rápida Windows -> WSL..." -ForegroundColor Cyan

# Copiar arquivos públicos
Write-Host "🌐 Sincronizando páginas web..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cp /mnt/c/workspace/aplicativo/backend/public/{app.html,cadastro-medico.html,gestao-pacientes.html,index.html} /home/italo_unix_user/aplicativo/backend/public/"

# Copiar arquivos de código se modificados
Write-Host "📁 Sincronizando código backend..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cp -r /mnt/c/workspace/aplicativo/backend/src/ /home/italo_unix_user/aplicativo/backend/"

Write-Host "✅ Sincronização concluída!" -ForegroundColor Green

# Verificar servidor
$serverRunning = wsl -d Ubuntu -- bash -c "pgrep -f 'node.*server.js' > /dev/null && echo 'running' || echo 'stopped'"
if ($serverRunning -eq "running") {
    Write-Host "🚀 Servidor está rodando em http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "⚠️  Servidor parado. Reiniciando..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-Command", "wsl -d Ubuntu -- bash -c 'cd /home/italo_unix_user/aplicativo/backend && node src/server.js'"
    Start-Sleep 2
    Write-Host "🚀 Servidor iniciado em http://localhost:3001" -ForegroundColor Green
}