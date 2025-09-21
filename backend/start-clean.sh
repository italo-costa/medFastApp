#!/bin/bash

# MediApp Clean Server Startup Script
# UTF-8 Safe and Error-Free

echo "========================================"
echo "MediApp Clean Server - WSL2"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "server-clean.js" ]; then
    echo "[ERROR] server-clean.js not found in current directory"
    echo "[INFO] Current directory: $(pwd)"
    echo "[INFO] Please run this script from the backend directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found"
    echo "[INFO] Please install Node.js"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "[INFO] Node.js version: $NODE_VERSION"

# Kill any existing process on port 3001
echo "[INFO] Checking for existing processes on port 3001..."
sudo fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# Check if public directory exists
if [ ! -d "public" ]; then
    echo "[WARNING] Public directory not found"
    echo "[INFO] Creating public directory..."
    mkdir -p public
fi

# Check if app.html exists
if [ ! -f "public/app.html" ]; then
    echo "[WARNING] app.html not found in public directory"
    if [ -f "/mnt/c/workspace/aplicativo/backend/public/app.html" ]; then
        echo "[INFO] Copying app.html from Windows directory..."
        cp "/mnt/c/workspace/aplicativo/backend/public/app.html" "public/"
    else
        echo "[ERROR] app.html not found anywhere"
        exit 1
    fi
fi

# Set environment
export NODE_ENV=production
export PORT=3001

# Start the clean server
echo "[INFO] Starting MediApp Clean Server..."
echo "[INFO] Server will run with UTF-8 encoding"
echo "[INFO] All emojis and special characters removed"
echo "[INFO] Error handling improved"
echo ""

# Start server with proper encoding
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node server-clean.js

echo ""
echo "[INFO] Server stopped"