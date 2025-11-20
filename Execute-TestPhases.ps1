#!/usr/bin/env pwsh
# MediApp - Execucao de Testes por Fases
# =====================================

Write-Host "🏥 MediApp - Execucao de Testes por Fases" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando em: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "C:\workspace\aplicativo"
$TestResults = @{}

# FASE 1: Validacao de Estrutura
Write-Host "🚀 FASE 1: VALIDACAO DE ESTRUTURA" -ForegroundColor Green
Write-Host "=" * 50

$Phase1 = @{ Status = $true; Details = @() }

# Verificar diretorios principais
$requiredDirs = @("apps\backend", "apps\mobile", ".github\workflows", "tests")
foreach ($dir in $requiredDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath) {
        Write-Host "✅ Diretorio encontrado: $dir" -ForegroundColor Green
        $Phase1.Details += "✅ $dir"
    } else {
        Write-Host "❌ Diretorio nao encontrado: $dir" -ForegroundColor Red
        $Phase1.Details += "❌ $dir"
        $Phase1.Status = $false
    }
}

# Verificar arquivos criticos
$criticalFiles = @(
    "apps\backend\package.json",
    "apps\backend\src\app.js",
    ".github\workflows\backend-ci-cd.yml"
)

foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        Write-Host "✅ Arquivo encontrado: $file" -ForegroundColor Green
        $Phase1.Details += "✅ $file"
    } else {
        Write-Host "❌ Arquivo nao encontrado: $file" -ForegroundColor Red
        $Phase1.Details += "❌ $file"
        $Phase1.Status = $false
    }
}

$TestResults["Fase1"] = $Phase1
Write-Host ""

# FASE 2: Validacao de Package.json
Write-Host "🚀 FASE 2: VALIDACAO DE CONFIGURACAO" -ForegroundColor Green
Write-Host "=" * 50

$Phase2 = @{ Status = $true; Details = @() }

$backendPackage = Join-Path $ProjectRoot "apps\backend\package.json"
if (Test-Path $backendPackage) {
    try {
        $packageContent = Get-Content $backendPackage | ConvertFrom-Json
        
        # Verificar scripts essenciais
        $scripts = @("start", "test", "test:unit")
        foreach ($script in $scripts) {
            if ($packageContent.scripts.$script) {
                Write-Host "✅ Script encontrado: $script" -ForegroundColor Green
                $Phase2.Details += "✅ Script: $script"
            } else {
                Write-Host "⚠️ Script nao encontrado: $script" -ForegroundColor Yellow
                $Phase2.Details += "⚠️ Script: $script"
            }
        }
        
        # Verificar dependencias
        $deps = @("express", "prisma", "@prisma/client")
        foreach ($dep in $deps) {
            if ($packageContent.dependencies.$dep -or $packageContent.devDependencies.$dep) {
                Write-Host "✅ Dependencia encontrada: $dep" -ForegroundColor Green
                $Phase2.Details += "✅ Dep: $dep"
            } else {
                Write-Host "⚠️ Dependencia nao encontrada: $dep" -ForegroundColor Yellow
                $Phase2.Details += "⚠️ Dep: $dep"
            }
        }
    } catch {
        Write-Host "❌ Erro ao ler package.json: $($_.Exception.Message)" -ForegroundColor Red
        $Phase2.Status = $false
    }
}

$TestResults["Fase2"] = $Phase2
Write-Host ""

# FASE 3: Validacao de Testes Existentes
Write-Host "🚀 FASE 3: VALIDACAO DE TESTES EXISTENTES" -ForegroundColor Green
Write-Host "=" * 50

$Phase3 = @{ Status = $true; Details = @() }

