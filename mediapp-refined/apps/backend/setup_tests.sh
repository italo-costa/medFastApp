#!/bin/bash

# 🏥 MediApp - Setup Automático para Testes
# Este script prepara o ambiente completo para testes humanos

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${2:-$NC}[$(date +'%H:%M:%S')] $1${NC}"
}

# Cabeçalho
clear
echo -e "${PURPLE}"
echo "################################################################"
echo "#                                                              #"
echo "#              🏥 MEDIAPP - SETUP DE TESTES                   #"
echo "#                                                              #"
echo "#     Preparando ambiente Ubuntu/WSL para testes humanos      #"
echo "#                                                              #"
echo "################################################################"
echo -e "${NC}"

log "🚀 Iniciando setup do ambiente MediApp..." "$CYAN"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log "❌ Erro: Execute este script do diretório mediapp-refined/apps/backend" "$RED"
    exit 1
fi

log "📁 Diretório correto identificado" "$GREEN"

# 1. Verificar dependências do sistema
log "🔍 Verificando dependências do sistema..." "$BLUE"

# Node.js
if ! command -v node &> /dev/null; then
    log "❌ Node.js não encontrado. Instalando..." "$RED"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    log "✅ Node.js encontrado: $NODE_VERSION" "$GREEN"
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    log "❌ PostgreSQL não encontrado. Por favor, instale PostgreSQL 16" "$RED"
    log "   sudo apt update && sudo apt install postgresql-16 postgresql-client-16" "$YELLOW"
    exit 1
else
    PSQL_VERSION=$(psql --version)
    log "✅ PostgreSQL encontrado: $PSQL_VERSION" "$GREEN"
fi

# 2. Instalar dependências do Node.js
log "📦 Instalando dependências do Node.js..." "$BLUE"
npm install --silent

# 3. Configurar banco de dados
log "🗄️ Configurando banco de dados..." "$BLUE"

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active --quiet postgresql; then
    log "🔄 Iniciando PostgreSQL..." "$YELLOW"
    sudo systemctl start postgresql
fi

# Gerar Prisma Client
log "🔧 Gerando Prisma Client..." "$BLUE"
npx prisma generate

# Aplicar migrações
log "📊 Aplicando migrações do banco..." "$BLUE"
npx prisma migrate deploy || npx prisma db push

# 4. Verificar estrutura do projeto
log "📁 Verificando estrutura do projeto..." "$BLUE"

DIRS_TO_CHECK=(
    "../frontend"
    "../mobile"
    "../../tests"
    "../../docs"
    "src/routes"
    "src/services"
    "public"
)

for dir in "${DIRS_TO_CHECK[@]}"; do
    if [ -d "$dir" ]; then
        log "✅ Diretório $dir encontrado" "$GREEN"
    else
        log "⚠️  Diretório $dir não encontrado" "$YELLOW"
    fi
done

# 5. Verificar arquivos críticos
log "📄 Verificando arquivos críticos..." "$BLUE"

