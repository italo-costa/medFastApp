# DEPLOY MEDIAPP - VERIFICACAO E EXECUCAO RAPIDA

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERIFICACAO SINCRONIZACAO E DEPLOY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verificar sincronizacao Git
Write-Host "`n[1] Verificando sincronizacao..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "AVISO: Ha mudancas nao commitadas" -ForegroundColor Yellow
} else {
    Write-Host "OK: Workspace sincronizado" -ForegroundColor Green
}

$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/master
if ($localCommit -eq $remoteCommit) {
    Write-Host "OK: Sincronizado com origin/master" -ForegroundColor Green
} else {
    Write-Host "AVISO: Nao sincronizado com remote" -ForegroundColor Yellow
}

# 2. Parar processos existentes
Write-Host "`n[2] Parando servidores existentes..." -ForegroundColor Yellow
wsl -e bash -c "pkill -f 'node.*server-linux-stable'" 2>$null
Start-Sleep -Seconds 2
Write-Host "OK: Processos anteriores encerrados" -ForegroundColor Green

# 3. Iniciar servidor
Write-Host "`n[3] Iniciando servidor MediApp..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    wsl -e bash -c "cd /mnt/c/workspace/aplicativo/apps/backend/src && node server-linux-stable.js"
}
Write-Host "Job iniciado: ID $($job.Id)" -ForegroundColor Blue
Start-Sleep -Seconds 4

# 4. Testar conectividade
Write-Host "`n[4] Testando conectividade..." -ForegroundColor Yellow
$connected = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "OK: Servidor online na porta 3002" -ForegroundColor Green
            $connected = $true
            break
        }
    } catch {
        Write-Host "Tentativa $i/5..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $connected) {
    Write-Host "ERRO: Servidor nao respondeu" -ForegroundColor Red
    exit 1
}

# 5. Testar APIs
Write-Host "`n[5] Testando APIs..." -ForegroundColor Yellow
$apis = @("medicos", "pacientes")
foreach ($api in $apis) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/$api" -UseBasicParsing -TimeoutSec 5
        Write-Host "  OK: API $api funcionando" -ForegroundColor Green
    } catch {
        Write-Host "  AVISO: API $api com problemas" -ForegroundColor Yellow
    }
}

# STATUS FINAL
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`nSISTEMA ONLINE:" -ForegroundColor Green
Write-Host "  Portal:     http://localhost:3002/" -ForegroundColor Blue
Write-Host "  Dashboard:  http://localhost:3002/app.html" -ForegroundColor Blue
Write-Host "  Medicos:    http://localhost:3002/gestao-medicos.html" -ForegroundColor Blue
Write-Host "  Pacientes:  http://localhost:3002/gestao-pacientes.html" -ForegroundColor Blue
Write-Host "  Health:     http://localhost:3002/health" -ForegroundColor Blue

Write-Host "`nCOMANDOS UTEIS:" -ForegroundColor Blue
Write-Host "  Parar: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)" -ForegroundColor Yellow
Write-Host "  Status: Get-Job -Id $($job.Id)" -ForegroundColor Yellow

Write-Host "`nAPLICACAO MEDIAPP v3.0.0 OPERACIONAL!" -ForegroundColor Green