const express = require('express');
const cors = require('cors');
const path = require('path');

// Configuração básica e estável
const app = express();
const PORT = 3001;

// Log simples
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// Tratamento de erros globais sem crash
process.on('uncaughtException', (error) => {
  log(`❌ ERRO: ${error.message}`);
  // NÃO encerrar processo
});

process.on('unhandledRejection', (reason) => {
  log(`❌ PROMISE REJEITADA: ${reason}`);
  // NÃO encerrar processo
});

// CORS permissivo para desenvolvimento
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers para manter conexão
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=100');
  next();
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Health check simplificado
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0-minimal',
    pid: process.pid
  });
});

// Rota de teste WSL
app.get('/wsl-test', (req, res) => {
  res.json({
    message: 'WSL Connection OK',
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

// API básica sem Prisma (para teste)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rotas de fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  
  // Servir index.html para SPA
  const indexPath = path.join(__dirname, '../public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Página não encontrada');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  log(`❌ ERRO REQUEST: ${err.message}`);
  res.status(500).json({ error: 'Erro interno' });
});

// Iniciar servidor com binding específico
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  log('🚀 ===================================');
  log(`🏥 MediApp MINIMAL - Porta ${PORT}`);
  log(`📡 Bind: ${address.address}:${address.port}`);
  log(`🔗 Health: http://localhost:${PORT}/health`);
  log(`🌐 Dashboard: http://localhost:${PORT}`);
  log(`🔧 WSL Test: http://localhost:${PORT}/wsl-test`);
  log('🚀 ===================================');
  
  // Log IPs disponíveis
  const os = require('os');
  const interfaces = os.networkInterfaces();
  log('🌐 IPs disponíveis:');
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        log(`   ${name}: ${iface.address}`);
      }
    });
  });
});

// Configurações de timeout
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;
server.timeout = 120000;

// Graceful shutdown
const gracefulShutdown = (signal) => {
  log(`🛑 ${signal} recebido - parando servidor...`);
  server.close(() => {
    log('✅ Servidor fechado');
    process.exit(0);
  });
  
  setTimeout(() => {
    log('⚠️ Forçando encerramento');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Heartbeat a cada 30 segundos
let heartbeat = 0;
setInterval(() => {
  heartbeat++;
  log(`💓 Heartbeat #${heartbeat} - Uptime: ${Math.floor(process.uptime())}s`);
}, 30000);

module.exports = app;