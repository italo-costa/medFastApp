const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patients');
const recordRoutes = require('./routes/records');
const examRoutes = require('./routes/exams');
const allergyRoutes = require('./routes/allergies');

const app = express();
const PORT = process.env.PORT || 3001;

// Tratamento robusto de erros para WSL
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error.message);
  // Não encerrar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  // Não encerrar o processo, apenas logar
});

// Rate limiting com configurações WSL-friendly
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Mais requests para WSL
  message: 'Muitas tentativas, tente novamente em alguns minutos',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // Skip localhost
});

// Middlewares básicos de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para debugging
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(limiter);

// CORS simplificado para WSL
app.use(cors({
  origin: true, // Permitir qualquer origem em desenvolvimento
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Headers para manter conexões vivas no WSL
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=1000');
  res.setHeader('X-WSL-Server', 'MediApp');
  next();
});

// Parsing de JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Logging simplificado para WSL
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check robusto
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    wsl: true,
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  res.status(200).json(healthData);
});

// Endpoint de teste específico para WSL
app.get('/wsl-test', (req, res) => {
  res.status(200).json({
    message: 'WSL Connection OK',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip,
    method: req.method
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);  
app.use('/api/exams', examRoutes);
app.use('/api/allergies', allergyRoutes);

// Middleware de erro 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicializar servidor com configurações otimizadas
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MediApp Backend rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Dashboard web: http://localhost:${PORT}`);
  console.log(`🖥️ Acesso WSL: http://localhost:${PORT} (Windows)`);
  console.log(`🔧 WSL Test: http://localhost:${PORT}/wsl-test`);
});

// Configurações de timeout otimizadas para WSL
server.keepAliveTimeout = 61000;  // 61 segundos
server.headersTimeout = 65000;    // 65 segundos  
server.requestTimeout = 120000;   // 2 minutos
server.timeout = 300000;          // 5 minutos

// Graceful shutdown melhorado
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} recebido, fechando servidor...`);
  server.close(() => {
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
  
  // Forçar encerramento após 10 segundos
  setTimeout(() => {
    console.log('⚠️ Forçando encerramento...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Heartbeat para manter o processo vivo
setInterval(() => {
  console.log(`💓 Heartbeat: ${new Date().toISOString()} - Uptime: ${Math.floor(process.uptime())}s`);
}, 60000); // A cada minuto

module.exports = app;