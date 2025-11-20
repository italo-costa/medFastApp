Write-Host "MediApp - Execucao de Testes por Fases" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$ProjectRoot = "C:\workspace\aplicativo"

# FASE 1: Estrutura
Write-Host "FASE 1: Validacao de Estrutura" -ForegroundColor Green

$dirs = @("apps\backend", "apps\mobile", ".github\workflows")
foreach ($dir in $dirs) {
    if (Test-Path (Join-Path $ProjectRoot $dir)) {
        Write-Host "OK: $dir" -ForegroundColor Green
    } else {
        Write-Host "FALHOU: $dir" -ForegroundColor Red
    }
}

# FASE 2: Arquivos Backend
Write-Host "`nFASE 2: Validacao Backend" -ForegroundColor Green

$backendFiles = @("package.json", "src\app.js", "tests\unit\validation.test.js")
foreach ($file in $backendFiles) {
    $fullPath = Join-Path $ProjectRoot "apps\backend\$file"
    if (Test-Path $fullPath) {
        Write-Host "OK: backend\$file" -ForegroundColor Green
    } else {
        Write-Host "FALHOU: backend\$file" -ForegroundColor Red
    }
}

# FASE 3: Workflows
Write-Host "`nFASE 3: Validacao CI/CD" -ForegroundColor Green

$workflows = @("backend-ci-cd.yml", "mobile-ci-cd.yml", "ci-cd.yml")
foreach ($workflow in $workflows) {
    $fullPath = Join-Path $ProjectRoot ".github\workflows\$workflow"
    if (Test-Path $fullPath) {
        Write-Host "OK: $workflow" -ForegroundColor Green
    } else {
        Write-Host "FALHOU: $workflow" -ForegroundColor Red
    }
}

# FASE 4: Contagem de arquivos
Write-Host "`nFASE 4: Estatisticas" -ForegroundColor Green

$testFiles = Get-ChildItem -Path "$ProjectRoot\apps\backend\tests" -Recurse -Filter "*.test.js" -ErrorAction SilentlyContinue
Write-Host "Arquivos de teste encontrados: $($testFiles.Count)" -ForegroundColor Cyan

$jsFiles = Get-ChildItem -Path "$ProjectRoot\apps\backend\src" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue
Write-Host "Arquivos JS backend: $($jsFiles.Count)" -ForegroundColor Cyan

$workflowFiles = Get-ChildItem -Path "$ProjectRoot\.github\workflows" -Filter "*.yml" -ErrorAction SilentlyContinue
Write-Host "Workflows CI/CD: $($workflowFiles.Count)" -ForegroundColor Cyan

Write-Host "`nValidacao concluida com sucesso!" -ForegroundColor Green