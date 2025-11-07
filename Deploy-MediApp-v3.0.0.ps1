# 🏥 MediApp v3.0.0 - PowerShell Deploy Script
# Esteira automatizada para Windows + WSL
# Compatível: Windows 10/11 + WSL Ubuntu/Debian

param(
    [switch]$Force,      # Força recriação mesmo se já estiver rodando
    [switch]$Monitor,    # Mantém monitoramento ativo
    [switch]$Debug       # Modo debug com logs detalhados
)

# Configurações
$AppName = "MediApp"
$Version = "v3.0.0-linux"
$Port = 3002
$AppDir = "C:\workspace\aplicativo"
$JobName = "MediAppServer"
$LogFile = "C:\workspace\aplicativo\mediapp-deploy.log"

# Função de logging
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    switch ($Level) {
        "INFO"  { Write-Host $LogEntry -ForegroundColor Green }
        "WARN"  { Write-Host $LogEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
        "DEBUG" { if ($Debug) { Write-Host $LogEntry -ForegroundColor Cyan } }
    }
    
    Add-Content -Path $LogFile -Value $LogEntry
}

# Banner
function Show-Banner {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host "🏥 $AppName $Version - PowerShell Deploy Script" -ForegroundColor Blue  
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "📅 Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
    Write-Host "🖥️  Sistema: $env:OS $env:PROCESSOR_ARCHITECTURE"
    Write-Host "📁 Diretório: $AppDir"
    Write-Host "🔌 Porta: $Port"
    Write-Host ""
}

# Verificar pré-requisitos
function Test-Prerequisites {
    Write-Log "INFO" "🔍 Verificando pré-requisitos..."
    
    # Verificar WSL
    try {
        $wslCheck = wsl --list --quiet 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "ERROR" "❌ WSL não está instalado ou configurado"
            return $false
        }
        Write-Log "INFO" "✅ WSL disponível"
    }
    catch {
        Write-Log "ERROR" "❌ Erro ao verificar WSL: $($_.Exception.Message)"
        return $false
    }
    
    # Verificar Node.js no WSL
    try {
        $nodeVersion = wsl -e bash -c "node --version" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "INFO" "✅ Node.js no WSL: $nodeVersion"
        } else {
            Write-Log "ERROR" "❌ Node.js não encontrado no WSL"
            return $false
        }
    }
    catch {
        Write-Log "ERROR" "❌ Erro ao verificar Node.js: $($_.Exception.Message)"
        return $false
    }
    
    # Verificar diretório da aplicação
    if (-not (Test-Path $AppDir)) {
        Write-Log "ERROR" "❌ Diretório da aplicação não encontrado: $AppDir"
        return $false
    }
    
    Write-Log "INFO" "✅ Pré-requisitos verificados com sucesso"
    return $true
}

# Parar processos existentes
function Stop-ExistingProcesses {
    Write-Log "INFO" "🛑 Parando processos existentes..."
    
    # Parar jobs do PowerShell
    $existingJobs = Get-Job -Name $JobName -ErrorAction SilentlyContinue
    if ($existingJobs) {
        Write-Log "INFO" "🔄 Parando jobs existentes..."
        $existingJobs | Stop-Job -Force
        $existingJobs | Remove-Job -Force
        Write-Log "INFO" "✅ Jobs removidos"
    }
    
    # Parar processos Node.js no WSL
    try {
        wsl -e bash -c "pkill -f 'node.*server-linux-stable'" 2>$null
        Start-Sleep -Seconds 2
        Write-Log "INFO" "✅ Processos Node.js encerrados"
    }
    catch {
        Write-Log "WARN" "⚠️ Erro ao encerrar processos WSL (pode ser normal)"
    }
}

# Verificar porta
function Test-Port {
    Write-Log "INFO" "🔌 Verificando porta $Port..."
    
    try {
        $portTest = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($portTest) {
            if (-not $Force) {
                Write-Log "WARN" "⚠️ Porta $Port em uso. Use -Force para forçar"
                return $false
            } else {
                Write-Log "INFO" "🔄 Forçando liberação da porta $Port"
            }
        }
        Write-Log "INFO" "✅ Porta $Port disponível"
        return $true
    }
    catch {
        Write-Log "ERROR" "❌ Erro ao verificar porta: $($_.Exception.Message)"
        return $false
    }
}

