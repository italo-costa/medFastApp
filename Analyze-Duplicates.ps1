Write-Host "MediApp - Análise de Duplicações de Código" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$ProjectRoot = "C:\workspace\aplicativo"
$DuplicateFiles = @()
$SimilarFiles = @()

# FASE 1: Análise de arquivos HTML duplicados
Write-Host "`nFASE 1: Analisando arquivos HTML duplicados" -ForegroundColor Green

$htmlFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.html" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Length -gt 0 } | 
    Select-Object Name, FullName, Length | 
    Group-Object Name

foreach ($group in $htmlFiles) {
    if ($group.Count -gt 1) {
        Write-Host "DUPLICADO: $($group.Name) ($($group.Count) arquivos)" -ForegroundColor Yellow
        $DuplicateFiles += $group
        foreach ($file in $group.Group) {
            Write-Host "  - $($file.FullName) ($($file.Length) bytes)" -ForegroundColor Gray
        }
    }
}

# FASE 2: Análise de arquivos JavaScript duplicados  
Write-Host "`nFASE 2: Analisando arquivos JavaScript duplicados" -ForegroundColor Green

$jsFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.js" -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 100 -and $_.Name -notlike "*.min.js" } |
    Select-Object Name, FullName, Length |
    Group-Object Name

foreach ($group in $jsFiles) {
    if ($group.Count -gt 1) {
        Write-Host "DUPLICADO: $($group.Name) ($($group.Count) arquivos)" -ForegroundColor Yellow
        $DuplicateFiles += $group
        foreach ($file in $group.Group) {
            Write-Host "  - $($file.FullName) ($($file.Length) bytes)" -ForegroundColor Gray
        }
    }
}

# FASE 3: Análise de scripts de deploy/start duplicados
Write-Host "`nFASE 3: Analisando scripts duplicados" -ForegroundColor Green

$scriptPatterns = @("start-*", "deploy-*", "install-*", "*mediapp*")
foreach ($pattern in $scriptPatterns) {
    $scripts = Get-ChildItem -Path $ProjectRoot -Filter $pattern -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 0 } |
        Select-Object Name, FullName, Length

    if ($scripts.Count -gt 3) {
        Write-Host "PADRÃO DUPLICADO: $pattern ($($scripts.Count) arquivos)" -ForegroundColor Yellow
        $SimilarFiles += @{ Pattern = $pattern; Files = $scripts }
        
        foreach ($script in $scripts | Select-Object -First 5) {
            Write-Host "  - $($script.Name) ($($script.Length) bytes)" -ForegroundColor Gray
        }
        if ($scripts.Count -gt 5) {
            Write-Host "  ... e mais $($scripts.Count - 5) arquivos" -ForegroundColor Gray
        }
    }
}

# FASE 4: Análise de arquivos de configuração similares
Write-Host "`nFASE 4: Analisando configurações duplicadas" -ForegroundColor Green

$configFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.json", "*.yml", "*.yaml" -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 0 } |
    Select-Object Name, FullName, Length |
    Group-Object Name

foreach ($group in $configFiles) {
    if ($group.Count -gt 1 -and $group.Name -ne "package.json") {
        Write-Host "CONFIG DUPLICADO: $($group.Name) ($($group.Count) arquivos)" -ForegroundColor Yellow
        foreach ($file in $group.Group) {
            Write-Host "  - $($file.FullName) ($($file.Length) bytes)" -ForegroundColor Gray
        }
    }
}

# FASE 5: Contagem de totais
Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "RESUMO DE DUPLICAÇÕES ENCONTRADAS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

Write-Host "Arquivos com nomes duplicados: $($DuplicateFiles.Count)" -ForegroundColor Yellow
Write-Host "Padrões com múltiplos arquivos: $($SimilarFiles.Count)" -ForegroundColor Yellow

if ($DuplicateFiles.Count -gt 0 -or $SimilarFiles.Count -gt 0) {
    Write-Host "`n⚠️  DUPLICAÇÕES DETECTADAS - Análise detalhada necessária" -ForegroundColor Red
} else {
    Write-Host "`n✅ NENHUMA DUPLICAÇÃO CRÍTICA DETECTADA" -ForegroundColor Green
}

Write-Host "`nAnálise de duplicações concluída!" -ForegroundColor Cyan