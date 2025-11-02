#!/bin/bash

# 🏥 MediApp v2.0 - Script de Deploy Simples e Efetivo
# Mantém a aplicação rodando com nohup

BACKEND_DIR="/mnt/c/workspace/aplicativo/apps/backend"
PID_FILE="/tmp/mediapp.pid"
LOG_FILE="/tmp/mediapp.log"

echo "🚀 ======================================"
echo "🏥 MEDIAPP V2.0 - DEPLOY COMPLETO"
echo "🚀 ======================================"

# Função para parar aplicação
stop_app() {
    echo "🛑 Parando aplicação MediApp..."
    
    # Parar pelo PID file
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "📋 Parando processo PID: $PID"
            kill -TERM "$PID"
            sleep 3
            if kill -0 "$PID" 2>/dev/null; then
                echo "⚠️ Forçando término..."
                kill -KILL "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # Garantir que todos os processos param
    pkill -f "node.*app.js" 2>/dev/null || true
    pkill -f "mediapp" 2>/dev/null || true
    
    echo "✅ Aplicação parada!"
}

# Função para iniciar aplicação
start_app() {
    echo "🚀 Iniciando aplicação MediApp..."
    
    # Ir para diretório
    cd "$BACKEND_DIR" || {
        echo "❌ Erro: não foi possível acessar $BACKEND_DIR"
        exit 1
    }
    
    echo "📂 Diretório atual: $(pwd)"
    
    # Verificar dependências
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências..."
        npm install || {
            echo "❌ Erro ao instalar dependências"
            exit 1
        }
    fi
    
    # Gerar cliente Prisma
    echo "🔄 Gerando cliente Prisma..."
    npx prisma generate || {
        echo "❌ Erro ao gerar cliente Prisma"
        exit 1
    }
    
    # Iniciar servidor
    echo "🏥 Iniciando servidor em background..."
    nohup node src/app.js > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    
    # Salvar PID
    echo "$SERVER_PID" > "$PID_FILE"
    
    echo "✅ Servidor iniciado com PID: $SERVER_PID"
    echo "📋 Logs salvos em: $LOG_FILE"
    echo "💾 PID salvo em: $PID_FILE"
    
    # Aguardar inicialização
    echo "⏳ Aguardando servidor inicializar..."
    sleep 8
}

# Função para verificar status
check_status() {
    echo "🔍 Verificando status da aplicação..."
    
    # Verificar se processo está rodando
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ Processo rodando com PID: $PID"
        else
            echo "❌ Processo não está rodando (PID inválido)"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "❌ Arquivo PID não encontrado"
        return 1
    fi
    
    # Testar conectividade
    local retries=3
    local count=0
    
    while [ $count -lt $retries ]; do
        if curl -s --connect-timeout 5 http://localhost:3002/health >/dev/null 2>&1; then
            echo "✅ Servidor respondendo em http://localhost:3002"
            
            # Mostrar informações
            echo ""
            echo "🌐 URLs disponíveis:"
            echo "   🔗 Health Check: http://localhost:3002/health"
            echo "   🏥 Gestão Médicos: http://localhost:3002/gestao-medicos.html"
            echo "   👥 Gestão Pacientes: http://localhost:3002/gestao-pacientes.html"
            echo "   📊 Dashboard: http://localhost:3002/api/statistics/dashboard"
            echo "   📋 API Médicos: http://localhost:3002/api/medicos"
            echo "   👨‍⚕️ API Pacientes: http://localhost:3002/api/pacientes"
            echo ""
            echo "📊 Obtendo estatísticas do sistema..."
            curl -s http://localhost:3002/health 2>/dev/null | head -10
            
            return 0
        fi
        
        count=$((count + 1))
        echo "⏳ Tentativa $count/$retries - aguardando servidor..."
        sleep 3
    done
    
    echo "❌ Servidor não está respondendo após $retries tentativas"
    echo "💡 Verificar logs: tail -f $LOG_FILE"
    return 1
}

# Função para mostrar logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📋 Últimas 50 linhas do log:"
        echo "=========================="
        tail -50 "$LOG_FILE"
    else
        echo "❌ Arquivo de log não encontrado: $LOG_FILE"
    fi
}

# Função para monitorar
monitor_app() {
    echo "👁️ Iniciando monitoramento (Ctrl+C para parar)..."
    
    while true; do
        if ! check_status >/dev/null 2>&1; then
            echo "⚠️ Aplicação não está respondendo. Reiniciando..."
            stop_app
            sleep 2
            start_app
            sleep 5
        else
            echo "✅ $(date): Aplicação funcionando normalmente"
        fi
        sleep 30
    done
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            stop_app
            start_app
            check_status
            ;;
        "stop")
            stop_app
            ;;
        "status")
            check_status
            ;;
        "restart")
            stop_app
            sleep 2
            start_app
            check_status
            ;;
        "logs")
            show_logs
            ;;
        "monitor")
            monitor_app
            ;;
        *)
            echo "🏥 MediApp v2.0 - Gerenciador de Deploy"
            echo ""
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  start    - Iniciar aplicação"
            echo "  stop     - Parar aplicação"
            echo "  restart  - Reiniciar aplicação"
            echo "  status   - Verificar status"
            echo "  logs     - Mostrar logs"
            echo "  monitor  - Monitorar com restart automático"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"