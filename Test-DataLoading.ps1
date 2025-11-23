# TESTE DE CARREGAMENTO DE DADOS - MEDIAPP

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TESTE CARREGAMENTO DE DADOS NAS TELAS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Função para testar API
function Test-API {
    param(
        [string]$Endpoint,
        [string]$Nome
    )
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002$Endpoint" -UseBasicParsing -TimeoutSec 10
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -and $data.data) {
            $count = if ($data.data -is [array]) { $data.data.Count } else { 1 }
            Write-Host "OK: $Nome - $count registros encontrados" -ForegroundColor Green
            return @{ Success = $true; Count = $count; Data = $data.data }
        } else {
            Write-Host "AVISO: $Nome - API respondeu mas sem dados" -ForegroundColor Yellow
            return @{ Success = $false; Count = 0; Error = "Sem dados" }
        }
    }
    catch {
        Write-Host "ERRO: $Nome - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Count = 0; Error = $_.Exception.Message }
    }
}

# Função para testar página HTML
function Test-HTMLPage {
    param(
        [string]$Url,
        [string]$Nome
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "OK: Página $Nome carregou corretamente" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "ERRO: Página $Nome - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n[1] Testando APIs de dados..." -ForegroundColor Yellow

# Testar APIs
$medicosTest = Test-API "/api/medicos" "API Médicos"
$pacientesTest = Test-API "/api/pacientes" "API Pacientes" 
$statsTest = Test-API "/api/statistics/dashboard" "API Estatísticas"

Write-Host "`n[2] Testando páginas HTML..." -ForegroundColor Yellow

# Testar páginas
$portalOK = Test-HTMLPage "http://localhost:3002/" "Portal Principal"
$dashboardOK = Test-HTMLPage "http://localhost:3002/app.html" "Dashboard"
$medicosPageOK = Test-HTMLPage "http://localhost:3002/gestao-medicos.html" "Gestão Médicos"
$pacientesPageOK = Test-HTMLPage "http://localhost:3002/gestao-pacientes.html" "Gestão Pacientes"

Write-Host "`n[3] Verificando integridade dos dados..." -ForegroundColor Yellow

# Verificar se há dados suficientes para teste
$medicosOK = $medicosTest.Success -and $medicosTest.Count -gt 0
$pacientesOK = $pacientesTest.Success -and $pacientesTest.Count -gt 0
$statsOK = $statsTest.Success

if ($medicosOK) {
    Write-Host "OK: $($medicosTest.Count) médicos cadastrados no banco" -ForegroundColor Green
    
    # Mostrar alguns médicos para validação
    Write-Host "  Médicos encontrados:" -ForegroundColor Gray
    foreach ($medico in ($medicosTest.Data | Select-Object -First 3)) {
        Write-Host "    - $($medico.nome) ($($medico.especialidade))" -ForegroundColor Gray
    }
} else {
    Write-Host "PROBLEMA: Nenhum médico encontrado no banco" -ForegroundColor Red
}

if ($pacientesOK) {
    Write-Host "OK: $($pacientesTest.Count) pacientes cadastrados no banco" -ForegroundColor Green
    
    # Mostrar alguns pacientes para validação
    Write-Host "  Pacientes encontrados:" -ForegroundColor Gray
    foreach ($paciente in ($pacientesTest.Data | Select-Object -First 3)) {
        Write-Host "    - $($paciente.nome) ($($paciente.cpf))" -ForegroundColor Gray
    }
} else {
    Write-Host "PROBLEMA: Nenhum paciente encontrado no banco" -ForegroundColor Red
}

if ($statsOK) {
    $stats = $statsTest.Data
    Write-Host "OK: Estatísticas disponíveis" -ForegroundColor Green
    Write-Host "  Médicos ativos: $($stats.medicosAtivos.value)" -ForegroundColor Gray
    Write-Host "  Pacientes cadastrados: $($stats.pacientesCadastrados.value)" -ForegroundColor Gray
    Write-Host "  Consultas hoje: $($stats.consultasHoje.value)" -ForegroundColor Gray
} else {
    Write-Host "PROBLEMA: Estatísticas indisponíveis" -ForegroundColor Red
}

Write-Host "`n[4] Verificando logs do servidor..." -ForegroundColor Yellow

# Verificar se há erros recentes nos logs
$recentLogs = Receive-Job -Id 1 -Keep | Select-Object -Last 20
$errors = $recentLogs | Where-Object { $_ -match "ERROR|ERRO|404|500" }

if ($errors.Count -gt 0) {
    Write-Host "AVISO: $($errors.Count) erros encontrados nos logs recentes:" -ForegroundColor Yellow
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "OK: Nenhum erro encontrado nos logs recentes" -ForegroundColor Green
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$totalTests = 7
$passedTests = 0

if ($medicosTest.Success) { $passedTests++ }
if ($pacientesTest.Success) { $passedTests++ }
if ($statsTest.Success) { $passedTests++ }
if ($portalOK) { $passedTests++ }
if ($dashboardOK) { $passedTests++ }
if ($medicosPageOK) { $passedTests++ }
if ($pacientesPageOK) { $passedTests++ }

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "Testes executados: $totalTests" -ForegroundColor Blue
Write-Host "Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "Taxa de sucesso: $successRate%" -ForegroundColor $(if ($successRate -ge 85) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

if ($successRate -ge 85) {
    Write-Host "`nSTATUS: SISTEMA FUNCIONANDO CORRETAMENTE!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "`nSTATUS: SISTEMA COM PROBLEMAS MENORES" -ForegroundColor Yellow
} else {
    Write-Host "`nSTATUS: SISTEMA COM PROBLEMAS CRÍTICOS" -ForegroundColor Red
}

# Diagnóstico específico para carregamento de dados
Write-Host "`n[DIAGNÓSTICO] Problemas de carregamento:" -ForegroundColor Blue

if (-not $medicosOK) {
    Write-Host "- Médicos: Verificar se há dados no banco ou estrutura da API" -ForegroundColor Yellow
}

if (-not $pacientesOK) {
    Write-Host "- Pacientes: Verificar se há dados no banco ou estrutura da API" -ForegroundColor Yellow
}

if (-not $statsOK) {
    Write-Host "- Estatísticas: Verificar endpoint /api/statistics/dashboard" -ForegroundColor Yellow
}

if ($successRate -lt 100) {
    Write-Host "`nRecomendação: Executar correções identificadas e testar novamente" -ForegroundColor Blue
}

Write-Host "`nTeste concluido" -ForegroundColor Cyan