# Instalar dependências
function Install-Dependencies {
    Write-Log "INFO" "📦 Instalando dependências..."
    
    try {
        # Navegar para o diretório do backend
        $backendPath = "/mnt/c/workspace/aplicativo/apps/backend"
        
        # Verificar se package.json existe
        $packageJsonCheck = wsl -e bash -c "test -f '$backendPath/package.json' && echo 'exists'"
        if ($packageJsonCheck -ne "exists") {
            Write-Log "ERROR" "❌ package.json não encontrado em $backendPath"
            return $false
        }
        
        # Instalar dependências
        Write-Log "INFO" "📥 Instalando dependências npm..."
        $npmInstall = wsl -e bash -c "cd '$backendPath' && npm install --production" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "INFO" "✅ Dependências instaladas com sucesso"
            return $true
        } else {
            Write-Log "ERROR" "❌ Erro ao instalar dependências: $npmInstall"
            return $false
        }
    }
    catch {
        Write-Log "ERROR" "❌ Erro durante instalação: $($_.Exception.Message)"
        return $false
    }
}

# Iniciar servidor
function Start-MediAppServer {
    Write-Log "INFO" "🚀 Iniciando servidor $AppName..."
    
    try {
        # Criar job em background
        $job = Start-Job -Name $JobName -ScriptBlock {
            wsl -e bash -c "cd /mnt/c/workspace/aplicativo/apps/backend/src && node server-linux-stable.js"
        }
        
        # Aguardar inicialização
        Write-Log "INFO" "⏳ Aguardando inicialização do servidor..."
        Start-Sleep -Seconds 5
        
        # Verificar se job está rodando
        $jobStatus = Get-Job -Name $JobName
        if ($jobStatus.State -eq "Running") {
            Write-Log "INFO" "✅ Servidor iniciado com sucesso (Job ID: $($jobStatus.Id))"
            return $true
        } else {
            Write-Log "ERROR" "❌ Servidor falhou ao iniciar (Estado: $($jobStatus.State))"
            return $false
        }
    }
    catch {
        Write-Log "ERROR" "❌ Erro ao iniciar servidor: $($_.Exception.Message)"
        return $false
    }
}

# Testar conectividade
function Test-Connectivity {
    Write-Log "INFO" "🔍 Testando conectividade..."
    
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log "DEBUG" "Tentativa $attempt/$maxAttempts..."
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Log "INFO" "✅ Servidor respondendo na porta $Port"
                return $true
            }
        }
        catch {
            Write-Log "DEBUG" "Tentativa $attempt falhou: $($_.Exception.Message)"
        }
        
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Log "ERROR" "❌ Servidor não respondeu após $maxAttempts tentativas"
    return $false
}

# Validar APIs
function Test-APIs {
    Write-Log "INFO" "🧪 Validando APIs..."
    
    $apis = @(
        @{ Name = "Health Check"; Url = "http://localhost:$Port/health" }
        @{ Name = "Médicos"; Url = "http://localhost:$Port/api/medicos" }
        @{ Name = "Pacientes"; Url = "http://localhost:$Port/api/pacientes" }
        @{ Name = "Estatísticas"; Url = "http://localhost:$Port/api/statistics/dashboard" }
    )
    
    foreach ($api in $apis) {
        try {
            $response = Invoke-WebRequest -Uri $api.Url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200 -and $response.Content -like "*success*") {
                Write-Log "INFO" "✅ API $($api.Name) funcionando"
            } else {
                Write-Log "ERROR" "❌ API $($api.Name) com problemas"
                return $false
            }
        }
        catch {
            Write-Log "ERROR" "❌ Erro na API $($api.Name): $($_.Exception.Message)"
            return $false
        }
    }
    
    Write-Log "INFO" "✅ Todas as APIs validadas com sucesso"
    return $true
}

# Monitoramento contínuo
function Start-Monitoring {
    Write-Log "INFO" "📊 Iniciando monitoramento contínuo..."
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar o monitoramento" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        while ($true) {
            $timestamp = Get-Date -Format "HH:mm:ss"
            
            # Verificar job
            $job = Get-Job -Name $JobName -ErrorAction SilentlyContinue
            if ($job -and $job.State -eq "Running") {
                $jobStatus = "🟢 ONLINE"
            } else {
                $jobStatus = "🔴 OFFLINE"
            }
            
            # Verificar conectividade
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                $healthStatus = "🟢 OK"
            }
            catch {
                $healthStatus = "🔴 FAIL"
            }
            
            # Exibir status
            Write-Host "[$timestamp] Job: $jobStatus | API: $healthStatus" -ForegroundColor Green
            
            Start-Sleep -Seconds 10
        }
    }
    catch {
        Write-Log "INFO" "🛑 Monitoramento interrompido"
    }
}