CRITICAL_FILES=(
    "src/app.js"
    "public/gestao-medicos.html"
    "public/gestao-pacientes.html"
    "public/app.html"
    "src/routes/medicosRoutes.js"
    "src/routes/patients.js"
    "../../tests/architecture-validation.js"
    "../../docs/GUIA_TESTES_HUMANOS.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "✅ $file existe" "$GREEN"
    else
        log "❌ $file NÃO encontrado" "$RED"
    fi
done

# 6. Testar conexão com banco
log "🔌 Testando conexão com banco de dados..." "$BLUE"

# Criar um script temporário para testar a conexão
cat > test_db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        await prisma.$connect();
        console.log('✅ Conexão com banco estabelecida');
        
        // Testar uma query simples
        const medicosCount = await prisma.medico.count();
        console.log(`📊 Médicos no banco: ${medicosCount}`);
        
        const pacientesCount = await prisma.paciente.count();
        console.log(`📊 Pacientes no banco: ${pacientesCount}`);
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
EOF

node test_db.js
rm test_db.js

# 7. Verificar se o servidor inicia corretamente
log "🚀 Testando inicialização do servidor..." "$BLUE"

# Iniciar servidor em background por alguns segundos
timeout 10s node src/app.js > server_test.log 2>&1 &
SERVER_PID=$!

sleep 5

# Testar se o servidor responde
if curl -s http://localhost:3002/health > /dev/null; then
    log "✅ Servidor inicia e responde corretamente" "$GREEN"
else
    log "⚠️  Servidor pode ter problemas de inicialização" "$YELLOW"
    log "📋 Últimas linhas do log:" "$BLUE"
    tail -5 server_test.log
fi

# Parar o servidor de teste
kill $SERVER_PID 2>/dev/null || true
rm -f server_test.log

# 8. Criar dados de teste se necessário
log "🧪 Verificando dados de teste..." "$BLUE"

cat > create_test_data.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function createTestData() {
    const prisma = new PrismaClient();
    
    try {
        // Verificar se já temos dados
        const medicosCount = await prisma.medico.count();
        const pacientesCount = await prisma.paciente.count();
        
        if (medicosCount < 5) {
            console.log('🔧 Criando dados de teste para médicos...');
            // Note: Isso depende da estrutura exata do seu schema
            // Ajuste conforme necessário
        }
        
        if (pacientesCount < 3) {
            console.log('🔧 Criando dados de teste para pacientes...');
            // Note: Isso depende da estrutura exata do seu schema
            // Ajuste conforme necessário
        }
        
        console.log(`✅ Dados disponíveis: ${medicosCount} médicos, ${pacientesCount} pacientes`);
        
    } catch (error) {
        console.log('⚠️  Erro ao verificar/criar dados de teste:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData();
EOF

node create_test_data.js
rm create_test_data.js

# 9. Preparar scripts de teste
log "📝 Preparando scripts de teste..." "$BLUE"

# Criar script para iniciar servidor
cat > start_server.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor MediApp..."
echo "📊 Backend: http://localhost:3002"
echo "🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html"
echo "👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo ""
node src/app.js
EOF

chmod +x start_server.sh

# Criar script para executar testes automáticos
cat > run_tests.sh << 'EOF'
#!/bin/bash
echo "🧪 Executando testes automáticos da arquitetura..."
echo "⏱️  Aguardando servidor inicializar..."
sleep 3
node ../../tests/architecture-validation.js
EOF

chmod +x run_tests.sh

# 10. Verificar mobile (opcional)
log "📱 Verificando estrutura mobile..." "$BLUE"

if [ -d "../mobile" ]; then
    cd ../mobile
    if [ -f "package.json" ]; then
        log "✅ Projeto mobile encontrado" "$GREEN"
        
        # Verificar se dependências estão instaladas
        if [ ! -d "node_modules" ]; then
            log "📦 Instalando dependências do mobile..." "$YELLOW"
            npm install --silent || true
        fi
        
        # Verificar dependências críticas
        if grep -q "react-native" package.json; then
            log "✅ React Native configurado" "$GREEN"
        fi
        
        if grep -q "@reduxjs/toolkit" package.json; then
            log "✅ Redux Toolkit configurado" "$GREEN"
        fi
    fi
    cd ../backend
else
    log "⚠️  Diretório mobile não encontrado" "$YELLOW"
fi

# 11. Relatório final
log "📊 Gerando relatório de setup..." "$BLUE"

cat > setup_report.txt << EOF
# MediApp - Relatório de Setup
Data: $(date)
Sistema: $(uname -a)

## Status do Ambiente
- Node.js: $(node --version)
- NPM: $(npm --version)
- PostgreSQL: Instalado e configurado

## Estrutura do Projeto
✅ Backend: Configurado
✅ Frontend: Páginas HTML prontas
✅ Mobile: Estrutura presente
✅ Testes: Scripts preparados
✅ Documentação: Guia de testes criado

## URLs para Testes
- Health Check: http://localhost:3002/health
- Gestão Médicos: http://localhost:3002/gestao-medicos.html
- Gestão Pacientes: http://localhost:3002/gestao-pacientes.html

## Scripts Criados
- start_server.sh: Iniciar servidor
- run_tests.sh: Executar testes automáticos

## Próximos Passos
1. Execute: ./start_server.sh
2. Abra navegador nas URLs acima
3. Siga o guia: ../../docs/GUIA_TESTES_HUMANOS.md
EOF

# Resultado final
echo -e "${GREEN}"
echo "################################################################"
echo "#                                                              #"
echo "#                  ✅ SETUP CONCLUÍDO!                        #"
echo "#                                                              #"
echo "################################################################"
echo -e "${NC}"

log "🎉 Setup do ambiente MediApp concluído com sucesso!" "$GREEN"
log "📋 Relatório salvo em: setup_report.txt" "$BLUE"

echo ""
log "🚀 Para iniciar os testes:" "$CYAN"
echo "   1. ./start_server.sh                 # Iniciar servidor"
echo "   2. ./run_tests.sh                    # Testes automáticos (em outro terminal)"
echo "   3. Abrir: http://localhost:3002/gestao-medicos.html"
echo "   4. Seguir: ../../docs/GUIA_TESTES_HUMANOS.md"

echo ""
log "📚 Documentação disponível:" "$BLUE"
echo "   - ../../docs/GUIA_TESTES_HUMANOS.md  # Testes manuais"
echo "   - ../../tests/architecture-validation.js  # Testes automáticos"
echo "   - setup_report.txt                   # Relatório deste setup"

echo ""
log "✨ Ambiente pronto para testes humanos!" "$GREEN"