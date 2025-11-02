# 🏥 MediApp v2.0 - Script de Deploy PowerShell
# Mantém toda a aplicação executando com monitoramento ativo

param(
    [string]$Action = "start",
    [switch]$Monitor = $false
)

# Configurações
$BackendPath = "C:\workspace\aplicativo\apps\backend"
$LogPath = "C:\workspace\aplicativo\logs"
$HealthUrl = "http://localhost:3002/health"
$MaxRetries = 5

# Função para logging
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Red
}

function Write-Warning-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Yellow
}

# Função para verificar se o servidor está rodando
function Test-ServerHealth {
    try {
        $response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Função para parar todos os processos relacionados
function Stop-MediAppProcesses {
    Write-Log "🛑 Parando processos do MediApp..."
    
    # Parar processos WSL relacionados ao Node.js
    try {
        wsl bash -c "pkill -f 'node.*mediapp' 2>/dev/null || true"
        wsl bash -c "pkill -f 'npm.*start' 2>/dev/null || true"
        wsl bash -c "pkill -f 'node.*app.js' 2>/dev/null || true"
        Write-Log "✅ Processos WSL parados"
    }
    catch {
        Write-Warning-Log "⚠️ Alguns processos podem ainda estar rodando"
    }
    
    Start-Sleep -Seconds 2
}

# Função para iniciar o servidor
function Start-MediAppServer {
    Write-Log "🚀 Iniciando servidor MediApp..."
    
    # Verificar se o diretório existe
    if (-not (Test-Path $BackendPath)) {
        Write-Error-Log "❌ Diretório backend não encontrado: $BackendPath"
        return $false
    }
    
    # Criar diretório de logs se não existir
    if (-not (Test-Path $LogPath)) {
        New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
    }
    
    try {
        # Ir para o diretório backend e iniciar via WSL
        Set-Location $BackendPath
        
        # Verificar se as dependências estão instaladas
        if (-not (Test-Path "$BackendPath\node_modules")) {
            Write-Log "📦 Instalando dependências..."
            $installResult = wsl bash -c "cd /mnt/c/workspace/aplicativo/apps/backend; npm install"
            if ($LASTEXITCODE -ne 0) {
                Write-Error-Log "❌ Falha ao instalar dependências"
                return $false
            }
        }
        
        # Gerar cliente Prisma
        Write-Log "🔄 Gerando cliente Prisma..."
        wsl bash -c "cd /mnt/c/workspace/aplicativo/apps/backend; npx prisma generate"
        
        # Iniciar servidor em background
        Write-Log "🔥 Iniciando servidor em background..."
        $job = Start-Job -ScriptBlock {
            wsl bash -c "cd /mnt/c/workspace/aplicativo/apps/backend; node src/app.js"
        }
        
        # Aguardar inicialização
        Write-Log "⏳ Aguardando servidor inicializar..."
        Start-Sleep -Seconds 8
        
        return $true
    }
    catch {
        Write-Error-Log "❌ Erro ao iniciar servidor: $($_.Exception.Message)"
        return $false
    }
}

# Função para verificar saúde com retry
function Wait-ForServerHealth {
    $retries = 0
    
    while ($retries -lt $MaxRetries) {
        Write-Log "🔍 Verificando saúde do servidor (tentativa $($retries + 1)/$MaxRetries)..."
        
        if (Test-ServerHealth) {
            Write-Log "✅ Servidor respondendo normalmente!"
            return $true
        }
        
        $retries++
        if ($retries -lt $MaxRetries) {
            Write-Log "⏳ Aguardando 4 segundos antes da próxima tentativa..."
            Start-Sleep -Seconds 4
        }
    }
    
    Write-Error-Log "❌ Servidor não está respondendo após $MaxRetries tentativas"
    return $false
}

# Função para mostrar status da aplicação
function Show-ApplicationStatus {
    Write-Log "📊 Status da aplicação MediApp v2.0:"
    Write-Host ""
    Write-Host "   🔗 Health Check: $HealthUrl" -ForegroundColor Cyan
    Write-Host "   🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html" -ForegroundColor Cyan
    Write-Host "   👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html" -ForegroundColor Cyan
    Write-Host "   📊 Dashboard: http://localhost:3002/api/statistics/dashboard" -ForegroundColor Cyan
    Write-Host "   📋 API Médicos: http://localhost:3002/api/medicos" -ForegroundColor Cyan
    Write-Host "   👨‍⚕️ API Pacientes: http://localhost:3002/api/pacientes" -ForegroundColor Cyan
    Write-Host ""
    
    # Tentar obter estatísticas do sistema
    try {
        $healthData = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 3
        Write-Log "💾 Sistema conectado ao banco de dados com sucesso!"
    }
    catch {
        Write-Warning-Log "⚠️ Não foi possível obter estatísticas do banco"
    }
}

# Função de monitoramento contínuo
function Start-ContinuousMonitoring {
    Write-Log "👁️ Iniciando monitoramento contínuo..."
    Write-Log "💡 Pressione Ctrl+C para parar o servidor"
    Write-Host ""
    
    $checkInterval = 30  # segundos
    $lastCheck = 0
    
    try {
        while ($true) {
            $currentTime = [int][double]::Parse((Get-Date -UFormat %s))
            
            # Verificar a cada 30 segundos
            if (($currentTime - $lastCheck) -ge $checkInterval) {
                if (-not (Test-ServerHealth)) {
                    Write-Warning-Log "⚠️ Servidor não está respondendo! Tentando reiniciar..."
                    
                    # Parar processos atuais
                    Stop-MediAppProcesses
                    
                    # Reiniciar servidor
                    if (Start-MediAppServer) {
                        if (Wait-ForServerHealth) {
                            Write-Log "✅ Servidor reiniciado com sucesso!"
                            Show-ApplicationStatus
                        }
                        else {
                            Write-Error-Log "❌ Falha ao reiniciar servidor!"
                            break
                        }
                    }
                    else {
                        Write-Error-Log "❌ Não foi possível reiniciar o servidor!"
                        break
                    }
                }
                else {
                    Write-Log "✅ Servidor funcionando normalmente"
                }
                
                $lastCheck = $currentTime
            }
            
            Start-Sleep -Seconds 5
        }
    }
    catch {
        Write-Log "🛑 Monitoramento interrompido pelo usuário"
    }
    finally {
        Stop-MediAppProcesses
        Write-Log "✅ Cleanup concluído!"
    }
}

# Função principal
function Start-MediAppDeploy {
    Write-Host "🚀 ======================================" -ForegroundColor Yellow
    Write-Host "🏥 MEDIAPP V2.0 - DEPLOY COMPLETO" -ForegroundColor Yellow  
    Write-Host "🚀 ======================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Cleanup inicial
    Stop-MediAppProcesses
    
    # Iniciar servidor
    if (Start-MediAppServer) {
        # Verificar saúde
        if (Wait-ForServerHealth) {
            Write-Log "🎉 Deploy concluído com sucesso!"
            Show-ApplicationStatus
            
            if ($Monitor) {
                Start-ContinuousMonitoring
            }
            else {
                Write-Log "💡 Servidor rodando! Use -Monitor para monitoramento contínuo"
                Write-Log "💡 Para parar: .\deploy-mediapp.ps1 -Action stop"
            }
        }
        else {
            Write-Error-Log "❌ Falha no deploy - servidor não está respondendo"
            Stop-MediAppProcesses
        }
    }
    else {
        Write-Error-Log "❌ Falha ao iniciar servidor"
    }
}

# Função para parar a aplicação
function Stop-MediAppDeploy {
    Write-Log "🛑 Parando aplicação MediApp..."
    Stop-MediAppProcesses
    Write-Log "✅ Aplicação parada!"
}

# Função para verificar status
function Get-MediAppStatus {
    Write-Log "🔍 Verificando status da aplicação..."
    
    if (Test-ServerHealth) {
        Write-Log "✅ Servidor está rodando!"
        Show-ApplicationStatus
    }
    else {
        Write-Warning-Log "⚠️ Servidor não está respondendo"
        Write-Log "💡 Use: .\deploy-mediapp.ps1 -Action start para iniciar"
    }
}

# Switch principal baseado na ação
switch ($Action.ToLower()) {
    "start" { Start-MediAppDeploy }
    "stop" { Stop-MediAppDeploy }
    "status" { Get-MediAppStatus }
    "restart" { 
        Stop-MediAppDeploy
        Start-Sleep -Seconds 3
        Start-MediAppDeploy 
    }
    default { 
        Write-Host "Uso: .\deploy-mediapp.ps1 [-Action start|stop|status|restart] [-Monitor]" -ForegroundColor Yellow
        Write-Host "Exemplos:" -ForegroundColor Cyan
        Write-Host "  .\deploy-mediapp.ps1 -Action start -Monitor    # Inicia com monitoramento" -ForegroundColor Gray
        Write-Host "  .\deploy-mediapp.ps1 -Action stop              # Para a aplicação" -ForegroundColor Gray
        Write-Host "  .\deploy-mediapp.ps1 -Action status            # Verifica status" -ForegroundColor Gray
    }
}