Write-Host "Limpeza Final - Consolidação" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$removedFiles = 0

# Scripts start a manter (essenciais)
$scriptsEssenciais = @("start-mediapp.sh", "start-server.sh")
$todosScriptsStart = Get-ChildItem -Filter "start-*.sh"

Write-Host "`nAnálise dos scripts start restantes:" -ForegroundColor Yellow
foreach ($script in $todosScriptsStart) {
    $tamanhoKB = [math]::Round($script.Length / 1024, 1)
    if ($scriptsEssenciais -contains $script.Name) {
        Write-Host "✅ MANTER: $($script.Name) ($tamanhoKB KB)" -ForegroundColor Green
    } else {
        Write-Host "❌ REMOVER: $($script.Name) ($tamanhoKB KB)" -ForegroundColor Red
    }
}

Write-Host "`nExecutando limpeza final:" -ForegroundColor Green

# Remover scripts start não essenciais
$scriptsRemover = @(
    "start-robust-server.sh",
    "start-robust.sh", 
    "start-server-simple.sh",
    "start-simple.sh",
    "start-unified-fixed.sh",
    "start-unified.sh"
)

foreach ($script in $scriptsRemover) {
    if (Test-Path $script) {
        Remove-Item $script
        Write-Host "Removido: $script" -ForegroundColor Red
        $removedFiles++
    }
}

# Limpeza de scripts de deploy redundantes
Write-Host "`nLimpeza de scripts deploy:" -ForegroundColor Green

$deployRemover = @("deploy-simple.sh")
foreach ($deploy in $deployRemover) {
    if (Test-Path $deploy) {
        Remove-Item $deploy
        Write-Host "Removido: $deploy" -ForegroundColor Red
        $removedFiles++
    }
}

# Renomear scripts de deploy para padrão limpo
Write-Host "`nPadronização de nomes:" -ForegroundColor Green

if (Test-Path "deploy-mediapp-linux-v3.0.0.sh") {
    Rename-Item "deploy-mediapp-linux-v3.0.0.sh" "deploy-linux.sh"
    Write-Host "Renomeado: deploy-linux.sh" -ForegroundColor Green
}

if (Test-Path "Deploy-MediApp-v3.0.0.ps1") {
    Rename-Item "Deploy-MediApp-v3.0.0.ps1" "deploy-windows.ps1" 
    Write-Host "Renomeado: deploy-windows.ps1" -ForegroundColor Green
}

# Estado final
Write-Host "`nESTADO FINAL APÓS LIMPEZA COMPLETA:" -ForegroundColor Cyan

$scriptsFinais = Get-ChildItem -Filter "start-*.sh"
Write-Host "Scripts start restantes: $($scriptsFinais.Count)" -ForegroundColor Green
foreach ($script in $scriptsFinais) {
    Write-Host "  - $($script.Name)" -ForegroundColor Gray
}

$deploysFinais = Get-ChildItem -Filter "deploy-*.sh", "deploy-*.ps1"
Write-Host "Scripts deploy restantes: $($deploysFinais.Count)" -ForegroundColor Green
foreach ($deploy in $deploysFinais) {
    Write-Host "  - $($deploy.Name)" -ForegroundColor Gray
}

Write-Host "`nArquivos removidos na limpeza final: $removedFiles" -ForegroundColor Green
Write-Host "`nLIMPEZA COMPLETA FINALIZADA COM SUCESSO!" -ForegroundColor Green
Write-Host "Estrutura limpa e organizada" -ForegroundColor Green
Write-Host "Apenas arquivos essenciais mantidos" -ForegroundColor Green