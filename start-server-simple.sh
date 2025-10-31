#!/bin/bash

# 🚀 MediApp - Servidor de Produção Simples
# Inicia servidor e mantém rodando

echo "🏥 MediApp - Iniciando servidor de produção..."

# Ir para diretório do backend
cd /mnt/c/workspace/aplicativo/backend

# Iniciar servidor com logging
echo "🚀 Iniciando servidor na porta 3002..."
exec node robust-server.js 2>&1