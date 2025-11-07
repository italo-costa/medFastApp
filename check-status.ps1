# MediApp v3.0.0 - Status Check
Write-Host "=== MediApp v3.0.0 Status ===" -ForegroundColor Green

# Verificar job do servidor
$job = Get-Job -Name "MediAppServer" -ErrorAction SilentlyContinue
if ($job -and $job.State -eq "Running") {
    Write-Host "Status: ATIVO" -ForegroundColor Green
} else {
    Write-Host "Status: INATIVO" -ForegroundColor Red
    exit 1
}

# Testar conectividade
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Health Check: OK" -ForegroundColor Green
} catch {
    Write-Host "Health Check: FALHA" -ForegroundColor Red
}

# URLs principais
Write-Host ""
Write-Host "URLs Disponiveis:"
Write-Host "  Dashboard: http://localhost:3002/"
Write-Host "  Medicos: http://localhost:3002/gestao-medicos.html"
Write-Host "  Pacientes: http://localhost:3002/gestao-pacientes.html"
Write-Host "  Prontuarios: http://localhost:3002/prontuarios.html"
Write-Host ""
Write-Host "Sistema OPERACIONAL!" -ForegroundColor Green