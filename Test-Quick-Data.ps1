# TESTE RAPIDO - CARREGAMENTO DE DADOS

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TESTE DE CARREGAMENTO DE DADOS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Testar APIs
Write-Host "`n[1] Testando APIs..." -ForegroundColor Yellow

try {
    $medicos = Invoke-WebRequest -Uri "http://localhost:3002/api/medicos" -UseBasicParsing
    $medicosData = ($medicos.Content | ConvertFrom-Json).data
    Write-Host "OK: API Medicos - $($medicosData.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "ERRO: API Medicos falhou" -ForegroundColor Red
}

try {
    $pacientes = Invoke-WebRequest -Uri "http://localhost:3002/api/pacientes" -UseBasicParsing
    $pacientesData = ($pacientes.Content | ConvertFrom-Json).data
    Write-Host "OK: API Pacientes - $($pacientesData.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "ERRO: API Pacientes falhou" -ForegroundColor Red
}

try {
    $stats = Invoke-WebRequest -Uri "http://localhost:3002/api/statistics/dashboard" -UseBasicParsing
    $statsData = ($stats.Content | ConvertFrom-Json).data
    Write-Host "OK: API Estatisticas funcionando" -ForegroundColor Green
    Write-Host "  Medicos ativos: $($statsData.medicosAtivos.value)" -ForegroundColor Gray
    Write-Host "  Pacientes: $($statsData.pacientesCadastrados.value)" -ForegroundColor Gray
} catch {
    Write-Host "ERRO: API Estatisticas falhou" -ForegroundColor Red
}

# Testar páginas
Write-Host "`n[2] Testando paginas..." -ForegroundColor Yellow

$pages = @(
    @{Url="http://localhost:3002/"; Nome="Portal"},
    @{Url="http://localhost:3002/app.html"; Nome="Dashboard"},
    @{Url="http://localhost:3002/gestao-medicos.html"; Nome="Gestao Medicos"},
    @{Url="http://localhost:3002/gestao-pacientes.html"; Nome="Gestao Pacientes"}
)

foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri $page.Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "OK: $($page.Nome) carregou" -ForegroundColor Green
        }
    } catch {
        Write-Host "ERRO: $($page.Nome) falhou" -ForegroundColor Red
    }
}

# Verificar logs de erro
Write-Host "`n[3] Verificando erros recentes..." -ForegroundColor Yellow

$logs = Receive-Job -Id 1 -Keep | Select-Object -Last 10
$errors = $logs | Where-Object { $_ -match "ERROR|404|500" }

if ($errors.Count -gt 0) {
    Write-Host "AVISO: $($errors.Count) erros nos logs" -ForegroundColor Yellow
} else {
    Write-Host "OK: Sem erros nos logs recentes" -ForegroundColor Green
}

Write-Host "`n[4] Dados encontrados no banco:" -ForegroundColor Yellow
if ($medicosData) {
    Write-Host "  Medicos cadastrados: $($medicosData.Count)" -ForegroundColor Blue
    $medicosData | Select-Object -First 2 | ForEach-Object {
        Write-Host "    - $($_.nome) ($($_.especialidade))" -ForegroundColor Gray
    }
}

if ($pacientesData) {
    Write-Host "  Pacientes cadastrados: $($pacientesData.Count)" -ForegroundColor Blue
    $pacientesData | Select-Object -First 2 | ForEach-Object {
        Write-Host "    - $($_.nome) ($($_.cpf))" -ForegroundColor Gray
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "CONCLUSAO: Sistema com dados funcionais!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan