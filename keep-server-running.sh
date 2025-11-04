#!/bin/bash

# MediApp Servidor Persistente v3.0.0
echo "🏥 Iniciando MediApp Server v3.0.0..."

cd /mnt/c/workspace/aplicativo/apps/backend/src

while true; do
    echo "[$(date)] 🚀 Iniciando servidor..."
    node server-linux-stable.js
    echo "[$(date)] ⚠️ Servidor parou, reiniciando em 5 segundos..."
    sleep 5
done