# MOBILE CLEANUP - Limpeza de duplicacoes na secao mobile
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MOBILE CLEANUP - Limpeza Seção Mobile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$rootPath = Get-Location
$mobilePath = Join-Path $rootPath "apps\mobile"

# 1. LIMPEZA APKs
Write-Host "`n[1] Limpando APKs duplicados..." -ForegroundColor Yellow

$rootApks = Get-ChildItem $rootPath -Filter "*.apk"
Write-Host "APKs na raiz: $($rootApks.Count)"

if ($rootApks.Count -gt 1) {
    $newestApk = $rootApks | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $oldApks = $rootApks | Where-Object { $_.Name -ne $newestApk.Name }
    
    Write-Host "Mantendo: $($newestApk.Name)" -ForegroundColor Green
    foreach ($oldApk in $oldApks) {
        Write-Host "Removendo: $($oldApk.Name)" -ForegroundColor Red
        Remove-Item $oldApk.FullName -Force
    }
} else {
    Write-Host "OK - Apenas 1 APK na raiz" -ForegroundColor Green
}

# APKs Android
$androidPath = Join-Path $mobilePath "android"
if (Test-Path $androidPath) {
    $androidApks = Get-ChildItem $androidPath -Filter "*.apk" -Recurse
    Write-Host "APKs no Android: $($androidApks.Count)"
    
    if ($androidApks.Count -gt 1) {
        $newestAndroidApk = $androidApks | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $oldAndroidApks = $androidApks | Where-Object { $_.Name -ne $newestAndroidApk.Name }
        
        Write-Host "Mantendo Android: $($newestAndroidApk.Name)" -ForegroundColor Green
        foreach ($oldApk in $oldAndroidApks) {
            Write-Host "Removendo Android: $($oldApk.Name)" -ForegroundColor Red
            Remove-Item $oldApk.FullName -Force
        }
    }
}

# 2. PACKAGE.JSON DUPLICADO
Write-Host "`n[2] Limpando configurações duplicadas..." -ForegroundColor Yellow

$enhancedPackage = Join-Path $mobilePath "package-enhanced.json"
$mainPackage = Join-Path $mobilePath "package.json"

if ((Test-Path $enhancedPackage) -and (Test-Path $mainPackage)) {
    Write-Host "Removendo package-enhanced.json duplicado..." -ForegroundColor Red
    Remove-Item $enhancedPackage -Force
    Write-Host "OK - package-enhanced.json removido" -ForegroundColor Green
} else {
    Write-Host "OK - Sem duplicação de package.json" -ForegroundColor Green
}

# 3. SCRIPTS TEMPORÁRIOS
Write-Host "`n[3] Removendo scripts de análise..." -ForegroundColor Yellow

$tempScripts = @(
    "Analyze-Mobile-Duplicates.ps1",
    "Mobile-Duplicate-Analysis.ps1",
    "Mobile-Cleanup.ps1"
)

foreach ($script in $tempScripts) {
    $scriptPath = Join-Path $rootPath $script
    if (Test-Path $scriptPath) {
        Write-Host "Removendo: $script" -ForegroundColor Red
        Remove-Item $scriptPath -Force
    }
}

# VERIFICAÇÃO FINAL
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICAÇÃO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$finalRootApks = Get-ChildItem $rootPath -Filter "*.apk"
$finalAndroidApks = if (Test-Path $androidPath) { Get-ChildItem $androidPath -Filter "*.apk" -Recurse } else { @() }
$finalMobilePackages = Get-ChildItem $mobilePath -Filter "package*.json"

Write-Host "Estado final:" -ForegroundColor Green
Write-Host "  APKs na raiz: $($finalRootApks.Count)" -ForegroundColor White
Write-Host "  APKs no Android: $($finalAndroidApks.Count)" -ForegroundColor White  
Write-Host "  Configurações mobile: $($finalMobilePackages.Count)" -ForegroundColor White

Write-Host "`nLIMPEZA MOBILE CONCLUÍDA!" -ForegroundColor Green
Write-Host "Seção mobile alinhada com aplicação principal." -ForegroundColor Green