# Exibir status final
function Show-FinalStatus {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "🎉 $AppName $Version DEPLOY CONCLUÍDO!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    
    # Status do job
    $job = Get-Job -Name $JobName -ErrorAction SilentlyContinue
    if ($job) {
        Write-Host "📊 STATUS DO SISTEMA:"
        Write-Host "   🟢 Servidor: " -NoNewline
        Write-Host "ONLINE" -ForegroundColor Green
        Write-Host "   🔌 Porta: " -NoNewline
        Write-Host "$Port" -ForegroundColor Blue
        Write-Host "   📁 Job ID: " -NoNewline
        Write-Host "$($job.Id)" -ForegroundColor Blue
        Write-Host "   📄 Logs: " -NoNewline
        Write-Host "$LogFile" -ForegroundColor Blue
    }
    
    Write-Host ""
    Write-Host "🌐 URLS DE ACESSO:"
    Write-Host "   🏠 Portal:           " -NoNewline
    Write-Host "http://localhost:$Port/" -ForegroundColor Blue
    Write-Host "   🏥 Dashboard:        " -NoNewline  
    Write-Host "http://localhost:$Port/app.html" -ForegroundColor Blue
    Write-Host "   👨‍⚕️ Gestão Médicos:   " -NoNewline
    Write-Host "http://localhost:$Port/gestao-medicos.html" -ForegroundColor Blue
    Write-Host "   👥 Gestão Pacientes: " -NoNewline
    Write-Host "http://localhost:$Port/gestao-pacientes.html" -ForegroundColor Blue
    Write-Host "   📊 Analytics:        " -NoNewline
    Write-Host "http://localhost:$Port/analytics-mapas.html" -ForegroundColor Blue
    Write-Host "   🔍 Health Check:     " -NoNewline
    Write-Host "http://localhost:$Port/health" -ForegroundColor Blue
    
    Write-Host ""
    Write-Host "🛠️  COMANDOS ÚTEIS:"
    Write-Host "   Parar servidor:     " -NoNewline
    Write-Host "Stop-Job -Name '$JobName'; Remove-Job -Name '$JobName'" -ForegroundColor Yellow
    Write-Host "   Ver status job:     " -NoNewline
    Write-Host "Get-Job -Name '$JobName'" -ForegroundColor Yellow
    Write-Host "   Monitorar:         " -NoNewline
    Write-Host "$PSCommandPath -Monitor" -ForegroundColor Yellow
    Write-Host ""
}

# Função principal
function Main {
    Show-Banner
    
    # Verificar pré-requisitos
    if (-not (Test-Prerequisites)) {
        Write-Log "ERROR" "❌ Pré-requisitos não atendidos"
        exit 1
    }
    
    # Verificar se já está rodando
    $existingJob = Get-Job -Name $JobName -ErrorAction SilentlyContinue
    if ($existingJob -and $existingJob.State -eq "Running" -and -not $Force) {
        Write-Log "WARN" "⚠️ Servidor já está rodando. Use -Force para reiniciar"
        
        # Testar se está funcionando
        if (Test-Connectivity) {
            Show-FinalStatus
            if ($Monitor) {
                Start-Monitoring
            }
            return
        } else {
            Write-Log "WARN" "⚠️ Servidor rodando mas não responde, reiniciando..."
            $Force = $true
        }
    }
    
    # Executar passos do deploy
    Stop-ExistingProcesses
    
    if (-not (Test-Port)) {
        exit 1
    }
    
    if (-not (Install-Dependencies)) {
        exit 1
    }
    
    if (-not (Start-MediAppServer)) {
        exit 1
    }
    
    if (-not (Test-Connectivity)) {
        exit 1
    }
    
    if (-not (Test-APIs)) {
        exit 1
    }
    
    # Exibir status final
    Show-FinalStatus
    
    Write-Log "INFO" "🎯 Deploy concluído com sucesso!"
    Write-Log "INFO" "📝 Logs salvos em: $LogFile"
    
    # Iniciar monitoramento se solicitado
    if ($Monitor) {
        Start-Monitoring
    }
}

# Executar função principal
try {
    Main
}
catch {
    Write-Log "ERROR" "❌ Erro fatal durante deploy: $($_.Exception.Message)"
    exit 1
}