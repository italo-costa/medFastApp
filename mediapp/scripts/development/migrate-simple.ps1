# Script de Migração Simples - MediApp v2.0
Write-Host "🚀 Iniciando migração para estrutura centralizada..." -ForegroundColor Green

$oldPath = "C:\workspace\aplicativo\backend"
$newPath = "C:\workspace\aplicativo\mediapp\apps\backend"

# Copiar estrutura src
if (Test-Path "$oldPath\src") {
    Write-Host "📋 Copiando estrutura src..." -ForegroundColor Yellow
    Copy-Item -Path "$oldPath\src\*" -Destination "$newPath\src\" -Recurse -Force
    Write-Host "   ✅ Estrutura src copiada" -ForegroundColor Green
}

# Copiar package.json
if (Test-Path "$oldPath\package.json") {
    Write-Host "📦 Copiando package.json..." -ForegroundColor Yellow
    Copy-Item -Path "$oldPath\package.json" -Destination "$newPath\package.json" -Force
    Write-Host "   ✅ package.json copiado" -ForegroundColor Green
}

# Copiar prisma
if (Test-Path "$oldPath\prisma") {
    Write-Host "🗄️ Copiando schema Prisma..." -ForegroundColor Yellow
    Copy-Item -Path "$oldPath\prisma" -Destination "$newPath\prisma" -Recurse -Force
    Write-Host "   ✅ Schema Prisma copiado" -ForegroundColor Green
}

# Copiar public
if (Test-Path "$oldPath\public") {
    Write-Host "🌐 Copiando arquivos públicos..." -ForegroundColor Yellow
    Copy-Item -Path "$oldPath\public" -Destination "$newPath\public" -Recurse -Force
    Write-Host "   ✅ Arquivos públicos copiados" -ForegroundColor Green
}

# Copiar .env.example
if (Test-Path "$oldPath\.env.example") {
    Write-Host "🔐 Copiando .env.example..." -ForegroundColor Yellow
    Copy-Item -Path "$oldPath\.env.example" -Destination "$newPath\.env.example" -Force
    Write-Host "   ✅ .env.example copiado" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Migração concluída com sucesso!" -ForegroundColor Green
Write-Host "📁 Backend disponível em: $newPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. cd $newPath" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White