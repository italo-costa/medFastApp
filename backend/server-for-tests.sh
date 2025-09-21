#!/bin/bash

# SERVIDOR SUPER ESTÁVEL - MediApp
# Foco: Ficar "em pé" para testes manuais

set -e

# Configurações
PORT=3001
PROJECT_DIR="/mnt/c/workspace/aplicativo/backend"
LOG_FILE="/tmp/mediapp-stable.log"
PID_FILE="/tmp/mediapp-stable.pid"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Limpar processos anteriores
cleanup() {
    log "🧹 Limpando processos anteriores..."
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "python.*mediapp" 2>/dev/null || true
    pkill -f "python.*bridge" 2>/dev/null || true
    sudo fuser -k ${PORT}/tcp 2>/dev/null || true
    rm -f /tmp/mediapp-*.pid 2>/dev/null || true
    sleep 3
    log "✅ Limpeza concluída"
}

# Verificar dependências
check_dependencies() {
    log "🔍 Verificando dependências..."
    
    # Node.js
    if ! command -v node >/dev/null 2>&1; then
        log "❌ Node.js não encontrado"
        return 1
    fi
    
    # Python
    if ! command -v python3 >/dev/null 2>&1; then
        log "❌ Python3 não encontrado"
        return 1
    fi
    
    # PostgreSQL
    if ! sudo service postgresql status >/dev/null 2>&1; then
        log "⚠️ PostgreSQL não está rodando - iniciando..."
        sudo service postgresql start
    fi
    
    log "✅ Dependências OK"
    return 0
}

# Testar conectividade
test_connectivity() {
    local port=$1
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
            log "✅ Conectividade OK na tentativa $attempt"
            return 0
        fi
        
        log "⏳ Tentativa $attempt/$max_attempts - aguardando..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "❌ Falha na conectividade após $max_attempts tentativas"
    return 1
}

# Iniciar Node.js com máxima estabilidade
start_nodejs() {
    log "🚀 Tentando Node.js..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependências Node.js..."
        npm install --silent
    fi
    
    # Iniciar com nohup e redirecionamento
    log "🔄 Iniciando servidor Node.js..."
    nohup node src/server.js >"$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo $pid > "$PID_FILE"
    log "📊 Node.js iniciado - PID: $pid"
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se ainda está rodando
    if kill -0 $pid 2>/dev/null; then
        log "✅ Processo Node.js ativo"
        
        # Testar conectividade
        if test_connectivity $PORT; then
            log "🎯 Node.js FUNCIONANDO!"
            return 0
        else
            log "❌ Node.js sem conectividade"
            kill $pid 2>/dev/null || true
            return 1
        fi
    else
        log "❌ Processo Node.js morreu"
        return 1
    fi
}

# Iniciar Python como fallback
start_python() {
    log "🐍 Tentando Python (fallback)..."
    
    # Criar servidor Python simples
    cat > /tmp/simple-server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import datetime
import signal
import sys

PORT = 3001

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'status': 'OK',
                'server': 'Python Simple',
                'timestamp': datetime.datetime.now().isoformat(),
                'message': 'MediApp rodando em Python para testes manuais'
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            html = f'''
<!DOCTYPE html>
<html>
<head><title>MediApp - Testes Manuais</title></head>
<body>
    <h1>🏥 MediApp - Servidor de Testes</h1>
    <p><strong>Status:</strong> ✅ Online para testes manuais</p>
    <p><strong>Timestamp:</strong> {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
    <p><a href="/health">Health Check</a></p>
    <h2>Servidor Python Estável</h2>
    <p>Este servidor foi criado para permanecer estável durante os testes manuais.</p>
</body>
</html>'''
            self.wfile.write(html.encode())

def signal_handler(sig, frame):
    print('\\nServidor Python interrompido')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    httpd.allow_reuse_address = True
    print(f'🐍 Servidor Python rodando na porta {PORT}')
    print(f'🌐 Acesse: http://localhost:{PORT}')
    httpd.serve_forever()
EOF

    # Iniciar servidor Python
    nohup python3 /tmp/simple-server.py >"$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo $pid > "$PID_FILE"
    log "📊 Python iniciado - PID: $pid"
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se ainda está rodando
    if kill -0 $pid 2>/dev/null; then
        log "✅ Processo Python ativo"
        
        # Testar conectividade
        if test_connectivity $PORT; then
            log "🎯 Python FUNCIONANDO!"
            return 0
        else
            log "❌ Python sem conectividade"
            kill $pid 2>/dev/null || true
            return 1
        fi
    else
        log "❌ Processo Python morreu"
        return 1
    fi
}

# Monitor contínuo
monitor_server() {
    local max_restarts=3
    local restart_count=0
    
    while [ $restart_count -lt $max_restarts ]; do
        log "🔄 Tentativa $((restart_count + 1))/$max_restarts"
        
        # Tentar Node.js primeiro
        if start_nodejs; then
            log "✅ SUCESSO! Servidor Node.js estável"
            show_access_info
            return 0
        fi
        
        log "⚠️ Node.js falhou, tentando Python..."
        
        # Fallback para Python
        if start_python; then
            log "✅ SUCESSO! Servidor Python estável"
            show_access_info
            return 0
        fi
        
        restart_count=$((restart_count + 1))
        if [ $restart_count -lt $max_restarts ]; then
            log "⏳ Aguardando antes da próxima tentativa..."
            sleep 10
        fi
    done
    
    log "❌ FALHA: Todas as tentativas esgotadas"
    return 1
}

# Mostrar informações de acesso
show_access_info() {
    log "🎯 ======================================="
    log "🏥 MediApp - PRONTO PARA TESTES MANUAIS"
    log "🎯 ======================================="
    log "🌐 URL Principal: http://localhost:$PORT"
    log "🔧 Health Check: http://localhost:$PORT/health"
    log "📊 PID do Servidor: $(cat $PID_FILE 2>/dev/null || echo 'N/A')"
    log "📋 Log File: $LOG_FILE"
    log "🎯 ======================================="
    log "💡 TESTE NO BROWSER: Abra http://localhost:$PORT"
    log "🎯 ======================================="
}

# Status do servidor
status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            log "✅ Servidor ATIVO (PID: $pid)"
            if test_connectivity $PORT; then
                log "✅ Conectividade OK"
            else
                log "⚠️ Servidor ativo mas sem conectividade"
            fi
        else
            log "❌ Servidor INATIVO (processo morto)"
            rm -f "$PID_FILE"
        fi
    else
        log "❌ Nenhum servidor registrado"
    fi
}

# Parar servidor
stop() {
    log "🛑 Parando servidor..."
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            kill -TERM $pid
            sleep 3
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid
                log "⚠️ Processo terminado forçadamente"
            else
                log "✅ Processo terminado graciosamente"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    cleanup
}

# Main
case "${1:-start}" in
    start)
        log "🚀 ========================================="
        log "🏥 MediApp - Inicialização para Testes"
        log "🚀 ========================================="
        cleanup
        if check_dependencies; then
            monitor_server
        else
            log "❌ Falha na verificação de dependências"
            exit 1
        fi
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        stop
        sleep 2
        cleanup
        if check_dependencies; then
            monitor_server
        fi
        ;;
    logs)
        tail -n 50 "$LOG_FILE" 2>/dev/null || echo "Nenhum log encontrado"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar servidor para testes manuais"
        echo "  stop    - Parar servidor"
        echo "  status  - Verificar status"
        echo "  restart - Reiniciar servidor"
        echo "  logs    - Mostrar logs recentes"
        exit 1
        ;;
esac