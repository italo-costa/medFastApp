# MediApp Daemon PowerShell v3.0.0
# Script para manter o servidor MediApp rodando de forma persistente

param(
    [string]$Action = "start"
)

$ServerPath = "C:\workspace\aplicativo\apps\backend\src"
$ServerFile = "server-linux-stable.js"
$PidFile = "C:\workspace\aplicativo\mediapp.pid"
$LogFile = "C:\workspace\aplicativo\mediapp-daemon.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-ServerRunning {
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            return $true
        } else {
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    return $false
}

function Start-MediAppServer {
    if (Test-ServerRunning) {
        Write-Log "✅ Servidor já está rodando"
        return
    }
    
    Write-Log "🚀 Iniciando MediApp Server..."
    
    try {
        # Iniciar via WSL em background
        $process = Start-Process -FilePath "wsl" -ArgumentList @(
            "-e", "bash", "-c", 
            "cd /mnt/c/workspace/aplicativo/apps/backend/src && exec node server-linux-stable.js"
        ) -PassThru -WindowStyle Hidden
        
        # Salvar PID
        $process.Id | Out-File -FilePath $PidFile -Encoding utf8
        
        Start-Sleep 3
        
        if (Test-ServerRunning) {
            Write-Log "✅ Servidor iniciado com sucesso (PID: $($process.Id))"
            Write-Log "🌐 Acesse: http://localhost:3002"
            return $true
        } else {
            Write-Log "❌ Falha ao iniciar servidor"
            return $false
        }
    } catch {
        Write-Log "❌ Erro ao iniciar servidor: $($_.Exception.Message)"
        return $false
    }
}

function Stop-MediAppServer {
    if (Test-ServerRunning) {
        $processId = Get-Content $PidFile
        Write-Log "🛑 Parando servidor (PID: $processId)..."
        
        try {
            Stop-Process -Id $processId -Force
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            Write-Log "✅ Servidor parado"
        } catch {
            Write-Log "❌ Erro ao parar servidor: $($_.Exception.Message)"
        }
    } else {
        Write-Log "⚠️ Servidor não está rodando"
    }
}

function Test-ServerStatus {
    if (Test-ServerRunning) {
        $processId = Get-Content $PidFile
        Write-Log "✅ Servidor rodando (PID: $processId)"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
            Write-Log "✅ Servidor respondendo corretamente"
        } catch {
            Write-Log "⚠️ Servidor não está respondendo"
        }
    } else {
        Write-Log "❌ Servidor não está rodando"
    }
}

function Start-DaemonMode {
    Write-Log "🔄 Iniciando modo daemon..."
    
    while ($true) {
        if (-not (Test-ServerRunning)) {
            Write-Log "⚠️ Servidor não está rodando, reiniciando..."
            Start-MediAppServer
        }
        
        Start-Sleep 30
    }
}

# Menu principal
switch ($Action.ToLower()) {
    "start" { Start-MediAppServer }
    "stop" { Stop-MediAppServer }
    "restart" { 
        Stop-MediAppServer
        Start-Sleep 2
        Start-MediAppServer
    }
    "status" { Test-ServerStatus }
    "daemon" { Start-DaemonMode }
    default {
        Write-Host "Uso: mediapp-daemon.ps1 [-Action] {start|stop|restart|status|daemon}"
        Write-Host ""
        Write-Host "Comandos:"
        Write-Host "  start   - Iniciar servidor"
        Write-Host "  stop    - Parar servidor"
        Write-Host "  restart - Reiniciar servidor"
        Write-Host "  status  - Verificar status"
        Write-Host "  daemon  - Modo daemon (auto-restart)"
    }
}