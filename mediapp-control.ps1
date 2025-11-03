# 🏥 MediApp v2.0 - Monitoramento e Controle da Aplicação
# Script PowerShell para manter a aplicação rodando

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "status", "restart", "monitor", "logs")]
    [string]$Action = "status"
)

# Configurações globais
$Global:MediAppConfig = @{
    ServerUrl = "http://localhost:3002"
    HealthEndpoint = "/health"
    BackendPath = "C:\workspace\aplicativo\apps\backend"
    JobName = "MediApp-Server"
    MonitorInterval = 30  # segundos
}

function Write-MediAppLog {
    param(
        [string]$Message,
        [ValidateSet("Info", "Warning", "Error", "Success")]
        [string]$Level = "Info"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "Info" { "Cyan" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        "Success" { "Green" }
    }
    
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Test-MediAppHealth {
    try {
        $response = Invoke-WebRequest -Uri "$($Global:MediAppConfig.ServerUrl)$($Global:MediAppConfig.HealthEndpoint)" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Get-MediAppJob {
    return Get-Job -Name $Global:MediAppConfig.JobName -ErrorAction SilentlyContinue
}

function Start-MediAppServer {
    Write-MediAppLog "🚀 Iniciando servidor MediApp..." "Info"
    
    # Verificar se já está rodando
    $existingJob = Get-MediAppJob
    if ($existingJob -and $existingJob.State -eq "Running") {
        Write-MediAppLog "⚠️ Servidor já está rodando!" "Warning"
        return $true
    }
    
    # Parar job anterior se existir
    if ($existingJob) {
        Stop-Job -Job $existingJob -Force
        Remove-Job -Job $existingJob -Force
        Write-MediAppLog "🛑 Job anterior removido" "Info"
    }
    
    try {
        # Iniciar novo job
        $job = Start-Job -Name $Global:MediAppConfig.JobName -ScriptBlock {
            param($BackendPath)
            Set-Location $BackendPath
            wsl bash -c "cd /mnt/c/workspace/aplicativo/apps/backend; node src/app.js"
        } -ArgumentList $Global:MediAppConfig.BackendPath
        
        Write-MediAppLog "📋 Job iniciado com ID: $($job.Id)" "Success"
        
        # Aguardar inicialização
        Write-MediAppLog "⏳ Aguardando servidor inicializar..." "Info"
        Start-Sleep -Seconds 8
        
        # Verificar se está funcionando
        $retries = 5
        for ($i = 1; $i -le $retries; $i++) {
            if (Test-MediAppHealth) {
                Write-MediAppLog "✅ Servidor iniciado com sucesso!" "Success"
                Show-MediAppStatus
                return $true
            }
            Write-MediAppLog "⏳ Tentativa $i/$retries - aguardando..." "Info"
            Start-Sleep -Seconds 3
        }
        
        Write-MediAppLog "❌ Servidor não respondeu após $retries tentativas" "Error"
        return $false
    }
    catch {
        Write-MediAppLog "❌ Erro ao iniciar servidor: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Stop-MediAppServer {
    Write-MediAppLog "🛑 Parando servidor MediApp..." "Info"
    
    $job = Get-MediAppJob
    if ($job) {
        Stop-Job -Job $job -Force
        Remove-Job -Job $job -Force
        Write-MediAppLog "✅ Servidor parado com sucesso!" "Success"
    } else {
        Write-MediAppLog "⚠️ Nenhum job ativo encontrado" "Warning"
    }
}

function Show-MediAppStatus {
    Write-MediAppLog "📊 Status da aplicação MediApp v2.0:" "Info"
    
    $job = Get-MediAppJob
    if ($job) {
        Write-Host "   📋 Job Status: $($job.State)" -ForegroundColor Cyan
        Write-Host "   🕐 Job Started: $($job.PSBeginTime)" -ForegroundColor Cyan
    } else {
        Write-Host "   📋 Job Status: Não encontrado" -ForegroundColor Red
    }
    
    if (Test-MediAppHealth) {
        Write-Host "   🌐 Servidor: Online ✅" -ForegroundColor Green
        Write-Host ""
        Write-Host "   🔗 URLs disponíveis:" -ForegroundColor Yellow
        Write-Host "      Health Check: $($Global:MediAppConfig.ServerUrl)/health" -ForegroundColor Gray
        Write-Host "      Gestão Médicos: $($Global:MediAppConfig.ServerUrl)/gestao-medicos.html" -ForegroundColor Gray
        Write-Host "      Gestão Pacientes: $($Global:MediAppConfig.ServerUrl)/gestao-pacientes.html" -ForegroundColor Gray
        Write-Host "      Dashboard: $($Global:MediAppConfig.ServerUrl)/api/statistics/dashboard" -ForegroundColor Gray
        Write-Host "      API Médicos: $($Global:MediAppConfig.ServerUrl)/api/medicos" -ForegroundColor Gray
        Write-Host "      API Pacientes: $($Global:MediAppConfig.ServerUrl)/api/pacientes" -ForegroundColor Gray
    } else {
        Write-Host "   🌐 Servidor: Offline ❌" -ForegroundColor Red
    }
}

function Show-MediAppLogs {
    $job = Get-MediAppJob
    if ($job) {
        Write-MediAppLog "📋 Últimos logs do servidor:" "Info"
        Write-Host "=================================" -ForegroundColor Gray
        Receive-Job -Job $job -Keep | Select-Object -Last 50
    } else {
        Write-MediAppLog "❌ Nenhum job ativo encontrado para mostrar logs" "Error"
    }
}

function Start-MediAppMonitoring {
    Write-MediAppLog "👁️ Iniciando monitoramento contínuo..." "Info"
    Write-MediAppLog "💡 Pressione Ctrl+C para parar o monitoramento" "Info"
    Write-Host ""
    
    try {
        while ($true) {
            $job = Get-MediAppJob
            $isHealthy = Test-MediAppHealth
            
            if (-not $job -or $job.State -ne "Running" -or -not $isHealthy) {
                Write-MediAppLog "⚠️ Problema detectado! Reiniciando servidor..." "Warning"
                
                Stop-MediAppServer
                Start-Sleep -Seconds 3
                
                if (Start-MediAppServer) {
                    Write-MediAppLog "✅ Servidor reiniciado com sucesso!" "Success"
                } else {
                    Write-MediAppLog "❌ Falha ao reiniciar servidor!" "Error"
                    break
                }
            } else {
                Write-MediAppLog "✅ Sistema funcionando normalmente" "Success"
            }
            
            Start-Sleep -Seconds $Global:MediAppConfig.MonitorInterval
        }
    }
    catch {
        Write-MediAppLog "🛑 Monitoramento interrompido pelo usuário" "Info"
    }
}

function Restart-MediAppServer {
    Write-MediAppLog "🔄 Reiniciando servidor MediApp..." "Info"
    Stop-MediAppServer
    Start-Sleep -Seconds 3
    Start-MediAppServer
}

# Menu principal
Write-Host "🏥 ======================================" -ForegroundColor Yellow
Write-Host "🚀 MEDIAPP V2.0 - CONTROLE APLICAÇÃO" -ForegroundColor Yellow
Write-Host "🏥 ======================================" -ForegroundColor Yellow
Write-Host ""

switch ($Action.ToLower()) {
    "start" {
        Start-MediAppServer
    }
    "stop" {
        Stop-MediAppServer
    }
    "status" {
        Show-MediAppStatus
    }
    "restart" {
        Restart-MediAppServer
    }
    "logs" {
        Show-MediAppLogs
    }
    "monitor" {
        # Garantir que está rodando antes de monitorar
        if (-not (Test-MediAppHealth)) {
            Start-MediAppServer
        }
        Start-MediAppMonitoring
    }
    default {
        Write-Host "Uso: .\mediapp-control.ps1 [-Action comando]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
        Write-Host "  start    - Iniciar aplicação" -ForegroundColor Gray
        Write-Host "  stop     - Parar aplicação" -ForegroundColor Gray
        Write-Host "  restart  - Reiniciar aplicação" -ForegroundColor Gray
        Write-Host "  status   - Verificar status" -ForegroundColor Gray
        Write-Host "  logs     - Mostrar logs" -ForegroundColor Gray
        Write-Host "  monitor  - Monitorar com restart automático" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Exemplos:" -ForegroundColor Yellow
        Write-Host "  .\mediapp-control.ps1 -Action start" -ForegroundColor Gray
        Write-Host "  .\mediapp-control.ps1 -Action monitor" -ForegroundColor Gray
    }
}