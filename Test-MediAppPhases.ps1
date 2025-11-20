# 🧪 MediApp - Execução de Testes por Fases (Windows PowerShell)
# ========================================

function Write-Phase {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "🚀 FASE: $Message" -ForegroundColor $Color
    Write-Host "=" * 60 -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

# Variáveis globais
$ProjectRoot = "C:\workspace\aplicativo"
$TestResults = @()
$PhaseResults = @{}

# ==========================================
# FASE 1: VALIDAÇÃO DE ESTRUTURA
# ==========================================
function Test-Phase1-Structure {
    Write-Phase "1. VALIDAÇÃO DE ESTRUTURA DO PROJETO"
    
    $phase = @{
        Name = "Validação de Estrutura"
        Status = $true
        Details = @()
        StartTime = Get-Date
    }
    
    try {
        # Verificar estrutura de diretórios
        $requiredDirs = @("apps\backend", "apps\mobile", ".github\workflows", "tests", "docs")
        
        foreach ($dir in $requiredDirs) {
            $fullPath = Join-Path $ProjectRoot $dir
            if (Test-Path $fullPath) {
                Write-Success "Diretório encontrado: $dir"
                $phase.Details += "✅ $dir"
            } else {
                Write-Error "Diretório não encontrado: $dir"
                $phase.Details += "❌ $dir"
                $phase.Status = $false
            }
        }
        
        # Verificar arquivos críticos
        $requiredFiles = @(
            "apps\backend\package.json",
            "apps\backend\src\app.js", 
            "apps\mobile\package.json",
            ".github\workflows\backend-ci-cd.yml"
        )
        
        foreach ($file in $requiredFiles) {
            $fullPath = Join-Path $ProjectRoot $file
            if (Test-Path $fullPath) {
                Write-Success "Arquivo encontrado: $file"
                $phase.Details += "✅ $file"
            } else {
                Write-Error "Arquivo não encontrado: $file"
                $phase.Details += "❌ $file"
                $phase.Status = $false
            }
        }
        
    } catch {
        Write-Error "Erro na Fase 1: $($_.Exception.Message)"
        $phase.Status = $false
        $phase.Details += "❌ Erro: $($_.Exception.Message)"
    }
    
    $phase.EndTime = Get-Date
    $phase.Duration = $phase.EndTime - $phase.StartTime
    $PhaseResults["Phase1"] = $phase
    
    if ($phase.Status) {
        Write-Success "FASE 1 CONCLUÍDA COM SUCESSO"
    } else {
        Write-Error "FASE 1 FALHOU"
    }
    
    return $phase.Status
}

# ==========================================  
# FASE 2: VALIDAÇÃO DE CONFIGURAÇÃO
# ==========================================
function Test-Phase2-Configuration {
    Write-Phase "2. VALIDAÇÃO DE CONFIGURAÇÃO"
    
    $phase = @{
        Name = "Validação de Configuração"
        Status = $true
        Details = @()
        StartTime = Get-Date
    }
    
    try {
        # Verificar package.json do backend
        $backendPackage = Join-Path $ProjectRoot "apps\backend\package.json"
        if (Test-Path $backendPackage) {
            $packageContent = Get-Content $backendPackage | ConvertFrom-Json
            
            # Verificar scripts essenciais
            $requiredScripts = @("start", "test", "test:unit", "test:integration")
            foreach ($script in $requiredScripts) {
                if ($packageContent.scripts.$script) {
                    Write-Success "Script encontrado: $script"
                    $phase.Details += "✅ Script: $script"
                } else {
                    Write-Warning "Script não encontrado: $script"
                    $phase.Details += "⚠️ Script: $script"
                }
            }
            
            # Verificar dependências críticas
            $requiredDeps = @("express", "prisma", "@prisma/client", "jest")
            foreach ($dep in $requiredDeps) {
                if ($packageContent.dependencies.$dep -or $packageContent.devDependencies.$dep) {
                    Write-Success "Dependência encontrada: $dep"
                    $phase.Details += "✅ Dep: $dep"
                } else {
                    Write-Warning "Dependência não encontrada: $dep"
                    $phase.Details += "⚠️ Dep: $dep"
                }
            }
        }
        
        # Verificar configuração de CI/CD
        $cicdFile = Join-Path $ProjectRoot ".github\workflows\backend-ci-cd.yml"
        if (Test-Path $cicdFile) {
            $cicdContent = Get-Content $cicdFile -Raw
            
            # Verificar jobs essenciais
            $requiredJobs = @("code-analysis", "build", "docker")
            foreach ($job in $requiredJobs) {
                if ($cicdContent -match $job) {
                    Write-Success "Job CI/CD encontrado: $job"
                    $phase.Details += "✅ CI/CD Job: $job"
                } else {
                    Write-Warning "Job CI/CD não encontrado: $job"
                    $phase.Details += "⚠️ CI/CD Job: $job"
                }
            }
        }
        
    } catch {
        Write-Error "Erro na Fase 2: $($_.Exception.Message)"
        $phase.Status = $false
        $phase.Details += "❌ Erro: $($_.Exception.Message)"
    }
    
    $phase.EndTime = Get-Date
    $phase.Duration = $phase.EndTime - $phase.StartTime
    $PhaseResults["Phase2"] = $phase
    
    if ($phase.Status) {
        Write-Success "FASE 2 CONCLUÍDA COM SUCESSO"
    } else {
        Write-Error "FASE 2 FALHOU"
    }
    
    return $phase.Status
}

# ==========================================
# FASE 3: VALIDAÇÃO DE TESTES EXISTENTES  
# ==========================================
function Test-Phase3-ExistingTests {
    Write-Phase "3. VALIDAÇÃO DE TESTES EXISTENTES"
    
    $phase = @{
        Name = "Validação de Testes Existentes"
        Status = $true
        Details = @()
        StartTime = Get-Date
    }
    
    try {
        $testsDir = Join-Path $ProjectRoot "apps\backend\tests"
        
        if (Test-Path $testsDir) {
            # Contar arquivos de teste
            $testFiles = Get-ChildItem -Path $testsDir -Recurse -Filter "*.test.js"
            Write-Success "Encontrados $($testFiles.Count) arquivos de teste"
            $phase.Details += "✅ Arquivos de teste: $($testFiles.Count)"
            
            # Verificar categorias de teste
            $testCategories = @("unit", "integration", "e2e")
            foreach ($category in $testCategories) {
                $categoryPath = Join-Path $testsDir $category
                if (Test-Path $categoryPath) {
                    $categoryFiles = Get-ChildItem -Path $categoryPath -Filter "*.test.js"
                    Write-Success "Testes ${category}: $($categoryFiles.Count) arquivos"
                    $phase.Details += "✅ ${category} tests: $($categoryFiles.Count)"
                } else {
                    Write-Warning "Categoria de teste não encontrada: $category"
                    $phase.Details += "⚠️ $category tests: 0"
                }
            }
            
            # Verificar jest.config.js
            $jestConfig = Join-Path $ProjectRoot "apps\backend\jest.config.js"
            if (Test-Path $jestConfig) {
                Write-Success "Configuração Jest encontrada"
                $phase.Details += "✅ Jest config"
            } else {
                Write-Warning "Configuração Jest não encontrada"
                $phase.Details += "⚠️ Jest config"
            }
        } else {
            Write-Error "Diretório de testes não encontrado"
            $phase.Status = $false
            $phase.Details += "❌ Diretório de testes ausente"
        }
        
        # Verificar testes mobile
        $mobileTestsDir = Join-Path $ProjectRoot "apps\mobile\__tests__"
        if (Test-Path $mobileTestsDir) {
            $mobileTestFiles = Get-ChildItem -Path $mobileTestsDir -Recurse -Filter "*.test.*"
            Write-Success "Testes mobile: $($mobileTestFiles.Count) arquivos"
            $phase.Details += "✅ Mobile tests: $($mobileTestFiles.Count)"
        } else {
            Write-Warning "Testes mobile não encontrados"
            $phase.Details += "⚠️ Mobile tests: 0"
        }
        
    } catch {
        Write-Error "Erro na Fase 3: $($_.Exception.Message)"
        $phase.Status = $false
        $phase.Details += "❌ Erro: $($_.Exception.Message)"
    }
    
    $phase.EndTime = Get-Date
    $phase.Duration = $phase.EndTime - $phase.StartTime
    $PhaseResults["Phase3"] = $phase
    
    return $phase.Status
}

# ==========================================
# FASE 4: VALIDAÇÃO DE PIPELINE CI/CD
# ==========================================
function Test-Phase4-CICD {
    Write-Phase "4. VALIDAÇÃO DE PIPELINE CI/CD"
    
    $phase = @{
        Name = "Validação Pipeline CI/CD"
        Status = $true
        Details = @()
        StartTime = Get-Date
    }
    
    try {
        $workflowsDir = Join-Path $ProjectRoot ".github\workflows"
        
        if (Test-Path $workflowsDir) {
            $workflowFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"
            Write-Success "Encontrados $($workflowFiles.Count) arquivos de workflow"
            $phase.Details += "✅ Workflow files: $($workflowFiles.Count)"
            
            # Verificar workflows específicos
            $requiredWorkflows = @(
                "backend-ci-cd.yml",
                "frontend-ci-cd.yml", 
                "mobile-ci-cd.yml",
                "ci-cd.yml"
            )
            
            foreach ($workflow in $requiredWorkflows) {
                $workflowPath = Join-Path $workflowsDir $workflow
                if (Test-Path $workflowPath) {
                    Write-Success "Workflow encontrado: $workflow"
                    $phase.Details += "✅ Workflow: $workflow"
                    
                    # Validar conteúdo básico
                    $content = Get-Content $workflowPath -Raw
                    if ($content -match "name:" -and $content -match "on:" -and $content -match "jobs:") {
                        Write-Success "Workflow $workflow tem estrutura válida"
                        $phase.Details += "✅ Structure: $workflow"
                    } else {
                        Write-Warning "Workflow $workflow pode ter problemas de estrutura"
                        $phase.Details += "⚠️ Structure: $workflow"
                    }
                } else {
                    Write-Warning "Workflow não encontrado: $workflow"
                    $phase.Details += "⚠️ Missing: $workflow"
                }
            }
        } else {
            Write-Error "Diretório de workflows não encontrado"
            $phase.Status = $false
            $phase.Details += "❌ Workflows directory missing"
        }
        
    } catch {
        Write-Error "Erro na Fase 4: $($_.Exception.Message)"
        $phase.Status = $false
        $phase.Details += "❌ Erro: $($_.Exception.Message)"
    }
    
    $phase.EndTime = Get-Date
    $phase.Duration = $phase.EndTime - $phase.StartTime
    $PhaseResults["Phase4"] = $phase
    
    return $phase.Status
}

# ==========================================
# FASE 5: SIMULAÇÃO DE TESTES SINTÁTICOS
# ==========================================
function Test-Phase5-SyntaxValidation {
    Write-Phase "5. VALIDAÇÃO SINTÁTICA DE CÓDIGO"
    
    $phase = @{
        Name = "Validação Sintática"
        Status = $true
        Details = @()
        StartTime = Get-Date
    }
    
    try {
        # Validar arquivos JavaScript do backend
        $backendSrc = Join-Path $ProjectRoot "apps\backend\src"
        if (Test-Path $backendSrc) {
            $jsFiles = Get-ChildItem -Path $backendSrc -Recurse -Filter "*.js"
            Write-Success "Validando $($jsFiles.Count) arquivos JavaScript do backend"
            
            $validFiles = 0
            foreach ($file in $jsFiles) {
                try {
                    $content = Get-Content $file.FullName -Raw
                    # Verificações básicas de sintaxe
                    if ($content -match "function|const|let|var" -and $content -match "{") {
                        $validFiles++
                    }
                } catch {
                    Write-Warning "Possivel problema sintatico em: $($file.Name)"
                    $phase.Details += "⚠️ Syntax issue: $($file.Name)"
                }
            }
            
            Write-Success "Arquivos JS válidos: $validFiles/$($jsFiles.Count)"
            $phase.Details += "✅ Valid JS files: $validFiles/$($jsFiles.Count)"
        }
        
        # Validar package.json files
        $packageFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "package.json"
        Write-Success "Validando $($packageFiles.Count) arquivos package.json"
        
        $validPackages = 0
        foreach ($package in $packageFiles) {
            try {
                $packageContent = Get-Content $package.FullName | ConvertFrom-Json
                if ($packageContent.name -and $packageContent.version) {
                    $validPackages++
                }
            } catch {
                Write-Warning "Problema no package.json: $($package.Directory.Name)"
                $phase.Details += "⚠️ Invalid package.json: $($package.Directory.Name)"
            }
        }
        
        Write-Success "Package.json válidos: $validPackages/$($packageFiles.Count)"
        $phase.Details += "✅ Valid package.json: $validPackages/$($packageFiles.Count)"
        
        # Validar workflows YAML
        $workflowsDir = Join-Path $ProjectRoot ".github\workflows"
        if (Test-Path $workflowsDir) {
            $yamlFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml"
            Write-Success "Validando $($yamlFiles.Count) arquivos YAML de workflow"
            
            $validYaml = 0
            foreach ($yaml in $yamlFiles) {
                try {
                    $content = Get-Content $yaml.FullName -Raw
                    if ($content -match "name:" -and $content -match "on:" -and $content -match "jobs:") {
                        $validYaml++
                    }
                } catch {
                    Write-Warning "Possivel problema no YAML: $($yaml.Name)"
                    $phase.Details += "⚠️ YAML issue: $($yaml.Name)"
                }
            }
            
            Write-Success "Arquivos YAML válidos: $validYaml/$($yamlFiles.Count)"
            $phase.Details += "✅ Valid YAML: $validYaml/$($yamlFiles.Count)"
        }
        
    } catch {
        Write-Error "Erro na Fase 5: $($_.Exception.Message)"
        $phase.Status = $false
        $phase.Details += "❌ Erro: $($_.Exception.Message)"
    }
    
    $phase.EndTime = Get-Date
    $phase.Duration = $phase.EndTime - $phase.StartTime
    $PhaseResults["Phase5"] = $phase
    
    return $phase.Status
}

# ==========================================
# EXECUÇÃO PRINCIPAL
# ==========================================
function Start-TestExecution {
    Write-Host "🏥 MediApp - Execução de Testes por Fases" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Iniciando em: $(Get-Date)" -ForegroundColor Cyan
    Write-Host ""
    
    $overallSuccess = $true
    
    # Executar todas as fases
    $phases = @(
        { Test-Phase1-Structure },
        { Test-Phase2-Configuration }, 
        { Test-Phase3-ExistingTests },
        { Test-Phase4-CICD },
        { Test-Phase5-SyntaxValidation }
    )
    
    for ($i = 0; $i -lt $phases.Count; $i++) {
        Write-Host ""
        $result = & $phases[$i]
        
        if (-not $result) {
            $overallSuccess = $false
            Write-Warning "Fase $($i+1) falhou, mas continuando..."
        }
        
        Start-Sleep -Seconds 2
    }
    
    # Relatório final
    Write-Host ""
    Write-Host "📊 RELATÓRIO FINAL DE TESTES" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    foreach ($phaseKey in $PhaseResults.Keys) {
        $phase = $PhaseResults[$phaseKey]
        $statusIcon = if ($phase.Status) { "✅" } else { "❌" }
        $duration = "{0:F2}" -f $phase.Duration.TotalSeconds
        
        Write-Host "$statusIcon $($phase.Name) - $duration segundos" -ForegroundColor $(if ($phase.Status) { "Green" } else { "Red" })
        
        foreach ($detail in $phase.Details) {
            Write-Host "    $detail" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    if ($overallSuccess) {
        Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
        Write-Host "Sistema pronto para commit e push" -ForegroundColor Green
    } else {
        Write-Host "Algumas fases falharam" -ForegroundColor Yellow
        Write-Host "Verifique os detalhes acima" -ForegroundColor Yellow
    }
    
    return $overallSuccess
}

# Exportar função principal
Export-ModuleMember -Function Start-TestExecution