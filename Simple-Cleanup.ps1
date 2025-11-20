Write-Host "Limpeza de Duplicacoes - MediApp v3.0.0" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$removedFiles = 0

# Listar arquivos antes da limpeza
Write-Host "`nArquivos antes da limpeza:" -ForegroundColor Yellow
$startScripts = Get-ChildItem -Filter "start-*.sh" | Measure-Object
Write-Host "Scripts start-*: $($startScripts.Count)" -ForegroundColor Gray

$htmlFiles = Get-ChildItem -Path "apps\backend\public\" -Filter "gestao-medicos-*.html" -ErrorAction SilentlyContinue | Measure-Object
Write-Host "Arquivos gestao-medicos-*: $($htmlFiles.Count)" -ForegroundColor Gray

# FASE 1: Remover scripts start duplicados
Write-Host "`nFASE 1: Removendo scripts start duplicados" -ForegroundColor Green

$scriptsRemover = @("start-and-test.sh", "start-complete-app.sh", "start-mediapp-linux.sh")
foreach ($script in $scriptsRemover) {
    if (Test-Path $script) {
        Remove-Item $script
        Write-Host "Removido: $script" -ForegroundColor Red
        $removedFiles++
    }
}

# FASE 2: Remover páginas HTML duplicadas  
Write-Host "`nFASE 2: Removendo páginas HTML duplicadas" -ForegroundColor Green

$htmlRemover = @(
    "apps\backend\public\gestao-medicos-old.html",
    "apps\backend\public\gestao-medicos-backup.html"
)

foreach ($html in $htmlRemover) {
    if (Test-Path $html) {
        Remove-Item $html
        Write-Host "Removido: $html" -ForegroundColor Red
        $removedFiles++
    }
}

# FASE 3: Consolidar arquivo principal
Write-Host "`nFASE 3: Consolidando arquivos principais" -ForegroundColor Green

if (Test-Path "start-mediapp-final.sh") {
    if (Test-Path "start-mediapp.sh") {
        Remove-Item "start-mediapp.sh"
    }
    Rename-Item "start-mediapp-final.sh" "start-mediapp.sh"
    Write-Host "Consolidado: start-mediapp.sh" -ForegroundColor Green
}

# Listar arquivos após limpeza
Write-Host "`nArquivos após limpeza:" -ForegroundColor Yellow
$startScriptsAfter = Get-ChildItem -Filter "start-*.sh" | Measure-Object
Write-Host "Scripts start-*: $($startScriptsAfter.Count)" -ForegroundColor Gray

$htmlFilesAfter = Get-ChildItem -Path "apps\backend\public\" -Filter "gestao-medicos-*.html" -ErrorAction SilentlyContinue | Measure-Object
Write-Host "Arquivos gestao-medicos-*: $($htmlFilesAfter.Count)" -ForegroundColor Gray

Write-Host "`nTotal de arquivos removidos: $removedFiles" -ForegroundColor Green
Write-Host "Limpeza concluida!" -ForegroundColor Cyan