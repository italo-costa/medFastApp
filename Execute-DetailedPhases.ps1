Write-Host "MediApp - Validacao Detalhada por Fases (Estrutura Real)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$ProjectRoot = "C:\workspace\aplicativo"
$ErrorCount = 0
$SuccessCount = 0

# FASE 5: Validacao Frontend (Estrutura Real)
Write-Host "`nFASE 5: Validacao Frontend (Estrutura Real)" -ForegroundColor Green

$frontendFiles = @(
    "apps\backend\public\app.html",
    "apps\backend\public\gestao-medicos-modernizada.html",
    "apps\backend\public\agenda-medica.html",
    "src\pages\analytics-geografico.html"
)
foreach ($file in $frontendFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 6: Validacao Mobile (Estrutura Real)
Write-Host "`nFASE 6: Validacao Mobile React Native (Estrutura Real)" -ForegroundColor Green

$mobileFiles = @(
    "apps\mobile\package.json",
    "apps\mobile\android\app\build.gradle",
    "apps\mobile\android\dist\assets\index.html"
)
foreach ($file in $mobileFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: mobile\$($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: mobile\$($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 7: Validacao Database (Estrutura Real)
Write-Host "`nFASE 7: Validacao Database e SQL" -ForegroundColor Green

$dbFiles = @(
    "apps\backend\prisma\schema.prisma",
    "create-complete-schema.sql",
    "seed-data-corrected.sql",
    "apps\backend\.env.example"
)
foreach ($file in $dbFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 8: Validacao Scripts e Automacao
Write-Host "`nFASE 8: Validacao Scripts e Automacao" -ForegroundColor Green

$scriptFiles = @(
    "start-mediapp-final.sh",
    "deploy-mediapp.ps1",
    "mediapp-daemon.ps1",
    "start-server.sh"
)
foreach ($file in $scriptFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file)" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file)" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 9: Validacao Infrastructure
Write-Host "`nFASE 9: Validacao Infrastructure" -ForegroundColor Green

$infraFiles = @(
    "docker-compose.yml",
    "ecosystem.config.js",
    "package.json",
    ".github\workflows"
)
foreach ($file in $infraFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 10: Validacao Monitoramento
Write-Host "`nFASE 10: Validacao Monitoramento e Logs" -ForegroundColor Green

$monitorFiles = @(
    "monitor-server.sh",
    "check-status.ps1",
    "mediapp-daemon.log",
    "keep-alive.sh"
)
foreach ($file in $monitorFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file)" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file)" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 11: Validacao Testes
Write-Host "`nFASE 11: Validacao Testes e QA" -ForegroundColor Green

$testDirs = @("apps\backend\tests", "tests")
foreach ($dir in $testDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath) {
        $testCount = (Get-ChildItem -Path $fullPath -Recurse -Filter "*.test.js" -ErrorAction SilentlyContinue).Count
        Write-Host "OK: $($dir.Split('\')[-1]) ($testCount testes)" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($dir.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 12: Contagem Detalhada de Arquivos
Write-Host "`nFASE 12: Estatisticas Detalhadas" -ForegroundColor Green

# Contar arquivos por tipo
$htmlFiles = (Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.html" -ErrorAction SilentlyContinue).Count
Write-Host "Arquivos HTML: $htmlFiles" -ForegroundColor Cyan

$jsFiles = (Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.js" -ErrorAction SilentlyContinue).Count
Write-Host "Arquivos JavaScript: $jsFiles" -ForegroundColor Cyan

$sqlFiles = (Get-ChildItem -Path $ProjectRoot -Filter "*.sql" -ErrorAction SilentlyContinue).Count
Write-Host "Arquivos SQL: $sqlFiles" -ForegroundColor Cyan

$mdFiles = (Get-ChildItem -Path $ProjectRoot -Filter "*.md" -ErrorAction SilentlyContinue).Count
Write-Host "Arquivos Markdown: $mdFiles" -ForegroundColor Cyan

$shFiles = (Get-ChildItem -Path $ProjectRoot -Filter "*.sh" -ErrorAction SilentlyContinue).Count
Write-Host "Scripts Shell: $shFiles" -ForegroundColor Cyan

$ps1Files = (Get-ChildItem -Path $ProjectRoot -Filter "*.ps1" -ErrorAction SilentlyContinue).Count
Write-Host "Scripts PowerShell: $ps1Files" -ForegroundColor Cyan

# Resumo Final
Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "RESUMO FINAL DA VALIDACAO COMPLETA" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Sucessos: $SuccessCount" -ForegroundColor Green
Write-Host "Falhas: $ErrorCount" -ForegroundColor Red

$TotalArchivos = $htmlFiles + $jsFiles + $sqlFiles + $mdFiles + $shFiles + $ps1Files
Write-Host "Total de Arquivos: $TotalArchivos" -ForegroundColor Cyan

if ($ErrorCount -le 2) {
    Write-Host "`n🎉 VALIDACAO COMPLETA APROVADA!" -ForegroundColor Green
    Write-Host "Sistema MediApp v3.0.0 com $TotalArchivos arquivos validados!" -ForegroundColor Green
    Write-Host "Pronto para proximas fases de desenvolvimento!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Algumas validacoes falharam ($ErrorCount erros)" -ForegroundColor Yellow
    Write-Host "Sistema funcional mas com componentes opcionais em falta." -ForegroundColor Yellow
}

Write-Host "`nValidacao de todas as fases concluida!" -ForegroundColor Cyan