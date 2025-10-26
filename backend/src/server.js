const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const AnalyticsDataSanitizer = require('./middleware/analyticsDataSanitizer');
const ServerHealthMonitor = require('./utils/healthMonitor');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patients-db'); // Usando versão do banco de dados
const recordRoutes = require('./routes/records');
const examRoutes = require('./routes/exams');
const allergyRoutes = require('./routes/allergies');
const medicoRoutes = require('./routes/medicos');
const analyticsRoutes = require('./routes/analytics');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Muitas tentativas, tente novamente em alguns minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://servicodados.ibge.gov.br", "https://www.ans.gov.br", "http://tabnet.datasus.gov.br"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false, // Aplicar CSP rigorosamente
  },
  crossOriginEmbedderPolicy: false, // Para permitir mapas externos
}));

app.use(compression());
app.use(limiter);

// CORS configurado para o frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:19006', // Expo web
    'exp://localhost:19000', // Expo app
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsing de JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sanitização para analytics
const analyticsSanitizer = new AnalyticsDataSanitizer();
app.use(analyticsSanitizer.middleware());

// Servir arquivos estáticos (dashboard web)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Favicon fallback para evitar 404s desnecessários
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content, evita erro 404
});

// Servir arquivos de dados gerados (mapas, relatórios, etc.) com caminho absoluto
const dataPath = path.join(__dirname, '..', '..', 'data');
console.log('📁 Servindo arquivos de dados de:', dataPath);

app.use('/data', express.static(dataPath, {
  setHeaders: (res, filePath) => {
    console.log('📊 Servindo arquivo:', filePath);
    
    // Headers específicos para arquivos de imagem
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache de 1 hora
    }
    if (filePath.endsWith('.csv')) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment');
    }
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Logging HTTP
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check
app.get('/health', (req, res) => {
  const healthStatus = healthMonitor ? healthMonitor.getHealthStatus() : { healthy: true };
  
  res.status(healthStatus.healthy ? 200 : 503).json({
    status: healthStatus.healthy ? 'OK' : 'UNHEALTHY',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    health: healthStatus
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/statistics', statisticsRoutes);

// Rota de teste para debug dos mapas
app.get('/debug/map-files', (req, res) => {
  const fs = require('fs');
  const dataPath = path.join(__dirname, '..', '..', 'data');
  
  try {
    const files = fs.readdirSync(dataPath);
    const mapFiles = files.filter(file => file.includes('mapa'));
    
    const fileDetails = mapFiles.map(file => {
      const filePath = path.join(dataPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        path: filePath,
        exists: fs.existsSync(filePath)
      };
    });
    
    res.json({
      dataPath,
      mapFiles: fileDetails,
      allFiles: files
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      dataPath
    });
  }
});

// Health check específico para analytics
app.get('/health/analytics', (req, res) => {
  const fs = require('fs');
  const dataPath = path.join(__dirname, '..', '..', 'data');
  const mapFile = path.join(dataPath, 'mapa_indicadores_saude_nordeste.png');
  
  res.json({
    status: 'ok',
    dataPath,
    mapFile,
    mapExists: fs.existsSync(mapFile),
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Configurações adicionais para estabilidade WSL
app.use((req, res, next) => {
  // Headers para manter conexões vivas e evitar timeouts
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=100');
  
  // Prevenir memory leaks em requests longos
  req.setTimeout(60000, () => {
    logger.warn('⏰ Request timeout atingido:', req.url);
    res.status(408).json({ error: 'Request timeout' });
  });
  
  next();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não capturado:', error);
  // Não fechar o servidor, apenas log do erro
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', reason);
  // Não fechar o servidor, apenas log do erro
});

// Inicializar servidor com configurações otimizadas para WSL
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 MediApp Backend rodando na porta ${PORT}`);
  logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 Dashboard web: http://localhost:${PORT}`);
  logger.info(`🖥️  Acesso WSL: http://localhost:${PORT} (Windows)`);
});

// Inicializar monitor de saúde
const healthMonitor = new ServerHealthMonitor(server);

// Configurações do servidor para estabilidade e performance
server.keepAliveTimeout = 60000;  // 60 segundos (aumentado)
server.headersTimeout = 65000;    // 65 segundos (deve ser > keepAliveTimeout)
server.requestTimeout = 120000;   // 2 minutos
server.timeout = 300000;          // 5 minutos (para uploads grandes)

// Configurações adicionais para produção
server.maxConnections = 1000;     // Limite de conexões simultâneas
server.maxHeadersCount = 2000;    // Limite de headers por request

// Monitoramento de performance
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.debug('📊 Memory usage:', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    });
  }, 60000); // Log a cada minuto
}

// Graceful shutdown com timeout melhorado
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    logger.warn(`🔄 ${signal} já em processo, forçando saída...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  logger.info(`🛑 ${signal} recebido, iniciando graceful shutdown...`);
  
  // Timeout para forçar shutdown se necessário
  const shutdownTimeout = setTimeout(() => {
    logger.error('⏰ Timeout no graceful shutdown, forçando saída...');
    process.exit(1);
  }, 10000); // 10 segundos para shutdown
  
  server.close((error) => {
    clearTimeout(shutdownTimeout);
    
    if (error) {
      logger.error('❌ Erro durante shutdown:', error);
      process.exit(1);
    }
    
    logger.info('✅ Servidor fechado com sucesso');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Melhor tratamento de recursos e memory leaks
process.on('uncaughtException', (error) => {
  logger.error('💥 Erro não capturado crítico:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚫 Promise rejeitada não tratada:', reason);
  logger.error('🔍 Promise:', promise);
  // Não fazer shutdown automático, apenas log
});

module.exports = app;