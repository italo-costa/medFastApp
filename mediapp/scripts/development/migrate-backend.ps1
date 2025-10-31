# Script de Migração Automática - MediApp v2.0 (Windows)
# Copia toda a estrutura do backend para a nova arquitetura centralizada

Write-Host "🚀 Iniciando migração para estrutura centralizada..." -ForegroundColor Green

# Definir caminhos
$oldBackend = "C:\workspace\aplicativo\backend"
$newBackend = "C:\workspace\aplicativo\mediapp\apps\backend"

# Função para copiar diretório com verificação
function Copy-SafeDirectory {
    param($source, $destination, $name)
    
    Write-Host "📋 Copiando $name..." -ForegroundColor Yellow
    
    if (Test-Path $source) {
        if (!(Test-Path $destination)) {
            Copy-Item -Path $source -Destination $destination -Recurse -Force
            Write-Host "   ✅ $name copiado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $name já existe, pulando..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ $name não encontrado em $source" -ForegroundColor Red
    }
}

# Função para copiar arquivo individual
function Copy-SafeFile {
    param($source, $destination, $name)
    
    Write-Host "📄 Copiando $name..." -ForegroundColor Yellow
    
    if (Test-Path $source) {
        if (!(Test-Path $destination)) {
            $destDir = Split-Path $destination -Parent
            if (!(Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item -Path $source -Destination $destination -Force
            Write-Host "   ✅ $name copiado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $name já existe, pulando..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ $name não encontrado em $source" -ForegroundColor Red
    }
}

# Criar estrutura base se não existir
if (!(Test-Path "$newBackend\src")) {
    New-Item -ItemType Directory -Path "$newBackend\src" -Force | Out-Null
}

# Copiar diretórios
Copy-SafeDirectory "$oldBackend\src\config" "$newBackend\src\config" "Config"
Copy-SafeDirectory "$oldBackend\src\controllers" "$newBackend\src\controllers" "Controllers"
Copy-SafeDirectory "$oldBackend\src\middleware" "$newBackend\src\middleware" "Middleware"
Copy-SafeDirectory "$oldBackend\src\routes" "$newBackend\src\routes" "Routes"
Copy-SafeDirectory "$oldBackend\src\services" "$newBackend\src\services" "Services"
Copy-SafeDirectory "$oldBackend\src\utils" "$newBackend\src\utils" "Utils"
Copy-SafeDirectory "$oldBackend\prisma" "$newBackend\prisma" "Prisma Schema"
Copy-SafeDirectory "$oldBackend\public" "$newBackend\public" "Public Files"

# Copiar arquivos individuais
Copy-SafeFile "$oldBackend\package.json" "$newBackend\package.json" "package.json"
Copy-SafeFile "$oldBackend\.env.example" "$newBackend\.env.example" ".env.example"
Copy-SafeFile "$oldBackend\README.md" "$newBackend\README.md" "README.md"

Write-Host ""
Write-Host "✅ Migração concluída!" -ForegroundColor Green
Write-Host "📁 Nova estrutura disponível em: $newBackend" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. cd $newBackend" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
    
    # Perguntar se deve instalar dependências automaticamente
    $install = Read-Host "Deseja instalar as dependências automaticamente? (y/N)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
        Set-Location $newBackend
        npm install
        Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Node.js não encontrado. Instale o Node.js antes de continuar." -ForegroundColor Yellow
}