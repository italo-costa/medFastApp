# Teste das estatísticas do dashboard
Write-Host "=== TESTE DAS ESTATÍSTICAS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se servidor está rodando
Write-Host "1. Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistics/dashboard" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Servidor rodando na porta 3000" -ForegroundColor Green
    $port = 3000
} catch {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/statistics/dashboard" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Servidor rodando na porta 3001" -ForegroundColor Green
        $port = 3001
    } catch {
        Write-Host "❌ Servidor não encontrado nas portas 3000 ou 3001" -ForegroundColor Red
        Write-Host "Verificando processos Node.js..." -ForegroundColor Yellow
        Get-Process -Name "node*" -ErrorAction SilentlyContinue
        Write-Host ""
        Write-Host "Para iniciar o servidor:" -ForegroundColor White
        Write-Host "cd backend && node src/server.js" -ForegroundColor Cyan
        exit 1
    }
}

# Fazer requisição para estatísticas
Write-Host ""
Write-Host "2. Obtendo estatísticas..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:$port/api/statistics/dashboard" -UseBasicParsing
    $statsData = $statsResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Dados recebidos:" -ForegroundColor Green
    Write-Host ""
    
    if ($statsData.success) {
        $stats = $statsData.data
        
        Write-Host "📊 ESTATÍSTICAS ATUAIS:" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host "👥 Pacientes Cadastrados: $($stats.pacientesCadastrados.value)" -ForegroundColor White
        Write-Host "   Trend: $($stats.pacientesCadastrados.trend)" -ForegroundColor Gray
        Write-Host "   Real Data: $($stats.pacientesCadastrados.realData)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📋 Prontuários Criados: $($stats.prontuariosCriados.value)" -ForegroundColor White
        Write-Host "   Trend: $($stats.prontuariosCriados.trend)" -ForegroundColor Gray
        Write-Host "   Real Data: $($stats.prontuariosCriados.realData)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "🔬 Exames Registrados: $($stats.examesRegistrados.value)" -ForegroundColor White
        Write-Host "   Trend: $($stats.examesRegistrados.trend)" -ForegroundColor Gray
        Write-Host "   Real Data: $($stats.examesRegistrados.realData)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "👨‍⚕️ Médicos Ativos: $($stats.medicosAtivos.value)" -ForegroundColor White
        Write-Host "   Trend: $($stats.medicosAtivos.trend)" -ForegroundColor Gray
        Write-Host "   Real Data: $($stats.medicosAtivos.realData)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📈 METADADOS:" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host "⏰ Última atualização: $($statsData.metadata.lastUpdated)" -ForegroundColor White
        Write-Host "🩺 Consultas hoje: $($statsData.metadata.consultasHoje)" -ForegroundColor White
        Write-Host "⚠️ Alertas ativos: $($statsData.metadata.alertasAtivos)" -ForegroundColor White
        Write-Host ""
        
        if ($statsData.metadata.realDataSources) {
            Write-Host "🔍 FONTES DE DADOS REAIS:" -ForegroundColor Cyan
            Write-Host "----------------------------------------" -ForegroundColor Gray
            Write-Host "Pacientes: $($statsData.metadata.realDataSources.pacientes)" -ForegroundColor White
            Write-Host "Médicos: $($statsData.metadata.realDataSources.medicos)" -ForegroundColor White
            Write-Host "Prontuários: $($statsData.metadata.realDataSources.prontuarios)" -ForegroundColor White
            Write-Host "Exames: $($statsData.metadata.realDataSources.exames)" -ForegroundColor White
            Write-Host "Alergias: $($statsData.metadata.realDataSources.alergias)" -ForegroundColor White
        }
        
    } else {
        Write-Host "❌ Erro nos dados: $($statsData.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro ao obter estatísticas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Teste concluído!" -ForegroundColor Green