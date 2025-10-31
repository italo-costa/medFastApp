const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Configuração de logging seguro
const logError = (error, context = '') => {
  console.error(`❌ ERRO ${context}:`, error.message);
  console.error(`Stack: ${error.stack}`);
};

// Tratamento global de erros não capturados
process.on('uncaughtException', (error) => {
  logError(error, 'UNCAUGHT EXCEPTION');
  // Não encerrar processo, apenas log
});

process.on('unhandledRejection', (reason, promise) => {
  logError(reason, 'UNHANDLED REJECTION');
  // Não encerrar processo, apenas log
});

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting otimizado para WSL
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Mais permissivo para desenvolvimento
  message: {
    error: 'Muitas requisições, tente novamente em alguns minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para localhost e health checks
    const isLocal = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    const isHealthCheck = req.path === '/health' || req.path === '/wsl-test';
    return isLocal || isHealthCheck;
  }
});

// Helmet com configurações flexíveis para desenvolvimento
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: false // Desabilitar HSTS em desenvolvimento
}));

app.use(compression());
app.use(limiter);

// CORS otimizado para WSL/Windows
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (Postman, aplicações mobile, etc)
    if (!origin) return callback(null, true);
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:19006', // Expo web
      'exp://localhost:19000',  // Expo app
      'file://', // Para aplicações híbridas
    ];
    
    // Permitir qualquer localhost em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log origem não permitida mas não bloquear em desenvolvimento
      console.log(`⚠️ Origem não listada: ${origin}`);
      callback(null, true); // Permitir mesmo assim em desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
}));

// Headers customizados para manter conexões vivas no WSL
app.use((req, res, next) => {
  // Headers para estabilidade WSL-Windows
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65, max=1000');
  res.setHeader('X-Powered-By', 'MediApp-WSL');
  res.setHeader('Server', 'MediApp/1.0.0');
  
  // Prevenir timeout em conexões longas
  req.setTimeout(120000); // 2 minutos
  res.setTimeout(120000); // 2 minutos
  
  next();
});

// Middleware de parsing otimizado
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'JSON inválido' });
      return;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Servir arquivos estáticos com headers otimizados
app.use(express.static('public', {
  maxAge: '1d', // Cache de 1 dia
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Logging otimizado para WSL
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req, res) => {
      // Skip logs de health check para reduzir ruído
      return req.path === '/health' || req.path === '/favicon.ico';
    }
  }));
}

// Health check robusto com informações detalhadas
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    platform: 'WSL2-Ubuntu',
    node: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    pid: process.pid,
    database: 'PostgreSQL 16',
    port: PORT
  };
  
  res.status(200).json(healthData);
});

// Endpoint específico para teste WSL-Windows
app.get('/wsl-test', (req, res) => {
  res.status(200).json({
    message: '✅ Conexão WSL-Windows OK',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    host: req.get('Host'),
    connection: req.get('Connection'),
    headers: Object.keys(req.headers)
  });
});

// Importação segura de rotas
let routes = {};
try {
  routes.auth = require('./routes/auth');
  routes.users = require('./routes/users');
  routes.patients = require('./routes/patients');
  routes.records = require('./routes/records');
  routes.exams = require('./routes/exams');
  routes.allergies = require('./routes/allergies');
  console.log('✅ Todas as rotas carregadas com sucesso');
} catch (error) {
  logError(error, 'CARREGAMENTO DE ROTAS');
  // Continuar mesmo com erro nas rotas
}

// Registrar rotas com tratamento de erro
const registerRoute = (path, router, name) => {
  if (router) {
    app.use(path, router);
    console.log(`✅ Rota ${name} registrada: ${path}`);
  } else {
    console.log(`⚠️ Rota ${name} não disponível: ${path}`);
  }
};

registerRoute('/api/auth', routes.auth, 'Autenticação');
registerRoute('/api/users', routes.users, 'Usuários');
registerRoute('/api/patients', routes.patients, 'Pacientes');
registerRoute('/api/records', routes.records, 'Prontuários');
registerRoute('/api/exams', routes.exams, 'Exames');
registerRoute('/api/allergies', routes.allergies, 'Alergias');

// Rota catch-all para SPAs
app.get('*', (req, res, next) => {
  // Se for uma requisição de API, continue para 404
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Para outras rotas, servir index.html (SPA)
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Middleware 404 customizado
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  logError(error, `REQUEST ${req.method} ${req.path}`);
  
  // Não vazar detalhes do erro em produção
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: isDev ? error.message : 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(isDev && { stack: error.stack })
  });
});

// Configuração do servidor com timeouts otimizados
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ===================================');
  console.log(`🏥 MediApp Backend ATIVO - Porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Dashboard Web: http://localhost:${PORT}`);
  console.log(`🖥️ Acesso Windows: http://localhost:${PORT}`);
  console.log(`🔧 WSL Test: http://localhost:${PORT}/wsl-test`);
  console.log('🚀 ===================================');
});

// Configurações de timeout robustas para WSL
server.keepAliveTimeout = 65000;  // 65 segundos (maior que proxy padrão)
server.headersTimeout = 70000;    // 70 segundos
server.requestTimeout = 120000;   // 2 minutos
server.timeout = 300000;          // 5 minutos

// Aumentar limite de conexões simultâneas
server.maxConnections = 1000;

// Graceful shutdown melhorado
const gracefulShutdown = (signal) => {
  console.log(`🛑 Sinal ${signal} recebido - Iniciando shutdown graceful...`);
  
  server.close((err) => {
    if (err) {
      logError(err, 'SHUTDOWN');
      process.exit(1);
    }
    
    console.log('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
  
  // Timeout de segurança
  setTimeout(() => {
    console.log('⚠️ Timeout atingido - Forçando encerramento');
    process.exit(1);
  }, 15000); // 15 segundos
};

// Registrar handlers de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon

// Heartbeat para manter processo vivo e monitorar saúde
let heartbeatCount = 0;
const heartbeatInterval = setInterval(() => {
  heartbeatCount++;
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  console.log(`💓 Heartbeat #${heartbeatCount} | Uptime: ${Math.floor(process.uptime())}s | Memoria: ${memUsedMB}MB`);
  
  // Alerta se memoria muito alta
  if (memUsedMB > 200) {
    console.log('⚠️ Uso de memória alto detectado');
  }
}, 30000); // A cada 30 segundos

// Limpar interval no shutdown
process.on('exit', () => {
  clearInterval(heartbeatInterval);
});

module.exports = app;