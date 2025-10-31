#!/bin/bash

# 🚀 MediApp - Servidor Permanente
# Mantém o servidor rodando com restart automático

echo "🏥 MediApp - Iniciando servidor permanente..."

# Diretório do projeto
cd /mnt/c/workspace/aplicativo/backend

# Função para cleanup
cleanup() {
    echo "🛑 Parando MediApp..."
    exit 0
}

# Registrar handler para Ctrl+C
trap cleanup SIGTERM SIGINT

# Loop infinito para manter servidor rodando
while true; do
    echo "🚀 $(date): Iniciando MediApp Server..."
    
    # Iniciar servidor
    node robust-server.js
    
    # Se chegou aqui, servidor parou
    echo "⚠️  $(date): Servidor parou. Reiniciando em 5 segundos..."
    sleep 5
done