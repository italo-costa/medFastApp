#!/bin/bash

# 🚀 MediApp - Servidor Permanente
# Mantém o servidor rodando com restart automático

echo "🏥 MediApp - Iniciando servidor permanente..."

# Diretório do projeto
cd /mnt/c/workspace/aplicativo/backend

#!/bin/bash

# 🏥 MediApp v2.0 - Script de Deploy Persistente
# Mantém a aplicação rodando com screen

APP_NAME="mediapp"
BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
SCREEN_NAME="mediapp-server"

echo "🚀 ======================================"
echo "🏥 MEDIAPP V2.0 - DEPLOY PERSISTENTE"
echo "🚀 ======================================"

# Função para parar sessões existentes
stop_existing() {
    echo "🛑 Parando sessões existentes..."
    screen -S "$SCREEN_NAME" -X quit 2>/dev/null || true
    pkill -f "node.*app.js" 2>/dev/null || true
    sleep 2
}

# Função para iniciar servidor
start_server() {
    echo "📂 Entrando no diretório: $BACKEND_DIR"
    cd "$BACKEND_DIR" || exit 1
    
    echo "📦 Verificando dependências..."
    if [ ! -d "node_modules" ]; then
        echo "📥 Instalando dependências..."
        npm install
    fi
    
    echo "🔄 Gerando cliente Prisma..."
    npx prisma generate
    
    echo "🚀 Iniciando servidor em background com screen..."
    screen -dmS "$SCREEN_NAME" bash -c "
        echo '🏥 Iniciando MediApp v2.0 no screen...';
        cd '$BACKEND_DIR';
        while true; do
            echo '� Iniciando servidor...';
            node src/app.js;
            echo '⚠️ Servidor parou. Reiniciando em 5 segundos...';
            sleep 5;
        done
    "
    
    echo "✅ Servidor iniciado em background!"
    echo "💡 Para ver logs: screen -r $SCREEN_NAME"
    echo "💡 Para parar: screen -S $SCREEN_NAME -X quit"
}

# Função para verificar status
check_status() {
    echo "🔍 Verificando status..."
    
    # Verificar se screen está rodando
    if screen -list | grep -q "$SCREEN_NAME"; then
        echo "✅ Sessão screen ativa: $SCREEN_NAME"
    else
        echo "❌ Sessão screen não encontrada"
        return 1
    fi
    
    # Verificar se servidor responde
    sleep 3
    if curl -s --connect-timeout 5 http://localhost:3002/health >/dev/null 2>&1; then
        echo "✅ Servidor respondendo em http://localhost:3002"
        echo ""
        echo "🌐 URLs disponíveis:"
        echo "   🔗 Health Check: http://localhost:3002/health"
        echo "   🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html"
        echo "   👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html"
        echo "   📊 Dashboard: http://localhost:3002/api/statistics/dashboard"
        return 0
    else
        echo "⚠️ Servidor ainda não está respondendo..."
        echo "💡 Aguarde alguns segundos e teste: curl http://localhost:3002/health"
        return 1
    fi
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            stop_existing
            start_server
            check_status
            ;;
        "stop")
            stop_existing
            echo "✅ Aplicação parada!"
            ;;
        "status")
            check_status
            ;;
        "restart")
            stop_existing
            sleep 2
            start_server
            check_status
            ;;
        "logs")
            echo "📋 Conectando aos logs (Ctrl+A+D para sair)..."
            screen -r "$SCREEN_NAME"
            ;;
        *)
            echo "Uso: $0 [start|stop|status|restart|logs]"
            exit 1
            ;;
    esac
}

main "$@"