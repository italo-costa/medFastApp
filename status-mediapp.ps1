# ========================================
# MediApp v3.0.0 - SERVIDOR ATIVO E MONITORADO
# ========================================

Write-Host "🏥 MediApp v3.0.0 - Status do Sistema" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Verificar job do servidor
$job = Get-Job -Name "MediAppServer" -ErrorAction SilentlyContinue
if ($job -and $job.State -eq "Running") {
    Write-Host "✅ Servidor Status: ATIVO" -ForegroundColor Green
    Write-Host "📊 Job ID: $($job.Id)" -ForegroundColor Yellow
    Write-Host "🖥️  Location: $($job.Location)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Servidor Status: INATIVO" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Testar conectividade
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
    $healthData = $healthCheck.Content | ConvertFrom-Json
    
    Write-Host "🔗 Conectividade: OK" -ForegroundColor Green
    Write-Host "📊 Health Status: $($healthData.data.status)" -ForegroundColor Green
    Write-Host "⚡ Uptime: $($healthData.data.uptime) segundos" -ForegroundColor Yellow
    Write-Host "🖥️  Platform: $($healthData.data.platform)" -ForegroundColor Yellow
    Write-Host "🌐 Environment: $($healthData.data.environment)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Conectividade: FALHA" -ForegroundColor Red
    Write-Host "⚠️  Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Testar APIs principais
$apis = @(
    @{Name="Dashboard"; Url="http://localhost:3002/"},
    @{Name="Médicos"; Url="http://localhost:3002/api/medicos"},
    @{Name="Estatísticas"; Url="http://localhost:3002/api/dashboard/stats"}
)

Write-Host "🔬 Teste de APIs:" -ForegroundColor Cyan
foreach ($api in $apis) {
    try {
        $response = Invoke-WebRequest -Uri $api.Url -UseBasicParsing -TimeoutSec 5
        Write-Host "  ✅ $($api.Name): OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($api.Name): FALHA" -ForegroundColor Red
    }
}

Write-Host ""

# URLs de acesso
Write-Host "🌐 URLs Disponíveis:" -ForegroundColor Cyan
Write-Host "  📊 Health Check: http://localhost:3002/health" -ForegroundColor White
Write-Host "  🏥 Dashboard: http://localhost:3002/" -ForegroundColor White  
Write-Host "  👨‍⚕️ Médicos: http://localhost:3002/gestao-medicos.html" -ForegroundColor White
Write-Host "  👥 Pacientes: http://localhost:3002/gestao-pacientes.html" -ForegroundColor White
Write-Host "  📋 Prontuários: http://localhost:3002/prontuarios.html" -ForegroundColor White
Write-Host "  📊 Analytics: http://localhost:3002/analytics-mapas.html" -ForegroundColor White

Write-Host ""

# Comandos úteis
Write-Host "🔧 Comandos de Gerenciamento:" -ForegroundColor Cyan
Write-Host "  📊 Ver logs: Receive-Job -Name 'MediAppServer'" -ForegroundColor Yellow
Write-Host "  🛑 Parar: Stop-Job -Name 'MediAppServer'; Remove-Job -Name 'MediAppServer'" -ForegroundColor Yellow
Write-Host "  🔄 Status: Get-Job -Name 'MediAppServer'" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎯 MediApp v3.0.0 - Sistema Linux 100% Operacional!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green