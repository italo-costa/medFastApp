# TESTE COMPLETO DA ESTEIRA - MEDIAPP v3.0.1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ESTEIRA COMPLETA DE TESTES - v3.0.1" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$TestResults = @()
$StartTime = Get-Date

# FASE 1: Estrutura do projeto
Write-Host "`n[FASE 1] Validando estrutura do projeto..." -ForegroundColor Yellow
$testResult = @{ Name = "Estrutura"; Status = $true; Details = @() }

if (Test-Path "apps/backend") {
    $testResult.Details += "Backend encontrado"
} else {
    $testResult.Status = $false
    $testResult.Details += "Backend NAO encontrado"
}

if (Test-Path "apps/mobile") {
    $testResult.Details += "Mobile encontrado" 
} else {
    $testResult.Status = $false
    $testResult.Details += "Mobile NAO encontrado"
}

$TestResults += $testResult
Write-Host "  Status: $(if ($testResult.Status) { 'PASSOU' } else { 'FALHOU' })" -ForegroundColor $(if ($testResult.Status) { "Green" } else { "Red" })

# FASE 2: APIs funcionais
Write-Host "`n[FASE 2] Testando APIs..." -ForegroundColor Yellow
$testResult = @{ Name = "APIs"; Status = $true; Details = @() }

$apis = @(
    @{Name="Medicos"; Url="/api/medicos"},
    @{Name="Pacientes"; Url="/api/pacientes"},
    @{Name="Estatisticas"; Url="/api/statistics/dashboard"},
    @{Name="Health"; Url="/health"}
)

foreach ($api in $apis) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002$($api.Url)" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $testResult.Details += "$($api.Name): OK"
        } else {
            $testResult.Status = $false
            $testResult.Details += "$($api.Name): Status $($response.StatusCode)"
        }
    } catch {
        $testResult.Status = $false
        $testResult.Details += "$($api.Name): ERRO - $($_.Exception.Message)"
    }
}

$TestResults += $testResult
Write-Host "  Status: $(if ($testResult.Status) { 'PASSOU' } else { 'FALHOU' })" -ForegroundColor $(if ($testResult.Status) { "Green" } else { "Red" })

# FASE 3: Paginas HTML
Write-Host "`n[FASE 3] Testando paginas HTML..." -ForegroundColor Yellow
$testResult = @{ Name = "Paginas"; Status = $true; Details = @() }

$pages = @(
    @{Name="Portal"; Url="/"},
    @{Name="Dashboard"; Url="/app.html"},
    @{Name="Gestao Medicos"; Url="/gestao-medicos.html"},
    @{Name="Gestao Pacientes"; Url="/gestao-pacientes.html"}
)

foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002$($page.Url)" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $testResult.Details += "$($page.Name): OK"
        } else {
            $testResult.Status = $false
            $testResult.Details += "$($page.Name): Status $($response.StatusCode)"
        }
    } catch {
        $testResult.Status = $false
        $testResult.Details += "$($page.Name): ERRO"
    }
}

$TestResults += $testResult
Write-Host "  Status: $(if ($testResult.Status) { 'PASSOU' } else { 'FALHOU' })" -ForegroundColor $(if ($testResult.Status) { "Green" } else { "Red" })

# FASE 4: Dados do banco
Write-Host "`n[FASE 4] Validando dados do banco..." -ForegroundColor Yellow
$testResult = @{ Name = "Dados"; Status = $true; Details = @() }

try {
    # Medicos
    $medicosResp = Invoke-WebRequest -Uri "http://localhost:3002/api/medicos" -UseBasicParsing
    $medicosData = ($medicosResp.Content | ConvertFrom-Json).data
    $testResult.Details += "Medicos: $($medicosData.Count) registros"
    
    # Pacientes  
    $pacientesResp = Invoke-WebRequest -Uri "http://localhost:3002/api/pacientes" -UseBasicParsing
    $pacientesData = ($pacientesResp.Content | ConvertFrom-Json).data
    $testResult.Details += "Pacientes: $($pacientesData.Count) registros"
    
    if ($medicosData.Count -eq 0 -or $pacientesData.Count -eq 0) {
        $testResult.Status = $false
        $testResult.Details += "AVISO: Dados insuficientes no banco"
    }
} catch {
    $testResult.Status = $false
    $testResult.Details += "ERRO: Falha ao acessar dados do banco"
}

$TestResults += $testResult
Write-Host "  Status: $(if ($testResult.Status) { 'PASSOU' } else { 'FALHOU' })" -ForegroundColor $(if ($testResult.Status) { "Green" } else { "Red" })

# FASE 5: Infraestrutura
Write-Host "`n[FASE 5] Validando infraestrutura..." -ForegroundColor Yellow
$testResult = @{ Name = "Infraestrutura"; Status = $true; Details = @() }

# Job do servidor
$job = Get-Job -Id 1 -ErrorAction SilentlyContinue
if ($job -and $job.State -eq "Running") {
    $testResult.Details += "Servidor: Online (Job ID: $($job.Id))"
} else {
    $testResult.Status = $false
    $testResult.Details += "Servidor: Offline ou com problemas"
}

# Logs sem erros
try {
    $logs = Receive-Job -Id 1 -Keep | Select-Object -Last 10
    $errors = $logs | Where-Object { $_ -match "ERROR|ERRO|404|500" }
    if ($errors.Count -eq 0) {
        $testResult.Details += "Logs: Sem erros recentes"
    } else {
        $testResult.Status = $false
        $testResult.Details += "Logs: $($errors.Count) erros encontrados"
    }
} catch {
    $testResult.Details += "Logs: Nao foi possivel verificar"
}

$TestResults += $testResult
Write-Host "  Status: $(if ($testResult.Status) { 'PASSOU' } else { 'FALHOU' })" -ForegroundColor $(if ($testResult.Status) { "Green" } else { "Red" })

# RELATORIO FINAL
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "RELATORIO FINAL DA ESTEIRA" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$TotalTests = $TestResults.Count
$PassedTests = ($TestResults | Where-Object { $_.Status }).Count
$SuccessRate = [math]::Round(($PassedTests / $TotalTests) * 100, 1)

Write-Host "Total de fases: $TotalTests" -ForegroundColor Blue
Write-Host "Fases aprovadas: $PassedTests" -ForegroundColor Green
Write-Host "Taxa de sucesso: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -eq 100) { "Green" } else { "Yellow" })

foreach ($test in $TestResults) {
    $icon = if ($test.Status) { "✓" } else { "✗" }
    $color = if ($test.Status) { "Green" } else { "Red" }
    Write-Host "`n$icon $($test.Name):" -ForegroundColor $color
    foreach ($detail in $test.Details) {
        Write-Host "  - $detail" -ForegroundColor Gray
    }
}

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "`n==========================================" -ForegroundColor Cyan
if ($SuccessRate -eq 100) {
    Write-Host "ESTEIRA COMPLETA: TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "Sistema aprovado para RELEASE!" -ForegroundColor Green
} else {
    Write-Host "ESTEIRA COMPLETA: ALGUMAS FALHAS DETECTADAS" -ForegroundColor Yellow
    Write-Host "Revisar itens marcados com erro" -ForegroundColor Yellow
}

Write-Host "Tempo total de execucao: $([math]::Round($Duration.TotalSeconds, 1)) segundos" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Cyan

return $SuccessRate -eq 100