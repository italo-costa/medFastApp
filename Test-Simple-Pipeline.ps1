# TESTE PIPELINE SIMPLES - MEDIAPP v3.0.1

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "PIPELINE DE TESTES COMPLETO" -ForegroundColor Cyan  
Write-Host "===========================================" -ForegroundColor Cyan

$allPassed = $true

# TESTE 1: APIs
Write-Host "`n[1] Testando APIs..." -ForegroundColor Yellow
$apiTests = @(
    "http://localhost:3002/api/medicos",
    "http://localhost:3002/api/pacientes", 
    "http://localhost:3002/api/statistics/dashboard",
    "http://localhost:3002/health"
)

foreach ($url in $apiTests) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "  OK: $(Split-Path $url -Leaf)" -ForegroundColor Green
    } catch {
        Write-Host "  ERRO: $(Split-Path $url -Leaf)" -ForegroundColor Red
        $allPassed = $false
    }
}

# TESTE 2: Paginas
Write-Host "`n[2] Testando paginas..." -ForegroundColor Yellow
$pageTests = @(
    "http://localhost:3002/",
    "http://localhost:3002/app.html",
    "http://localhost:3002/gestao-medicos.html",
    "http://localhost:3002/gestao-pacientes.html"
)

foreach ($url in $pageTests) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "  OK: $(Split-Path $url -Leaf)" -ForegroundColor Green
    } catch {
        Write-Host "  ERRO: $(Split-Path $url -Leaf)" -ForegroundColor Red
        $allPassed = $false
    }
}

# TESTE 3: Dados
Write-Host "`n[3] Validando dados..." -ForegroundColor Yellow
try {
    $medicos = (Invoke-WebRequest -Uri "http://localhost:3002/api/medicos" -UseBasicParsing).Content | ConvertFrom-Json
    $pacientes = (Invoke-WebRequest -Uri "http://localhost:3002/api/pacientes" -UseBasicParsing).Content | ConvertFrom-Json
    
    Write-Host "  OK: $($medicos.data.Count) medicos no banco" -ForegroundColor Green
    Write-Host "  OK: $($pacientes.data.Count) pacientes no banco" -ForegroundColor Green
    
    if ($medicos.data.Count -eq 0 -or $pacientes.data.Count -eq 0) {
        Write-Host "  AVISO: Dados insuficientes" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERRO: Falha ao validar dados" -ForegroundColor Red
    $allPassed = $false
}

# TESTE 4: Servidor
Write-Host "`n[4] Status do servidor..." -ForegroundColor Yellow
$job = Get-Job -Id 1 -ErrorAction SilentlyContinue
if ($job -and $job.State -eq "Running") {
    Write-Host "  OK: Servidor rodando (Job $($job.Id))" -ForegroundColor Green
} else {
    Write-Host "  AVISO: Job do servidor nao encontrado" -ForegroundColor Yellow
}

# RESULTADO FINAL
Write-Host "`n===========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "PIPELINE: TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "Sistema APROVADO para RELEASE!" -ForegroundColor Green
} else {
    Write-Host "PIPELINE: ALGUMAS FALHAS DETECTADAS" -ForegroundColor Yellow
    Write-Host "Revisar erros antes da release" -ForegroundColor Yellow
}
Write-Host "===========================================" -ForegroundColor Cyan

return $allPassed