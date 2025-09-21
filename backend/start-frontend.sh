#!/bin/bash

# SOLUÇÃO DEFINITIVA - Servidor Estável com Frontend Completo

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Limpar processos anteriores
log "🧹 Limpando processos anteriores..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "python.*server" 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
sleep 3

# Ir para o diretório correto
cd /mnt/c/workspace/aplicativo/backend || {
    log "❌ Erro: Não foi possível acessar o diretório"
    exit 1
}

log "📁 Diretório atual: $(pwd)"
log "📋 Arquivos public:"
ls -la public/ | head -5

# Verificar se app.html existe
if [ ! -f "public/app.html" ]; then
    log "❌ app.html não encontrado!"
    exit 1
fi

log "✅ app.html encontrado"

# Criar servidor mínimo Node.js
cat > server-simple.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS permissivo
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

console.log(`[${new Date().toISOString()}] 📁 Static files path: ${path.join(__dirname, 'public')}`);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'MediApp Simple',
        frontend: 'Completo',
        static_path: path.join(__dirname, 'public')
    });
});

// APIs mock
app.get('/api/pacientes', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, nome: 'João Silva', idade: 45, telefone: '(11) 98765-4321' },
            { id: 2, nome: 'Maria Santos', idade: 32, telefone: '(11) 87654-3210' }
        ],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/medicos', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, nome: 'Dr. Carlos Oliveira', crm: '123456-SP', especialidade: 'Cardiologia' },
            { id: 2, nome: 'Dra. Ana Costa', crm: '789012-SP', especialidade: 'Pediatria' }
        ],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/prontuarios', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, paciente_id: 1, medico_id: 1, data: '2024-01-15', resumo: 'Consulta cardiológica' },
            { id: 2, paciente_id: 2, medico_id: 2, data: '2024-01-16', resumo: 'Consulta pediátrica' }
        ],
        timestamp: new Date().toISOString()
    });
});

// Rota principal
app.get('/', (req, res) => {
    const appPath = path.join(__dirname, 'public', 'app.html');
    console.log(`[${new Date().toISOString()}] 📋 Serving app.html from: ${appPath}`);
    res.sendFile(appPath);
});

// Catch-all para SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const appPath = path.join(__dirname, 'public', 'app.html');
    res.sendFile(appPath);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ❌ Error:`, err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] 🏥 MediApp FRONTEND Server - Porta ${PORT}`);
    console.log(`[${new Date().toISOString()}] 🎨 Servindo: ${path.join(__dirname, 'public')}`);
    console.log(`[${new Date().toISOString()}] 🌐 Acesse: http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] 🔧 Health: http://localhost:${PORT}/health`);
    console.log(`[${new Date().toISOString()}] 🚀 =========================================`);
    console.log(`[${new Date().toISOString()}] ✅ FRONTEND COMPLETO DISPONÍVEL!`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;

module.exports = app;
EOF

log "🚀 Iniciando servidor simples..."

# Instalar express se necessário
if [ ! -d "node_modules" ]; then
    log "📦 Instalando dependências..."
    npm install express cors --silent
fi

# Iniciar servidor
node server-simple.js &
SERVER_PID=$!

log "📊 Servidor iniciado - PID: $SERVER_PID"

# Aguardar inicialização
sleep 5

# Testar conectividade
if curl -s http://localhost:3001/health > /dev/null; then
    log "✅ SUCESSO! Servidor funcionando"
    log "🌐 Teste no browser: http://localhost:3001"
    log "🔧 Health check: http://localhost:3001/health"
    
    # Mostrar início do app.html para confirmar
    log "📋 Conteúdo do app.html (primeiras linhas):"
    head -5 public/app.html
    
else
    log "❌ Falha no health check"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

log "🎯 Servidor estável rodando!"
log "💡 Para parar: pkill -f 'node.*server-simple'"