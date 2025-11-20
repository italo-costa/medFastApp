Write-Host "Limpeza Avançada - Fase 2" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$removedFiles = 0

# Continuar limpeza de scripts start
Write-Host "`nRemoção adicional de scripts start:" -ForegroundColor Green

$moreScripts = @(
    "start-mediapp-production.sh",
    "start-mediapp-stable.sh", 
    "start-mediapp-stable-no-signals.sh",
    "start-mediapp-unified.sh"
)

foreach ($script in $moreScripts) {
    if (Test-Path $script) {
        Remove-Item $script
        Write-Host "Removido: $script" -ForegroundColor Red
        $removedFiles++
    }
}

# Limpeza adicional de páginas HTML
Write-Host "`nRemoção adicional de páginas HTML:" -ForegroundColor Green

$moreHtml = @(
    "apps\backend\public\gestao-medicos-otimizado.html",
    "apps\backend\public\gestao-medicos-restaurado.html",
    "apps\backend\public\gestao-medicos-simples.html"
)

foreach ($html in $moreHtml) {
    if (Test-Path $html) {
        Remove-Item $html
        Write-Host "Removido: $html" -ForegroundColor Red
        $removedFiles++
    }
}

# Consolidar gestão de médicos principal
Write-Host "`nConsolidação final:" -ForegroundColor Green

$modernizada = "apps\backend\public\gestao-medicos-modernizada.html"
$principal = "apps\backend\public\gestao-medicos.html"

if (Test-Path $modernizada) {
    if (Test-Path $principal) {
        Remove-Item $principal
        Write-Host "Removido arquivo antigo: gestao-medicos.html" -ForegroundColor Red
    }
    Rename-Item $modernizada "gestao-medicos.html"
    Write-Host "Consolidado: gestao-medicos.html (versão modernizada)" -ForegroundColor Green
}

# Verificação final
Write-Host "`nEstado final:" -ForegroundColor Yellow

$finalStartScripts = Get-ChildItem -Filter "start-*.sh" | Measure-Object
Write-Host "Scripts start-* restantes: $($finalStartScripts.Count)" -ForegroundColor Gray

$finalHtmlFiles = Get-ChildItem -Path "apps\backend\public\" -Filter "gestao-medicos*.html" -ErrorAction SilentlyContinue | Measure-Object  
Write-Host "Arquivos gestao-medicos* restantes: $($finalHtmlFiles.Count)" -ForegroundColor Gray

Write-Host "`nArquivos removidos nesta fase: $removedFiles" -ForegroundColor Green
Write-Host "Limpeza avançada concluída!" -ForegroundColor Cyan