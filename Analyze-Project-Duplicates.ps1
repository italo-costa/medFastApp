Write-Host "MediApp - Análise de Duplicações APENAS do Código do Projeto" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$ProjectRoot = "C:\workspace\aplicativo"
$ProjectDuplicates = @()
$FunctionalDuplicates = @()

# Excluir node_modules da análise
$ExcludePaths = @("*node_modules*", "*\.git*", "*dist*", "*build*")

# FASE 1: Análise de arquivos HTML do projeto (sem node_modules)
Write-Host "`nFASE 1: Analisando HTML do projeto" -ForegroundColor Green

$projectHtmlFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.html" -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*\.git*" -and 
        $_.Length -gt 100 
    } | 
    Select-Object Name, FullName, Length

# Agrupar por nome para encontrar duplicatas
$htmlGroups = $projectHtmlFiles | Group-Object Name
foreach ($group in $htmlGroups) {
    if ($group.Count -gt 1) {
        Write-Host "HTML DUPLICADO: $($group.Name) ($($group.Count) arquivos)" -ForegroundColor Yellow
        $ProjectDuplicates += $group
        foreach ($file in $group.Group) {
            Write-Host "  - $($file.FullName.Replace($ProjectRoot, '.'))" -ForegroundColor Gray
        }
    }
}

# FASE 2: Análise de scripts duplicados do projeto
Write-Host "`nFASE 2: Analisando scripts do projeto" -ForegroundColor Green

# Scripts de start
$startScripts = Get-ChildItem -Path $ProjectRoot -Filter "start-*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 0 } |
    Select-Object Name, FullName, Length

if ($startScripts.Count -gt 1) {
    Write-Host "SCRIPTS START DUPLICADOS: $($startScripts.Count) arquivos" -ForegroundColor Yellow
    foreach ($script in $startScripts | Select-Object -First 8) {
        Write-Host "  - $($script.Name) ($($script.Length) bytes)" -ForegroundColor Gray
    }
}

# Scripts de deploy
$deployScripts = Get-ChildItem -Path $ProjectRoot -Filter "deploy-*" -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 0 } |
    Select-Object Name, FullName, Length

if ($deployScripts.Count -gt 1) {
    Write-Host "SCRIPTS DEPLOY DUPLICADOS: $($deployScripts.Count) arquivos" -ForegroundColor Yellow
    foreach ($script in $deployScripts) {
        Write-Host "  - $($script.Name) ($($script.Length) bytes)" -ForegroundColor Gray
    }
}

# FASE 3: Análise de funcionalidades similares
Write-Host "`nFASE 3: Analisando funcionalidades similares" -ForegroundColor Green

# Gestão de médicos
$medicoFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*medico*" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" -and $_.Length -gt 0 }

Write-Host "Arquivos relacionados a MÉDICOS: $($medicoFiles.Count)" -ForegroundColor Cyan
foreach ($file in $medicoFiles | Select-Object -First 5) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}

# Gestão de pacientes
$pacienteFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*paciente*" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" -and $_.Length -gt 0 }

Write-Host "Arquivos relacionados a PACIENTES: $($pacienteFiles.Count)" -ForegroundColor Cyan
foreach ($file in $pacienteFiles | Select-Object -First 5) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}

# FASE 4: Análise de arquivos de configuração duplicados
Write-Host "`nFASE 4: Analisando configurações do projeto" -ForegroundColor Green

# Package.json duplicados
$packageJsons = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "package.json" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" }

Write-Host "Arquivos package.json do projeto: $($packageJsons.Count)" -ForegroundColor Cyan
foreach ($pkg in $packageJsons) {
    Write-Host "  - $($pkg.FullName.Replace($ProjectRoot, '.'))" -ForegroundColor Gray
}

# Docker compose duplicados
$dockerFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*docker-compose*" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" }

if ($dockerFiles.Count -gt 1) {
    Write-Host "Docker Compose DUPLICADOS: $($dockerFiles.Count)" -ForegroundColor Yellow
    foreach ($docker in $dockerFiles) {
        Write-Host "  - $($docker.FullName.Replace($ProjectRoot, '.'))" -ForegroundColor Gray
    }
}

# FASE 5: Contagem final e recomendacoes
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "ANALISE DE DUPLICACOES DO PROJETO" -ForegroundColor Cyan  
Write-Host "================================================================" -ForegroundColor Cyan

Write-Host "Scripts START encontrados: $($startScripts.Count)" -ForegroundColor Yellow
Write-Host "Scripts DEPLOY encontrados: $($deployScripts.Count)" -ForegroundColor Yellow
Write-Host "Arquivos MEDICOS: $($medicoFiles.Count)" -ForegroundColor Cyan
Write-Host "Arquivos PACIENTES: $($pacienteFiles.Count)" -ForegroundColor Cyan
Write-Host "Package.json: $($packageJsons.Count)" -ForegroundColor Cyan

$TotalProjectDuplicates = $startScripts.Count + $deployScripts.Count + $ProjectDuplicates.Count

if ($TotalProjectDuplicates -gt 10) {
    Write-Host "`nMUITAS DUPLICACOES ENCONTRADAS ($TotalProjectDuplicates)" -ForegroundColor Red
    Write-Host "RECOMENDACAO: Refatoracao necessaria para limpeza" -ForegroundColor Red
} elseif ($TotalProjectDuplicates -gt 5) {
    Write-Host "`nDUPLICACOES MODERADAS ($TotalProjectDuplicates)" -ForegroundColor Yellow
    Write-Host "RECOMENDACAO: Revisar e consolidar arquivos" -ForegroundColor Yellow
} else {
    Write-Host "`nPOUCAS DUPLICACOES ($TotalProjectDuplicates)" -ForegroundColor Green
    Write-Host "RECOMENDACAO: Estrutura aceitavel" -ForegroundColor Green
}

Write-Host "`nAnalise de duplicacoes do projeto concluida!" -ForegroundColor Cyan