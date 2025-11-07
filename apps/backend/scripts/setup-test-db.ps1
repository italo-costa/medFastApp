# Script PowerShell para configurar o banco de dados de teste

Write-Host "Configurando banco de dados de teste..." -ForegroundColor Yellow

# Definir variáveis de ambiente
$env:NODE_ENV = "test"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/medifast_test?schema=public"

Write-Host "Definindo variaveis de ambiente..." -ForegroundColor Cyan
Write-Host "NODE_ENV: $env:NODE_ENV" -ForegroundColor Blue
Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Blue

# Executar migrations no banco de teste
Write-Host "Executando migrations no banco de teste..." -ForegroundColor Cyan
npx prisma migrate deploy

# Gerar cliente Prisma  
Write-Host "Gerando cliente Prisma..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Banco de teste configurado com sucesso!" -ForegroundColor Green
Write-Host "Agora voce pode executar os testes com: npm test" -ForegroundColor Yellow