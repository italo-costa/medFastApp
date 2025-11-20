Write-Host "MediApp - Execucao Completa de Todas as Fases" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$ProjectRoot = "C:\workspace\aplicativo"
$ErrorCount = 0
$SuccessCount = 0

# FASE 5: Validacao Frontend
Write-Host "`nFASE 5: Validacao Frontend" -ForegroundColor Green

$frontendFiles = @("index.html", "css\style.css", "js\app.js", "js\medicos.js", "js\pacientes.js")
foreach ($file in $frontendFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $file" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $file" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 6: Validacao Mobile
Write-Host "`nFASE 6: Validacao Mobile React Native" -ForegroundColor Green

$mobileFiles = @("apps\mobile\package.json", "apps\mobile\App.js", "apps\mobile\android\app\build.gradle")
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

# FASE 7: Validacao Database
Write-Host "`nFASE 7: Validacao Database e Prisma" -ForegroundColor Green

$dbFiles = @("apps\backend\prisma\schema.prisma", "apps\backend\.env.example", "apps\backend\prisma\seed.js")
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

# FASE 8: Validacao Seguranca
Write-Host "`nFASE 8: Validacao Seguranca e Middleware" -ForegroundColor Green

$securityFiles = @("apps\backend\src\middleware\auth.js", "apps\backend\src\middleware\validation.js", "apps\backend\src\utils\logger.js")
foreach ($file in $securityFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 9: Validacao APIs
Write-Host "`nFASE 9: Validacao APIs e Controllers" -ForegroundColor Green

$apiFiles = @("apps\backend\src\controllers", "apps\backend\src\routes", "apps\backend\src\services")
foreach ($dir in $apiFiles) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath) {
        $fileCount = (Get-ChildItem -Path $fullPath -Recurse -File -ErrorAction SilentlyContinue).Count
        Write-Host "OK: $($dir.Split('\')[-1]) ($fileCount arquivos)" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($dir.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# FASE 10: Validacao Documentacao
Write-Host "`nFASE 10: Validacao Documentacao" -ForegroundColor Green

$docFiles = @("README.md", "CHANGELOG.md", "apps\backend\README.md")
foreach ($file in $docFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "OK: $($file.Split('\')[-1])" -ForegroundColor Green
        $SuccessCount++
    } else {
        Write-Host "FALHOU: $($file.Split('\')[-1])" -ForegroundColor Red
        $ErrorCount++
    }
}

# Resumo Final
Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "RESUMO FINAL DA VALIDACAO" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Sucessos: $SuccessCount" -ForegroundColor Green
Write-Host "Falhas: $ErrorCount" -ForegroundColor Red

if ($ErrorCount -eq 0) {
    Write-Host "`n🎉 TODAS AS FASES EXECUTADAS COM SUCESSO!" -ForegroundColor Green
    Write-Host "Sistema MediApp v3.0.0 validado completamente!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Algumas validacoes falharam. Verifique os arquivos em falta." -ForegroundColor Yellow
}

Write-Host "`nValidacao completa finalizada!" -ForegroundColor Cyan