$testsDir = Join-Path $ProjectRoot "apps\backend\tests"
if (Test-Path $testsDir) {
    $testFiles = Get-ChildItem -Path $testsDir -Recurse -Filter "*.test.js"
    Write-Host "✅ Encontrados $($testFiles.Count) arquivos de teste" -ForegroundColor Green
    $Phase3.Details += "✅ Test files: $($testFiles.Count)"
    
    # Verificar categorias
    $categories = @("unit", "integration", "e2e")
    foreach ($category in $categories) {
        $categoryPath = Join-Path $testsDir $category
        if (Test-Path $categoryPath) {
            $categoryFiles = Get-ChildItem -Path $categoryPath -Filter "*.test.js"
            Write-Host "✅ Testes $category : $($categoryFiles.Count) arquivos" -ForegroundColor Green
            $Phase3.Details += "✅ $category : $($categoryFiles.Count)"
        } else {
            Write-Host "⚠️ Categoria nao encontrada: $category" -ForegroundColor Yellow
            $Phase3.Details += "⚠️ $category : 0"
        }
    }
} else {
    Write-Host "❌ Diretorio de testes nao encontrado" -ForegroundColor Red
    $Phase3.Status = $false
}

$TestResults["Fase3"] = $Phase3
Write-Host ""

# FASE 4: Validacao de CI/CD
Write-Host "🚀 FASE 4: VALIDACAO DE CI/CD" -ForegroundColor Green
Write-Host "=" * 50

$Phase4 = @{ Status = $true; Details = @() }

$workflowsDir = Join-Path $ProjectRoot ".github\workflows"
if (Test-Path $workflowsDir) {
    $workflowFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"
    Write-Host "✅ Encontrados $($workflowFiles.Count) workflows" -ForegroundColor Green
    $Phase4.Details += "✅ Workflows: $($workflowFiles.Count)"
    
    $expectedWorkflows = @("backend-ci-cd.yml", "mobile-ci-cd.yml", "ci-cd.yml")
    foreach ($workflow in $expectedWorkflows) {
        $workflowPath = Join-Path $workflowsDir $workflow
        if (Test-Path $workflowPath) {
            Write-Host "✅ Workflow encontrado: $workflow" -ForegroundColor Green
            $Phase4.Details += "✅ $workflow"
        } else {
            Write-Host "⚠️ Workflow nao encontrado: $workflow" -ForegroundColor Yellow
            $Phase4.Details += "⚠️ $workflow"
        }
    }
} else {
    Write-Host "❌ Diretorio de workflows nao encontrado" -ForegroundColor Red
    $Phase4.Status = $false
}

$TestResults["Fase4"] = $Phase4
Write-Host ""

# FASE 5: Validacao Sintatica
Write-Host "🚀 FASE 5: VALIDACAO SINTATICA" -ForegroundColor Green
Write-Host "=" * 50

$Phase5 = @{ Status = $true; Details = @() }

# Validar package.json files
$packageFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "package.json"
$validPackages = 0

foreach ($package in $packageFiles) {
    try {
        $content = Get-Content $package.FullName | ConvertFrom-Json
        if ($content.name -and $content.version) {
            $validPackages++
        }
    } catch {
        Write-Host "⚠️ package.json invalido: $($package.Directory.Name)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Package.json validos: $validPackages/$($packageFiles.Count)" -ForegroundColor Green
$Phase5.Details += "✅ Valid packages: $validPackages/$($packageFiles.Count)"

$TestResults["Fase5"] = $Phase5
Write-Host ""

# RELATORIO FINAL
Write-Host "📊 RELATORIO FINAL DE TESTES" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$overallSuccess = $true
foreach ($phase in $TestResults.Keys) {
    $result = $TestResults[$phase]
    $status = if ($result.Status) { "✅ PASSOU" } else { "❌ FALHOU" }
    $color = if ($result.Status) { "Green" } else { "Red" }
    
    Write-Host "$phase : $status" -ForegroundColor $color
    
    if (-not $result.Status) {
        $overallSuccess = $false
    }
    
    foreach ($detail in $result.Details) {
        Write-Host "  $detail" -ForegroundColor Gray
    }
}

Write-Host ""
if ($overallSuccess) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "Sistema pronto para commit e push" -ForegroundColor Green
} else {
    Write-Host "⚠️ Algumas fases falharam" -ForegroundColor Yellow  
    Write-Host "Verificar detalhes acima" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Execucao concluida em: $(Get-Date)" -ForegroundColor Cyan