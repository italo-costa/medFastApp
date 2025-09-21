#!/bin/bash

# Script para gerenciar o servidor MediApp
# Uso: ./manage-server.sh [start|stop|restart|status|logs]

BACKEND_DIR="/home/italo_unix_user/aplicativo/backend"

case "$1" in
    start)
        echo "Iniciando servidor MediApp..."
        cd "$BACKEND_DIR"
        npx pm2 start ecosystem.config.js
        ;;
    stop)
        echo "Parando servidor MediApp..."
        cd "$BACKEND_DIR"
        npx pm2 stop mediapp-backend
        ;;
    restart)
        echo "Reiniciando servidor MediApp..."
        cd "$BACKEND_DIR"
        npx pm2 restart mediapp-backend
        ;;
    status)
        echo "Status do servidor MediApp:"
        cd "$BACKEND_DIR"
        npx pm2 status
        echo
        echo "Health check:"
        curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
        ;;
    logs)
        echo "Logs do servidor MediApp:"
        cd "$BACKEND_DIR"
        npx pm2 logs mediapp-backend --lines 20
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo
        echo "Comandos:"
        echo "  start   - Iniciar o servidor"
        echo "  stop    - Parar o servidor"
        echo "  restart - Reiniciar o servidor"
        echo "  status  - Verificar status do servidor"
        echo "  logs    - Exibir logs do servidor"
        exit 1
        ;;
esac