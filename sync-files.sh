#!/bin/bash

# Script de sincronização de arquivos Windows -> WSL
# Uso: sync-files.sh

echo "🔄 Sincronizando arquivos do Windows para WSL..."

# Diretórios
WINDOWS_DIR="/mnt/c/workspace/aplicativo/backend"
WSL_DIR="/home/italo_unix_user/aplicativo/backend"

# Sincronizar arquivos de código
echo "📁 Copiando arquivos de código..."
cp -r "$WINDOWS_DIR/src/" "$WSL_DIR/"
cp -r "$WINDOWS_DIR/prisma/" "$WSL_DIR/"

# Sincronizar arquivos públicos (HTML/CSS/JS)
echo "🌐 Copiando arquivos web..."
cp "$WINDOWS_DIR/public/"*.html "$WSL_DIR/public/"

# Sincronizar arquivos de configuração
echo "⚙️ Copiando configurações..."
cp "$WINDOWS_DIR/package.json" "$WSL_DIR/" 2>/dev/null || true
cp "$WINDOWS_DIR/.env" "$WSL_DIR/" 2>/dev/null || true

echo "✅ Sincronização concluída!"

# Verificar se o servidor está rodando
if pgrep -f "node.*server.js" > /dev/null; then
    echo "🚀 Servidor Node.js já está rodando"
else
    echo "⚠️  Servidor Node.js não está rodando. Para iniciar:"
    echo "    cd $WSL_DIR && node src/server.js"
fi