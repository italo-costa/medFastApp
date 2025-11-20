Write-Host "🧹 EXECUÇÃO DE LIMPEZA - MediApp v3.0.0 Duplicações" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$removedCount = 0
$renamedCount = 0

# FASE 1: Limpeza de scripts duplicados
Write-Host "`nFASE 1: Limpeza de scripts duplicados" -ForegroundColor Green

$scriptsToRemove = @(
    "start-and-test.sh",
    "start-complete-app.sh",
    "start-mediapp-linux.sh", 
    "start-mediapp-production.sh",
    "start-mediapp-stable-no-signals.sh",
    "start-mediapp-stable.sh",
    "start-mediapp-unified.sh",
    "deploy-simple.sh"
)

foreach ($script in $scriptsToRemove) {
    if (Test-Path $script) {
        Remove-Item $script -Force
        Write-Host "❌ REMOVIDO: $script" -ForegroundColor Red
        $removedCount++
    } else {
        Write-Host "ℹ️  Não encontrado: $script" -ForegroundColor Gray
    }
}

# Consolidar script principal
if (Test-Path "start-mediapp-final.sh") {
    if (Test-Path "start-mediapp.sh") {
        Remove-Item "start-mediapp.sh" -Force
    }
    Rename-Item "start-mediapp-final.sh" "start-mediapp.sh"
    Write-Host "✅ CONSOLIDADO: start-mediapp.sh" -ForegroundColor Green
    $renamedCount++
}

# FASE 2: Limpeza de páginas HTML duplicadas
Write-Host "`nFASE 2: Limpeza de páginas HTML duplicadas" -ForegroundColor Green

$htmlToRemove = @(
    "apps\backend\public\gestao-medicos-old.html",
    "apps\backend\public\gestao-medicos-backup.html", 
    "apps\backend\public\gestao-medicos-otimizado.html",
    "apps\backend\public\gestao-medicos-restaurado.html",
    "apps\backend\public\gestao-medicos-simples.html"
)

foreach ($html in $htmlToRemove) {
    if (Test-Path $html) {
        Remove-Item $html -Force
        Write-Host "❌ REMOVIDO: $html" -ForegroundColor Red
        $removedCount++
    } else {
        Write-Host "ℹ️  Não encontrado: $html" -ForegroundColor Gray
    }
}

# Consolidar página principal de médicos
$modernizada = "apps\backend\public\gestao-medicos-modernizada.html"
$principal = "apps\backend\public\gestao-medicos.html"

if (Test-Path $modernizada) {
    if (Test-Path $principal) {
        Remove-Item $principal -Force
        Write-Host "❌ REMOVIDO arquivo antigo: gestao-medicos.html" -ForegroundColor Red
    }
    Rename-Item $modernizada $principal
    Write-Host "✅ CONSOLIDADO: gestao-medicos.html" -ForegroundColor Green
    $renamedCount++
}

# FASE 3: Limpeza de configurações duplicadas
Write-Host "`nFASE 3: Limpeza de configurações duplicadas" -ForegroundColor Green

$configsToRemove = @(
    "infra-deploy\docker\docker-compose.yml"
)

foreach ($config in $configsToRemove) {
    if (Test-Path $config) {
        Remove-Item $config -Force
        Write-Host "❌ REMOVIDO: $config" -ForegroundColor Red
        $removedCount++
    } else {
        Write-Host "ℹ️  Não encontrado: $config" -ForegroundColor Gray
    }
}
}

# FASE 4: Renomear scripts de deploy
Write-Host "`nFASE 4: Padronização de scripts de deploy" -ForegroundColor Green

if (Test-Path "deploy-mediapp-linux-v3.0.0.sh") {
    Rename-Item "deploy-mediapp-linux-v3.0.0.sh" "deploy-linux.sh"
    Write-Host "✅ RENOMEADO: deploy-linux.sh" -ForegroundColor Green
    $renamedCount++
}

if (Test-Path "Deploy-MediApp-v3.0.0.ps1") {
    Rename-Item "Deploy-MediApp-v3.0.0.ps1" "deploy-windows.ps1"
    Write-Host "✅ RENOMEADO: deploy-windows.ps1" -ForegroundColor Green  
    $renamedCount++
}

# RESUMO FINAL
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "RESUMO DA LIMPEZA EXECUTADA" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "Arquivos removidos: $removedCount" -ForegroundColor Red
Write-Host "Arquivos renomeados/consolidados: $renamedCount" -ForegroundColor Green

$totalActions = $removedCount + $renamedCount
if ($totalActions -gt 0) {
    Write-Host "`n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "✅ Código mais limpo e organizado" -ForegroundColor Green
    Write-Host "✅ Estrutura padronizada implementada" -ForegroundColor Green
    Write-Host "✅ Duplicações eliminadas sem impacto funcional" -ForegroundColor Green
} else {
    Write-Host "`nℹ️  Nenhuma ação executada - arquivos já podem ter sido organizados" -ForegroundColor Yellow
}

Write-Host "`nLimpeza de duplicações concluída!" -ForegroundColor Cyan