const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Função de log personalizada
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

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
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath, {
  index: ['app.html', 'index.html'],
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

log(`Static files path: ${publicPath}`);

// Health check robusto
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'MediApp Stable',
    version: '2.0.0',
    frontend: 'Available',
    uptime: Math.floor(process.uptime()),
    pid: process.pid
  });
});

// APIs mock para desenvolvimento
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
  const appPath = path.join(publicPath, 'app.html');
  res.sendFile(appPath, (err) => {
    if (err) {
      log(`Erro ao servir app.html: ${err.message}`, 'ERROR');
      res.status(500).send('Erro ao carregar aplicação');
    }
  });
});

// Catch-all para SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const appPath = path.join(publicPath, 'app.html');
  res.sendFile(appPath);
});

// Error handler
app.use((err, req, res, next) => {
  log(`Server error: ${err.message}`, 'ERROR');
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Servidor com tratamento de sinais melhorado
let server;
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    log(`Sinal ${signal} ignorado - já encerrando...`, 'WARN');
    return;
  }
  
  isShuttingDown = true;
  log(`${signal} recebido - iniciando encerramento graceful...`, 'WARN');
  
  // Dar tempo para requisições terminarem
  server.close(() => {
    log('Servidor encerrado com sucesso', 'INFO');
    process.exit(0);
  });
  
  // Force exit se demorar muito
  setTimeout(() => {
    log('Forçando encerramento após timeout', 'ERROR');
    process.exit(1);
  }, 10000);
}

// Handlers de sinal mais robustos
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handler para erros não capturados
process.on('uncaughtException', (err) => {
  log(`Erro não capturado: ${err.message}`, 'ERROR');
  console.error(err.stack);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promise rejeitada: ${reason}`, 'ERROR');
  console.error('Promise:', promise);
});

// Iniciar servidor
server = app.listen(PORT, '0.0.0.0', () => {
  log('🚀 =========================================');
  log(`🏥 MediApp Stable Server - Porta ${PORT}`);
  log('🎨 Frontend: app.html servindo');
  log('🔗 APIs: Sistema médico ativo');
  log('🛡️ Proteção: Sinais tratados gracefully');
  log('🚀 =========================================');
  log(`🌐 Acesse: http://localhost:${PORT}`);
  log(`🔧 Health: http://localhost:${PORT}/health`);
  log(`👥 Pacientes: http://localhost:${PORT}/api/pacientes`);
  log(`👨‍⚕️ Médicos: http://localhost:${PORT}/api/medicos`);
  log(`📋 Prontuários: http://localhost:${PORT}/api/prontuarios`);
  log('🚀 =========================================');
  log('💡 SERVIDOR ESTÁVEL E RESISTENTE!');
});

// Configurações para estabilidade
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.timeout = 0; // Disable timeout

module.exports = app;